import TypePage from './TypePage.jsx'
import { getMoviesRowSources } from '../api/dataService.js'
import { usePreferences } from '../context/PreferencesContext.jsx'

export default function MoviesPage() {
  const { country } = usePreferences()
  return (
    <TypePage
      mediaType="movie"
      sources={getMoviesRowSources(country)}
      label="Featured Film"
    />
  )
}
