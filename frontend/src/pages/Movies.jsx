// src/pages/Movies.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

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
  FaRegCompass,
  FaUserCircle,
  FaArrowLeft,
  FaExclamationTriangle,
  FaSpinner
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Storage key helpers for user-specific data isolation
  const getWatchlistKey = (uid) => (uid ? `watchlist_${uid}` : null);
  const getHistoryKey = (uid) => (uid ? `watched_history_${uid}` : null);

  // Synchronize authentication state & initial data loading
  useEffect(() => {
    // Recent searches initialization
    try {
      const savedSearches = JSON.parse(localStorage.getItem("recent_searches")) || [];
      setRecentSearches(savedSearches);
    } catch {
      setRecentSearches([]);
    }

    // Reactive Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const wKey = getWatchlistKey(user.uid);
        const hKey = getHistoryKey(user.uid);

        const savedWatchlist = JSON.parse(localStorage.getItem(wKey)) || [];
        const savedHistory = JSON.parse(localStorage.getItem(hKey)) || [];

        setWatchlist(savedWatchlist);
        setWatchedHistory(savedHistory);
      } else {
        setWatchlist([]);
        setWatchedHistory([]);
      }
    });

    loadMovies();

    if (location.state && location.state.filter) {
      setActiveViewFilter(location.state.filter);
      
      setTimeout(() => {
        window.scrollTo({
          top: 850,
          behavior: "smooth",
        });
      }, 500);
    }

    return () => unsubscribe();
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
    if (!API_KEY) {
      setErrorMessage("TMDB API Key missing in environment configuration.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Parallel category loading via Promise.all
      const [
        trendingData,
        topRatedData,
        actionData,
        sciFiData,
        horrorData,
        romanceData
      ] = await Promise.all([
        fetchMovies(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
        fetchMovies(`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`),
        fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28`),
        fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=878`),
        fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=27`),
        fetchMovies(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=10749`)
      ]);

      setTrending(trendingData);
      setTopRated(topRatedData);
      setActionMovies(actionData);
      setSciFiMovies(sciFiData);
      setHorrorMovies(horrorData);
      setRomanceMovies(romanceData);

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
      setErrorMessage("Failed to load catalog data. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const searchMovies = async (forcedQuery = null) => {
    const queryTarget = (forcedQuery || search).trim();
    if (!queryTarget) return;

    if (!API_KEY) {
      alert("API Configuration key missing.");
      return;
    }

    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(queryTarget)}`);
      if (!res.ok) throw new Error(`HTTP Error Status: ${res.status}`);
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

      // Manage recent searches with deduplication and 5-item max limit
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== queryTarget.toLowerCase());
        const updated = [queryTarget, ...filtered].slice(0, 5);
        localStorage.setItem("recent_searches", JSON.stringify(updated));
        return updated;
      });

      if (!data.results || data.results.length === 0) {
        alert("No movies found matching current criteria.");
      }
    } catch (err) {
      console.error("Search query execution failed:", err);
      alert("Failed to execute search query. Please try again.");
    }
  };

  const removeRecentSearchTag = (e, indexToRemove) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      return updated;
    });
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
      if (!res.ok) throw new Error("Failed to fetch trailer payload");
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
      console.error("Trailer stream initialization failed:", err);
    }
  };

  const addToWatchlist = async (movie) => {
    const user = auth.currentUser;
    if (!user) {
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

    const wKey = getWatchlistKey(user.uid);
    if (wKey) {
      localStorage.setItem(wKey, JSON.stringify(updated));
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        watchlistCount: increment(1),
        sessionLogs: arrayUnion({
          text: `Added "${movie.title}" to Watchlist`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "WATCHLIST"
        })
      });
    } catch (error) {
      console.error("Firestore watchlist sync failed:", error);
    }

    alert("Added to watchlist");
  };

  const removeFromWatchlist = async (e, movie) => {
    e.stopPropagation(); 
    const user = auth.currentUser;
    if (!user) return;

    const updated = watchlist.filter((m) => m.id !== movie.id);
    setWatchlist(updated);

    const wKey = getWatchlistKey(user.uid);
    if (wKey) {
      localStorage.setItem(wKey, JSON.stringify(updated));
    }

    try {
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
    const user = auth.currentUser;
    if (!user) return;

    const isCurrentlyInHistory = watchedHistory.some(m => m.id === movie.id);
    const updated = watchedHistory.filter((m) => m.id !== movie.id);
    setWatchedHistory(updated);

    const hKey = getHistoryKey(user.uid);
    if (hKey) {
      localStorage.setItem(hKey, JSON.stringify(updated));
    }

    try {
      const updateData = {
        sessionLogs: arrayUnion({
          text: `Purged "${movie.title}" from screening logs`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "HISTORY_PURGE"
        })
      };

      if (isCurrentlyInHistory) {
        updateData.watchedCount = increment(-1);
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      alert("Purged from watched history 🧼");
    } catch (error) {
      console.error("Firestore history optimization routine failed:", error);
    }
  };

  const markAsWatched = async (movie) => {
    if (hasTrackedCurrent || !movie) return;
    setHasTrackedCurrent(true);

    const user = auth.currentUser;
    if (!user) return;

    const isNewWatch = !watchedHistory.some(m => m.id === movie.id);
    const updatedHistory = isNewWatch
      ? [movie, ...watchedHistory].slice(0, 10)
      : watchedHistory;

    setWatchedHistory(updatedHistory);

    const hKey = getHistoryKey(user.uid);
    if (hKey) {
      localStorage.setItem(hKey, JSON.stringify(updatedHistory));
    }

    try {
      let primaryGenreField = "genre_other";
      if (movie.genre_ids?.includes(878)) primaryGenreField = "genre_scifi";
      else if (movie.genre_ids?.includes(28)) primaryGenreField = "genre_action";
      else if (movie.genre_ids?.includes(53)) primaryGenreField = "genre_thriller";

      const firestoreUpdates = {
        [primaryGenreField]: increment(1), 
        sessionLogs: arrayUnion({
          text: `Watched trailer for "${movie.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "SCREENING"
        })
      };

      if (isNewWatch) {
        firestoreUpdates.watchedCount = increment(1);
      }

      await updateDoc(doc(db, "users", user.uid), firestoreUpdates);
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
                  alert("🔒 Please log in to view your History.");
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
        <div className="min-h-screen pl-16 md:pl-24 pt-12 pb-24 px-8 md:px-16 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex items-center justify-between mb-12">
              <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2">Search Catalog</h1>
                <p className="text-neutral-400 text-lg">Locate cinematic experiences across global TMDB datasets.</p>
              </div>
              <button 
                onClick={() => setIsSearchPageOpen(false)}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-xl transition-all"
              >
                <FaTimes />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative mb-8">
              <input
                type="text"
                placeholder="Search movies, genres, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-zinc-900/90 border border-white/10 rounded-3xl py-6 pl-16 pr-36 text-xl md:text-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-all shadow-2xl"
              />
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 text-2xl" />
              <button
                onClick={() => searchMovies()}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95"
              >
                Search
              </button>
            </div>

            {/* Recent Searches Pills */}
            {recentSearches.length > 0 && (
              <div className="mb-12 flex items-center gap-3 flex-wrap">
                <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wider mr-2">Recent Searches:</span>
                {recentSearches.map((term, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSearch(term);
                      searchMovies(term);
                    }}
                    className="group/pill flex items-center gap-2 bg-white/5 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-full text-sm font-medium text-neutral-300 hover:text-white cursor-pointer transition-all"
                  >
                    <span>{term}</span>
                    <button
                      onClick={(e) => removeRecentSearchTag(e, index)}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-0.5"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Results Display */}
            {searchResults.length > 0 ? (
              <div className="mt-8">
                <MovieRow title={`Search Results (${searchResults.length})`} icon={<FaSearch />} movies={searchResults} />
              </div>
            ) : (
              <div className="mt-20 text-center text-neutral-500">
                <FaSearch className="text-6xl mx-auto mb-4 opacity-20" />
                <p className="text-xl">Enter a search query to discover movies.</p>
              </div>
            )}

          </div>
        </div>

      ) : (

        /* ── 🎬 MODE 2: MAIN CATALOG DASHBOARD (DEFAULT VIEW) ── */
        <div className="pl-16 md:pl-20 transition-all duration-300">

          {/* Loading Indicator */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex flex-col items-center justify-center gap-4">
              <FaSpinner className="animate-spin text-5xl text-red-500" />
              <p className="text-xl font-medium tracking-wide">Loading Media Catalog...</p>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mx-16 md:mx-24 mt-8 p-4 bg-red-950/80 border border-red-500/50 rounded-2xl flex items-center gap-4 text-red-200">
              <FaExclamationTriangle className="text-2xl text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Catalog Initialization Alert</p>
                <p className="text-sm opacity-80">{errorMessage}</p>
              </div>
              <button 
                onClick={loadMovies}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Hero Section */}
          {heroMovie && (
            <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden mb-12 select-none">
              {heroMovie.backdrop_path ? (
                <img
                  src={`${IMG}${heroMovie.backdrop_path}`}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover object-center scale-105 animate-pulse-subtle"
                />
              ) : (
                <div className="w-full h-full bg-[#0a0a0f] flex items-center justify-center">
                  <span className="text-neutral-700 font-mono text-2xl">MEDIA STREAM OFFLINE</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#030305] via-[#030305]/60 to-transparent"></div>

              <div className="absolute bottom-16 left-12 md:left-24 max-w-2xl z-20 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 border border-red-500/30 backdrop-blur-md text-red-400 font-bold text-sm">
                  🔥 Trending Worldwide
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none drop-shadow-2xl">
                  {heroMovie.title}
                </h1>

                <p className="text-neutral-300 text-base md:text-lg line-clamp-3 leading-relaxed font-normal drop-shadow-md">
                  {heroMovie.overview}
                </p>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => openTrailer(heroMovie)}
                    className="px-8 py-4 rounded-2xl bg-white text-black font-extrabold flex items-center gap-3 hover:bg-neutral-200 transition-all transform hover:scale-105 shadow-2xl active:scale-95"
                  >
                    <FaPlay className="text-sm" /> Watch Trailer
                  </button>

                  <button
                    onClick={() => navigate(`/movie/${heroMovie.id}`)}
                    className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-bold flex items-center gap-3 hover:bg-white/20 transition-all transform hover:scale-105 active:scale-95"
                  >
                    View Movie Details
                  </button>

                  <button
                    onClick={() => addToWatchlist(heroMovie)}
                    className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                    title="Add to Watchlist"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar / Catalog Views */}
          <div className="mt-8">
            {activeViewFilter === "watchlist" ? (
              <MovieRow title="Your Watchlist" icon={<FaCrown />} movies={watchlist} isGatedDeleteView="watchlist" />
            ) : activeViewFilter === "watched" ? (
              <MovieRow title="Recently Watched History" icon={<FaHistory />} movies={watchedHistory} isGatedDeleteView="watched" />
            ) : activeViewFilter === "category_expanded" ? (
              <MovieRow title="Selected Collection" icon={<FaFire />} movies={searchResults} />
            ) : (
              <>
                <MovieRow title="Trending Movies" icon={<FaFire />} movies={trending} />
                <MovieRow title="Top Rated" icon={<FaStar />} movies={topRated} />
                <MovieRow title="Action Blockbusters" movies={actionMovies} />
                <MovieRow title="Sci-Fi & Fantasy" movies={sciFiMovies} />
                <MovieRow title="Horror & Thrillers" movies={horrorMovies} />
                <MovieRow title="Romantic Hits" movies={romanceMovies} />
              </>
            )}
          </div>

        </div>
      )}

      {/* ── 🎬 TRAILER MODAL ── */}
      {trailerKey && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => {
                setTrailerKey("");
                setActiveTrailerMovie(null);
                setHasTrackedCurrent(false);
              }}
              className="absolute top-4 right-4 z-50 w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white text-xl hover:bg-red-600 transition-all"
            >
              <FaTimes />
            </button>

            <div className="relative pt-[56.25%] w-full">
              <YouTube
                videoId={trailerKey}
                className="absolute inset-0 w-full h-full"
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                  },
                }}
                onPlay={() => {
                  if (activeTrailerMovie) {
                    markAsWatched(activeTrailerMovie);
                  }
                }}
                onEnd={() => {
                  setHasTrackedCurrent(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ℹ️ MOVIE DETAILS QUICK-VIEW MODAL ── */}
      {selectedMovie && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedMovie(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-all"
            >
              <FaTimes />
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              {selectedMovie.backdrop_path || selectedMovie.poster_path ? (
                <img
                  src={`${IMG}${selectedMovie.poster_path || selectedMovie.backdrop_path}`}
                  alt={selectedMovie.title}
                  className="w-full md:w-48 h-72 object-cover rounded-2xl shadow-lg"
                />
              ) : (
                <div className="w-full md:w-48 h-72 bg-zinc-800 rounded-2xl flex items-center justify-center text-neutral-500 text-xs font-mono">
                  NO COVER
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-black mb-2">{selectedMovie.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-neutral-400 mb-4">
                    <span className="flex items-center gap-1 text-yellow-500 font-bold">
                      <FaStar /> {selectedMovie.vote_average?.toFixed(1) || "N/A"}
                    </span>
                    <span>•</span>
                    <span>{selectedMovie.release_date || "Release Unknown"}</span>
                  </div>
                  <p className="text-neutral-300 text-sm line-clamp-4 leading-relaxed mb-6">
                    {selectedMovie.overview || "No overview available for this title."}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedMovie(null);
                      openTrailer(selectedMovie);
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <FaPlay /> Watch Trailer
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMovie(null);
                      addToWatchlist(selectedMovie);
                    }}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                  >
                    + Watchlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}