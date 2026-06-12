// src/pages/Movies.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  FaTrashAlt,
  FaHistory,
  FaEllipsisV, // 💡 Imported 3-dot utility icon
} from "react-icons/fa";

import YouTube from "react-youtube";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMG = "https://image.tmdb.org/t/p/original";

export default function Movies() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [watchedHistory, setWatchedHistory] = useState([]); 
  
  const [hasTrackedCurrent, setHasTrackedCurrent] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

  const [activeViewFilter, setActiveViewFilter] = useState("all");

  useEffect(() => {
    loadMovies();
    const savedWatchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
    setWatchlist(savedWatchlist);

    const savedHistory = JSON.parse(localStorage.getItem("watched_history")) || [];
    setWatchedHistory(savedHistory);

    if (location.state && location.state.filter) {
      setActiveViewFilter(location.state.filter);
      
      setTimeout(() => {
        window.scrollTo({
          top: 850,
          behavior: "smooth",
        });
      }, 500);
    }
  }, [location.state]);

  const fetchMovies = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (networkError) {
      console.warn("Individual channel fetch blocked or offline:", networkError.message);
      return [];
    }
  };

  const loadMovies = async () => {
    try {
      const trendingData = await fetchMovies(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
      const topRatedData = await fetchMovies(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`);
      const actionData = await fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28`);
      const sciFiData = await fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=878`);
      const horrorData = await fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=27`);
      const romanceData = await fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=10749`);

      setTrending(trendingData);
      setTopRated(topRatedData);
      setActionMovies(actionData);
      setSciFiMovies(sciFiData);
      setHorrorMovies(horrorData);
      setRomanceMovies(romanceData);

      const localHistory = JSON.parse(localStorage.getItem("watched_history")) || [];
      if (localHistory.length === 0 && trendingData?.length > 0) {
        const mockInitialHistory = trendingData.slice(0, 5);
        setWatchedHistory(mockInitialHistory);
        localStorage.setItem("watched_history", JSON.stringify(mockInitialHistory));
      }

      if (trendingData && trendingData.length > 0) {
        setHeroMovie(trendingData[0]);
      } else {
        setHeroMovie({
          id: "fallback",
          title: "Connection Offline",
          overview: "Unable to reach media matrix servers. Please verify your internet connection endpoints.",
          backdrop_path: ""
        });
      }
    } catch (err) {
      console.error("Critical TMDB pipeline initialization crash:", err);
    }
  };

  const searchMovies = async () => {
    if (!search.trim()) return;

    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${search}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setActiveViewFilter("all"); 

      setTimeout(() => {
        window.scrollTo({ top: 850, behavior: "smooth" });
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

  const openTrailer = async (movie) => {
    if (!movie || movie.id === "fallback") return;

    if (!auth.currentUser) {
      alert("🔒 Strict Security Guard: Cinematic playback is reserved for community accounts. Please log in with your email to watch trailers!");
      localStorage.setItem("auth_redirect_target", "/movies"); 
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`);
      const data = await res.json();
      const trailer = data.results?.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));

      if (trailer) {
        setHasTrackedCurrent(false); 
        setActiveTrailerMovie(movie); 
        setTrailerKey(trailer.key);
      } else {
        alert("Trailer video stream signature not found");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const addToWatchlist = async (movie) => {
    if (!auth.currentUser) {
      alert("🔒 Authentication Required: Please log in to create or modify your custom Watchlist.");
      localStorage.setItem("auth_redirect_target", "/movies"); 
      navigate("/login");
      return;
    }

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
        await updateDoc(doc(db, "users", user.uid), {
          watchlistCount: increment(1),
          sessionLogs: arrayUnion({
            text: `Added "${movie.title}" to Watchlist`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "WATCHLIST"
          })
        });
      }
    } catch (error) {
      console.error("Firestore watchlist sync failed:", error);
    }

    alert("Added to watchlist");
  };

  const removeFromWatchlist = async (e, movie) => {
    e.stopPropagation(); 
    if (!auth.currentUser) return;

    const updated = watchlist.filter((m) => m.id !== movie.id);
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));

    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), {
        watchlistCount: increment(-1),
        sessionLogs: arrayUnion({
          text: `Removed "${movie.title}" from Watchlist`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "WATCHLIST_REMOVE"
        })
      });
      alert("Removed from watchlist 🗑️");
    } catch (error) {
      console.error("Firestore sync clear routine crash:", error);
    }
  };

  const removeFromHistoryLog = async (e, movie) => {
    e.stopPropagation();
    if (!auth.currentUser) return;

    const updated = watchedHistory.filter((m) => m.id !== movie.id);
    setWatchedHistory(updated);
    localStorage.setItem("watched_history", JSON.stringify(updated));

    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), {
        watchedCount: increment(-1),
        sessionLogs: arrayUnion({
          text: `Purged "${movie.title}" from screening logs`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "HISTORY_PURGE"
        })
      });
      alert("Purged from watched history 🧼");
    } catch (error) {
      console.error("Firestore history optimization routine failed:", error);
    }
  };

  const markAsWatched = async (movie) => {
    if (hasTrackedCurrent) return;
    setHasTrackedCurrent(true);

    const historyLog = JSON.parse(localStorage.getItem("watched_history")) || [];
    if (!historyLog.find(m => m.id === movie.id)) {
      const updatedHistory = [movie, ...historyLog].slice(0, 10);
      setWatchedHistory(updatedHistory);
      localStorage.setItem("watched_history", JSON.stringify(updatedHistory));
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      let primaryGenreField = "genre_other";
      if (movie.genre_ids?.includes(878)) primaryGenreField = "genre_scifi";
      else if (movie.genre_ids?.includes(28)) primaryGenreField = "genre_action";
      else if (movie.genre_ids?.includes(53)) primaryGenreField = "genre_thriller";

      await updateDoc(doc(db, "users", user.uid), {
        watchedCount: increment(1),
        watchHours: increment(2), 
        [primaryGenreField]: increment(1), 
        sessionLogs: arrayUnion({
          text: `Watched trailer for "${movie.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "SCREENING"
        })
      });
    } catch (error) {
      console.error("Firestore tracking stream crash:", error);
    }
  };

  const MovieRow = ({ title, icon, movies, isGatedDeleteView = null }) => {
    const rowRef = useRef();
    if (!movies || movies.length === 0) return null;

    return (
      <div className="relative mb-24 group">
        <div className="flex items-center justify-between px-12 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-red-500 text-4xl">{icon}</span>
            <h2 className="text-5xl font-black">{title}</h2>
          </div>
        </div>

        <button onClick={() => rowRef.current.scrollBy({ left: -900, behavior: "smooth" })} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 flex items-center justify-center text-white"><FaChevronLeft className="mx-auto" /></button>
        <button onClick={() => rowRef.current.scrollBy({ left: 900, behavior: "smooth" })} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 flex items-center justify-center text-white"><FaChevronRight className="mx-auto" /></button>

        <div ref={rowRef} className="flex gap-5 overflow-x-auto scrollbar-hide px-12 scroll-smooth">
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              className="group/card relative min-w-[330px] h-[190px] rounded-[28px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-110 hover:z-40 hover:shadow-[0_0_45px_rgba(255,0,100,0.5)] bg-zinc-900"
            >
              {movie.backdrop_path ? (
                <img src={`${IMG}${movie.backdrop_path}`} alt={movie.title} className="w-full h-full object-cover transition-all duration-700 group-hover/card:scale-125" />
              ) : (
                <div className="w-full h-full bg-[#121218] flex items-center justify-center text-white/20 text-xs font-mono">NO IMAGE</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

              {/* Top Layout Controls Row */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
                <div className="px-4 py-2 rounded-full bg-yellow-500 text-black font-bold flex items-center gap-2 text-sm shadow-md">
                  <FaStar /> {movie.vote_average?.toFixed(1) || "0.0"}
                </div>

                {/* ── NEW FEATURE: 3-DOT INTERACTIVE MORE INFO CHIP TRIGGER ── */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Block default bubble layers
                    setSelectedMovie(movie); // Instantly dispatch standard information modal
                  }}
                  className="w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500 transition-all duration-300 shadow-lg active:scale-90"
                  title="More Info"
                >
                  <FaEllipsisV className="text-xs" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-5">
                <h3 className="text-2xl font-bold mb-2 line-clamp-1">{movie.title}</h3>
                <p className="text-white/60 text-sm">{movie.release_date?.split("-")[0] || "Unknown"}</p>
              </div>

              {/* Hover Actions Drawer Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500 bg-black/70 flex flex-col justify-end p-5">
                <div className="flex gap-3">
                  <button onClick={(e) => { e.stopPropagation(); openTrailer(movie); }} className="flex-1 py-3 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 text-sm"><FaPlay /> Watch Trailer</button>
                  
                  {isGatedDeleteView === "watchlist" ? (
                    <button onClick={(e) => removeFromWatchlist(e, movie)} className="w-14 rounded-2xl bg-red-600/30 border border-red-500/30 flex items-center justify-center transition-all hover:bg-red-600 text-white" title="Remove from watchlist"><FaTrashAlt /></button>
                  ) : isGatedDeleteView === "watched" ? (
                    <button onClick={(e) => removeFromHistoryLog(e, movie)} className="w-14 rounded-2xl bg-red-600/30 border border-red-500/30 flex items-center justify-center transition-all hover:bg-red-600 text-white" title="Wipe from history log"><FaTrashAlt /></button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); addToWatchlist(movie); }} className="w-14 rounded-2xl bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all hover:bg-red-500 text-white"><FaPlus /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden font-sans">
      
      {heroMovie && (
        <div className="relative h-screen">
          {heroMovie.backdrop_path ? (
            <img src={`${IMG}${heroMovie.backdrop_path}`} alt={heroMovie.title} className="absolute inset-0 w-full h-full object-cover" />
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
                <h1 onClick={() => { setActiveViewFilter("all"); navigate("/movies"); }} className="text-4xl font-black text-red-500 cursor-pointer hover:text-pink-400 transition-all duration-300">MovieMind AI</h1>
                <div className="hidden md:flex items-center gap-10 text-lg font-semibold">
                  <button onClick={() => { setActiveViewFilter("all"); navigate("/"); }} className="hover:text-red-400 transition-all">Home</button>
                  <button onClick={() => { setActiveViewFilter("all"); navigate("/movies"); }} className="hover:text-red-400 transition-all">Movies</button>
                  <button onClick={() => { setActiveViewFilter("all"); window.scrollTo({ top: 900, behavior: "smooth" }); }} className="hover:text-red-400 transition-all">Trending</button>
                  <button
                    onClick={() => {
                      if (!auth.currentUser) {
                        alert("🔒 Please log in to view your Watchlist.");
                        localStorage.setItem("auth_redirect_target", "/movies");
                        navigate("/login");
                      } else if (watchlist.length === 0) {
                        alert("Watchlist is empty");
                      } else {
                        setSearchResults(watchlist);
                        setActiveViewFilter("watchlist");
                        window.scrollTo({ top: 900, behavior: "smooth" });
                      }
                    }}
                    className={`transition-all ${activeViewFilter === "watchlist" ? "text-red-500" : "hover:text-red-400"}`}
                  >
                    Watchlist
                  </button>
                  
                  <button
                    onClick={() => {
                      if (!auth.currentUser) {
                        alert("🔒 Please log in to view your Watch History.");
                        localStorage.setItem("auth_redirect_target", "/movies");
                        navigate("/login");
                      } else {
                        setActiveViewFilter("watched");
                        window.scrollTo({ top: 900, behavior: "smooth" });
                      }
                    }}
                    className={`transition-all flex items-center gap-2 ${activeViewFilter === "watched" ? "text-red-500" : "hover:text-red-400"}`}
                  >
                    <FaHistory className="text-sm" /> History
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`overflow-hidden transition-all duration-500 ${search ? "w-[260px]" : "w-0"}`}>
                    <div className="relative">
                      <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyPress} placeholder="Search movies..." className="w-[260px] pl-14 pr-5 py-3.5 rounded-2xl bg-white/10 border border-white/10 outline-none text-sm focus:border-red-500 text-white" />
                    </div>
                  </div>
                  <button onClick={() => { if (!search) { setSearch(" "); return; } searchMovies(); }} className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 font-bold hover:scale-105 text-sm">Search</button>
                </div>
                <button onClick={() => navigate("/")} className="px-6 py-3.5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 hover:scale-105 text-sm font-semibold whitespace-nowrap">Back</button>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center h-full px-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/20 border border-red-500/20 backdrop-blur-xl mb-6 text-sm font-semibold text-red-400">🔥 #1 Trending Worldwide</div>
              <h1 className="text-6xl md:text-7xl font-black leading-tight mb-6">{heroMovie.title}</h1>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 line-clamp-3">{heroMovie.overview}</p>
              <div className="flex gap-5">
                <button onClick={() => openTrailer(heroMovie)} className="px-10 py-4 rounded-2xl bg-white text-black text-xl font-bold flex items-center gap-3 hover:scale-105 shadow-xl"><FaPlay /> Watch Trailer</button>
                <button onClick={() => setSelectedMovie(heroMovie)} className="px-10 py-4 rounded-2xl bg-white/10 border border-white/10 text-xl font-bold hover:bg-white/20 hover:scale-105">More Info</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lists */}
      <div className="relative z-20 -mt-20 pb-32">
        
        {searchResults.length > 0 && activeViewFilter === "all" && (
          <div className="-mt-16 mb-16">
            <MovieRow title="Search Results" icon={<FaSearch />} movies={searchResults} />
          </div>
        )}

        {/* Watchlist Filter */}
        {activeViewFilter === "watchlist" && (
          <div className="pt-24 min-h-[50vh]">
            <MovieRow title="Your Watchlist Collection" icon={"📦"} movies={watchlist} isGatedDeleteView="watchlist" />
            {watchlist.length === 0 && (
              <p className="text-neutral-500 text-sm font-mono text-center py-20 uppercase tracking-widest">Your Watchlist is empty.</p>
            )}
          </div>
        )}

        {/* Watched History Filter */}
        {activeViewFilter === "watched" && (
          <div className="pt-24 min-h-[50vh]">
            <MovieRow title="Your Watched Movie History" icon={"👁️"} movies={watchedHistory} isGatedDeleteView="watched" />
            {watchedHistory.length === 0 && (
              <p className="text-neutral-500 text-sm font-mono text-center py-20 uppercase tracking-widest">Your streaming history is empty.</p>
            )}
          </div>
        )}

        {/* Default View */}
        {activeViewFilter === "all" && (
          <>
            <MovieRow title="Trending Now" icon={<FaFire />} movies={trending} />
            <MovieRow title="Top Rated" icon={<FaCrown />} movies={topRated} />
            <MovieRow title="Action Movies" icon={"🎬"} movies={actionMovies} />
            <MovieRow title="Sci-Fi Movies" icon={"🚀"} movies={sciFiMovies} />
            <MovieRow title="Horror Movies" icon={"👻"} movies={horrorMovies} />
            <MovieRow title="Romance Movies" icon={"❤️"} movies={romanceMovies} />
          </>
        )}
      </div>

      {/* ── SELECTION MODAL ── */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10">
          <div className="relative w-full max-w-6xl rounded-[40px] overflow-hidden bg-[#0c0c12] border border-white/10 shadow-2xl">
            <button onClick={() => setSelectedMovie(null)} className="absolute top-6 right-6 z-30 w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-2xl hover:bg-red-500 hover:rotate-90 text-white"><FaTimes /></button>
            <div className="relative h-[600px]">
              {selectedMovie.backdrop_path ? <img src={`${IMG}${selectedMovie.backdrop_path}`} alt={selectedMovie.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#0c0c12]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-transparent to-transparent"></div>
              <div className="absolute bottom-12 left-12 max-w-4xl z-10">
                <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">{selectedMovie.title}</h1>
                <div className="flex items-center gap-6 mb-4 text-sm font-semibold">
                  <span className="text-emerald-400 text-xl font-bold">{selectedMovie.vote_average?.toFixed(1) || "0.0"} Rating</span>
                  <span className="text-white/50 text-lg">{selectedMovie.release_date || "Unknown date"}</span>
                </div>
                <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8 line-clamp-3">{selectedMovie.overview}</p>
                <div className="flex gap-4">
                  <button onClick={() => openTrailer(selectedMovie)} className="px-8 py-4 rounded-xl bg-white text-black font-bold text-lg flex items-center gap-2 hover:scale-105 shadow-lg"><FaPlay /> Watch Trailer</button>
                  <button onClick={() => addToWatchlist(selectedMovie)} className="px-8 py-4 rounded-xl bg-red-500/20 border border-red-500/20 text-lg font-bold text-white hover:bg-red-500">+ Watchlist</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TRAILER MODAL ── */}
      {trailerKey && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 transition-all duration-300">
          <button onClick={() => { setTrailerKey(""); setActiveTrailerMovie(null); }} className="absolute top-8 right-8 z-50 w-14 h-14 rounded-full bg-black/60 border border-white/10 text-2xl flex items-center justify-center hover:bg-red-500 hover:rotate-90 text-white"><FaTimes /></button>
          <div className="w-[85vw] h-[80vh] rounded-[32px] overflow-hidden border border-white/10 bg-black relative z-10 shadow-[0_0_80px_rgba(244,63,94,0.25)]">
            <YouTube videoId={trailerKey} opts={{ width: "100%", height: "100%", playerVars: { autoplay: 1, modestbranding: 1, rel: 0, origin: window.location.origin } }} className="w-full h-full" onPlay={() => activeTrailerMovie && markAsWatched(activeTrailerMovie)} onEnd={() => { if (activeTrailerMovie) { markAsWatched(activeTrailerMovie); setTrailerKey(""); setActiveTrailerMovie(null); } }} />
          </div>
        </div>
      )}

    </div>
  );
}