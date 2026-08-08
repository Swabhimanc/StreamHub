import { useRef, useState } from 'react'
import MovieCard from './MovieCard.jsx'
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx'

export default function Row({ title, items, loading, error, onRetry, size }) {
  const railRef = useRef(null)
  const [showButtons, setShowButtons] = useState(false)

  const scrollBy = (dir) => {
    const rail = railRef.current
    if (!rail) return
    const delta = dir * Math.max(rail.clientWidth * 0.85, 320)
    rail.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section
      className="relative -mx-1 px-4 sm:px-6 lg:px-10"
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => setShowButtons(false)}
    >
      <h2 className="mb-3 pl-1 text-lg font-bold text-cream sm:text-xl">{title}</h2>

      <div className="relative">
        {/* Arrows */}
        {showButtons && items && items.length > 0 && (
          <>
            <button
              onClick={() => scrollBy(-1)}
              className="absolute left-0 top-0 z-30 flex h-full w-10 items-center justify-center bg-ink/60 text-white opacity-90 transition hover:bg-ink/75 sm:w-12"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="absolute right-0 top-0 z-30 flex h-full w-10 items-center justify-center bg-ink/60 text-white opacity-90 transition hover:bg-ink/75 sm:w-12"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="h-8 w-8" />
            </button>
          </>
        )}

        <div
          ref={railRef}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth py-5"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : items && items.length > 0
              ? items.map((m) => <MovieCard key={m.key} media={m} size={size} />)
              : null}
        </div>
      </div>

      {error && !loading && <ErrorHint onRetry={onRetry} />}
      {!loading && !error && items && items.length === 0 && (
        <p className="px-1 py-4 text-sm text-mist">Nothing here yet.</p>
      )}
    </section>
  )
}

function ErrorHint({ onRetry }) {
  return (
    <div className="px-1 py-2">
      <p className="text-sm text-red-400">Couldn't load this row. {onRetry && (<button onClick={onRetry} className="ml-1 font-semibold underline">Retry</button>)}</p>
    </div>
  )
}

function CardSkeleton() {
  return <div className="skeleton aspect-[2/3] w-[230px] shrink-0 rounded-lg" />
}