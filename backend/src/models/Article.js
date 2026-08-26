const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    text: {
      type: String,
      default: '',
    },

    sourceName: {
      type: String,
      required: true,
      trim: true,
    },

    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },

    sourceType: {
      type: String,
      default: 'unknown',
    },

    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },

    relevanceScore: {
      type: Number,
      default: 1,
    },

    isFullText: {
      type: Boolean,
      default: false,
    },

    sentiment: {
      positive: {
        type: Number,
        required: true,
      },

      negative: {
        type: Number,
        required: true,
      },

      neutral: {
        type: Number,
        required: true,
      },

      label: {
        type: String,
        required: true,
      },

      signedScore: {
        type: Number,
        required: true,
      },
    },

    credibility: {
      type: Number,
      required: true,
    },

    weightedSentiment: {
      type: Number,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);


// Prevent the same article from being stored repeatedly.
ArticleSchema.index(
  {
    ticker: 1,
    sourceUrl: 1,
  },
  {
    unique: true,
  }
);


// Useful for retrieving newest articles.
ArticleSchema.index({
  ticker: 1,
  publishedAt: -1,
});


module.exports = mongoose.model(
  'Article',
  ArticleSchema
);