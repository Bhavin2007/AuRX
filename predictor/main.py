import os
from concurrent.futures import ThreadPoolExecutor, as_completed
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
    version='1.1.0'
)


finbert = FinBertHFApiClient(
    api_token=os.getenv('HF_API_TOKEN')
)

cred_calc = CredibilityCalculator()

tracker = MomentumTracker()


# -------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------

MAX_WORKERS = int(
    os.getenv('PREDICTOR_WORKERS', '4')
)


@app.get('/health')
async def health():

    return {
        'status': 'ok',
        'service': 'predictor',
        'hf_token_configured': bool(
            os.getenv('HF_API_TOKEN')
        ),
        'workers': MAX_WORKERS,
    }


# -------------------------------------------------------
# SCORE ONE ARTICLE
# -------------------------------------------------------

def score_article(item: RawItem):

    sentiment = finbert.score(item.text)

    credibility = cred_calc.score(item)

    return ScoredItem(
        raw=item,
        sentiment=sentiment,
        credibility=credibility,
    )


# -------------------------------------------------------
# ANALYZE BATCH
# -------------------------------------------------------

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


    print(
        f'\nAnalyzing {len(items)} articles '
        f'using {MAX_WORKERS} workers...'
    )


    scored_items = []


    # ---------------------------------------------------
    # PARALLEL FINBERT PROCESSING
    # ---------------------------------------------------

    with ThreadPoolExecutor(
        max_workers=MAX_WORKERS
    ) as executor:

        futures = {
            executor.submit(
                score_article,
                item
            ): item

            for item in items
        }


        for future in as_completed(futures):

            item = futures[future]

            try:

                scored_item = future.result()

                scored_items.append(
                    scored_item
                )

                print(
                    f'✓ Scored: '
                    f'{item.title[:70]}'
                )

            except Exception as error:

                print(
                    f'✗ Failed: '
                    f'{item.title[:70]}'
                )

                print(
                    f'  Error: {error}'
                )


    if not scored_items:

        raise HTTPException(
            status_code=500,
            detail='No articles could be scored.'
        )


    print(
        f'Successfully scored '
        f'{len(scored_items)}/{len(items)} articles.'
    )


    # ---------------------------------------------------
    # BUILD AGGREGATE RESULTS
    # ---------------------------------------------------

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


        article_results = []


        for item in ticker_items:

            article_results.append({

                'title':
                    item.raw.title,

                'description':
                    item.raw.description,

                'text':
                    item.raw.text,

                'source_name':
                    item.raw.source_name,

                'source_url':
                    item.raw.source_url,

                'source_type':
                    item.raw.source_type.value,

                'published_at':
                    item.raw.timestamp,

                'ticker':
                    item.raw.ticker,

                'relevance_score':
                    item.raw.relevance_score,

                'is_full_text':
                    item.raw.is_full_text,

                'sentiment': {

                    'positive':
                        item.sentiment.positive,

                    'negative':
                        item.sentiment.negative,

                    'neutral':
                        item.sentiment.neutral,

                    'label':
                        item.sentiment.label,

                    'signed_score':
                        item.sentiment.signed_score,

                },

                'credibility':
                    item.credibility,

                'weighted_sentiment':
                    item.weighted_sentiment,

            })


        # Sort strongest evidence first.

        article_results.sort(
            key=lambda article:
                abs(
                    article['weighted_sentiment']
                ),
            reverse=True
        )


        results[ticker] = {

            'current_reading':
                reading,

            'ema_momentum':
                tracker.ema_momentum(ticker),

            'articles':
                article_results,

        }


    return {

        'status':
            'success',

        'data':
            results,

    }