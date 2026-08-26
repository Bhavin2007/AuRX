import { useEffect } from 'react'
import { useRecoilState } from 'recoil'

import { marketState } from '../state/marketState'

export function useBinanceTicker(symbol = 'XAUUSDT') {
  const [, setMarket] = useRecoilState(marketState)

  useEffect(() => {
    const ws = new WebSocket(
      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@ticker`
    )

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      setMarket((current) => ({
        ...current,

        symbol,

        price: Number(data.c),

        priceChange: Number(data.p),

        priceChangePercent: Number(data.P),

        loading: false,

        error: null,

        lastUpdated: new Date().toISOString(),
      }))
    }

    ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error)

      setMarket((current) => ({
        ...current,
        loading: false,
        error: 'Failed to connect to Binance',
      }))
    }

    ws.onclose = () => {
      console.log('Binance WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [symbol, setMarket])
}