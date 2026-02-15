"""
Data.gov.in API Client

Fetches real-time mandi prices from the Ministry of Agriculture's open data portal.
API Endpoint: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
"""
import os
import time
import logging
from datetime import datetime
from typing import Optional
from functools import lru_cache

import httpx

logger = logging.getLogger(__name__)


class DataGovClient:
    """Client for data.gov.in API to fetch mandi prices."""
    
    BASE_URL = "https://api.data.gov.in/resource"
    RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the client.

        Args:
            api_key: data.gov.in API key. Falls back to settings or env var.
        """
        if not api_key:
            try:
                from app.core.config import settings
                api_key = settings.data_gov_api_key
            except Exception:
                pass
        self.api_key = api_key or os.getenv("DATA_GOV_API_KEY")
        if not self.api_key:
            raise ValueError("DATA_GOV_API_KEY not provided or set in environment")
        
        # Increased timeout for large/slow responses
        self.client = httpx.Client(timeout=120.0)
    
    def _build_url(self, **params) -> str:
        """Build API URL with parameters."""
        base_params = {
            "api-key": self.api_key,
            "format": "json",
        }
        base_params.update(params)
        
        query = "&".join(f"{k}={v}" for k, v in base_params.items() if v is not None)
        return f"{self.BASE_URL}/{self.RESOURCE_ID}?{query}"
    
    def fetch_prices(
        self,
        limit: int = 1000,
        offset: int = 0,
        state: Optional[str] = None,
        district: Optional[str] = None,
        commodity: Optional[str] = None,
        market: Optional[str] = None,
        retries: int = 3,
    ) -> dict:
        """
        Fetch mandi prices with optional filters.
        
        Args:
            limit: Max records to fetch (max 1000)
            offset: Records to skip for pagination
            state: Filter by state name
            district: Filter by district name
            commodity: Filter by commodity name
            market: Filter by market name
            retries: Number of retries for failed requests
            
        Returns:
            API response dict with 'records', 'total', 'count' etc.
        """
        filters = {}
        if state:
            filters["filters[state.keyword]"] = state
        if district:
            filters["filters[district]"] = district
        if commodity:
            filters["filters[commodity]"] = commodity
        if market:
            filters["filters[market]"] = market
        
        url = self._build_url(limit=limit, offset=offset, **filters)
        
        import time
        last_exception = None
        
        for attempt in range(retries + 1):
            try:
                if attempt > 0:
                    logger.info(f"Retrying API request (attempt {attempt}/{retries})...")
                    time.sleep(2 * attempt)  # Exponential backoff
                
                response = self.client.get(url)
                response.raise_for_status()
                data = response.json()
                
                logger.info(
                    f"Fetched {data.get('count', 0)} records from data.gov.in "
                    f"(total: {data.get('total', 0)})"
                )
                return data
                
            except httpx.HTTPError as e:
                last_exception = e
                logger.warning(f"API request failed: {e}")
        
        logger.error(f"All {retries} retries failed.")
        raise last_exception
    
    def fetch_all_prices(self, batch_size: int = 1000) -> list[dict]:
        """
        Fetch ALL price records using pagination.
        
        Args:
            batch_size: Records per request (default 1000, max 1000)
            
        Returns:
            List of all price records
        """
        all_records = []
        offset = 0
        
        # First request to get total count
        data = self.fetch_prices(limit=batch_size, offset=0)
        total = int(data.get("total", 0))
        all_records.extend(data.get("records", []))
        
        logger.info(f"Fetching {total} total records from data.gov.in...")
        
        # Paginate through remaining records
        while len(all_records) < total:
            offset += batch_size
            
            # Add delay to prevent rate limiting
            time.sleep(1.0)
            
            data = self.fetch_prices(limit=batch_size, offset=offset)
            records = data.get("records", [])
            if not records:
                break
            all_records.extend(records)
            logger.info(f"Progress: {len(all_records)}/{total} records")
        
        logger.info(f"Fetched {len(all_records)} total records")
        return all_records
    
    def get_unique_states(self) -> list[str]:
        """Get list of unique states from API data."""
        # Fetch a sample to extract states
        data = self.fetch_prices(limit=5000)
        records = data.get("records", [])
        states = sorted(set(r.get("state", "") for r in records if r.get("state")))
        return states
    
    def get_unique_commodities(self) -> list[str]:
        """Get list of unique commodities from API data."""
        data = self.fetch_prices(limit=5000)
        records = data.get("records", [])
        commodities = sorted(set(r.get("commodity", "") for r in records if r.get("commodity")))
        return commodities
    
    def parse_arrival_date(self, date_str: str) -> Optional[datetime]:
        """
        Parse arrival_date from API format (DD/MM/YYYY).
        
        Args:
            date_str: Date string in DD/MM/YYYY format
            
        Returns:
            datetime object or None if parsing fails
        """
        try:
            return datetime.strptime(date_str, "%d/%m/%Y")
        except (ValueError, TypeError):
            return None
    
    def close(self):
        """Close the HTTP client."""
        self.client.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()


# Singleton instance
_client: Optional[DataGovClient] = None


def get_data_gov_client() -> DataGovClient:
    """Get or create the singleton DataGovClient instance."""
    global _client
    if _client is None:
        _client = DataGovClient()
    return _client
