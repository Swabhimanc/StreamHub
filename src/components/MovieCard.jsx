import { useState } from 'react'
import { posterUrl, POSTER_PLACEHOLDER } from '../api/tmdb.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useMyList } from '../context/MyListContext.jsx'
import { PlusIcon, CheckIcon } from './icons.jsx'

export default function MovieCard({ media, size = 'md' }) {
  const { open } = usePlayer()
  const { has, toggle } = useMyList()
  const [imgError, setImgError] = useState(false)
  const inList = has(media.key)

  const src =
    imgError
      ? POSTER_PLACEHOLDER
      : posterUrl(media.poster, size === 'lg' ? 'w500' : 'w342')

  return (
    <div
      className="group relative shrink-0 cursor-pointer hover:z-20"
      onClick={() => open(media)}
      onKeyDown={(e) => e.key === 'Enter' && open(media)}
      role="button"
      tabIndex={0}
      aria-label={media.title}
      style={{ width: size === 'lg' ? 300 : 230 }}
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

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <h3 className="line-clamp-2 text-sm font-bold text-white sm:text-base">{media.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-cream/80">
            {media.year && <span>{media.year}</span>}
            <span className="text-yellow-300">★ {media.rating.toFixed(1)}</span>
          </div>
        </div>

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
    </div>
  )
}