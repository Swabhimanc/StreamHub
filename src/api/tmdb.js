import { API_BASE, IMG_BASE, requests } from '../data/requests.js'

export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''

export const hasApiKey = Boolean(TMDB_API_KEY)

export const POSTER_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="100%" height="100%" fill="#1c1c1c"/><g fill="#e50914" transform="translate(250,375)"><rect x="-34" y="-22" width="12" height="44" rx="2"/><rect x="-14" y="-14" width="12" height="36" rx="2"/><rect x="6" y="-26" width="12" height="52" rx="2"/><rect x="26" y="-8" width="12" height="34" rx="2"/></g><text x="0" y="488" font-family="sans-serif" font-size="34" fill="#4a4a4a" text-anchor="middle">StreamBox</text></svg>`
  )

export const backdropUrl = (path) =>
  path ? `${IMG_BASE}/w1280${path}` : null
export const originalBackdropUrl = (path) =>
  path ? `${IMG_BASE}/original${path}` : null
export const posterUrl = (path, size = 'w500') =>
  path ? `${IMG_BASE}/${size}${path}` : POSTER_PLACEHOLDER

export const videosPath = (mediaType, id) =>
  `${mediaType === 'tv' ? '/tv' : '/movie'}/${id}/videos`

async function request(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  list: (path, params) => request(path, params).then((r) => r.results || []),
  genres: () =>
    Promise.all([request(requests.genresMovie), request(requests.genresTv)]).then(
      ([movieGenres, tvGenres]) => {
        const map = new Map()
        ;[...movieGenres.genres, ...tvGenres.genres].forEach((g) => map.set(g.id, g.name))
        return map
      }
    ),
  detail: (mediaType, id) => request(`${mediaType === 'tv' ? '/tv' : '/movie'}/${id}`),
  credits: (mediaType, id) => request(`${mediaType === 'tv' ? '/tv' : '/movie'}/${id}/credits`),
  videos: async (mediaType, id) => {
    const data = await request(videosPath(mediaType, id))
    const list = data.results || []
    const trailer =
      list.find(
        (v) =>
          v.site === 'YouTube' &&
          v.official &&
          ['Trailer', 'Teaser'].includes(v.type)
      ) ||
      list.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
      list.find((v) => v.site === 'YouTube')
    return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null
  },
}