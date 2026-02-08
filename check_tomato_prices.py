import sys
sys.path.insert(0, 'c:/Users/alame/Desktop/repo-root/backend')

from app.database.session import SessionLocal
from app.models.commodity import Commodity
from app.models.price_history import PriceHistory
from sqlalchemy import func, desc

db = SessionLocal()

# Find Tomato commodity
tomato = db.query(Commodity).filter(Commodity.name == "Tomato").first()
if tomato:
    print(f"Tomato ID: {tomato.id}")
    print(f"Unit: {tomato.unit}")
    print(f"\nLast 5 price records:")
    
    prices = db.query(PriceHistory).filter(
        PriceHistory.commodity_id == tomato.id
    ).order_by(desc(PriceHistory.price_date)).limit(5).all()
    
    for p in prices:
        print(f"{p.price_date}: ₹{p.modal_price:.2f} (mandi: {p.mandi_name})")
    
    # Get national average for last date
    latest_date = prices[0].price_date if prices else None
    if latest_date:
        avg_price = db.query(func.avg(PriceHistory.modal_price)).filter(
            PriceHistory.commodity_id == tomato.id,
            PriceHistory.price_date == latest_date
        ).scalar()
        print(f"\nNational average for {latest_date}: ₹{avg_price:.2f}")
        
        # Apply conversion
        if avg_price < 200:
            converted = avg_price * 100
            print(f"Converted to quintal: ₹{converted:.2f}")
        else:
            print(f"Already in quintal: ₹{avg_price:.2f}")
else:
    print("Tomato not found")

db.close()
