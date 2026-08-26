from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SourceType(str, Enum):
    NEWS_WIRE = 'news_wire'
    TIER_1_FINANCIAL = 'tier_1_financial'
    COMMODITY_SPECIALIST = 'commodity_specialist'
    BROAD_FINANCIAL = 'broad_financial'
    MAINSTREAM_NEWS = 'mainstream_news'
    AGGREGATOR_REGIONAL = 'aggregator_regional'
    UNKNOWN = 'unknown'


class RawItem(BaseModel):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    text: str = Field(min_length=1)
    source_name: str = Field(min_length=1)
    source_url: str = Field(min_length=1)
    source_type: SourceType = SourceType.UNKNOWN
    timestamp: datetime
    ticker: str = Field(min_length=1)
    relevance_score: Optional[float] = 1.0
    is_full_text: Optional[bool] = False

    @field_validator('ticker')
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator('timestamp')
    @classmethod
    def normalize_timestamp(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class SentimentResult(BaseModel):
    positive: float
    negative: float
    neutral: float
    label: str

    @property
    def signed_score(self) -> float:
        return self.positive - self.negative


class ScoredItem(BaseModel):
    raw: RawItem
    sentiment: SentimentResult
    credibility: float
    weighted_sentiment: float = 0.0

    def model_post_init(self, __context):
        self.weighted_sentiment = self.sentiment.signed_score * self.credibility
