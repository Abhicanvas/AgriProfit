import sys
sys.path.insert(0, 'c:\\Users\\alame\\Desktop\\repo-root\\backend')

from app.database.session import SessionLocal
from app.commodities.service import CommodityService

db = SessionLocal()
service = CommodityService(db)

result = service.get_all_with_prices(
    sort_by="price",
    sort_order="desc",
    skip=0,
    limit=5
)

print("=== TOP 5 HIGHEST PRICED (from service.get_all_with_prices) ===\n")
for commodity in result["commodities"]:
    price = commodity["current_price"]
    name = commodity["name"]
    if price:
        print(f"{name:25s} ₹{price:,.2f}")
    else:
        print(f"{name:25s} No price data")

db.close()
