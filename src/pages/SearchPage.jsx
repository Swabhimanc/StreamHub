import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../hooks/useData.js'
import { searchMedia } from '../api/dataService.js'
import { useApiKey } from '../context/ApiKeyContext.jsx'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import MediaGrid from '../components/MediaGrid.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { SearchIcon, CloseIcon, HistoryIcon } from '../components/icons.jsx'

const SUGGESTIONS = [
  'Inception',
  'Interstellar',
  'The Dark Knight',
  'Spirited Away',
  'Dune',
  'Breaking Bad',
]

const MAX_RECENT = 8

export default function SearchPage() {
  const { apiKey } = useApiKey()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [input, setInput] = useState(query)
  const [debounced, setDebounced] = useState(query)
  const [recent, setRecent] = useLocalStorage('streambox.recent-searches', [])
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = input.trim()
      setDebounced(trimmed)
      setSearchParams(trimmed ? { q: trimmed } : {}, { replace: true })
    }, 350)
    return () => clearTimeout(t)
  }, [input, setSearchParams])

  useEffect(() => {
    if (!debounced) return
    setRecent((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== debounced.toLowerCase())
      return [debounced, ...filtered].slice(0, MAX_RECENT)
    })
  }, [debounced, setRecent])

  const results = useData(() => (debounced ? searchMedia(debounced) : Promise.resolve([])), [debounced, apiKey])

  const clearRecent = () => setRecent([])

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <h1 className="mb-6 text-2xl font-black text-white sm:text-3xl">Search</h1>

      <div className="relative mb-8 max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist" />
        <input
          ref={inputRef}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Movies, TV shows, titles…"
          className="w-full rounded-full border border-white/10 bg-surface py-3.5 pl-12 pr-12 text-base text-white outline-none transition placeholder:text-mist focus:border-brand focus:ring-2 focus:ring-brand/30"
          autoFocus
        />
        {input && (
          <button
            onClick={() => setInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-mist transition hover:text-white"
            aria-label="Clear search"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <AdSlot zoneId="12057866" className="mb-8" />

      {!debounced ? (
        <div className="space-y-8">
          {recent.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-mist" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-mist">
                  Recent searches
                </h2>
                <button
                  onClick={clearRecent}
                  className="ml-auto text-xs font-semibold text-mist transition hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s)
                      inputRef.current?.focus()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-surface px-4 py-2 text-sm text-cream/85 transition hover:border-brand hover:text-white"
                  >
                    <HistoryIcon className="h-3.5 w-3.5 text-mist" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-mist">
              Try searching for
            </h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s)
                    inputRef.current?.focus()
                  }}
                  className="rounded-full border border-white/15 bg-surface px-4 py-2 text-sm text-cream/85 transition hover:border-brand hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <p className="mb-4 text-sm text-mist">
            {results.loading
              ? `Searching “${debounced}”…`
              : `${results.data?.length ?? 0} result${results.data?.length === 1 ? '' : 's'} for “${debounced}”`}
          </p>
          <MediaGrid
            items={results.data}
            loading={results.loading}
            error={results.error}
            onRetry={results.retry}
            emptyText={`No results for “${debounced}”. Try something else.`}
          />
        </div>
      )}
    </div>
  )
}
