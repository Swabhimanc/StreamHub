import TypePage from './TypePage.jsx'
import { MOVIES_ROW_SOURCES } from '../api/dataService.js'

export default function MoviesPage() {
  return <TypePage mediaType="movie" sources={MOVIES_ROW_SOURCES} label="Featured Film" />
}
