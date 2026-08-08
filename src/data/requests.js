export const API_BASE = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p'
export const YT_EMBED = 'https://www.youtube.com/embed'

export const requests = {
  trending: '/trending/all/week',
  popularMovies: '/movie/popular',
  topRatedMovies: '/movie/top_rated',
  popularTv: '/tv/popular',
  topRatedTv: '/tv/top_rated',
  nowPlaying: '/movie/now_playing',
  upcoming: '/movie/upcoming',
  genresMovie: '/genre/movie/list',
  genresTv: '/genre/tv/list',
  discover: '/discover/movie',
  searchMovie: '/search/movie',
  searchTv: '/search/tv',
  videosMovie: '/movie/{id}/videos',
  videosTv: '/tv/{id}/videos',
}