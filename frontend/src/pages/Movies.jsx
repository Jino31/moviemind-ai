// src/pages/Movies.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";

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
  
  // Guard lock to avoid duplicate event calls on ad-block fallbacks
  const [hasTrackedCurrent, setHasTrackedCurrent] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

  // ============================================
  // FETCH DATA WITH ERR_NAME_NOT_RESOLVED SAFEQUARDS
  // ============================================

  useEffect(() => {
    loadMovies();
    const saved = JSON.parse(localStorage.getItem("watchlist")) || [];
    setWatchlist(saved);
  }, []);

  const fetchMovies = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (networkError) {
      // Intercept DNS/Network drop crashes gracefully
      console.warn("Individual channel fetch blocked or offline:", networkError.message);
      return [];
    }
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

      if (trendingData && trendingData.length > 0) {
        setHeroMovie(trendingData[0]);
      } else {
        // Safe hardcoded offline hero fallback if system connection drops entirely
        setHeroMovie({
          id: "fallback",
          title: "Connection Offline",
          overview: "Unable to reach media matrix servers. Please verify your internet connection endpoints or clear your local DNS table configuration.",
          backdrop_path: ""
        });
      }
    } catch (err) {
      console.error("Critical TMDB pipeline initialization crash:", err);
    }
  };

  // ============================================
  // SEARCH
  // ============================================

  const searchMovies = async () => {
    if (!search.trim()) return;

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${search}`
      );
      const data = await res.json();
      setSearchResults(data.results || []);

      setTimeout(() => {
        window.scrollTo({
          top: 850,
          behavior: "smooth",
        });
      }, 300);

      if (!data.results || data.results.length === 0) {
        alert("No movies found");
      }
    } catch (err) {
      console.log(err);
      alert("Search failed. Check connection endpoints.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchMovies();
    }
  };

  // ============================================
  // TRAILER WINDOW
  // ============================================

  const openTrailer = async (movie) => {
    if (movie.id === "fallback") return;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`
      );
      const data = await res.json();

      const trailer = data.results?.find(
        (video) =>
          video.site === "YouTube" &&
          (video.type === "Trailer" || video.type === "Teaser")
      );

      if (trailer) {
        setHasTrackedCurrent(false); // Reset gate lock flag for next screening token
        setActiveTrailerMovie(movie); 
        setTrailerKey(trailer.key);
      } else {
        alert("Trailer video stream signature not found");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ============================================
  // WATCHLIST & AD-BLOCK BACKUP UPDATE LIFECYCLES
  // ============================================

  const addToWatchlist = async (movie) => {
    const exists = watchlist.find((m) => m.id === movie.id);

    if (exists) {
      alert("Already in watchlist");
      return;
    }

    const updated = [...watchlist, movie];
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));

    try {
      const user = auth.currentUser;
      if (user) {
        const newLogEntry = {
          text: `Added "${movie.title}" to Watchlist`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "WATCHLIST"
        };

        await updateDoc(doc(db, "users", user.uid), {
          watchlistCount: increment(1),
          sessionLogs: arrayUnion(newLogEntry)
        });
      }
    } catch (error) {
      console.error("Firestore watchlist sync failed:", error);
    }

    alert("Added to watchlist");
  };

  const markAsWatched = async (movie) => {
    if (hasTrackedCurrent) return;
    setHasTrackedCurrent(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Unpack categories maps explicitly matching Taste Radar keys
      let primaryGenreField = "genre_other";
      if (movie.genre_ids?.includes(878)) primaryGenreField = "genre_scifi";
      else if (movie.genre_ids?.includes(28)) primaryGenreField = "genre_action";
      else if (movie.genre_ids?.includes(53)) primaryGenreField = "genre_thriller";
      else if (movie.genre_ids?.includes(35)) primaryGenreField = "genre_comedy";
      else if (movie.genre_ids?.includes(18)) primaryGenreField = "genre_drama";
      else if (movie.genre_ids?.includes(12)) primaryGenreField = "genre_adventure";

      const newLogEntry = {
        text: `Watched trailer for "${movie.title}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "SCREENING"
      };

      await updateDoc(doc(db, "users", user.uid), {
        watchedCount: increment(1),
        watchHours: increment(2), 
        [primaryGenreField]: increment(1), 
        sessionLogs: arrayUnion(newLogEntry)
      });

      console.log(`🔊 Realtime Sync Complete: registered "${movie.title}" under ${primaryGenreField}`);
    } catch (error) {
      console.error("Firestore data stream allocation crash:", error);
    }
  };

  // ============================================
  // CAROUSEL DISPLAY ROW COMPONENT
  // ============================================

  const MovieRow = ({ title, icon, movies }) => {
    const rowRef = useRef();

    if (!movies || movies.length === 0) return null;

    return (
      <div className="relative mb-24 group">
        <div className="flex items-center justify-between px-12 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-red-500 text-4xl">{icon}</span>
            <h2 className="text-5xl font-black">{title}</h2>
          </div>
          <button className="text-pink-400 text-lg hover:text-white transition-all duration-300">
            View All →
          </button>
        </div>

        <button
          onClick={() => rowRef.current.scrollBy({ left: -900, behavior: "smooth" })}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 flex items-center justify-center text-white"
        >
          <FaChevronLeft className="mx-auto" />
        </button>

        <button
          onClick={() => rowRef.current.scrollBy({ left: 900, behavior: "smooth" })}
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 flex items-center justify-center text-white"
        >
          <FaChevronRight className="mx-auto" />
        </button>

        <div ref={rowRef} className="flex gap-5 overflow-x-auto scrollbar-hide px-12 scroll-smooth">
          {movies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="group/card relative min-w-[330px] h-[190px] rounded-[28px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-110 hover:z-40 hover:shadow-[0_0_45px_rgba(255,0,100,0.5)]"
            >
              {movie.backdrop_path ? (
                <img
                  src={`${IMG}${movie.backdrop_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover/card:scale-125"
                />
              ) : (
                <div className="w-full h-full bg-[#121218] flex items-center justify-center text-white/20 text-xs font-mono">NO IMAGE CONTAINER</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

              <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-yellow-500 text-black font-bold flex items-center gap-2 text-sm shadow-md">
                <FaStar /> {movie.vote_average?.toFixed(1) || "0.0"}
              </div>

              <div className="absolute bottom-0 left-0 w-full p-5">
                <h3 className="text-2xl font-bold mb-2 line-clamp-1">{movie.title}</h3>
                <p className="text-white/60 text-sm">{movie.release_date?.split("-")[0] || "Unknown"}</p>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500 bg-black/70 flex flex-col justify-end p-5">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openTrailer(movie);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-sm"
                  >
                    <FaPlay /> Play
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWatchlist(movie);
                    }}
                    className="w-14 rounded-2xl bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all hover:bg-red-500 active:scale-95 text-white"
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
      
      {heroMovie && (
        <div className="relative h-screen">
          {heroMovie.backdrop_path ? (
            <img
              src={`${IMG}${heroMovie.backdrop_path}`}
              alt={heroMovie.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#111122] to-black" />
          )}
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>

          {/* Navigation layout */}
          <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/20 border-b border-white/5">
            <div className="flex items-center justify-between px-10 py-6">
              <div className="flex items-center gap-14">
                <h1 onClick={() => navigate("/")} className="text-4xl font-black text-red-500 cursor-pointer hover:text-pink-400 transition-all duration-300">
                  MovieMind AI
                </h1>
                <div className="hidden md:flex items-center gap-10 text-lg font-semibold">
                  <button onClick={() => navigate("/")} className="hover:text-red-400 transition-all">Home</button>
                  <button onClick={() => navigate("/movies")} className="hover:text-red-400 transition-all">Movies</button>
                  <button onClick={() => window.scrollTo({ top: 900, behavior: "smooth" })} className="hover:text-red-400 transition-all">Trending</button>
                  <button
                    onClick={() => {
                      if (watchlist.length === 0) {
                        alert("Watchlist is empty");
                      } else {
                        setSearchResults(watchlist);
                        window.scrollTo({ top: 900, behavior: "smooth" });
                      }
                    }}
                    className="hover:text-red-400 transition-all"
                  >
                    Watchlist
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`overflow-hidden transition-all duration-500 ${search ? "w-[260px]" : "w-0"}`}>
                    <div className="relative">
                      <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Search movies..."
                        className="w-[260px] pl-14 pr-5 py-3.5 rounded-2xl bg-white/10 border border-white/10 outline-none text-sm focus:border-red-500 text-white"
                      />
                    </div>
                  </div>
                  <button onClick={() => { if (!search) { setSearch(" "); return; } searchMovies(); }} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 font-bold hover:scale-105 active:scale-95 text-sm">
                    Search
                  </button>
                </div>
                <button onClick={() => navigate("/performance")} className="px-6 py-3.5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-sm font-semibold">
                  Dashboard
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center h-full px-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border border-red-500/20 backdrop-blur-xl mb-6 text-sm font-semibold text-red-400">
                🔥 #1 Trending Worldwide
              </div>
              <h1 className="text-6xl md:text-7xl font-black leading-tight mb-6">{heroMovie.title}</h1>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 line-clamp-3">{heroMovie.overview}</p>
              <div className="flex gap-5">
                <button onClick={() => openTrailer(heroMovie)} className="px-10 py-4 rounded-2xl bg-white text-black text-xl font-bold flex items-center gap-3 hover:scale-105 active:scale-95 shadow-xl">
                  <FaPlay /> Play
                </button>
                <button onClick={() => setSelectedMovie(heroMovie)} className="px-10 py-4 rounded-2xl bg-white/10 border border-white/10 text-xl font-bold hover:bg-white/20 hover:scale-105 active:scale-95">
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="-mt-16 relative z-20">
          <MovieRow title="Search Results" icon={<FaSearch />} movies={searchResults} />
        </div>
      )}

      <div className="relative z-20 -mt-20 pb-32">
        <MovieRow title="Trending Now" icon={<FaFire />} movies={trending} />
        <MovieRow title="Top Rated" icon={<FaCrown />} movies={topRated} />
        <MovieRow title="Action Movies" icon={"🎬"} movies={actionMovies} />
        <MovieRow title="Sci-Fi Movies" icon={"🚀"} movies={sciFiMovies} />
        <MovieRow title="Horror Movies" icon={"👻"} movies={horrorMovies} />
        <MovieRow title="Romance Movies" icon={"❤️"} movies={romanceMovies} />
      </div>

      {/* ── SELECTION MODAL ── */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10">
          <div className="relative w-full max-w-6xl rounded-[40px] overflow-hidden bg-[#0c0c12] border border-white/10 shadow-2xl">
            <button onClick={() => setSelectedMovie(null)} className="absolute top-6 right-6 z-30 w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-2xl hover:bg-red-500 hover:rotate-90 transition-all text-white">
              <FaTimes />
            </button>

            <div className="relative h-[600px]">
              {selectedMovie.backdrop_path ? (
                <img src={`${IMG}${selectedMovie.backdrop_path}`} alt={selectedMovie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#0c0c12]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-transparent to-transparent"></div>

              <div className="absolute bottom-12 left-12 max-w-4xl z-10">
                <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">{selectedMovie.title}</h1>
                <div className="flex items-center gap-6 mb-4 text-sm font-semibold">
                  <span className="text-emerald-400 text-xl font-bold">{selectedMovie.vote_average?.toFixed(1) || "0.0"} Rating</span>
                  <span className="text-white/50 text-lg">{selectedMovie.release_date || "Unknown date"}</span>
                </div>
                <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8 line-clamp-3">{selectedMovie.overview}</p>
                
                <div className="flex gap-4">
                  <button onClick={() => openTrailer(selectedMovie)} className="px-8 py-4 rounded-xl bg-white text-black font-bold text-lg flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg">
                    <FaPlay /> Play Trailer
                  </button>
                  <button onClick={() => addToWatchlist(selectedMovie)} className="px-8 py-4 rounded-xl bg-red-500/20 border border-red-500/20 text-lg font-bold text-white hover:bg-red-500 active:scale-95">
                    + Watchlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMMERSIVE BACKLIGHTING TRAILER MODAL FRAME ── */}
      {trailerKey && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 transition-all duration-300">
          
          {/* Ambient Lighting Engine Layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-red-600/20 blur-[130px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[400px] bg-pink-600/20 blur-[130px] rounded-full animate-pulse" />
          </div>

          <button
            onClick={() => { setTrailerKey(""); setActiveTrailerMovie(null); }}
            className="absolute top-8 right-8 z-50 w-14 h-14 rounded-full bg-black/60 border border-white/10 text-2xl flex items-center justify-center hover:bg-red-500 hover:rotate-90 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all text-white"
          >
            <FaTimes />
          </button>

          <div className="w-[85vw] h-[80vh] rounded-[32px] overflow-hidden border border-white/10 bg-black relative z-10 shadow-[0_0_80px_rgba(244,63,94,0.25)]">
            <YouTube
              videoId={trailerKey}
              opts={{
                width: "100%",
                height: "100%",
                playerVars: { 
                  autoplay: 1,
                  modestbranding: 1,
                  rel: 0,
                  origin: window.location.origin
                },
              }}
              className="w-full h-full"
              
              // Ad blocker bypass fallback execution strategy 
              onPlay={() => {
                if (activeTrailerMovie) {
                  markAsWatched(activeTrailerMovie);
                }
              }}
              
              onEnd={() => {
                if (activeTrailerMovie) {
                  markAsWatched(activeTrailerMovie);
                  setTrailerKey("");
                  setActiveTrailerMovie(null);
                }
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}