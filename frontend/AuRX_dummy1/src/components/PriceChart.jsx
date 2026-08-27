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

  const [hoveredIndex, setHoveredIndex] =
    useState(null)

  const [mousePosition, setMousePosition] =
    useState({
      x: 0,
      y: 0,
    })

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

  const height = 470

  const padding = {
    top: 25,
    right: 80,
    bottom: 35,
    left: 15,
  }

  const volumeHeight = 65
  const volumeGap = 15

  const chartWidth =
    Math.max(
      width -
        padding.left -
        padding.right,
      300
    )

  const chartHeight =
    height -
    padding.top -
    padding.bottom -
    volumeHeight -
    volumeGap

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

  const maxVolume =
    data.length
      ? Math.max(
          ...data.map(
            (candle) => candle.volume || 0
          )
        )
      : 1

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
        (
          chartWidth /
          Math.max(data.length, 1)
        ) * 0.65,
        12
      ),
      2
    )

  const getCandleX = (index) => {
    return (
      padding.left +
      (index + 0.5) *
      (chartWidth / data.length)
    )
  }

  const handleMouseMove = (event) => {
    if (!data.length) return

    const svg =
      event.currentTarget

    const rect =
      svg.getBoundingClientRect()

    const svgX =
      (
        (event.clientX - rect.left) /
        rect.width
      ) *
      width

    const relativeX =
      svgX - padding.left

    const candleWidthSpace =
      chartWidth / data.length

    let index =
      Math.floor(
        relativeX /
        candleWidthSpace
      )

    index =
      Math.max(
        0,
        Math.min(
          data.length - 1,
          index
        )
      )

    setHoveredIndex(index)

    const containerRect =
      containerRef.current?.getBoundingClientRect()

    if (containerRect) {
      setMousePosition({
        x:
          event.clientX -
          containerRect.left,

        y:
          event.clientY -
          containerRect.top,
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  const hoveredCandle =
    hoveredIndex !== null
      ? data[hoveredIndex]
      : null

  const currentCandle =
    data.at(-1)

  const currentPrice =
    currentCandle?.close

  const currentPriceY =
    currentPrice !== undefined
      ? priceToY(currentPrice)
      : null

  const hoveredPriceY =
    hoveredCandle
      ? priceToY(
          hoveredCandle.close
        )
      : null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

      {/* HEADER */}

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


      {/* CHART */}

      <div
        ref={containerRef}
        className="relative h-[470px] w-full"
      >

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-white/40">
            Loading market data...
          </div>
        )}


        {!loading &&
          data.length > 0 && (

          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >

            {/* =========================
                PRICE GRID
            ========================== */}

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


            {/* =========================
                CURRENT PRICE LINE
            ========================== */}

            {currentPriceY !== null && (
              <g>

                <line
                  x1={padding.left}
                  x2={
                    width -
                    padding.right
                  }
                  y1={currentPriceY}
                  y2={currentPriceY}
                  stroke="rgba(255,215,0,0.35)"
                  strokeDasharray="5 5"
                />

                <rect
                  x={
                    width -
                    padding.right +
                    4
                  }
                  y={
                    currentPriceY - 10
                  }
                  width="68"
                  height="20"
                  rx="4"
                  fill="#facc15"
                />

                <text
                  x={
                    width -
                    padding.right +
                    38
                  }
                  y={
                    currentPriceY + 4
                  }
                  textAnchor="middle"
                  fill="#000"
                  fontSize="11"
                  fontWeight="700"
                >
                  {currentPrice.toFixed(2)}
                </text>

              </g>
            )}


            {/* =========================
                CANDLESTICKS
            ========================== */}

            {data.map(
              (candle, index) => {

                const x =
                  getCandleX(index)

                const openY =
                  priceToY(
                    candle.open
                  )

                const closeY =
                  priceToY(
                    candle.close
                  )

                const highY =
                  priceToY(
                    candle.high
                  )

                const lowY =
                  priceToY(
                    candle.low
                  )

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
                      closeY -
                      openY
                    ),
                    2
                  )

                const hovered =
                  hoveredIndex ===
                  index

                return (
                  <g
                    key={candle.time}
                  >

                    {/* Hover background */}

                    {hovered && (
                      <rect
                        x={
                          x -
                          (
                            chartWidth /
                            data.length
                          ) /
                          2
                        }
                        y={
                          padding.top
                        }
                        width={
                          chartWidth /
                          data.length
                        }
                        height={
                          chartHeight
                        }
                        fill="rgba(255,255,255,0.035)"
                      />
                    )}


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
                      strokeWidth={
                        hovered
                          ? '2'
                          : '1.5'
                      }
                    />


                    {/* Body */}

                    <rect
                      x={
                        x -
                        candleWidth /
                        2
                      }
                      y={bodyTop}
                      width={
                        candleWidth
                      }
                      height={
                        bodyHeight
                      }
                      rx="1"
                      fill={
                        bullish
                          ? '#10b981'
                          : '#ef4444'
                      }
                      opacity={
                        hovered
                          ? '1'
                          : '0.9'
                      }
                    />

                  </g>
                )
              }
            )}


            {/* =========================
                HOVER CROSSHAIR
            ========================== */}

            {hoveredCandle &&
              hoveredIndex !== null && (
                <g>

                  {/* Vertical */}

                  <line
                    x1={
                      getCandleX(
                        hoveredIndex
                      )
                    }
                    x2={
                      getCandleX(
                        hoveredIndex
                      )
                    }
                    y1={
                      padding.top
                    }
                    y2={
                      padding.top +
                      chartHeight
                    }
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="4 4"
                  />


                  {/* Horizontal */}

                  <line
                    x1={padding.left}
                    x2={
                      width -
                      padding.right
                    }
                    y1={hoveredPriceY}
                    y2={hoveredPriceY}
                    stroke="rgba(255,255,255,0.25)"
                    strokeDasharray="4 4"
                  />


                  {/* Price marker */}

                  <rect
                    x={
                      width -
                      padding.right +
                      4
                    }
                    y={
                      hoveredPriceY -
                      10
                    }
                    width="68"
                    height="20"
                    rx="4"
                    fill="#ffffff"
                  />

                  <text
                    x={
                      width -
                      padding.right +
                      38
                    }
                    y={
                      hoveredPriceY +
                      4
                    }
                    textAnchor="middle"
                    fill="#000"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {hoveredCandle.close.toFixed(
                      2
                    )}
                  </text>

                </g>
              )}


            {/* =========================
                VOLUME AREA
            ========================== */}

            <line
              x1={padding.left}
              x2={
                width -
                padding.right
              }
              y1={
                padding.top +
                chartHeight +
                volumeGap
              }
              y2={
                padding.top +
                chartHeight +
                volumeGap
              }
              stroke="rgba(255,255,255,0.08)"
            />

            {data.map(
              (candle, index) => {

                const x =
                  getCandleX(index)

                const volume =
                  candle.volume || 0

                const barHeight =
                  maxVolume
                    ? (
                        volume /
                        maxVolume
                      ) *
                      volumeHeight
                    : 0

                const bullish =
                  candle.close >=
                  candle.open

                return (
                  <rect
                    key={`volume-${candle.time}`}
                    x={
                      x -
                      candleWidth /
                      2
                    }
                    y={
                      height -
                      padding.bottom -
                      barHeight
                    }
                    width={
                      candleWidth
                    }
                    height={
                      barHeight
                    }
                    fill={
                      bullish
                        ? 'rgba(16,185,129,0.35)'
                        : 'rgba(239,68,68,0.35)'
                    }
                  />
                )
              }
            )}


            {/* =========================
                X AXIS TIME LABELS
            ========================== */}

            {data.map(
              (candle, index) => {

                const every =
                  Math.max(
                    1,
                    Math.floor(
                      data.length /
                      6
                    )
                  )

                if (
                  index % every !==
                  0
                ) {
                  return null
                }

                const x =
                  getCandleX(index)

                const date =
                  new Date(
                    candle.time
                  )

                const label =
                  date.toLocaleTimeString(
                    [],
                    {
                      hour:
                        '2-digit',
                      minute:
                        '2-digit',
                    }
                  )

                return (
                  <text
                    key={`time-${candle.time}`}
                    x={x}
                    y={
                      height -
                      8
                    }
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.35)"
                    fontSize="11"
                  >
                    {label}
                  </text>
                )
              }
            )}

          </svg>
        )}


        {/* =========================
            HOVER TOOLTIP
        ========================== */}

        {hoveredCandle && (
          <div
            className="pointer-events-none absolute z-20 w-64 rounded-xl border border-white/10 bg-[#111]/95 p-4 shadow-2xl backdrop-blur-md"
            style={{
              left: Math.min(
                mousePosition.x + 15,
                width - 285
              ),
              top: Math.max(
                mousePosition.y - 150,
                10
              ),
            }}
          >

            <div className="mb-3 text-xs text-white/40">
              {new Date(
                hoveredCandle.time
              ).toLocaleString()}
            </div>


            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">

              <div>
                <span className="text-white/40">
                  Open
                </span>

                <div className="font-semibold">
                  ${hoveredCandle.open.toFixed(2)}
                </div>
              </div>


              <div>
                <span className="text-white/40">
                  Close
                </span>

                <div className="font-semibold">
                  ${hoveredCandle.close.toFixed(2)}
                </div>
              </div>


              <div>
                <span className="text-white/40">
                  High
                </span>

                <div className="font-semibold text-emerald-400">
                  ${hoveredCandle.high.toFixed(2)}
                </div>
              </div>


              <div>
                <span className="text-white/40">
                  Low
                </span>

                <div className="font-semibold text-red-400">
                  ${hoveredCandle.low.toFixed(2)}
                </div>
              </div>


              <div>
                <span className="text-white/40">
                  Candle %
                </span>

                <div
                  className={
                    hoveredCandle.close >=
                    hoveredCandle.open
                      ? 'font-semibold text-emerald-400'
                      : 'font-semibold text-red-400'
                  }
                >
                  {(
                    (
                      (
                        hoveredCandle.close -
                        hoveredCandle.open
                      ) /
                      hoveredCandle.open
                    ) *
                    100
                  ).toFixed(3)}
                  %
                </div>
              </div>


              <div>
                <span className="text-white/40">
                  Range
                </span>

                <div className="font-semibold">
                  ${(
                    hoveredCandle.high -
                    hoveredCandle.low
                  ).toFixed(2)}
                </div>
              </div>

            </div>


            <div className="mt-3 border-t border-white/10 pt-3">

              <span className="text-xs text-white/40">
                Volume
              </span>

              <div className="mt-1 text-xs font-semibold">
                {Number(
                  hoveredCandle.volume || 0
                ).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  )
}