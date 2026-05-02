// Cloudflare Workers Edge Auth Gateway (Mock IdP + Complaints API)
// Note: This is a minimal, mock implementation intended as a safe starting scaffold.
// In production, replace the mock IdP with a real OAuth2/OIDC provider and secure storage.

type User = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

type Session = {
  sid: string;
  user: User;
};

type Complaint = {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
};

// Helpers
function encodeCookie(name: string, value: string, maxAgeSeconds = 3600) {
  const s = `${name}=${value}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
  return s;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  cookieHeader.split(';').forEach((c) => {
    const [k, v] = c.trim().split('=');
    if (k && v) map[k] = v;
  });
  return map;
}

function json(resBody: unknown, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function html(htmlBody: string, status = 200) {
  return new Response(htmlBody, {
    status,
    headers: { 'Content-Type': 'text/html' },
  });
}

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
}

// In-memory-like session map via KV is simulated here through env bindings
// For debugging only; in production we rely on KV (env.SESSIONS or similar)

// Entry point
export interface Env {
  COMPLAINTS_KV: KVNamespace;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const cookies = parseCookies(req.headers.get('cookie') || '');

    // Simple login flow with mock IdP at /login and /mock-idp/* endpoints
    if (path === '/login' || path === '/auth/login') {
      // Redirect to mock IdP authorize
      const state = uid('st');
      const redirectUri = encodeURIComponent('/auth/callback');
      const redirect = `/mock-idp/authorize?state=${state}&redirect_uri=${redirectUri}`;
      return Response.redirect(redirect, 302);
    }

    if (path.startsWith('/mock-idp/authorize')) {
      // Simple login page; in real case, redirect to IdP login
      const htmlBody = `<!doctype html><html><body><h3>Mock IdP</h3><form action="/mock-idp/token" method="POST"><input name="code" value="demo-code" hidden/><button type="submit">Login (Mock)</button></form></body></html>`;
      return html(htmlBody, 200);
    }

    if (path.startsWith('/mock-idp/token')) {
      // Simulate token grant response for code=demo-code
      // In real life, this would be a POST to /token with code, client_id, etc.
      const tok = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: Buffer.from(JSON.stringify({ sub: 'user123', name: 'Demo User', email: 'demo@example.com' })).toString('base64'),
      };
      return json(tok);
    }

    if (path === '/auth/callback') {
      // In real flow, exchange code for tokens then establish session
      // We'll assume we received a valid id_token via the mock IdP
      const sid = uid('sess');
      const user: User = { id: 'user123', email: 'demo@example.com', name: 'Demo User', roles: ['user'] };
      const session: Session = { sid, user };

      // Persist session in KV (we use a simplistic approach with a composite key)
      const sessKey = `sess:${sid}`;
      await env.COMPLAINTS_KV.put(sessKey, JSON.stringify(session), { expirationTtl: 3600 * 24 });

      const cookie = encodeCookie('sess_id', sid, 60 * 60 * 24);
      const res = Response.redirect('/dashboard', 302);
      res.headers.set('Set-Cookie', cookie);
      return res;
    }

    // Protected API proxy: require authentication
    const sessCookie = cookies['sess_id'];
    if (!sessCookie) {
      // Not authenticated; redirect to login
      return Response.redirect('/login', 302);
    }

    // Load session
    const sessRaw = await env.COMPLAINTS_KV.get(`sess:${sessCookie}`);
    if (!sessRaw) {
      return Response.redirect('/login', 302);
    }
    const session: Session = JSON.parse(sessRaw);

    // Simple router for complaints API
    if (path === '/api/complaints' && req.method === 'GET') {
      // List complaints for the logged-in user
      const userId = session.user.id;
      const listRaw = await env.COMPLAINTS_KV.get(`complaints:${userId}`);
      const list: string[] = listRaw ? JSON.parse(listRaw) : [];
      // Fetch details
      const complaints: Complaint[] = [];
      for (const cid of list) {
        const rec = await env.COMPLAINTS_KV.get(`complaint:${cid}`);
        if (rec) complaints.push(JSON.parse(rec));
      }
      return json({ complaints }, 200);
    }

    if (path === '/api/complaints' && req.method === 'POST') {
      const body = await req.json<{ title: string; description: string }>();
      const userId = session.user.id;
      const cid = uid('cmp');
      const comp: Complaint = {
        id: cid,
        userId,
        title: body.title,
        description: body.description,
        createdAt: nowISO(),
      };
      await env.COMPLAINTS_KV.put(`complaint:${cid}`, JSON.stringify(comp));
      // Update index list for user
      const listRaw = await env.COMPLAINTS_KV.get(`complaints:${userId}`);
      const list: string[] = listRaw ? JSON.parse(listRaw) : [];
      list.push(cid);
      await env.COMPLAINTS_KV.put(`complaints:${userId}`, JSON.stringify(list));
      return json({ ok: true, complaint: comp }, 201);
    }

    if (path.startsWith('/api/complaints/') && req.method === 'GET') {
      const cid = path.split('/').pop() as string;
      const rec = await env.COMPLAINTS_KV.get(`complaint:${cid}`);
      if (!rec) return json({ error: 'Not found' }, 404);
      const comp: Complaint = JSON.parse(rec);
      // Ensure owner
      if (comp.userId !== session.user.id) return json({ error: 'Forbidden' }, 403);
      return json({ complaint: comp }, 200);
    }

    // Dashboard root for quick test
    if (path === '/dashboard') {
      return html(`<!doctype html><html><body><h1>Dashboard</h1><p>Welcome, ${session.user.name}</p><p><a href="/api/complaints">View your complaints</a></p></body></html>`);
    }

    // Default: 404
    return json({ error: 'Not Found' }, 404);
  },
};
