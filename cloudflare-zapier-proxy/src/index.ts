// Cloudflare Worker: Full backend for Balkan Conflict Rules
// Handles Discord OAuth, D1 Database, Appeals, Verdicts, and Zapier forwarding

interface Env {
  DB: D1Database;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  ZAP_URL: string;
}

// Simple router
const router = {
  GET: {} as Record<string, (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>>,
  POST: {} as Record<string, (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>>,
};

function addRoute(method: 'GET' | 'POST', path: string, handler: (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>) {
  router[method][path] = handler;
}

// CORS headers helper
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle OPTIONS preflight
function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// JSON response helper
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

// Error response helper
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Discord OAuth routes
addRoute('GET', '/auth/discord', async (req, env) => {
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', env.DISCORD_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify email');
  return Response.redirect(authUrl.toString(), 302);
});

addRoute('GET', '/auth/discord/callback', async (req, env) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return errorResponse('No code provided', 400);

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) return errorResponse('Failed to exchange code', 500);
    const tokenData = await tokenRes.json() as { access_token: string };
    
    // Get user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) return errorResponse('Failed to get user info', 500);
    const discordUser = await userRes.json() as {
      id: string; username: string; discriminator: string; avatar: string; email?: string;
    };

    // Upsert user in D1
    const existing = await env.DB.prepare('SELECT * FROM users WHERE discord_id = ?').bind(discordUser.id).first();
    let userId;
    if (existing) {
      await env.DB.prepare(
        'UPDATE users SET username = ?, discriminator = ?, avatar = ?, email = ?, updated_at = datetime(\'now\') WHERE discord_id = ?'
      ).bind(discordUser.username, discordUser.discriminator, discordUser.avatar, discordUser.email || null, discordUser.id).run();
      userId = existing.id;
    } else {
      const result = await env.DB.prepare(
        'INSERT INTO users (discord_id, username, discriminator, avatar, email) VALUES (?, ?, ?, ?, ?)'
      ).bind(discordUser.id, discordUser.username, discordUser.discriminator, discordUser.avatar, discordUser.email || null).run();
      userId = result.meta.last_row_id;
    }

    // Create a simple session (base64 encoded user id) - in production use better session management
    const session = btoa(JSON.stringify({ userId, discordId: discordUser.id }));
    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, discordId: discordUser.id, username: discordUser.username, avatar: discordUser.avatar },
    }), {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${session}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (err: any) {
    return errorResponse(`OAuth error: ${err.message}`, 500);
  }
});

addRoute('GET', '/auth/me', async (req, env) => {
  const cookie = req.headers.get('Cookie');
  if (!cookie) return errorResponse('Not authenticated', 401);
  const sessionCookie = cookie.split(';').find(c => c.trim().startsWith('session='));
  if (!sessionCookie) return errorResponse('Not authenticated', 401);
  try {
    const session = JSON.parse(atob(sessionCookie.split('=')[1]));
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.userId).first();
    if (!user) return errorResponse('User not found', 401);
    return jsonResponse({ id: user.id, discordId: user.discord_id, username: user.username, avatar: user.avatar, isAdmin: user.is_admin === 1 });
  } catch {
    return errorResponse('Invalid session', 401);
  }
});

addRoute('POST', '/auth/logout', async () => {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
});

// Appeals routes
addRoute('POST', '/api/appeals', async (req, env) => {
  const zapUrl = env.ZAP_URL;
  if (!zapUrl) return errorResponse('Zapier URL not configured', 503);

  try {
    const body = await req.json() as any;
    const { chatId, title, nickname, faction, contact, category, message } = body;

    if (!title || !nickname || !category || !message) {
      return errorResponse('Missing required fields', 400);
    }

    // If "Аппеляция на наказание", send directly to admin
    if (category === 'Аппеляция на наказание') {
      const zapBody = {
        source: 'balkan-rules-admin',
        chatId, title, nickname, faction, contact, category, message,
        priority: 'high',
        forwardedAt: new Date().toISOString(),
      };
      await fetch(zapUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zapBody),
      });
      return jsonResponse({ ok: true, sentTo: 'admin' });
    }

    // Otherwise save to DB
    const result = await env.DB.prepare(
      'INSERT INTO appeals (chat_id, title, nickname, faction, contact, category, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(chatId, title, nickname, faction || null, contact || null, category, message, 'pending').run();

    return jsonResponse({ ok: true, appealId: result.meta.last_row_id, sentTo: 'review' });
  } catch (err: any) {
    return errorResponse(`Failed to submit appeal: ${err.message}`, 500);
  }
});

addRoute('GET', '/api/appeals', async (req, env) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending';
  try {
    const { results } = await env.DB.prepare('SELECT * FROM appeals WHERE status = ? ORDER BY created_at DESC').bind(status).all();
    return jsonResponse(results);
  } catch (err: any) {
    return errorResponse(`Failed to get appeals: ${err.message}`, 500);
  }
});

// Verdicts routes
addRoute('POST', '/api/appeals/:id/verdicts', async (req, env) => {
  const url = new URL(req.url);
  const appealId = url.pathname.split('/')[3]; // /api/appeals/:id/verdicts
  if (!appealId) return errorResponse('Invalid appeal ID', 400);

  try {
    const body = await req.json() as any;
    const { userId, verdict, reason } = body;
    if (!verdict) return errorResponse('Verdict is required', 400);

    // Insert verdict
    await env.DB.prepare(
      'INSERT INTO verdicts (appeal_id, user_id, verdict, reason) VALUES (?, ?, ?, ?)'
    ).bind(appealId, userId || 0, verdict, reason || null).run();

    // Count verdicts
    const { results: verdicts } = await env.DB.prepare('SELECT * FROM verdicts WHERE appeal_id = ?').bind(appealId).all();
    const verdictsCount = verdicts.length;

    // Update appeal verdicts count
    await env.DB.prepare('UPDATE appeals SET verdicts_count = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(verdictsCount, appealId).run();

    // If 5 verdicts collected, send to Zapier for analysis
    if (verdictsCount >= 5) {
      const appeal = await env.DB.prepare('SELECT * FROM appeals WHERE id = ?').bind(appealId).first();
      if (appeal) {
        const zapBody = {
          source: 'balkan-rules-verdicts',
          appealId: appeal.id,
          title: appeal.title,
          nickname: appeal.nickname,
          faction: appeal.faction,
          category: appeal.category,
          message: appeal.message,
          verdicts: verdicts,
          verdictsCount,
          forwardedAt: new Date().toISOString(),
        };
        await fetch(env.ZAP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zapBody),
        });
        await env.DB.prepare('UPDATE appeals SET status = ?, zapier_sent = 1, zapier_sent_at = datetime(\'now\') WHERE id = ?').bind('sent_to_admin', appealId).run();
      }
    }

    return jsonResponse({ success: true, verdictsCount });
  } catch (err: any) {
    return errorResponse(`Failed to submit verdict: ${err.message}`, 500);
  }
});

addRoute('GET', '/api/appeals/:id/verdicts', async (req, env) => {
  const url = new URL(req.url);
  const appealId = url.pathname.split('/')[3];
  if (!appealId) return errorResponse('Invalid appeal ID', 400);

  try {
    const { results } = await env.DB.prepare('SELECT * FROM verdicts WHERE appeal_id = ?').bind(appealId).all();
    return jsonResponse(results);
  } catch (err: any) {
    return errorResponse(`Failed to get verdicts: ${err.message}`, 500);
  }
});

// Health check
addRoute('GET', '/api/healthz', async () => {
  return jsonResponse({ status: 'ok' });
});

// Main fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Exact match routes
    if (path === '/auth/discord' && request.method === 'GET') {
      return router.GET[path](request, env, ctx);
    }
    if (path === '/auth/discord/callback' && request.method === 'GET') {
      return router.GET[path](request, env, ctx);
    }
    if (path === '/auth/me' && request.method === 'GET') {
      return router.GET[path](request, env, ctx);
    }
    if (path === '/auth/logout' && request.method === 'POST') {
      return router.POST[path](request, env, ctx);
    }
    if (path === '/api/healthz' && request.method === 'GET') {
      return router.GET[path](request, env, ctx);
    }

    // Appeals routes
    if (path === '/api/appeals' && request.method === 'POST') {
      return router.POST['/api/appeals'](request, env, ctx);
    }
    if (path === '/api/appeals' && request.method === 'GET') {
      return router.GET['/api/appeals'](request, env, ctx);
    }

    // Verdicts routes (dynamic)
    const verdictMatch = path.match(/^\/api\/appeals\/(\d+)\/verdicts$/);
    if (verdictMatch) {
      if (request.method === 'POST') {
        return router.POST['/api/appeals/:id/verdicts'](request, env, ctx);
      }
      if (request.method === 'GET') {
        return router.GET['/api/appeals/:id/verdicts'](request, env, ctx);
      }
    }

    return errorResponse('Not found', 404);
  }
};
