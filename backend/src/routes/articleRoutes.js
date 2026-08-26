const express = require('express');

const Article = require('../models/Article');

const router = express.Router();


// =====================================================
// SAVE ARTICLE RESULTS
// =====================================================

router.post('/save-articles', async (req, res) => {

  try {

    const payload = req.body

    if (
      !payload ||
      payload.status !== 'success' ||
      !payload.data
    ) {

      return res.status(400).json({
        error: 'Invalid predictor response',
      })

    }


    const documents = []


    for (
      const [ticker, tickerData]
      of Object.entries(payload.data)
    ) {

      const articles =
        tickerData?.articles || []


      for (const article of articles) {

        if (
          !article.source_url ||
          !article.title
        ) {
          continue
        }


        documents.push({

          ticker:
            ticker.toUpperCase(),

          title:
            article.title,

          description:
            article.description || '',

          text:
            article.text || '',

          sourceName:
            article.source_name || 'Unknown',

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
              article.sentiment?.positive ?? 0,

            negative:
              article.sentiment?.negative ?? 0,

            neutral:
              article.sentiment?.neutral ?? 0,

            label:
              article.sentiment?.label || 'neutral',

            signedScore:
              article.sentiment?.signed_score ?? 0,

          },

          credibility:
            article.credibility ?? 0,

          weightedSentiment:
            article.weighted_sentiment ?? 0,

        })

      }

    }


    if (!documents.length) {

      return res.status(400).json({
        error:
          'No valid articles found in predictor response',
      })

    }


    let inserted = 0
    let updated = 0


    for (const document of documents) {

      const result =
        await Article.updateOne(

          {
            ticker:
              document.ticker,

            sourceUrl:
              document.sourceUrl,

          },

          {
            $set:
              document,

          },

          {
            upsert: true,

          }

        )


      if (result.upsertedCount > 0) {

        inserted++

      } else if (result.modifiedCount > 0) {

        updated++

      }

    }


    return res.status(200).json({

      status: 'success',

      message:
        'Articles processed successfully',

      received:
        documents.length,

      inserted,

      updated,

    })


  } catch (error) {

    console.error(
      'Error saving articles:',
      error
    )


    return res.status(500).json({

      error:
        'Failed to save articles',

      details:
        error.message,

    })

  }

})


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