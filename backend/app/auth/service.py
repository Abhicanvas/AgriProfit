from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import User, OTPRequest
from app.auth.security import hash_value, verify_hashed_value, create_access_token
from app.auth.otp import is_otp_expired


class AuthService:
    """Service class for authentication operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_phone(self, phone_number: str) -> User | None:
        """Get user by phone number."""
        return self.db.query(User).filter(
            User.phone_number == phone_number,
            User.deleted_at.is_(None),
        ).first()

    def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID."""
        return self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None),
        ).first()

    def create_user(self, phone_number: str, role: str = "farmer") -> User:
        """Create a new user."""
        try:
            user = User(
                phone_number=phone_number,
                role=role,
                language="en",
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception:
            self.db.rollback()
            raise

    def get_or_create_user(self, phone_number: str) -> tuple[User, bool]:
        """Get existing user or create new one. Returns (user, is_new)."""
        user = self.get_user_by_phone(phone_number)
        if user:
            return user, False
        return self.create_user(phone_number), True

    def _invalidate_old_otps_no_commit(self, phone_number: str) -> None:
        """Mark all previous unverified OTPs as used (no commit)."""
        self.db.query(OTPRequest).filter(
            OTPRequest.phone_number == phone_number,
            OTPRequest.verified == False,
        ).update({"verified": True})

    def invalidate_old_otps(self, phone_number: str) -> None:
        """Mark all previous unverified OTPs as used (with commit)."""
        try:
            self._invalidate_old_otps_no_commit(phone_number)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def create_otp_request(
        self,
        phone_number: str,
        otp: str,
        expires_at: datetime,
    ) -> OTPRequest:
        """Create a new OTP request (atomic: invalidates old OTPs + creates new)."""
        try:
            # Invalidate old OTPs (no commit yet)
            self._invalidate_old_otps_no_commit(phone_number)

            # Create new OTP request
            otp_hash = hash_value(otp)
            otp_request = OTPRequest(
                phone_number=phone_number,
                otp_hash=otp_hash,
                expires_at=expires_at,
            )
            self.db.add(otp_request)
            
            # Single atomic commit
            self.db.commit()
            self.db.refresh(otp_request)
            return otp_request
        except Exception:
            self.db.rollback()
            raise

    def get_latest_otp_request(self, phone_number: str) -> OTPRequest | None:
        """Get the latest OTP request for a phone number."""
        return self.db.query(OTPRequest).filter(
            OTPRequest.phone_number == phone_number,
        ).order_by(OTPRequest.created_at.desc()).first()

    def verify_otp(self, phone_number: str, otp: str) -> tuple[bool, str]:
        """
        Verify OTP for a phone number.
        Returns (success, message).
        """
        otp_request = self.get_latest_otp_request(phone_number)

        if not otp_request:
            return False, "No OTP request found"

        if is_otp_expired(otp_request.expires_at):
            return False, "OTP has expired"

        if otp_request.verified:
            return False, "OTP has already been used"

        if not verify_hashed_value(otp, otp_request.otp_hash):
            return False, "Invalid OTP"

        # Mark OTP as used
        try:
            otp_request.verified = True
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return True, "OTP verified successfully"

    def generate_tokens(self, user: User) -> dict:
        """Generate access token for user."""
        access_token = create_access_token(
            data={"sub": str(user.id), "phone": user.phone_number, "role": user.role}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    def can_request_otp(self, phone_number: str, cooldown_seconds: int = 60) -> tuple[bool, int]:
        """
        Check if user can request a new OTP (cooldown check).
        Returns (can_request, seconds_remaining).
        """
        otp_request = self.get_latest_otp_request(phone_number)

        if not otp_request:
            return True, 0

        time_since_request = datetime.utcnow() - otp_request.created_at
        seconds_elapsed = time_since_request.total_seconds()

        if seconds_elapsed < cooldown_seconds:
            seconds_remaining = int(cooldown_seconds - seconds_elapsed)
            return False, seconds_remaining

        return True, 0