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
        const existing = prev.find((m) => m.key === media.key)
        const sameEpisode =
          existing && existing.season === season && existing.episode === episode
        const entry = {
          ...media,
          watchedAt: Date.now(),
          season,
          episode,
          ...(sameEpisode && existing.positionSeconds
            ? {
                positionSeconds: existing.positionSeconds,
                durationSeconds: existing.durationSeconds,
              }
            : { positionSeconds: 0, durationSeconds: 0 }),
        }
        const filtered = prev.filter((m) => m.key !== media.key)
        return [entry, ...filtered].slice(0, MAX_HISTORY)
      })
    },
    [setItems]
  )

  const updatePosition = useCallback(
    (key, positionSeconds, durationSeconds, season = null, episode = null) => {
      if (!key || !Number.isFinite(positionSeconds)) return
      setItems((prev) =>
        prev.map((m) =>
          m.key === key && m.season === season && m.episode === episode
            ? { ...m, positionSeconds, durationSeconds }
            : m
        )
      )
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
    () => ({ items, add, remove, clear, has, updatePosition }),
    [items, add, remove, clear, has, updatePosition]
  )

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}

export function useHistory() {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider')
  return ctx
}
