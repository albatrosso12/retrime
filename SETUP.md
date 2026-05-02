# Balkan Conflict Rules - Setup Guide (Updated Architecture)

## New Architecture

```
Frontend (Cloudflare Pages) ←→ Cloudflare Worker (Full Backend)
                                     ↓
                                Cloudflare D1 (SQLite)
                                     ↓
                                Zapier → RCON
```

**The Worker now handles:**
- Discord OAuth
- Database (D1)
- Appeal submission
- Verdict system
- Forwarding to Zapier

## Environment Variables

### Cloudflare Worker (`cloudflare-zapier-proxy/wrangler.toml`)

Set via `wrangler secret put` for production:
```bash
wrangler secret put DISCORD_CLIENT_ID
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put DISCORD_REDIRECT_URI
wrangler secret put ZAP_URL
```

Or set in `wrangler.toml` for local dev (not recommended for secrets).

### Frontend (`artifacts/rules/.env` or Cloudflare Pages environment)

```
VITE_API_URL=https://retrime.korsetov2009.workers.dev
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_REDIRECT_URI=https://retrime.korsetov2009.workers.dev/auth/discord/callback
```

## Discord OAuth Setup

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to "OAuth2" → "General"
4. Add redirect URL: `https://retrime.korsetov2009.workers.dev/auth/discord/callback`
5. Copy Client ID and Client Secret to your Worker secrets

## Database Setup (Cloudflare D1)

1. Create D1 database:
   ```bash
   cd cloudflare-zapier-proxy
   wrangler d1 create balkan-rules-db
   ```

2. Copy the database_id from output and update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "balkan-rules-db"
   database_id = "copy-paste-id-here"
   ```

3. Run schema:
   ```bash
   wrangler d1 execute balkan-rules-db --local --file=./schema.sql
   ```

4. For production:
   ```bash
   wrangler d1 execute balkan-rules-db --remote --file=./schema.sql
   ```

## Deployment

### Worker (Full Backend)
```bash
cd cloudflare-zapier-proxy
wrangler publish
```

### Frontend (Cloudflare Pages)
- Build command: `cd ../.. && pnpm --filter rules build`
- Build output directory: `artifacts/rules/dist/public`
- Add environment variables in Pages settings

## Features Implemented

1. ✅ Discord OAuth (handled by Worker)
2. ✅ Appeal submission with categories
3. ✅ "Аппеляция на наказание" goes directly to admins via Zapier
4. ✅ Review Appeals page (`/review`)
5. ✅ Verdict system (guilty, not_guilty, insufficient_evidence)
6. ✅ When 5 verdicts collected → send to Zapier for analysis → RCON punishment
7. ✅ User roles (admin vs regular player)
8. ✅ D1 Database (no external PostgreSQL needed)

## Flow

1. User clicks "Login with Discord" → redirects to Worker `/auth/discord`
2. Worker handles OAuth, creates/updates user in D1, sets session cookie
3. User submits appeal → saved to D1 with status "pending"
4. Other players review appeals at `/review` (fetch from Worker `/api/appeals`)
5. Players submit verdicts → saved to D1
6. When 5 verdicts collected → Worker sends to Zapier for analysis → RCON punishment
7. "Аппеляция на наказание" bypasses verdict system → sent directly to admins via Zapier

## Removed

- ❌ `artifacts/api-server` (Express) - no longer needed
- ❌ PostgreSQL dependency - replaced with Cloudflare D1
- ❌ External API server hosting - Worker handles everything
