import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const MAX_HISTORY = 100

const HistoryContext = createContext(null)

export function HistoryProvider({ children }) {
  const [items, setItems] = useLocalStorage('streambox.history', [])

  const add = useCallback(
    (media, { season = null, episode = null } = {}) => {
      if (!media?.key) return
      setItems((prev) => {
        const entry = {
          ...media,
          watchedAt: Date.now(),
          season,
          episode,
        }
        const filtered = prev.filter((m) => m.key !== media.key)
        return [entry, ...filtered].slice(0, MAX_HISTORY)
      })
    },
    [setItems]
  )

  const remove = useCallback(
    (key) => setItems((prev) => prev.filter((m) => m.key !== key)),
    [setItems]
  )

  const clear = useCallback(() => setItems([]), [setItems])

  const has = useCallback((key) => items.some((m) => m.key === key), [items])

  const value = useMemo(
    () => ({ items, add, remove, clear, has }),
    [items, add, remove, clear, has]
  )

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}

export function useHistory() {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider')
  return ctx
}
