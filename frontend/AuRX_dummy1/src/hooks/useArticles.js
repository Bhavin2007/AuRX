import { useEffect } from 'react'
import { useRecoilState } from 'recoil'

import { articleState } from '../state/articleState'

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000'

export function useArticles(
  ticker = 'GOLD'
) {

  const [, setArticles] =
    useRecoilState(articleState)

  useEffect(() => {

    let cancelled = false

    async function fetchArticles() {

      try {

        setArticles((current) => ({
          ...current,
          loading: true,
          error: null,
        }))

        const response =
          await fetch(
            `${BACKEND_URL}/api/articles/${ticker}?limit=10`
          )

        if (!response.ok) {
          throw new Error(
            `Backend HTTP ${response.status}`
          )
        }

        const data =
          await response.json()

        if (cancelled) return

        setArticles({
          articles: data.data || [],
          selectedArticle: null,
          loading: false,
          error: null,
        })

      } catch (error) {

        console.error(
          'Articles API error:',
          error
        )

        if (!cancelled) {

          setArticles((current) => ({
            ...current,
            loading: false,
            error: error.message,
          }))

        }

      }

    }

    fetchArticles()

    const interval =
      setInterval(
        fetchArticles,
        30000
      )

    return () => {
      cancelled = true
      clearInterval(interval)
    }

  }, [ticker, setArticles])
}