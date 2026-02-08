# Manual Testing - Bug Report

## Bug #1: Backend ignores test_otp configuration
**Severity**: Critical
**Test Script**: 1 (Registration Flow)
**Steps to Reproduce**:
1. Configure `enable_test_otp=True` and `test_otp="123456"` in `app/core/config.py`.
2. Send request to `/auth/request-otp`.
3. Check `app/auth/routes.py`.

**Expected Behavior**:
The backend should use the configured `test_otp` (123456) when enabled, allowing manual testing without SMS integration.

**Actual Behavior**:
The backend unconditionally generated a random OTP, making manual testing impossible without access to server logs.

**Resolution**:
Fixed by adding conditional logic in `app/auth/routes.py` to respect `settings.test_otp`.

**Status**: Fixed

---

## Bug #2: Transport Calculation Vehicle Types
**Severity**: Low
**Test Script**: 5 (Transport Calculator)
**Observation**:
Hardcoded vehicle types in `app/transport/routes.py` (`tempo`, `truck_small`, `truck_large`) may not match frontend dropdowns if they differ. Frontend uses `VehicleType` enum, backend uses string mapping.
**Recommendation**: Ensure frontend sends lowercase vehicle types matching backend map.

---

## Code Verification Summary
Due to environment limitations preventing full interactive API testing, the following modules were verified via Static Code Analysis:

1.  **Registration & Auth**: Verified `app/auth/routes.py`. Bug #1 found and fixed. Profile completion logic relies on Pydantic validation (verified schemas).
2.  **Commodities**: Verified `app/commodities/routes.py`. Pagination, filtering, and search logic implemented correctly.
3.  **Mandis**: Verified `app/mandi/routes.py`. Distance calculation and filtering logic implemented.
4.  **Transport**: Verified `app/transport/routes.py`. logic for cost calculation and comparison looks correct.
5.  **Admin**: Verified `app/admin/routes.py`. Role-based access control and audit logging implemented.

**Conclusion**: The backend appears functionally complete and robust, with the critical blocking bug resolved.
