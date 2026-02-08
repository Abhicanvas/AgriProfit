# AgriProfit V1 - Prioritized Action Items

**Generated:** February 1, 2026
**Based on:** Comprehensive Project Audit

---

## P0 - Blockers (Must Fix Before Deployment)

### P0-1: Integrate SMS Provider for OTP Delivery

**File:** `backend/app/auth/service.py`
**Lines:** 15-20
**Current State:** Stub that logs OTP instead of sending SMS

**Current Code:**
```python
def send_otp_sms(phone_number: str, otp: str) -> bool:
    """Send OTP via SMS. This is a stub."""
    logger.info("[SMS STUB] Would send OTP to %s", phone_number)
    return True
```

**Required Fix:**
1. Choose SMS provider (Fast2SMS for India, Twilio for international)
2. Implement API integration using environment variables already defined:
   - `SMS_PROVIDER` (fast2sms or twilio)
   - `FAST2SMS_API_KEY`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
3. Add error handling for SMS delivery failures
4. Add retry logic with exponential backoff

**Example Implementation:**
```python
import httpx
from app.core.config import settings

async def send_otp_sms(phone_number: str, otp: str) -> bool:
    if settings.sms_provider == "fast2sms":
        return await send_via_fast2sms(phone_number, otp)
    elif settings.sms_provider == "twilio":
        return await send_via_twilio(phone_number, otp)
    else:
        logger.warning("No SMS provider configured, OTP: %s", otp)
        return settings.environment == "development"
```

---

### P0-2: Add Upload File Ownership Security

**File:** `backend/app/uploads/routes.py`
**Lines:** 92-93
**Current State:** No ownership check on file deletion

**Required Fix:**
1. Track file ownership in database (add `uploaded_by` field)
2. Check ownership before allowing deletion
3. Allow admins to delete any file

**Implementation Steps:**

1. Create uploads model:
```python
# backend/app/models/upload.py
class Upload(Base):
    __tablename__ = "uploads"

    id = Column(UUID, primary_key=True, default=uuid4)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    uploaded_by = Column(UUID, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
```

2. Create migration for uploads table

3. Update delete endpoint:
```python
@router.delete("/images/{filename}")
async def delete_image(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload = db.query(Upload).filter(Upload.filename == filename).first()
    if not upload:
        raise HTTPException(404, "File not found")

    if upload.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized to delete this file")

    # Proceed with deletion
    ...
```

---

## P1 - Critical (Should Fix Before Deployment)

### P1-1: Create Admin Dashboard Page

**Location:** `frontend/src/app/admin/page.tsx` - DOES NOT EXIST
**Impact:** Administrators cannot access admin features via UI

**Required Files:**
1. `frontend/src/app/admin/page.tsx` - Main admin dashboard
2. `frontend/src/app/admin/loading.tsx` - Loading state
3. `frontend/src/services/admin.ts` - Admin API service

**Features to Include:**
- User management table (list, search, ban/unban)
- Post moderation (view flagged posts, delete)
- System statistics display
- Admin-only route protection

**Implementation:**
```tsx
// frontend/src/app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return <AdminDashboard />;
}
```

---

### P1-2: Connect Community Image Upload

**File:** `frontend/src/app/community/page.tsx`
**Lines:** 260-261
**Current State:** Image URL parameter commented out

**Current Code:**
```javascript
// TODO: Pass image_url when backend supports it
// image_url: imageUrl,
```

**Required Fix:**
```javascript
const response = await communityService.createPost({
  title: title.trim(),
  content: content.trim(),
  category: category as PostCategory,
  image_url: imageUrl || undefined,  // Enable image upload
});
```

---

### P1-3: Fix Invalid UUID Silent Failure

**File:** `backend/app/prices/service.py`
**Line:** 270
**Current State:** Invalid UUID silently ignored

**Current Code:**
```python
pass # Ignore invalid UUID if not "all"
```

**Required Fix:**
```python
from fastapi import HTTPException

# Instead of pass:
raise HTTPException(
    status_code=400,
    detail=f"Invalid mandi_id format: {mandi_id}"
)
```

---

## P2 - Important (Can Defer to v1.1)

### P2-1: Add Missing __init__.py Files

**Locations:**
- `backend/app/inventory/__init__.py`
- `backend/app/sales/__init__.py`
- `backend/app/analytics/__init__.py`

**Fix:**
```python
# backend/app/inventory/__init__.py
from .routes import router

__all__ = ["router"]
```

---

### P2-2: Create uploads/schemas.py

**File:** `backend/app/uploads/schemas.py` - MISSING

**Implementation:**
```python
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class UploadResponse(BaseModel):
    id: UUID
    filename: str
    url: str
    uploaded_by: UUID
    created_at: datetime

class UploadListResponse(BaseModel):
    uploads: list[UploadResponse]
    total: int
```

---

### P2-3: Clean Up Duplicate mandi/mandis Directories

**Issue:** Both exist:
- `backend/app/mandi/` (active, 4 files)
- `backend/app/mandis/` (legacy, only schemas.py)

**Fix:**
1. Verify `mandis/schemas.py` content is covered by `mandi/schemas.py`
2. Remove `backend/app/mandis/` directory
3. Update any imports if needed

---

### P2-4: Add Commodity Detail Page

**File:** `frontend/src/app/commodities/[id]/page.tsx` - MISSING
**Reference:** `frontend/src/app/commodities/page.tsx:99`

**Implementation:**
```tsx
// frontend/src/app/commodities/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { commoditiesService } from "@/services/commodities";

export default function CommodityDetailPage() {
  const { id } = useParams();
  const { data: commodity, isLoading } = useQuery({
    queryKey: ["commodity", id],
    queryFn: () => commoditiesService.getCommodity(id as string),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!commodity) return <div>Commodity not found</div>;

  return (
    <div>
      <h1>{commodity.name}</h1>
      {/* Price history, charts, etc. */}
    </div>
  );
}
```

---

### P2-5: Add Mandi Detail Page

**File:** `frontend/src/app/mandis/[id]/page.tsx` - MISSING
**Reference:** `frontend/src/app/mandis/page.tsx:91`

**Implementation:** Similar to commodity detail page

---

### P2-6: Create Dockerfiles

**File 1:** `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File 2:** `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

---

## P3 - Minor (Nice to Have)

### P3-1: Improve Transport Test Coverage

**File:** `frontend/src/app/transport/__tests__/page.test.tsx`
**Line:** 134

**Current:**
```javascript
// TODO: Just verify inputs exist...
// BETTER: Implement the happy path with mocks.
```

**Fix:** Add comprehensive happy path tests with MSW mocks

---

### P3-2: Update README.md

**File:** `README.md`
**Current:** Contains only "# Begu"

**Required Content:**
- Project description
- Tech stack overview
- Setup instructions (development)
- Deployment guide
- API documentation link
- Contributing guidelines
- License

---

### P3-3: Add Frontend Loading States

**Missing loading.tsx in:**
- `/inventory/loading.tsx`
- `/sales/loading.tsx`

---

### P3-4: Add useAuth Hook Implementation

**File:** `frontend/src/hooks/useAuth.ts`
**Current:** Empty stub returning `{}`

**Fix:** Implement proper auth hook or remove if unused

---

## Summary by Priority

| Priority | Count | Status |
|----------|-------|--------|
| P0 - Blockers | 2 | Must fix |
| P1 - Critical | 3 | Should fix |
| P2 - Important | 6 | Can defer |
| P3 - Minor | 4 | Nice to have |
| **TOTAL** | **15** | |

---

## Recommended Order of Execution

1. **P0-1** SMS Integration (backend auth functional)
2. **P0-2** Upload Ownership Security (security fix)
3. **P2-6** Create Dockerfiles (deployment prerequisite)
4. **P1-2** Connect Image Upload (quick frontend fix)
5. **P1-3** Fix UUID Validation (quick backend fix)
6. **P2-1** Add __init__.py files (cleanup)
7. **P2-3** Clean up duplicate directories (cleanup)
8. **P1-1** Admin Dashboard (larger feature)
9. **P3-2** Update README (documentation)
10. Remaining P2/P3 items as time permits

---

*Generated by Claude Code audit on February 1, 2026*
