import { api, hasApiKey } from './tmdb.js'
import { requests } from '../data/requests.js'
import { normalizeMedia, sortByPopularity, uniqueByKey } from '../data/media.js'
import {
  getMockMedia,
  mockSearch,
  mockGenres,
  mockVideos,
  mockRow,
} from '../data/mock.js'

export const isLive = () => hasApiKey()

export async function getTrending(mediaType) {
  if (!hasApiKey()) return mediaType ? getMockMedia().filter((m) => m.mediaType === mediaType) : getMockMedia()
  const raw = await api.list(mediaType ? `/trending/${mediaType}/week` : requests.trending)
  return uniqueByKey(raw.map((r) => normalizeMedia(r, mediaType)))
}

// Rows for the home page: [label, requestPath]
export const ROW_SOURCES = [
  { label: 'Trending Now', fetch: () => getTrending() },
  { label: 'Popular Movies', path: requests.popularMovies },
  { label: 'Top Rated', path: requests.topRatedMovies },
  { label: 'Popular Series', path: requests.popularTv },
  { label: 'Now Playing', path: requests.nowPlaying },
  { label: 'Upcoming', path: requests.upcoming },
]

export async function getRow({ label, path, fetch: customFetch }) {
  if (customFetch) return customFetch()
  if (!hasApiKey()) return mockRow(label)
  const raw = await api.list(path)
  return raw.map((r) => normalizeMedia(r, path.includes('/tv') ? 'tv' : 'movie'))
}

export const MOVIES_ROW_SOURCES = [
  { label: 'Trending Films', fetch: () => getTrending('movie') },
  { label: 'Popular Movies', path: requests.popularMovies },
  { label: 'Top Rated', path: requests.topRatedMovies },
  { label: 'Now Playing', path: requests.nowPlaying },
  { label: 'Upcoming', path: requests.upcoming },
]

export const SERIES_ROW_SOURCES = [
  { label: 'Trending Series', fetch: () => getTrending('tv') },
  { label: 'Popular Series', path: requests.popularTv },
  { label: 'Top Rated Series', path: requests.topRatedTv },
]

export async function getGenres() {
  if (!hasApiKey()) return mockGenres()
  return api.genres()
}

export async function getDiscoverByGenre(genreId, page = 1) {
  if (!hasApiKey()) return getMockMedia().slice(0, 12)
  const raw = await api.list(requests.discover, {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page,
    include_adult: false,
  })
  return raw.map((r) => normalizeMedia(r, 'movie'))
}

export async function getGenreTitles(genreId, page = 1) {
  if (!hasApiKey()) return getMockMedia().slice(0, 12)
  const [movies, shows] = await Promise.all([
    api.list(requests.discover, {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    }),
    api.list('/discover/tv', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    }),
  ])
  const all = [...movies.map((m) => normalizeMedia(m, 'movie')), ...shows.map((s) => normalizeMedia(s, 'tv'))]
  return sortByPopularity(uniqueByKey(all))
}

export async function searchMedia(query, page = 1) {
  if (!hasApiKey()) return mockSearch(query)
  const [movies, shows] = await Promise.all([
    api.list(requests.searchMovie, { query, page, include_adult: false }),
    api.list(requests.searchTv, { query, page, include_adult: false }),
  ])
  const all = [...movies.map((m) => normalizeMedia(m, 'movie')), ...shows.map((s) => normalizeMedia(s, 'tv'))]
  return sortByPopularity(uniqueByKey(all))
}

export async function getVideo(mediaType, id) {
  if (!hasApiKey()) return mockVideos()
  return api.videos(mediaType, id)
}

export async function getDetails(mediaType, id) {
  if (!hasApiKey()) return getMockMedia().find((m) => String(m.id) === String(id)) || null
  const raw = await api.detail(mediaType, id)
  return normalizeMedia(raw, mediaType)
}

export async function getBackdrops(mediaType, id, limit = 5) {
  if (!hasApiKey()) return []
  const images = await api.images(mediaType, id).catch(() => ({ backdrops: [] }))
  return (images.backdrops || [])
    .filter((image) => image.file_path)
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, limit)
    .map((image) => image.file_path)
}

export async function getRelated(mediaType, id, limit = 12) {
  if (!hasApiKey()) {
    const current = getMockMedia().find((media) => String(media.id) === String(id))
    return getMockMedia()
      .filter((media) => media.key !== current?.key)
      .sort((a, b) => {
        const aMatches = a.genreIds.filter((genre) => current?.genreIds.includes(genre)).length
        const bMatches = b.genreIds.filter((genre) => current?.genreIds.includes(genre)).length
        return bMatches - aMatches || b.popularity - a.popularity
      })
      .slice(0, limit)
  }

  let raw = await api.list(`/${mediaType}/${id}/recommendations`)
  if (!raw.length) raw = await api.list(`/${mediaType}/${id}/similar`)
  return raw.slice(0, limit).map((item) => normalizeMedia(item, mediaType))
}

export async function getSeasonEpisodes(id, seasonNumber) {
  if (!hasApiKey()) return []

  const season = await api.season(id, seasonNumber)
  return (season.episodes || []).map((episode) => ({
    id: episode.id,
    number: episode.episode_number,
    season: episode.season_number,
    title: episode.name || `Episode ${episode.episode_number}`,
    overview: episode.overview || '',
    still: episode.still_path || null,
    airDate: episode.air_date || '',
    runtime: episode.runtime || null,
  }))
}

export async function getCast(mediaType, id, limit = 20) {
  if (!hasApiKey()) return []
  const credits = await api.credits(mediaType, id).catch(() => ({ cast: [] }))
  return (credits.cast || [])
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character || '',
      profile: p.profile_path || null,
    }))
}
