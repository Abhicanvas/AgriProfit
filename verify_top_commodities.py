import sys
sys.path.append('c:/Users/alame/Desktop/repo-root/backend')

from app.database.session import SessionLocal
from app.models import PriceHistory, Commodity
from sqlalchemy import func

db = SessionLocal()

commodities = ['Tomato', 'Onion', 'Wheat', 'Rice', 'Potato']

print("Verifying Top Commodities Price Changes:\n")
print(f"{'Commodity':<12} {'Latest Date':<12} {'Current ₹':<12} {'Prev ₹':<12} {'Change %':<12} {'Status'}")
print("-" * 80)

for name in commodities:
    commodity = db.query(Commodity).filter(Commodity.name == name).first()
    if not commodity:
        print(f"{name:<12} NOT FOUND")
        continue
    
    # Get last 2 dates with data (national average)
    recent = db.query(
        PriceHistory.price_date,
        func.avg(PriceHistory.modal_price).label('avg_price')
    ).filter(
        PriceHistory.commodity_id == commodity.id
    ).group_by(
        PriceHistory.price_date
    ).order_by(
        PriceHistory.price_date.desc()
    ).limit(2).all()
    
    if len(recent) < 2:
        print(f"{name:<12} Insufficient data")
        continue
    
    current_date = recent[0].price_date
    current_price = float(recent[0].avg_price)
    prev_price = float(recent[1].avg_price)
    
    # Apply unit conversion (prices < 200 are in kg, multiply by 100)
    if current_price < 200:
        current_price = current_price * 100
    if prev_price < 200:
        prev_price = prev_price * 100
    
    # Calculate change
    change = ((current_price - prev_price) / prev_price) * 100
    
    # Expected values from screenshot
    expected = {
        'Tomato': (3700, 71.05),
        'Onion': (2700, 6.14),
        'Wheat': (2555, -0.69),
        'Rice': (3400, -8.96),
        'Potato': (1200, -38.44)
    }
    
    exp_price, exp_change = expected.get(name, (0, 0))
    price_match = abs(current_price - exp_price) < 50
    change_match = abs(change - exp_change) < 1
    
    status = "✓ ACCURATE" if (price_match and change_match) else "✗ MISMATCH"
    
    print(f"{name:<12} {current_date!s:<12} ₹{current_price:<11.2f} ₹{prev_price:<11.2f} {change:<+11.2f}% {status}")

db.close()
