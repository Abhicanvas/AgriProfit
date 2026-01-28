"""
Rate limiting configuration for API endpoints.

This module provides:
- Configurable rate limiters for different endpoint tiers
- Memory storage for development, Redis for production
- Custom key functions for IP and user-based limiting
"""
from typing import Callable, Optional

from fastapi import Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

from app.core.config import settings


# =============================================================================
# CONFIGURATION (from centralized settings)
# =============================================================================

# Rate limit tiers (requests per minute unless specified)
RATE_LIMIT_CRITICAL = settings.rate_limit_critical  # Auth endpoints
RATE_LIMIT_WRITE = settings.rate_limit_write  # POST/PUT/DELETE
RATE_LIMIT_READ = settings.rate_limit_read  # GET endpoints
RATE_LIMIT_ANALYTICS = settings.rate_limit_analytics  # Analytics


# =============================================================================
# KEY FUNCTIONS
# =============================================================================

def get_request_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.

    Uses user ID if authenticated, falls back to IP address.
    This prevents authenticated users from being limited by shared IPs
    while still protecting against anonymous abuse.
    """
    # Try to get user from request state (set by auth middleware)
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "id"):
        return f"user:{user.id}"

    # Fall back to IP address
    return f"ip:{get_remote_address(request)}"


def get_ip_address(request: Request) -> str:
    """Get client IP address for rate limiting."""
    return f"ip:{get_remote_address(request)}"


def get_phone_number(request: Request) -> str:
    """
    Get phone number from request body for OTP rate limiting.

    Falls back to IP if phone number not available.
    """
    # For OTP endpoints, we want to limit by phone number
    # This is handled specially in the route decorator
    return get_ip_address(request)


# =============================================================================
# LIMITER INITIALIZATION
# =============================================================================

def create_limiter() -> Limiter:
    """
    Create and configure the rate limiter.

    Uses Redis in production for distributed rate limiting,
    falls back to in-memory storage for development.
    """
    return Limiter(
        key_func=get_request_identifier,
        default_limits=[RATE_LIMIT_READ],
        storage_uri=settings.rate_limit_storage_uri,
        strategy="fixed-window",  # or "moving-window" for smoother limiting
        headers_enabled=True,  # Add X-RateLimit-* headers to responses
    )


# Global limiter instance
limiter = create_limiter()


# =============================================================================
# RATE LIMIT DECORATORS
# =============================================================================

# Pre-configured decorators for common rate limit tiers
critical_limit = limiter.limit(RATE_LIMIT_CRITICAL, key_func=get_ip_address)
write_limit = limiter.limit(RATE_LIMIT_WRITE)
read_limit = limiter.limit(RATE_LIMIT_READ)
analytics_limit = limiter.limit(RATE_LIMIT_ANALYTICS)


# =============================================================================
# ERROR HANDLER
# =============================================================================

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Custom handler for rate limit exceeded errors.

    Returns a JSON response with:
    - 429 status code
    - Retry-After header
    - Clear error message
    """
    # Parse the limit string to get retry time
    # exc.detail contains the limit info
    retry_after = 60  # Default to 60 seconds

    # Try to extract actual retry time from the exception
    if hasattr(exc, "retry_after"):
        retry_after = exc.retry_after

    response = JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please slow down your requests.",
            "error": "rate_limit_exceeded",
            "retry_after_seconds": retry_after,
            "limit": str(exc.detail) if hasattr(exc, "detail") else "Unknown",
        },
    )

    response.headers["Retry-After"] = str(retry_after)
    response.headers["X-RateLimit-Limit"] = str(exc.detail) if hasattr(exc, "detail") else "Unknown"

    return response


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_rate_limit_status(request: Request) -> dict:
    """
    Get current rate limit status for a request.

    Useful for debugging and monitoring.
    """
    key = get_request_identifier(request)
    return {
        "key": key,
        "limits": {
            "critical": RATE_LIMIT_CRITICAL,
            "write": RATE_LIMIT_WRITE,
            "read": RATE_LIMIT_READ,
            "analytics": RATE_LIMIT_ANALYTICS,
        }
    }
