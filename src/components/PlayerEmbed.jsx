import { useMemo } from 'react'
import { buildEmbedUrl } from '../data/providers.js'
import { useProvider } from '../context/ProviderContext.jsx'

export default function PlayerEmbed({ mediaType, id, season = 1, episode = 1, title, className = '' }) {
  const { providerId } = useProvider()

  const src = useMemo(
    () => buildEmbedUrl(providerId, mediaType, id, season, episode),
    [providerId, mediaType, id, season, episode]
  )

  return (
    <iframe
      key={src}
      src={src}
      title={title || 'Video player'}
      className={`h-full w-full border-0 bg-black ${className}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )
}
