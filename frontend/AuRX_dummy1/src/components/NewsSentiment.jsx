import { useRecoilValue } from 'recoil'

import { sentimentState } from '../state/sentimentState'

export default function NewsSentiment() {
  const sentiment = useRecoilValue(sentimentState)

  if (sentiment.loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
        <div className="text-white/50">
          Loading AI sentiment...
        </div>
      </div>
    )
  }

  if (sentiment.error) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-7">
        <div className="text-red-400">
          Failed to load AI sentiment
        </div>

        <div className="mt-2 text-sm text-white/50">
          {sentiment.error}
        </div>
      </div>
    )
  }

  const score = sentiment.finalScore
  const bias = sentiment.bias

  const biasColor =
    bias === 'BULLISH'
      ? 'text-emerald-400'
      : bias === 'BEARISH'
        ? 'text-red-400'
        : 'text-yellow-400'

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">
            AI MARKET SENTIMENT
          </p>

          <h2 className={`mt-1 text-3xl font-bold ${biasColor}`}>
            {bias}
          </h2>
        </div>

        <div className={`text-4xl font-bold ${biasColor}`}>
          {score}%
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-white/40">
            Articles
          </div>

          <div className="font-semibold">
            {sentiment.currentWindow.articleCount}
          </div>
        </div>

        <div>
          <div className="text-white/40">
            Momentum
          </div>

          <div className="font-semibold">
            {sentiment.momentum.value.toFixed(4)}
          </div>
        </div>

        <div>
          <div className="text-white/40">
            Direction
          </div>

          <div className="font-semibold">
            {sentiment.momentum.direction}
          </div>
        </div>
      </div>
    </div>
  )
}