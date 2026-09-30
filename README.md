# FORGE30 — SHARIF TECHNOLOGIES Developer Forge

30 days • 60 hours • build for real. Landing page, multi-step application, applicant status lookup and admin area.

**Stack:** Next.js 15 (App Router) · TypeScript · Postgres (`pg`) · Zod. Plain CSS, no animation/UI libraries.
The logo is the official SharifTech mark in `public/brand/` (used unmodified; `src/app/icon.png` / `apple-icon.png` are resized copies).

## Run locally
```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL, ADMIN_PASSWORD (12+ chars), SESSION_SECRET (openssl rand -base64 32)
npm run dev                    # http://localhost:3000   (tables are created automatically on first request)
```
Any Postgres works locally, e.g. `docker run -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres:16`.

## Test
```bash
npm run typecheck && npm test                      # schema/validation unit tests
npm run build && APPLY_RATE_LIMIT=1000 npm start   # in one terminal (raise limit only for tests)
BASE=http://localhost:3000 ADMIN_PASSWORD=... npm run test:e2e       # API, security and admin tests
npm run test:browser                               # 6 viewports, every interactive component (needs Chromium)
ADMIN_PASSWORD=... npm run test:journey            # full applicant + admin journey on a phone viewport
```

## Deploy (Vercel + custom subdomain)
1. Push the repo to GitHub, **Import** it in Vercel (framework auto-detected, default build settings).
2. Add a Postgres database (Vercel **Storage → Neon**, or any provider) — this sets `DATABASE_URL`.
3. Set environment variables: `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL` (e.g. `https://forge30.yourdomain.com`).
4. **Settings → Domains**: add `forge30.yourdomain.com`, then create the CNAME record Vercel shows at your DNS provider.
5. Deploy. Open `/admin/login`, sign in, and control applications open/closed under **Cohort & settings**.

## Security notes
Server-side Zod validation on every endpoint, parameterised SQL only, Origin check on every state-changing route (plus `SameSite=Strict` admin cookie), DB-backed rate limits (apply, status lookup, login, events), signed HttpOnly 8-hour admin session, constant-time password comparison, CSV formula-injection neutralisation, audit log of admin actions, `noindex` + `no-store` on admin, security headers. Admin notes are never returned by any public route.
