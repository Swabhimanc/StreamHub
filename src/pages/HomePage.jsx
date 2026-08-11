import { useMemo } from 'react'
import { useData } from '../hooks/useData.js'
import { getTrending, getRow, ROW_SOURCES } from '../api/dataService.js'
import { useApiKey } from '../context/ApiKeyContext.jsx'
import FeaturedCarousel from '../components/FeaturedCarousel.jsx'
import Row from '../components/Row.jsx'
import { sortByPopularity } from '../data/media.js'

export default function HomePage() {
  const { apiKey } = useApiKey()
  const trending = useData(getTrending, [apiKey])
  const featured = useMemo(
    () => (trending.data && trending.data.length ? sortByPopularity(trending.data).slice(0, 6) : []),
    [trending.data]
  )

  return (
    <div className="pb-10">
      <FeaturedCarousel items={featured} />

      <div className="relative z-10 mt-4 space-y-10">
        {ROW_SOURCES.map((source) => (
          <HomeRow key={source.label} source={source} />
        ))}
      </div>
    </div>
  )
}

function HomeRow({ source }) {
  const { apiKey } = useApiKey()
  const state = useData(() => getRow(source), [source.label, apiKey])
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
