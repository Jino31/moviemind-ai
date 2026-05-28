// src/pages/Movies.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaPlay,
  FaPlus,
  FaSearch,
  FaStar,
  FaTimes,
  FaFire,
  FaCrown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import YouTube from "react-youtube";

const IMG = "https://image.tmdb.org/t/p/original";

// ✅ YOUR BACKEND URL
const API = "https://moviemind-backend-mhvz.onrender.com/api/movies";

export default function Movies() {
  const navigate = useNavigate();

  const [heroMovie, setHeroMovie] = useState(null);

  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [romanceMovies, setRomanceMovies] = useState([]);

  const [selectedMovie, setSelectedMovie] = useState(null);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [trailerKey, setTrailerKey] = useState("");

  const [watchlist, setWatchlist] = useState([]);

  // ============================================
  // FETCH DATA
  // ============================================

  useEffect(() => {
    loadMovies();

    const saved =
      JSON.parse(localStorage.getItem("watchlist")) || [];

    setWatchlist(saved);
  }, []);

  const fetchMovies = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  };

  const loadMovies = async () => {
    try {
      // ✅ BACKEND API CALLS

      const trendingData = await fetchMovies(
        `${API}/trending`
      );

      const topRatedData = await fetchMovies(
        `${API}/top-rated`
      );

      const actionData = await fetchMovies(
        `${API}/action`
      );

      const sciFiData = await fetchMovies(
        `${API}/scifi`
      );

      const horrorData = await fetchMovies(
        `${API}/horror`
      );

      const romanceData = await fetchMovies(
        `${API}/romance`
      );

      setTrending(trendingData);
      setTopRated(topRatedData);
      setActionMovies(actionData);
      setSciFiMovies(sciFiData);
      setHorrorMovies(horrorData);
      setRomanceMovies(romanceData);

      setHeroMovie(trendingData[0]);

    } catch (err) {
      console.log(err);
    }
  };

  // ============================================
  // SEARCH
  // ============================================

  const searchMovies = async () => {
    if (!search.trim()) return;

    try {

      const res = await fetch(
        `${API}/search/${search}`
      );

      const data = await res.json();

      setSearchResults(data.results || []);

      window.scrollTo({
        top: 850,
        behavior: "smooth",
      });

    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchMovies();
    }
  };

  // ============================================
  // TRAILER
  // ============================================

  const openTrailer = async (movieId) => {
    try {

      const res = await fetch(
        `${API}/trailer/${movieId}`
      );

      const data = await res.json();

      if (data.key) {
        setTrailerKey(data.key);
      } else {
        alert("Trailer not available");
      }

    } catch (err) {
      console.log(err);
    }
  };

  // ============================================
  // WATCHLIST
  // ============================================

  const addToWatchlist = (movie) => {

    const exists = watchlist.find(
      (m) => m.id === movie.id
    );

    if (exists) {
      alert("Already in watchlist");
      return;
    }

    const updated = [...watchlist, movie];

    setWatchlist(updated);

    localStorage.setItem(
      "watchlist",
      JSON.stringify(updated)
    );

    alert("Added to watchlist");
  };

  // ============================================
  // MOVIE ROW
  // ============================================

  const MovieRow = ({ title, icon, movies }) => {

    const rowRef = useRef();

    const scrollLeft = () => {
      rowRef.current.scrollBy({
        left: -900,
        behavior: "smooth",
      });
    };

    const scrollRight = () => {
      rowRef.current.scrollBy({
        left: 900,
        behavior: "smooth",
      });
    };

    return (
      <div className="relative mb-24 group">

        <div className="flex items-center justify-between px-12 mb-8">

          <div className="flex items-center gap-4">

            <span className="text-red-500 text-4xl">
              {icon}
            </span>

            <h2 className="text-5xl font-black">
              {title}
            </h2>

          </div>

        </div>

        {/* LEFT */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70"
        >
          <FaChevronLeft className="mx-auto" />
        </button>

        {/* RIGHT */}
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70"
        >
          <FaChevronRight className="mx-auto" />
        </button>

        <div
          ref={rowRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide px-12 scroll-smooth"
        >

          {movies.map((movie) => (

            <div
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="relative min-w-[330px] h-[190px] rounded-[28px] overflow-hidden cursor-pointer"
            >

              <img
                src={`${IMG}${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-yellow-500 text-black font-bold flex items-center gap-2">
                <FaStar />
                {movie.vote_average?.toFixed(1)}
              </div>

              <div className="absolute bottom-0 left-0 w-full p-5">

                <h3 className="text-2xl font-bold mb-2 line-clamp-1">
                  {movie.title}
                </h3>

                <p className="text-white/60">
                  {movie.release_date?.split("-")[0]}
                </p>

              </div>

            </div>

          ))}

        </div>

      </div>
    );
  };

  return (
    <div className="bg-black text-white min-h-screen">

      {/* HERO */}
      {heroMovie && (

        <div className="relative h-screen">

          <img
            src={`${IMG}${heroMovie.backdrop_path}`}
            alt={heroMovie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/60"></div>

          {/* CONTENT */}
          <div className="relative z-10 flex items-center h-full px-14">

            <div className="max-w-3xl">

              <h1 className="text-8xl font-black leading-tight mb-8">
                {heroMovie.title}
              </h1>

              <p className="text-2xl text-white/70 leading-relaxed mb-12">
                {heroMovie.overview}
              </p>

              <div className="flex gap-5">

                <button
                  onClick={() =>
                    openTrailer(heroMovie.id)
                  }
                  className="px-12 py-5 rounded-2xl bg-white text-black text-2xl font-bold flex items-center gap-3"
                >
                  <FaPlay />
                  Play
                </button>

                <button
                  onClick={() =>
                    setSelectedMovie(heroMovie)
                  }
                  className="px-12 py-5 rounded-2xl bg-white/10 border border-white/10 text-2xl"
                >
                  More Info
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* SEARCH BAR */}
      <div className="flex items-center gap-4 px-12 py-10">

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={handleKeyPress}
          placeholder="Search movies..."
          className="flex-1 px-6 py-4 rounded-2xl bg-[#111] border border-white/10 outline-none"
        />

        <button
          onClick={searchMovies}
          className="px-8 py-4 rounded-2xl bg-red-600 font-bold"
        >
          Search
        </button>

      </div>

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (

        <MovieRow
          title="Search Results"
          icon={<FaSearch />}
          movies={searchResults}
        />

      )}

      {/* MOVIE ROWS */}
      <div className="pb-32">

        <MovieRow
          title="Trending Now"
          icon={<FaFire />}
          movies={trending}
        />

        <MovieRow
          title="Top Rated"
          icon={<FaCrown />}
          movies={topRated}
        />

      </div>

    </div>
  );
}