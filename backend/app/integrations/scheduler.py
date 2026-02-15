"""
Background Job Scheduler

Handles periodic tasks like:
- Syncing mandi prices from data.gov.in
- Cleaning up old OTPs (future)
- Generating daily reports (future)
"""
import logging
import threading

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.integrations.data_sync import get_sync_service

logger = logging.getLogger(__name__)


def sync_prices_job() -> None:
    """Job to sync prices from data.gov.in API."""
    logger.info("Starting scheduled price sync...")
    service = get_sync_service()
    result = service.sync()
    logger.info(
        f"Scheduled sync finished: status={result.status.value} "
        f"records={result.records_fetched} "
        f"duration={result.duration_seconds:.1f}s"
    )


def trigger_startup_sync() -> None:
    """
    Trigger an initial price sync on application startup.
    
    Runs in a background thread so it doesn't block the startup process.
    """
    if not settings.price_sync_enabled:
        logger.info("Startup sync skipped (PRICE_SYNC_ENABLED=false)")
        return
    
    def run_sync():
        logger.info("Triggering startup price sync...")
        service = get_sync_service()
        result = service.sync()
        logger.info(
            f"Startup sync finished: status={result.status.value} "
            f"records={result.records_fetched} "
            f"duration={result.duration_seconds:.1f}s"
        )
    
    # Run in background thread so startup isn't blocked
    thread = threading.Thread(target=run_sync, daemon=True, name="StartupSync")
    thread.start()
    logger.info("Startup sync initiated in background thread")


def start_scheduler() -> BackgroundScheduler:
    """
    Start the background scheduler.

    Reads interval from settings.price_sync_interval_hours.
    Skips starting if settings.price_sync_enabled is False.

    Returns:
        The started BackgroundScheduler instance.
    """
    if not settings.price_sync_enabled:
        logger.info("Price sync scheduler is disabled (PRICE_SYNC_ENABLED=false)")
        return None

    interval_hours = settings.price_sync_interval_hours
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        sync_prices_job,
        trigger=IntervalTrigger(hours=interval_hours),
        id="sync_prices",
        name="Sync Mandi Prices",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"Scheduler started. Price sync every {interval_hours} hours."
    )

    return scheduler
