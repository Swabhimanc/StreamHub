import { createContext, useCallback, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { getTmdbApiKey, setTmdbApiKey } from '../api/tmdb.js'

const ApiKeyContext = createContext(null)
const STORAGE_KEY = 'streambox.tmdb-api-key'

export function ApiKeyProvider({ children }) {
  const [apiKey, setApiKey] = useLocalStorage(STORAGE_KEY, getTmdbApiKey())

  // Child data effects can run on the first mount, so sync the request module
  // before rendering them rather than waiting for a provider effect.
  setTmdbApiKey(apiKey)

  const updateApiKey = useCallback((value) => {
    const nextKey = String(value || '').trim()
    setTmdbApiKey(nextKey)
    setApiKey(nextKey)
  }, [setApiKey])

  const value = useMemo(
    () => ({ apiKey, updateApiKey, hasApiKey: Boolean(apiKey) }),
    [apiKey, updateApiKey]
  )

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error('useApiKey must be used within ApiKeyProvider')
  return ctx
}
