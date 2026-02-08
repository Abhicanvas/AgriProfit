#!/usr/bin/env python3
"""Quick price check script."""
from app.database.session import SessionLocal
from app.models.price_history import PriceHistory
from app.models.commodity import Commodity
from app.models.mandi import Mandi

db = SessionLocal()
# Get the latest prices
prices = db.query(PriceHistory).order_by(PriceHistory.price_date.desc()).limit(5).all()

print("=" * 80)
print("LATEST PRICES IN DATABASE:")
print("=" * 80)
for price in prices:
    commodity = db.query(Commodity).filter(Commodity.id == price.commodity_id).first()
    mandi = db.query(Mandi).filter(Mandi.id == price.mandi_id).first()
    print(f"\nCommodity: {commodity.name if commodity else 'N/A'}")
    print(f"  Mandi: {mandi.name if mandi else price.mandi_name}")
    print(f"  Date: {price.price_date}")
    print(f"  Modal Price (per quintal): ₹{price.modal_price}")
    print(f"  Modal Price (per kg): ₹{float(price.modal_price) / 100:.2f}")
    print(f"  Min Price: ₹{price.min_price}")
    print(f"  Max Price: ₹{price.max_price}")

print("\n" + "=" * 80)
print("TOTAL PRICE RECORDS:", db.query(PriceHistory).count())
print("=" * 80)
db.close()
