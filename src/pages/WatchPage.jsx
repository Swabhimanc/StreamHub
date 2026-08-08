import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCast, getDetails } from '../api/dataService.js'
import { posterUrl } from '../api/tmdb.js'
import { useData } from '../hooks/useData.js'
import { useProvider } from '../context/ProviderContext.jsx'
import { PROVIDERS } from '../data/providers.js'
import PlayerEmbed from '../components/PlayerEmbed.jsx'
import { ChevronLeftIcon, PlusIcon, CheckIcon } from '../components/icons.jsx'
import { useMyList } from '../context/MyListContext.jsx'

export default function WatchPage() {
  const { type, id } = useParams()
  const mediaType = type === 'tv' ? 'tv' : 'movie'
  const { providerId, provider, setProvider } = useProvider()
  const { has, toggle } = useMyList()

  const { data: media, loading } = useData(() => getDetails(mediaType, id), [mediaType, id])
  const { data: cast } = useData(() => getCast(mediaType, id, 20), [mediaType, id])

  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)

  // Reset to S1E1 whenever the title changes.
  useEffect(() => {
    setSeason(1)
    setEpisode(1)
  }, [id, mediaType])

  const seasons = Array.isArray(media?.seasons)
    ? media.seasons.filter((s) => s.season_number > 0)
    : []
  const selectedSeason = seasons.find((s) => s.season_number === season)
  const episodeCount = selectedSeason?.episode_count || 1

  useEffect(() => {
    if (episode > episodeCount) setEpisode(1)
  }, [episodeCount, episode])

  const inList = media && has(media.key)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      {/* Breadcrumb / back */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to={mediaType === 'tv' ? '/series' : '/movies'}
          className="inline-flex items-center gap-1 text-sm font-semibold text-cream/75 transition-colors hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Back to {mediaType === 'tv' ? 'Series' : 'Movies'}
        </Link>

        {/* Provider switch */}
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cream/60 sm:text-sm">
          <span className="hidden sm:inline">Source</span>
          <select
            value={providerId}
            onChange={(e) => setProvider(e.target.value)}
            className="cursor-pointer rounded-md border border-white/15 bg-surface-light px-3 py-1.5 text-sm font-semibold text-white outline-none transition hover:border-brand/60 focus:border-brand"
            aria-label="Choose streaming provider"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
        {mediaType === 'tv' ? (
          <PlayerEmbed mediaType="tv" id={id} season={season} episode={episode} title={media?.title} />
        ) : (
          <PlayerEmbed mediaType="movie" id={id} title={media?.title} />
        )}
      </div>

      {/* Meta + controls */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
              {media?.title || (loading ? 'Loading…' : 'Now Playing')}
            </h1>
            <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream/70">
              {provider.name}
            </span>
          </div>

          {media && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream/75">
              <span className="font-semibold text-emerald-400">
                {Math.min(98, Math.round(media.rating * 10))}% Match
              </span>
              <span>{media.year || '—'}</span>
              {media.mediaType === 'tv' && (
                <span className="rounded border border-white/25 px-1.5 py-0.5 text-xs">SERIES</span>
              )}
            </div>
          )}

          {media?.overview && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream/80 sm:text-base">
              {media.overview}
            </p>
          )}
        </div>

        {media && (
          <button
            onClick={() => toggle(media)}
            className={`inline-flex shrink-0 items-center gap-2 rounded px-4 py-2 text-sm font-bold transition ${
              inList ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-brand text-white hover:bg-brand-hover'
            }`}
          >
            {inList ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {inList ? 'In My List' : 'My List'}
          </button>
        )}
      </div>

      {/* Episode selector (series only) */}
      {mediaType === 'tv' && (
        <div className="mt-6 rounded-xl border border-white/10 bg-surface-light/60 p-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-cream/85">
              Season
              <select
                value={season}
                onChange={(e) => {
                  setSeason(Number(e.target.value))
                  setEpisode(1)
                }}
                className="cursor-pointer rounded-md border border-white/15 bg-surface px-3 py-1.5 text-white outline-none focus:border-brand"
              >
                {(seasons.length ? seasons : [{ season_number: 1 }]).map((s) => (
                  <option key={s.season_number} value={s.season_number}>
                    {s.season_number}
                    {s.name ? ` — ${s.name}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-cream/85">
              Episode
              <select
                value={episode}
                onChange={(e) => setEpisode(Number(e.target.value))}
                className="cursor-pointer rounded-md border border-white/15 bg-surface px-3 py-1.5 text-white outline-none focus:border-brand"
              >
                {Array.from({ length: episodeCount }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>

            <span className="ml-auto text-xs text-cream/50">S{season} · E{episode}</span>
          </div>
        </div>
      )}

      {/* Top Cast */}
      <CastRow cast={cast} />
    </div>
  )
}

function CastRow({ cast }) {
  if (!cast || cast.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-white">Top Cast</h2>
      <ul className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {cast.map((person) => (
          <li key={person.id} className="w-28 shrink-0 sm:w-32">
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-surface-light ring-1 ring-white/10">
              {person.profile ? (
                <img
                  src={posterUrl(person.profile, 'w342')}
                  alt={person.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-light px-3 text-center text-xs font-semibold text-mist">
                  {initials(person.name)}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold leading-tight text-white line-clamp-2">{person.name}</p>
            {person.character && (
              <p className="mt-0.5 text-xs leading-tight text-mist line-clamp-2">as {person.character}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
