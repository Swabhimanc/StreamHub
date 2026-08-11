import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getBackdrops,
  getCast,
  getDetails,
  getRelated,
  getSeasonEpisodes,
  getVideo,
} from '../api/dataService.js'
import { originalBackdropUrl, posterUrl, stillUrl } from '../api/tmdb.js'
import { useData } from '../hooks/useData.js'
import { useProvider } from '../context/ProviderContext.jsx'
import { useApiKey } from '../context/ApiKeyContext.jsx'
import { useMyList } from '../context/MyListContext.jsx'
import { PROVIDERS } from '../data/providers.js'
import MovieCard from '../components/MovieCard.jsx'
import PlayerEmbed from '../components/PlayerEmbed.jsx'
import {
  CheckIcon,
  ChevronLeftIcon,
  PlayIcon,
  PlusIcon,
  SpinnerIcon,
  StarIcon,
} from '../components/icons.jsx'

export default function WatchPage() {
  const { type, id } = useParams()
  const mediaType = type === 'tv' ? 'tv' : 'movie'
  const { providerId, setProvider } = useProvider()
  const { apiKey } = useApiKey()
  const { has, toggle } = useMyList()
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [playbackMode, setPlaybackMode] = useState(null)

  const { data: media, loading } = useData(
    () => (id ? getDetails(mediaType, id).catch(() => null) : Promise.resolve(null)),
    [mediaType, id, apiKey]
  )
  const { data: backdropPaths } = useData(
    () => (id ? getBackdrops(mediaType, id).catch(() => []) : Promise.resolve([])),
    [mediaType, id, apiKey]
  )
  const { data: cast } = useData(
    () => (id ? getCast(mediaType, id, 20).catch(() => []) : Promise.resolve([])),
    [mediaType, id, apiKey]
  )
  const { data: trailerUrl, loading: trailerLoading } = useData(
    () => (id ? getVideo(mediaType, id).catch(() => null) : Promise.resolve(null)),
    [mediaType, id, apiKey]
  )
  const { data: related } = useData(
    () => (id ? getRelated(mediaType, id).catch(() => []) : Promise.resolve([])),
    [mediaType, id, apiKey]
  )
  const { data: episodes, loading: episodesLoading } = useData(
    () => (id && mediaType === 'tv' ? getSeasonEpisodes(id, season).catch(() => []) : Promise.resolve([])),
    [mediaType, id, season, apiKey]
  )

  useEffect(() => {
    setSeason(1)
    setEpisode(1)
    setPlaybackMode(null)
  }, [id, mediaType])

  const seasons = Array.isArray(media?.seasons)
    ? media.seasons.filter((item) => item.season_number > 0)
    : []
  const inList = media ? has(media.key) : false
  const duration = formatDuration(media?.runtime)

  if (loading) {
    return <PageMessage>Loading...</PageMessage>
  }

  if (!media) {
    return <PageMessage>Title not found.</PageMessage>
  }

  if (playbackMode) {
    return (
      <PlayerView
        media={media}
        mediaType={mediaType}
        id={id}
        season={season}
        episode={episode}
        seasons={seasons}
        episodes={episodes || []}
        episodesLoading={episodesLoading}
        trailerUrl={trailerUrl}
        mode={playbackMode}
        providerId={providerId}
        setProvider={setProvider}
        onSeasonChange={(value) => {
          setSeason(value)
          setEpisode(1)
        }}
        onEpisodeChange={setEpisode}
        onClose={() => setPlaybackMode(null)}
      />
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink pb-4 pt-16">
      <BackgroundGallery
        media={media}
        backdropPaths={backdropPaths || []}
      />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10">
        <div className="relative flex min-h-[62vh] items-end pb-8 pt-16">
          <section className="max-w-2xl pb-2">
            <Link
              to={mediaType === 'tv' ? '/series' : '/movies'}
              className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-white"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Back to {mediaType === 'tv' ? 'Series' : 'Movies'}
            </Link>

            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-brand">
              {mediaType === 'tv' ? 'StreamBox Series' : 'StreamBox Feature'}
            </p>
            <h1 className="text-4xl font-black leading-[0.98] tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
              {media.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-cream/90">
              <span className="text-emerald-400">{Math.min(98, Math.round(media.rating * 10))}% Match</span>
              {media.year && <span>{media.year}</span>}
              {duration && <span>{duration}</span>}
              {mediaType === 'tv' && <span className="rounded border border-white/30 px-1.5 py-0.5 text-xs">SERIES</span>}
              {media.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-yellow-300">
                  <StarIcon className="h-3.5 w-3.5" /> {media.rating.toFixed(1)}
                </span>
              )}
            </div>

            <h2 className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-white">About</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cream/85 sm:text-base">
              {media.overview || 'No description available.'}
            </p>
            {(media.genres?.length || media.numberOfEpisodes) && (
              <p className="mt-3 text-xs font-semibold text-mist">
                {[media.genres?.join(' / '), media.numberOfEpisodes ? `${media.numberOfEpisodes} episodes` : null]
                  .filter(Boolean)
                  .join('  |  ')}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPlaybackMode('content')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-black text-black transition hover:bg-cream"
              >
                <PlayIcon className="h-5 w-5" />
                Watch {mediaType === 'tv' ? 'Series' : 'Movie'}
              </button>
              {trailerUrl && (
                <button
                  onClick={() => setPlaybackMode('trailer')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <PlayIcon className="h-4 w-4" />
                  Trailer
                </button>
              )}
              <button
                onClick={() => toggle(media)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur transition hover:bg-white/15"
                aria-label={inList ? 'Remove from My List' : 'Add to My List'}
              >
                {inList ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
              </button>
            </div>

            {trailerLoading && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-mist">
                <SpinnerIcon className="h-3.5 w-3.5 text-brand" /> Loading trailer...
              </p>
            )}
          </section>

          {mediaType === 'tv' && (
            <EpisodeSidebar
              seasons={seasons}
              season={season}
              episode={episode}
              episodes={episodes || []}
              loading={episodesLoading}
              onSeasonChange={(value) => {
                setSeason(value)
                setEpisode(1)
              }}
              onEpisodeChange={setEpisode}
              onPlayEpisode={(value) => {
                setEpisode(value)
                setPlaybackMode('content')
              }}
            />
          )}
        </div>

        <div className="space-y-8 border-t border-white/10 pt-7">
          <CastRail cast={cast || []} />
          <RelatedRail items={related || []} />
        </div>
      </div>
    </div>
  )
}

function BackgroundGallery({ media, backdropPaths }) {
  const images = useMemo(() => {
    const paths = [media.backdrop, ...backdropPaths].filter(Boolean)
    if (!paths.length && media.poster) paths.push(media.poster)
    return [...new Set(paths)].slice(0, 5).map((path) => originalBackdropUrl(path) || posterUrl(path))
  }, [media.backdrop, media.poster, backdropPaths])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [media.key])

  useEffect(() => {
    if (images.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [images.length])

  return (
    <div className="fixed inset-0 overflow-hidden">
      {images.map((image, index) => (
        <img
          key={image}
          src={image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/45 to-black/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-black/25" />
    </div>
  )
}

function EpisodeSidebar({ seasons, season, episode, episodes, loading, onSeasonChange, onEpisodeChange, onPlayEpisode }) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered

  return (
    <div
      className={`pointer-events-none z-30 mt-8 w-full lg:absolute lg:-right-6 lg:bottom-8 lg:top-16 lg:mt-0 lg:w-[390px] xl:-right-8 ${expanded ? 'h-[58vh] lg:h-auto' : 'h-12 lg:h-auto'}`}
    >
      <button
        onMouseEnter={() => setHovered(true)}
        onClick={() => setPinned(true)}
        className={`pointer-events-auto absolute right-0 top-0 rounded-full border border-white/15 bg-black/80 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-200 ${
          expanded ? 'scale-90 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-expanded={expanded}
      >
        Episodes
      </button>

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`pointer-events-auto absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-black/75 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-200 origin-right ${
          expanded
            ? 'translate-x-0 scale-100 opacity-100'
            : 'pointer-events-none translate-x-4 scale-[0.98] opacity-0'
        }`}
      >
      <button
        onClick={() => {
          setPinned(false)
          setHovered(false)
        }}
        className="flex w-full items-center justify-between border-b border-white/10 p-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Episodes</p>
          <p className="mt-1 text-xs text-mist">{episodes.length} available</p>
        </div>
        <span className="text-lg text-mist">×</span>
      </button>

      <div className="min-w-0 lg:min-w-[388px]">
        <div className="border-b border-white/10 p-3">
          <select
            value={season}
            onChange={(event) => onSeasonChange(Number(event.target.value))}
            className="w-full cursor-pointer rounded-lg border border-white/15 bg-surface px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-brand"
          >
            {seasons.map((item) => (
              <option key={item.season_number} value={item.season_number}>
                Season {item.season_number}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-[45vh] space-y-1.5 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-mist">
            <SpinnerIcon className="h-4 w-4 text-brand" /> Loading episodes...
          </div>
        ) : episodes.length ? (
          episodes.map((item) => {
            const selected = item.number === episode
            return (
              <button
                key={item.id || item.number}
                onClick={() => onEpisodeChange(item.number)}
                onDoubleClick={() => onPlayEpisode(item.number)}
                className={`group flex w-full gap-3 rounded-xl border p-2.5 text-left transition ${selected ? 'border-brand/45 bg-brand/10' : 'border-transparent hover:bg-white/7'}`}
              >
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-light">
                  {item.still ? (
                    <img src={stillUrl(item.still, 'w300')} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-black text-mist">E{item.number}</div>
                  )}
                  <span
                    onClick={(event) => {
                      event.stopPropagation()
                      onPlayEpisode(item.number)
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100"
                  >
                    <PlayIcon className="h-5 w-5 text-white" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-mist">Episode {item.number}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold text-white">{item.title}</p>
                  {item.runtime && <p className="mt-1 text-[10px] text-mist">{item.runtime} min</p>}
                </div>
              </button>
            )
          })
        ) : (
          <p className="py-10 text-center text-xs text-mist">No episodes available.</p>
        )}
        </div>
      </div>
      </aside>
    </div>
  )
}

function CastRail({ cast }) {
  if (!cast.length) return null
  return (
    <section>
      <RailHeading title="Cast" count={`${cast.length} people`} />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {cast.map((person) => (
          <article key={person.id} className="w-36 shrink-0 rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-surface-light">
              {person.profile ? (
                <img src={posterUrl(person.profile, 'w342')} alt={person.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-xl font-black text-mist">{initials(person.name)}</div>
              )}
            </div>
            <p className="mt-2 line-clamp-1 text-xs font-bold text-white">{person.name}</p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-mist">{person.character || 'Cast'}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RelatedRail({ items }) {
  if (!items.length) return null
  return (
    <section>
      <RailHeading title="More Like This" count={`${items.length} titles`} />
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
        {items.map((item) => (
          <MovieCard key={item.key} media={item} />
        ))}
      </div>
    </section>
  )
}

function RailHeading({ title, count }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <span className="text-[10px] font-black uppercase tracking-wider text-mist">{count}</span>
    </div>
  )
}

function PlayerView({
  media,
  mediaType,
  id,
  season,
  episode,
  seasons,
  episodes,
  episodesLoading,
  trailerUrl,
  mode,
  providerId,
  setProvider,
  onSeasonChange,
  onEpisodeChange,
  onClose,
}) {
  return (
    <div className="min-h-screen bg-ink pt-16">
      <div className="flex min-h-16 items-center justify-between border-b border-white/10 bg-ink px-4 sm:px-6 lg:px-10">
        <button onClick={onClose} className="inline-flex items-center gap-1 text-sm font-bold text-cream/80 hover:text-white">
          <ChevronLeftIcon className="h-5 w-5" /> Back to details
        </button>
        <p className="line-clamp-1 px-4 text-xs font-bold uppercase tracking-wider text-mist">
          {mode === 'trailer' ? `${media.title} trailer` : mediaType === 'tv' ? `${media.title} · S${season} E${episode}` : media.title}
        </p>
        {mode === 'content' ? (
          <select
            value={providerId}
            onChange={(event) => setProvider(event.target.value)}
            className="rounded-lg border border-white/15 bg-surface px-3 py-2 text-xs font-bold text-white outline-none"
          >
            {PROVIDERS.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
          </select>
        ) : <span className="w-20" />}
      </div>
      <div className="mx-auto aspect-video w-full max-w-screen-2xl bg-black">
        {mode === 'trailer' && trailerUrl ? (
          <iframe
            src={trailerUrl}
            title={`${media.title} trailer`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <PlayerEmbed mediaType={mediaType} id={id} season={season} episode={episode} title={media.title} />
        )}
      </div>

      <div className="mx-auto w-full max-w-screen-2xl px-4 py-7 sm:px-6 lg:px-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">
          {mode === 'trailer' ? 'Trailer' : mediaType === 'tv' ? `Season ${season} · Episode ${episode}` : 'Now Playing'}
        </p>
        <h1 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {media.title}
        </h1>

        {mediaType === 'tv' && mode === 'content' && (
          <section className="mt-7 border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Episodes</h2>
                <p className="mt-1 text-xs text-mist">Select an episode to continue watching</p>
              </div>
              <select
                value={season}
                onChange={(event) => onSeasonChange(Number(event.target.value))}
                className="cursor-pointer rounded-lg border border-white/15 bg-surface px-3 py-2.5 text-xs font-bold text-white outline-none transition focus:border-brand"
                aria-label="Select season"
              >
                {seasons.map((item) => (
                  <option key={item.season_number} value={item.season_number}>
                    Season {item.season_number}
                  </option>
                ))}
              </select>
            </div>

            {episodesLoading ? (
              <div className="flex items-center gap-2 py-8 text-xs text-mist">
                <SpinnerIcon className="h-4 w-4 text-brand" /> Loading episodes...
              </div>
            ) : episodes.length ? (
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-2 pb-5 pt-2 scroll-smooth">
                {episodes.map((item) => {
                  const selected = item.number === episode
                  return (
                    <button
                      key={item.id || item.number}
                      onClick={() => onEpisodeChange(item.number)}
                      className="group w-[min(68vw,15rem)] shrink-0 snap-start snap-always text-left sm:w-56 lg:w-60 last:mr-2"
                      aria-label={`Play episode ${item.number}: ${item.title}`}
                    >
                      <div className={`relative aspect-video overflow-hidden rounded-xl bg-surface-light ring-2 ring-inset transition ${selected ? 'ring-brand' : 'ring-white/10 group-hover:ring-white/30'}`}>
                        {item.still ? (
                          <img
                            src={stillUrl(item.still, 'w500')}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm font-black text-mist">Episode {item.number}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <span className="absolute bottom-2.5 left-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/60">
                          <PlayIcon className="h-3 w-3 text-white" />
                        </span>
                        {selected && (
                          <span className="absolute right-2.5 top-2.5 rounded bg-brand px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                            Playing
                          </span>
                        )}
                      </div>
                      <div className="min-h-12 pt-2.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-mist">Episode {item.number}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-white">{item.title}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-xs text-mist">No episodes are available for this season.</p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function PageMessage({ children }) {
  return <div className="flex min-h-screen items-center justify-center bg-ink text-mist">{children}</div>
}

function formatDuration(runtime) {
  if (!runtime) return null
  return `${runtime >= 60 ? `${Math.floor(runtime / 60)}h ` : ''}${runtime % 60}m`
}

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join('').toUpperCase()
}
