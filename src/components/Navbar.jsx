import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useMyList } from '../context/MyListContext.jsx'
import { SearchIcon, CloseIcon } from './icons.jsx'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/mylist', label: 'My List' },
  { to: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { items } = useMyList()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname, location.search])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled || menuOpen
          ? 'bg-ink/95 shadow-lg shadow-black/40 backdrop-blur'
          : 'bg-gradient-to-b from-black/70 via-black/20 to-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-screen-2xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-10">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-brand select-none"
          aria-label="StreamBox home"
        >
          <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden="true">
            <g fill="currentColor">
              <rect x="6" y="10" width="6" height="20" rx="1.5" />
              <rect x="15" y="16" width="6" height="14" rx="1.5" />
              <rect x="24" y="6" width="6" height="28" rx="1.5" />
            </g>
          </svg>
          <span className="text-2xl font-black tracking-tight">StreamBox</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-5 text-sm font-semibold text-cream/85 lg:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive ? 'text-white' : 'hover:text-white transition-colors'
              }
            >
              {l.label}
              {l.to === '/mylist' && items.length > 0 && (
                <span className="ml-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </NavLink>
          ))}
          <Dropdown />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/search"
            className="rounded-full p-2 text-cream/85 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Search"
          >
            <SearchIcon className="h-6 w-6" />
          </Link>

          <Link
            to="/settings"
            className="rounded-full p-2 text-cream/85 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Settings"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Mobile hamburger with badge */}
          <button
            className="rounded-full p-2 text-cream/85 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-ink/95 px-4 py-3 lg:hidden">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="flex items-center justify-between py-3 text-base font-semibold text-cream hover:text-white"
            >
              {l.label}
              {l.to === '/mylist' && items.length > 0 && (
                <span className="rounded bg-brand px-2 py-0.5 text-xs font-bold text-white">
                  {items.length}
                </span>
              )}
            </NavLink>
          ))}
          <Dropdown mobile />
        </div>
      )}
    </header>
  )
}

function Dropdown({ mobile = false }) {
  const [open, setOpen] = useState(false)
  const base = mobile
    ? 'flex w-full items-center justify-between py-3 text-base font-semibold text-cream hover:text-white'
    : 'flex items-center gap-1 text-sm font-semibold text-cream/85 hover:text-white transition-colors'

  return (
    <div className={mobile ? 'relative' : 'relative'}>
      <button className={base} onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open}>
        Browse by Genre
        <svg
          className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute left-0 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-surface-light/95 p-2 shadow-2xl shadow-black/50 backdrop-blur md:grid-cols-3 ${
            mobile ? 'static mt-1' : 'mt-3 w-[440px]'
          }`}
          onMouseLeave={mobile ? undefined : () => setOpen(false)}
        >
          {GENRES.map((g) => (
            <Link
              key={g.id}
              to={`/genre/${g.id}`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-cream/85 transition-colors hover:bg-brand/20 hover:text-white"
            >
              {g.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
]