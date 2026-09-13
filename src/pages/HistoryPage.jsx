import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useHistory } from '../context/HistoryContext.jsx'
import { posterUrl, POSTER_PLACEHOLDER } from '../api/tmdb.js'
import { HistoryIcon, PlayIcon, TrashIcon } from '../components/icons.jsx'

export default function HistoryPage() {
  const { items, remove, clear } = useHistory()
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Watch History</h1>
          <p className="mt-1 text-sm text-mist">
            {items.length} title{items.length === 1 ? '' : 's'} you&rsquo;ve recently watched.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => (confirmClear ? clear() : setConfirmClear(true))}
            onBlur={() => setConfirmClear(false)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition ${
              confirmClear
                ? 'border-brand bg-brand text-white hover:bg-brand-hover'
                : 'border-white/20 bg-white/5 text-cream/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <TrashIcon className="h-4 w-4" />
            {confirmClear ? 'Confirm Clear All' : 'Clear History'}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <HistoryIcon className="h-8 w-8 text-brand" />
          </div>
          <h2 className="text-lg font-bold text-white">No watch history yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-mist">
            Movies and series you watch will appear here so you can easily pick up where you left off.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
          >
            Browse titles
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((entry) => (
            <HistoryCard key={entry.key} entry={entry} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ entry, onRemove }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const src = imgError
    ? POSTER_PLACEHOLDER
    : posterUrl(entry.poster, 'w342')

  const goWatch = () => {
    if (entry.mediaType === 'tv' && entry.season) {
      navigate(`/watch/${entry.mediaType}/${entry.id}?s=${entry.season}&e=${entry.episode ?? 1}&autoplay=true`)
    } else {
      navigate(`/watch/${entry.mediaType}/${entry.id}?autoplay=true`)
    }
  }

  return (
    <div
      className="group relative shrink-0 cursor-pointer hover:z-20"
      onClick={goWatch}
      onKeyDown={(e) => e.key === 'Enter' && goWatch()}
      role="button"
      tabIndex={0}
      aria-label={entry.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-light shadow-lg shadow-black/40 ring-1 ring-white/10 transition-all duration-300 ease-out group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-white/25">
        <img
          src={src}
          alt={entry.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />

        {entry.durationSeconds > 0 && entry.positionSeconds > 0 && Math.ceil((entry.durationSeconds - entry.positionSeconds) / 60) >= 1 && (
          <div className="pointer-events-none absolute bottom-2.5 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur">
            {Math.ceil((entry.durationSeconds - entry.positionSeconds) / 60)}m left
          </div>
        )}
        {entry.durationSeconds > 0 && entry.positionSeconds > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 w-full overflow-hidden bg-black/55">
            <div
              className="h-full rounded-r-full bg-brand"
              style={{
                width: `${Math.max(2, Math.min(100, (entry.positionSeconds / entry.durationSeconds) * 100))}%`,
              }}
            />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
            <PlayIcon className="h-6 w-6" />
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(entry.key)
          }}
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-all duration-300 hover:bg-brand hover:scale-110 opacity-0 group-hover:opacity-100"
          title="Remove from history"
          aria-label="Remove from history"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-[68px] pt-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-5 text-white">
          {entry.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-mist">
          <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cream/80">
            {entry.mediaType === 'tv' ? 'Series' : 'Movie'}
          </span>
          {entry.season && (
            <span className="rounded border border-brand/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand">
              S{entry.season} E{entry.episode}
            </span>
          )}
          {entry.positionSeconds >= 60 && (
            <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cream/80">
              ▶ {formatClock(entry.positionSeconds)}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-mist">{timeAgo(entry.watchedAt)}</p>
      </div>
    </div>
  )
}

function formatClock(seconds) {
  const total = Math.floor(seconds)
  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

function timeAgo(timestamp) {
  if (!timestamp) return 'Unknown'
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}
