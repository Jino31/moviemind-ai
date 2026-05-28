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
  FaHeart,
  FaCrown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import YouTube from "react-youtube";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const IMG = "https://image.tmdb.org/t/p/original";

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
      const trendingData = await fetchMovies(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
      );

      const topRatedData = await fetchMovies(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`
      );

      const actionData = await fetchMovies(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28`
      );

      const sciFiData = await fetchMovies(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=878`
      );

      const horrorData = await fetchMovies(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=27`
      );

      const romanceData = await fetchMovies(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=10749`
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
  `https://moviemind-backend-mhvz.onrender.com/api/movies/search/${search}`
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
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`
      );

      const data = await res.json();

      const trailer = data.results.find(
        (video) =>
          video.site === "YouTube" &&
          (video.type === "Trailer" ||
            video.type === "Teaser")
      );

      if (trailer) {
        setTrailerKey(trailer.key);
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
  // NETFLIX ROW
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

        {/* TITLE */}
        <div className="flex items-center justify-between px-12 mb-8">

          <div className="flex items-center gap-4">

            <span className="text-red-500 text-4xl">
              {icon}
            </span>

            <h2 className="text-5xl font-black">
              {title}
            </h2>

          </div>

          <button className="text-pink-400 text-lg hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(255,0,100,0.9)]">
            View All →
          </button>

        </div>

        {/* LEFT */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_25px_rgba(255,0,90,1)]"
        >
          <FaChevronLeft className="mx-auto" />
        </button>

        {/* RIGHT */}
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_25px_rgba(255,0,90,1)]"
        >
          <FaChevronRight className="mx-auto" />
        </button>

        {/* ROW */}
        <div
          ref={rowRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide px-12 scroll-smooth"
        >

          {movies.map((movie) => (

            <div
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="group/card relative min-w-[330px] h-[190px] rounded-[28px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-110 hover:z-40 hover:shadow-[0_0_45px_rgba(255,0,100,0.5)]"
            >

              {/* IMAGE */}
              <img
                src={`${IMG}${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover transition-all duration-700 group-hover/card:scale-125"
              />

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

              {/* RATING */}
              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-yellow-500 text-black font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.7)]">
                <FaStar />
                {movie.vote_average?.toFixed(1)}
              </div>

              {/* TEXT */}
              <div className="absolute bottom-0 left-0 w-full p-5">

                <h3 className="text-2xl font-bold mb-2 line-clamp-1">
                  {movie.title}
                </h3>

                <p className="text-white/60">
                  {movie.release_date?.split("-")[0]}
                </p>

              </div>

              {/* HOVER */}
              <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500 bg-black/70 flex flex-col justify-end p-5">

                <div className="flex gap-3">

                  {/* PLAY */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTrailer(movie.id);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.9)] active:scale-95"
                  >
                    <FaPlay />
                    Play
                  </button>

                  {/* WATCHLIST */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWatchlist(movie);
                    }}
                    className="w-14 rounded-2xl bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_25px_rgba(255,0,100,1)] active:scale-95"
                  >
                    <FaPlus />
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
    );
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">

      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}

      {heroMovie && (
        <div className="relative h-screen">

          {/* IMAGE */}
          <img
            src={`${IMG}${heroMovie.backdrop_path}`}
            alt={heroMovie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* OVERLAYS */}
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>

          {/* NAVBAR */}
          <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/20 border-b border-white/5">

            <div className="flex items-center justify-between px-10 py-6">

              {/* LEFT */}
              <div className="flex items-center gap-14">

                <h1
                  onClick={() => navigate("/")}
                  className="text-6xl font-black text-red-500 cursor-pointer hover:text-pink-400 transition-all duration-300 hover:drop-shadow-[0_0_18px_rgba(255,0,100,1)]"
                >
                  MovieMind AI
                </h1>

                <div className="hidden md:flex items-center gap-10 text-xl">

                  {/* HOME */}
                  <button
                    onClick={() => navigate("/")}
                    className="hover:text-red-400 transition-all duration-300 hover:drop-shadow-[0_0_15px_rgba(255,0,100,1)]"
                  >
                    Home
                  </button>

                  {/* MOVIES */}
                  <button
                    onClick={() => navigate("/movies")}
                    className="hover:text-red-400 transition-all duration-300 hover:drop-shadow-[0_0_15px_rgba(255,0,100,1)]"
                  >
                    Movies
                  </button>

                  {/* TRENDING */}
                  <button
                    onClick={() =>
                      window.scrollTo({
                        top: 900,
                        behavior: "smooth",
                      })
                    }
                    className="hover:text-red-400 transition-all duration-300 hover:drop-shadow-[0_0_15px_rgba(255,0,100,1)]"
                  >
                    Trending
                  </button>

                  {/* WATCHLIST */}
                  <button
                    onClick={() => {
                      if (watchlist.length === 0) {
                        alert("Watchlist is empty");
                      } else {
                        setSearchResults(watchlist);

                        window.scrollTo({
                          top: 900,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="hover:text-red-400 transition-all duration-300 hover:drop-shadow-[0_0_15px_rgba(255,0,100,1)]"
                  >
                    Watchlist
                  </button>

                </div>

              </div>

          {/* RIGHT */}
<div className="flex items-center gap-4">

  {/* EXPAND SEARCH */}
  <div className="flex items-center gap-3">

    {/* SEARCH INPUT */}
    <div
      className={`
        overflow-hidden
        transition-all
        duration-500
        ${search ? "w-[260px]" : "w-0"}
      `}
    >

      <div className="relative">

        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={handleKeyPress}
          placeholder="Search movies..."
          className="
            w-[260px]
            pl-14
            pr-5
            py-4
            rounded-2xl
            bg-white/10
            backdrop-blur-xl
            border
            border-white/10
            outline-none
            focus:border-red-500
            transition-all
            duration-300
          "
        />

      </div>

    </div>

    {/* RED BUTTON */}
    <button
      onClick={() => {
        if (!search) {
          setSearch(" ");
          return;
        }

        searchMovies();
      }}
      className="
        px-8
        py-4
        rounded-2xl
        bg-gradient-to-r
        from-red-500
        to-pink-500
        font-bold
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-[0_0_35px_rgba(255,0,100,0.9)]
        active:scale-95
      "
    >
      Search
    </button>

  </div>

                {/* BACK BTN */}
                <button
                  onClick={() => navigate("/")}
                  className="px-8 py-4 rounded-2xl bg-white/10 border border-white/10 relative overflow-hidden transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.55)] active:scale-95"
                >
                  Back
                </button>

              </div>

            </div>

          </div>

          {/* HERO CONTENT */}
          <div className="relative z-10 flex items-center h-full px-14">

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border border-red-500/20 backdrop-blur-xl mb-8">
                🔥 #1 Trending Worldwide
              </div>

              <h1 className="text-8xl font-black leading-tight mb-8">
                {heroMovie.title}
              </h1>

              <p className="text-2xl text-white/70 leading-relaxed mb-12">
                {heroMovie.overview}
              </p>

              <div className="flex gap-5">

                {/* PLAY */}
                <button
                  onClick={() =>
                    openTrailer(heroMovie.id)
                  }
                  className="px-12 py-5 rounded-2xl bg-white text-black text-2xl font-bold flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.95)] active:scale-95"
                >
                  <FaPlay />
                  Play
                </button>

                {/* MORE INFO */}
                <button
                  onClick={() =>
                    setSelectedMovie(heroMovie)
                  }
                  className="px-12 py-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95"
                >
                  More Info
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <div className="-mt-16 relative z-20">

          <MovieRow
            title="Search Results"
            icon={<FaSearch />}
            movies={searchResults}
          />

        </div>
      )}

      {/* ROWS */}
      <div className="relative z-20 -mt-20 pb-32">

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

        <MovieRow
          title="Action Movies"
          icon={"🎬"}
          movies={actionMovies}
        />

        <MovieRow
          title="Sci-Fi Movies"
          icon={"🚀"}
          movies={sciFiMovies}
        />

        <MovieRow
          title="Horror Movies"
          icon={"👻"}
          movies={horrorMovies}
        />

        <MovieRow
          title="Romance Movies"
          icon={"❤️"}
          movies={romanceMovies}
        />

      </div>

      {/* ============================================ */}
      {/* MOVIE MODAL */}
      {/* ============================================ */}

      {selectedMovie && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10">

          <div className="relative w-full max-w-7xl rounded-[40px] overflow-hidden bg-[#111] border border-white/10 shadow-[0_0_60px_rgba(255,0,100,0.35)]">

            {/* CLOSE */}
            <button
              onClick={() =>
                setSelectedMovie(null)
              }
              className="absolute top-6 right-6 z-30 w-16 h-16 rounded-full bg-black/60 flex items-center justify-center text-3xl transition-all duration-300 hover:bg-red-500 hover:rotate-90 hover:shadow-[0_0_25px_rgba(255,0,100,1)]"
            >
              <FaTimes />
            </button>

            {/* IMAGE */}
            <div className="relative h-[700px]">

              <img
                src={`${IMG}${selectedMovie.backdrop_path}`}
                alt={selectedMovie.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>

              {/* CONTENT */}
              <div className="absolute bottom-12 left-12 max-w-4xl">

                <h1 className="text-7xl font-black mb-6">
                  {selectedMovie.title}
                </h1>

                <div className="flex items-center gap-6 mb-6">

                  <span className="text-green-400 text-2xl font-bold">
                    {selectedMovie.vote_average?.toFixed(1)} Match
                  </span>

                  <span className="text-white/60 text-xl">
                    {selectedMovie.release_date}
                  </span>

                </div>

                <p className="text-2xl text-white/70 leading-relaxed mb-10">
                  {selectedMovie.overview}
                </p>

                <div className="flex gap-5">

                  {/* TRAILER */}
                  <button
                    onClick={() =>
                      openTrailer(selectedMovie.id)
                    }
                    className="px-12 py-5 rounded-2xl bg-white text-black font-bold text-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] active:scale-95"
                  >
                    <FaPlay />
                    Play Trailer
                  </button>

                  {/* WATCHLIST */}
                  <button
                    onClick={() =>
                      addToWatchlist(selectedMovie)
                    }
                    className="px-12 py-5 rounded-2xl bg-red-500/20 border border-red-500/20 text-2xl transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_35px_rgba(255,0,100,1)] active:scale-95"
                  >
                    + Watchlist
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ============================================ */}
      {/* TRAILER MODAL */}
      {/* ============================================ */}

      {trailerKey && (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center">

          {/* CLOSE */}
          <button
            onClick={() => setTrailerKey("")}
            className="absolute top-8 right-8 z-50 w-16 h-16 rounded-full bg-white/10 text-3xl flex items-center justify-center transition-all duration-300 hover:bg-red-500 hover:rotate-90 hover:shadow-[0_0_25px_rgba(255,0,100,1)]"
          >
            <FaTimes />
          </button>

          {/* VIDEO */}
          <div className="w-[90vw] h-[85vh] rounded-[40px] overflow-hidden shadow-[0_0_60px_rgba(255,0,100,0.5)]">

            <YouTube
              videoId={trailerKey}
              opts={{
                width: "100%",
                height: "100%",
                playerVars: {
                  autoplay: 1,
                },
              }}
              className="w-full h-full"
            />

          </div>

        </div>
      )}

    </div>
  );
}