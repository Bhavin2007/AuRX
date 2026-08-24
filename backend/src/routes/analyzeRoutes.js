const express = require('express');
const MomentumSnapshot = require('../models/Momentum');

const router = express.Router();

function score(weightedSentiment) {
  return Math.max(0, Math.min(100, Math.round(((weightedSentiment + 1) / 2) * 100)));
}

function bias(finalScore) {
  if (finalScore >= 60) return 'BULLISH';
  if (finalScore <= 40) return 'BEARISH';
  return 'NEUTRAL';
}

function direction(momentum) {
  if (momentum > 0.05) return 'IMPROVING';
  if (momentum < -0.05) return 'DETERIORATING';
  return 'FLAT';
}

function serialize(snapshot) {
  const finalScore = score(snapshot.weightedSentiment);

  return {
    ticker: snapshot.ticker,
    finalScore,
    bias: bias(finalScore),
    momentum: {
      delta: snapshot.momentum,
      value: snapshot.momentum,
      direction: direction(snapshot.momentum),
    },
    emaMomentum: snapshot.emaMomentum,
    currentWindow: {
      articleCount: snapshot.itemCount,
      weightedScore: snapshot.weightedSentiment,
      totalCredibility: snapshot.totalCredibilityWeight,
    },
    timestamp: snapshot.timestamp,
  };
}

// Backward-compatible frontend endpoint. It reads the latest stored result;
// it does not run the old Node/RSS/FinBERT pipeline.
router.get('/analyze/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.trim().toUpperCase();

    const latest = await MomentumSnapshot
      .findOne({ ticker })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({
        error: 'No analysis data available yet',
        ticker,
        message: 'Run the news scraper and predictor pipeline first.',
      });
    }

    return res.json(serialize(latest));
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve analysis',
      details: error.message,
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const latest = await MomentumSnapshot
      .findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.json({
        status: 'waiting',
        message: 'No predictor data has been received yet.',
      });
    }

    return res.json({
      status: 'ready',
      latestTicker: latest.ticker,
      latestTimestamp: latest.timestamp,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      details: error.message,
    });
  }
});

module.exports = router;
