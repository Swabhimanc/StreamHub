import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { getTmdbApiKey, setTmdbApiKey } from '../api/tmdb.js'

const ApiKeyContext = createContext(null)
const STORAGE_KEY = 'streambox.tmdb-api-key'

export function ApiKeyProvider({ children }) {
  const [apiKey, setApiKey] = useLocalStorage(STORAGE_KEY, getTmdbApiKey())

  useEffect(() => {
    setTmdbApiKey(apiKey)
  }, [apiKey])

  const updateApiKey = useCallback((value) => {
    setApiKey(String(value || '').trim())
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
