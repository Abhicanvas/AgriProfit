import sys
sys.path.insert(0, 'c:/Users/alame/Desktop/repo-root/backend')

from app.database.session import SessionLocal
from app.commodities.service import CommodityService

db = SessionLocal()
service = CommodityService(db)

# Call the method we just fixed
print("Testing _get_commodity_prices_from_db() method...")
prices = service._get_commodity_prices_from_db()

# Check key commodities
commodities_to_check = ['tomato', 'rice', 'wheat', 'onion', 'potato']

for name in commodities_to_check:
    if name in prices:
        data = prices[name]
        print(f"\n{name.title()}:")
        print(f"  Current Price: ₹{data['price']:.2f}")
        print(f"  1-day change: {data['change_1d']:.2f}%")
    else:
        print(f"\n{name.title()}: NOT FOUND")

db.close()
