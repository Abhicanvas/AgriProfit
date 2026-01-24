import secrets
import string
from datetime import datetime, timedelta


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def generate_otp_expiry(minutes: int = 5) -> datetime:
    """Generate OTP expiry timestamp."""
    return datetime.utcnow() + timedelta(minutes=minutes)


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