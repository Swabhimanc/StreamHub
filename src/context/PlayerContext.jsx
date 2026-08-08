import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [selected, setSelected] = useState(null)

  const open = useCallback((media) => setSelected(media), [])
  const close = useCallback(() => setSelected(null), [])

  const value = useMemo(() => ({ selected, open, close }), [selected, open, close])

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}