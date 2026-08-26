import { useEffect } from 'react'
import { useRecoilState } from 'recoil'

import { marketState } from '../state/marketState'


export function useBinanceTicker(
  symbol = 'XAUUSDT'
) {

  const [, setMarket] =
    useRecoilState(marketState)


  useEffect(() => {

    let ws

    let cancelled = false


    async function fetchTicker() {

      try {

        const response =
          await fetch(
            `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`
          )


        if (!response.ok) {

          throw new Error(
            `Binance HTTP ${response.status}`
          )

        }


        const data =
          await response.json()


        if (cancelled) {
          return
        }


        setMarket(current => ({

          ...current,

          symbol,

          price:
            Number(data.lastPrice),

          priceChange:
            Number(data.priceChange),

          priceChangePercent:
            Number(data.priceChangePercent),

          loading: false,

          error: null,

          lastUpdated:
            new Date().toISOString(),

        }))


      } catch (error) {

        console.error(
          'Binance REST ticker error:',
          error
        )

      }

    }


    // Get an immediate price.

    fetchTicker()


    // Refresh fallback every 5 seconds.

    const interval =
      setInterval(
        fetchTicker,
        5000
      )


    // Live WebSocket updates.

    ws = new WebSocket(

      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@ticker`

    )


    ws.onmessage = event => {

      const data =
        JSON.parse(event.data)


      setMarket(current => ({

        ...current,

        symbol,

        price:
          Number(data.c),

        priceChange:
          Number(data.p),

        priceChangePercent:
          Number(data.P),

        loading: false,

        error: null,

        lastUpdated:
          new Date().toISOString(),

      }))

    }


    ws.onerror = error => {

      console.error(
        'Binance WebSocket error:',
        error
      )

      // REST continues running.

    }


    ws.onclose = () => {

      console.log(
        'Binance ticker WebSocket disconnected'
      )

    }


    return () => {

      cancelled = true

      clearInterval(interval)

      ws?.close()

    }


  }, [symbol, setMarket])

}