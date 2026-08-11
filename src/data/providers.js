export const PROVIDERS = [
  {
    id: 'vidcore',
    name: 'VidCore',
    movie: (id) => `https://vidcore.net/movie/${id}`,
    tv: (id, season, episode) => `https://vidcore.net/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    movie: (id) => `https://vidfast.vc/movie/${id}`,
    tv: (id, season, episode) => `https://vidfast.vc/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidrock',
    name: 'VidRock',
    movie: (id) => `https://vidrock.net/movie/${id}`,
    tv: (id, season, episode) => `https://vidrock.net/tv/${id}/${season}/${episode}`,
  },
]

export const DEFAULT_PROVIDER = 'vidcore'

export const getProvider = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[0]

export function buildEmbedUrl(providerId, mediaType, id, season = 1, episode = 1) {
  const provider = getProvider(providerId)
  return mediaType === 'tv' ? provider.tv(id, season, episode) : provider.movie(id)
}
