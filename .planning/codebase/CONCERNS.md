# Codebase Concerns

**Analysis Date:** 2025-02-23

## Tech Debt

**Large transport service with hardcoded district coordinates:**
- Issue: `backend/app/transport/service.py` (1357 lines) contains a massive DISTRICT_COORDINATES dictionary with 200+ hardcoded district entries across all Indian states. This is brittle and difficult to maintain.
- Files: `backend/app/transport/service.py` (lines 61-300+)
- Impact: Adding/updating districts requires code changes; coordinates are static and won't reflect boundary changes; makes testing difficult; service is monolithic and hard to refactor
- Fix approach: Extract coordinates to database table or external JSON file; load at startup; allow admin updates without code deploy

**Test OTP enabled in development:**
- Issue: `backend/app/core/config.py` (line 144-151) defines `test_otp = "123456"` and `enable_test_otp = True` with default values. While guarded by `is_development` check in `backend/app/auth/service.py` (line 126-130), this is a security anti-pattern.
- Files: `backend/app/core/config.py`, `backend/app/auth/service.py` (line 126-131)
- Impact: If environment detection fails or defaults are used incorrectly, test OTP could work in production; easy to forget disabling in deployments; should fail-safe
- Fix approach: Default both to False/None; require explicit env var to enable; add pre-deploy validation in `validate_production_settings()`

**Large page components without composition:**
- Issue: Frontend pages like `frontend/src/app/community/page.tsx` (1283 lines), `frontend/src/app/analytics/page.tsx` (1025 lines), and `frontend/src/app/admin/page.tsx` (904 lines) are monolithic. No sub-component extraction despite containing multiple features (posts, replies, moderation, filtering, pagination).
- Files: `frontend/src/app/community/page.tsx`, `frontend/src/app/analytics/page.tsx`, `frontend/src/app/admin/page.tsx`
- Impact: Harder to test in isolation; state management scattered throughout; difficult to reuse features; performance suffers from re-rendering large components
- Fix approach: Extract PostList, CommentThread, FilterBar, etc. as separate components; move state to custom hooks; add React.memo for list items

**Complex auth routes file:**
- Issue: `backend/app/auth/routes.py` (729 lines) handles OTP request, verification, refresh tokens, logout, and multiple edge cases in a single file with deeply nested logic
- Files: `backend/app/auth/routes.py`
- Impact: Hard to test individual flows; complex error handling scattered; difficult to add new auth methods; high cognitive load for modifications
- Fix approach: Extract helpers for each flow (request_otp_flow, verify_otp_flow, refresh_flow); use smaller handler functions; add dedicated exception handlers

## Known Bugs

**Price history query N+1 on commodity relationships:**
- Issue: `backend/app/prices/service.py` queries PriceHistory without eager loading commodity relationship. Accessing `price.commodity` in loops triggers additional queries.
- Symptoms: Slow queries when fetching price lists with commodity details; N+1 query problem visible in database logs
- Files: `backend/app/prices/service.py` (lines 43-92)
- Trigger: Calling get_all() or get_by_commodity() then iterating to access commodity details
- Workaround: Manually add `.options(joinedload(PriceHistory.commodity))` in service methods before returning

**Mandi relationship nullable but name required:**
- Issue: `backend/app/models/price_history.py` (lines 47-56) defines `mandi_id` as nullable but `mandi_name` as required. Data sync may create records with stale mandi_name if mandi_id doesn't exist.
- Symptoms: Orphaned price records with invalid mandi references; difficulty matching prices to actual mandis; reports show "Unknown Mandi" entries
- Files: `backend/app/models/price_history.py`, `backend/app/integrations/seeder.py` (lines 170-210)
- Trigger: API returns market/mandi names not matching existing database entries
- Workaround: Query by mandi_name and handle null mandi_id in UI; add data validation script to audit mismatches

**Missing database connection pooling in error scenarios:**
- Issue: `backend/app/database/session.py` uses default SQLAlchemy pooling. Under high load or with slow queries, connection leaks can occur if queries timeout or database connection dies.
- Symptoms: "pool size exceeded" errors; connections hang indefinitely; application becomes unresponsive
- Files: `backend/app/database/session.py` (lines 9-15)
- Trigger: Load spike + slow query (e.g., price_history scans without date filter)
- Workaround: Manually set lower pool_size in config; monitor connection count; restart application

**Frontend localStorage access without error handling:**
- Issue: `frontend/src/app/community/page.tsx` (lines 77-89) and other pages directly access localStorage for user/token without try-catch. Can throw on SSR or private browsing.
- Symptoms: Components crash during SSR; errors in private/incognito mode; race conditions on page reload
- Files: `frontend/src/app/community/page.tsx`, `frontend/src/lib/api.ts`, multiple pages
- Trigger: SSR phase in Next.js App Router; user in private browsing mode
- Workaround: Add `typeof window !== 'undefined'` checks (partially done); wrap all localStorage calls in error boundaries

## Security Considerations

**JWT secret key relaxed validation in development:**
- Risk: `backend/app/core/config.py` (line 94) sets `min_length=8` for development but production needs 32+ chars. If a developer accidentally commits dev config, short keys are accepted.
- Files: `backend/app/core/config.py` (lines 92-96, 414-418)
- Current mitigation: `validate_production_settings()` warns on deploy; pre-commit hooks (if configured)
- Recommendations: Enforce minimum 32 chars always (not relaxed in dev); make validation stricter; add pre-commit hook to catch defaults

**CORS wildcard allowed in development:**
- Risk: `backend/app/core/config.py` (default line 185) sets `cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]` but parser accepts "*". Misconfiguration easy.
- Files: `backend/app/core/config.py` (lines 184-187, 325-333, 421-422)
- Current mitigation: `validate_production_settings()` warns if "*" detected in production
- Recommendations: Remove "*" from defaults; use explicit whitelist only; validate on startup

**Admin role not segregated by resource:**
- Risk: `backend/app/admin/routes.py` uses simple `require_role("admin")` check. All admins can perform all actions (ban users, delete posts, modify prices, etc.).
- Files: `backend/app/admin/routes.py`, `backend/app/auth/security.py` (lines 146-158)
- Current mitigation: Single admin account per deployment; logging of admin actions
- Recommendations: Implement fine-grained permissions (can_ban_users, can_edit_prices); audit log all admin actions with reason; separate admin roles (content_moderator, data_admin)

**Test OTP hardcoded default:**
- Risk: `backend/app/core/config.py` (lines 143-145) has test_otp="123456" by default, but guarded by enable_test_otp and is_development
- Files: `backend/app/core/config.py`, `backend/app/auth/service.py`
- Current mitigation: Guarded by environment and flag checks in service
- Recommendations: Change default to None; refuse startup if enable_test_otp=True in production; add explicit test mode flag separate from environment

**SMS provider integration missing validation:**
- Risk: `backend/app/auth/service.py` (lines 15-20) has SMS stub that always returns True. SMS provider config is optional (`fast2sms_api_key`, `twilio_auth_token`).
- Files: `backend/app/auth/service.py`, `backend/app/core/config.py` (lines 156-179)
- Current mitigation: Development/staging can work without SMS; production requires explicit config
- Recommendations: Require SMS provider in production; validate credentials on startup; raise error if OTP requested but SMS unavailable

## Performance Bottlenecks

**Price history queries without date bounds:**
- Problem: `backend/app/prices/service.py` (lines 76-92, 94-100) methods accept date filters but don't require them. Queries on 25M-row table without date filter timeout (60+ seconds).
- Files: `backend/app/prices/service.py`, `backend/app/transport/service.py` (queries price history for comparisons)
- Cause: No composite indexes on (commodity, date) without date filter; full table scans; database planner chooses inefficient plans
- Improvement path: Make date_range mandatory parameter; add runtime check to reject queries without date bounds; use EXPLAIN ANALYZE to verify indexes used; consider materialized views for common date ranges

**Window functions on large tables:**
- Problem: Previously used LAG, FIRST_VALUE, LAST_VALUE on price_history without date bounds. Causes 60+ second queries.
- Files: `backend/app/prices/service.py` (commented out), `backend/app/analytics/service.py` (potential issue)
- Cause: Window functions scan entire partition without pruning; no way to apply date filter efficiently
- Improvement path: Use DISTINCT ON with ORDER BY date DESC; implement LEFT JOIN LATERAL pattern; add MATERIALIZED VIEW for latest prices per commodity

**Analytics queries aggregating full table:**
- Problem: `backend/app/analytics/service.py` has aggregation queries that may scan price_history without optimal date filtering
- Files: `backend/app/analytics/service.py` (lines 1-100+)
- Cause: Aggregations for charts need flexible date ranges; not all queries are optimized for current indexes
- Improvement path: Create specialized materialized views for common aggregations (daily/weekly/monthly); add query timeout enforcement; cache analytics results

**Transport comparison calculates distances for all mandis:**
- Problem: `backend/app/transport/service.py` compares user location to all mandis, calculating distances and costs for each. With 200+ mandis, this is CPU-intensive.
- Files: `backend/app/transport/service.py` (lines 200+, distance calculation loops)
- Cause: Haversine formula applied to all mandis per request; no spatial indexing; no caching
- Improvement path: Add PostGIS spatial indexes; implement nearest-neighbor queries; cache mandi coordinates in memory; limit results to closest 10-20 mandis

**API client timeout of 120 seconds:**
- Problem: `backend/app/integrations/data_gov_client.py` (line 43) sets httpx timeout to 120 seconds. This blocks other requests for 2+ minutes.
- Files: `backend/app/integrations/data_gov_client.py`
- Cause: data.gov.in API can be slow; no request-level timeout strategy
- Improvement path: Reduce timeout to 30s; add exponential backoff with shorter tries; implement circuit breaker; queue large fetches as background job

## Fragile Areas

**Data sync scheduler interaction with state:**
- Files: `backend/app/integrations/data_sync.py`, `backend/app/integrations/scheduler.py`
- Why fragile: DataSyncService is a singleton with mutable state (current_status, last_sync). If scheduler crashes or database connection fails mid-sync, state becomes stale. Manual sync_now.py might run concurrently.
- Safe modification: Add status cleanup on startup; ensure lock is released on exception; test concurrent access thoroughly; add timeout to prevent indefinite RUNNING state
- Test coverage: No tests for concurrent sync attempts; state recovery not tested

**Mandi geocoding cache never invalidates:**
- Files: `backend/app/core/geocoding.py`, `backend/app/integrations/geocoding.py`
- Why fragile: If mandi locations change or are corrected, cached coordinates are stale
- Safe modification: Add TTL to geocoding cache; implement manual invalidation endpoint; log cache hits/misses
- Test coverage: Cache not tested; invalidation logic missing

**Community post moderation without audit trail:**
- Files: `backend/app/community/routes.py`, `backend/app/admin/routes.py`
- Why fragile: Deleting posts or flagging content doesn't record reason or who deleted; hard to troubleshoot moderation disputes
- Safe modification: Add AdminAction logging for all moderation; require reason parameter; make deletion soft-delete with archived flag
- Test coverage: Moderation flows not tested; audit trail missing

**Frontend API error handling incomplete:**
- Files: `frontend/src/lib/api.ts` (lines 46-59), `frontend/src/app/community/page.tsx` (error handling in loops)
- Why fragile: 401 redirects to /login but other errors silently rejected; no retry logic; request timeouts not handled
- Safe modification: Add generic error boundaries; implement retry with exponential backoff; log all API errors; notify user of network issues
- Test coverage: Error scenarios not tested; recovery flows not covered

## Scaling Limits

**Database connection pool (5-15 connections):**
- Current capacity: Default pool_size=5, max_overflow=10 = 15 total connections
- Limit: ~50-100 concurrent requests (assuming 0.5-2s per request). Beyond this, queue builds and timeouts increase.
- Scaling path: Increase pool_size to 20-50 (depends on memory); implement connection pooling proxy (PgBouncer); use read replicas for analytics

**Data sync pagination with 1-second delays:**
- Current capacity: data.gov.in API returns 1000 records per page. With 1s delay between pages, fetching 100k records takes ~100 seconds.
- Limit: Total dataset is ~500k+ records. Full sync can take 10+ minutes, blocking other operations if not in background.
- Scaling path: Implement parallel fetch (3-5 concurrent requests with rate limit awareness); use delta sync (only fetch updated records since last run); batch upserts

**Transport comparison generating new distances per request:**
- Current capacity: Haversine calculations for 200 mandis × (district, commodity options) = 1000+ calculations per request
- Limit: Slow on older devices; 1-3 second response time; backend CPU-bound
- Scaling path: Pre-calculate and cache distance matrix; use geospatial database queries; implement client-side caching; reduce mandi list to top 20 by default

**Analytics materialized views not refreshed concurrently:**
- Current capacity: Analytics can only refresh one view at a time (serial refresh); 100+ records in price_history added per hour means views become stale
- Limit: Views may be hours out of date during high-sync periods; reporting is unreliable
- Scaling path: Refresh views asynchronously on schedule; implement incremental view updates; cache common queries in Redis; use time-series database for analytics

## Dependencies at Risk

**APScheduler for background job scheduling:**
- Risk: APScheduler with in-memory store (no persistence). If server restarts, scheduled jobs are lost. No failover or clustering.
- Files: `backend/app/integrations/scheduler.py`
- Impact: Scheduled price syncs won't run if process dies; users don't get notifications
- Migration plan: Switch to Celery + Redis for distributed task queue; implement job persistence; add job retry logic

**data.gov.in API availability:**
- Risk: Single external dependency for price data. API can be slow (120s timeouts), down, or change schema without notice.
- Files: `backend/app/integrations/data_gov_client.py`, `backend/app/integrations/seeder.py`
- Impact: Data sync fails silently; stale prices served to users; no fallback data source
- Migration plan: Implement fallback to cached data; add alternative data sources (state agriculture departments); cache API responses; implement circuit breaker

**httpx client not using connection pooling by default in all scenarios:**
- Risk: `backend/app/integrations/data_gov_client.py` creates httpx.Client but doesn't configure pool size or reuse. May create new connections per request.
- Files: `backend/app/integrations/data_gov_client.py` (line 43)
- Impact: Connection exhaustion against data.gov.in API; slow requests; potential IP blocking
- Migration plan: Configure httpx with persistent connection pool; add connection timeouts; implement proper cleanup (context manager)

## Missing Critical Features

**No analytics export/download:**
- Problem: Users can view analytics but can't export data (CSV, PDF, charts). Farmers need this for planning.
- Blocks: Data-driven farm management; sharing reports with advisors; record-keeping
- Implementation: Add endpoints for CSV export with date range filtering; implement chart-as-image generation; add scheduled report emails

**No price alert webhooks or email notifications:**
- Problem: Price alerts only via in-app notifications. Users miss updates if they don't visit app.
- Blocks: Farmers making timely selling decisions; app engagement suffers
- Implementation: Add email and SMS notification providers; implement webhook support; add notification scheduling

**No multi-language support despite internationalization setup:**
- Problem: `backend/app/models/user.py` tracks language preference but frontend/backend don't use it. Only English UI exists.
- Blocks: Regional expansion; farmer adoption in non-English speaking areas
- Implementation: Add translation files (i18n); localize error messages; translate commodity/mandi names

**No bulk data import for admin:**
- Problem: Adding mandis or commodities requires code/database changes. No admin UI for bulk import.
- Blocks: Scaling to new regions; updating data without deployment
- Implementation: Add CSV import endpoints with validation; implement data reconciliation; add import preview/confirmation

## Test Coverage Gaps

**E2E price sync workflow untested:**
- What's not tested: Full data_gov.in API → seeder → database flow. Mocking API client means issues in seeder not caught.
- Files: `backend/app/integrations/data_gov_client.py`, `backend/app/integrations/seeder.py`, `backend/app/integrations/data_sync.py`
- Risk: Sync silently fails or creates corrupted data; N records created instead of expected M; no visibility into failures
- Priority: High - affects data integrity

**Concurrent authentication requests untested:**
- What's not tested: Multiple OTP requests for same phone in rapid succession; token refresh race conditions; logout from all devices race
- Files: `backend/app/auth/routes.py`, `backend/app/auth/service.py`
- Risk: OTP invalidation race; duplicate user creation; token revocation failures
- Priority: High - security-related

**Transport comparison distance calculation untested:**
- What's not tested: Haversine accuracy; handling of very close/far mandis; edge cases near date line/poles
- Files: `backend/app/transport/service.py` (distance calculation logic)
- Risk: Users get wildly incorrect transport costs; unusable transport recommendations
- Priority: Medium - affects UX but not critical

**Frontend API error recovery untested:**
- What's not tested: Retry logic after network timeout; 5xx error handling; concurrent request failures
- Files: `frontend/src/lib/api.ts`, all page components using API
- Risk: Silent failures; users see blank pages; no error message
- Priority: Medium - affects user experience

**Admin moderation workflows untested:**
- What's not tested: Banning users; deleting posts; moderating community; audit trail generation
- Files: `backend/app/admin/routes.py`, `backend/app/admin/service.py`
- Risk: Moderation actions fail silently; no accountability; no undo capability
- Priority: Medium - important for community safety

---

*Concerns audit: 2025-02-23*
