import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from models import RawItem, ScoredItem
from finBert import FinBertHFApiClient
from credibility import CredibilityCalculator
from momentum import MomentumTracker

load_dotenv()

app = FastAPI(
    title='AuRX Commodity Sentiment Predictor',
    version='1.0.0'
)

finbert = FinBertHFApiClient(
    api_token=os.getenv('HF_API_TOKEN')
)

cred_calc = CredibilityCalculator()
tracker = MomentumTracker()


@app.get('/health')
async def health():
    return {
        'status': 'ok',
        'service': 'predictor',
        'hf_token_configured': bool(os.getenv('HF_API_TOKEN')),
    }


@app.post('/api/analyze', response_model=dict)
async def analyze_batch(items: List[RawItem]):

    if not items:
        raise HTTPException(
            status_code=400,
            detail='Request body must contain at least one article.'
        )

    if not os.getenv('HF_API_TOKEN'):
        raise HTTPException(
            status_code=503,
            detail='HF_API_TOKEN is not configured for the predictor.'
        )

    scored_items = []

    # ---------------------------------------
    # 1. SCORE EACH ARTICLE
    # ---------------------------------------

    for item in items:

        sentiment = finbert.score(item.text)

        credibility = cred_calc.score(item)

        scored_item = ScoredItem(
            raw=item,
            sentiment=sentiment,
            credibility=credibility,
        )

        scored_items.append(scored_item)

    # ---------------------------------------
    # 2. BUILD AGGREGATE MOMENTUM
    # ---------------------------------------

    results = {}

    tickers = {
        item.raw.ticker
        for item in scored_items
    }

    for ticker in tickers:

        ticker_items = [
            item
            for item in scored_items
            if item.raw.ticker == ticker
        ]

        reading = tracker.update(
            ticker,
            ticker_items
        )

        # ---------------------------------------
        # 3. ARTICLE-LEVEL RESULTS
        # ---------------------------------------

        article_results = []

        for item in ticker_items:

            article_results.append({
                'title': item.raw.title,
                'description': item.raw.description,

                'text': item.raw.text,

                'source_name': item.raw.source_name,
                'source_url': item.raw.source_url,
                'source_type': item.raw.source_type.value,

                'published_at': item.raw.timestamp,

                'ticker': item.raw.ticker,

                'relevance_score': item.raw.relevance_score,
                'is_full_text': item.raw.is_full_text,

                'sentiment': {
                    'positive': item.sentiment.positive,
                    'negative': item.sentiment.negative,
                    'neutral': item.sentiment.neutral,
                    'label': item.sentiment.label,
                    'signed_score': item.sentiment.signed_score,
                },

                'credibility': item.credibility,

                'weighted_sentiment': item.weighted_sentiment,
            })

        results[ticker] = {

            'current_reading': reading,

            'ema_momentum': tracker.ema_momentum(ticker),

            'articles': article_results,
        }

    return {
        'status': 'success',
        'data': results,
    }