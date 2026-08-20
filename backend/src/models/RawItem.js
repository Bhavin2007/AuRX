const mongoose = require('mongoose');

const RawItemSchema = new mongoose.Schema({
  ticker: { type: String, required: true },
  sourceName: { type: String, required: true },
  sourceType: { type: String, enum: ['policy', 'institutional', 'analyst', 'social'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  finbertScore: { type: Number, required: true },
  credibilityScore: { type: Number, required: true }
});

module.exports = mongoose.model('RawItem', RawItemSchema);