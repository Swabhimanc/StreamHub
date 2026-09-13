import TypePage from './TypePage.jsx'
import { getSeriesRowSources } from '../api/dataService.js'
import { usePreferences } from '../context/PreferencesContext.jsx'

export default function SeriesPage() {
  const { country } = usePreferences()
  return (
    <TypePage
      mediaType="tv"
      sources={getSeriesRowSources(country)}
      label="Featured Series"
    />
  )
}
