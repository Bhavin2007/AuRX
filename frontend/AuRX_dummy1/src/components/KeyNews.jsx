import { useMemo } from 'react'
import { useRecoilValue } from 'recoil'

import { articleState } from '../state/articleState'

export default function KeyNews() {

  const {
    articles,
    loading,
    error,
  } = useRecoilValue(articleState)

  const majorArticles =
    useMemo(() => {

      return [...articles]
        .sort((a, b) => {

          const aScore =
            Math.abs(
              Number(
                a.weightedSentiment ?? 0
              )
            ) *
            Number(
              a.credibility ?? 0
            ) *
            Math.max(
              Number(
                a.relevanceScore ?? 1
              ),
              1
            )

          const bScore =
            Math.abs(
              Number(
                b.weightedSentiment ?? 0
              )
            ) *
            Number(
              b.credibility ?? 0
            ) *
            Math.max(
              Number(
                b.relevanceScore ?? 1
              ),
              1
            )

          return bScore - aScore

        })
        .slice(0, 4)

    }, [articles])

  return (
    <section>

      <div className="mb-5 flex items-end justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            Key News
          </h2>

          <p className="text-sm text-white/40">
            The strongest news signals from the latest analysis
          </p>
        </div>

        <div className="text-sm text-white/30">
          {articles.length} analyzed
        </div>

      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/40">
          Loading articles...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-red-400">
          Failed to load articles: {error}
        </div>
      )}

      {!loading &&
        !error &&
        majorArticles.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/40">
            No articles available.
          </div>
        )}

      <div className="grid gap-4">

        {majorArticles.map(
          (article, index) => {

            const sentiment =
              article.sentiment
                ?.label
                ?.toUpperCase() ||
              'NEUTRAL'

            const weighted =
              Number(
                article.weightedSentiment ??
                0
              )

            const credibility =
              Number(
                article.credibility ??
                0
              )

            const sentimentColor =
              weighted > 0
                ? 'text-emerald-400'
                : weighted < 0
                  ? 'text-red-400'
                  : 'text-yellow-400'

            return (
              <article
                key={
                  article.sourceUrl ||
                  `${article.title}-${index}`
                }
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-yellow-400/30 hover:bg-white/[0.06]"
              >

                <div className="flex gap-4">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 font-bold text-yellow-400">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">

                      <span className="text-white/50">
                        {article.sourceName}
                      </span>

                      <span className="text-white/20">
                        •
                      </span>

                      <span
                        className={
                          sentimentColor
                        }
                      >
                        {sentiment}
                      </span>

                    </div>

                    <h3 className="text-lg font-semibold leading-snug">
                      {article.title}
                    </h3>

                    {article.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/40">
                        {article.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-5 text-xs">

                      <div>
                        <span className="text-white/30">
                          Credibility
                        </span>

                        <span className="ml-2 font-semibold text-white/70">
                          {credibility.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <span className="text-white/30">
                          Signal
                        </span>

                        <span
                          className={`ml-2 font-semibold ${sentimentColor}`}
                        >
                          {weighted.toFixed(4)}
                        </span>
                      </div>

                      <div>
                        <span className="text-white/30">
                          Relevance
                        </span>

                        <span className="ml-2 font-semibold text-white/70">
                          {Number(
                            article.relevanceScore ??
                            0
                          ).toFixed(1)}
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

              </article>
            )
          }
        )}

      </div>

    </section>
  )
}