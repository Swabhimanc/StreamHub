import { useEffect, useRef, useState } from 'react'
import { searchMedia, getSeasonEpisodes } from '../api/dataService.js'
import { posterUrl } from '../api/tmdb.js'
import { useData } from '../hooks/useData.js'
import { SpinnerIcon } from './icons.jsx'

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function CreatePartyModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [creating, setCreating] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400)
    return () => clearTimeout(debounceRef.current)
  }, [searchQuery])

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

  const handleCreate = () => {
    if (!name.trim() || !selectedMedia) return
    setCreating(true)
    const code = generateCode()
    onCreate({
      code,
      name: name.trim(),
      media: {
        mediaType: selectedMedia.mediaType,
        mediaId: selectedMedia.id,
        title: selectedMedia.title,
        year: selectedMedia.year,
        poster: selectedMedia.poster,
        season: selectedMedia.mediaType === 'tv' ? season : undefined,
        episode: selectedMedia.mediaType === 'tv' ? episode : undefined,
      },
    })
  }

  const canCreate = name.trim().length > 0 && selectedMedia && !creating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl shadow-black/60">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-mist transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <h2 className="mb-5 text-xl font-black text-white">Create a Party</h2>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mist">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            className="w-full rounded-lg border border-white/15 bg-surface px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-mist/50 focus:border-brand"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mist">
            What are you watching?
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies and series..."
            className="w-full rounded-lg border border-white/15 bg-surface px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-mist/50 focus:border-brand"
          />
        </div>

        {searching && (
          <div className="mb-4 flex items-center gap-2 text-sm text-mist">
            <SpinnerIcon className="h-4 w-4" /> Searching...
          </div>
        )}

        {debouncedQuery && !searching && results?.length > 0 && !selectedMedia && (
          <div className="mb-4 max-h-60 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2">
            {results.slice(0, 8).map((media) => (
              <button
                key={media.key}
                onClick={() => handleSelect(media)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/7"
              >
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-light">
                  {media.poster ? (
                    <img src={posterUrl(media.poster, 'w92')} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] font-black text-mist">N/A</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{media.title}</p>
                  <p className="text-xs text-mist">
                    {media.mediaType === 'tv' ? 'Series' : 'Movie'} {media.year && `· ${media.year}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedMedia && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand/30 bg-brand/10 p-3">
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-surface-light">
              {selectedMedia.poster ? (
                <img src={posterUrl(selectedMedia.poster, 'w92')} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] font-black text-mist">N/A</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{selectedMedia.title}</p>
              <p className="text-xs text-brand">
                {selectedMedia.mediaType === 'tv' ? 'Series' : 'Movie'} {selectedMedia.year && `· ${selectedMedia.year}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedMedia(null)}
              className="rounded-full p-1 text-mist transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Remove selection"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}

        {selectedMedia?.mediaType === 'tv' && (
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mist">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="w-full rounded-lg border border-white/15 bg-surface px-3 py-2.5 text-sm font-bold text-white outline-none"
              >
                {selectedMedia.seasons
                  ?.filter((s) => s.season_number > 0)
                  .map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      Season {s.season_number}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mist">Episode</label>
              <select
                value={episode}
                onChange={(e) => setEpisode(Number(e.target.value))}
                className="w-full rounded-lg border border-white/15 bg-surface px-3 py-2.5 text-sm font-bold text-white outline-none"
              >
                {(episodes || []).map((ep) => (
                  <option key={ep.number} value={ep.number}>
                    E{ep.number} — {ep.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="w-full rounded-lg bg-white py-3.5 text-sm font-black text-black transition-all hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
        >
          {creating ? 'Creating Room...' : 'Create Party Room'}
        </button>
      </div>
    </div>
  )
}
