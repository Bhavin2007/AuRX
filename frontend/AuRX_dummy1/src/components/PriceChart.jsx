import { useMemo, useState, useEffect, useRef } from 'react'
import { useRecoilValue } from 'recoil'

import { marketState } from '../state/marketState'
import { timeframeState } from '../state/atoms'

import TimeframeSelector from './TimeFrameSelector'

export default function PriceChart() {
  const { chartData, loading } =
    useRecoilValue(marketState)

  const timeframe =
    useRecoilValue(timeframeState)

  const containerRef =
    useRef(null)

  const [width, setWidth] =
    useState(1000)

  useEffect(() => {
    if (!containerRef.current) return

    const observer =
      new ResizeObserver((entries) => {
        const nextWidth =
          entries[0]?.contentRect.width

        if (nextWidth) {
          setWidth(nextWidth)
        }
      })

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  const data = useMemo(() => {
    return [...chartData].slice(-100)
  }, [chartData])

  const height = 430

  const padding = {
    top: 20,
    right: 70,
    bottom: 35,
    left: 15,
  }

  const chartWidth =
    Math.max(
      width - padding.left - padding.right,
      300
    )

  const chartHeight =
    height -
    padding.top -
    padding.bottom

  const prices = data.flatMap((candle) => [
    candle.high,
    candle.low,
  ])

  const minPrice =
    prices.length
      ? Math.min(...prices)
      : 0

  const maxPrice =
    prices.length
      ? Math.max(...prices)
      : 1

  const priceRange =
    maxPrice - minPrice || 1

  const priceToY = (price) => {
    return (
      padding.top +
      (
        (maxPrice - price) /
        priceRange
      ) *
      chartHeight
    )
  }

  const candleWidth =
    Math.max(
      Math.min(
        chartWidth / Math.max(data.length, 1) * 0.65,
        12
      ),
      2
    )

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-2xl font-bold">
            Live XAUUSDT Chart
          </h2>

          <p className="text-sm text-white/40">
            Binance Futures • {timeframe}
          </p>
        </div>

        <TimeframeSelector />

      </div>

      <div
        ref={containerRef}
        className="relative h-[430px] w-full"
      >

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/40">
            Loading market data...
          </div>
        )}

        {!loading && data.length > 0 && (
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >

            {/* Horizontal grid lines */}

            {[0, 0.25, 0.5, 0.75, 1].map(
              (position) => {

                const y =
                  padding.top +
                  position *
                    chartHeight

                const price =
                  maxPrice -
                  position *
                    priceRange

                return (
                  <g key={position}>

                    <line
                      x1={padding.left}
                      x2={
                        width -
                        padding.right
                      }
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                    />

                    <text
                      x={
                        width -
                        padding.right +
                        10
                      }
                      y={y + 4}
                      fill="rgba(255,255,255,0.4)"
                      fontSize="12"
                    >
                      {price.toFixed(2)}
                    </text>

                  </g>
                )
              }
            )}

            {data.map((candle, index) => {

              const x =
                padding.left +
                (
                  index + 0.5
                ) *
                (
                  chartWidth /
                  data.length
                )

              const openY =
                priceToY(candle.open)

              const closeY =
                priceToY(candle.close)

              const highY =
                priceToY(candle.high)

              const lowY =
                priceToY(candle.low)

              const bullish =
                candle.close >=
                candle.open

              const bodyTop =
                Math.min(
                  openY,
                  closeY
                )

              const bodyHeight =
                Math.max(
                  Math.abs(
                    closeY - openY
                  ),
                  2
                )

              return (
                <g key={candle.time}>

                  {/* Wick */}

                  <line
                    x1={x}
                    x2={x}
                    y1={highY}
                    y2={lowY}
                    stroke={
                      bullish
                        ? '#10b981'
                        : '#ef4444'
                    }
                    strokeWidth="1.5"
                  />

                  {/* Candle body */}

                  <rect
                    x={
                      x -
                      candleWidth / 2
                    }
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    rx="1"
                    fill={
                      bullish
                        ? '#10b981'
                        : '#ef4444'
                    }
                    opacity="0.9"
                  />

                </g>
              )
            })}

          </svg>
        )}

        {!loading &&
          data.length === 0 && (
            <div className="flex h-full items-center justify-center text-white/40">
              No market data available
            </div>
          )}

      </div>

    </div>
  )
}