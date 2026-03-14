# Codebase Structure

**Analysis Date:** 2026-02-23

## Directory Layout

```
repo-root/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app initialization, route registration
│   │   ├── cli.py             # CLI commands
│   │   ├── models/            # SQLAlchemy ORM models (UUIDs, foreign keys)
│   │   │   ├── user.py
│   │   │   ├── commodity.py
│   │   │   ├── mandi.py
│   │   │   ├── price_history.py
│   │   │   ├── community_post.py
│   │   │   ├── notification.py
│   │   │   └── [12 more domain models]
│   │   ├── core/               # Configuration, security, rate limiting
│   │   │   ├── config.py      # Pydantic settings singleton
│   │   │   ├── logging_config.py
│   │   │   ├── rate_limit.py  # slowapi configuration
│   │   │   ├── middleware.py
│   │   │   ├── security.py
│   │   │   └── ip_protection.py
│   │   ├── database/           # Database session and engine
│   │   │   ├── session.py     # SessionLocal, engine, get_db()
│   │   │   └── base.py        # Declarative base for models
│   │   ├── auth/               # Authentication domain
│   │   │   ├── routes.py      # /auth endpoints
│   │   │   ├── service.py     # OTP, token, user verification logic
│   │   │   ├── security.py    # get_current_user, require_role
│   │   │   └── otp.py         # OTP generation
│   │   ├── prices/             # Price tracking domain
│   │   │   ├── routes.py      # /prices endpoints
│   │   │   ├── service.py     # Query, create, update operations
│   │   │   └── schemas.py     # Request/response models
│   │   ├── commodities/        # Commodity catalog domain
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   ├── mandis/             # Mandi (market) domain
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   ├── [9 more domains]    # users, analytics, community, notifications, forecasts, etc.
│   │   ├── integrations/       # External service integration
│   │   │   ├── data_gov_client.py   # data.gov.in API client
│   │   │   ├── data_sync.py         # DataSyncService with status tracking
│   │   │   ├── seeder.py            # DatabaseSeeder for upserts
│   │   │   ├── scheduler.py         # APScheduler background tasks
│   │   │   ├── geocoding.py         # Geocoding utilities
│   │   │   └── district_geocodes.py # District lookup table
│   │   └── middleware/          # Request/response middleware
│   │       └── (imported via core/__init__.py)
│   ├── alembic/                # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/           # Migration files
│   ├── scripts/                # Management scripts
│   │   ├── manage_db.py        # Database operations
│   │   ├── sync_now.py         # Manual price sync trigger
│   │   ├── etl_parquet_to_postgres.py  # Parquet data import
│   │   ├── inspect_parquet.py  # Parquet file inspection
│   │   ├── backfill_prices.py  # Historical data backfill
│   │   └── [20+ data validation/testing scripts]
│   ├── tests/                  # Pytest test suite
│   ├── uploads/                # User-uploaded files
│   ├── logs/                   # Log files
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables (not in git)
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js app directory (file-based routing)
│   │   │   ├── layout.tsx     # Root layout with providers
│   │   │   ├── page.tsx       # Home page (/)
│   │   │   ├── auth/          # Authentication pages
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   │   ├── page.tsx
│   │   │   │   └── analyze/page.tsx
│   │   │   ├── commodities/   # Commodity pages
│   │   │   │   ├── page.tsx   # List view
│   │   │   │   └── [id]/page.tsx  # Detail view
│   │   │   ├── mandis/        # Mandi pages
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── [10+ more domain pages]
│   │   │   └── api-test/page.tsx  # Diagnostic API test page
│   │   ├── components/         # Reusable React components
│   │   │   ├── layout/        # Page structure
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── NotificationBell.tsx
│   │   │   ├── auth/          # Auth-related components
│   │   │   │   ├── AuthLayout.tsx
│   │   │   │   ├── OtpInput.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   │   ├── CommodityCard.tsx
│   │   │   │   ├── PriceChart.tsx
│   │   │   │   ├── MarketPricesSection.tsx
│   │   │   │   ├── PriceForecastSection.tsx
│   │   │   │   ├── StatsGrid.tsx
│   │   │   │   └── StatCard.tsx
│   │   │   ├── ui/            # UI primitives (Radix + Tailwind)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── [20+ more UI components]
│   │   │   ├── providers/     # Context providers
│   │   │   │   └── QueryProvider.tsx  # TanStack React Query wrapper
│   │   │   └── ErrorBoundary.tsx
│   │   ├── lib/               # Utilities and helpers
│   │   │   ├── api.ts         # Axios instance with interceptors
│   │   │   └── __tests__/
│   │   ├── services/          # API service functions
│   │   │   ├── auth.ts        # Authentication API calls
│   │   │   ├── prices.ts      # Price API calls
│   │   │   ├── commodities.ts
│   │   │   ├── mandis.ts
│   │   │   ├── notifications.ts
│   │   │   └── [8 more services]
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useToast.ts
│   │   ├── store/             # State management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   │   ├── performance-monitor.ts
│   │   │   └── [other utilities]
│   │   └── test/              # Test setup and fixtures
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── vitest.config.ts       # Vitest test runner config
│   └── .env.local             # Environment variables (not in git)
├── mobile/                    # React Native mobile app (if present)
├── docs/                      # Documentation
├── database/                  # Database initialization files
├── specs/                     # API specifications
├── ai/                        # AI-related utilities (if present)
├── README.md
├── setup_check.py             # Environment setup verification
├── setup_friend_pc.md         # Setup instructions
└── docker-compose.prod.yml    # Production Docker configuration
```

## Directory Purposes

**`backend/app/`:**
- Purpose: Main FastAPI application code
- Contains: Routers, services, models, middleware, configuration
- Key files: main.py (entry point), core/config.py (settings)

**`backend/app/models/`:**
- Purpose: SQLAlchemy ORM model definitions
- Contains: Table classes with UUID primary keys, relationships, constraints
- Key files: user.py, commodity.py, mandi.py, price_history.py

**`backend/app/core/`:**
- Purpose: Shared infrastructure and cross-cutting concerns
- Contains: Configuration, security, logging, rate limiting, middleware
- Key files: config.py (Pydantic settings), security.py (JWT/OTP), rate_limit.py

**`backend/app/{domain}/`:**
- Purpose: Domain-specific endpoints and logic (e.g., auth, prices, commodities)
- Contains: routes.py (FastAPI endpoints), service.py (business logic), schemas.py (Pydantic models)
- Pattern: Each domain is self-contained with its own router, service, and schemas

**`backend/app/integrations/`:**
- Purpose: External service integration
- Contains: data.gov.in API client, background scheduler, database seeder, geocoding
- Key files: data_gov_client.py, data_sync.py, scheduler.py, seeder.py

**`backend/scripts/`:**
- Purpose: Management scripts for database, data import, testing
- Contains: manage_db.py (migrations), etl_parquet_to_postgres.py (data import), sync_now.py (manual sync)
- Key files: manage_db.py (main CLI), backfill_prices.py (historical data)

**`frontend/src/app/`:**
- Purpose: Next.js file-based routing
- Contains: Page components and nested routes
- Pattern: layout.tsx (parent), page.tsx (route handler), [id]/page.tsx (dynamic routes)

**`frontend/src/components/`:**
- Purpose: Reusable React components
- Contains: UI primitives, layout components, feature-specific components
- Pattern: Component.tsx with associated .test.tsx in __tests__ folder

**`frontend/src/services/`:**
- Purpose: API client functions for each domain
- Contains: Exported async functions that call backend API endpoints
- Pattern: Each service.ts (e.g., prices.ts) exports functions like getPrices(), getPriceById()

**`frontend/src/lib/`:**
- Purpose: Shared utilities and library functions
- Contains: API client (Axios), helpers, types
- Key files: api.ts (Axios instance with auth interceptor)

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: FastAPI app initialization and route registration
- `frontend/src/app/layout.tsx`: React root layout with providers
- `backend/app/integrations/scheduler.py`: Background task scheduler

**Configuration:**
- `backend/app/core/config.py`: Pydantic settings singleton
- `frontend/.env.local`: Frontend environment variables
- `backend/.env`: Backend environment variables (not in git)

**Core Logic:**
- `backend/app/auth/service.py`: OTP, JWT, user authentication
- `backend/app/prices/service.py`: Price queries and CRUD operations
- `backend/app/integrations/data_sync.py`: Data synchronization service

**Testing:**
- `backend/tests/`: Pytest test suite
- `frontend/src/**/__tests__/`: Vitest component and integration tests
- `frontend/vitest.config.ts`: Test runner configuration

## Naming Conventions

**Files:**
- Python files: snake_case (e.g., `service.py`, `price_history.py`)
- TypeScript/React files: PascalCase for components (e.g., `PriceChart.tsx`), camelCase for utilities (e.g., `api.ts`)
- Test files: Suffix with `.test.ts` or `.spec.ts` for frontend; `test_*.py` for backend

**Directories:**
- Backend: lowercase domains (e.g., `auth/`, `prices/`, `commodities/`)
- Frontend: lowercase app routes (e.g., `auth/`, `dashboard/`); PascalCase component subdirs (e.g., `components/dashboard/`)

**Functions:**
- Python: snake_case (e.g., `get_current_user`, `create_price_history`)
- TypeScript: camelCase (e.g., `getPrices`, `createCommodity`)

**Types/Models:**
- Python models: PascalCase (e.g., `User`, `PriceHistory`, `Commodity`)
- TypeScript types: PascalCase (e.g., `PriceResponse`, `CommoditySchema`)
- Pydantic schemas: PascalCase with Suffix (e.g., `PriceHistoryCreate`, `CommodityUpdate`)

## Where to Add New Code

**New Feature (e.g., New Domain):**
- Primary code: Create `backend/app/{domain}/` directory with routes.py, service.py, schemas.py
- Model: Add table definition to `backend/app/models/{domain}.py`
- Frontend: Create `frontend/src/app/{domain}/` with page.tsx and components
- API Service: Create `frontend/src/services/{domain}.ts`

**New Component/Module:**
- Implementation: Add `.tsx` file to appropriate folder in `frontend/src/components/{category}/`
- Tests: Create `frontend/src/components/{category}/__tests__/{ComponentName}.test.tsx`

**Utilities:**
- Shared helpers: `backend/app/core/` (cross-domain) or `{domain}/` (domain-specific)
- Frontend utilities: `frontend/src/utils/` or `frontend/src/lib/`

**Database Changes:**
- Models: Update `backend/app/models/{domain}.py`
- Migrations: Run `python backend/scripts/manage_db.py new-migration` to generate Alembic migration
- Seed data: Add to `backend/app/integrations/seeder.py` if external data sync

**New API Endpoint:**
- Route: Add handler to `backend/app/{domain}/routes.py` with @router.get/@router.post
- Service: Add method to `backend/app/{domain}/service.py`
- Schema: Add Pydantic model to `backend/app/{domain}/schemas.py`
- Frontend: Add API call to `frontend/src/services/{domain}.ts`

## Special Directories

**`backend/alembic/`:**
- Purpose: Database schema version control
- Generated: Yes (by Alembic)
- Committed: Yes - migrations are committed, tracked history of schema changes

**`backend/logs/`:**
- Purpose: Application log files
- Generated: Yes (by logging system)
- Committed: No - logs are gitignored

**`backend/uploads/`:**
- Purpose: User-uploaded files (images, documents)
- Generated: Yes (by users through API)
- Committed: No - uploads are gitignored

**`frontend/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by next build)
- Committed: No - build output is gitignored

**`.venv/`:**
- Purpose: Python virtual environment
- Generated: Yes (by venv)
- Committed: No - dependencies installed from requirements.txt

---

*Structure analysis: 2026-02-23*
