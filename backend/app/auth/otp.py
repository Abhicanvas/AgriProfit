import secrets
import string
from datetime import datetime, timedelta

from app.core.config import settings


def generate_otp(length: int | None = None) -> str:
    """Generate a cryptographically secure numeric OTP."""
    otp_length = length if length is not None else settings.otp_length
    return "".join(secrets.choice(string.digits) for _ in range(otp_length))


def generate_otp_expiry(minutes: int | None = None) -> datetime:
    """Generate OTP expiry timestamp."""
    expire_minutes = minutes if minutes is not None else settings.otp_expire_minutes
    return datetime.utcnow() + timedelta(minutes=expire_minutes)


def is_otp_expired(expires_at: datetime) -> bool:
    """Check if OTP has expired."""
    return datetime.utcnow() > expires_at


def mask_phone(phone: str) -> str:
    """Mask phone number for display (e.g., ******7890)."""
    if len(phone) < 4:
        return "*" * len(phone)
    return "*" * (len(phone) - 4) + phone[-4:]


def format_otp_message(otp: str, app_name: str = "KrishiMitra") -> str:
    """Format OTP message for SMS."""
    return f"Your {app_name} verification code is: {otp}. Valid for 5 minutes. Do not share this code."