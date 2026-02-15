# AgriProfit - Complete Project Context

**Last Updated:** 2026-02-11
**Project Version:** V1.2
**Status:** Auth UI/UX Redesigned, Community Forum Enhanced with Alert Notification System, Database Quality Audited, Automated Daily Sync Active

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Stack](#2-technical-stack)
3. [Project Timeline & Milestones](#3-project-timeline--milestones)
4. [Completed Work](#4-completed-work)
5. [Current Work](#5-current-work)
6. [Remaining Work](#6-remaining-work)
7. [Architecture & Design Decisions](#7-architecture--design-decisions)
8. [Key Metrics & Achievements](#8-key-metrics--achievements)
9. [File Structure](#9-file-structure)
10. [Database Schema](#10-database-schema)
11. [API Endpoints](#11-api-endpoints)
12. [Important Conventions](#12-important-conventions)
13. [Known Issues & Technical Debt](#13-known-issues--technical-debt)
14. [Deployment Information](#14-deployment-information)
15. [Quick Reference Commands](#15-quick-reference-commands)

---

## 1. Project Overview

### What is AgriProfit?

AgriProfit is a **production-grade SaaS platform** designed to help Indian farmers make data-driven decisions about commodity sales. It provides:

- **Real-time commodity price tracking** across 500+ mandis (agricultural markets) in India
- **Price forecasting** using historical data and trend analysis
- **Transport cost calculator** for profit optimization across mandis
- **Inventory management** for tracking farm stock and planned sales
- **Sales tracking** with analytics and profit calculations
- **Community forum** for farmer-to-farmer knowledge sharing (posts, replies, likes, alerts with district notifications)
- **Notification system** for price alerts, community alerts, and announcements
- **Admin dashboard** for platform management, user moderation, and content control
- **Analytics dashboard** with market trends, top movers, and commodity comparisons

### Target Users

1. **Primary:** Indian farmers (agricultural producers)
2. **Secondary:** Agricultural traders, commission agents
3. **Admin:** Platform administrators for user/content management

### Business Value

- Helps farmers identify best mandis for commodity sales
- Reduces information asymmetry in agricultural markets
- Increases farmer income through better price discovery
- Provides transparency in agricultural commodity pricing

### Project Origin

- **Type:** Mini Project (KTU Academic)
- **Quality Bar:** Startup-grade, not demo-level
- **Started:** January 19, 2026
- **V1 Released:** February 8, 2026
- **Current Status:** V1 Production Ready, data sync infrastructure built and active

---

## 2. Technical Stack

### Backend
```yaml
Language: Python 3.11+
Framework: FastAPI 0.128.0
ORM: SQLAlchemy 2.0.46 (mapped_column / Mapped style)
Database: PostgreSQL 15+ (via psycopg driver)
Migrations: Alembic 1.18.1
Authentication: JWT (python-jose) + OTP-based phone auth
Rate Limiting: slowapi 0.1.9
Background Jobs: APScheduler 3.10.4
HTTP Client: httpx 0.28.1 (for data.gov.in API)
Config: pydantic-settings 2.12.0, loads from .env
Logging: python-json-logger, structured JSON logs
API Docs: Auto-generated Swagger/ReDoc via FastAPI
```

### Frontend
```yaml
Framework: Next.js 15.5+ (App Router)
Language: TypeScript 5+
UI: React 19.1+
Styling: Tailwind CSS 4
Component Library: Radix UI (headless) + shadcn/ui patterns
State Management: Zustand 5 + React Query (TanStack Query 5)
Charts: Recharts 3.7
Forms: React Hook Form 7 + Zod 4 validation
Icons: Lucide React
Toasts: Sonner 2
HTTP Client: Axios 1.13
Theme: next-themes (dark mode support)
```

### Testing
```yaml
Backend: pytest 9.0 + pytest-cov 7.0
Frontend: Vitest 1.6 + @testing-library/react 16 + jsdom
  - 38 test files
  - 598 tests passing (100% pass rate)
  - 61.37% statement coverage
Manual Testing: 142 scenarios validated
```

### Infrastructure
```yaml
Development:
  - Backend: uvicorn (localhost:8000)
  - Frontend: next dev (localhost:3000)
  - Database: PostgreSQL (local)

Production (Planned):
  - Server: Ubuntu 22.04 LTS
  - Backend: Gunicorn + uvicorn workers (or Docker)
  - Frontend: Next.js build served via Nginx
  - Database: PostgreSQL with daily backups
  - SSL: Let's Encrypt
```

### External APIs
```yaml
Data Source: data.gov.in API (Agmarknet commodity prices)
  - Agricultural commodity prices (daily)
  - Pagination, retry, rate-limit handling built in
  - Config: data_gov_api_key in settings
  - Auto-sync: APScheduler runs at configurable interval
```

---

## 3. Project Timeline & Milestones

### Phase 1: Planning & Schema Design (Jan 19, 2026)
- Database schema design (PostgreSQL)
- System architecture contract
- Product contract (scope locked)
- Alembic setup and baseline migration

### Phase 2: Core Backend Development (Jan 24-25, 2026)
- FastAPI app structure with modular routers
- Authentication (OTP + JWT)
- Commodity, Mandi, Price, Community endpoints
- SQLAlchemy models with mapped_column style

### Phase 3: Frontend & Integration (Jan 25 - Jan 28, 2026)
- Next.js 15 app with App Router
- Dashboard, Commodities, Mandis pages
- Real data integration with backend API

### Phase 4: V1 Completion (Jan 28 - Feb 8, 2026)
- All 14 router modules implemented
- Inventory, Sales, Analytics, Transport, Notifications, Admin
- Community with replies and likes
- Forecasting endpoints
- 38 test files, 598 tests, 61.37% coverage
- 142 manual test scenarios
- Documentation suite (3,500+ lines)

### Phase 5: Data Sync Infrastructure (Feb 8-11, 2026)
- data.gov.in API client with retries/pagination
- DatabaseSeeder for upserting API records
- DataSyncService with thread-safe status tracking
- APScheduler integration for automated daily sync
- Manual sync CLI script
- `/sync/status` endpoint

### Phase 5b: Database Quality Assurance (Feb 11, 2026)
- Comprehensive database consistency audit script
- Rate-limited data filler (1 req/s, respects API limits)
- Post-fill verification script
- Audit results: 25.1M records, 456 commodities, 5,654 mandis, 36 states
- 8 date gaps (22 days) identified as market holidays/weekends
- 4,722 new price records added from API snapshot
- Mandi coverage improved from 99.6% to 99.6% (23 mandis still missing - Tamil Nadu APMCs)

### Phase 5c: Community Forum Enhancement (Feb 11, 2026)
- Alert notification system with district neighbor mapping (12 states)
- Alert posts trigger notifications to users in same + neighboring districts
- New `alert` post type with special highlighting and notification behavior
- Image upload support (image_url column) for community posts
- View count tracking (incremented on post detail view)
- Pinned posts (admin-only, sorted to top)
- Enhanced frontend: notification bell, alert banner, pinned indicators, view counts
- Sort prioritizes pinned posts and area-relevant alerts
- Alert-status endpoint for checking user area relevance

### Phase 5d: Auth UI/UX Redesign (Feb 11, 2026)
- Split-screen AuthLayout component (branding panel + form area)
- Login page redesign: inline validation, +91 prefix, green checkmark, OTP resend timer (60s), gradient buttons, animations
- Register page redesign: enhanced 3-step progress bar with animated fill, success overlay with redirect
- Profile step: styled native selects with icons, dynamic district loading with spinner
- Custom CSS animations: scale-in, bounce-in, slide-up, fade-in, pulse-ring, shimmer
- Mobile-responsive (branding panel hidden, mobile logo shown)
- Accessibility: skip-to-content link, aria-invalid, aria-describedby, role="alert"
- Security badge footer on all auth pages
- Consistent design language across login and register flows

### Phase 6: Production Deployment (PENDING)
- Server provisioning and configuration
- Database deployment with production data
- SSL, monitoring, backup setup
- Production launch

---

## 4. Completed Work

### Backend (100% Core Features)

**14 Router Modules, All Mounted at `/api/v1`:**

| Module | Prefix | Endpoints | Description |
|--------|--------|-----------|-------------|
| Auth | `/auth` | 6 | OTP request/verify, token refresh, logout, me |
| Users | `/users` | 6 | Profile CRUD, account deletion, preferences |
| Commodities | `/commodities` | 10 | List, detail, prices, forecast, compare, CRUD |
| Mandis | `/mandis` | 14 | List, detail, prices, nearby, distance, CRUD |
| Prices | `/prices` | 11 | Current, history, top-movers, batch add, CRUD |
| Forecasts | `/forecasts` | 8 | Generate, list, by commodity/mandi, CRUD |
| Transport | `/transport` | 4 | Calculate cost, compare mandis, routes |
| Community | `/community/posts` | 17 | Posts CRUD, replies, likes, report, user posts, alert-status, pin |
| Notifications | `/notifications` | 10 | Create, list, read/unread, batch ops, delete |
| Admin | `/admin` | 6 | User management, ban/unban, delete posts |
| Analytics | `/analytics` | 11 | Dashboard stats, trends, top commodities, market overview |
| Inventory | `/inventory` | 4 | List, add, analyze, delete |
| Sales | `/sales` | 4 | List, add, delete, analytics |
| Uploads | `/uploads` | 2 | Upload image, delete image |

**Total: 113+ endpoints across 14 modules**

**Data Sync Infrastructure:**
- `app/integrations/data_gov_client.py` - httpx client with retries and pagination
- `app/integrations/seeder.py` - DatabaseSeeder that upserts API records
- `app/integrations/data_sync.py` - DataSyncService (singleton, thread-safe status)
- `app/integrations/scheduler.py` - APScheduler for automated periodic sync
- `scripts/sync_now.py` - CLI for manual sync trigger
- `/sync/status` endpoint for monitoring

**Data Quality & Consistency Tools:**
- `scripts/audit_database_consistency.py` - Comprehensive DB audit (row counts, date gaps, coverage, data quality, geographic coverage, freshness) with JSON gap report generation
- `scripts/fill_missing_data.py` - Rate-limited gap filler (1 req/s) using DataGovClient + DatabaseSeeder, processes gaps in 10-day batches
- `scripts/verify_data_fill.py` - Post-fill verification comparing before/after statistics, checks remaining gaps and data freshness
- Audit found: 25.1M records, 456/456 commodity coverage (100%), 5,631/5,654 mandi coverage (99.6%)
- 8 date gaps (22 days) are market holidays/weekends (expected, unfillable via API)
- API limitation: data.gov.in does not support historical date-range filtering

**Community Forum Alert System:**
- `app/community/district_neighbors.py` - District adjacency mapping for 12 Indian states (Kerala, Punjab, UP, Maharashtra, MP, Rajasthan, Karnataka, Tamil Nadu, Gujarat, Haryana, AP, West Bengal)
- `app/community/alert_service.py` - AlertNotificationService: creates Notification records for users in same + neighboring districts when alert posts are created
- New `alert` post type with special notification behavior (distinct from `announcement`)
- Alert-status endpoint to check if an alert affects the current user's area
- Pin/unpin endpoint for admin post management

**Performance Achievements:**
- Average API response: **38ms** (target: <200ms)
- 37x performance improvement after DB optimization
- Proper indexes on all frequently queried columns

### Frontend (100% Core Features)

**18 Pages:**

| Route | Description |
|-------|-------------|
| `/` | Landing / redirect |
| `/login` | Phone + OTP authentication |
| `/register` | Multi-step registration |
| `/dashboard` | Stats overview, market prices, forecasts |
| `/dashboard/analyze` | Inventory analysis |
| `/commodities` | Browse and search commodities |
| `/commodities/[id]` | Commodity detail with price charts |
| `/mandis` | Browse agricultural markets |
| `/mandis/[id]` | Mandi detail with prices |
| `/transport` | Transport cost calculator |
| `/inventory` | Manage farm inventory |
| `/sales` | Log and track sales |
| `/analytics` | Market analytics and trends |
| `/community` | Community forum |
| `/notifications` | Notification center |
| `/profile` | User profile management |
| `/admin` | Admin dashboard (role-restricted) |
| `/api-test` | API diagnostic tool (dev) |

**55+ Components:**
- Layout: AppLayout, Sidebar, Navbar, Footer, NotificationBell
- UI (shadcn/ui): Button, Card, Dialog, Input, Select, Table, Badge, Tabs, Checkbox, Skeleton, Avatar, Popover, Tooltip, Alert, Textarea, DropdownMenu, EmptyState, TableSkeleton, Label, Form, Sonner
- Dashboard: PriceChart, CommodityCard, StatCard, StatsGrid, MarketPricesSection, PriceForecastSection
- Dashboard Tabs: CurrentPricesTab, HistoricalTrendsTab, TopMoversTab
- Forecast: ForecastChart, ForecastTable, RecommendationsPanel
- Auth: AuthLayout, OtpInput, ProtectedRoute
- Providers: QueryProvider
- ErrorBoundary

**12 Service Modules:**
auth, commodities, mandis, prices, forecasts, transport, community, notifications, admin, analytics, inventory, sales

### Database (16 Models / Tables)

| Model | Table | Description |
|-------|-------|-------------|
| User | `users` | Accounts (farmer/admin roles) |
| OTPRequest | `otp_requests` | Phone OTP tracking |
| Commodity | `commodities` | Agricultural commodities |
| Mandi | `mandis` | Agricultural markets |
| PriceHistory | `price_history` | Historical price records (~25M rows) |
| PriceForecast | `price_forecasts` | ML-generated predictions |
| CommunityPost | `community_posts` | Forum posts |
| CommunityReply | `community_replies` | Post replies |
| CommunityLike | `community_likes` | Post likes (composite PK) |
| Notification | `notifications` | User notifications |
| AdminAction | `admin_actions` | Admin audit trail |
| Inventory | `inventory` | User inventory tracking |
| Sale | `sales` | User sales records |
| UploadedFile | `uploaded_files` | File upload tracking |
| RefreshToken | `refresh_tokens` | JWT refresh tokens |
| LoginAttempt | `login_attempts` | Security: login attempt tracking |

### Documentation (3,500+ lines)

| Document | Description |
|----------|-------------|
| `docs/API_DOCUMENTATION.md` | Complete API reference |
| `docs/DEPLOYMENT_GUIDE.md` | Production deployment (1,000+ lines) |
| `docs/MANUAL_TEST_RESULTS.md` | 142 manual test scenarios |
| `docs/PROJECT_CONTEXT.md` | This file |
| `PRODUCT_CONTRACT.md` | Scope and requirements (locked) |
| `SYSTEM_ARCHITECTURE.md` | Architecture specification (locked) |

---

## 5. Current Work

### Data Sync Status: COMPLETE

The data sync infrastructure is fully built and integrated:

1. **data.gov.in API Client** - Complete (`app/integrations/data_gov_client.py`)
2. **Database Seeder** - Complete (`app/integrations/seeder.py`)
3. **Sync Service** - Complete (`app/integrations/data_sync.py`)
4. **Scheduler** - Complete (`app/integrations/scheduler.py`)
5. **Manual Sync CLI** - Complete (`scripts/sync_now.py`)
6. **Status Endpoint** - Complete (`GET /sync/status`)

**Database Coverage:**
- Historical data: 2015 to present
- Auto-sync: Runs at configured interval via APScheduler
- Manual sync: Available via `scripts/sync_now.py`

### Database Quality Assurance: COMPLETE (Feb 11, 2026)

Comprehensive audit, fill, and verification pipeline:

1. **Audit** (`scripts/audit_database_consistency.py`) - 8 checks: row counts, date range, commodity/mandi coverage, data quality, geographic coverage, freshness, gap report generation
2. **Fill** (`scripts/fill_missing_data.py`) - Rate-limited (1 req/s) gap filler using existing DataGovClient + DatabaseSeeder
3. **Verify** (`scripts/verify_data_fill.py`) - Post-fill comparison of before/after statistics

**Audit Results (Feb 11, 2026):**
- ~25.1M price records across 4,060 days (2015-01-01 to 2026-02-11)
- 456 commodities (100% with price data), 5,654 mandis (99.6% coverage)
- 8 date gaps (22 days total) - confirmed as market holidays/weekends (unfillable)
- 4,722 new records added from latest API snapshot
- Data is current (0 days old)

### Community Forum Enhancement: COMPLETE (Feb 11, 2026)

Upgraded community forum to production-grade with alert notification system:

**Backend:**
- `alert` post type added (alongside discussion, question, tip, announcement)
- District neighbor mapping for 12 states (case-insensitive matching)
- Alert posts automatically notify users in same + neighboring districts
- View count tracking (auto-incremented on post detail view)
- Pinned posts support (admin-only, sorted to top)
- Image URL support on posts
- Alert-status endpoint for checking user area relevance
- Pin/unpin admin endpoint

**Frontend:**
- Notification bell with unread count in community header
- Notification panel with clickable items (marks as read, opens post)
- Alert banner when posts affect user's area
- Post cards: conditional border styling (yellow=pinned, red=alert), "AFFECTS YOUR AREA" badge
- Sort: pinned posts first, then area-relevant alerts, then by selected sort
- Create form: alert warning when 'alert' category selected, red "Post Alert" button
- Post detail: view count, pinned badge, alert badges
- Image upload with preview in create form

### Auth UI/UX Redesign: COMPLETE (Feb 11, 2026)

Production-grade authentication experience with modern design:

**AuthLayout Component (`components/auth/AuthLayout.tsx`):**
- Split-screen layout: green gradient branding panel (left, desktop) + white form card (right)
- Branding: AgriProfit logo, hero text, 4 trust feature cards (Secure, 10,000+ Farmers, Live Prices, Free Forever)
- Mobile: branding panel hidden, mobile logo pill shown above form
- Skip-to-content accessibility link
- Terms & Privacy footer

**Login Page (`app/login/page.tsx`):**
- Phone input with +91 prefix badge, green checkmark on valid
- Inline validation (real-time on change after first error, on blur)
- OTP step with success banner, centered tracking-wide input
- 60-second resend timer with countdown
- Gradient submit buttons with loading spinners
- Step transitions with CSS animations (fade-in, slide-up)
- Banned user handling (403), new user redirect, profile completion check
- Security badge footer

**Register Page (`app/register/page.tsx`):**
- Enhanced 3-step progress bar: circular icons, animated green fill between steps, pulse ring on current step
- Phone + OTP steps identical design language to login
- Profile step: name (User icon), age (Calendar icon), state/district (MapPin icon + ChevronDown)
- Native styled selects with `appearance-none` + custom icons
- Dynamic district loading with spinner animation
- Success overlay: bounce-in checkmark, personalized welcome, auto-redirect to dashboard
- All fields have inline validation with red error states

**Custom Animations (globals.css):**
- `auth-scale-in` - card entrance
- `auth-bounce-in` - success checkmark
- `auth-slide-up` - step transitions
- `auth-fade-in` - form entrance
- `auth-shimmer` - loading effects
- `auth-pulse-ring` - current step indicator
- Animation delay utilities (.delay-75 through .delay-300)
- Custom auth scrollbar styles

### Next Focus: Production Deployment

The application is feature-complete for V1.2. The next step is production deployment.

---

## 6. Remaining Work

### Phase 6: Production Deployment

**Infrastructure Setup:**
- [ ] Provision production server (Ubuntu 22.04)
- [ ] Install and configure PostgreSQL
- [ ] Install Nginx as reverse proxy
- [ ] Obtain SSL certificate (Let's Encrypt)
- [ ] Configure firewall (UFW)

**Application Deployment:**
- [ ] Deploy backend (Gunicorn + systemd or Docker)
- [ ] Build and deploy frontend (Next.js production build)
- [ ] Configure Nginx reverse proxy rules
- [ ] Set environment variables (production)
- [ ] Run database migrations
- [ ] Seed/migrate production data

**Monitoring & Maintenance:**
- [ ] Setup database backups (daily pg_dump)
- [ ] Configure uptime monitoring
- [ ] Setup log rotation
- [ ] Test backup restoration
- [ ] Document production procedures

### Post-Launch Enhancements (V1.1+, Not Prioritized)

- [ ] Real SMS OTP integration (currently mocked for dev)
- [ ] Redis caching layer for hot data
- [ ] React Native mobile app
- [ ] Multi-language support (Hindi, Malayalam, Punjabi)
- [ ] Email notifications for price alerts
- [ ] Offline mode with sync
- [ ] Export reports (PDF, Excel)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Advanced ML forecasting models

---

## 7. Architecture & Design Decisions

### Key Architectural Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Modular Monolith | Simplicity for V1, single deployment |
| Backend | FastAPI (Python) | Product contract requirement, async support |
| Frontend | Next.js 15 App Router | Modern React, SSR capability |
| Database | PostgreSQL | ACID compliance, JSON support, performance |
| ORM | SQLAlchemy 2.0 (mapped_column) | Type-safe, modern declarative style |
| Auth | JWT + OTP (phone-based) | Stateless, scalable, mobile-friendly |
| API Style | REST with `/api/v1` prefix | Simple, widely compatible |
| Components | Radix UI + Tailwind | Full design control, small bundles |
| State | Zustand + React Query | Simple global state + server cache |
| No Redis (yet) | Direct DB queries | PostgreSQL fast enough for V1 scale |
| No Microservices | Single backend | Team size, deployment simplicity |
| Data Sync | APScheduler + httpx | Lightweight, in-process scheduling |

### Backend Module Organization

Each feature is a self-contained module:
```
app/{feature}/
  routes.py    - FastAPI router with endpoint definitions
  service.py   - Business logic layer
  schemas.py   - Pydantic request/response models (where needed)
```

Models are centralized in `app/models/` since they're shared across modules.

### Frontend Organization

Feature-based pages with shared components:
```
src/app/{route}/page.tsx     - Page component
src/services/{feature}.ts    - API client for that feature
src/components/              - Shared UI components
```

---

## 8. Key Metrics & Achievements

### Performance

| Metric | Value | Target |
|--------|-------|--------|
| Avg API response | 38ms | <200ms |
| Fastest endpoint | ~10ms (/health) | - |
| DB query avg | <100ms | <200ms |
| Page load | <2s | <3s |

### Test Coverage

| Area | Metric | Value |
|------|--------|-------|
| Frontend | Test suites | 38 files |
| Frontend | Total tests | 598 |
| Frontend | Pass rate | 100% |
| Frontend | Statement coverage | 61.37% |
| Manual | Scenarios validated | 142 |
| Manual | Pass rate | 100% |

### Code Scale

| Area | Metric |
|------|--------|
| Backend models | 16 SQLAlchemy models |
| Backend modules | 14 router modules |
| Backend endpoints | 113+ API endpoints |
| Frontend pages | 18 pages |
| Frontend components | 55+ components |
| Frontend services | 12 API service modules |
| Database indexes | 20+ custom indexes |
| Price records | ~25M rows |

---

## 9. File Structure

### Backend
```
backend/
  app/
    main.py                      # FastAPI app entry, middleware, routers
    core/
      config.py                  # pydantic-settings (settings singleton)
      logging_config.py          # Structured JSON logging
      rate_limit.py              # slowapi rate limiter
      middleware.py               # Request logging, security, error middleware
    database/
      base.py                    # SQLAlchemy declarative Base
      session.py                 # Engine, SessionLocal
    models/                      # 15 SQLAlchemy models
      __init__.py                # All model imports
      user.py, commodity.py, mandi.py, price_history.py,
      price_forecast.py, community_post.py (+ Reply, Like),
      notification.py, admin_action.py, inventory.py,
      sale.py, uploaded_file.py, refresh_token.py,
      login_attempt.py, otp_request.py
    auth/                        # Authentication module
      routes.py, security.py
    users/routes.py              # User profile management
    commodities/                 # Commodity module
      routes.py, service.py
    mandi/                       # Mandi module
      routes.py, service.py
    prices/                      # Price data module
      routes.py, service.py
    forecasts/routes.py          # Forecast module
    transport/                   # Transport calculator
      routes.py, service.py
    community/                   # Community forum
      routes.py, service.py, schemas.py
      district_neighbors.py      # District adjacency mapping (12 states)
      alert_service.py           # Alert notification service
    notifications/routes.py      # Notification system
    admin/routes.py              # Admin dashboard
    analytics/                   # Analytics module
      routes.py, service.py, mv_helpers.py, refresh_views.py
    inventory/                   # Inventory management
      routes.py, service.py
    sales/routes.py              # Sales tracking
    uploads/routes.py            # File uploads
    integrations/                # External data sync
      data_gov_client.py         # data.gov.in API client
      seeder.py                  # Database upsert logic
      data_sync.py               # Sync service (singleton)
      scheduler.py               # APScheduler config
  scripts/
    sync_now.py                  # Manual sync trigger
    manage_db.py                 # DB management utilities
    diagnose_api.py              # API diagnostic tool
    audit_database_consistency.py # DB audit: gaps, coverage, quality checks
    fill_missing_data.py         # Rate-limited API gap filler (1 req/s)
    verify_data_fill.py          # Post-fill verification & comparison
  alembic/                       # Database migrations
    versions/
  requirements.txt
  .env                           # Environment configuration
```

### Frontend
```
frontend/
  src/
    app/                         # Next.js App Router pages
      page.tsx                   # Landing page
      layout.tsx                 # Root layout
      login/page.tsx
      register/page.tsx
      dashboard/page.tsx
      dashboard/analyze/page.tsx
      commodities/page.tsx
      commodities/[id]/page.tsx
      mandis/page.tsx
      mandis/[id]/page.tsx
      transport/page.tsx
      inventory/page.tsx
      sales/page.tsx
      analytics/page.tsx
      community/page.tsx
      notifications/page.tsx
      profile/page.tsx
      admin/page.tsx
      api-test/page.tsx          # Dev diagnostic tool
    components/
      layout/                    # AppLayout, Sidebar, Navbar, Footer, NotificationBell
      ui/                        # shadcn/ui components (20+ components)
      dashboard/                 # Dashboard-specific components
        tabs/                    # CurrentPricesTab, HistoricalTrendsTab, TopMoversTab
        forecast/                # ForecastChart, ForecastTable, RecommendationsPanel
      auth/                      # AuthLayout, OtpInput, ProtectedRoute
      providers/                 # QueryProvider
      ErrorBoundary.tsx
    services/                    # 12 API service modules
      auth.ts, commodities.ts, mandis.ts, prices.ts,
      forecasts.ts, transport.ts, community.ts,
      notifications.ts, admin.ts, analytics.ts,
      inventory.ts, sales.ts
    lib/
      api.ts                     # Axios client (baseURL, auth interceptor, perf monitoring)
      utils.ts                   # Utility functions
    utils/                       # Additional utilities
  package.json
  next.config.ts
  vitest.config.ts
  tsconfig.json
  tailwind.config.ts
```

### Documentation
```
docs/
  API_DOCUMENTATION.md           # Complete API reference
  DEPLOYMENT_GUIDE.md            # Production deployment guide
  MANUAL_TEST_RESULTS.md         # 142 manual test scenarios
  PROJECT_CONTEXT.md             # THIS FILE

(Root)
  PRODUCT_CONTRACT.md            # Scope & requirements (LOCKED)
  SYSTEM_ARCHITECTURE.md         # Architecture spec (LOCKED)
```

---

## 10. Database Schema

All models use UUID primary keys (`PG_UUID(as_uuid=True)`) and SQLAlchemy 2.0 `Mapped` / `mapped_column` style.

### User
```
Table: users
  id              UUID PK
  phone_number    VARCHAR(10) NOT NULL (regex: ^[6-9][0-9]{9}$)
  role            VARCHAR(20) NOT NULL (CHECK: 'farmer' | 'admin')
  name            VARCHAR(100) nullable
  age             INTEGER nullable
  state           VARCHAR(50) nullable
  district        TEXT nullable
  language        VARCHAR(10) NOT NULL (default: 'en')
  is_profile_complete  BOOLEAN (default: FALSE)
  is_banned       BOOLEAN (default: FALSE)
  ban_reason      TEXT nullable
  created_at      TIMESTAMP (default: NOW())
  updated_at      TIMESTAMP (default: NOW())
  deleted_at      TIMESTAMP nullable (soft delete)
  last_login      TIMESTAMP nullable

Indexes:
  idx_users_phone_active   UNIQUE (phone_number) WHERE deleted_at IS NULL
  idx_users_district       (district)
  idx_users_role           (role)

Relationships:
  -> community_posts, notifications, admin_actions, uploaded_files, refresh_tokens
```

### Commodity
```
Table: commodities
  id              UUID PK
  name            VARCHAR(100) NOT NULL UNIQUE
  name_local      VARCHAR(100) nullable
  category        VARCHAR(50) nullable
  unit            VARCHAR(20) nullable
  description     TEXT nullable
  growing_months  INTEGER[] nullable
  harvest_months  INTEGER[] nullable
  peak_season_start  INTEGER nullable (1-12)
  peak_season_end    INTEGER nullable (1-12)
  major_producing_states  VARCHAR(100)[] nullable
  is_active       BOOLEAN (default: TRUE)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Indexes:
  idx_commodities_active_name      (is_active, name)
  idx_commodities_active_category  (is_active, category)

Relationships:
  -> price_history, price_forecasts
```

### Mandi
```
Table: mandis
  id              UUID PK
  name            VARCHAR(200) NOT NULL
  state           VARCHAR(100) NOT NULL
  district        VARCHAR(100) NOT NULL
  address         VARCHAR(500) nullable
  market_code     VARCHAR(50) NOT NULL UNIQUE
  latitude        FLOAT nullable
  longitude       FLOAT nullable
  pincode         VARCHAR(10) nullable
  phone           VARCHAR(20) nullable
  email           VARCHAR(100) nullable
  website         VARCHAR(200) nullable
  opening_time    TIME nullable
  closing_time    TIME nullable
  operating_days  VARCHAR(20)[] nullable
  has_weighbridge BOOLEAN (default: FALSE)
  has_storage     BOOLEAN (default: FALSE)
  has_loading_dock BOOLEAN (default: FALSE)
  has_cold_storage BOOLEAN (default: FALSE)
  payment_methods VARCHAR(50)[] nullable
  commodities_accepted VARCHAR(100)[] nullable
  rating          FLOAT nullable
  total_reviews   INTEGER (default: 0)
  is_active       BOOLEAN (default: TRUE)
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Indexes:
  idx_mandis_state_district  (state, district)
  idx_mandis_active_name     (is_active, name)

Relationships:
  -> price_history
```

### PriceHistory (Largest table: ~25M rows)
```
Table: price_history
  id              UUID PK
  commodity_id    UUID FK -> commodities.id (CASCADE)
  mandi_id        UUID FK -> mandis.id (CASCADE) nullable
  mandi_name      TEXT NOT NULL
  price_date      DATE NOT NULL
  modal_price     NUMERIC(10,2) NOT NULL (CHECK >= 0)
  min_price       NUMERIC(10,2) nullable
  max_price       NUMERIC(10,2) nullable
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Indexes:
  UNIQUE (commodity_id, mandi_name, price_date)
  idx_price_history_main               (commodity_id, mandi_name, price_date DESC)
  idx_price_history_date               (price_date DESC)
  idx_price_history_commodity_mandi_date (commodity_id, mandi_id, price_date DESC)
  idx_price_history_commodity_date     (commodity_id, price_date)

CRITICAL: Always add date filters when querying this table!
```

### PriceForecast
```
Table: price_forecasts
  id              UUID PK
  commodity_id    UUID FK -> commodities.id (CASCADE)
  mandi_id        UUID FK -> mandis.id (CASCADE) nullable
  mandi_name      TEXT NOT NULL
  forecast_date   DATE NOT NULL
  predicted_price NUMERIC(10,2) NOT NULL (CHECK >= 0)
  confidence_level NUMERIC(5,4) nullable (CHECK 0-1)
  model_version   TEXT nullable
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Indexes:
  UNIQUE (commodity_id, mandi_name, forecast_date)
  idx_price_forecasts_main  (commodity_id, mandi_name, forecast_date DESC)
  idx_price_forecasts_date  (forecast_date)
```

### CommunityPost / CommunityReply / CommunityLike
```
Table: community_posts
  id              UUID PK
  user_id         UUID FK -> users.id (CASCADE)
  title           TEXT NOT NULL
  content         TEXT NOT NULL
  post_type       VARCHAR(20) NOT NULL (CHECK: discussion|question|tip|announcement|alert)
  district        TEXT nullable
  is_admin_override BOOLEAN (default: FALSE)
  image_url       TEXT nullable
  view_count      INTEGER NOT NULL (default: 0)
  is_pinned       BOOLEAN NOT NULL (default: FALSE)
  created_at, updated_at, deleted_at (soft delete)

Indexes:
  idx_posts_pinned_alert  (is_pinned DESC, created_at DESC)

Table: community_replies
  id              UUID PK
  post_id         UUID FK -> community_posts.id (CASCADE)
  user_id         UUID FK -> users.id (CASCADE)
  content         TEXT NOT NULL
  created_at      TIMESTAMP

Table: community_likes (composite PK)
  user_id         UUID FK -> users.id PK
  post_id         UUID FK -> community_posts.id PK
  created_at      TIMESTAMP
```

### Other Tables
```
notifications    - User notifications (type, title, body, read status)
admin_actions    - Admin audit trail (admin_id, action, target)
inventory        - User stock tracking (commodity, quantity, price)
sales            - Sale records (commodity, quantity, amount)
uploaded_files   - File upload tracking (user, path, type)
refresh_tokens   - JWT refresh tokens (user, hash, expiry, revoked)
login_attempts   - Security tracking
otp_requests     - OTP request tracking
```

---

## 11. API Endpoints

**Base URL:** `http://localhost:8000/api/v1` (dev) | `https://api.agriprofit.in/api/v1` (prod)

**Authentication:** Bearer JWT token in `Authorization` header

### Health (No Auth, No Prefix)
```
GET  /health                                    Health check
GET  /sync/status                               Data sync status
GET  /                                          API info & docs links
```

### Authentication (`/api/v1/auth`)
```
POST /auth/request-otp                          Request OTP via phone
POST /auth/verify-otp                           Verify OTP, get JWT
POST /auth/refresh                              Refresh access token
GET  /auth/me                                   Current user info
POST /auth/logout                               Logout (revoke token)
POST /auth/complete-profile                     Complete user profile
```

### Users (`/api/v1/users`)
```
GET  /users/me                                  Get current user profile
PUT  /users/me                                  Update profile
PUT  /users/me/preferences                      Update preferences
GET  /users/me/activity                         User activity summary
GET  /users/me/stats                            User statistics
DELETE /users/me                                Delete account (soft)
```

### Commodities (`/api/v1/commodities`)
```
POST /commodities/                              Create commodity (admin)
GET  /commodities/                              List commodities
GET  /commodities/categories                    List categories
GET  /commodities/{id}                          Commodity details
GET  /commodities/{id}/prices                   Price history for commodity
GET  /commodities/{id}/forecast                 Forecasts for commodity
POST /commodities/{id}/forecast                 Generate new forecast
GET  /commodities/{id}/analytics                Commodity analytics
PUT  /commodities/{id}                          Update commodity (admin)
DELETE /commodities/{id}                        Delete commodity (admin)
```

### Mandis (`/api/v1/mandis`)
```
POST /mandis/                                   Create mandi (admin)
GET  /mandis/                                   List mandis
GET  /mandis/{id}                               Mandi details
GET  /mandis/states                             List states
GET  /mandis/districts                          List districts
GET  /mandis/nearby                             Find nearby mandis
GET  /mandis/{id}/commodities                   Commodities at mandi
GET  /mandis/{id}/prices                        Prices at mandi
POST /mandis/{id}/review                        Add review
GET  /mandis/compare                            Compare mandis
GET  /mandis/search                             Search mandis
PUT  /mandis/{id}                               Update mandi (admin)
DELETE /mandis/{id}                             Delete mandi (admin)
```

### Prices (`/api/v1/prices`)
```
GET  /prices/current                            Current prices
GET  /prices/history                            Historical prices
GET  /prices/top-movers                         Top price movers
POST /prices/batch                              Batch add prices (admin)
GET  /prices/stats                              Price statistics
GET  /prices/compare                            Compare prices
GET  /prices/trends                             Price trends
GET  /prices/coverage                           Data coverage info
GET  /prices/seasonal                           Seasonal patterns
PUT  /prices/{id}                               Update price record
DELETE /prices/{id}                             Delete price record
```

### Forecasts (`/api/v1/forecasts`)
```
GET  /forecasts/                                List forecasts
POST /forecasts/generate                        Generate forecast
GET  /forecasts/commodity/{id}                  Forecasts by commodity
GET  /forecasts/mandi/{id}                      Forecasts by mandi
GET  /forecasts/accuracy                        Model accuracy stats
GET  /forecasts/summary                         Forecast summary
PUT  /forecasts/{id}                            Update forecast
DELETE /forecasts/{id}                          Delete forecast
```

### Transport (`/api/v1/transport`)
```
POST /transport/calculate                       Calculate transport cost
POST /transport/compare-mandis                  Compare mandi profitability
GET  /transport/routes                          Available routes
GET  /transport/fuel-rates                      Current fuel rates
```

### Community (`/api/v1/community/posts`)
```
POST /community/posts/                          Create post (alert type triggers district notifications)
GET  /community/posts/                          List posts (enriched with alert_highlight for logged-in users)
GET  /community/posts/trending                  Trending posts
GET  /community/posts/categories                Post categories
GET  /community/posts/stats                     Community stats
GET  /community/posts/search                    Search posts by query
GET  /community/posts/user/{user_id}            User's posts
GET  /community/posts/type/{type}               Posts by type
GET  /community/posts/district/{district}       Posts by district
GET  /community/posts/{id}                      Post details (increments view count)
PUT  /community/posts/{id}                      Update post
DELETE /community/posts/{id}                    Delete post
POST /community/posts/{id}/reply                Reply to post
POST /community/posts/{id}/upvote               Upvote post
DELETE /community/posts/{id}/upvote             Remove upvote
GET  /community/posts/{id}/replies              List replies
GET  /community/posts/{id}/alert-status         Check if alert affects current user's area
POST /community/posts/{id}/pin                  Pin/unpin post (admin only)
```

### Notifications (`/api/v1/notifications`)
```
POST /notifications/                            Create notification
POST /notifications/broadcast                   Broadcast to all (admin)
GET  /notifications/                            List user notifications
GET  /notifications/unread-count                Unread count
GET  /notifications/{id}                        Notification details
PUT  /notifications/{id}/read                   Mark as read
PUT  /notifications/read-all                    Mark all as read
PUT  /notifications/preferences                 Update notification prefs
DELETE /notifications/{id}                      Delete notification
DELETE /notifications/                          Clear all notifications
```

### Admin (`/api/v1/admin`)
```
GET  /admin/users                               List all users
GET  /admin/users/{id}                          User details
GET  /admin/stats                               Platform statistics
PUT  /admin/users/{id}/ban                      Ban user
PUT  /admin/users/{id}/unban                    Unban user
DELETE /admin/posts/{id}                        Delete any post
```

### Analytics (`/api/v1/analytics`)
```
GET  /analytics/dashboard                       Dashboard summary
GET  /analytics/market-overview                 Market overview
GET  /analytics/top-commodities                 Top commodities
GET  /analytics/price-trends                    Price trend analysis
GET  /analytics/seasonal                        Seasonal patterns
GET  /analytics/regional                        Regional analysis
GET  /analytics/commodity/{id}                  Commodity deep-dive
GET  /analytics/price-distribution              Price distribution
GET  /analytics/volatility                      Price volatility
GET  /analytics/comparison                      Multi-commodity comparison
GET  /analytics/data-coverage                   Data coverage stats
```

### Inventory (`/api/v1/inventory`)
```
GET  /inventory/                                User's inventory
POST /inventory/                                Add item
POST /inventory/analyze                         Analyze inventory value
DELETE /inventory/{id}                          Delete item
```

### Sales (`/api/v1/sales`)
```
GET  /sales/                                    User's sales
POST /sales/                                    Log sale
DELETE /sales/{id}                              Delete sale
GET  /sales/analytics                           Sales analytics
```

### Uploads (`/api/v1/uploads`)
```
POST /uploads/images                            Upload image
DELETE /uploads/images/{id}                     Delete image
```

---

## 12. Important Conventions

### Backend (Python)

- **ORM Style:** SQLAlchemy 2.0 `Mapped` / `mapped_column` (NOT legacy `Column`)
- **PK Type:** UUID (`PG_UUID(as_uuid=True)`) for all models
- **Naming:** snake_case for files, functions, variables; PascalCase for classes
- **Type hints:** Required for all function signatures
- **Config:** `pydantic-settings`, loaded from `.env` in `backend/`
- **DB Session:** `SessionLocal` from `app/database/session.py`
- **DB Driver:** `postgresql+psycopg://` (psycopg 3, NOT psycopg2 for connection string)

### Frontend (TypeScript)

- **Testing Framework:** Vitest (NOT Jest)
- **API Client:** Axios with baseURL from `NEXT_PUBLIC_API_URL` (must include `/api/v1`)
- **CORS Origins:** `http://localhost:3000` and `http://127.0.0.1:3000`
- **Components:** Functional only, no class components
- **State:** Zustand for global, React Query for server state
- **Styling:** Tailwind CSS utility classes

### Database Performance Rules

These are critical for the `price_history` table (~25M rows):

1. **ALWAYS add date filters** - scanning full table = 60+ second timeouts
2. **Avoid window functions** (LAG, FIRST_VALUE) without date bounds
3. Use **DISTINCT ON** + **LEFT JOIN LATERAL** instead of window functions for latest-per-group
4. Use **pg_class reltuples** for approximate counts instead of `COUNT(*)`
5. Use **MAX(price_date)** as reference date - data may lag by days
6. Price normalization: values < 200 are multiplied by 100 (kg to quintal conversion)

### Git Commit Style

```
<type>: <description>

Types: feat, fix, docs, test, refactor, perf, chore
```

### Environment Variables

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql+psycopg://user:password@localhost/agriprofit
SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
DATA_GOV_API_KEY=your-api-key
PRICE_SYNC_ENABLED=true
PRICE_SYNC_INTERVAL_HOURS=24
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 13. Known Issues & Technical Debt

### Known Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | OTP is mocked (any 6-digit code works in dev) | Low | Intentional for V1 |
| 2 | Some frontend pages lack error boundaries | Low | Identified |
| 3 | Dashboard may load slowly (sequential API calls) | Medium | Identified |
| 4 | data.gov.in API does not support date-range filtering | Low | Cannot backfill historical gaps via API; only current/recent data available |
| 5 | 8 date gaps (22 days) in price_history | Low | Market holidays/weekends; expected and unfillable |
| 6 | 23 mandis (Tamil Nadu APMCs) have no price data | Low | Not present in API results |
| 7 | District neighbor mapping covers 12 states only | Low | Kerala, Punjab, UP, Maharashtra, MP, Rajasthan, Karnataka, TN, Gujarat, Haryana, AP, WB. Unknown districts fall back to same-district-only notifications |

### Technical Debt

| # | Debt | Priority | Notes |
|---|------|----------|-------|
| 1 | No Redis caching layer | Low | PostgreSQL sufficient for V1 |
| 2 | No E2E tests (Playwright/Cypress) | Medium | Unit + manual covers core |
| 3 | Some hardcoded constants | Low | Working, just inflexible |
| 4 | Bundle size optimization needed | Low | Acceptable for V1 |
| 5 | Frontend coverage at 61% | Low | Met 60% target |

### Vitest-Specific Gotchas

- **Stable router references:** `useRouter` mocks MUST return a stable object (create once in factory or `vi.hoisted()`), otherwise `useEffect(..., [router])` causes infinite re-render loops
- **vi.hoisted():** Required for variables referenced in `vi.mock` factories when `@testing-library/react` is imported
- **lucide-react:** Never use Proxy mock; use explicit named exports

---

## 14. Deployment Information

### Development Setup

**Prerequisites:**
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access:**
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Production Deployment (Planned)

See `docs/DEPLOYMENT_GUIDE.md` for detailed instructions.

**Target Stack:**
- Ubuntu 22.04 LTS
- Gunicorn + uvicorn workers (or Docker)
- Nginx reverse proxy
- PostgreSQL 15
- Let's Encrypt SSL
- systemd services
- Daily pg_dump backups

---

## 15. Quick Reference Commands

### Development
```bash
# Start backend (with auto-reload)
cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload

# Start frontend
cd frontend && npm run dev

# Run frontend tests
cd frontend && npm test

# Run frontend tests with coverage
cd frontend && npx vitest run --coverage

# Run backend tests
cd backend && pytest --cov=app
```

### Database
```bash
# Create new migration
cd backend && alembic revision -m "description"

# Apply migrations
cd backend && alembic upgrade head

# Rollback one migration
cd backend && alembic downgrade -1

# Backup database
pg_dump agriprofit > backup_$(date +%Y%m%d).sql
```

### Data Sync
```bash
# Manual sync trigger
cd backend && python scripts/sync_now.py

# Check sync status (API)
curl http://localhost:8000/sync/status
```

### Database Quality Audit
```bash
# Run full audit (generates database_gaps_report.json)
cd backend && python scripts/audit_database_consistency.py

# Fill gaps from API (reads database_gaps_report.json)
cd backend && python scripts/fill_missing_data.py

# Verify post-fill results
cd backend && python scripts/verify_data_fill.py
```

### Useful SQL Queries
```sql
-- Check latest prices
SELECT c.name, ph.mandi_name, ph.modal_price, ph.price_date
FROM price_history ph
JOIN commodities c ON ph.commodity_id = c.id
ORDER BY ph.price_date DESC LIMIT 10;

-- Count records in date range (use date filters!)
SELECT COUNT(*) FROM price_history
WHERE price_date BETWEEN '2025-10-30' AND '2026-02-11';

-- Approximate total row count (fast)
SELECT reltuples::bigint FROM pg_class WHERE relname = 'price_history';

-- Latest data date
SELECT MAX(price_date) FROM price_history;
```

---

## Appendix: Critical Context for AI Models

### When Context Resets, Remember:

1. **Project Status:** V1.2 is feature-complete. Auth pages redesigned with split-screen layout and animations. Community forum enhanced with alert notification system. Data sync infrastructure is built and active. Next step is production deployment.

2. **What NOT to Change (stable, tested, working):**
   - Database schema (16 models, finalized)
   - API endpoints (113+ implemented and tested)
   - Frontend pages (18 pages, all working)
   - Authentication system (JWT + OTP)
   - Data sync infrastructure

3. **Tech Decisions Already Made:**
   - FastAPI + SQLAlchemy 2.0 (backend)
   - Next.js 15 App Router + TypeScript (frontend)
   - PostgreSQL (database, no Redis yet)
   - Vitest (NOT Jest) for frontend tests
   - Monolithic architecture (no microservices)
   - UUID primary keys everywhere

4. **Performance Critical:**
   - `price_history` has ~25M rows - ALWAYS use date filters
   - Use `MAX(price_date)` not `date.today()` as reference
   - Avoid window functions without date bounds

5. **Key Config:**
   - Backend `.env` in `backend/` directory
   - Frontend `NEXT_PUBLIC_API_URL` must include `/api/v1` suffix
   - DB driver: `postgresql+psycopg://` (psycopg 3)

6. **Key Files to Start With:**
   - This document: `docs/PROJECT_CONTEXT.md`
   - Backend entry: `backend/app/main.py`
   - Frontend API client: `frontend/src/lib/api.ts`
   - Models: `backend/app/models/__init__.py`
   - Config: `backend/app/core/config.py`
   - Product scope: `PRODUCT_CONTRACT.md`
   - Architecture: `SYSTEM_ARCHITECTURE.md`

---

**End of Context Document**

**Version:** 1.3
**Created:** 2026-02-11
**Last Modified:** 2026-02-11 (auth UI/UX redesign with AuthLayout, animations, enhanced validation)
**Next Update:** After Phase 6 completion (production deployment)
