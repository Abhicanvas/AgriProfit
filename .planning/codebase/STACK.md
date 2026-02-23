# Technology Stack

**Analysis Date:** 2026-02-23

## Languages

**Primary:**
- Python 3.x - Backend API (FastAPI)
- TypeScript 5 - Frontend (Next.js)
- JavaScript/TypeScript - Mobile (React Native via Expo)

**Secondary:**
- SQL - PostgreSQL queries and Alembic migrations

## Runtime

**Environment:**
- Python 3.9+ - Backend execution via FastAPI/Uvicorn
- Node.js 18+ - Frontend (Next.js) and mobile (Expo)

**Package Manager:**
- pip - Python dependencies
- npm - Node.js/TypeScript dependencies (frontend and mobile)
- Lockfile: `frontend/package-lock.json`, `mobile/package-lock.json`, `backend/requirements.txt` (pinned versions)

## Frameworks

**Core:**
- FastAPI 0.128.0 - Web framework for backend API
- Next.js 15.5.9 - React framework for frontend
- React 19.1.0 - UI library (frontend)
- React Native 0.74.0 - Mobile framework
- Expo 51.0.0 - React Native development platform

**Database ORM:**
- SQLAlchemy 2.0.46 - Python ORM with async-style mapped_column
- Alembic 1.18.1 - Database migration management

**Authentication:**
- python-jose 3.5.0 - JWT token handling
- passlib 1.7.4 - Password hashing
- HTTPBearer - FastAPI security scheme

**API Client:**
- axios 1.13.3 (frontend) / 1.6.0 (mobile) - HTTP client with interceptors
- httpx 0.28.1 - Async HTTP client (backend for data.gov.in integration)

**Testing:**
- pytest 9.0.2 - Python test framework
- pytest-asyncio 1.3.0 - Async test support
- pytest-cov 7.0.0 - Coverage reporting
- vitest 1.6.0 - TypeScript/JavaScript test framework
- @testing-library/react 16.0.0 - React component testing
- MSW 2.0.0 - Mock Service Worker for API mocking
- jsdom 24.0.0 - DOM implementation for Node.js tests

**Build/Dev:**
- Uvicorn 0.40.0 - ASGI server for FastAPI
- Tailwind CSS 4 - Utility-first CSS framework
- PostCSS 4 (@tailwindcss/postcss) - CSS transformation
- ESLint 9 - JavaScript linting
- TypeScript 5 - Type checking

**Background Tasks:**
- APScheduler 3.10.4 - Job scheduling for price sync

**Validation & Configuration:**
- pydantic 2.12.5 - Data validation
- pydantic-settings 2.12.0 - Environment-based configuration
- python-dotenv 1.2.1 - .env file loading
- zod 4.3.6 - TypeScript schema validation (frontend)

**UI Components & State:**
- @radix-ui/react-* - Unstyled, composable React components (dialog, dropdown, label, popover, select, tabs, avatar, checkbox)
- lucide-react 0.563.0 - Icon library
- recharts 3.7.0 - React charting library
- zustand 5.0.10 - State management
- @tanstack/react-query 5.90.20 - Server state management
- react-hook-form 7.71.1 - Form handling
- @hookform/resolvers 5.2.2 - Form validation integration
- sonner 2.0.7 - Toast notifications
- class-variance-authority 0.7.1 - Component variant definitions
- clsx 2.1.1 - Conditional CSS class management
- tailwind-merge 3.4.0 - Merge Tailwind classes

**Rate Limiting & Monitoring:**
- slowapi 0.1.9 - Rate limiting for FastAPI
- limits 5.6.0 - Rate limiting library with Redis support
- redis 7.1.0 - Redis client (optional, for distributed rate limiting)

**Database Drivers:**
- psycopg2-binary 2.9.11 - Blocking PostgreSQL driver
- psycopg[binary] 3.2.3 - Async-compatible PostgreSQL driver (primary)

**Data Processing:**
- pandas 2.2.3 - Data manipulation (commented out in requirements)
- pyarrow 19.0.0 - Parquet file support (commented out)

**Logging & Monitoring:**
- python-json-logger 4.0.0 - JSON format logging
- Sentry (optional) - Error tracking via SENTRY_DSN

**Security & Cryptography:**
- cryptography 46.0.3 - Cryptographic recipes
- bcrypt 5.0.0 - Password hashing
- ecdsa 0.19.1 - ECDSA signatures
- PyJWT - JWT handling (via python-jose)

**Utilities:**
- requests 2.32.5 - HTTP library
- aiofiles 24.1.0 - Async file I/O
- Faker 40.1.2 - Test data generation
- colorama 0.4.6 - Terminal colored output
- Pygments 2.19.2 - Syntax highlighting

## Key Dependencies

**Critical:**
- SQLAlchemy 2.0.46 - ORM for database operations; uses mapped_column style. Essential for all data access. Connection pooling configured via settings.
- FastAPI 0.128.0 - Core API framework; handles routing, dependency injection, async support
- httpx 0.28.1 - Data.gov.in API client with retry logic and 120s timeout for large responses
- APScheduler 3.10.4 - Periodic price sync from data.gov.in (configurable interval)
- NextJS 15.5.9 - Frontend framework; mounted at `/api/v1` for backend communication

**Infrastructure:**
- PostgreSQL (via psycopg[binary]) - Primary data store with async support
- Redis (optional) - Distributed rate limiting and session storage
- Sentry (optional) - Error tracking configuration available

## Configuration

**Environment:**
- Loaded via pydantic-settings from `.env` file in `backend/` directory
- Environment variables override `.env` file values
- Three environment profiles: development, staging, production
- Configuration file: `backend/app/core/config.py`

**Build:**
- Backend: No build step required (Python ASGI)
- Frontend: `next build` → optimized Next.js build
- Mobile: Expo development server via `expo start`

**Environment Variables (Backend):**
- Database: `DATABASE_URL` (required, format: `postgresql+psycopg://user:pass@host:port/db`)
- JWT: `JWT_SECRET_KEY` (min 32 chars in production), `JWT_ALGORITHM` (default HS256)
- OTP: `OTP_LENGTH`, `OTP_EXPIRE_MINUTES`, `OTP_COOLDOWN_SECONDS`, `TEST_OTP` (dev only)
- SMS: `SMS_PROVIDER` (fast2sms/twilio), provider-specific keys
- CORS: `CORS_ORIGINS` (comma-separated), `CORS_ALLOW_CREDENTIALS`, `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`
- Rate Limiting: `REDIS_URL` (optional), `RATE_LIMIT_CRITICAL`, `RATE_LIMIT_WRITE`, `RATE_LIMIT_READ`, `RATE_LIMIT_ANALYTICS`
- Logging: `LOG_LEVEL` (default INFO), `LOG_DIR`, `LOG_RETENTION_DAYS`, `LOG_JSON_FORMAT`
- Data Sync: `DATA_GOV_API_KEY`, `DATA_GOV_RESOURCE_ID`, `PRICE_SYNC_INTERVAL_HOURS`, `PRICE_SYNC_ENABLED`
- Monitoring: `SENTRY_DSN` (optional, production)

**Environment Variables (Frontend):**
- `NEXT_PUBLIC_API_URL` - Backend API base with `/api/v1` suffix (e.g., `http://localhost:8000/api/v1`)
- `NEXT_PUBLIC_ENV` - Environment type (development/staging/production)
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking (optional)

**Environment Variables (Mobile):**
- API connectivity via axios to `NEXT_PUBLIC_API_URL` from frontend `.env` or hardcoded endpoint

## Platform Requirements

**Development:**
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+ (for local development)
- Redis (optional, for distributed rate limiting)
- Expo CLI (for mobile development)

**Production:**
- Python 3.9+ runtime environment
- PostgreSQL 12+ database
- Redis (recommended for distributed deployments)
- SMTP server (for email notifications, if implemented)
- SMS provider API key (Fast2SMS or Twilio)
- Sentry account (optional, for error tracking)

---

*Stack analysis: 2026-02-23*
