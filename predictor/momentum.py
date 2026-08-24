from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from pydantic import BaseModel

from models import ScoredItem


class MomentumReading(BaseModel):
    ticker: str
    timestamp: datetime
    weighted_sentiment: float
    momentum: float
    item_count: int
    total_credibility_weight: float


class MomentumTracker:
    def __init__(self, window_hours: int = 6):
        self.window = timedelta(hours=window_hours)
        self._history: Dict[str, List[MomentumReading]] = defaultdict(list)

    def _prune(self, ticker: str, as_of: datetime) -> None:
        cutoff = as_of - self.window
        self._history[ticker] = [
            reading for reading in self._history[ticker]
            if reading.timestamp >= cutoff
        ]

    @staticmethod
    def weighted_sentiment(items: List[ScoredItem]) -> float:
        total_weight = sum(item.credibility for item in items)
        if total_weight <= 0:
            return 0.0
        return sum(item.weighted_sentiment for item in items) / total_weight

    def update(
        self,
        ticker: str,
        items: List[ScoredItem],
        as_of: datetime = None,
    ) -> MomentumReading:
        as_of = as_of or datetime.now(timezone.utc)
        self._prune(ticker, as_of)

        current_ws = self.weighted_sentiment(items)
        total_weight = sum(item.credibility for item in items)
        prior_readings = self._history[ticker]
        prior_ws = prior_readings[-1].weighted_sentiment if prior_readings else 0.0

        reading = MomentumReading(
            ticker=ticker,
            timestamp=as_of,
            weighted_sentiment=round(current_ws, 4),
            momentum=round(current_ws - prior_ws, 4),
            item_count=len(items),
            total_credibility_weight=round(total_weight, 4),
        )

        self._history[ticker].append(reading)
        return reading

    def ema_momentum(self, ticker: str, span: int = 5) -> float:
        readings = self._history.get(ticker, [])
        if len(readings) < 2:
            return 0.0

        alpha = 2 / (span + 1)
        ema = readings[0].weighted_sentiment

        for reading in readings[1:]:
            ema = alpha * reading.weighted_sentiment + (1 - alpha) * ema

        return round(readings[-1].weighted_sentiment - ema, 4)
