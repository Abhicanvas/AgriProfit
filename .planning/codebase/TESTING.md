# Testing Patterns

**Analysis Date:** 2026-02-23

## Test Framework

**Backend (Python):**
- Runner: pytest
- Config: `backend/pytest.ini`
- Assertion Library: pytest built-in assertions

**Frontend (TypeScript/React):**
- Runner: Vitest 1.6.0
- Config: `frontend/vitest.config.ts`
- Environment: jsdom (browser-like)
- Assertion Library: Vitest built-in assertions
- Additional libraries: `@testing-library/react`, `@testing-library/jest-dom`

**Run Commands:**

Backend:
```bash
pytest                          # Run all tests in backend/tests/
pytest -v --tb=short           # Verbose output with short traceback
pytest -m unit                  # Run only unit tests
pytest -m integration           # Run only integration tests
pytest tests/test_users_api.py  # Run specific test file
```

Frontend:
```bash
npm test                        # Run Vitest (watches by default)
npm run test:coverage           # Generate coverage report
```

## Test File Organization

**Backend Location:**
- Path: `backend/tests/` directory
- Pattern: `test_<feature>.py` - e.g., `test_users_api.py`, `test_commodities_api.py`, `test_community_service_edge_cases.py`
- Fixture centralization: All shared fixtures in `backend/tests/conftest.py`

**Frontend Location:**
- Co-located: `src/**/__tests__/` - e.g., `src/services/__tests__/auth.test.ts`, `src/components/ui/__tests__/Button.test.tsx`
- Utilities: `src/test/test-utils.tsx` for shared rendering utilities

**Pytest Configuration** (`backend/pytest.ini`):
```ini
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
markers =
    unit: Unit tests for CRUD operations
    integration: Integration tests for API endpoints
    slow: Tests that take longer to run
```

## Test Structure

**Backend Pattern:**

```python
# Test API endpoints (integration tests)
from uuid import uuid4
import pytest

from tests.utils import get_auth_headers, create_test_commodity

@pytest.fixture
def test_commodity(test_db):
    """Fixture to create a test commodity."""
    return create_test_commodity(test_db, name="TestCommodity", category="TestCategory", unit="kg")

def test_create_commodity_success(client, test_admin_token):
    """Test POST /commodities/ with valid data (admin required)."""
    headers = get_auth_headers(test_admin_token)
    data = {
        "name": "NewCommodity",
        "category": "Grains",
        "unit": "quintal"
    }
    response = client.post("/commodities/", json=data, headers=headers)
    assert response.status_code == 201
    resp = response.json()
    assert resp["name"] == "NewCommodity"
    assert resp["category"] == "Grains"
    assert "id" in resp

def test_create_commodity_unauthorized(client):
    """Test POST /commodities/ without token, should return 401."""
    data = {
        "name": "UnauthorizedCommodity",
        "category": "Grains",
        "unit": "quintal"
    }
    response = client.post("/commodities/", json=data)
    assert response.status_code == 401

def test_create_commodity_forbidden(client, test_token):
    """Test POST /commodities/ with non-admin token, should return 403."""
    headers = get_auth_headers(test_token)
    # ... same data ...
    response = client.post("/commodities/", json=data, headers=headers)
    assert response.status_code == 403
```

**Frontend Pattern:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth';
import api from '@/lib/api';

// Mock the api module
vi.mock('@/lib/api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('requestOtp', () => {
        it('should send OTP request with phone number', async () => {
            const mockResponse = { data: { message: 'OTP sent' } };
            vi.mocked(api.post).mockResolvedValue(mockResponse);

            const result = await authService.requestOtp('9876543210');

            expect(api.post).toHaveBeenCalledWith('/auth/request-otp', {
                phone_number: '9876543210',
            });
            expect(result).toEqual({ message: 'OTP sent' });
        });

        it('should handle request OTP errors', async () => {
            vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

            await expect(authService.requestOtp('9876543210')).rejects.toThrow('Network error');
        });
    });
});
```

**Patterns:**
- Test description: First line describes what's being tested
- Setup: Use fixtures (Python) or beforeEach (TypeScript)
- Act: Make the call/request
- Assert: Check specific outcomes (not just "did not error")

## Mocking

**Backend Mocking:**
- Use SQLite in-memory database for tests (`sqlite:///:memory:`)
- TestClient from Starlette for HTTP testing
- Session fixtures from conftest for database state

**Frontend Mocking Pattern:**

Use `vi.mock()` at module level for module-wide mocking:
```typescript
vi.mock('@/lib/api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));
```

Use `vi.hoisted()` when mocking needs to be referenced in factory functions:
```typescript
const { mockRouter } = vi.hoisted(() => ({
    mockRouter: {
        push: vi.fn(),
        back: vi.fn(),
    }
}));

vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));
```

**What to Mock:**
- External API calls (use vi.mock or MSW)
- Browser APIs: localStorage, sessionStorage, window.location
- Next.js hooks: useRouter, usePathname, useSearchParams
- Async operations that slow down tests

**What NOT to Mock:**
- Internal service functions (let them run)
- React hooks like useState, useEffect (let React handle)
- Database queries in unit tests (use fixtures instead)
- Component rendering logic (test actual behavior)

## Fixtures and Factories

**Backend Test Data** (`backend/tests/conftest.py`):

```python
# Database fixtures
@pytest.fixture
def test_engine():
    """Create test database engine (SQLite in-memory)."""
    return create_engine("sqlite:///:memory:", ...)

@pytest.fixture
def test_db(test_engine):
    """Create test database session."""
    Base.metadata.create_all(test_engine)
    session = TestingSessionLocal(bind=test_engine)
    yield session
    session.close()

# Client fixture
@pytest.fixture
def client(test_db):
    """TestClient with test database dependency."""
    def override_get_db():
        yield test_db
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

# Auth fixtures
@pytest.fixture
def test_user(test_db) -> User:
    """Create a test user (farmer role)."""
    user = User(
        phone_number="9876543210",
        role="farmer",
        language="en"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_token(test_user) -> str:
    """Generate a JWT token for test_user."""
    return create_access_token(data={"sub": str(test_user.id)})

@pytest.fixture
def test_admin_user(test_db) -> User:
    """Create a test admin user."""
    user = User(phone_number="9111111111", role="admin")
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_admin_token(test_admin_user) -> str:
    """Generate JWT token for admin user."""
    return create_access_token(data={"sub": str(test_admin_user.id)})
```

**Frontend Test Utils** (`frontend/src/test/test-utils.tsx`):

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement, ReactNode } from 'react'

export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { renderWithQueryClient as render }
```

**Frontend Test Setup** (`frontend/src/test/setup.ts`):

Mocks Next.js navigation globally for all tests:
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/test',
    useSearchParams: () => new URLSearchParams(),
}))

afterEach(() => {
    cleanup()
})
```

## Coverage

**Backend:**
- Test count: 16 test files with comprehensive API and CRUD coverage
- Files tested: `test_users_api.py`, `test_commodities_api.py`, `test_mandis_api.py`, etc.
- Edge case tests: `test_community_service_edge_cases.py`, `test_notifications_service_edge_cases.py`

**Frontend:**
- Test count: 38+ test files
- 598 total tests with 100% pass rate
- Overall statement coverage: 61.37%
- Components tested: UI primitives (Button, Card, Dialog, etc.), pages, services, utilities

**View Coverage:**

Backend:
```bash
pytest --cov=app --cov-report=html
```

Frontend:
```bash
npm run test:coverage
```

## Test Types

**Unit Tests (Backend):**
- Scope: CRUD operations, service methods, utility functions
- Files: `test_users_crud.py`, `test_commodities_crud.py`, `test_mandis_crud.py`
- Approach: Test individual functions with mocked dependencies
- Markers: `@pytest.mark.unit`

Example pattern:
```python
@pytest.mark.unit
def test_get_user_by_phone(test_db, test_user):
    """Test AuthService.get_user_by_phone()"""
    service = AuthService(test_db)
    user = service.get_user_by_phone("9876543210")
    assert user.id == test_user.id
```

**Integration Tests (Backend):**
- Scope: API endpoints with real database and auth
- Files: `test_users_api.py`, `test_commodities_api.py`, `test_community_api.py`, etc.
- Approach: Full request/response cycle with TestClient
- Markers: `@pytest.mark.integration` (or default)

Example pattern:
```python
@pytest.mark.integration
def test_get_current_user(client, test_token, test_user):
    """Test GET /users/me with valid token."""
    headers = get_auth_headers(test_token)
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)
```

**Component Tests (Frontend):**
- Scope: React component rendering and user interaction
- Files: `src/components/ui/__tests__/Button.test.tsx`, etc.
- Approach: Render with test-utils, query elements, simulate user actions

Example pattern:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('responds to clicks', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

**Service Tests (Frontend):**
- Scope: API service functions (auth, commodities, prices, etc.)
- Files: `src/services/__tests__/*.test.ts`
- Approach: Mock axios/api client, test service method logic

Example pattern:
```typescript
describe('Commodities Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch commodities list', async () => {
    const mockCommodities = [
      { id: '1', name: 'Rice', category: 'Grains' }
    ];
    vi.mocked(api.get).mockResolvedValue({ data: mockCommodities });

    const result = await commoditiesService.getAll();

    expect(api.get).toHaveBeenCalledWith('/commodities/');
    expect(result).toEqual(mockCommodities);
  });
});
```

**Page Tests (Frontend):**
- Scope: Full page behavior with mocked services
- Files: `src/app/dashboard/__tests__/page.test.tsx`, `src/app/login/__tests__/page.test.tsx`
- Approach: Render page component with mocks, test routing/display logic

## Common Patterns

**Async Testing (Backend):**
```python
@pytest.mark.asyncio
async def test_async_function():
    """Test async function."""
    result = await some_async_function()
    assert result is not None
```

**Async Testing (Frontend):**
```typescript
it('should fetch data', async () => {
    const { result } = renderHook(() => useQuery({...}));

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(expectedData);
});
```

**Error Testing (Backend):**
```python
def test_verify_otp_invalid(client, test_user):
    """Test OTP verification with invalid code."""
    headers = get_auth_headers(test_token)
    data = {
        "phone_number": test_user.phone_number,
        "otp": "000000"  # Wrong OTP
    }
    response = client.post("/auth/verify-otp", json=data, headers=headers)
    assert response.status_code == 400
    assert "Invalid OTP" in response.json()["detail"]
```

**Error Testing (Frontend):**
```typescript
it('should handle API errors', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

    await expect(authService.verifyOtp('9876543210', '123456'))
        .rejects.toThrow('Network error');
});
```

**Database State Testing (Backend):**
```python
def test_commodity_soft_delete(client, test_admin_token, test_commodity):
    """Test soft delete sets deleted_at timestamp."""
    headers = get_auth_headers(test_admin_token)
    response = client.delete(f"/commodities/{test_commodity.id}", headers=headers)
    assert response.status_code == 204

    # Verify soft delete (record still in DB)
    response = client.get(f"/commodities/{test_commodity.id}")
    assert response.status_code == 404  # Not found due to filter
```

**Mocking localStorage (Frontend):**
```typescript
beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        },
        writable: true,
        configurable: true,
    });
});
```

---

*Testing analysis: 2026-02-23*
