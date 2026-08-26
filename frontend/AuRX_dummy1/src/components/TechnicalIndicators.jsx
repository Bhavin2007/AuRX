import { useMemo } from 'react'
import { useRecoilValue } from 'recoil'

import { marketState } from '../state/marketState'

import {
  calculateRSI,
  calculateEMA,
  calculateMACD,
} from '../utils/indicators'

export default function TechnicalIndicators() {
  const { chartData: candles } = useRecoilValue(marketState)

  const rsi = useMemo(
    () => calculateRSI(candles),
    [candles]
  )

  const ema20 = useMemo(
    () => calculateEMA(candles, 20),
    [candles]
  )

  const ema50 = useMemo(
    () => calculateEMA(candles, 50),
    [candles]
  )

  const macd = useMemo(
    () => calculateMACD(candles),
    [candles]
  )

  const currentPrice = candles.at(-1)?.close

  const emaTrend =
    currentPrice && ema50
      ? currentPrice > ema50
        ? 'Above EMA50'
        : 'Below EMA50'
      : 'Loading'

  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold">
        Technical Indicators
      </h2>

      <div className="grid gap-4 md:grid-cols-4">

        <Indicator
          title="RSI"
          value={rsi ? rsi.toFixed(1) : '—'}
          positive={rsi ? rsi > 50 : false}
        />

        <Indicator
          title="MACD"
          value={
            macd
              ? macd.bullish
                ? 'Bullish'
                : 'Bearish'
              : '—'
          }
          positive={macd?.bullish}
        />

        <Indicator
          title="EMA 20"
          value={
            ema20
              ? `$${ema20.toFixed(2)}`
              : '—'
          }
          positive
        />

        <Indicator
          title="Trend"
          value={emaTrend}
          positive={emaTrend === 'Above EMA50'}
        />

      </div>
    </section>
  )
}

function Indicator({ title, value, positive }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-sm text-white/40">
        {title}
      </div>

      <div
        className={`mt-2 text-xl font-bold ${
          positive
            ? 'text-emerald-400'
            : 'text-red-400'
        }`}
      >
        {value}
      </div>
    </div>
  )
}