# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**Government Data API:**
- data.gov.in - Mandi price data from Ministry of Agriculture
  - SDK/Client: `httpx` with custom wrapper in `backend/app/integrations/data_gov_client.py`
  - Auth: `DATA_GOV_API_KEY` env var
  - Endpoint: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
  - Resource ID: `9ef84268-d588-465a-a308-a864a43d0070` (mandi price dataset)
  - Polling: Automatic via APScheduler (configurable 6-hour default interval)
  - Pagination: 1000 records per request with offset support
  - Retry Logic: Exponential backoff (3 retries, 2s * attempt delay)
  - Timeout: 120 seconds for large responses

## Data Storage

**Databases:**
- PostgreSQL 12+
  - Connection: `DATABASE_URL` env var (`postgresql+psycopg://user:pass@host:port/db`)
  - Driver: `psycopg[binary]` 3.2.3 (async-compatible)
  - ORM: SQLAlchemy 2.0.46 (mapped_column style)
  - Pool: Configurable size (default 5) and overflow (default 10)
  - Migrations: Alembic 1.18.1 for schema versioning
  - Key Tables: `user`, `price_history` (25M+ rows), `commodity`, `mandi`, `otp_request`, `refresh_token`, `community_post`, `price_forecast`, `inventory`

**File Storage:**
- Local filesystem only
  - Parquet data: `agmarknet_daily_10yr.parquet` at repo root (159MB, 25M rows)
  - Log files: `backend/logs/` directory (retention: 30 days configurable)
  - Migrations: `backend/alembic/versions/` (version control via git)

**Caching:**
- Redis (optional, recommended)
  - Connection: `REDIS_URL` env var (e.g., `redis://localhost:6379`)
  - Purpose: Distributed rate limiting (via `limits` library), session storage
  - Fallback: In-memory rate limiting if Redis not configured

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based with OTP
  - Implementation: `backend/app/auth/security.py` and `backend/app/auth/service.py`
  - JWT Generation: HS256 algorithm, 24-hour default expiration (configurable)
  - JWT Claims: `sub` (user ID), `role` (farmer/admin), `iss` (agriprofit-api), `aud` (agriprofit-app), `iat`, `exp`
  - Token Validation: Issuer and audience verification
  - Refresh Tokens: Stored in database with expiration (30 days), device tracking, revocation support
  - Bearer Token Delivery: HTTP Authorization header with "Bearer <token>"

**OTP-Based Login Flow:**
1. User requests OTP via phone number
2. OTP generated (6 digits default, configurable 4-8)
3. OTP sent via SMS provider or logged in dev mode
4. User verifies OTP (5-minute expiration default)
5. On success: Access token + refresh token issued
6. Cooldown: 60 seconds between OTP requests (configurable)

**SMS Providers (for OTP delivery):**
- Fast2SMS (India-focused)
  - Auth: `FAST2SMS_API_KEY` env var
  - Implementation stub: `backend/app/auth/service.py::send_otp_sms()`
  - Status: Stub only (always returns True, doesn't send actual SMS in current implementation)
- Twilio (International)
  - Auth: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` env vars
  - Status: Configured but not integrated yet
- Test OTP Mode (Development)
  - Env: `TEST_OTP=123456`, `ENABLE_TEST_OTP=true`
  - Bypasses actual SMS in development for testing

## Monitoring & Observability

**Error Tracking:**
- Sentry (optional, recommended for production)
  - Connection: `SENTRY_DSN` env var
  - Status: Configuration available but not implemented in code yet
  - Purpose: Unhandled exception tracking, performance monitoring

**Logs:**
- Structured JSON logging via `python-json-logger`
  - Output: File-based at `backend/logs/` with retention (30 days default)
  - Format: JSON (configurable via `LOG_JSON_FORMAT`)
  - Level: Configurable via `LOG_LEVEL` env var (default INFO)
  - Console: Also writes to stdout

**Request Monitoring:**
- Performance: API client in `frontend/src/lib/api.ts` includes response time logging
- Rate Limiting: slowapi + limits library with per-endpoint tiers:
  - Critical (auth endpoints): 5 requests/minute
  - Write operations: 30 requests/minute
  - Read operations: 100 requests/minute
  - Analytics: 50 requests/minute

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase
- Supports Docker (docker-compose.prod.yml present)
- Backend: Uvicorn ASGI server (production-ready)
- Frontend: Next.js built for static export or Node.js server

**CI Pipeline:**
- Not configured (no GitHub Actions, GitLab CI, etc. detected)
- Test execution: Manual via pytest and vitest

**Docker:**
- Compose file: `backend/docker-compose.prod.yml` (available but not primary)
- No Dockerfile in repo root

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (only required var)
- `JWT_SECRET_KEY` - Min 8 chars dev, 32+ chars production
- `DATA_GOV_API_KEY` - For data sync (required if sync enabled)

**Recommended env vars:**
- `REDIS_URL` - For distributed rate limiting in production
- `SENTRY_DSN` - For error tracking in production
- `ENVIRONMENT` - Set to "production" in prod
- SMS provider keys if using OTP SMS delivery

**Secrets location:**
- Backend: `.env` file in `backend/` directory (git-ignored)
- Template: `backend/.env.example`, `backend/.env.development`, `backend/.env.staging`, `backend/.env.production`
- Frontend: `.env.local` file (git-ignored)
- Template: `frontend/.env.example`
- Mobile: `.env` file (git-ignored)
- Template: `mobile/.env.example`

**Security Notes:**
- `.env` files are git-ignored and contain sensitive data
- No secrets hardcoded in source (test OTP has defaults but marked for dev-only)
- JWT key validation enforces 32+ chars in production
- CORS origins should be specific in production (not wildcard)
- HTTPS redirect can be enabled via `HTTPS_REDIRECT=true`

## Webhooks & Callbacks

**Incoming:**
- None detected in codebase

**Outgoing:**
- Data.gov.in API (polling-based, not webhook)
- No outbound webhook implementations found

## Frontend-Backend Integration

**API Communication:**
- Base URL: Frontend/mobile must point to backend at `/api/v1` suffix
- Client: `frontend/src/lib/api.ts` - axios with baseURL, auth interceptor, perf logging
- Header: `Authorization: Bearer <token>` required for protected endpoints
- Response: Standard JSON format with typed models

**CORS Configuration:**
- Configured in: `backend/app/core/config.py`
- Default Origins: `http://localhost:3000`, `http://127.0.0.1:3000`
- Credentials: Allowed by default
- Production: Must specify exact origins (never use wildcard with credentials)

## Data Sync Infrastructure

**Data Sync Service:**
- Module: `backend/app/integrations/data_sync.py` (DataSyncService singleton)
- Trigger: Automatic via APScheduler on schedule, or manual via CLI
- CLI: `backend/scripts/sync_now.py` - Manual trigger script
- Endpoint: `GET /sync/status` - Check sync status
- Status Tracking: In-memory status with thread-safe operations

**Data Flow:**
1. Scheduler triggers sync every N hours (configurable)
2. DataGovClient fetches records with pagination (1000 per request)
3. DatabaseSeeder upserts records into price_history table
4. Unique constraint: `(commodity_id, mandi_name, price_date)` prevents duplicates
5. Normalization: Prices < 200 multiplied by 100 (kg→quintal conversion)

**Status Endpoint Response:**
- `GET /sync/status` returns JSON with last_sync_time, status (running/idle/failed), records_count, duration

---

*Integration audit: 2026-02-23*
