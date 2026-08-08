import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useData } from '../hooks/useData.js'
import { getGenreTitles } from '../api/dataService.js'
import { GENRES } from '../components/Navbar.jsx'
import MediaGrid from '../components/MediaGrid.jsx'

export default function GenrePage() {
  const { id } = useParams()
  const genreId = Number(id)
  const fallbackName = useMemo(() => GENRES.find((g) => g.id === genreId)?.name, [genreId])

  return (
    <div key={genreId} className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-brand">
        Browsing
      </p>
      <h1 className="mb-8 text-3xl font-black text-white sm:text-4xl">
        {fallbackName || genreId}
      </h1>
      <GenreGrid genreId={genreId} />
    </div>
  )
}

function GenreGrid({ genreId }) {
  const state = useData(() => getGenreTitles(genreId), [genreId])
  return (
    <MediaGrid
      items={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={state.retry}
      emptyText={`No titles found for this genre yet.`}
    />
  )
}