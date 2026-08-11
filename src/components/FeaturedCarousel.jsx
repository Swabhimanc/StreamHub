import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { originalBackdropUrl, backdropUrl, posterUrl } from '../api/tmdb.js'
import { useMyList } from '../context/MyListContext.jsx'
import { PlayIcon, InfoIcon, PlusIcon, CheckIcon } from './icons.jsx'

const AUTO_ADVANCE_DELAY = 4000
const FADE_DURATION = 2000

export default function FeaturedCarousel({ items, label }) {
  const navigate = useNavigate()
  const { has, toggle } = useMyList()

  const featured = (items || []).filter(Boolean).slice(0, 6)
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(() => new Set())

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % featured.length)
  }, [featured.length])

  const goTo = useCallback((index) => {
    setActiveIndex(index)
  }, [])

  useEffect(() => {
    if (featured.length <= 1) return
    const timer = setTimeout(next, AUTO_ADVANCE_DELAY)
    return () => clearTimeout(timer)
  }, [activeIndex, featured.length, next])

  const markImgLoaded = useCallback((key) => {
    setImgLoaded((prev) => new Set(prev).add(key))
  }, [])

  if (!featured.length) return null

  return (
    <section
      className="relative z-30 min-h-[70vh] w-full overflow-hidden sm:min-h-[88vh]"
    >
      {/* Slides */}
      {featured.map((media, index) => {
        const isActive = index === activeIndex
        const inList = has(media.key)
        const bg = originalBackdropUrl(media.backdrop) || backdropUrl(media.backdrop)
        const watchPath = `/watch/${media.mediaType}/${media.id}`
        const loaded = imgLoaded.has(media.key)

        return (
          <div
            key={media.key}
            className={`absolute inset-0 transition-opacity ease-in-out ${
              isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={{ transitionDuration: `${FADE_DURATION}ms` }}
            aria-hidden={!isActive}
          >
            {/* Backdrop */}
            <div className="absolute inset-0">
              <img
                src={bg || posterUrl(media.poster)}
                alt=""
                loading={index === 0 ? 'eager' : 'lazy'}
                onLoad={() => markImgLoaded(media.key)}
                className={`h-full w-full object-cover transition-opacity duration-1000 ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="hero-gradient absolute inset-0" />
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
            </div>

            {/* Foreground */}
            <div className="relative z-10 mx-auto flex min-h-[62vh] w-full max-w-screen-2xl flex-col justify-end px-4 pb-12 sm:min-h-[82vh] sm:px-6 sm:pb-16 lg:px-10">
              <div
                className={`max-w-2xl transition-opacity duration-1000 ease-in-out ${
                  isActive && loaded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/90 backdrop-blur">
                  {label || (media.mediaType === 'tv' ? 'TV Series' : 'Featured Film')}
                </p>
                <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-xl sm:text-6xl lg:text-7xl">
                  {media.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-cream/90">
                  <span className="text-emerald-400">
                    {Math.min(98, Math.round(media.rating * 10))}% Match
                  </span>
                  <span>{media.year || '—'}</span>
                  {media.rating > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5 text-xs font-bold text-yellow-300 backdrop-blur">
                      ★ {media.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="h-2.5 w-2.5 rounded-sm bg-cream/70" />
                      ))}
                    </span>
                  </span>
                </div>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/85 sm:text-base">
                  {truncate(media.overview, 260)}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate(watchPath)}
                    className="inline-flex items-center gap-2 rounded bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <PlayIcon className="h-5 w-5" />
                    Play
                  </button>
                  <button
                    onClick={() => navigate(watchPath)}
                    className="inline-flex items-center gap-2 rounded bg-white/25 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/40"
                  >
                    <InfoIcon className="h-5 w-5" />
                    More Info
                  </button>
                  <button
                    onClick={() => toggle(media)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-black/30 text-white backdrop-blur-sm transition hover:border-white hover:bg-white/20"
                    aria-label={inList ? 'Remove from My List' : 'Add to My List'}
                    title={inList ? 'In My List' : 'Add to My List'}
                  >
                    {inList ? <CheckIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Pagination dots */}
      {featured.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {featured.map((item, index) => (
            <button
              key={item.key}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-8 bg-white'
                  : 'w-4 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function truncate(text, n) {
  if (!text) return ''
  return text.length > n ? text.slice(0, n).trimEnd() + '…' : text
}
