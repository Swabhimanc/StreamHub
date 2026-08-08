import { useMemo } from 'react'
import { useData } from '../hooks/useData.js'
import { getTrending, getRow, ROW_SOURCES } from '../api/dataService.js'
import Hero from '../components/Hero.jsx'
import Row from '../components/Row.jsx'
import { sortByPopularity } from '../data/media.js'

export default function HomePage() {
  const trending = useData(getTrending)
  const heroMedia = useMemo(
    () => (trending.data && trending.data.length ? sortByPopularity(trending.data)[0] : null),
    [trending.data]
  )

  return (
    <div className="pb-10">
      <Hero media={heroMedia} />

      <div className="relative z-10 mt-4 space-y-10">
        {ROW_SOURCES.map((source) => (
          <HomeRow key={source.label} source={source} />
        ))}
      </div>
    </div>
  )
}

function HomeRow({ source }) {
  const state = useData(() => getRow(source), [source.label])
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