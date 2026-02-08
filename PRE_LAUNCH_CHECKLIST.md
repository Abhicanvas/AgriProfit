# AgriProfit V1 - Pre-Launch Checklist

**Version:** 1.0.0
**Target Launch:** TBD
**Last Updated:** February 1, 2026

---

## Critical Blockers (Must Complete)

### Backend Core

- [ ] **SMS Integration** - Integrate Fast2SMS or Twilio for OTP delivery
  - [ ] Add SMS provider implementation in `backend/app/auth/service.py`
  - [ ] Test OTP flow end-to-end with real phone numbers
  - [ ] Configure rate limiting for SMS sending
  - [ ] Add fallback/retry logic for delivery failures

- [ ] **Upload Security** - Add file ownership tracking
  - [ ] Create uploads database model
  - [ ] Run Alembic migration
  - [ ] Update upload routes with ownership checks
  - [ ] Test authorization for file deletion

### Deployment

- [ ] **Create Backend Dockerfile**
  - [ ] Test local build: `docker build -t agriprofit-backend ./backend`
  - [ ] Verify container runs correctly

- [ ] **Create Frontend Dockerfile**
  - [ ] Test local build: `docker build -t agriprofit-frontend ./frontend`
  - [ ] Verify container runs correctly

- [ ] **Test Docker Compose**
  - [ ] Run: `docker-compose -f docker-compose.prod.yml up`
  - [ ] Verify all services start
  - [ ] Test inter-service communication

---

## High Priority (Should Complete)

### Backend Fixes

- [ ] **Fix UUID Validation** - Return 400 for invalid UUIDs
  - [ ] Update `backend/app/prices/service.py:270`
  - [ ] Add unit test for validation

- [ ] **Connect Image Upload** - Enable community post images
  - [ ] Update `frontend/src/app/community/page.tsx:260`
  - [ ] Test image upload flow

- [ ] **Add Missing __init__.py Files**
  - [ ] `backend/app/inventory/__init__.py`
  - [ ] `backend/app/sales/__init__.py`
  - [ ] `backend/app/analytics/__init__.py`

### Frontend Features

- [ ] **Create Admin Page** (Can defer if admin uses API directly)
  - [ ] `frontend/src/app/admin/page.tsx`
  - [ ] `frontend/src/app/admin/loading.tsx`
  - [ ] Admin route protection

---

## Testing Verification

### Backend Tests

- [ ] Run all tests: `cd backend && pytest -v`
- [ ] Verify no failures
- [ ] Check coverage: `pytest --cov=app --cov-report=term-missing`
- [ ] Target: >80% coverage

### Frontend Tests

- [ ] Run all tests: `cd frontend && npm test`
- [ ] Verify no failures
- [ ] Check for console errors/warnings

### Integration Tests

- [ ] **User Flow: Registration → Dashboard**
  - [ ] Request OTP
  - [ ] Verify OTP
  - [ ] Access dashboard
  - [ ] View commodities

- [ ] **User Flow: Inventory → Sale**
  - [ ] Add inventory item
  - [ ] View inventory list
  - [ ] Sell from inventory
  - [ ] View sales history

- [ ] **User Flow: Transport Calculator**
  - [ ] Enter form data
  - [ ] Submit calculation
  - [ ] View multi-mandi comparison
  - [ ] Verify net profit calculation

- [ ] **User Flow: Community**
  - [ ] Create post
  - [ ] Reply to post
  - [ ] Upvote post
  - [ ] Edit own post
  - [ ] Delete own post

- [ ] **User Flow: Notifications**
  - [ ] View notification bell
  - [ ] Open notification dropdown
  - [ ] Mark as read
  - [ ] View all notifications page

---

## Security Checklist

### Authentication

- [ ] JWT tokens expire correctly (24 hours)
- [ ] Invalid tokens return 401
- [ ] Deleted users cannot authenticate
- [ ] OTP expires after 5 minutes
- [ ] OTP rate limiting works (1/minute)

### Authorization

- [ ] Admin endpoints require admin role
- [ ] Users can only edit/delete own posts
- [ ] Users can only view/edit own inventory
- [ ] Users can only view own notifications

### Input Validation

- [ ] All endpoints validate request bodies
- [ ] File uploads validate type and size
- [ ] SQL injection not possible (test with `'; DROP TABLE users;--`)
- [ ] XSS not possible (test with `<script>alert('xss')</script>`)

### Configuration

- [ ] No secrets in source code
- [ ] `.env` files are gitignored
- [ ] Production uses strong JWT_SECRET_KEY
- [ ] DEBUG=false in production
- [ ] CORS configured for specific domains (not `*`)

---

## Performance Checklist

### Backend

- [ ] Database has indexes on:
  - [ ] users.phone
  - [ ] users.email
  - [ ] community_posts.category
  - [ ] community_posts.created_at
  - [ ] price_history.commodity_id
  - [ ] price_history.date
  - [ ] inventory.user_id
  - [ ] sales.user_id

- [ ] Connection pooling configured
- [ ] Slow query logging enabled

### Frontend

- [ ] Build succeeds without errors: `npm run build`
- [ ] No console errors in production build
- [ ] Images are optimized
- [ ] Bundle size reasonable (<500KB initial)

---

## Documentation Checklist

- [ ] **README.md** - Updated with:
  - [ ] Project description
  - [ ] Tech stack
  - [ ] Setup instructions
  - [ ] Deployment guide

- [ ] **API_CONTRACT.md** - Accurate and up-to-date
  - [ ] All endpoints documented
  - [ ] Request/response schemas correct
  - [ ] Authentication documented

- [ ] **.env.example** - All variables documented
  - [ ] Backend variables
  - [ ] Frontend variables
  - [ ] Comments explain each variable

---

## Infrastructure Checklist

### Database

- [ ] PostgreSQL 15+ installed/provisioned
- [ ] Database created: `agriprofit_prod`
- [ ] User with limited permissions created
- [ ] Connection string configured
- [ ] Alembic migrations run successfully

### Redis

- [ ] Redis installed/provisioned
- [ ] Connection URL configured
- [ ] Rate limiting tested

### Web Server

- [ ] Nginx configuration ready
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] HTTPS redirect configured
- [ ] Static file serving configured

### Monitoring

- [ ] Logging configured
- [ ] Log rotation enabled
- [ ] Error tracking (Sentry) configured
- [ ] Health check endpoint accessible

---

## Environment Variables

### Backend (.env.production)

```
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/agriprofit_prod
JWT_SECRET_KEY=<generate: openssl rand -hex 32>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=<your-api-key>
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=https://agriprofit.in,https://www.agriprofit.in
HTTPS_REDIRECT=true
SENTRY_DSN=<your-sentry-dsn>
```

### Frontend (.env.production)

```
NEXT_PUBLIC_API_URL=https://api.agriprofit.in
```

---

## Final Verification

### Smoke Tests (Production)

- [ ] Health check returns 200: `GET /health`
- [ ] API docs accessible: `GET /docs` (disable in production)
- [ ] Frontend loads without errors
- [ ] Login flow works with real SMS
- [ ] Dashboard displays data
- [ ] All navigation links work

### Rollback Plan

- [ ] Database backup created before migration
- [ ] Previous container images tagged
- [ ] Rollback procedure documented
- [ ] DNS TTL lowered (if applicable)

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Security | | | |
| DevOps | | | |
| Product Owner | | | |

---

## Launch Execution

1. [ ] All checklists completed above
2. [ ] Team notified of launch window
3. [ ] Monitoring dashboards open
4. [ ] Support team briefed
5. [ ] Run database migrations
6. [ ] Deploy backend containers
7. [ ] Deploy frontend containers
8. [ ] Run smoke tests
9. [ ] Monitor for 30 minutes
10. [ ] Announce launch

---

*Generated by Claude Code audit on February 1, 2026*
