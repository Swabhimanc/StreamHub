import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { backdropUrl } from '../api/tmdb.js'
import { getVideo } from '../api/dataService.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { useMyList } from '../context/MyListContext.jsx'
import { CloseIcon, PlusIcon, CheckIcon, PlayIcon, SpinnerIcon } from './icons.jsx'

export default function VideoModal() {
  const { selected, close } = usePlayer()
  const navigate = useNavigate()
  const [videoUrl, setVideoUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const goToWatch = () => {
    if (!selected) return
    close()
    navigate(`/watch/${selected.mediaType}/${selected.id}`)
  }

  const reset = useCallback(() => {
    setVideoUrl(null)
    setError(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!selected) return
    reset()
    setLoading(true)
    getVideo(selected.mediaType, selected.id)
      .then((url) => {
        setVideoUrl(url || null)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [selected, reset])

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [selected, close])

  if (!selected) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={selected.title}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl shadow-black animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={close}
          className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-brand"
          aria-label="Close"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {/* Video / backdrop */}
        <div className="relative aspect-video w-full bg-black">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream/70">
              <SpinnerIcon className="h-8 w-8" />
              <span className="text-xs font-semibold uppercase tracking-widest">Loading trailer…</span>
            </div>
          )}
          {!loading && videoUrl && (
            <iframe
              key={videoUrl}
              src={videoUrl}
              title={selected.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {!loading && !videoUrl && selected.backdrop && (
            <img src={backdropUrl(selected.backdrop)} alt="" className="h-full w-full object-cover" />
          )}
          {!loading && !videoUrl && !selected.backdrop && (
            <div className="flex h-full w-full items-center justify-center gap-3 bg-gradient-to-br from-surface-light to-black text-cream/70">
              <PlayIcon className="h-8 w-8" />
              <span className="text-sm font-semibold">Preview not available</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {selected.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cream/75">
                <span className="text-emerald-400 font-semibold">
                  {Math.min(98, Math.round(selected.rating * 10))}% Match
                </span>
                <span>{selected.year || '—'}</span>
                {selected.mediaType === 'tv' && (
                  <span className="rounded border border-white/25 px-1.5 py-0.5 text-xs">SERIES</span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={goToWatch}
                className="inline-flex items-center gap-2 rounded bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-hover"
              >
                <PlayIcon className="h-4 w-4" />
                Watch Now
              </button>
              <StatusButton media={selected} />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-cream/85 sm:text-base">{selected.overview || 'No description available.'}</p>

          {error && (
            <p className="text-xs text-red-400">
              We couldn't load the trailer. Check your connection or try again.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function StatusButton({ media }) {
  const { has, toggle } = useMyList()
  const inList = has(media.key)
  return (
    <button
      onClick={() => toggle(media)}
      className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-bold transition ${
        inList ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-brand text-white hover:bg-brand-hover'
      }`}
    >
      {inList ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      {inList ? 'In My List' : 'My List'}
    </button>
  )
}