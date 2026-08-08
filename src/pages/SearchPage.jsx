import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../hooks/useData.js'
import { searchMedia } from '../api/dataService.js'
import MediaGrid from '../components/MediaGrid.jsx'
import { SearchIcon, CloseIcon } from '../components/icons.jsx'

const SUGGESTIONS = [
  'Inception',
  'Interstellar',
  'The Dark Knight',
  'Spirited Away',
  'Dune',
  'Breaking Bad',
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [input, setInput] = useState(query)
  const [debounced, setDebounced] = useState(query)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(input.trim())
      setSearchParams(input.trim() ? { q: input.trim() } : {}, { replace: true })
    }, 350)
    return () => clearTimeout(t)
  }, [input, setSearchParams])

  const results = useData(() => (debounced ? searchMedia(debounced) : Promise.resolve([])), [debounced])

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

      {!debounced ? (
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