# Zapier proxy Cloudflare Worker

- Purpose: intercepts requests from your site and forwards them to a Zapier API URL.
- Usage: deploy as a Cloudflare Worker (wrangler). Pass the Zapier URL via query parameter zap_url, e.g.:
  https://your-worker-domain.workers.dev/?zap_url=https://hooks.zapier.com/hooks/c/123456/abcd
- Security: the Zapier URL is exposed in the query string. If you need to keep it private, switch to env bindings (wrangler vars) and read from env in code.

Minimal notes:
- This forwards all request properties (method, headers, and body for non-GET/HEAD) to the Zapier URL.
- It returns Zapier's response directly to the client.

How to run locally (optional):
- Install wrangler and login to Cloudflare.
- In this folder, set up your wrangler.toml, then run wrangler dev to test locally.
