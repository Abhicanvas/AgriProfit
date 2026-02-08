"""Test script to verify parquet data integration."""
import requests

BASE_URL = "http://localhost:8000"

def test_commodity_details():
    """Test getting commodity details with parquet data."""
    
    # First, get list of commodities
    print("=" * 80)
    print("TESTING COMMODITY DETAIL PAGE WITH PARQUET DATA")
    print("=" * 80)
    
    response = requests.get(f"{BASE_URL}/commodities?limit=5")
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Found {data.get('total', 0)} commodities")
        
        if data.get('commodities'):
            # Test first commodity's detail page
            commodity = data['commodities'][0]
            commodity_id = commodity['id']
            commodity_name = commodity['name']
            
            print(f"\nTesting commodity: {commodity_name} (ID: {commodity_id})")
            
            # Get detailed info
            detail_response = requests.get(f"{BASE_URL}/commodities/{commodity_id}")
            
            if detail_response.status_code == 200:
                details = detail_response.json()
                
                print(f"\n{'=' * 80}")
                print(f"COMMODITY DETAILS: {details['name']}")
                print(f"{'=' * 80}")
                
                print(f"\nBasic Info:")
                print(f"  Category: {details.get('category')}")
                print(f"  Unit: {details.get('unit')}")
                print(f"  Current Price: ₹{details.get('current_price')}/kg")
                
                print(f"\nPrice Changes:")
                changes = details.get('price_changes', {})
                print(f"  1 Day: {changes.get('1d')}%")
                print(f"  7 Days: {changes.get('7d')}%")
                print(f"  30 Days: {changes.get('30d')}%")
                print(f"  90 Days: {changes.get('90d')}%")
                
                print(f"\nPrice History: {len(details.get('price_history', []))} data points")
                if details.get('price_history'):
                    recent = details['price_history'][:5]
                    for record in recent:
                        print(f"  {record['date']}: ₹{record['price']}")
                
                print(f"\nTop Mandis ({len(details.get('top_mandis', []))}):")
                for mandi in details.get('top_mandis', [])[:5]:
                    print(f"  {mandi.get('name')} ({mandi.get('state')}): ₹{mandi.get('price')}/kg")
                
                print(f"\nBottom Mandis ({len(details.get('bottom_mandis', []))}):")
                for mandi in details.get('bottom_mandis', [])[:5]:
                    print(f"  {mandi.get('name')} ({mandi.get('state')}): ₹{mandi.get('price')}/kg")
                
                print(f"\nSeasonal Info:")
                seasonal = details.get('seasonal_info', {})
                print(f"  In Season: {seasonal.get('is_in_season')}")
                print(f"  Growing Months: {seasonal.get('growing_months')}")
                print(f"  Harvest Months: {seasonal.get('harvest_months')}")
                
                print(f"\n{'=' * 80}")
                print("✓ Successfully retrieved commodity details with parquet data!")
                print(f"{'=' * 80}")
                
            else:
                print(f"✗ Failed to get details: {detail_response.status_code}")
                print(detail_response.text)
    else:
        print(f"✗ Failed to get commodities: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    try:
        test_commodity_details()
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to backend server. Is it running on port 8000?")
    except Exception as e:
        print(f"✗ Error: {e}")
