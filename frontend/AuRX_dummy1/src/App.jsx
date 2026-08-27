import { useRecoilValue } from 'recoil'

import { symbolState } from './state/atoms'

import { useBinanceTicker } from './hooks/useBinanceTicker'
import { useBinanceKlines } from './hooks/useBinanceKlines'
import { useMomentum } from './hooks/useMomentum'
import { useArticles } from './hooks/useArticles'

import PriceCard from './components/PriceCard'
import PriceChart from './components/PriceChart'
import NewsSentiment from './components/NewsSentiment'
import TechnicalIndicators from './components/TechnicalIndicators'
import AIAnalysis from './components/AIAnalysis'
import KeyNews from './components/KeyNews'

function App() {

  const symbol =
    useRecoilValue(symbolState)

  useBinanceTicker(symbol)
  useBinanceKlines(symbol)
  useMomentum('GOLD')
  useArticles('GOLD')

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <header className="border-b border-white/10">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-7 md:px-8">

          <div>

            <div className="text-4xl font-black tracking-tight text-yellow-400">
              AuRX
            </div>

            <div className="mt-1 text-white/60">
              AI Gold Sentiment Intelligence
            </div>

          </div>

          <div className="flex items-center gap-2 text-emerald-400">

            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />

            LIVE XAUUSDT

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">

        {/* PRICE + OVERALL SENTIMENT */}

        <section className="grid gap-6 lg:grid-cols-2">

          <PriceCard />

          <NewsSentiment />

        </section>


        {/* MARKET CHART */}

        <PriceChart />


        {/* TECHNICAL INDICATORS */}

        <TechnicalIndicators />


        {/* DETAILED AI DATA */}

        <AIAnalysis />


        {/* IMPORTANT NEWS */}

        <KeyNews />

      </div>

    </main>
  )
}

export default App