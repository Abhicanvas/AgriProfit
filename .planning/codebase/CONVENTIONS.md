# Coding Conventions

**Analysis Date:** 2026-02-23

## Naming Patterns

**Files:**
- Python: `snake_case.py` - e.g., `auth_service.py`, `test_users_api.py`
- TypeScript/React: `kebab-case.ts` for utilities, `PascalCase.tsx` for components - e.g., `Button.tsx`, `CommodityCard.tsx`
- Test files: `test_*.py` (Python) or `*.test.ts/tsx` (TypeScript) - e.g., `test_users_api.py`, `auth.test.ts`

**Functions:**
- Python: `snake_case` - e.g., `get_user_by_phone()`, `create_otp_request()`, `send_otp_sms()`
- TypeScript: `camelCase` - e.g., `requestOtp()`, `verifyOtp()`, `completeProfile()`, `handleClick()`
- Private Python methods: Leading underscore for internal helpers - e.g., `_invalidate_old_otps_no_commit()`

**Variables:**
- Python: `snake_case` - e.g., `test_token`, `test_user`, `auth_service`
- TypeScript: `camelCase` - e.g., `phoneNumber`, `accessToken`, `profileData`
- Constants: `UPPER_SNAKE_CASE` - e.g., `LOG_RETENTION_DAYS`, `RATE_LIMIT_CRITICAL`, `IS_WINDOWS`

**Types:**
- TypeScript Interfaces: `PascalCase` - e.g., `User`, `ProfileData`, `Commodity`, `AuthResponse`
- Type aliases: `PascalCase` - e.g., `CommodityWithPrice`

## Code Style

**Formatting:**
- ESLint (frontend) + Next.js config: `eslint.config.mjs`
- Rules configured as warnings, not errors, allowing flexibility
- No Prettier enforcement detected - code follows natural formatting

**Linting Rules:**
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: warn
- `react/no-unescaped-entities`: warn
- `@typescript-eslint/ban-ts-comment`: warn
- `prefer-const`: warn

**TypeScript Configuration:**
- Target: ES2017
- Strict mode: enabled (`strict: true`)
- JSX: preserve (Next.js handles compilation)
- Module resolution: bundler
- Path aliases: `@/*` maps to `src/*`

**Python Style:**
- Docstrings on all functions, classes, and modules
- Module-level section headers with `=` for organization
- Type hints required on functions - e.g., `def get_user_by_phone(self, phone_number: str) -> User | None:`

## Import Organization

**Python Order:**
1. Standard library imports (`datetime`, `logging`, `uuid`)
2. Third-party imports (`fastapi`, `sqlalchemy`, `pydantic`)
3. Local app imports (`from app.database.session import ...`, `from app.models import ...`)
4. Relative imports for same module utilities

Example from `backend/app/auth/service.py`:
```python
from datetime import datetime, timezone
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import User, OTPRequest
from app.auth.security import hash_value, verify_hashed_value, create_access_token
from app.core.config import settings
```

**TypeScript Order:**
1. React/Next.js imports (`import React`, `import Link from 'next/link'`)
2. Third-party libraries (`@tanstack/react-query`, `axios`, `zod`)
3. Icon libraries (`lucide-react`)
4. UI component imports (`@/components/ui/`)
5. Layout/feature components (`@/components/`)
6. Services and utilities (`@/services/`, `@/lib/`, `@/utils/`)
7. Types (`@/types`)

Example from `frontend/src/app/dashboard/page.tsx`:
```typescript
"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { ShoppingCart, BarChart3, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/layout/Sidebar"
import { analyticsService } from "@/services/analytics"
import type { CommodityWithPrice } from "@/types"
```

**Path Aliases:**
- `@/`: Maps to `frontend/src/` in Next.js
- `@/components/`: UI and feature components
- `@/services/`: API service layer
- `@/lib/`: Utilities (api client, validation, helpers)
- `@/utils/`: Performance monitors, shared utilities
- `@/hooks/`: Custom React hooks
- `@/types/`: TypeScript type definitions
- `@test/`: Test utilities (in Vitest config)

## Error Handling

**Python Pattern:**
- Try/except blocks with explicit rollback for database operations
- Pydantic validation with `@field_validator` for schema validation
- FastAPI HTTPException for HTTP errors

Example from `backend/app/auth/service.py`:
```python
try:
    user = User(phone_number=phone_number, role=role)
    self.db.add(user)
    self.db.commit()
    self.db.refresh(user)
    return user
except Exception:
    self.db.rollback()
    raise
```

**TypeScript Pattern:**
- Async/await with try/catch (though not heavily seen - services return promises)
- Error logging in API interceptors
- Automatic 401 redirect on auth failure in API client

From `frontend/src/lib/api.ts`:
```typescript
api.interceptors.response.use(
    (response) => { ... },
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

## Logging

**Framework:** Python `logging` module + custom structured JSON formatter

**Patterns:**
- Module-level logger: `logger = logging.getLogger(__name__)`
- Log at appropriate levels: DEBUG for detailed info, INFO for operations, WARNING for issues, ERROR for failures
- Sensitive data redaction: Fields like `password`, `token`, `otp`, `authorization`, `api_key` are masked as `***REDACTED***`
- Structured fields: timestamp (ISO), environment, level, logger name, source location

Example from `backend/app/auth/service.py`:
```python
logger = logging.getLogger(__name__)

# Log without sensitive data
logger.info(f"[VERIFY] OTP verification attempt for phone ending in ***{phone_number[-4:]}")
logger.warning(f"[VERIFY] OTP expired for {phone_number}")
```

**Logging Config:** `backend/app/core/logging_config.py`
- JSON output enabled by default (`log_json_format: true`)
- Custom formatter sanitizes sensitive fields automatically
- Log levels: DEBUG (dev), INFO (staging), WARNING (prod)
- Log rotation: daily, 30-day retention

## Comments

**When to Comment:**
- Complex business logic or non-obvious algorithms
- Security-related decisions
- Temporary workarounds or known issues
- Links to related issues or documentation

**JSDoc/TSDoc:**
- Docstrings on all public functions and classes (Python)
- Brief description on TypeScript types/interfaces
- Parameter descriptions using Field() in Pydantic models

Example from `backend/app/core/config.py`:
```python
class Settings(BaseSettings):
    """
    Application settings with environment variable support.

    All settings can be overridden via environment variables.
    Environment variables take precedence over .env file values.
    """
```

## Function Design

**Size:**
- Keep functions under 50 lines when possible
- Private helper methods extract repeated logic (e.g., `_invalidate_old_otps_no_commit()`)

**Parameters:**
- Python: Type-hinted parameters - `def get_user(self, user_id: UUID) -> User | None:`
- Avoid many parameters; use dataclasses/Pydantic models for groups of related params

**Return Values:**
- Explicit return type hints on all functions
- Python union types: `User | None` instead of `Optional[User]`
- Services return data or tuples for multiple values: `def get_or_create_user() -> tuple[User, bool]:`

## Module Design

**Exports:**
- Python: Explicit `__all__` at module end - e.g., `__all__ = ["User"]` in `backend/app/models/user.py`
- TypeScript: Default exports for components, named exports for utilities/services

**Barrel Files:**
- `backend/app/models/__init__.py`: Exports all model classes for convenience
- Frontend: No prominent barrel pattern; imports from specific files

**Directory Structure for Features:**
```
feature/
├── routes.py          # FastAPI router with endpoints
├── schemas.py         # Pydantic models (request/response)
├── service.py         # Business logic class
├── models/            # SQLAlchemy models (if specific to feature)
└── __init__.py
```

Example: `backend/app/auth/` has `routes.py`, `service.py`, `security.py`, `otp.py`

## Security Patterns

**Validation:**
- Pydantic field validators for input validation: `@field_validator("phone_number")`
- Check constraints at database level for data integrity

**Authentication:**
- JWT tokens via `create_access_token()` after OTP verification
- Bearer token in Authorization header: `Authorization: Bearer <token>`
- Token stored in localStorage (frontend) - cleared on 401

**Rate Limiting:**
- Decorator pattern: `@limiter.limit("5/minute")` on routes
- Rate limit constants: `RATE_LIMIT_CRITICAL`, `RATE_LIMIT_READ`, `RATE_LIMIT_WRITE`

## Database Patterns

**Models:**
- UUID primary keys using `mapped_column(PG_UUID(as_uuid=True))`
- Timestamp fields with server defaults: `server_default=text("NOW()")`
- Soft deletes via `deleted_at` column (check in queries: `User.deleted_at.is_(None)`)
- Relationships use `relationship()` with `cascade="all, delete-orphan"`

Example from `backend/app/models/user.py`:
```python
id: Mapped[UUID] = mapped_column(
    PG_UUID(as_uuid=True),
    primary_key=True,
    default=uuid_module.uuid4,
)

deleted_at: Mapped[Optional[datetime]] = mapped_column(
    TIMESTAMP,
    nullable=True,
)
```

**Queries:**
- Always filter soft-deleted records: `.filter(Model.deleted_at.is_(None))`
- Use session dependency injection in routes: `db: Session = Depends(get_db)`

---

*Convention analysis: 2026-02-23*
