# StreamBox 🎬

A beautiful, Netflix-inspired **movie & TV streaming web app** built with **React 19, Vite, and Tailwind CSS v4**.

StreamBox uses the **TMDB API** to provide a real-time movie and TV catalog with trending titles, genres, search, cast information, trailers, and detailed watch pages. The application also supports switchable third-party video providers with season and episode selection for TV series.

> **Disclaimer:** StreamBox uses the TMDB API but is not endorsed, certified, or otherwise affiliated with TMDB. Streaming providers are third-party services and are not affiliated with this project.

---

## 📸 Screenshots

### 🏠 Home

<img width="1728" height="1002" alt="StreamBox Home" src="https://github.com/user-attachments/assets/095ee15c-5c13-48f1-bcd7-526cca247da0" />

### 🎬 Movies

<img width="1728" height="998" alt="StreamBox Movies" src="https://github.com/user-attachments/assets/b3004cfa-d609-43cb-9781-7951cb1810a0" />

### 🔎 Search & Discovery

<img width="1728" height="1002" alt="StreamBox Search" src="https://github.com/user-attachments/assets/1da843c0-ae57-47f0-99e8-b06b41916e84" />

### ▶️ Watch Page

<img width="1727" height="1000" alt="StreamBox Watch Page" src="https://github.com/user-attachments/assets/cbac2c54-3263-46f7-9b65-e7a8ceeda3bc" />

### 📺 TV Series & Episodes

<img width="1728" height="1001" alt="StreamBox TV Series" src="https://github.com/user-attachments/assets/6339fda6-70c9-47cd-9932-380fbb973e2b" />

### 📱 Responsive UI

<img width="1728" height="1000" alt="StreamBox Responsive UI" src="https://github.com/user-attachments/assets/1f8eb13f-49d8-4295-af91-8ebec85e1831" />

---

## ✨ Features

### 🎞️ Catalog & Discovery

* 🎯 **Hero spotlight** with a cinematic backdrop and featured/trending title
* 🔥 **Trending titles**
* ⭐ **Popular titles**
* 🏆 **Top Rated movies & TV shows**
* 🎬 **Now Playing movies**
* 🚀 **Upcoming movies**
* 📺 Dedicated **Movies** and **Series** pages
* 🎭 **Browse by genre**
* 🔎 **Debounced live search** across movies and TV shows
* 📌 **My List** for saving favorite titles
* 🖼️ Responsive movie and TV poster grids
* ✨ Poster hover animations and micro-interactions

### ▶️ Streaming

* 🎥 Embedded browser playback
* 🔄 Switch between multiple streaming providers
* 💾 Selected provider persists using `localStorage`
* 🎬 Movie playback using TMDB IDs
* 📺 TV series playback with:

  * Season selection
  * Episode selection
  * Direct episode playback
* 🔁 Player automatically rebuilds when the provider, season, or episode changes

### 🎭 Watch & Details

Every watch page provides:

* Movie/show title
* Release year
* Rating
* Match percentage
* Overview
* Streaming player
* Provider selector
* Season & episode selector for TV
* Top cast
* Actor names
* Character names
* Add/remove from My List

### 🛠️ UX & Performance

* 📱 Responsive design
* 🧭 Fixed navigation bar
* 📱 Mobile navigation menu
* 🎨 Netflix-inspired dark UI
* 💀 Skeleton loading states
* 🔄 Retry states for failed API requests
* 📭 Empty states
* ✨ Smooth page and component animations
* 🖱️ Hover interactions without layout shifts
* ⚡ Debounced search
* 💾 LocalStorage persistence
* 🔌 Offline demo catalog when TMDB isn't configured

---

## 🚀 Live Demo

**Coming soon**

> Add your deployed URL here once StreamBox is deployed.

---

## 🧰 Tech Stack

| Technology             | Purpose                         |
| ---------------------- | ------------------------------- |
| **React 19**           | UI framework                    |
| **Vite 8**             | Build tool & development server |
| **Tailwind CSS v4**    | Styling                         |
| **React Router 7**     | Client-side routing             |
| **TMDB API**           | Movie & TV metadata             |
| **JavaScript**         | Application logic               |
| **LocalStorage**       | My List & provider persistence  |
| **Embedded Providers** | Video playback                  |

---

## 📦 Getting Started

### Prerequisites

Make sure you have:

* Node.js installed
* npm installed
* A TMDB API key if you want the live catalog

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/streambox.git
cd streambox
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔑 TMDB API Configuration

StreamBox can run without a TMDB API key using its built-in demo catalog.

For the complete live experience, create a TMDB account and obtain a **v3 API key**.

1. Create an account on TMDB.
2. Go to your account settings.
3. Open the **API** section.
4. Create/copy your **v3 auth key**.
5. Open StreamBox Settings.
6. Enter your API key.

The application stores the key locally in the browser and sends requests directly to TMDB.

> **Security note:** Because this is a client-side application, a TMDB API key entered into the browser should not be considered a secret. Do not use this architecture for sensitive credentials.

---

## 🧭 Application Routes

| Route              | Description                          |
| ------------------ | ------------------------------------ |
| `/`                | Home page with hero and content rows |
| `/movies`          | Movies discovery page                |
| `/series`          | TV series discovery page             |
| `/genre/:id`       | Movies & TV shows filtered by genre  |
| `/search`          | Live movie & TV search               |
| `/mylist`          | Saved titles                         |
| `/watch/:type/:id` | Watch/details page                   |

---

## 🔌 Streaming Providers

Streaming providers are normalized in:

```text
src/data/providers.js
```

Current providers:

| Provider    | Movie                        | TV                                |
| ----------- | ---------------------------- | --------------------------------- |
| **VidCore** | `vidcore.net/movie/{tmdbId}` | `vidcore.net/tv/{tmdbId}/{s}/{e}` |
| **VidFast** | `vidfast.vc/movie/{tmdbId}`  | `vidfast.vc/tv/{tmdbId}/{s}/{e}`  |
| **VidRock** | `vidrock.net/movie/{tmdbId}` | `vidrock.net/tv/{tmdbId}/{s}/{e}` |

Providers are defined through a single configuration array.

Adding a new provider only requires adding another entry to the `PROVIDERS` array. The provider dropdown, persistence, and player URL rebuilding are handled automatically.

### Example

```js
const PROVIDERS = [
  {
    id: "vidcore",
    name: "VidCore",
    movie: (id) => `https://vidcore.net/movie/${id}`,
    tv: (id, season, episode) =>
      `https://vidcore.net/tv/${id}/${season}/${episode}`,
  },
];
```

> ⚠️ **Legal notice:** The streaming providers listed above are third-party services. StreamBox does not host or control the content provided by these services. Availability and legality of content may vary depending on the provider and your jurisdiction. Use third-party embeds only where you have the appropriate rights and permissions.

---

## 🏗️ Project Structure

```text
src/
├── api/
│   ├── tmdb.js
│   └── dataService.js
│
├── context/
│   ├── MyListContext.jsx
│   ├── PlayerContext.jsx
│   └── ProviderContext.jsx
│
├── data/
│   ├── requests.js
│   ├── media.js
│   ├── providers.js
│   └── mock.js
│
├── hooks/
│   ├── useData.js
│   └── useLocalStorage.js
│
├── pages/
│   ├── HomePage.jsx
│   ├── MoviesPage.jsx
│   ├── SeriesPage.jsx
│   ├── TypePage.jsx
│   ├── GenrePage.jsx
│   ├── SearchPage.jsx
│   ├── MyListPage.jsx
│   └── WatchPage.jsx
│
└── components/
    ├── Navbar.jsx
    ├── Hero.jsx
    ├── Row.jsx
    ├── MovieCard.jsx
    ├── VideoModal.jsx
    ├── PlayerEmbed.jsx
    ├── MediaGrid.jsx
    ├── Footer.jsx
    ├── ScrollToTop.jsx
    └── icons.jsx
```

### Architecture Overview

```text
                    ┌─────────────────┐
                    │     StreamBox   │
                    │    React SPA    │
                    └────────┬────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
       ┌───────────┐   ┌────────────┐   ┌─────────────┐
       │   TMDB    │   │ LocalStorage│   │   Player    │
       │    API    │   │            │   │   Providers │
       └───────────┘   └────────────┘   └─────────────┘
             │
             ▼
     Movies / TV / Genres
     Search / Credits
     Videos / Metadata
```

---

## 🔧 Available Scripts

### Development

```bash
npm run dev
```

Starts the Vite development server.

### Production Build

```bash
npm run build
```

Creates the production bundle in:

```text
dist/
```

### Preview Production Build

```bash
npm run preview
```

Runs the production build locally.

### Lint

```bash
npm run lint
```

Runs Oxlint against the project.

---

## 📱 Responsive Design

StreamBox is designed to work across:

* 💻 Desktop
* 🖥️ Large screens
* 📱 Mobile devices
* 📲 Tablets

The navigation, content rows, grids, modals, player, and watch pages adapt to different screen sizes.

---

## 💾 Local Storage

StreamBox uses browser `localStorage` for client-side persistence.

Currently stored data includes:

* My List
* Selected streaming provider
* TMDB API key

No user account or backend database is required.

---

## 🌐 Deployment

StreamBox is a static React SPA and can be deployed to most static hosting platforms.

Supported platforms include:

* Vercel
* Netlify
* GitHub Pages
* Cloudflare Pages
* Any static web server

### Build

```bash
npm run build
```

Then deploy the generated:

```text
dist/
```

directory.

### SPA Routing

Because StreamBox uses client-side routing, your hosting provider must serve:

```text
index.html
```

for unknown routes.

For example:

```text
/watch/movie/123
```

should still return the application's `index.html` instead of a 404.

---

## 🧪 Development Without TMDB

StreamBox includes a built-in demo catalog.

This allows contributors to:

* Start the application without an API key
* Explore the UI
* Test navigation
* Test components
* Test My List
* Work on the frontend offline

When a valid TMDB API key is configured, the application automatically uses the live TMDB data source.

---

## 🤝 Contributing

Contributions are welcome!

### 1. Fork the repository

```bash
git fork
```

### 2. Create a branch

```bash
git checkout -b feature/my-feature
```

### 3. Make your changes

```bash
npm run dev
```

### 4. Run linting

```bash
npm run lint
```

### 5. Build the project

```bash
npm run build
```

### 6. Commit your changes

```bash
git commit -m "Add my feature"
```

### 7. Push your branch

```bash
git push origin feature/my-feature
```

Then open a Pull Request.

---

## 🗺️ Roadmap

Potential future improvements:

* [ ] User authentication
* [ ] Cloud-synced My List
* [ ] Continue Watching
* [ ] Watch history
* [ ] Personalized recommendations
* [ ] Multiple language support
* [ ] Advanced filtering
* [ ] Improved mobile player
* [ ] PWA support
* [ ] Performance optimizations
* [ ] More legal/licensed content sources
* [ ] Automated testing

---

## ⚠️ Disclaimer

StreamBox is an independent frontend project created for educational and demonstration purposes.

* StreamBox does **not** claim ownership of third-party movie/TV metadata.
* Movie and TV metadata is provided by TMDB.
* StreamBox is not endorsed or certified by TMDB.
* StreamBox does not control third-party streaming providers.
* Third-party embeds may contain content that is unavailable, restricted, or unauthorized in certain jurisdictions.
* Users are responsible for complying with applicable laws and the terms of the services they use.

---

## 📄 License

This project is intended to be released under the **MIT License**.

See [`LICENSE`](./LICENSE) for details.

> Make sure to add the actual `LICENSE` file to the repository before publishing the project as MIT licensed.

---

## 🙏 Attribution

### TMDB

Movie and TV metadata, posters, genres, credits, and other catalog information are provided by **TMDB**.

> This product uses the TMDB API but is not endorsed or certified by TMDB.

### Third-Party Streaming Providers

Video playback is provided through third-party embedded services. StreamBox does not host or distribute the underlying video content.

---

## ⭐ Support the Project

If you find StreamBox useful or interesting:

⭐ **Star the repository**

🍴 **Fork the project**

🐛 **Open an issue**

💡 **Submit a pull request**

---

<p align="center">
  Built with ❤️ using React, Vite & Tailwind CSS
</p>
