# Automated Data Updates

This document explains how to set up automated daily price updates for the AgriProfit platform.

## Overview

The platform needs fresh price data daily to provide accurate market information to farmers. We've implemented:

1. ✅ **Future Forecasts Filter** - Only shows upcoming forecasts (not outdated ones)
2. ✅ **Data Freshness Indicator** - Warns users when data is >24 hours old
3. ✅ **CLI Command for Syncing** - `sync-prices` command to fetch latest data
4. 📋 **Automated Scheduling** - Instructions below

## Data Freshness Features

### Backend Changes
- **Forecast Filtering**: Only counts forecasts from today onwards
- **Staleness Detection**: Calculates hours since last update
- **API Response**: Includes `data_is_stale` and `hours_since_update` fields

### Frontend Changes
- **Warning Display**: Shows "⚠️ Xh old" when data is stale (>24 hours)
- **Updated Label**: Changed from "Next 14 days" to "Upcoming forecasts"

## Manual Price Sync

Run this command daily to fetch the latest prices:

```bash
cd backend
python -m app.cli sync-prices
```

This will:
- Fetch today's commodity prices from data.gov.in API
- Update existing records
- Add new price entries
- Preserve historical data

## Automated Scheduling Options

### Option 1: Windows Task Scheduler (Recommended for Windows)

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create Basic Task**
   - Click "Create Basic Task"
   - Name: "AgriProfit Daily Price Sync"
   - Description: "Fetches latest commodity prices from government API"

3. **Set Trigger**
   - Select "Daily"
   - Start time: 2:00 AM (when API is likely updated)
   - Recur every: 1 days

4. **Set Action**
   - Select "Start a program"
   - Program: `C:\Python\python.exe` (adjust to your Python path)
   - Arguments: `-m app.cli sync-prices`
   - Start in: `C:\Users\alame\Desktop\repo-root\backend`

5. **Finish and Test**
   - Right-click the task → "Run" to test

### Option 2: Linux/Mac Cron Job

Add to crontab (`crontab -e`):

```cron
# Run daily at 2:00 AM
0 2 * * * cd /path/to/repo-root/backend && /usr/bin/python3 -m app.cli sync-prices >> /var/log/agriprofit-sync.log 2>&1
```

### Option 3: Background Scheduler (Python APScheduler)

The project includes a built-in scheduler. Start it as a background service:

```bash
cd backend
python -m app.cli start-scheduler
```

This will run in the background and sync prices daily at 2:00 AM.

**To run as a service:**

Windows (NSSM):
```bash
# Install NSSM from https://nssm.cc/
nssm install AgriProfitScheduler "C:\Python\python.exe" "-m app.cli start-scheduler"
nssm set AgriProfitScheduler AppDirectory "C:\Users\alame\Desktop\repo-root\backend"
nssm start AgriProfitScheduler
```

Linux (systemd):
```bash
sudo nano /etc/systemd/system/agriprofit-scheduler.service
```

```ini
[Unit]
Description=AgriProfit Price Scheduler
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/repo-root/backend
ExecStart=/usr/bin/python3 -m app.cli start-scheduler
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable agriprofit-scheduler
sudo systemctl start agriprofit-scheduler
```

## Monitoring

### Check Last Update Time

```bash
cd backend
python -c "from app.database.session import get_db; from app.models.price_history import PriceHistory; from sqlalchemy import func; db = next(get_db()); latest = db.query(func.max(PriceHistory.price_date)).scalar(); print(f'Latest price date: {latest}')"
```

### Logs

Check logs for sync status:
- Windows Task Scheduler: Task History tab
- Cron: `/var/log/agriprofit-sync.log`
- Scheduler service: `journalctl -u agriprofit-scheduler -f`

## API Limits

- **data.gov.in API**: No strict rate limits for reasonable use
- **Nominatim Geocoding**: 1 request/second (already handled with rate limiting)

## Troubleshooting

### Data Still Stale After Sync
```bash
# Verify API is returning recent data
python -m app.cli test-api
```

### Scheduler Not Running
```bash
# Check if scheduler process is active (Linux/Mac)
ps aux | grep "app.cli start-scheduler"

# Check service status (Linux)
sudo systemctl status agriprofit-scheduler
```

### Permissions Issues
```bash
# Ensure write access to database
chmod 664 /path/to/database.db
```

## Future Enhancements

1. **Webhook Integration**: Receive notifications when new data is available
2. **Multi-Source Aggregation**: Combine data from multiple government portals
3. **ML Price Prediction**: Generate forecasts when official data is unavailable
4. **Real-time Updates**: WebSocket integration for instant price updates

## Support

For issues or questions:
- Check logs first
- Verify API connectivity: `python -m app.cli test-api`
- Review [data.gov.in API docs](https://data.gov.in)
