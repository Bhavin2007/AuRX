import { atom } from "recoil";

export const sentimentState = atom({
  key: "sentimentState",

  default: {
    ticker: "GOLD",

    finalScore: 0,
    bias: "NEUTRAL",

    momentum: {
      value: 0,
      delta: 0,
      direction: "STABLE",
    },

    emaMomentum: 0,

    currentWindow: {
      articleCount: 0,
      weightedScore: 0,
      totalCredibility: 0,
    },

    confidence: 0,

    timestamp: null,

    loading: true,
    error: null,
  },
});