const express = require('express');

const Article = require('../models/Article');

const router = express.Router();


// =====================================================
// SAVE ARTICLE RESULTS
// =====================================================

router.post('/save-articles', async (req, res) => {

  try {

    const payload = req.body;

    if (
      !payload ||
      payload.status !== 'success' ||
      !payload.data
    ) {
      return res.status(400).json({
        error: 'Invalid predictor response',
      });
    }

    const documents = [];

    for (const [ticker, tickerData] of Object.entries(
      payload.data
    )) {

      const articles = tickerData?.articles || [];

      for (const article of articles) {

        documents.push({
          ticker: ticker.toUpperCase(),

          title: article.title,

          description:
            article.description || '',

          text:
            article.text || '',

          sourceName:
            article.source_name,

          sourceUrl:
            article.source_url,

          sourceType:
            article.source_type || 'unknown',

          publishedAt:
            article.published_at,

          relevanceScore:
            article.relevance_score ?? 1,

          isFullText:
            article.is_full_text ?? false,

          sentiment: {
            positive:
              article.sentiment.positive,

            negative:
              article.sentiment.negative,

            neutral:
              article.sentiment.neutral,

            label:
              article.sentiment.label,

            signedScore:
              article.sentiment.signed_score,
          },

          credibility:
            article.credibility,

          weightedSentiment:
            article.weighted_sentiment,
        });
      }
    }

    if (documents.length === 0) {

      return res.status(400).json({
        error: 'No articles found in predictor response',
      });

    }


    // ordered:false means one duplicate does not
    // prevent other articles from being inserted.

    const inserted = await Article.insertMany(
      documents,
      {
        ordered: false,
      }
    );

    return res.status(201).json({

      status: 'success',

      message: 'Articles saved successfully',

      count: inserted.length,

    });

  } catch (error) {

    // Duplicate articles are expected when the
    // scraper sees an already-processed article.

    if (error.code === 11000) {

      return res.status(201).json({

        status: 'success',

        message:
          'Articles processed; duplicate articles skipped.',

      });

    }

    console.error(
      'Error saving articles:',
      error
    );

    return res.status(500).json({

      error: 'Failed to save articles',

      details: error.message,

    });

  }

});


// =====================================================
// GET LATEST ARTICLES
// =====================================================

router.get('/articles/:ticker', async (req, res) => {

  try {

    const ticker =
      req.params.ticker
        .trim()
        .toUpperCase();


    const requestedLimit =
      Number(req.query.limit || 20);


    const limit =
      Number.isFinite(requestedLimit)
        ? Math.min(
            Math.max(
              Math.floor(requestedLimit),
              1
            ),
            100
          )
        : 20;


    const articles = await Article
      .find({ ticker })
      .sort({
        publishedAt: -1,
      })
      .limit(limit)
      .lean();


    return res.json({

      ticker,

      count: articles.length,

      data: articles,

    });

  } catch (error) {

    console.error(
      'Error fetching articles:',
      error
    );

    return res.status(500).json({

      error:
        'Failed to fetch articles',

      details:
        error.message,

    });

  }

});


module.exports = router;