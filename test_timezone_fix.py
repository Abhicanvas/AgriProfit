import sys
sys.path.insert(0, 'c:\\Users\\alame\\Desktop\\repo-root\\backend')

from app.database.session import SessionLocal
from app.analytics.service import AnalyticsService

db = SessionLocal()
service = AnalyticsService(db)

summary = service.get_market_summary()

print("=== Market Summary (After Fix) ===")
print(f"Last updated: {summary.last_updated}")
print(f"Hours since update: {summary.hours_since_update}")
print(f"Data is stale: {summary.data_is_stale}")

db.close()
