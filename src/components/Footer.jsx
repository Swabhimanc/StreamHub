import { Link } from 'react-router-dom'
import { GENRES } from './Navbar.jsx'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-ink">
      <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
        <div>
          <Link to="/" className="flex items-center gap-2 text-brand">
            <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
              <g fill="currentColor">
                <rect x="6" y="10" width="6" height="24" rx="1.5" />
                <rect x="15" y="16" width="6" height="14" rx="1.5" />
                <rect x="24" y="6" width="6" height="28" rx="1.5" />
              </g>
            </svg>
            <span className="text-xl font-black tracking-tight">StreamBox</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            A beautiful video streaming frontend demo, powered by the free TMDB API.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-cream/70">Browse</h3>
          <ul className="space-y-2 text-sm text-mist">
            <li><Link to="/" className="transition hover:text-white">Home</Link></li>
            <li><Link to="/mylist" className="transition hover:text-white">My List</Link></li>
            <li><Link to="/search" className="transition hover:text-white">Search</Link></li>
            <li><Link to="/settings" className="transition hover:text-white">Settings</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-cream/80">Genres</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-mist">
            {GENRES.slice(0, 8).map((g) => (
              <li key={g.id}>
                <Link to={`/genre/${g.id}`} className="transition hover:text-white">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-cream/70">Powered by</h3>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm font-semibold text-cream/85 transition hover:border-brand hover:text-white"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2 2 5.6v2.1h20V5.6L12 2Zm-8 8v6.5l2 1V10H4Zm4 0v9.2l2 .9V10H8Zm4 0v9.8l2-.9V10h-2Zm4 0v8.1l2-1V10h-2Z" />
              </svg>
            </span>
            TMDB
          </a>
          <p className="mt-3 text-xs leading-relaxed text-mist/70">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>

      <div className="border-t border-white/5 py-5 text-center text-xs text-mist/60">
        © {new Date().getFullYear()} StreamBox — built with React, Vite & Tailwind CSS.
      </div>
    </footer>
  )
}