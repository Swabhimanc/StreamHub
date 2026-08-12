import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ApiKeyProvider } from './context/ApiKeyContext.jsx'
import { MyListProvider } from './context/MyListContext.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import { ProviderProvider } from './context/ProviderContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import VideoModal from './components/VideoModal.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import MyListPage from './pages/MyListPage.jsx'
import GenrePage from './pages/GenrePage.jsx'
import MoviesPage from './pages/MoviesPage.jsx'
import SeriesPage from './pages/SeriesPage.jsx'
import WatchPage from './pages/WatchPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ApiKeyProvider>
        <MyListProvider>
          <ProviderProvider>
          <PlayerProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col bg-ink">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/series" element={<SeriesPage />} />
                  <Route path="/watch/:type/:id" element={<WatchPage />} />
                  <Route path="/mylist" element={<MyListPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/genre/:id" element={<GenrePage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>
              <Footer />
              <VideoModal />
            </div>
          </PlayerProvider>
          </ProviderProvider>
        </MyListProvider>
      </ApiKeyProvider>
    </BrowserRouter>
  )
}
