import { useEffect } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'

import { timeframeState } from '../state/atoms'
import { marketState } from '../state/marketState'

export function useBinanceKlines(symbol = 'XAUUSDT') {
  const timeframe = useRecoilValue(timeframeState)

  const [, setMarket] = useRecoilState(marketState)

  useEffect(() => {
    let socket

    async function loadHistory() {
      try {
        setMarket((current) => ({
          ...current,
          loading: true,
          error: null,
        }))

        const response = await fetch(
          `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=200`
        )

        if (!response.ok) {
          throw new Error(`Binance HTTP ${response.status}`)
        }

        const data = await response.json()

        const formatted = data.map((candle) => ({
          time: candle[0],
          open: Number(candle[1]),
          high: Number(candle[2]),
          low: Number(candle[3]),
          close: Number(candle[4]),
          volume: Number(candle[5]),
        }))

        setMarket((current) => ({
          ...current,
          chartData: formatted,
          loading: false,
          error: null,
        }))
      } catch (error) {
        console.error('Failed to load Binance candles:', error)

        setMarket((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }))
      }
    }

    loadHistory()

    socket = new WebSocket(
      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@kline_${timeframe}`
    )

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const k = data.k

      const candle = {
        time: k.t,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close: Number(k.c),
        volume: Number(k.v),
      }

      setMarket((current) => {
        const candles = [...current.chartData]

        const index = candles.findIndex(
          (item) => item.time === candle.time
        )

        if (index >= 0) {
          candles[index] = candle
        } else {
          candles.push(candle)
        }

        return {
          ...current,
          chartData: candles.slice(-200),
        }
      })
    }

    socket.onerror = (error) => {
      console.error('Binance kline error:', error)
    }

    return () => {
      socket?.close()
    }
  }, [symbol, timeframe, setMarket])
}