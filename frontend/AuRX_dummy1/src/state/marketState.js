import { atom } from "recoil";

export const marketState = atom({
  key: "marketState",
  default: {
    symbol: "XAUUSDT",

    price: 0,
    priceChange: 0,
    priceChangePercent: 0,

    chartData: [],

    indicators: {
      rsi: null,
      macd: null,
      ema20: null,
      ema50: null,
      volume: null,
    },

    loading: true,
    error: null,

    lastUpdated: null,
  },
});