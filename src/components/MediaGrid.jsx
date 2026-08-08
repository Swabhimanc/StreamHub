import MovieCard from './MovieCard.jsx'

export default function MediaGrid({ items, loading, error, onRetry, emptyText = 'Nothing here yet.' }) {
  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface p-8 text-center">
        <p className="text-red-400">Something went wrong while loading.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded bg-white px-5 py-2 text-sm font-bold text-black hover:bg-cream"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface p-10 text-center">
        <p className="text-mist">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((m) => (
        <MovieCard key={m.key} media={m} />
      ))}
    </div>
  )
}