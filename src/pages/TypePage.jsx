import { useMemo } from 'react'
import { useData } from '../hooks/useData.js'
import { getTrending, getRow } from '../api/dataService.js'
import Hero from '../components/Hero.jsx'
import Row from '../components/Row.jsx'
import { sortByPopularity } from '../data/media.js'

export default function TypePage({ mediaType, sources }) {
  const trending = useData(() => getTrending(mediaType), [mediaType])
  const heroMedia = useMemo(
    () => (trending.data && trending.data.length ? sortByPopularity(trending.data)[0] : null),
    [trending.data]
  )

  return (
    <div className="pb-10">
      <Hero media={heroMedia} />

      <div className="relative z-10 mt-4 space-y-10">
        {sources.map((source) => (
          <TypeRow key={source.label} source={source} />
        ))}
      </div>
    </div>
  )
}

function TypeRow({ source }) {
  const state = useData(
    () => (source.fetch ? source.fetch() : getRow(source)),
    [source.label]
  )
  return (
    <Row
      title={source.label}
      items={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={state.retry}
    />
  )
}
