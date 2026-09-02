import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from "firebase/firestore";
import YouTube from "react-youtube";
import {
  FaPlay,
  FaPlus,
  FaCheck,
  FaInfoCircle,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaEye,
  FaUndo,
  FaFilm
} from "react-icons/fa";
import { auth, db } from "../firebase";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Helper to safely parse JSON from localStorage without crashing
const safeParseStorage = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) || typeof parsed === "object" ? parsed : fallback;
  } catch (error) {
    console.warn(`Error parsing localStorage key "${key}":`, error);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore storage clear errors
    }
    return fallback;
  }
};

// Extracted MovieCard component to prevent unnecessary re-renders
const MovieCard = memo(({ movie, isWatchlisted, isWatched, onToggleWatchlist, onToggleWatched, onOpenTrailer, onNavigateDetail }) => {
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750/111827/ffffff?text=No+Poster";

  return (
    <div className="group relative flex-none w-44 sm:w-52 md:w-60 rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-900/20 z-10 hover:z-20">
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-800">
        <img
          src={posterUrl}
          alt={movie.title || movie.name || "Movie poster"}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
              <FaStar className="text-yellow-400" />
              {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
            </span>
            <span className="text-xs text-gray-300 font-medium">
              {(movie.release_date || movie.first_air_date || "").slice(0, 4)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTrailer(movie)}
              className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-transform active:scale-95 shadow-lg"
              title="Watch Trailer"
              aria-label={`Watch trailer for ${movie.title || movie.name}`}
            >
              <FaPlay className="text-xs ml-0.5" />
            </button>
            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-transform active:scale-95 ${
                isWatchlisted ? "bg-green-600 text-white" : "bg-gray-800/80 text-white hover:bg-gray-700"
              }`}
              title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
              aria-label={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {isWatchlisted ? <FaCheck className="text-xs" /> : <FaPlus className="text-xs" />}
            </button>
            <button
              onClick={() => onToggleWatched(movie)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-transform active:scale-95 ${
                isWatched ? "bg-blue-600 text-white" : "bg-gray-800/80 text-white hover:bg-gray-700"
              }`}
              title={isWatched ? "Marked as Watched" : "Mark as Watched"}
              aria-label={isWatched ? "Marked as Watched" : "Mark as Watched"}
            >
              <FaEye className="text-xs" />
            </button>
            <button
              onClick={() => onNavigateDetail(movie.id)}
              className="p-2.5 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-md transition-transform active:scale-95 ml-auto"
              title="View Details"
              aria-label={`View details for ${movie.title || movie.name}`}
            >
              <FaInfoCircle className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Basic Title Info */}
      <div className="p-3 bg-gray-900/90 backdrop-blur-sm">
        <h3 className="font-semibold text-sm text-gray-100 truncate" title={movie.title || movie.name}>
          {movie.title || movie.name}
        </h3>
      </div>
    </div>
  );
});

// Extracted MovieRow component moved outside main Movies component to prevent remounts
const MovieRow = memo(({ title, movies, watchlist, watchedHistory, onToggleWatchlist, onToggleWatched, onOpenTrailer, onNavigateDetail }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollLeft + scrollAmount, behavior: "smooth" });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 px-4 md:px-12 group/row">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-red-600 pl-3">
        {title}
      </h2>

      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/70 hover:bg-red-600 text-white p-3 rounded-r-xl backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hidden md:block"
          aria-label="Scroll left"
        >
          <FaChevronLeft className="text-lg" />
        </button>

        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie) => {
            const isWatchlisted = watchlist.some((m) => m.id === movie.id);
            const isWatched = watchedHistory.some((m) => m.id === movie.id);

            return (
              <MovieCard
                key={movie.id}
                movie={movie}
                isWatchlisted={isWatchlisted}
                isWatched={isWatched}
                onToggleWatchlist={onToggleWatchlist}
                onToggleWatched={onToggleWatched}
                onOpenTrailer={onOpenTrailer}
                onNavigateDetail={onNavigateDetail}
              />
            );
          })}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/70 hover:bg-red-600 text-white p-3 rounded-l-xl backdrop-blur-md opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl hidden md:block"
          aria-label="Scroll right"
        >
          <FaChevronRight className="text-lg" />
        </button>
      </div>
    </section>
  );
});

// Skeleton Loader UI
const MovieSkeletonRow = () => (
  <div className="my-8 px-4 md:px-12">
    <div className="h-7 w-48 bg-gray-800 rounded mb-4 animate-pulse" />
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="flex-none w-44 sm:w-52 md:w-60 rounded-xl bg-gray-800/60 aspect-[2/3] animate-pulse" />
      ))}
    </div>
  </div>
);

const HeroSkeleton = () => (
  <div className="relative w-full h-[70vh] min-h-[500px] bg-gray-900 animate-pulse flex items-end p-6 md:p-16">
    <div className="max-w-2xl space-y-4 w-full">
      <div className="h-4 w-32 bg-gray-800 rounded" />
      <div className="h-10 w-3/4 bg-gray-800 rounded" />
      <div className="h-16 w-full bg-gray-800 rounded" />
      <div className="flex gap-4 pt-4">
        <div className="h-12 w-36 bg-gray-800 rounded-lg" />
        <div className="h-12 w-36 bg-gray-800 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function Movies() {
  const navigate = useNavigate();

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);

  // Movie Data States
  const [heroMovie, setHeroMovie] = useState(null);
  const [categories, setCategories] = useState({
    trending: [],
    popular: [],
    topRated: [],
    upcoming: [],
    action: [],
    comedy: []
  });

  // User Interactive States
  const [watchlist, setWatchlist] = useState([]);
  const [watchedHistory, setWatchedHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // UI/Status States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Trailer Modal State
  const [trailerKey, setTrailerKey] = useState(null);
  const [activeMovieForTrailer, setActiveMovieForTrailer] = useState(null);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);

  // Ref locks to prevent rapid duplicate events and API spam
  const trackedTrailerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch TMDB API wrapper with proper error handling
  const fetchTMDB = async (endpoint) => {
    if (!TMDB_API_KEY) {
      throw new Error("TMDB API Key is missing. Please check your environment configuration.");
    }
    const separator = endpoint.includes("?") ? "&" : "?";
    const response = await fetch(`${BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`TMDB HTTP Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.results || [];
  };

  // Main movie loader function
  const loadMovies = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [trending, popular, topRated, upcoming, action, comedy] = await Promise.all([
        fetchTMDB("/trending/movie/week"),
        fetchTMDB("/movie/popular"),
        fetchTMDB("/movie/top_rated"),
        fetchTMDB("/movie/upcoming"),
        fetchTMDB("/discover/movie?with_genres=28"),
        fetchTMDB("/discover/movie?with_genres=35")
      ]);

      setCategories({
        trending,
        popular,
        topRated,
        upcoming,
        action,
        comedy
      });

      if (trending.length > 0) {
        setHeroMovie(trending[0]);
      }
    } catch (error) {
      console.error("Failed to load movies from TMDB:", error);
      setErrorMessage(error.message || "Failed to fetch movies. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // EFFECT A: Isolated Firebase Authentication Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Safe user-specific local search history initialization
        const localSearches = safeParseStorage(`recent_searches_${user.uid}`, []);
        setRecentSearches(localSearches);

        // Fetch User Data from Firestore
        const fetchUserData = async () => {
          try {
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setWatchlist(data.watchlist || []);
              setWatchedHistory(data.watchedHistory || []);
            }
          } catch (err) {
            console.error("Error loading user firestore data:", err);
          }
        };
        fetchUserData();
      } else {
        setWatchlist([]);
        setWatchedHistory([]);
        setRecentSearches([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // EFFECT B: Isolated Movie Data Effect
  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Search Logic with Encoding & Debounce
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const results = await fetchTMDB(`/search/movie?query=${encodedQuery}`);
      setSearchResults(results);
    } catch (err) {
      console.error("Search API Error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const onSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
      if (value.trim() && currentUser) {
        setRecentSearches((prev) => {
          const updated = [value.trim(), ...prev.filter((item) => item !== value.trim())].slice(0, 5);
          try {
            localStorage.setItem(`recent_searches_${currentUser.uid}`, JSON.stringify(updated));
          } catch (err) {
            console.warn("Storage write failed", err);
          }
          return updated;
        });
      }
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Watchlist Toggle Logic
  const handleToggleWatchlist = async (movie) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const isWatchlisted = watchlist.some((m) => m.id === movie.id);
    const movieData = {
      id: movie.id,
      title: movie.title || movie.name || "",
      poster_path: movie.poster_path || "",
      vote_average: movie.vote_average || 0,
      release_date: movie.release_date || movie.first_air_date || ""
    };

    const userRef = doc(db, "users", currentUser.uid);

    // Optimistic state update
    if (isWatchlisted) {
      setWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
    } else {
      setWatchlist((prev) => [...prev, movieData]);
    }

    try {
      await setDoc(
        userRef,
        {
          watchlist: isWatchlisted ? arrayRemove(movieData) : arrayUnion(movieData)
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Firestore Watchlist Sync Failure:", err);
      // Revert optimistic update on failure
      if (isWatchlisted) {
        setWatchlist((prev) => [...prev, movieData]);
      } else {
        setWatchlist((prev) => prev.filter((m) => m.id !== movie.id));
      }
    }
  };

  // Watched History Logic (Safe & Prevents Duplicates / Negative Counts / Fake Watch Time)
  const handleToggleWatched = async (movie) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const isAlreadyWatched = watchedHistory.some((m) => m.id === movie.id);
    const movieData = {
      id: movie.id,
      title: movie.title || movie.name || "",
      poster_path: movie.poster_path || "",
      genre_ids: movie.genre_ids || [],
      watchedAt: new Date().toISOString()
    };

    const userRef = doc(db, "users", currentUser.uid);

    if (isAlreadyWatched) {
      // Safe Removal Logic
      setWatchedHistory((prev) => prev.filter((m) => m.id !== movie.id));

      try {
        const userDoc = await getDoc(userRef);
        const currentCount = userDoc.exists() ? userDoc.data().watchedCount || 0 : 0;
        const newCount = Math.max(0, currentCount - 1);

        await updateDoc(userRef, {
          watchedHistory: arrayRemove(watchedHistory.find((m) => m.id === movie.id) || movieData),
          watchedCount: newCount
        });
      } catch (err) {
        console.error("Firestore Watched History Removal Error:", err);
      }
    } else {
      // Safe Addition Logic (No Fake Watch Time Addition, Unique Genres Only)
      setWatchedHistory((prev) => [...prev, movieData]);

      try {
        const genreUpdates = {};
        if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
          movie.genre_ids.forEach((gId) => {
            genreUpdates[`genreStats.${gId}`] = increment(1);
          });
        }

        await setDoc(
          userRef,
          {
            watchedHistory: arrayUnion(movieData),
            watchedCount: increment(1),
            ...genreUpdates
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Firestore Watched History Addition Error:", err);
      }
    }
  };

  // Trailer Loader Function
  const openTrailer = async (movie) => {
    setActiveMovieForTrailer(movie);
    setIsTrailerLoading(true);
    setTrailerKey(null);

    try {
      const response = await fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`);
      if (!response.ok) throw new Error("Failed to fetch trailer video.");
      const data = await response.json();
      const officialTrailer = data.results?.find(
        (vid) => (vid.type === "Trailer" || vid.type === "Teaser") && vid.site === "YouTube"
      );

      if (officialTrailer) {
        setTrailerKey(officialTrailer.key);
      } else {
        setTrailerKey(null);
      }
    } catch (err) {
      console.error("Trailer Fetch Error:", err);
      setTrailerKey(null);
    } finally {
      setIsTrailerLoading(false);
    }
  };

  const closeTrailerModal = () => {
    setTrailerKey(null);
    setActiveMovieForTrailer(null);
    trackedTrailerRef.current = null;
  };

  // Separate, safe trailer state event listener (Disambiguated from movie watching)
  const handleTrailerPlay = async () => {
    if (!currentUser || !activeMovieForTrailer) return;

    // Prevent duplicate rapid logs via useRef lock
    if (trackedTrailerRef.current === activeMovieForTrailer.id) return;
    trackedTrailerRef.current = activeMovieForTrailer.id;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          trailerActivity: arrayUnion({
            movieId: activeMovieForTrailer.id,
            movieTitle: activeMovieForTrailer.title || activeMovieForTrailer.name || "",
            eventType: "TRAILER_START",
            timestamp: new Date().toISOString()
          })
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to record trailer activity:", err);
    }
  };

  const navigateToDetail = useCallback((id) => {
    navigate(`/movie/${id}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-red-600 selection:text-white pb-16">
      {/* Background Graphic Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      {/* Search Header Bar */}
      <div className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60 px-4 md:px-12 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchInputChange}
              placeholder="Search movies by title..."
              className="w-full bg-gray-900/90 border border-gray-700/60 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-full pl-11 pr-10 py-2 text-sm text-white placeholder-gray-400 outline-none transition-all"
              aria-label="Search movies"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {recentSearches.length > 0 && !searchQuery && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
              <span>Recent:</span>
              <div className="flex gap-1.5">
                {recentSearches.slice(0, 3).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(term);
                      handleSearch(term);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10">
        {/* API Failure / Error Message with Retry */}
        {errorMessage ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl max-w-md w-full backdrop-blur-md shadow-2xl">
              <FaFilm className="text-4xl text-red-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">Unable to Load Movies</h2>
              <p className="text-sm text-gray-300 mb-6">{errorMessage}</p>
              <button
                onClick={loadMovies}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/30"
              >
                <FaUndo /> Retry Loading
              </button>
            </div>
          </div>
        ) : searchQuery.trim() ? (
          /* Search Results View */
          <div className="px-4 md:px-12 py-8 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              Search Results for <span className="text-red-500">"{searchQuery}"</span>
            </h2>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="aspect-[2/3] bg-gray-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((movie) => {
                  const isWatchlisted = watchlist.some((m) => m.id === movie.id);
                  const isWatched = watchedHistory.some((m) => m.id === movie.id);
                  return (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      isWatchlisted={isWatchlisted}
                      isWatched={isWatched}
                      onToggleWatchlist={handleToggleWatchlist}
                      onToggleWatched={handleToggleWatched}
                      onOpenTrailer={openTrailer}
                      onNavigateDetail={navigateToDetail}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg">No movies found matching your search term.</p>
              </div>
            )}
          </div>
        ) : (
          /* Standard Movie Home Dashboard */
          <>
            {/* HERO SECTION */}
            {isLoading ? (
              <HeroSkeleton />
            ) : heroMovie ? (
              <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden group">
                {/* Backdrop Image */}
                <div className="absolute inset-0 bg-gray-900">
                  <img
                    src={
                      heroMovie.backdrop_path
                        ? `${IMAGE_BASE_URL}/original${heroMovie.backdrop_path}`
                        : `${IMAGE_BASE_URL}/w500${heroMovie.poster_path}`
                    }
                    alt={heroMovie.title || heroMovie.name || "Featured movie backdrop"}
                    className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-gray-950/20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent" />
                </div>

                {/* Hero Information */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 max-w-3xl z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm shadow-md">
                      Trending Worldwide
                    </span>
                    {heroMovie.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
                        <FaStar /> {heroMovie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-3 drop-shadow-lg">
                    {heroMovie.title || heroMovie.name}
                  </h1>

                  <p className="text-sm md:text-base text-gray-300 line-clamp-3 mb-6 drop-shadow">
                    {heroMovie.overview}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => openTrailer(heroMovie)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2.5 transition-all shadow-lg shadow-red-900/40 active:scale-95"
                    >
                      <FaPlay className="text-sm" /> Watch Trailer
                    </button>
                    <button
                      onClick={() => navigateToDetail(heroMovie.id)}
                      className="px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white font-semibold rounded-xl flex items-center gap-2.5 backdrop-blur-md transition-all active:scale-95 border border-gray-700"
                    >
                      <FaInfoCircle className="text-sm" /> View Movie Details
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* WATCHED HISTORY SECTION (PART 2: Displayed safely without fake items) */}
            {watchedHistory.length > 0 && (
              <section className="my-8 px-4 md:px-12">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-blue-600 pl-3">
                  Recently Watched History ({watchedHistory.length})
                </h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-1">
                  {watchedHistory.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex-none w-36 sm:w-44 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden relative group"
                    >
                      <img
                        src={
                          movie.poster_path
                            ? `${IMAGE_BASE_URL}/w300${movie.poster_path}`
                            : "https://via.placeholder.com/300x450/111827/ffffff?text=No+Poster"
                        }
                        alt={movie.title || "Watched Movie"}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      <div className="p-2.5 bg-gray-900">
                        <p className="text-xs font-semibold text-gray-200 truncate">{movie.title}</p>
                      </div>
                      <button
                        onClick={() => handleToggleWatched(movie)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from Watched History"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CATEGORY ROWS SECTION */}
            {isLoading ? (
              <>
                <MovieSkeletonRow />
                <MovieSkeletonRow />
                <MovieSkeletonRow />
              </>
            ) : (
              <>
                <MovieRow
                  title="Trending Now"
                  movies={categories.trending}
                  watchlist={watchlist}
                  watchedHistory={watchedHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleWatched={handleToggleWatched}
                  onOpenTrailer={openTrailer}
                  onNavigateDetail={navigateToDetail}
                />
                <MovieRow
                  title="Popular Releases"
                  movies={categories.popular}
                  watchlist={watchlist}
                  watchedHistory={watchedHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleWatched={handleToggleWatched}
                  onOpenTrailer={openTrailer}
                  onNavigateDetail={navigateToDetail}
                />
                <MovieRow
                  title="Top Rated Classics"
                  movies={categories.topRated}
                  watchlist={watchlist}
                  watchedHistory={watchedHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleWatched={handleToggleWatched}
                  onOpenTrailer={openTrailer}
                  onNavigateDetail={navigateToDetail}
                />
                <MovieRow
                  title="Action & Adventure"
                  movies={categories.action}
                  watchlist={watchlist}
                  watchedHistory={watchedHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleWatched={handleToggleWatched}
                  onOpenTrailer={openTrailer}
                  onNavigateDetail={navigateToDetail}
                />
                <MovieRow
                  title="Comedies"
                  movies={categories.comedy}
                  watchlist={watchlist}
                  watchedHistory={watchedHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleWatched={handleToggleWatched}
                  onOpenTrailer={openTrailer}
                  onNavigateDetail={navigateToDetail}
                />
                <MovieRow
                  title="Upcoming Movies"
                  movies={categories.upcoming}
                  watchlist={watchlist}
                  watchedHistory={watchedHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onToggleWatched={handleToggleWatched}
                  onOpenTrailer={openTrailer}
                  onNavigateDetail={navigateToDetail}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* TRAILER MODAL */}
      {(trailerKey || isTrailerLoading || activeMovieForTrailer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
              <h3 className="font-bold text-lg text-white truncate">
                {activeMovieForTrailer?.title || activeMovieForTrailer?.name || "Official Trailer"}
              </h3>
              <button
                onClick={closeTrailerModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {isTrailerLoading ? (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Fetching trailer...</p>
                </div>
              ) : trailerKey ? (
                <YouTube
                  videoId={trailerKey}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                  onPlay={handleTrailerPlay}
                  opts={{
                    playerVars: {
                      autoplay: 1,
                      modestbranding: 1,
                      rel: 0
                    }
                  }}
                />
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-lg mb-2">No official trailer available for this movie.</p>
                  <button
                    onClick={() => {
                      closeTrailerModal();
                      if (activeMovieForTrailer) navigateToDetail(activeMovieForTrailer.id);
                    }}
                    className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
                  >
                    View Movie Details Instead
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}