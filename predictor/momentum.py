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

    def __init__(
        self,
        window_hours: int = 6
    ):
        self.window = timedelta(
            hours=window_hours
        )

        self._history: Dict[
            str,
            List[MomentumReading]
        ] = defaultdict(list)

    def _prune(
        self,
        ticker: str,
        as_of: datetime
    ) -> None:

        cutoff = (
            as_of -
            self.window
        )

        self._history[ticker] = [
            reading
            for reading in self._history[ticker]
            if reading.timestamp >= cutoff
        ]

    @staticmethod
    def recency_weight(
        published_at: datetime,
        now: datetime,
        half_life_hours: float = 3.0
    ) -> float:

        age_hours = max(
            0.0,
            (
                now - published_at
            ).total_seconds()
            / 3600
        )

        # Exponential decay.
        #
        # At half-life:
        # weight = 0.5

        weight = 0.5 ** (
            age_hours /
            half_life_hours
        )

        # Never completely discard
        # a reasonably recent article.

        return max(
            weight,
            0.10
        )

    @classmethod
    def weighted_sentiment(
        cls,
        items: List[ScoredItem],
        now: datetime
    ) -> float:

        numerator = 0.0
        denominator = 0.0

        for item in items:

            credibility = max(
                item.credibility,
                0.01
            )

            recency = cls.recency_weight(
                item.raw.timestamp,
                now
            )

            weight = (
                credibility *
                recency
            )

            numerator += (
                item.sentiment.signed_score *
                weight
            )

            denominator += weight

        if denominator <= 0:
            return 0.0

        return (
            numerator /
            denominator
        )

    def update(
        self,
        ticker: str,
        items: List[ScoredItem],
        as_of: datetime = None,
    ) -> MomentumReading:

        as_of = (
            as_of
            or datetime.now(timezone.utc)
        )

        # Remove readings outside
        # the configured history window.
        self._prune(
            ticker,
            as_of
        )

        # Calculate the current weighted
        # sentiment from the incoming articles.
        current_ws = self.weighted_sentiment(
            items,
            as_of
        )

        # Calculate the total credibility
        # weight of the current article batch.
        total_weight = sum(
            max(
                item.credibility,
                0.01
            )
            for item in items
        )

        # -------------------------------------------------
        # MOMENTUM
        # -------------------------------------------------
        #
        # Momentum measures the change in weighted
        # sentiment compared with the previous reading.
        #
        # First reading:
        # There is no previous reading, so momentum = 0.
        #

        prior_readings = self._history[ticker]

        if prior_readings:

            prior_ws = (
                prior_readings[-1]
                .weighted_sentiment
            )

            momentum = (
                current_ws -
                prior_ws
            )

        else:

            # No previous reading means that
            # momentum cannot yet be calculated.
            momentum = 0.0

        # Create the new reading.
        reading = MomentumReading(

            ticker=ticker,

            timestamp=as_of,

            weighted_sentiment=round(
                current_ws,
                4
            ),

            momentum=round(
                momentum,
                4
            ),

            item_count=len(items),

            total_credibility_weight=round(
                total_weight,
                4
            ),
        )

        # Store the reading so that the next
        # analysis can calculate momentum.
        self._history[ticker].append(
            reading
        )

        return reading

    def ema_momentum(
        self,
        ticker: str,
        span: int = 5
    ) -> float:

        readings = self._history.get(
            ticker,
            []
        )

        # Need at least two readings before
        # EMA momentum becomes meaningful.
        if len(readings) < 2:
            return 0.0

        # Extract the actual momentum values.
        momentum_values = [
            reading.momentum
            for reading in readings
        ]

        # Standard EMA smoothing factor.
        alpha = 2 / (
            span + 1
        )

        # Start EMA from the first momentum value.
        ema = momentum_values[0]

        # Apply EMA recursively.
        for value in momentum_values[1:]:

            ema = (
                alpha * value
                +
                (1 - alpha) * ema
            )

        return round(
            ema,
            4
        )