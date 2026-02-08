"""
Data Sync Service

Wraps the database seeder with sync status tracking, error reporting,
and summary statistics. Used by both the background scheduler and the
manual sync CLI script.
"""
import logging
import threading
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

from app.database.session import SessionLocal
from app.integrations.data_gov_client import get_data_gov_client
from app.integrations.seeder import DatabaseSeeder

logger = logging.getLogger(__name__)


class SyncStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


@dataclass
class SyncResult:
    """Result of a single sync run."""
    status: SyncStatus
    started_at: datetime
    finished_at: Optional[datetime] = None
    records_fetched: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    error: Optional[str] = None
    duration_seconds: float = 0.0


@dataclass
class SyncState:
    """Tracks the current and historical sync state."""
    current_status: SyncStatus = SyncStatus.IDLE
    last_sync: Optional[SyncResult] = None
    total_syncs: int = 0
    total_failures: int = 0
    last_success_at: Optional[datetime] = None
    last_failure_at: Optional[datetime] = None


class DataSyncService:
    """
    Service for syncing price data from data.gov.in to PostgreSQL.

    Thread-safe singleton that tracks sync status and prevents
    concurrent sync runs.
    """

    _instance: Optional["DataSyncService"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "DataSyncService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._state = SyncState()
        self._sync_lock = threading.Lock()

    @property
    def state(self) -> SyncState:
        return self._state

    @property
    def is_running(self) -> bool:
        return self._state.current_status == SyncStatus.RUNNING

    def sync(self, limit: Optional[int] = None) -> SyncResult:
        """
        Run a price data sync.

        Fetches latest prices from data.gov.in and upserts them into
        the database. Prevents concurrent runs via a lock.

        Args:
            limit: Optional record limit (for testing). None fetches all.

        Returns:
            SyncResult with summary statistics.
        """
        if not self._sync_lock.acquire(blocking=False):
            logger.warning("Sync already in progress, skipping")
            return SyncResult(
                status=SyncStatus.RUNNING,
                started_at=datetime.now(),
                error="Sync already in progress",
            )

        result = SyncResult(
            status=SyncStatus.RUNNING,
            started_at=datetime.now(),
        )
        self._state.current_status = SyncStatus.RUNNING

        try:
            logger.info("Starting price data sync from data.gov.in...")

            client = get_data_gov_client()

            # Fetch records from API
            if limit:
                data = client.fetch_prices(limit=limit)
                records = data.get("records", [])
            else:
                records = client.fetch_all_prices()

            result.records_fetched = len(records)
            logger.info(f"Fetched {result.records_fetched} records from API")

            if not records:
                logger.warning("No records fetched from API")
                result.status = SyncStatus.SUCCESS
                result.finished_at = datetime.now()
                result.duration_seconds = (
                    result.finished_at - result.started_at
                ).total_seconds()
                self._update_state(result)
                return result

            # Seed into database
            db = SessionLocal()
            try:
                seeder = DatabaseSeeder(db, client)
                seeder.seed_all(limit=limit)
            finally:
                db.close()

            result.status = SyncStatus.SUCCESS
            logger.info(
                f"Sync completed: {result.records_fetched} records processed"
            )

        except Exception as e:
            result.status = SyncStatus.FAILED
            result.error = str(e)
            logger.error(f"Sync failed: {e}", exc_info=True)

        finally:
            result.finished_at = datetime.now()
            result.duration_seconds = (
                result.finished_at - result.started_at
            ).total_seconds()
            self._update_state(result)
            self._sync_lock.release()

        return result

    def _update_state(self, result: SyncResult) -> None:
        """Update internal sync state after a run."""
        self._state.current_status = (
            SyncStatus.IDLE if result.status != SyncStatus.RUNNING
            else SyncStatus.RUNNING
        )
        self._state.last_sync = result
        self._state.total_syncs += 1

        if result.status == SyncStatus.SUCCESS:
            self._state.last_success_at = result.finished_at
        elif result.status == SyncStatus.FAILED:
            self._state.total_failures += 1
            self._state.last_failure_at = result.finished_at

    def get_status_dict(self) -> dict:
        """Return sync status as a JSON-serializable dict."""
        state = self._state
        last = state.last_sync

        return {
            "status": state.current_status.value,
            "total_syncs": state.total_syncs,
            "total_failures": state.total_failures,
            "last_success_at": (
                state.last_success_at.isoformat()
                if state.last_success_at else None
            ),
            "last_failure_at": (
                state.last_failure_at.isoformat()
                if state.last_failure_at else None
            ),
            "last_sync": {
                "status": last.status.value,
                "started_at": last.started_at.isoformat(),
                "finished_at": (
                    last.finished_at.isoformat() if last.finished_at else None
                ),
                "records_fetched": last.records_fetched,
                "duration_seconds": round(last.duration_seconds, 2),
                "error": last.error,
            } if last else None,
        }


def get_sync_service() -> DataSyncService:
    """Get the singleton DataSyncService instance."""
    return DataSyncService()
