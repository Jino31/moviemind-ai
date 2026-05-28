const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const BASE_URL = "https://api.themoviedb.org/3";

export const imageBase = "https://image.tmdb.org/t/p/w500";

export async function fetchTrendingMovies() {
  const res = await fetch(
    `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
  );

  return await res.json();
}

export async function searchMovies(query) {
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`
  );

  return await res.json();
}

export async function fetchMovieDetails(id) {
  const res = await fetch(
    `${BASE_URL}/movie/${id}?api_key=${API_KEY}`
  );

  return await res.json();
}

export async function fetchMovieTrailer(id) {
  const res = await fetch(
    `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`
  );

  return await res.json();
}