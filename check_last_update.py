import sys
sys.path.insert(0, 'c:\\Users\\alame\\Desktop\\repo-root\\backend')

from app.database.session import SessionLocal
from app.models import PriceHistory
from sqlalchemy import desc
from datetime import datetime, timezone

db = SessionLocal()

# Get the most recent price update
latest_price = db.query(PriceHistory).order_by(desc(PriceHistory.created_at)).first()

if latest_price:
    print(f"Most recent price record:")
    print(f"  Created at: {latest_price.created_at}")
    print(f"  Price date: {latest_price.price_date}")
    
    # Calculate hours since update (same logic as backend)
    if latest_price.created_at.tzinfo is None:
        last_updated = latest_price.created_at.replace(tzinfo=timezone.utc)
    else:
        last_updated = latest_price.created_at
    
    now = datetime.now(timezone.utc)
    hours_since = (now - last_updated).total_seconds() / 3600
    
    print(f"\nCurrent time (UTC): {now}")
    print(f"Hours since last update: {hours_since:.2f} hours")
    print(f"Rounded: {round(hours_since)} hours")
    print(f"Is stale (>24h): {hours_since > 24}")

db.close()
