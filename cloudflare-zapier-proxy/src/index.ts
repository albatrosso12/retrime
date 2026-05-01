// Cloudflare Worker (modules format): forwards requests to a Zapier Webhook URL.
// Usage: call the deployed Worker with a query parameter zap_url (e.g. ?zap_url=https://hooks.zapier.com/hooks/c/...)
// If zap_url is not provided, the Worker responds with 400.

export default {
  async fetch(request: Request): Promise<Response> {
    return handleRequest(request);
  }
};

async function handleRequest(request: Request): Promise<Response> {
  // Extract Zapier URL from query parameter zap_url or fall back to env binding if provided (not required here)
  const zapUrl = getZapUrlFromRequest(request);
  if (!zapUrl) {
    const msg = 'Zapier URL not provided. Append ?zap_url=YOUR_ZAP_URL to the request URL.';
    return new Response(msg, { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    // Forward the incoming request to Zapier
    const forwardInit: RequestInit = {
      method: request.method,
      headers: new Headers(request.headers),
      // Forward body for non-GET/HEAD requests
      body: (request.method === 'GET' || request.method === 'HEAD') ? null : await request.clone().arrayBuffer()
    };

    // If there is no body, ensure we don't send a null body for GET/HEAD
    if (request.method === 'GET' || request.method === 'HEAD') {
      forwardInit.body = undefined;
    }

    const zapResp = await fetch(zapUrl, forwardInit);
    // Return Zapier's response as-is
    return zapResp;
  } catch (err: any) {
    return new Response('Error forwarding to Zapier: ' + String(err.message || err), {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

function getZapUrlFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    // Accept zap_url as query parameter; you can also wire env vars later if needed
    return url.searchParams.get('zap_url') || url.searchParams.get('zapier_url');
  } catch {
    return null;
  }
}
