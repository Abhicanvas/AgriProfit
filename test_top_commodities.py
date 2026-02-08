import sys
sys.path.append('c:/Users/alame/Desktop/repo-root/backend')

from app.database.session import SessionLocal
from app.commodities.service import CommodityService

db = SessionLocal()
service = CommodityService(db)

print("Fetching top 5 commodities sorted by 1-day price change (desc)...\n")

result = service.get_all_with_prices(
    limit=5,
    sort_by='change',
    sort_order='desc'
)

print(f"{'Name':<25} {'Price':>10} {'1d Change':>10}")
print("-" * 50)

for c in result['commodities']:
    name = c['name']
    price = c['current_price']
    change = c['price_change_1d']
    
    if price is not None and change is not None:
        print(f"{name:<25} ₹{price:>9.2f} {change:>+9.2f}%")
    elif price is not None:
        print(f"{name:<25} ₹{price:>9.2f}     No data")
    else:
        print(f"{name:<25}   No price data")

db.close()
