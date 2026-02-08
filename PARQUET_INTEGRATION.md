# Parquet Data Integration

## Overview
Successfully integrated the `agmarknet_daily_10yr.parquet` file containing historical commodity price data into the commodity detail pages.

## Dataset Information
- **File**: `agmarknet_daily_10yr.parquet` (located in repo root)
- **Records**: 25,132,834 price records
- **Date Range**: 2015-01-01 to 2025-10-30
- **Commodities**: 314 unique commodities
- **Markets**: 577 districts across 32 states

## Data Schema
```
- date (datetime): Price date
- commodity (string): Commodity name (e.g., "Tomato", "Onion", "Apple")
- commodity_id (int16): Unique commodity identifier
- state (string): State name
- state_id (int16): State identifier
- district (string): District/Mandi name
- district_id (int32): District identifier
- price_min (float32): Minimum price for the day
- price_max (float32): Maximum price for the day
- price_modal (float32): Modal (most common) price
- category_id (Int16): Commodity category
- entity_id (string): Unique market-commodity combination
```

## Implementation

### Backend Changes

#### 1. New Parquet Service (`backend/app/core/parquet_service.py`)
Created a singleton service to load and query the parquet file:
- `get_commodity_price_history(commodity_name, days, state, district)` - Get historical prices
- `get_top_mandis(commodity_name, limit, days)` - Get markets with highest volumes
- `get_current_price(commodity_name)` - Get latest price
- `get_price_change(commodity_name, days)` - Calculate price changes
- `get_available_commodities()` - List all commodities in dataset
- `search_commodity(query)` - Search commodities by name

#### 2. Updated Commodity Service (`backend/app/commodities/service.py`)
Modified to prioritize parquet data with database fallback:
- `get_details()` - Now uses parquet data for price history and mandis
- `get_current_price()` - Tries parquet first, falls back to database
- `calculate_price_change()` - Uses parquet for historical comparisons

#### 3. Dependencies
Added to `backend/requirements.txt`:
- `pandas==2.2.3` - DataFrame operations
- `pyarrow==19.0.0` - Parquet file reading

### Frontend Integration
No changes required to frontend - the existing commodity detail page (`frontend/src/app/commodities/[id]/page.tsx`) automatically consumes the data from the updated backend API.

## Data Flow

```
User visits /commodities/{id}
    ↓
Frontend calls GET /commodities/{id}
    ↓
Backend CommodityService.get_details()
    ↓
ParquetService queries agmarknet_daily_10yr.parquet
    ↓
Returns historical data:
    - Price history (last 365 days)
    - Top 10 mandis by volume
    - Current prices
    - Price changes (1d, 7d, 30d, 90d)
    ↓
Frontend renders charts and tables
```

## Features Enabled

### 1. Real Historical Price Data
- Up to 10 years of daily price history
- Actual market data from AgMarkNet
- Accurate price trends and patterns

### 2. Market Intelligence
- **Top Mandis**: Markets with highest trading volumes
- **Price Comparison**: Highest vs lowest prices across markets
- **Geographic Distribution**: Prices across 32 states

### 3. Price Analytics
- Current market price (latest available)
- Short-term trends (1 day, 7 days)
- Medium-term trends (30 days)
- Long-term trends (90 days)
- Percentage change calculations

## Usage Example

When a user views a commodity detail page (e.g., "Tomato"):

1. **Price Chart**: Shows actual daily prices from the parquet file for the last 30-365 days
2. **Top Mandis**: Displays markets like "Bangalore, Karnataka" or "Azadpur, Delhi" with their average prices
3. **Price Changes**: Shows real percentage changes based on historical data:
   - 1 Day: +2.5%
   - 7 Days: -5.3%
   - 30 Days: +12.1%
   - 90 Days: -8.7%

## Performance Considerations

### Singleton Pattern
The parquet file (25M+ records) is loaded once on server startup and kept in memory for fast queries.

### Data Aggregation
- Prices are aggregated across multiple mandis for national average
- Group by date for time-series data
- Efficient pandas operations for filtering and aggregation

### Caching
The ParquetService uses `_instance` singleton to prevent reloading the file on every request.

## Matching Commodities

The integration works by matching commodity names between:
1. **Database**: Commodities table (stores metadata like category, description, seasonal info)
2. **Parquet**: Actual price data from AgMarkNet

Example mappings:
- Database "Tomato" → Parquet "Tomato"
- Database "Onion" → Parquet "Onion"
- Database "Apple" → Parquet "Apple"

Case-insensitive matching ensures compatibility.

## Fallback Mechanism

If parquet data is not available for a commodity:
1. Service attempts to load from parquet first
2. If no data found or error occurs, falls back to database PriceHistory table
3. Ensures application continues working even if parquet file is missing

## Server Startup

When the backend starts, you'll see:
```
Loading AgMarkNet data from C:\Users\...\agmarknet_daily_10yr.parquet...
Loaded 25132834 records from 2015-01-01 00:00:00 to 2025-10-30 00:00:00
Commodities: 314
```

This confirms the parquet data is successfully loaded and ready for queries.

## Testing

To verify the integration:
1. Start backend server: `cd backend; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Visit any commodity detail page: `http://localhost:3000/commodities/{id}`
3. Check for:
   - Price history chart with multiple data points
   - Top mandis list with different locations
   - Accurate price change percentages

## Benefits

✓ **Real Data**: Using actual AgMarkNet market data instead of mock data
✓ **10 Years History**: Long-term trends and seasonal patterns visible
✓ **314 Commodities**: Comprehensive coverage of agricultural commodities
✓ **National Coverage**: Data from 577 districts across India
✓ **Fast Queries**: In-memory pandas DataFrames for quick aggregations
✓ **Reliable**: Fallback to database ensures no disruption

## Future Enhancements

Potential improvements:
1. **Data Refresh**: Periodic updates to parquet file with new data
2. **Forecasting**: ML models trained on historical data for price predictions
3. **Alerts**: Price alerts based on historical volatility
4. **Comparisons**: Compare current prices vs historical averages
5. **Seasonality Detection**: Automatic detection of seasonal patterns from data
