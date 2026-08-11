import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const PreferencesContext = createContext(null)
const STORAGE_KEY = 'streambox.preferences'

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useLocalStorage(STORAGE_KEY, {})

  const setPreference = useCallback((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }, [setPrefs])

  const value = useMemo(
    () => ({ trailerDefault: prefs.trailerDefault ?? false, setPreference }),
    [prefs.trailerDefault, setPreference]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
