from datetime import datetime, timezone
from app.database.session import SessionLocal
from app.models.otp_request import OTPRequest

db = SessionLocal()
req = db.query(OTPRequest).order_by(OTPRequest.created_at.desc()).first()

if req:
    now = datetime.now(timezone.utc)
    created = req.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    
    diff = (now - created).total_seconds()
    
    print(f"Phone: {req.phone_number}")
    print(f"Created: {req.created_at}")
    print(f"Created (tz-aware): {created}")
    print(f"Now: {now}")
    print(f"Diff (seconds): {diff}")
else:
    print("No OTP requests found")
