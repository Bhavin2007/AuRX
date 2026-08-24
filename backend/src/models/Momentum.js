const mongoose = require('mongoose');

const MomentumSnapshotSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    weightedSentiment: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    momentum: {
      type: Number,
      required: true,
    },
    itemCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCredibilityWeight: {
      type: Number,
      required: true,
      min: 0,
    },
    emaMomentum: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

MomentumSnapshotSchema.index({ ticker: 1, timestamp: -1 });

module.exports = mongoose.model('MomentumSnapshot', MomentumSnapshotSchema);
