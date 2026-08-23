import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const RatingsContext = createContext(null)

export function RatingsProvider({ children }) {
  const [ratings, setRatings] = useLocalStorage('streambox.ratings', {})

  const set = useCallback(
    (key, value) =>
      setRatings((prev) => {
        if (!value || value < 1) {
          const next = { ...prev }
          delete next[key]
          return next
        }
        return { ...prev, [key]: value }
      }),
    [setRatings]
  )

  const remove = useCallback(
    (key) =>
      setRatings((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      }),
    [setRatings]
  )

  const get = useCallback((key) => ratings[key] || 0, [ratings])

  const has = useCallback((key) => Boolean(ratings[key]), [ratings])

  const value = useMemo(
    () => ({ ratings, set, remove, get, has }),
    [ratings, set, remove, get, has]
  )

  return <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>
}

export function useRatings() {
  const ctx = useContext(RatingsContext)
  if (!ctx) throw new Error('useRatings must be used within RatingsProvider')
  return ctx
}
