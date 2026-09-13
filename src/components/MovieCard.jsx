import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { posterUrl, POSTER_PLACEHOLDER } from '../api/tmdb.js'
import { useMyList } from '../context/MyListContext.jsx'
import { useRatings } from '../context/RatingsContext.jsx'
import { PlusIcon, CheckIcon, StarIcon } from './icons.jsx'

export default function MovieCard({ media, size = 'md', fill = false, getPath, progress = null }) {
  const navigate = useNavigate()
  const { has, toggle } = useMyList()
  const { get: getRating } = useRatings()
  const [imgError, setImgError] = useState(false)
  const inList = has(media.key)
  const userRating = getRating(media.key)

  const src =
    imgError
      ? POSTER_PLACEHOLDER
      : posterUrl(media.poster, size === 'lg' ? 'w500' : 'w342')

  const goWatch = () =>
    navigate(getPath ? getPath(media) : `/watch/${media.mediaType}/${media.id}`)

  return (
    <div
      className="group relative shrink-0 cursor-pointer hover:z-20"
      onClick={goWatch}
      onKeyDown={(e) => e.key === 'Enter' && goWatch()}
      role="button"
      tabIndex={0}
      aria-label={media.title}
      style={fill ? undefined : { width: size === 'lg' ? 300 : 230 }}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-light shadow-lg shadow-black/40 ring-1 ring-white/10 transition-all duration-300 ease-out group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-white/25"
      >
        <img
          src={src}
          alt={media.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />

        {progress?.current > 0 && progress?.total > 0 && Math.ceil((progress.total - progress.current) / 60) >= 1 && (
          <div className="pointer-events-none absolute bottom-2.5 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur">
            {Math.ceil((progress.total - progress.current) / 60)}m left
          </div>
        )}
        {progress?.current > 0 && progress?.total > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 w-full overflow-hidden bg-black/55">
            <div
              className="h-full rounded-r-full bg-brand"
              style={{ width: `${Math.max(2, Math.min(100, (progress.current / progress.total) * 100))}%` }}
            />
          </div>
        )}

        <div
          className="absolute left-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-all duration-300 hover:bg-brand hover:scale-110 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            toggle(media)
          }}
          title={inList ? 'In My List' : 'Add to My List'}
        >
          {inList ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </div>
      </div>

      <div className="min-h-[68px] pt-3">
        <h3 className={`line-clamp-2 font-bold leading-5 text-white ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {media.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-mist">
          <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cream/80">
            {media.mediaType === 'tv' ? 'Series' : 'Movie'}
          </span>
          <span>{media.year || 'Year N/A'}</span>
          <span className="text-yellow-300">★ {media.rating.toFixed(1)}</span>
          {userRating > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-[9px] font-black text-brand">
              <StarIcon className="h-2.5 w-2.5" /> {userRating}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
