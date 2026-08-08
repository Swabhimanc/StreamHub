// Normalize TMDB movie/tv payloads into one shape the UI consumes.
export function normalizeMedia(item, forcedType) {
  const isTv =
    forcedType === 'tv' || item.media_type === 'tv' || Boolean(item.first_air_date)
  const mediaType = isTv ? 'tv' : 'movie'
  const title = item.title || item.name || item.original_title || item.original_name
  const date = item.release_date || item.first_air_date || ''
  return {
    id: item.id,
    key: `${mediaType}-${item.id}`,
    mediaType,
    title,
    overview: item.overview || '',
    backdrop: item.backdrop_path || null,
    poster: item.poster_path || null,
    rating: item.vote_average ?? 0,
    votes: item.vote_count ?? 0,
    date,
    year: date ? String(date).slice(0, 4) : '',
    genreIds: item.genre_ids || [],
    popularity: item.popularity ?? 0,
    seasons: Array.isArray(item.seasons) ? item.seasons : null,
    numberOfEpisodes: item.number_of_episodes ?? null,
  }
}

export const sortByPopularity = (list) =>
  [...list].sort((a, b) => b.popularity - a.popularity)

export const uniqueByKey = (list) => {
  const seen = new Set()
  const out = []
  list.forEach((m) => {
    if (m && !seen.has(m.key)) {
      seen.add(m.key)
      out.push(m)
    }
  })
  return out
}