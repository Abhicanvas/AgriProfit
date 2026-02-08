"""
Background Job Scheduler

Handles periodic tasks like:
- Syncing mandi prices from data.gov.in
- Cleaning up old OTPs (future)
- Generating daily reports (future)
"""
import logging

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
