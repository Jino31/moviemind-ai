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
  FaEllipsisV,
  FaHome,
  FaTv,
  FaRegCompass,
  FaUserCircle,
  FaArrowLeft
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
  
  // Navigation & Search Page Layout State Controllers
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);

  const [recentSearches, setRecentSearches] = useState([]);

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
          overview: "Unable to reach media servers.",
          backdrop_path: ""
        });
      }
    } catch (err) {
      console.error("Critical TMDB pipeline initialization crash:", err);
    }
  };

  const searchMovies = async (forcedQuery = null) => {
    const queryTarget = forcedQuery || search;
    if (!queryTarget.trim()) return;

    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${queryTarget}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setActiveViewFilter("all"); 

      if (isSearchPageOpen) {
        setTimeout(() => {
          window.scrollTo({ top: 480, behavior: "smooth" });
        }, 300);
      } else {
        setTimeout(() => {
          window.scrollTo({ top: 850, behavior: "smooth" });
        }, 300);
      }

      if (!forcedQuery && !recentSearches.includes(queryTarget.trim())) {
        setRecentSearches(prev => [queryTarget.trim(), ...prev.slice(0, 4)]);
      }

      if (!data.results || data.results.length === 0) {
        alert("No movies found matching current handle criteria.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeRecentSearchTag = (e, indexToRemove) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchMovies();
    }
  };

  const openTrailer = async (movie) => {
    if (!movie || movie.id === "fallback") return;

    if (!auth.currentUser) {
      alert("🔒 Please log in with your email to watch trailers!");
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
      alert("🔒 Please log in to manage your Watchlist.");
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

  const handleViewAllRoute = (title) => {
    if (title.includes("Watchlist")) {
      if (!auth.currentUser) {
        alert("🔒 Please log in to view your Watchlist.");
        return;
      }
      setSearchResults(watchlist);
      setActiveViewFilter("watchlist");
    } else if (title.includes("History")) {
      if (!auth.currentUser) {
        alert("🔒 Please log in to view your History.");
        return;
      }
      setActiveViewFilter("watched");
    } else {
      // Handles categorical updates cleanly inside view filters
      if (title.includes("Trending")) setSearchResults(trending);
      else if (title.includes("Top Rated")) setSearchResults(topRated);
      else if (title.includes("Action")) setSearchResults(actionMovies);
      else if (title.includes("Sci-Fi")) setSearchResults(sciFiMovies);
      else if (title.includes("Horror")) setSearchResults(horrorMovies);
      else if (title.includes("Romance")) setSearchResults(romanceMovies);
      
      setActiveViewFilter("category_expanded");
    }
    window.scrollTo({ top: 850, behavior: "smooth" });
  };

  const MovieRow = ({ title, icon, movies, isGatedDeleteView = null }) => {
    const rowRef = useRef();
    if (!movies || movies.length === 0) return null;

    return (
      <div className="relative mb-24 group">
        {title && (
          <div className="flex items-center justify-between px-16 md:px-24 mb-8">
            <div className="flex items-center gap-4">
              {icon && <span className="text-red-500 text-4xl">{icon}</span>}
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">{title}</h2>
            </div>
            <button 
              onClick={() => handleViewAllRoute(title)}
              className="flex items-center gap-1 text-white/60 font-semibold text-xl hover:text-white transition-colors duration-200"
            >
              View All <FaChevronRight className="text-sm mt-1" />
            </button>
          </div>
        )}

        {/* Dynamic sliding navigation arrows */}
        <button 
          onClick={() => rowRef.current.scrollBy({ left: -900, behavior: "smooth" })} 
          className="absolute left-20 top-1/2 z-50 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 flex items-center justify-center text-white shadow-xl"
        >
          <FaChevronLeft className="mx-auto" />
        </button>
        <button 
          onClick={() => rowRef.current.scrollBy({ left: 900, behavior: "smooth" })} 
          className="absolute right-6 top-1/2 z-50 -translate-y-1/2 w-14 h-14 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 flex items-center justify-center text-white shadow-xl"
        >
          <FaChevronRight className="mx-auto" />
        </button>

        <div ref={rowRef} className="flex gap-5 overflow-x-auto scrollbar-hide px-16 md:px-24 scroll-smooth">
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              onClick={() => movie.id !== "fallback" && navigate(`/movie/${movie.id}`)}
              className="group/card relative min-w-[300px] md:min-w-[330px] h-[190px] rounded-[28px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-110 hover:z-40 hover:shadow-[0_0_45px_rgba(239,68,68,0.4)] bg-zinc-950"
            >
              {movie.backdrop_path ? (
                <img src={`${IMG}${movie.backdrop_path}`} alt={movie.title} className="w-full h-full object-cover transition-all duration-700 group-hover/card:scale-125" />
              ) : (
                <div className="w-full h-full bg-[#121218] flex items-center justify-center text-white/20 text-xs font-mono">NO IMAGE</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
                <div className="px-4 py-2 rounded-full bg-yellow-500 text-black font-bold flex items-center gap-2 text-sm shadow-md">
                  <FaStar /> {movie.vote_average?.toFixed(1) || "0.0"}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setSelectedMovie(movie); 
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

              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/card:opacity-100 transition-all duration-500 flex flex-col justify-end p-5 z-20">
                <div className="flex gap-3">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      openTrailer(movie); 
                    }} 
                    className="flex-1 py-3 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 text-sm"
                  >
                    <FaPlay /> Watch Trailer
                  </button>
                  
                  {isGatedDeleteView === "watchlist" ? (
                    <button onClick={(e) => removeFromWatchlist(e, movie)} className="w-14 rounded-2xl bg-red-600/30 border border-red-500/30 flex items-center justify-center transition-all hover:bg-red-600 text-white" title="Remove from watchlist"><FaTrashAlt /></button>
                  ) : isGatedDeleteView === "watched" ? (
                    <button onClick={(e) => removeFromHistoryLog(e, movie)} className="w-14 rounded-2xl bg-red-600/30 border border-red-500/30 flex items-center justify-center transition-all hover:bg-red-600 text-white" title="Wipe from history log"><FaTrashAlt /></button>
                  ) : (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addToWatchlist(movie); 
                      }} 
                      className="w-14 rounded-2xl bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all hover:bg-red-500 text-white"
                    >
                      <FaPlus />
                    </button>
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
    <div className="bg-[#030305] text-white min-h-screen overflow-x-hidden font-sans relative">
      
      {/* ── 🧭 SCROLL-RESPONSIVE VERTICAL SIDEBAR ── */}
      <div 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`fixed top-0 left-0 h-full z-[9999] bg-[#06060a]/95 border-r border-white/[0.03] backdrop-blur-3xl flex flex-col items-start pt-8 pb-12 transition-all duration-300 ease-out select-none shadow-[10px_0_50px_rgba(0,0,0,0.6)] ${
          isSidebarExpanded ? "w-64 px-6" : "w-16 md:w-20 px-0 items-center"
        }`}
      >
        <div className={`mb-12 flex items-center gap-4 ${isSidebarExpanded ? "pl-2" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-300 font-bold text-sm shadow-xl transition-all">
            ★
          </div>
          {isSidebarExpanded && (
            <span className="text-base font-black tracking-wider text-white">
              MovieMind <span className="text-red-500">AI</span>
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-2 flex flex-col justify-start">
          {[
            { label: "Home", icon: <FaHome />, action: () => { setIsSearchPageOpen(false); setActiveViewFilter("all"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
            { label: "Search", icon: <FaSearch />, action: () => { setIsSearchPageOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); } },
            { label: "Trending", icon: <FaFire />, action: () => { setIsSearchPageOpen(false); setActiveViewFilter("all"); window.scrollTo({ top: 850, behavior: "smooth" }); } },
            { label: "Watchlist", icon: <FaCrown />, action: () => {
                setIsSearchPageOpen(false);
                if (!auth.currentUser) {
                  alert("🔒 Please log in to view your Watchlist.");
                  localStorage.setItem("auth_redirect_target", "/movies");
                  navigate("/login");
                } else {
                  setSearchResults(watchlist);
                  setActiveViewFilter("watchlist");
                  window.scrollTo({ top: 850, behavior: "smooth" });
                }
              }
            },
            { label: "History", icon: <FaHistory />, action: () => {
                setIsSearchPageOpen(false);
                if (!auth.currentUser) {
                  alert("🔒 Please log in to view your Watch History.");
                  localStorage.setItem("auth_redirect_target", "/movies");
                  navigate("/login");
                } else {
                  setActiveViewFilter("watched");
                  window.scrollTo({ top: 850, behavior: "smooth" });
                }
              }
            },
            { label: "Dashboard", icon: <FaRegCompass />, action: () => navigate("/performance") },
            { label: "My Space", icon: <FaUserCircle />, action: () => navigate("/profile") }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className={`w-full flex items-center rounded-xl transition-all duration-200 py-3.5 cursor-pointer ${
                isSidebarExpanded ? "px-4 gap-4 justify-start text-sm font-bold" : "justify-center text-xl"
              } ${item.label === "Search" && isSearchPageOpen ? "text-red-500 bg-white/5" : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"}`}
            >
              <div className="shrink-0">{item.icon}</div>
              {isSidebarExpanded && <span className="animate-fade-in whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          className={`w-full flex items-center text-neutral-500 hover:text-red-500 transition-colors py-3 cursor-pointer ${
            isSidebarExpanded ? "px-4 gap-4 justify-start text-xs font-bold font-mono tracking-widest" : "justify-center text-lg"
          }`}
        >
          <FaArrowLeft />
          {isSidebarExpanded && <span>EXIT VIEW</span>}
        </button>
      </div>

      {/* ── CONDITIONAL VIEW ROUTER MODULE ── */}
      {isSearchPageOpen ? (
        
        /* ── 🔍 MODE 1: IMMERSIVE SEARCH PANEL INTERFACE ── */
        <div className="min-h-screen pl-16 md:pl-24 pt-10 pr-6 md:pr-12 animate-fade-in flex flex-col space-y-10">
          
          <div className="w-full max-w-5xl relative mt-4">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 text-xl" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Movies, shows and more"
              className="w-full pl-16 pr-24 py-5 rounded-2xl bg-[#0e0e14]/90 border border-white/10 outline-none text-lg text-white focus:border-red-500/60 shadow-2xl backdrop-blur-md transition-all font-medium"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm bg-white/10 px-2.5 py-1 rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {recentSearches.length > 0 && (
            <div className="w-full max-w-5xl space-y-4">
              <h3 className="text-sm font-mono tracking-widest font-bold text-neutral-400 uppercase">Recent Searches</h3>
              <div className="flex flex-wrap gap-3">
                {recentSearches.map((query, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { setSearch(query); searchMovies(query); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] text-sm text-neutral-200 font-medium cursor-pointer transition-all shadow-md group"
                  >
                    <FaHistory className="text-xs text-neutral-500 group-hover:text-red-400 transition-colors" />
                    <span>{query}</span>
                    <FaTimes 
                      onClick={(e) => removeRecentSearchTag(e, idx)}
                      className="text-[10px] text-neutral-500 hover:text-red-500 ml-1 transition-colors cursor-pointer" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full pt-4">
            {searchResults.length > 0 ? (
              <div className="-ml-16 md:-ml-24">
                <MovieRow title="Search Results" icon={<FaSearch />} movies={searchResults} />
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                  <span>📈</span> Trending Searches
                </h3>
                <div className="-ml-16 md:-ml-24">
                  <MovieRow title="" icon={null} movies={trending.slice(0, 12)} />
                </div>
              </div>
            )}
          </div>

        </div>

      ) : (

        /* ── 🎬 MODE 2: HERO CATALOG FEED INTERFACE ── */
        <>
          {heroMovie && (
            <div className="relative h-screen pl-16 md:pl-20">
              {heroMovie.backdrop_path ? (
                <img src={`${IMG}${heroMovie.backdrop_path}`} alt={heroMovie.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0a0a14] to-black" />
              )}
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-black/30"></div>

              <div className="absolute top-0 right-0 z-40 p-6 flex items-center gap-4">
                <button 
                  onClick={() => setIsSearchPageOpen(true)}
                  className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/80 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                >
                  <FaSearch className="text-sm" />
                </button>
              </div>

              <div className="relative z-10 flex items-center h-full px-14 md:px-20">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-xl mb-6 text-xs font-bold text-red-400 uppercase tracking-wider">🔥 #1 Trending Worldwide</div>
                  <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">{heroMovie.title}</h1>
                  <p className="text-base md:text-lg text-white/70 leading-relaxed mb-10 line-clamp-3 font-medium">{heroMovie.overview}</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => openTrailer(heroMovie)} 
                      className="px-8 py-3.5 rounded-2xl bg-white text-black text-base font-bold flex items-center gap-2.5 hover:scale-105 shadow-2xl transition-transform cursor-pointer"
                    >
                      <FaPlay className="text-xs" /> Watch Trailer
                    </button>
                    <button 
                      onClick={() => heroMovie.id !== "fallback" && navigate(`/movie/${heroMovie.id}`)} 
                      className="px-8 py-3.5 rounded-2xl bg-white/10 border border-white/10 text-base font-bold hover:bg-white/20 hover:scale-105 transition-transform cursor-pointer"
                    >
                      Watch Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="relative z-20 -mt-24 pb-32 space-y-4">
            {activeViewFilter === "watchlist" && (
              <div className="pt-24 min-h-[50vh]">
                <MovieRow title="Your Watchlist Collection" icon={"📦"} movies={watchlist} isGatedDeleteView="watchlist" />
                {watchlist.length === 0 && (
                  <p className="text-neutral-500 text-sm font-mono text-center py-20 uppercase tracking-widest">Your Watchlist is empty.</p>
                )}
              </div>
            )}

            {activeViewFilter === "watched" && (
              <div className="pt-24 min-h-[50vh]">
                <MovieRow title="Your Watched Movie History" icon={"👁️"} movies={watchedHistory} isGatedDeleteView="watched" />
                {watchedHistory.length === 0 && (
                  <p className="text-neutral-500 text-sm font-mono text-center py-20 uppercase tracking-widest">Your streaming history is empty.</p>
                )}
              </div>
            )}

            {activeViewFilter === "category_expanded" && (
              <div className="pt-24 min-h-[50vh]">
                <MovieRow title="Expanded Collection View" icon={"🎬"} movies={searchResults} />
                <button 
                  onClick={() => setActiveViewFilter("all")} 
                  className="mx-auto block mt-8 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all"
                >
                  ← Back to Showcase
                </button>
              </div>
            )}

            {activeViewFilter === "all" && (
              <div className="space-y-4">
                <MovieRow title="Trending Now" icon={<FaFire />} movies={trending} />
                <MovieRow title="Top Rated" icon={<FaCrown />} movies={topRated} />
                <MovieRow title="Action Blockbusters" icon={"🎬"} movies={actionMovies} />
                <MovieRow title="Sci-Fi & Fantasy" icon={"🚀"} movies={sciFiMovies} />
                <MovieRow title="Horror Night" icon={"👻"} movies={horrorMovies} />
                <MovieRow title="Romance Feed" icon={"❤️"} movies={romanceMovies} />
              </div>
            )}
          </div>
        </>
      )}

      {/* Selection Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10">
          <div className="relative w-full max-w-6xl rounded-[40px] overflow-hidden bg-[#0c0c12] border border-white/10 shadow-2xl animate-fade-in">
            <button onClick={() => setSelectedMovie(null)} className="absolute top-6 right-6 z-30 w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-2xl hover:bg-red-500 hover:rotate-90 text-white cursor-pointer"><FaTimes /></button>
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
                  <button onClick={() => openTrailer(selectedMovie)} className="px-8 py-4 rounded-xl bg-white text-black font-bold text-lg flex items-center gap-2 hover:scale-105 shadow-lg cursor-pointer"><FaPlay /> Watch Trailer</button>
                  <button 
                    onClick={() => {
                      setSelectedMovie(null);
                      navigate(`/movie/${selectedMovie.id}`);
                    }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-lg font-bold text-white hover:scale-105 transition-transform cursor-pointer"
                  >
                    Play Full Movie
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      {trailerKey && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 transition-all duration-300">
          <button onClick={() => { setTrailerKey(""); setActiveTrailerMovie(null); }} className="absolute top-8 right-8 z-50 w-14 h-14 rounded-full bg-black/60 border border-white/10 text-2xl flex items-center justify-center hover:bg-red-500 hover:rotate-90 text-white cursor-pointer"><FaTimes /></button>
          <div className="w-[85vw] h-[80vh] rounded-[32px] overflow-hidden border border-white/10 bg-black relative z-10 shadow-[0_0_80px_rgba(244,63,94,0.25)]">
            <YouTube videoId={trailerKey} opts={{ width: "100%", height: "100%", playerVars: { autoplay: 1, modestbranding: 1, rel: 0, origin: window.location.origin } }} className="w-full h-full" onPlay={() => activeTrailerMovie && markAsWatched(activeTrailerMovie)} onEnd={() => { if (activeTrailerMovie) { markAsWatched(activeTrailerMovie); setTrailerKey(""); setActiveTrailerMovie(null); } }} />
          </div>
        </div>
      )}

    </div>
  );
}