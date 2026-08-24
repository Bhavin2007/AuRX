const express = require('express');
const MomentumSnapshot = require('../models/Momentum');

const router = express.Router();

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIsoDate(value) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sentimentToScore(weightedSentiment) {
  const score = Math.round(((weightedSentiment + 1) / 2) * 100);
  return Math.max(0, Math.min(100, score));
}

function scoreToBias(score) {
  if (score >= 60) return 'BULLISH';
  if (score <= 40) return 'BEARISH';
  return 'NEUTRAL';
}

function momentumToDirection(momentum) {
  if (momentum > 0.05) return 'IMPROVING';
  if (momentum < -0.05) return 'DETERIORATING';
  return 'FLAT';
}

function serializeSnapshot(snapshot) {
  const score = sentimentToScore(snapshot.weightedSentiment);

  return {
    ticker: snapshot.ticker,
    finalScore: score,
    bias: scoreToBias(score),
    momentum: {
      value: snapshot.momentum,
      delta: snapshot.momentum,
      direction: momentumToDirection(snapshot.momentum),
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

router.post('/save-momentum', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || payload.status !== 'success') {
      return res.status(400).json({
        error: 'Invalid predictor response',
        details: 'Expected { status: "success", data: {...} }',
      });
    }

    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
      return res.status(400).json({
        error: 'Invalid predictor response',
        details: 'data must be an object keyed by ticker',
      });
    }

    const snapshots = [];
    const invalidTickers = [];

    for (const [tickerKey, tickerData] of Object.entries(payload.data)) {
      const reading = tickerData?.current_reading;
      if (!reading) {
        invalidTickers.push(tickerKey);
        continue;
      }

      const ticker = String(reading.ticker || tickerKey).trim().toUpperCase();
      const timestamp = toIsoDate(reading.timestamp);
      const weightedSentiment = toNumber(reading.weighted_sentiment);
      const momentum = toNumber(reading.momentum);
      const itemCount = toNumber(reading.item_count);
      const totalCredibilityWeight = toNumber(reading.total_credibility_weight);
      const emaMomentum = toNumber(tickerData.ema_momentum, 0);

      if (
        !ticker ||
        !timestamp ||
        weightedSentiment === null ||
        momentum === null ||
        itemCount === null ||
        totalCredibilityWeight === null ||
        itemCount < 0 ||
        totalCredibilityWeight < 0 ||
        weightedSentiment < -1 ||
        weightedSentiment > 1
      ) {
        invalidTickers.push(tickerKey);
        continue;
      }

      snapshots.push({
        ticker,
        timestamp,
        weightedSentiment,
        momentum,
        itemCount,
        totalCredibilityWeight,
        emaMomentum,
      });
    }

    if (snapshots.length === 0) {
      return res.status(400).json({
        error: 'No valid momentum readings found',
        invalidTickers,
      });
    }

    const inserted = await MomentumSnapshot.insertMany(snapshots);

    return res.status(201).json({
      status: 'success',
      message: 'Momentum data saved successfully',
      saved: inserted.map((snapshot) => ({
        ticker: snapshot.ticker,
        id: snapshot._id,
        timestamp: snapshot.timestamp,
      })),
      invalidTickers,
    });
  } catch (error) {
    console.error('Error saving momentum:', error);
    return res.status(500).json({
      error: 'Failed to save momentum',
      details: error.message,
    });
  }
});

router.get('/momentum/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.trim().toUpperCase();

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const latest = await MomentumSnapshot
      .findOne({ ticker })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({
        error: 'No momentum data found',
        ticker,
      });
    }

    return res.json(serializeSnapshot(latest));
  } catch (error) {
    console.error('Error fetching momentum:', error);
    return res.status(500).json({
      error: 'Failed to fetch momentum',
      details: error.message,
    });
  }
});

router.get('/momentum/:ticker/history', async (req, res) => {
  try {
    const ticker = req.params.ticker.trim().toUpperCase();
    const requestedLimit = Number(req.query.limit || 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 500)
      : 50;

    const history = await MomentumSnapshot
      .find({ ticker })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.json({
      ticker,
      count: history.length,
      data: history.map(serializeSnapshot),
    });
  } catch (error) {
    console.error('Error fetching momentum history:', error);
    return res.status(500).json({
      error: 'Failed to fetch momentum history',
      details: error.message,
    });
  }
});

router.get('/momentum', async (req, res) => {
  try {
    const snapshots = await MomentumSnapshot.aggregate([
      { $sort: { ticker: 1, timestamp: -1 } },
      { $group: { _id: '$ticker', latest: { $first: '$$ROOT' } } },
      { $sort: { '_id': 1 } },
    ]);

    return res.json({
      count: snapshots.length,
      data: snapshots.map(({ latest }) => serializeSnapshot(latest)),
    });
  } catch (error) {
    console.error('Error fetching latest momentum:', error);
    return res.status(500).json({
      error: 'Failed to fetch latest momentum',
      details: error.message,
    });
  }
});

module.exports = router;
