// Offline fallback catalog used only when no TMDB API key is configured.
// All images are stable public TMDB CDN assets; any broken image falls back
// to the built-in placeholder poster via the <img> onError handler.

import { normalizeMedia } from './media.js'

const seed = [
  {
    id: 27205,
    title: 'Inception',
    media_type: 'movie',
    overview:
      'Cobb steals information from the subconscious minds of others through dream invasion, undertaking one last job to erase his own past.',
    poster_path: '/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    release_date: '2010-07-15',
    vote_average: 8.4,
    popularity: 95,
    genre_ids: [28, 878, 12],
  },
  {
    id: 155,
    title: 'The Dark Knight',
    media_type: 'movie',
    overview:
      'Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy and forces him ever closer to crossing the line he refuses to cross.',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_path: '/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
    release_date: '2008-07-16',
    vote_average: 8.5,
    popularity: 88,
    genre_ids: [28, 80, 18],
  },
  {
    id: 157336,
    title: 'Interstellar',
    media_type: 'movie',
    overview:
      'A team of explorers travel beyond galaxy through wormhole in search of a new home for humanity.',
    poster_path: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
    backdrop_path: '/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg',
    release_date: '2014-11-05',
    vote_average: 8.4,
    popularity: 90,
    genre_ids: [12, 18, 878],
  },
  {
    id: 129,
    title: 'Spirited Away',
    media_type: 'movie',
    overview:
      'A young girl wanders into a world ruled by gods and witches, where she must work to break a spell and save her parents.',
    poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdrop_path: '/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg',
    release_date: '2001-07-20',
    vote_average: 8.7,
    popularity: 70,
    genre_ids: [16, 14],
  },
  {
    id: 24428,
    title: 'The Avengers',
    media_type: 'movie',
    overview:
      'Earth\u2019s mightiest heroes come together to stop Loki and his alien army from conquering the planet.',
    poster_path: '/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg',
    backdrop_path: '/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg',
    release_date: '2012-04-25',
    vote_average: 7.7,
    popularity: 80,
    genre_ids: [28, 12, 878],
  },
  {
    id: 123,
    title: 'Your Name',
    media_type: 'movie',
    overview:
      'Two strangers find themselves bound by a strange and wonderful connection, swapping bodies across time and distance.',
    poster_path: '/liW0mjvTyLs7UCumaHhx3PpU4VT.jpg',
    backdrop_path: '/TXSxV23MWYkezZ3219gtgcSX6n.jpg',
    release_date: '2016-08-26',
    vote_average: 8.7,
    popularity: 65,
    genre_ids: [16, 18, 10749],
  },
  {
    id: 497698,
    title: 'Spider-Man: Into the Spider-Verse',
    media_type: 'movie',
    overview:
      'Teenager Miles Morales gains spider powers and joins the mutiverse of Spider-People to stop a threat to all realities.',
    poster_path: '/qAZ0pzat24kLdO3o8ejmbLxyOac.jpg',
    backdrop_path: '/keIxh0wPr2Ymj0Btjh4gW7JJ89e.jpg',
    release_date: '2018-12-06',
    vote_average: 8.4,
    popularity: 85,
    genre_ids: [16, 28, 12],
  },
  {
    id: 670559,
    title: 'Turning Red',
    media_type: 'movie',
    overview:
      'A confident teen girl suddenly turns into a giant red panda whenever her emotions get the better of her.',
    poster_path: '/hz6kkos7ZUdGoG3o7ByzVaDPtw9.jpg',
    backdrop_path: '/hz6kkos7ZUdGoG3o7ByzVaDPtw9.jpg',
    release_date: '2022-03-10',
    vote_average: 7.4,
    popularity: 55,
    genre_ids: [16, 14],
  },
]

export const getMockMedia = () => seed.map((x) => normalizeMedia(x))

export const mockTrending = () => getMockMedia()
export const mockRow = (label) =>
  getMockMedia().filter((m) => m.title.length % 2 === (label.length % 2))

export const mockSearch = (query) =>
  getMockMedia().filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))

export const mockGenres = () =>
  new Map([
    [28, 'Action'],
    [12, 'Adventure'],
    [16, 'Animation'],
    [35, 'Comedy'],
    [18, 'Drama'],
    [878, 'Science Fiction'],
    [14, 'Fantasy'],
  ])

export const mockVideos = async () => null