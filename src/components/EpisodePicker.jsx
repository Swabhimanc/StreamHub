import { stillUrl } from '../api/tmdb.js'
import { SpinnerIcon } from './icons.jsx'

function formatDate(value) {
  if (!value) return null
  const [year, month, day] = value.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`
}

export default function EpisodePicker({ seasons, season, episode, episodes, loading, onSeasonChange, onEpisodeChange }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white sm:text-2xl">Episodes</h3>
        <span className="text-[9px] font-black uppercase tracking-[0.13em] text-mist">
          {episodes?.length || 0} Episodes
        </span>
      </div>

      {/* Season tabs */}
      <div className="no-scrollbar mt-5 flex gap-7 overflow-x-auto pb-1">
        {seasons.map((item) => {
          const selected = item.season_number === season
          return (
            <button
              key={item.season_number}
              onClick={() => onSeasonChange(item.season_number)}
              className="flex min-h-[38px] flex-col items-start"
            >
              <span className={`text-base font-bold transition ${selected ? 'font-black text-white' : 'text-mist hover:text-cream'}`}>
                Season {item.season_number}
              </span>
              {selected && <span className="mt-2.5 h-[3px] w-full rounded bg-brand" />}
            </button>
          )
        })}
      </div>

      <div className="-mt-px h-px bg-white/8" />

      {/* Episode list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2.5">
          <SpinnerIcon className="h-5 w-5 text-brand" />
          <span className="text-xs text-mist">Loading episodes...</span>
        </div>
      ) : episodes?.length ? (
        <div className="pt-1">
          {episodes.map((item) => {
            const selected = item.number === episode
            return (
              <button
                key={item.id || item.number}
                onClick={() => onEpisodeChange(item.number)}
                className={`flex w-full gap-3.5 border-b border-white/8 px-1 py-4 text-left transition sm:gap-4 sm:px-3 ${
                  selected ? 'bg-brand/[0.055]' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-[78px] w-[132px] shrink-0 overflow-hidden rounded-lg bg-surface-light sm:h-[78px] sm:w-[132px]">
                  {item.still ? (
                    <img
                      src={stillUrl(item.still)}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-base font-black text-mist">E{item.number}</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 flex h-[25px] w-[25px] items-center justify-center rounded-full border border-white/35 bg-black/72">
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86Z" />
                    </svg>
                  </span>
                </div>

                {/* Copy */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-2 flex-1 text-sm font-extrabold text-white sm:text-base">
                      {item.title}
                    </span>
                    {selected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                  </div>
                  <p className={`mt-1.5 text-[10px] font-bold leading-tight ${selected ? 'text-brand' : 'text-[#9298ad]'}`}>
                    {[
                      `S${season} E${item.number}`,
                      formatDate(item.airDate),
                      item.runtime ? `${item.runtime}m` : null,
                    ].filter(Boolean).join('  |  ')}
                  </p>
                  {item.overview && (
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-mist">
                      {item.overview}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="py-7 text-xs leading-relaxed text-mist">
          Episode information is not available for this season.
        </p>
      )}
    </div>
  )
}
