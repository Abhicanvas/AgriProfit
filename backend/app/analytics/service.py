from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models import (
    Commodity,
    Mandi,
    PriceHistory,
    PriceForecast,
    CommunityPost,
    User,
    Notification,
)
from app.analytics.schemas import (
    PriceTrendResponse,
    PriceTrendListResponse,
    PriceStatisticsResponse,
    MarketSummaryResponse,
    UserActivityResponse,
    TopCommodityItem,
    TopMandiItem,
    MandiPriceItem,
    CommodityPriceComparisonResponse,
    MandiPerformanceResponse,
    DashboardResponse,
)


class AnalyticsService:
    """Service class for analytics operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_price_trends(
        self,
        commodity_id: UUID,
        mandi_id: UUID | None = None,
        days: int = 30,
    ) -> list[PriceTrendResponse]:
        """Get price trends with commodity and mandi names."""
        start_date = date.today() - timedelta(days=days)

        query = self.db.query(
            PriceHistory.commodity_id,
            Commodity.name.label("commodity_name"),
            PriceHistory.mandi_id,
            Mandi.name.label("mandi_name"),
            PriceHistory.price_date,
            PriceHistory.modal_price.label("price"),
        ).join(
            Commodity, PriceHistory.commodity_id == Commodity.id
        ).join(
            Mandi, PriceHistory.mandi_id == Mandi.id
        ).filter(
            PriceHistory.commodity_id == commodity_id,
            PriceHistory.price_date >= start_date,
        )

        if mandi_id:
            query = query.filter(PriceHistory.mandi_id == mandi_id)

        results = query.order_by(PriceHistory.price_date.asc()).all()

        return [
            PriceTrendResponse(
                commodity_id=row.commodity_id,
                commodity_name=row.commodity_name,
                mandi_id=row.mandi_id,
                mandi_name=row.mandi_name,
                price_date=row.price_date,
                modal_price=row.price,
            )
            for row in results
        ]

    def get_price_trends_list(
        self,
        commodity_id: UUID,
        mandi_id: UUID,
        days: int = 30,
    ) -> PriceTrendListResponse:
        """Get price trends with metadata."""
        start_date = date.today() - timedelta(days=days)
        end_date = date.today()

        items = self.get_price_trends(
            commodity_id=commodity_id,
            mandi_id=mandi_id,
            days=days,
        )

        return PriceTrendListResponse(
            items=items,
            commodity_id=commodity_id,
            mandi_id=mandi_id,
            start_date=start_date,
            end_date=end_date,
            data_points=len(items),
        )

    def get_price_statistics(
        self,
        commodity_id: UUID,
        mandi_id: UUID | None = None,
        days: int = 30,
    ) -> PriceStatisticsResponse | None:
        """Calculate price statistics for a commodity."""
        start_date = date.today() - timedelta(days=days)

        query = self.db.query(
            PriceHistory.commodity_id,
            Commodity.name.label("commodity_name"),
            func.avg(PriceHistory.modal_price).label("avg_price"),
            func.min(PriceHistory.modal_price).label("min_price"),
            func.max(PriceHistory.modal_price).label("max_price"),
            func.count(PriceHistory.id).label("data_points"),
        ).join(
            Commodity, PriceHistory.commodity_id == Commodity.id
        ).filter(
            PriceHistory.commodity_id == commodity_id,
            PriceHistory.price_date >= start_date,
        )

        if mandi_id:
            query = query.join(
                Mandi, PriceHistory.mandi_id == Mandi.id
            ).filter(PriceHistory.mandi_id == mandi_id)
            query = query.group_by(
                PriceHistory.commodity_id,
                Commodity.name,
                PriceHistory.mandi_id,
                Mandi.name,
            )
            query = query.add_columns(
                PriceHistory.mandi_id,
                Mandi.name.label("mandi_name"),
            )
        else:
            query = query.group_by(PriceHistory.commodity_id, Commodity.name)

        result = query.first()

        if not result or result.data_points == 0:
            return None

        # Calculate price change percentage
        price_change_percent = self._calculate_price_change(
            commodity_id=commodity_id,
            mandi_id=mandi_id,
            days=days,
        )

        return PriceStatisticsResponse(
            commodity_id=result.commodity_id,
            commodity_name=result.commodity_name,
            mandi_id=mandi_id,  # Keep as None if not provided
            mandi_name=getattr(result, "mandi_name", None),
            avg_price=round(float(result.avg_price), 2),
            min_price=round(float(result.min_price), 2),
            max_price=round(float(result.max_price), 2),
            price_change_percent=price_change_percent,
            data_points=result.data_points,
            start_date=start_date,
            end_date=date.today(),
        )

    def _calculate_price_change(
        self,
        commodity_id: UUID,
        mandi_id: UUID | None = None,
        days: int = 30,
    ) -> float:
        """Calculate percentage price change from first to last price."""
        start_date = date.today() - timedelta(days=days)

        query = self.db.query(PriceHistory).filter(
            PriceHistory.commodity_id == commodity_id,
            PriceHistory.price_date >= start_date,
        )

        if mandi_id:
            query = query.filter(PriceHistory.mandi_id == mandi_id)

        # Get first and last prices
        first_record = query.order_by(PriceHistory.price_date.asc()).first()
        last_record = query.order_by(PriceHistory.price_date.desc()).first()

        if not first_record or not last_record or first_record.modal_price == 0:
            return 0.0

        first_price = float(first_record.modal_price)
        last_price = float(last_record.modal_price)

        price_change = ((last_price - first_price) / first_price) * 100
        return round(price_change, 2)

    def get_market_summary(self) -> MarketSummaryResponse:
        """Get overall market summary statistics."""
        total_commodities = self.db.query(func.count(Commodity.id)).scalar() or 0
        total_mandis = self.db.query(func.count(Mandi.id)).scalar() or 0
        total_price_records = self.db.query(func.count(PriceHistory.id)).scalar() or 0
        # Only count future forecasts (today and onwards)
        today = date.today()
        total_forecasts = self.db.query(func.count(PriceForecast.id)).filter(
            PriceForecast.forecast_date >= today
        ).scalar() or 0

        # Count non-deleted posts
        total_posts = self.db.query(func.count(CommunityPost.id)).filter(
            CommunityPost.deleted_at.is_(None)
        ).scalar() or 0

        total_users = self.db.query(func.count(User.id)).scalar() or 0

        # Get last update timestamp
        last_price = self.db.query(PriceHistory.created_at).order_by(
            PriceHistory.created_at.desc()
        ).first()

        last_updated = last_price[0] if last_price else datetime.now(timezone.utc)
        
        # Handle timezone-naive timestamps from database
        # Database stores local time without timezone info
        if last_updated.tzinfo is None:
            # Treat as local time and convert to UTC-aware
            from datetime import timedelta
            import time
            
            # Get local timezone offset in hours
            local_offset = time.timezone if not time.daylight else time.altzone
            local_offset_hours = -local_offset / 3600
            
            # Mark as UTC and adjust by the local offset
            last_updated = last_updated.replace(tzinfo=timezone.utc)
            last_updated = last_updated - timedelta(hours=local_offset_hours)
        
        # Calculate data freshness
        now = datetime.now(timezone.utc)
        hours_since_update = (now - last_updated).total_seconds() / 3600
        data_is_stale = hours_since_update > 24

        return MarketSummaryResponse(
            total_commodities=total_commodities,
            total_mandis=total_mandis,
            total_price_records=total_price_records,
            total_forecasts=total_forecasts,
            total_posts=total_posts,
            total_users=total_users,
            last_updated=last_updated,
            data_is_stale=data_is_stale,
            hours_since_update=round(hours_since_update, 1),
        )

    def get_top_commodities_by_price_change(
        self,
        limit: int = 10,
        days: int = 30,
    ) -> list[TopCommodityItem]:
        """Get commodities with highest price change percentage (Optimized)."""
        start_date = date.today() - timedelta(days=days)
        
        # 1. Get commodities that actually have data in the period
        # We need first and last price for each commodity
        
        # Subquery for first date per commodity
        first_dates = self.db.query(
            PriceHistory.commodity_id,
            func.min(PriceHistory.price_date).label("min_date")
        ).filter(
            PriceHistory.price_date >= start_date
        ).group_by(PriceHistory.commodity_id).subquery()
        
        # Subquery for last date per commodity
        last_dates = self.db.query(
            PriceHistory.commodity_id,
            func.max(PriceHistory.price_date).label("max_date")
        ).filter(
            PriceHistory.price_date >= start_date
        ).group_by(PriceHistory.commodity_id).subquery()
        
        # Get prices at those dates
        # This is a bit complex in pure ORM, so we might iterate over likely candidates
        # But let's try a simpler approach: 
        # Get all commodities with significant activity first
        
        active_commodities = self.db.query(
            PriceHistory.commodity_id,
            func.count(PriceHistory.id).label("cnt")
        ).filter(
            PriceHistory.price_date >= start_date
        ).group_by(
            PriceHistory.commodity_id
        ).having(func.count(PriceHistory.id) >= 2).all()
        
        commodity_changes = []
        
        # Only iterate over commodities with data (much smaller set)
        for row in active_commodities:
            commodity_id = row.commodity_id
            
            # Efficiently get just first and last price
            first_price = self.db.query(PriceHistory.modal_price).filter(
                PriceHistory.commodity_id == commodity_id,
                PriceHistory.price_date >= start_date
            ).order_by(PriceHistory.price_date.asc()).limit(1).scalar()
            
            last_price = self.db.query(PriceHistory.modal_price).filter(
                PriceHistory.commodity_id == commodity_id,
                PriceHistory.price_date >= start_date
            ).order_by(PriceHistory.price_date.desc()).limit(1).scalar()
            
            if first_price and last_price and first_price > 0:
                change = abs(((float(last_price) - float(first_price)) / float(first_price)) * 100)
                
                # Get name efficiently (could simplify by joining above, but this is fine)
                name = self.db.query(Commodity.name).filter(Commodity.id == commodity_id).scalar()
                
                commodity_changes.append({
                    "commodity_id": commodity_id,
                    "name": name,
                    "record_count": row.cnt,
                    "price_change": change,
                })
        
        # Sort and limit
        commodity_changes.sort(key=lambda x: x["price_change"], reverse=True)
        
        return [
            TopCommodityItem(
                commodity_id=item["commodity_id"],
                name=item["name"],
                record_count=item["record_count"],
            )
            for item in commodity_changes[:limit]
        ]

    def get_top_mandis_by_records(self, limit: int = 10) -> list[TopMandiItem]:
        """Get mandis with most price records."""
        results = self.db.query(
            Mandi.id.label("mandi_id"),
            Mandi.name,
            func.count(PriceHistory.id).label("record_count"),
        ).join(
            PriceHistory, PriceHistory.mandi_id == Mandi.id
        ).group_by(
            Mandi.id, Mandi.name
        ).order_by(
            desc("record_count")
        ).limit(limit).all()

        return [
            TopMandiItem(
                mandi_id=row.mandi_id,
                name=row.name,
                record_count=row.record_count,
            )
            for row in results
        ]

    def get_user_activity(self, user_id: UUID) -> UserActivityResponse | None:
        """Get user activity summary."""
        user = self.db.query(User).filter(User.id == user_id).first()

        if not user:
            return None

        # Count posts (non-deleted)
        posts_count = self.db.query(func.count(CommunityPost.id)).filter(
            CommunityPost.user_id == user_id,
            CommunityPost.deleted_at.is_(None),
        ).scalar() or 0

        # Count notifications
        notifications_count = self.db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id,
        ).scalar() or 0

        # Get last activity (most recent post or notification)
        last_post = self.db.query(CommunityPost.created_at).filter(
            CommunityPost.user_id == user_id,
            CommunityPost.deleted_at.is_(None),
        ).order_by(CommunityPost.created_at.desc()).first()

        last_notification = self.db.query(Notification.created_at).filter(
            Notification.user_id == user_id,
        ).order_by(Notification.created_at.desc()).first()

        last_active = None
        if last_post and last_notification:
            last_active = max(last_post[0], last_notification[0])
        elif last_post:
            last_active = last_post[0]
        elif last_notification:
            last_active = last_notification[0]

        return UserActivityResponse(
            user_id=user.id,
            username=getattr(user, 'name', None),
            phone=user.phone_number,
            posts_count=posts_count,
            notifications_count=notifications_count,
            last_active=last_active,
        )

    def get_commodity_price_comparison(
        self,
        commodity_id: UUID,
    ) -> CommodityPriceComparisonResponse | None:
        """Compare prices for a commodity across all mandis."""
        commodity = self.db.query(Commodity).filter(Commodity.id == commodity_id).first()

        if not commodity:
            return None

        # Get latest price and average for each mandi
        results = self.db.query(
            Mandi.id.label("mandi_id"),
            Mandi.name.label("mandi_name"),
            func.avg(PriceHistory.modal_price).label("avg_price"),
        ).join(
            PriceHistory, PriceHistory.mandi_id == Mandi.id
        ).filter(
            PriceHistory.commodity_id == commodity_id,
        ).group_by(
            Mandi.id, Mandi.name
        ).all()

        if not results:
            return None

        mandi_prices = []
        for row in results:
            # Get latest price for this mandi
            latest = self.db.query(PriceHistory.modal_price).filter(
                PriceHistory.commodity_id == commodity_id,
                PriceHistory.mandi_id == row.mandi_id,
            ).order_by(PriceHistory.price_date.desc()).first()

            current_price = float(latest[0]) if latest else 0.0

            mandi_prices.append(MandiPriceItem(
                mandi_id=row.mandi_id,
                mandi_name=row.mandi_name,
                current_price=round(current_price, 2),
                avg_price=round(float(row.avg_price), 2),
            ))

        # Find lowest and highest
        if mandi_prices:
            lowest = min(mandi_prices, key=lambda x: x.current_price)
            highest = max(mandi_prices, key=lambda x: x.current_price)
            price_spread = highest.current_price - lowest.current_price
        else:
            lowest = highest = None
            price_spread = 0.0

        return CommodityPriceComparisonResponse(
            commodity_id=commodity_id,
            commodity_name=commodity.name,
            mandi_prices=mandi_prices,
            lowest_price_mandi=lowest.mandi_name if lowest else None,
            highest_price_mandi=highest.mandi_name if highest else None,
            price_spread=round(price_spread, 2),
        )

    def get_weekly_price_trends(self) -> list:
        """Get average prices for the last 7 days that have data for dashboard chart."""
        from datetime import datetime
        
        # Get the last 7 distinct dates that have price data
        dates_with_data = self.db.query(
            PriceHistory.price_date,
            func.avg(PriceHistory.modal_price).label('avg_price')
        ).group_by(
            PriceHistory.price_date
        ).order_by(
            PriceHistory.price_date.desc()
        ).limit(7).all()
        
        # Reverse to get chronological order
        dates_with_data = list(reversed(dates_with_data))
        
        day_names = ["M", "T", "W", "T", "F", "S", "S"]
        weekly_data = []
        
        for date_record in dates_with_data:
            target_date = date_record.price_date
            avg_price = date_record.avg_price
            
            # Convert to quintal if needed (prices < 200 are in kg)
            if avg_price and avg_price < 200:
                avg_price = avg_price * 100
            
            weekly_data.append({
                "day": day_names[target_date.weekday()],
                "date": str(target_date),
                "value": round(float(avg_price), 2) if avg_price else 0
            })
        
        return weekly_data

    def get_dashboard(self) -> DashboardResponse:
        """Get combined dashboard data."""
        market_summary = self.get_market_summary()
        top_commodities = self.get_top_commodities_by_price_change(limit=5, days=7)
        top_mandis = self.get_top_mandis_by_records(limit=5)
        weekly_trends = self.get_weekly_price_trends()

        # Get recent price changes for top commodities
        recent_price_changes = []
        for commodity in top_commodities[:5]:
            stats = self.get_price_statistics(
                commodity_id=commodity.commodity_id,
                days=7,
            )
            if stats:
                recent_price_changes.append(stats)

        return DashboardResponse(
            market_summary=market_summary,
            recent_price_changes=recent_price_changes,
            top_commodities=top_commodities,
            top_mandis=top_mandis,
            weekly_trends=weekly_trends,
        )