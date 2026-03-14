# Architecture

**Analysis Date:** 2026-02-23

## Pattern Overview

**Overall:** Layered Service-Oriented Architecture (SOA)

**Key Characteristics:**
- Backend: FastAPI REST API with service/repository pattern per domain
- Frontend: Next.js with React 19, server and client components
- Database-first design with SQLAlchemy ORM and Alembic migrations
- Modular domain-driven design (auth, prices, commodities, etc.)
- Async/await patterns throughout backend for concurrency
- Singleton pattern for configuration and background services

## Layers

**Presentation (Frontend):**
- Purpose: User interfaces for farmers, admins, and analysts
- Location: `frontend/src/app/`, `frontend/src/components/`
- Contains: Next.js page routes, React components, UI primitives
- Depends on: API client (`frontend/src/lib/api.ts`), services (`frontend/src/services/`)
- Used by: Browser clients

**API Layer (Backend Routes):**
- Purpose: HTTP endpoints for all business operations
- Location: `backend/app/*/routes.py` (e.g., `backend/app/auth/routes.py`)
- Contains: FastAPI routers, request/response schemas, validation
- Depends on: Services, security middleware, rate limiting
- Used by: Frontend, external clients

**Business Logic (Backend Services):**
- Purpose: Core domain operations and business rules
- Location: `backend/app/*/service.py` (e.g., `backend/app/prices/service.py`, `backend/app/auth/service.py`)
- Contains: Database queries, calculations, OTP generation, JWT validation
- Depends on: Models, database session, external integrations
- Used by: Routes

**Data Layer (Models & Database):**
- Purpose: Data persistence and ORM mapping
- Location: `backend/app/models/` (SQLAlchemy models), `backend/database/base.py`
- Contains: Table definitions with UUID primary keys, relationships, constraints
- Depends on: SQLAlchemy, PostgreSQL dialect
- Used by: Services

**Infrastructure (Database & Integrations):**
- Purpose: External service integration and database connectivity
- Location: `backend/app/database/` (session/engine), `backend/app/integrations/` (API clients)
- Contains: Session factory, connection pooling, data.gov.in API client, geocoding
- Depends on: Configuration settings
- Used by: Services

**Configuration & Security:**
- Purpose: Centralized settings, authentication, rate limiting
- Location: `backend/app/core/config.py`, `backend/app/auth/security.py`, `backend/app/core/rate_limit.py`
- Contains: Pydantic settings, JWT tokens, OTP validation, rate limit configurations
- Depends on: Environment variables, pydantic
- Used by: All layers

## Data Flow

**User Authentication Flow:**

1. User requests OTP: `POST /auth/request-otp` (phone_number)
2. Backend generates 6-digit OTP via `app/auth/otp.py`
3. Backend sends OTP via SMS provider (Fast2SMS or Twilio)
4. User verifies OTP: `POST /auth/verify-otp` (phone_number, otp)
5. Backend validates OTP with `AuthService.verify_otp()`
6. Backend generates JWT token with user UUID in payload
7. Frontend stores token in localStorage
8. Frontend includes token in Authorization header for subsequent requests

**Price Data Sync Flow:**

1. Background scheduler (APScheduler in `backend/app/integrations/scheduler.py`) triggers periodically
2. Scheduler calls `DataSyncService.sync_prices()`
3. `data_gov_client.py` fetches price data from data.gov.in API via httpx
4. `seeder.py` (DatabaseSeeder) upserts records into PostgreSQL
5. PriceHistory records stored with unique constraint on (commodity_id, mandi_id, price_date)
6. mandi_name required; mandi_id nullable for historical data compatibility
7. Sync status tracked in `DataSyncService.state` for monitoring

**API Request Flow:**

1. Frontend sends request with JWT token in Authorization header
2. Axios request interceptor in `frontend/src/lib/api.ts` attaches token
3. Request reaches FastAPI router in `backend/app/{domain}/routes.py`
4. Router depends on `get_current_user` from `app/auth/security.py` for authentication
5. Request passes through middleware: logging, security monitoring, error handling
6. Rate limiter in `app/core/rate_limit.py` checks request tier (critical/write/read)
7. Route handler calls service layer for business logic
8. Service queries database via SQLAlchemy ORM
9. Response serialized via Pydantic schemas
10. Frontend receives JSON, updates React state via React Query/TanStack Query

**State Management:**

- **Backend:** No client-side state; all state in PostgreSQL database
- **Frontend:** React state for UI (form inputs, modals), localStorage for JWT token
- **API Cache:** TanStack React Query (`@tanstack/react-query`) caches API responses client-side
- **Background Sync:** APScheduler manages price data sync independently from user requests

## Key Abstractions

**Service Pattern:**
- Purpose: Encapsulate business logic per domain
- Examples: `backend/app/prices/service.py`, `backend/app/auth/service.py`, `backend/app/commodities/service.py`
- Pattern: Class with __init__(db: Session), methods return domain models or None; raise exceptions for errors

**Schema Pattern (Pydantic):**
- Purpose: Request/response validation and serialization
- Examples: `backend/app/prices/schemas.py`, `backend/app/auth/routes.py` (inline schemas)
- Pattern: BaseModel subclasses with field validators, used in FastAPI route signatures

**Domain Modules:**
- Purpose: Self-contained features (auth, prices, commodities, etc.)
- Examples: `backend/app/auth/`, `backend/app/prices/`, `backend/app/commodities/`
- Pattern: Each domain has routes.py, service.py, schemas.py, plus models in `backend/app/models/`

**Middleware:**
- Purpose: Cross-cutting concerns (logging, security, error handling)
- Examples: `RequestLoggingMiddleware`, `SecurityMonitoringMiddleware`, `ErrorLoggingMiddleware` in `backend/app/middleware/`
- Pattern: Starlette BaseHTTPMiddleware subclasses with async dispatch method

## Entry Points

**Backend HTTP Entry:**
- Location: `backend/app/main.py`
- Triggers: `uvicorn backend.app.main:app` command
- Responsibilities: Initialize FastAPI app, register all routes, attach middleware, setup CORS, load environment config

**Frontend Entry:**
- Location: `frontend/src/app/layout.tsx` (root layout), `frontend/src/app/page.tsx` (home)
- Triggers: Next.js build and server startup
- Responsibilities: Provide QueryProvider wrapper, ThemeProvider, layout structure

**Background Scheduler:**
- Location: `backend/app/integrations/scheduler.py`, initialized in `backend/app/main.py` lifespan
- Triggers: On app startup
- Responsibilities: Schedule price data syncs every N hours (configurable via `price_sync_interval_hours`)

**CLI Scripts:**
- Location: `backend/scripts/` (manage_db.py, sync_now.py, inspect_parquet.py, etc.)
- Triggers: Manual invocation: `python backend/scripts/manage_db.py`, `python backend/scripts/sync_now.py`
- Responsibilities: Database management, ETL from Parquet, data validation, performance testing

## Error Handling

**Strategy:** Layered exceptions with structured logging

**Patterns:**

- **Route Layer:** Catch service exceptions, return HTTPException with appropriate status code (400, 401, 403, 404, 409, 500)
- **Service Layer:** Raise ValueError, IntegrityError (database), or custom exceptions; log at ERROR level
- **Middleware Layer:** Catch all unhandled exceptions, log full stack trace, return 500 with generic error message
- **Database Layer:** SQLAlchemy catches IntegrityError on unique/FK violations; services catch and re-raise as ValueError
- **Frontend:** Axios response interceptor catches 401 (unauthorized) and redirects to login; other errors bubble to React components

**Global Exception Handler:**
- Location: `backend/app/main.py` registers exception handlers for FastAPI
- Catches unhandled exceptions and returns standardized error response

## Cross-Cutting Concerns

**Logging:**
- Configuration: `backend/app/core/logging_config.py` with JSON format
- Per-request: RequestLoggingMiddleware logs method, path, status, duration
- Auth events: log_auth_failure, log_admin_action in security module
- Database errors: logged via middleware

**Validation:**
- Request schemas: Pydantic BaseModel with field_validator decorators (e.g., phone number format in OTPRequestSchema)
- Phone validation: must be 10-digit starting with 6,7,8,9 (Indian numbers)
- Price normalization: prices < 200 multiplied by 100 (kg to quintal conversion) in PriceHistoryService
- JWT validation: jwt.decode with algorithm HS256, validates exp claim

**Authentication:**
- OTP-based phone verification flow
- JWT tokens with 24-hour expiration (configurable)
- get_current_user dependency validates token and loads User object
- require_role("admin") decorator for role-based access

**Rate Limiting:**
- Configuration: `backend/app/core/rate_limit.py` with slowapi
- Tiers: critical (5/min for auth), write (30/min), read (100/min), analytics (50/min)
- Storage: Redis if available, fallback to in-memory
- Applied to routes via @limiter.limit() decorator

**CORS:**
- Configured in `backend/app/main.py` via CORSMiddleware
- Allowed origins: http://localhost:3000, http://127.0.0.1:3000 (configurable)
- Allows credentials, all methods, all headers

---

*Architecture analysis: 2026-02-23*
