import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from models import RawItem, ScoredItem
from finBert import FinBertHFApiClient
from credibility import CredibilityCalculator
from momentum import MomentumTracker

load_dotenv()

app = FastAPI(title='AuRX Commodity Sentiment Predictor', version='1.0.0')

finbert = FinBertHFApiClient(api_token=os.getenv('HF_API_TOKEN'))
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
        raise HTTPException(status_code=400, detail='Request body must contain at least one article.')

    if not os.getenv('HF_API_TOKEN'):
        raise HTTPException(
            status_code=503,
            detail='HF_API_TOKEN is not configured for the predictor.',
        )

    scored_items = []

    for item in items:
        sentiment = finbert.score(item.text)
        credibility = cred_calc.score(item)

        scored_items.append(
            ScoredItem(
                raw=item,
                sentiment=sentiment,
                credibility=credibility,
            )
        )

    results = {}
    tickers = {item.raw.ticker for item in scored_items}

    for ticker in tickers:
        ticker_items = [item for item in scored_items if item.raw.ticker == ticker]
        reading = tracker.update(ticker, ticker_items)

        results[ticker] = {
            'current_reading': reading,
            'ema_momentum': tracker.ema_momentum(ticker),
        }

    return {
        'status': 'success',
        'data': results,
    }
