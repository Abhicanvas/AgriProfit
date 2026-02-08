import sys
sys.path.insert(0, 'c:\\Users\\alame\\Desktop\\repo-root\\backend')

from app.database.session import SessionLocal
from app.models import Commodity, PriceHistory
from sqlalchemy import func
from datetime import date

db = SessionLocal()

# Get all commodities with their latest national average prices
query = db.query(
    Commodity.name,
    func.avg(PriceHistory.modal_price).label('avg_price')
).join(
    PriceHistory, Commodity.id == PriceHistory.commodity_id
).filter(
    PriceHistory.price_date == date.today()
).group_by(
    Commodity.id, Commodity.name
).order_by(
    func.avg(PriceHistory.modal_price).desc()
)

results = query.limit(10).all()

print("=== TOP 10 HIGHEST PRICED COMMODITIES (National Average, Today) ===\n")
for i, (name, price) in enumerate(results, 1):
    # Apply the same conversion logic as the backend
    price_float = float(price)
    if price_float < 200:
        converted_price = price_float * 100
    else:
        converted_price = price_float
    
    print(f"{i}. {name:20s} ₹{converted_price:,.2f}")

print("\n=== Expected Top 5 from Dashboard ===")
print("1. Rice             ₹3,363.33")
print("2. Onion            ₹2,556.25")
print("3. Wheat            ₹2,500.00")
print("4. Tomato           ₹2,108.33")
print("5. Potato           ₹1,561.43")

db.close()
