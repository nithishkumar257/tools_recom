# AI Brutal Core API (Python)

This backend is a zero-cost **FastAPI (Python)** service that executes the blueprint's Core API + Recommender + Realtime feed foundation.

## Zero Cost Guarantee

This backend can run with zero recurring cost.

- No paid API is required for startup.
- PostgreSQL is optional (local/in-memory fallback exists).
- Supabase Auth is optional for public endpoints, but required for authenticated endpoints.
- Web Push VAPID is optional; when missing, push test runs in simulation mode.

## Run

```bash
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4002
```

Default URL: `http://localhost:4002`

## Implemented Endpoints

- `GET /health`
- `GET /v1/tools`
- `GET /v1/tools/search?q=`
- `GET /v1/tools/trending`
- `GET /v1/tools/new`
- `GET /v1/tools/top?count=10&sortBy=score`
- `GET /v1/tools/:slug`
- `GET /v1/public/tools`
- `GET /v1/public/categories`
- `GET /v1/public/tools/:slug`
- `GET /v1/tools/:slug/reviews`
- `POST /v1/tools/:slug/reviews` (authenticated)
- `GET /v1/analytics/tools/:slug` (authenticated)
- `GET /v1/compare?tools=slug1,slug2` (2-5 tools)
- `POST /v1/tools/submit` (authenticated)
- `GET /v1/bookmarks` (authenticated)
- `POST /v1/bookmarks/{tool_slug}` (authenticated)
- `DELETE /v1/bookmarks/{tool_slug}` (authenticated)
- `GET /v1/collections` (authenticated)
- `POST /v1/collections` (authenticated)
- `DELETE /v1/collections/{collection_id}` (authenticated)
- `POST /v1/collections/{collection_id}/tools/{tool_slug}` (authenticated)
- `DELETE /v1/collections/{collection_id}/tools/{tool_slug}` (authenticated)
- `GET /v1/feed/personalized?limit=10` (authenticated)
- `GET /v1/notifications?limit=10` (authenticated)
- `GET /v1/notifications/subscriptions` (authenticated)
- `POST /v1/notifications/subscriptions` (authenticated)
- `DELETE /v1/notifications/subscriptions` (authenticated)
- `POST /v1/notifications/test` (authenticated)
- `GET /v1/profile/preferences` (authenticated)
- `PUT /v1/profile/preferences` (authenticated)
- `GET /v1/trends/insights?limit=6` (authenticated)
- `GET /v1/categories`
- `GET /v1/categories/:slug/tools`
- `POST /v1/recommend/stack`
- `WS /v1/ws/tools/feed`

`POST /v1/recommend/stack` now also accepts optional `follow_up_answers` object to refine ranking after initial recommendation questions.

## Next Step Implemented (Python Agent Orchestration)

- `POST /v1/admin/agents/trigger`
- `GET /v1/admin/agents/runs`
- `GET /v1/admin/agents/runs/{run_id}`
- `GET /v1/admin/agents/runs/{run_id}/stream`
- `GET /v1/admin/pipeline/status`
- `GET /v1/admin/events?limit=50`
- `GET /v1/admin/events/stream`
- `GET /v1/admin/discovery/status`
- `POST /v1/admin/discovery/trigger`
- `POST /v1/admin/discovery/ingest`
- `POST /v1/admin/discovery/scheduler`
- `GET /v1/admin/evaluation/status`
- `POST /v1/admin/evaluation/refresh`
- `GET /v1/admin/content/status`
- `POST /v1/admin/content/refresh`
- `GET /v1/admin/comparison/status`
- `POST /v1/admin/comparison/matrix`
- `GET /v1/admin/monitoring/status`
- `POST /v1/admin/monitoring/probe`
- `GET /v1/admin/monitoring/alerts?limit=50`
- `GET /v1/admin/cache/status`
- `POST /v1/admin/cache/clear`
- `GET /v1/admin/push/status`
- `GET /v1/admin/push/metrics`
- `GET /v1/admin/push/campaigns?limit=20`
- `GET /v1/admin/push/campaigns/{campaign_id}`
- `GET /v1/admin/push/campaigns/export.csv?limit=100`
- `GET /v1/admin/push/policy/history?limit=50&action=&source=&actor_user_id=`
- `GET /v1/admin/push/policy/history/export.csv?limit=300&action=&source=&actor_user_id=`
- `POST /v1/admin/push/campaign`
- `POST /v1/admin/push/scheduler`
- `POST /v1/admin/push/scheduler/tick`
- `POST /v1/admin/push/policy/auto-resume-lock`

## Realtime client support

- WebSocket feed endpoint `WS /v1/ws/tools/feed` emits `tools.feed.snapshot` events.
- Frontend tools page subscribes to this feed for live showcase updates and realtime connection status.

## Web push groundwork (frontend)

- Frontend now includes a notification service layer (`src/lib/notificationService.js`) and service worker (`public/sw.js`).
- Dashboard includes notification permission enable/test controls.
- Service worker is registered at web app startup (`src/main.jsx`).
- Backend includes push subscription persistence (`push_subscriptions`) and authenticated delivery endpoints.
- When VAPID variables are configured (`WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`), `POST /v1/notifications/test` attempts real web push delivery.
- Stale subscriptions (404/410 responses) are pruned automatically.
- Background delivery worker processes queued push campaigns.
- Admin push APIs provide queue status, delivery metrics, scheduler configuration, and manual scheduler ticks.
- Campaigns below success threshold emit `push.alert.low_success_rate` events.
- Scheduler auto-pauses after configurable consecutive low-success campaigns; manual scheduler re-enable is required to resume.
- Auto-paused state includes cooldown + health-check based resume recommendation fields.
- Backend emits `push.scheduler.resume_recommended` when resume criteria are satisfied.
- Optional controlled auto-resume can re-enable scheduler after configurable consecutive healthy recommendations.
- Governance lock can require explicit admin confirmation before auto-resume is allowed.
- Policy-affecting changes are written to immutable audit history with PostgreSQL persistence when DB is available (in-memory fallback otherwise).
- Policy history APIs support filtering by action, source, and actor user id.

### VAPID setup

Set these backend environment variables:

```bash
WEB_PUSH_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
WEB_PUSH_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
WEB_PUSH_SUBJECT=mailto:admin@example.com
WEB_PUSH_MAX_RETRIES=2
WEB_PUSH_ALERT_SUCCESS_THRESHOLD=60
WEB_PUSH_AUTO_PAUSE_STREAK=3
WEB_PUSH_RESUME_COOLDOWN_MINUTES=30
WEB_PUSH_RESUME_HEALTHY_THRESHOLD=70
WEB_PUSH_RESUME_MIN_CAMPAIGNS=3
WEB_PUSH_AUTO_RESUME_ENABLED=false
WEB_PUSH_AUTO_RESUME_CHECKS=2
WEB_PUSH_AUTO_RESUME_LOCKED=true
```

Set this frontend variable so browser subscription can be created:

```bash
VITE_WEB_PUSH_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
```

## Cross-platform client groundwork

- Web frontend now uses a shared core API module (`src/shared/coreApi.js`) for selected endpoint wrappers.
- This enables future React Native/Tauri clients to reuse the same API contract with minimal adaptation.

## Offline browse mode (web)

- Tools/public catalog endpoints now support client-side cached fallback in the web client.
- When API/network is unavailable, the UI can render recent cached results and marks that state in the tools toolbar.

## Zero-cost scaling optimization

- Added in-memory TTL cache for recommendation, personalized feed, and notifications paths.
- Cache invalidation is triggered on profile preference and bookmark mutations.
- Admin cache status/clear endpoints are available for operational control.

## Authentication ownership

- User sign-up and login are delegated to Supabase.
- This backend does not implement custom signup/login flows.
- Admin orchestration routes require a valid Supabase access token and verify it through Supabase Auth.
- Current mode is simple authenticated access (signed-in Supabase users can access admin orchestration endpoints); stricter authorization can be added later.

## Zero-cost configuration profile

Use this profile for strictly zero-cost local operation:

- Keep `DATABASE_URL` unset to use fallback local/in-memory data paths.
- Keep `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT` unset to keep push in simulation mode.
- Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` only if you need authenticated routes.

### Preflight validator

From repo root, run:

```bash
npm run api:preflight:zerocost
```

The preflight script reports PASS/INFO/WARN for configuration items that affect strict zero-cost operation and exits non-zero when WARN items are present.

## Notes

- If `DATABASE_URL` is set and reachable, endpoints read from PostgreSQL.
- If `DATABASE_URL` is missing/unavailable, service auto-falls back to local in-repo tool data.
- SQL schema and seed files are in `backend/db` for PostgreSQL migration.
- Incremental SQL migrations live in `backend/db/migrations`.
- The telemetry sync table migration is `backend/db/migrations/20260322_add_agent_tool_events.sql`.

## Incremental migration (telemetry sync)

For Supabase SQL Editor, run the SQL from:

- `backend/db/migrations/20260322_add_agent_tool_events.sql`

For local/PostgreSQL CLI:

```bash
psql "$DATABASE_URL" -f backend/db/migrations/20260322_add_agent_tool_events.sql
```

## PostgreSQL bootstrap

1. Create database `aibrutal`.
2. Set `DATABASE_URL` in environment.
3. Run one command:

```bash
py scripts/bootstrap_db.py
```

4. For protected admin routes, also set:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

From repo root:

```bash
npm run api:db:bootstrap
```
