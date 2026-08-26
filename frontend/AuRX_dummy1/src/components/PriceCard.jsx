import { useRecoilValue } from 'recoil'

import { marketState } from '../state/marketState'

export default function PriceCard() {
  const market = useRecoilValue(marketState)

  const price = market.price
  const change = market.priceChangePercent

  const positive = change >= 0

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
      <div className="mb-2 text-sm text-white/50">
        XAUUSDT GOLD FUTURES
      </div>

      <div className="text-4xl font-bold tracking-tight text-yellow-400">
        {price
          ? `$${price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : 'Loading...'}
      </div>

      <div
        className={`mt-2 text-lg font-semibold ${
          positive ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </div>

      <div className="mt-4 text-xs text-white/40">
        Binance Futures • Live
      </div>
    </div>
  )
}