import math
from typing import Dict
from models import RawItem, SourceType

SOURCE_TIER_WEIGHTS: Dict[SourceType, float] = {
    SourceType.NEWS_WIRE: 0.98,
    SourceType.TIER_1_FINANCIAL: 0.92,
    SourceType.COMMODITY_SPECIALIST: 0.85,
    SourceType.BROAD_FINANCIAL: 0.75,
    SourceType.MAINSTREAM_NEWS: 0.65,
    SourceType.AGGREGATOR_REGIONAL: 0.45,
    SourceType.UNKNOWN: 0.20,
}

class CredibilityCalculator:
    """
    Computes credibility based on publisher tier, keyword relevance, 
    and article completeness.
    """
    def __init__(
        self,
        w_source_tier: float = 0.70,
        w_relevance: float = 0.15,
        w_completeness: float = 0.15,
        relevance_ceiling: float = 5.0
    ):
        assert abs((w_source_tier + w_relevance + w_completeness) - 1.0) < 1e-6
        self.w_source_tier = w_source_tier
        self.w_relevance = w_relevance
        self.w_completeness = w_completeness
        self.relevance_ceiling = relevance_ceiling

    def score(self, item: RawItem) -> float:
        # 1. Base Source Tier
        tier_score = SOURCE_TIER_WEIGHTS.get(item.source_type, 0.20)

        # 2. Relevance Density (normalized against relevance_ceiling)
        raw_rel = max(0.0, float(item.relevance_score or 1.0))
        relevance_score = min(raw_rel / self.relevance_ceiling, 1.0)

        # 3. Content Completeness (full article body vs snippet)
        completeness_score = 1.0 if item.is_full_text else 0.40

        # Weighted calculation
        combined = (
            (self.w_source_tier * tier_score) +
            (self.w_relevance * relevance_score) +
            (self.w_completeness * completeness_score)
        )

        return round(min(max(combined, 0.0), 1.0), 4)


# ---------------------------------------------------------------------------
# v2 path: once you have labeled data (item features -> "was this source
# directionally right historically"), replace the hand-tuned weights above
# with a trained classifier. Sketch:
#
#   from sklearn.linear_model import LogisticRegression
#   X = [[tier_weight, log_followers, log_age, engagement], ...]
#   y = [1, 0, 1, ...]  # was this source's sentiment historically predictive?
#   model = LogisticRegression().fit(X, y)
#   credibility = model.predict_proba([features])[0][1]
# ---------------------------------------------------------------------------