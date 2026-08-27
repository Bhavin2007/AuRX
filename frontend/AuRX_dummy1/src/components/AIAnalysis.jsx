import { useRecoilValue } from 'recoil'

import { sentimentState } from '../state/sentimentState'

export default function AIAnalysis() {

  const sentiment =
    useRecoilValue(sentimentState)

  const score =
    Number.isFinite(
      sentiment.finalScore
    )
      ? sentiment.finalScore
      : 0

  const weightedScore =
    Number(
      sentiment.currentWindow
        ?.weightedScore ?? 0
    )

  const credibility =
    Number(
      sentiment.currentWindow
        ?.totalCredibility ?? 0
    )

  const momentum =
    Number(
      sentiment.momentum?.value ?? 0
    )

  const emaMomentum =
    Number(
      sentiment.emaMomentum ?? 0
    )

  const articles =
    sentiment.currentWindow
      ?.articleCount ?? 0

  const bias =
    sentiment.bias || 'NEUTRAL'

  const direction =
    sentiment.momentum?.direction ||
    'FLAT'

  return (
    <section>

      <div className="mb-5">
        <h2 className="text-2xl font-bold">
          AI Analysis
        </h2>

        <p className="text-sm text-white/40">
          Detailed sentiment intelligence from analyzed news
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <Metric
          title="Sentiment Score"
          value={`${score}%`}
          description="Overall market sentiment"
          accent
        />

        <Metric
          title="Weighted Sentiment"
          value={weightedScore.toFixed(4)}
          description="Credibility-weighted news sentiment"
          positive={weightedScore > 0}
          negative={weightedScore < 0}
        />

        <Metric
          title="Total Credibility"
          value={credibility.toFixed(2)}
          description="Combined article credibility"
        />

        <Metric
          title="Momentum"
          value={momentum.toFixed(4)}
          description="Change in sentiment"
          positive={momentum > 0}
          negative={momentum < 0}
        />

        <Metric
          title="EMA Momentum"
          value={emaMomentum.toFixed(4)}
          description="Smoothed momentum signal"
          positive={emaMomentum > 0}
          negative={emaMomentum < 0}
        />

        <Metric
          title="Market Direction"
          value={direction}
          description={`${articles} articles analyzed`}
          positive={direction === 'IMPROVING'}
          negative={direction === 'DETERIORATING'}
        />

      </div>

    </section>
  )
}


function Metric({
  title,
  value,
  description,
  positive,
  negative,
  accent,
}) {

  let valueClass =
    'text-white'

  if (accent) {
    valueClass =
      'text-yellow-400'
  } else if (positive) {
    valueClass =
      'text-emerald-400'
  } else if (negative) {
    valueClass =
      'text-red-400'
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">

      <div className="text-sm text-white/40">
        {title}
      </div>

      <div
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </div>

      <div className="mt-2 text-xs text-white/30">
        {description}
      </div>

    </div>
  )
}