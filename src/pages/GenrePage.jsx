import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useData } from '../hooks/useData.js'
import { getGenreTitles } from '../api/dataService.js'
import { useApiKey } from '../context/ApiKeyContext.jsx'
import { GENRES } from '../components/Navbar.jsx'
import MediaGrid from '../components/MediaGrid.jsx'
import AdSlot from '../components/AdSlot.jsx'
import { FilterIcon } from '../components/icons.jsx'

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'title', label: 'A → Z' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Series' },
]

const YEAR_OPTIONS = [
  { value: 'all', label: 'All Years' },
  { value: '2024', label: '2024+' },
  { value: '2020', label: '2020s' },
  { value: '2010', label: '2010s' },
  { value: '2000', label: '2000s' },
  { value: 'older', label: 'Before 2000' },
]

export default function GenrePage() {
  const { id } = useParams()
  const genreId = Number(id)
  const fallbackName = useMemo(() => GENRES.find((g) => g.id === genreId)?.name, [genreId])

  return (
    <div key={genreId} className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-brand">
        Browsing
      </p>
      <h1 className="text-3xl font-black text-white sm:text-4xl">
        {fallbackName || genreId}
      </h1>
      <AdSlot zoneId="12057858" className="my-8" />
      <GenreGrid genreId={genreId} />
    </div>
  )
}

function GenreGrid({ genreId }) {
  const { apiKey } = useApiKey()
  const [sortBy, setSortBy] = useState('popularity')
  const [typeFilter, setTypeFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const state = useData(() => getGenreTitles(genreId), [genreId, apiKey])

  const filtered = useMemo(() => {
    if (!state.data) return null
    let list = [...state.data]

    if (typeFilter !== 'all') {
      list = list.filter((m) => m.mediaType === typeFilter)
    }

    if (yearFilter !== 'all') {
      list = list.filter((m) => {
        const year = Number(m.year)
        if (!year) return false
        switch (yearFilter) {
          case '2024': return year >= 2024
          case '2020': return year >= 2020 && year < 2024
          case '2010': return year >= 2010 && year < 2020
          case '2000': return year >= 2000 && year < 2010
          case 'older': return year < 2000
          default: return true
        }
      })
    }

    switch (sortBy) {
      case 'rating': list.sort((a, b) => b.rating - a.rating); break
      case 'date_desc': list.sort((a, b) => Number(b.year || 0) - Number(a.year || 0)); break
      case 'date_asc': list.sort((a, b) => Number(a.year || 9999) - Number(b.year || 9999)); break
      case 'title': list.sort((a, b) => a.title.localeCompare(b.title)); break
      default: list.sort((a, b) => b.popularity - a.popularity)
    }

    return list
  }, [state.data, sortBy, typeFilter, yearFilter])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-surface p-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-mist">
          <FilterIcon className="h-4 w-4" /> Filter
        </div>
        <Select label="Sort" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
        <Select label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
        <Select label="Year" value={yearFilter} onChange={setYearFilter} options={YEAR_OPTIONS} />
        {filtered && (
          <span className="ml-auto text-xs font-semibold text-mist">
            {filtered.length} title{filtered.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <MediaGrid
        items={filtered}
        loading={state.loading}
        error={state.error}
        onRetry={state.retry}
        emptyText={`No titles match these filters.`}
      />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-wider text-mist">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-lg border border-white/15 bg-surface-light px-3 py-2 text-xs font-bold text-white outline-none transition focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}
