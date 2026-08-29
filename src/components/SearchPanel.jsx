import { useEffect, useRef, useState } from 'react'
import { searchMedia, getSeasonEpisodes } from '../api/dataService.js'
import { posterUrl } from '../api/tmdb.js'
import { useData } from '../hooks/useData.js'

export default function SearchPanel({ onChangeMedia }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [switched, setSwitched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const { data: results, loading: searching } = useData(
    () => (debouncedQuery ? searchMedia(debouncedQuery).catch(() => []) : Promise.resolve([])),
    [debouncedQuery]
  )

  const { data: episodes } = useData(
    () =>
      selectedMedia?.mediaType === 'tv'
        ? getSeasonEpisodes(selectedMedia.id, season).catch(() => [])
        : Promise.resolve([]),
    [selectedMedia?.id, season]
  )

  const handleSelect = (media) => {
    setSelectedMedia(media)
    setSeason(1)
    setEpisode(1)
  }

  const handleSwitch = () => {
    if (!selectedMedia) return
    onChangeMedia?.({
      mediaType: selectedMedia.mediaType,
      mediaId: selectedMedia.id,
      title: selectedMedia.title,
      year: selectedMedia.year,
      poster: selectedMedia.poster,
      season: selectedMedia.mediaType === 'tv' ? season : undefined,
      episode: selectedMedia.mediaType === 'tv' ? episode : undefined,
    })
    setSwitched(true)
    setTimeout(() => setSwitched(false), 2000)
    setQuery('')
    setDebouncedQuery('')
    setSelectedMedia(null)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {switched && (
        <p className="mb-3 rounded bg-emerald-500/10 px-2 py-1.5 text-[10px] font-bold text-emerald-400">
          Content switched for everyone in the room.
        </p>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies & series..."
        className="w-full rounded-lg border border-white/15 bg-surface px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-mist/50 focus:border-brand"
      />
      {searching && <p className="mt-2 text-[10px] font-bold text-mist">Searching...</p>}
      {!selectedMedia && debouncedQuery && !searching && (
        <div className="mt-2 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-1.5">
          {(results || []).slice(0, 8).map((media) => (
            <button
              key={media.key}
              onClick={() => handleSelect(media)}
              className="flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-white/7"
            >
              <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-surface-light">
                {media.poster ? (
                  <img src={posterUrl(media.poster, 'w92')} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[8px] font-black text-mist">N/A</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-white">{media.title}</p>
                <p className="text-[9px] text-mist">
                  {media.mediaType === 'tv' ? 'Series' : 'Movie'} {media.year && `· ${media.year}`}
                </p>
              </div>
            </button>
          ))}
          {results?.length === 0 && (
            <p className="px-2 py-3 text-center text-[10px] font-bold text-mist">No results</p>
          )}
        </div>
      )}

      {!selectedMedia && !debouncedQuery && (
        <p className="mt-4 text-center text-[11px] leading-snug text-mist">
          Search TMDB and switch what the whole room is watching — no need to leave and create a new party.
        </p>
      )}

      {selectedMedia && (
        <div className="mt-2">
          <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 p-2">
            <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-surface-light">
              {selectedMedia.poster ? (
                <img src={posterUrl(selectedMedia.poster, 'w92')} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[8px] font-black text-mist">N/A</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-white">{selectedMedia.title}</p>
              <p className="text-[9px] text-brand">
                {selectedMedia.mediaType === 'tv' ? 'Series' : 'Movie'}
              </p>
            </div>
            <button
              onClick={() => setSelectedMedia(null)}
              className="text-mist transition-colors hover:text-white"
              aria-label="Clear selection"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          {selectedMedia.mediaType === 'tv' && (
            <div className="mt-2 flex gap-2">
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="flex-1 rounded-lg border border-white/15 bg-surface px-2 py-1.5 text-[10px] font-bold text-white outline-none"
              >
                {selectedMedia.seasons
                  ?.filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      S{s.season_number}
                    </option>
                  ))}
              </select>
              <select
                value={episode}
                onChange={(e) => setEpisode(Number(e.target.value))}
                className="flex-1 rounded-lg border border-white/15 bg-surface px-2 py-1.5 text-[10px] font-bold text-white outline-none"
              >
                {(episodes || []).map((ep) => (
                  <option key={ep.number} value={ep.number}>
                    E{ep.number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSwitch}
            className="mt-2 w-full rounded-lg bg-brand px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
          >
            Switch Room Content
          </button>
        </div>
      )}
    </div>
  )
}
