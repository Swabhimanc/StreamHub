# StreamBox 🎬

A beautiful, Netflix-inspired **movie & TV streaming web app** built with **React 19 + Vite + Tailwind CSS v4**.

Browse a real, live catalog from the **TMDB API**, discover titles through rows/genres/search, and **stream directly in the browser** via embedded players with **switchable providers** (VidCore + VidFast) — including full **season & episode selection** for TV series, and **cast details** on every watch page.

> This product uses the TMDB API but is not endorsed or certified by TMDB.

---

## ✨ Features

### 🎞 Catalog & discovery
- **Hero spotlight** — trending title with cinematic backdrop, Play / More Info / My List actions.
- **Rows for every mood** — Trending, Popular, Top Rated, Now Playing, Upcoming (movies) + Trending/Popular/Top Rated (series).
- **Hover micro-interactions** — poster zoom-in on hover (no layout shift), "Add to My List", year + rating overlay.
- **Dedicated pages** — Home, Movies, Series, shared Hero + Row components, content filtered by media type.
- **Browse by genre** — dropdown nav + `/genre/:id` pages merging movies + shows.
- **Search** — debounced live search across movies & TV.

### ▶ Streaming
- **Embedded playback** — open any title to a `/watch/:type/:id` page with an in-page player.
- **Two providers, one dropdown** — switch between **VidCore** and **VidFast**; selection persists in `localStorage` and rebuilds the embed instantly.
- **Movies** — direct embed by TMDB id.
- **Series** — season & episode dropdowns; player URL rebuilds to the exact episode.
- **Poster zoom cards** — click a card to open a quick-info modal with trailer, or hit **Watch Now** to go straight to streaming.

### 🎉 Watch Party (`/party`)
- **Create/join rooms** with a shareable 6-char code and link.
- **Host-driven playback sync** — the host's play/pause/seek is broadcast to every member and applied to their players via the VidFast postMessage API, with drift correction and a **Request Sync** button for late joiners. If the host's browser blocks member autoplay, members get a one-tap unlock; if a title exposes no player telemetry, the room falls back to screen share.
- **Host migration** — if the host leaves, the next member is promoted automatically.
- **Screen share** — WebRTC host→member broadcast with quality presets and live stream stats.
- **Voice chat** + **text chat** + participants panel.
- **Real-time server** — Cloudflare Worker with Durable Objects (`server/`). Set `VITE_PARTY_WS_URL` to your deployed worker (see `.env.example`), or run `npx wrangler dev` in `server/` for local development (defaults to `ws://localhost:8787`).

### 🎭 Details page (watch)
- Title, year, match %, rating, overview.
- **Top Cast** — horizontal scroller of headshots with actor + character names (via TMDB `/credits`).
- My List add/remove from the watch page too.

### 🛠 UX polish
- Fixed navbar that turns solid on scroll, mobile menu.
- Skeleton loaders, error + retry states, empty-list states.
- Smooth section fades (`animate-fade-in`, `animate-slide-up`).
- Works **without an API key** out of the box (built-in demo catalog), so contributors can run the UI instantly.

---

## 🚀 Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**.

> No TMDB key yet? The app ships with a built-in demo catalog so the entire UI works offline of the API. Add a key for the live catalog, genres, trailers and cast.

### TMDB API key

A public read-only TMDB key is **baked into the build by default** (`src/api/tmdb.js`) — visitors get the live catalog on first load with zero configuration. Override order:

1. **Per-browser** — StreamBox Settings; stored in that browser's localStorage.
2. **Build-time** — `VITE_TMDB_API_KEY` in `.env` before `npm run build`.
3. **Built-in default** — ships in the bundle; works for demos/hobby deploys. If it gets rate-limited, swap in your own key (free at https://www.themoviedb.org → Settings → API).

The key travels directly from the browser to TMDB. If all keys fail, the app falls back to the demo catalog.

---

## 🧭 Routes

| Route | Page |
|---|---|
| `/` | Home — hero + all rows |
| `/movies` | Movies page — filtered hero + film rows |
| `/series` | Series page — filtered hero + TV rows |
| `/genre/:id` | Movies + shows for a genre |
| `/search` | Debounced live search |
| `/mylist` | Saved titles (localStorage) |
| `/watch/:type/:id` | **Streaming player** (+ provider/season/episode controls + cast) |
| `/party` | Watch party lobby (create / join) |
| `/party/:code` | Watch party room (player sync, chat, voice, screen share) |
| `/history` | Watch history (resume where you left off) |
| `/settings` | TMDB API key management |

---

## 🔌 Streaming providers

Provider embeds are normalized in `src/data/providers.js`:

| Provider | Movie | TV |
|---|---|---|
| **VidCore** (default) | `vidcore.net/movie/{tmdbId}` | `vidcore.net/tv/{tmdbId}/{s}/{e}` |
| **VidFast** | `vidfast.vc/movie/{tmdbId}` | `vidfast.vc/tv/{tmdbId}/{s}/{e}` |
| **VidRock** | `vidrock.net/movie/{tmdbId}` | `vidrock.net/tv/{tmdbId}/{s}/{e}` |

Adding a provider is one entry in the `PROVIDERS` array — the dropdown, persistence and embed rebuild pick it up automatically.

> ⚠️ **Legal note:** these providers are third-party embeds. Availability/legality of content depends on the provider and your jurisdiction. This project is a frontend demo; use or self-host at your own judgment.

---

## 🏗 Project structure

```
src/
├── api/              # TMDB client (tmdb.js) + data service (dataService.js)
│                     #   auto-switch live <-> mock, getDetails/getCast/getVideo/etc.
├── context/          # MyListContext, PlayerContext (modal), ProviderContext (stream source)
├── data/             # requests.js (TMDB paths), media.js (normalize), providers.js, mock.js
├── hooks/            # useData (fetching w/ retry), useLocalStorage
├── pages/
│   ├── HomePage.jsx        # hero + rows (all media)
│   ├── MoviesPage.jsx      # TypePage wrapper → movies
│   ├── SeriesPage.jsx      # TypePage wrapper → tv
│   ├── TypePage.jsx        # shared hero+rows for a mediaType
│   ├── GenrePage.jsx       # /genre/:id
│   ├── SearchPage.jsx      # /search
│   ├── MyListPage.jsx      # /mylist
│   └── WatchPage.jsx       # /watch/:type/:id — player + cast
└── components/
    ├── Navbar.jsx          # fixed nav, genre dropdown, mobile menu
    ├── Hero.jsx            # cinematic backdrop + Play (→ /watch) / More Info / My List
    ├── Row.jsx             # titled horizontal rail + skeletons + retry
    ├── MovieCard.jsx       # poster, hover zoom, add-to-list, click → modal
    ├── VideoModal.jsx      # quick-info modal: trailer + Watch Now (→ /watch)
    ├── PlayerEmbed.jsx     # provider iframe, rebuilds on provider/episode change
    ├── MediaGrid.jsx, Footer.jsx, ScrollToTop.jsx, icons.jsx
```

---

## 🔧 Scripts

```bash
npm run dev       # dev server (vite)
npm run build     # production bundle → dist/
npm run preview   # preview the production build
npm run lint      # oxlint
```

---

## 🧪 Tech

- **React 19** + **React Router 7**
- **Vite 8**
- **Tailwind CSS v4** (CSS-first `@theme` config — no tailwind.config.js)
- **TMDB API** (free key) — catalog, genres, search, videos, credits
- Embedded providers — VidCore, VidFast

---

## 📦 Deploy

It's a static SPA — any static host works (Vercel/Netlify/GitHub Pages). Build with `npm run build` and serve `dist/`. TMDB works out of the box via the built-in key; set `VITE_TMDB_API_KEY` only to use your own (see “TMDB API key”). For watch parties set `VITE_PARTY_WS_URL` to your deployed worker. For client-side routes to work on refresh, add an SPA fallback (serve `index.html` for unknown paths).

---

## 📄 License

MIT — see `LICENSE` (add one before open-sourcing).

## 🙏 Attribution

- Catalog, posters and metadata: [TMDB](https://www.themoviedb.org) (not endorsed/certified by TMDB).
- Streaming embeds: third-party providers (see the legal note above).
