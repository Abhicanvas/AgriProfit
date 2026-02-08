import sys
sys.path.insert(0, 'c:\\Users\\alame\\Desktop\\repo-root\\backend')

from app.database.session import SessionLocal
from app.models.price_forecast import PriceForecast
from datetime import date

db = SessionLocal()

# Count future forecasts (today and onwards)
count = db.query(PriceForecast).filter(
    PriceForecast.forecast_date >= date.today()
).count()

# Count total forecasts
total = db.query(PriceForecast).count()

print(f"Future forecasts (>= {date.today()}): {count}")
print(f"Total forecasts in database: {total}")

# Get detailed info about ALL forecasts to check legitimacy
if total > 0:
    print("\n=== ALL FORECASTS (checking model_version & confidence_level) ===")
    all_forecasts = db.query(PriceForecast).order_by(PriceForecast.forecast_date.desc()).all()
    for f in all_forecasts:
        print(f"  Date: {f.forecast_date}, Price: {f.predicted_price}, "
              f"Model: {f.model_version or 'NONE'}, Confidence: {f.confidence_level or 'NONE'}")

db.close()
