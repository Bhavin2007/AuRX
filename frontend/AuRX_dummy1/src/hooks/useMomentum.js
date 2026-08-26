import { useEffect } from 'react'
import { useRecoilState } from 'recoil'

import { sentimentState } from '../state/sentimentState'

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export function useMomentum(ticker = 'GOLD') {
  const [, setSentiment] = useRecoilState(sentimentState)

  useEffect(() => {
    let cancelled = false

    async function fetchMomentum() {
      try {
        setSentiment((current) => ({
          ...current,
          loading: true,
          error: null,
        }))

        const response = await fetch(
          `${BACKEND_URL}/api/momentum/${ticker}`
        )

        if (!response.ok) {
          throw new Error(`Backend HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!cancelled) {
          setSentiment({
            ...data,
            confidence: 0,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        console.error('Momentum API error:', error)

        if (!cancelled) {
          setSentiment((current) => ({
            ...current,
            loading: false,
            error: error.message,
          }))
        }
      }
    }

    fetchMomentum()

    const interval = setInterval(fetchMomentum, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [ticker, setSentiment])
}