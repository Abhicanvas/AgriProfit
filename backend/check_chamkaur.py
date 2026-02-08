#!/usr/bin/env python3
"""Get Chamkaur Sahib Tomato prices."""
from app.database.session import SessionLocal
from app.models.price_history import PriceHistory
from app.models.commodity import Commodity
from app.models.mandi import Mandi

db = SessionLocal()

# Find Tomato commodity
tomato = db.query(Commodity).filter(Commodity.name.ilike('tomato')).first()

if not tomato:
    print("Tomato commodity not found")
    db.close()
    exit()

# Find Chamkaur Sahib APMC mandi
mandi = db.query(Mandi).filter(Mandi.name.ilike('%chamkaur%')).first()

if not mandi:
    print("Chamkaur Sahib APMC mandi not found")
    # List all mandis with 'champ' or similar
    mandis = db.query(Mandi).filter(Mandi.name.ilike('%chauk%')).all()
    print(f"Found {len(mandis)} mandis with 'chauk':")
    for m in mandis[:5]:
        print(f"  - {m.name}")
    db.close()
    exit()

# Get latest prices for this commodity at this mandi
prices = db.query(PriceHistory).filter(
    PriceHistory.commodity_id == tomato.id,
    PriceHistory.mandi_id == mandi.id
).order_by(PriceHistory.price_date.desc()).limit(10).all()

print("=" * 80)
print(f"CHAMKAUR SAHIB - TOMATO PRICES (Latest)")
print("=" * 80)

if prices:
    for price in prices:
        print(f"\nDate: {price.price_date}")
        print(f"  Modal Price: ₹{price.modal_price} per quintal = ₹{float(price.modal_price) / 100:.2f}/kg")
        print(f"  Min: ₹{price.min_price} per quintal = ₹{float(price.min_price) / 100:.2f}/kg")
        print(f"  Max: ₹{price.max_price} per quintal = ₹{float(price.max_price) / 100:.2f}/kg")
else:
    print("No price data found for this commodity/mandi combination")

db.close()
