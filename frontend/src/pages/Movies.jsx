```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaPlay,
  FaStar,
  FaTimes,
} from "react-icons/fa";

import axios from "axios";

function Movies() {

  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");

  const [trailerKey, setTrailerKey] = useState(null);

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // FETCH TRENDING MOVIES

  useEffect(() => {

    fetchTrendingMovies();

  }, []);

  const fetchTrendingMovies = async () => {

    try {

      const res = await axios.get(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
      );

      setMovies(res.data.results);

    } catch (error) {

      console.log(error);

    }
  };

  // SEARCH MOVIES

  const searchMovies = async () => {

    if (!search.trim()) {

      fetchTrendingMovies();
      return;

    }

    try {

      const res = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${search}`
      );

      setMovies(res.data.results);

    } catch (error) {

      console.log(error);

    }
  };

  // WATCH TRAILER

  const watchTrailer = async (movieId) => {

    try {

      const res = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`
      );

      const trailer = res.data.results.find(
        (video) =>
          video.type === "Trailer" &&
          video.site === "YouTube"
      );

      if (trailer) {

        setTrailerKey(trailer.key);

      } else {

        alert("Trailer not available");

      }

    } catch (error) {

      console.log(error);

    }
  };

  return (

    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BACKGROUND */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_30%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_30%)] opacity-60"></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:55px_55px]"></div>

      {/* TRAILER MODAL */}

      {trailerKey && (

        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">

          <div className="relative w-full max-w-5xl">

            <button
              onClick={() => setTrailerKey(null)}
              className="
                absolute
                -top-12
                right-0
                text-white
                text-3xl
              "
            >
              <FaTimes />
            </button>

            <div className="aspect-video">

              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trailerKey}`}
                title="Trailer"
                allowFullScreen
                className="rounded-2xl"
              ></iframe>

            </div>

          </div>

        </div>

      )}

      {/* CONTENT */}

      <div className="relative z-10">

        {/* NAVBAR */}

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 md:px-10 py-4 gap-4 border-b border-white/10 backdrop-blur-xl">

          {/* LOGO */}

          <div>

            <h1
              className="
                text-3xl md:text-6xl
                font-black
                leading-tight
                bg-gradient-to-r
                from-red-500
                via-pink-500
                to-purple-500
                bg-clip-text
                text-transparent
              "
            >
              MovieMind AI
            </h1>

            <p className="text-white/40 text-xs md:text-sm mt-1">
              Explore Trending Movies
            </p>

          </div>

          {/* SEARCH */}

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

            <div className="relative w-full">

              <FaSearch className="absolute top-1/2 left-5 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && searchMovies()
                }
                className="
                  w-full md:w-[320px]
                  pl-14 pr-5 py-3
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  outline-none
                  focus:border-pink-500
                  transition
                "
              />

            </div>

            <button
              onClick={searchMovies}
              className="
                px-6 py-3
                rounded-2xl
                bg-gradient-to-r
                from-red-500
                to-pink-500
                font-semibold
                hover:scale-105
                transition
              "
            >
              Search
            </button>

          </div>

        </div>

        {/* HERO */}

        <section className="relative h-[75vh] md:h-[80vh] flex items-center overflow-hidden">

          {/* OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10"></div>

          {/* BG IMAGE */}

          {movies[0] && (

            <img
              src={`https://image.tmdb.org/t/p/original${movies[0].backdrop_path}`}
              alt="banner"
              className="absolute inset-0 w-full h-full object-cover"
            />

          )}

          {/* CONTENT */}

          <div className="relative z-10 flex items-center h-full px-4 md:px-14 pt-24">

            <div className="max-w-4xl">

              <h1 className="text-4xl sm:text-5xl md:text-8xl font-black leading-tight mb-6">

                Unlimited
                <br />

                <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Movie Experience
                </span>

              </h1>

              <p className="text-base md:text-2xl text-white/70 leading-relaxed mb-8">

                Explore trending blockbusters,
                emotional dramas, dark thrillers,
                sci-fi adventures and AI-powered
                recommendations.

              </p>

              {/* BUTTONS */}

              <div className="flex flex-col sm:flex-row gap-4">

                <button
                  onClick={() =>
                    movies[0] &&
                    watchTrailer(movies[0].id)
                  }
                  className="
                    px-8 py-4
                    rounded-3xl
                    bg-gradient-to-r
                    from-red-500
                    to-pink-500
                    font-bold
                    text-lg
                    flex items-center
                    justify-center
                    gap-3
                    hover:scale-105
                    transition
                  "
                >
                  <FaPlay />

                  Watch Trailer
                </button>

                <button
                  onClick={() => navigate("/chatbot")}
                  className="
                    px-8 py-4
                    rounded-3xl
                    border border-white/10
                    bg-white/5
                    font-bold
                    text-lg
                    hover:bg-white/10
                    transition
                  "
                >
                  AI Recommendation
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* MOVIES */}

        <section className="py-16">

          {/* TITLE */}

          <div className="flex items-center justify-between px-4 md:px-12 mb-6">

            <h2 className="text-3xl md:text-5xl font-black">
              Trending Movies
            </h2>

          </div>

          {/* MOVIE GRID */}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 px-4 md:px-12">

            {movies.map((movie) => (

              <div
                key={movie.id}
                className="
                  group
                  rounded-3xl
                  overflow-hidden
                  bg-white/5
                  border border-white/10
                  hover:scale-105
                  transition-all
                  duration-300
                "
              >

                {/* IMAGE */}

                <div className="relative overflow-hidden">

                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="
                      w-full
                      h-[260px] md:h-[360px]
                      object-cover
                    "
                  />

                  <div
                    className="
                      absolute inset-0
                      bg-black/60
                      opacity-0
                      group-hover:opacity-100
                      transition
                      flex flex-col items-center justify-center gap-4
                    "
                  >

                    <button
                      onClick={() =>
                        navigate(`/movie/${movie.id}`)
                      }
                      className="
                        px-5 py-3
                        rounded-2xl
                        bg-pink-500
                        font-bold
                      "
                    >
                      More Info
                    </button>

                    <button
                      onClick={() =>
                        watchTrailer(movie.id)
                      }
                      className="
                        px-5 py-3
                        rounded-2xl
                        bg-red-500
                        font-bold
                        flex items-center gap-2
                      "
                    >
                      <FaPlay />

                      Trailer
                    </button>

                  </div>

                </div>

                {/* INFO */}

                <div className="p-4">

                  <h3 className="font-bold text-sm md:text-lg line-clamp-1">
                    {movie.title}
                  </h3>

                  <div className="flex items-center justify-between mt-3">

                    <p className="text-gray-400 text-xs md:text-sm">
                      {movie.release_date?.slice(0, 4)}
                    </p>

                    <div className="flex items-center gap-2 text-yellow-400 text-xs md:text-sm">

                      <FaStar />

                      <span>
                        {movie.vote_average?.toFixed(1)}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </section>

      </div>

    </div>

  );
}

export default Movies;
```
