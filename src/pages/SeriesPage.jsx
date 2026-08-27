import TypePage from './TypePage.jsx'
import { SERIES_ROW_SOURCES } from '../api/dataService.js'

export default function SeriesPage() {
  return <TypePage mediaType="tv" sources={SERIES_ROW_SOURCES} label="Featured Series" />
}
