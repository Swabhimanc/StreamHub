import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const MyListContext = createContext(null)

export function MyListProvider({ children }) {
  const [items, setItems] = useLocalStorage('streambox.mylist', [])

  const add = useCallback(
    (media) =>
      setItems((prev) => {
        if (prev.some((m) => m.key === media.key)) return prev
        return [...prev, media]
      }),
    [setItems]
  )

  const remove = useCallback(
    (key) => setItems((prev) => prev.filter((m) => m.key !== key)),
    [setItems]
  )

  const has = useCallback((key) => items.some((m) => m.key === key), [items])

  const toggle = useCallback(
    (media) => {
      if (items.some((m) => m.key === media.key)) remove(media.key)
      else add(media)
    },
    [items, add, remove]
  )

  const value = useMemo(
    () => ({ items, add, remove, has, toggle }),
    [items, add, remove, has, toggle]
  )

  return <MyListContext.Provider value={value}>{children}</MyListContext.Provider>
}

export function useMyList() {
  const ctx = useContext(MyListContext)
  if (!ctx) throw new Error('useMyList must be used within MyListProvider')
  return ctx
}