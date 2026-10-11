// src/pages/Movies.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, increment, arrayUnion } from "firebase/firestore";
import {
  FaPlay,
  FaPlus,
  FaCheck,
  FaSearch,
  FaStar,
  FaTimes,
  FaFire,
  FaCrown,
  FaChevronLeft,
  FaChevronRight,
  FaTrashAlt,
  FaHistory,
  FaInfoCircle,
  FaHome,
  FaRegCompass,
  FaUserCircle,
  FaArrowLeft,
  FaExclamationTriangle,
  FaSpinner,
  FaFilm,
} from "react-icons/fa";
import YouTube from "react-youtube";
import ThemeToggle from "../components/ThemeToggle";

/* ───────────────────────── CONFIG ───────────────────────── */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB = "https://api.themoviedb.org/3";
const IMG_HERO = "https://image.tmdb.org/t/p/w1280";
const IMG_BACKDROP = "https://image.tmdb.org/t/p/w780";
const IMG_POSTER = "https://image.tmdb.org/t/p/w342";

const CATEGORIES = [
  { key: "trending", title: "Trending Movies", icon: <FaFire />, path: "/trending/movie/week", params: "" },
  { key: "topRated", title: "Top Rated", icon: <FaStar />, path: "/movie/top_rated", params: "" },
  { key: "action", title: "Action Blockbusters", icon: null, path: "/discover/movie", params: "&with_genres=28" },
  { key: "sciFi", title: "Sci-Fi & Fantasy", icon: null, path: "/discover/movie", params: "&with_genres=878" },
  { key: "horror", title: "Horror & Thrillers", icon: null, path: "/discover/movie", params: "&with_genres=27" },
  { key: "romance", title: "Romantic Hits", icon: null, path: "/discover/movie", params: "&with_genres=10749" },
];

const PAGE_PAD = "px-4 sm:px-8 lg:px-12";

/* ───────────────────────── HELPERS ───────────────────────── */

const watchlistKey = (uid) => (uid ? `watchlist_${uid}` : null);
const historyKey = (uid) => (uid ? `watched_history_${uid}` : null);

const readList = (key) => {
  if (!key) return [];
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeList = (key, value) => {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked, ignore
  }
};

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

async function tmdb(path, params = "") {
  const res = await fetch(`${TMDB}${path}?api_key=${API_KEY}${params}`);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

const safeList = (path, params) =>
  tmdb(path, params)
    .then((d) => d.results || [])
    .catch(() => []);

// setDoc + merge works even if the user document doesn't exist yet
// (updateDoc throws in that case, which silently broke the counters)
async function syncUser(updates) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await setDoc(doc(db, "users", user.uid), updates, { merge: true });
  } catch (error) {
    console.error("Firestore sync failed:", error);
  }
}

/* ───────────────────────── MOVIE CARD ───────────────────────── */

function MovieCard({
  movie,
  variant = "row",
  watchlistIds,
  onOpen,
  onTrailer,
  onInfo,
  onToggleWatchlist,
  onRemove,
  removeTitle = "Remove",
}) {
  const isRow = variant === "row";
  const path = isRow
    ? movie.backdrop_path || movie.poster_path
    : movie.poster_path || movie.backdrop_path;
  const src = path ? `${isRow ? IMG_BACKDROP : IMG_POSTER}${path}` : null;
  const inWatchlist = watchlistIds?.has(movie.id);
  const year = movie.release_date?.split("-")[0] || "Unknown";

  return (
    <div className={isRow ? "shrink-0 w-[240px] sm:w-[280px] lg:w-[320px] snap-start" : "w-full"}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(movie)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(movie)}
        className={`group/card relative overflow-hidden rounded-2xl cursor-pointer bg-zinc-900 transition-all duration-300 hover:scale-[1.04] hover:z-10 hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] ${
          isRow ? "aspect-video" : "aspect-[2/3]"
        }`}
      >
        {src ? (
          <img
            src={src}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-mono">
            NO IMAGE
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

        {/* Rating + info */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="px-3 py-1 rounded-full bg-yellow-500 text-black font-bold flex items-center gap-1.5 text-xs shadow-md">
            <FaStar /> {movie.vote_average?.toFixed(1) || "0.0"}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfo(movie);
            }}
            title="More info"
            className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500 transition cursor-pointer"
          >
            <FaInfoCircle className="text-sm" />
          </button>
        </div>

        {/* Title (row cards only; grid cards show it underneath) */}
        {isRow && (
          <div className="absolute bottom-0 inset-x-0 p-4 transition-opacity duration-300 group-hover/card:opacity-0 pointer-events-none">
            <h3 className="text-white text-lg font-bold line-clamp-1">{movie.title}</h3>
            <p className="text-white/70 text-xs mt-0.5">{year}</p>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrailer(movie);
            }}
            className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition cursor-pointer"
          >
            <FaPlay className="text-[10px]" /> Trailer
          </button>

          {onRemove ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(movie);
              }}
              title={removeTitle}
              className="w-11 rounded-xl bg-red-600/40 border border-red-500/40 flex items-center justify-center text-white hover:bg-red-600 transition cursor-pointer"
            >
              <FaTrashAlt className="text-xs" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(movie);
              }}
              title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              className={`w-11 rounded-xl border flex items-center justify-center text-white transition cursor-pointer ${
                inWatchlist
                  ? "bg-emerald-600 border-emerald-500 hover:bg-emerald-500"
                  : "bg-white/15 border-white/20 hover:bg-red-500 hover:border-red-500"
              }`}
            >
              {inWatchlist ? <FaCheck className="text-xs" /> : <FaPlus className="text-xs" />}
            </button>
          )}
        </div>
      </div>

      {!isRow && (
        <div className="mt-3 px-1">
          <h3 className="t-main font-bold text-sm line-clamp-1">{movie.title}</h3>
          <p className="t-muted text-xs mt-0.5">{year}</p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── ROW + GRID ───────────────────────── */

function MovieRow({ id, title, icon, movies, onViewAll, cardProps }) {
  const rowRef = useRef(null);
  if (!movies || movies.length === 0) return null;

  const scroll = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section id={id} className="group/row mb-10 scroll-mt-24">
      <div className={`flex items-center justify-between ${PAGE_PAD} mb-4`}>
        <div className="flex items-center gap-3">
          {icon && <span className="text-red-500 text-xl">{icon}</span>}
          <h2 className="t-main text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">{title}</h2>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 t-muted font-semibold text-sm hover:text-red-500 transition cursor-pointer"
        >
          View All <FaChevronRight className="text-xs" />
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-red-500 transition shadow-xl cursor-pointer"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-red-500 transition shadow-xl cursor-pointer"
        >
          <FaChevronRight />
        </button>

        {/* py + negative margin leaves room for the hover-scale without clipping */}
        <div
          ref={rowRef}
          className={`flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x ${PAGE_PAD} py-5 -my-5`}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} variant="row" {...cardProps} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MovieGrid({ movies, cardProps }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} variant="grid" {...cardProps} />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="py-24 text-center">
      <div className="text-5xl t-muted opacity-40 mb-5 flex justify-center">{icon}</div>
      <h3 className="t-main text-xl font-bold mb-2">{title}</h3>
      {text && <p className="t-muted max-w-md mx-auto">{text}</p>}
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:scale-105 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero({ movies, index, onIndex, onTrailer, onDetails, inWatchlist, onToggleWatchlist }) {
  const movie = movies[index];
  if (!movie) return null;

  return (
    <section className="relative w-full h-[68vh] min-h-[460px] max-h-[760px] overflow-hidden select-none">
      {movies.map((m, i) => (
        <img
          key={m.id}
          src={`${IMG_HERO}${m.backdrop_path}`}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* theme-aware fades so the hero blends into the page in both themes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--bg) 0%, var(--bg) 10%, transparent 70%), linear-gradient(to right, var(--bg) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 h-full flex items-end">
        <div className={`w-full ${PAGE_PAD} pb-14 sm:pb-16`}>
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 backdrop-blur-md text-red-500 font-bold text-xs sm:text-sm">
              🔥 Trending Worldwide
            </div>

            <h1 className="t-main text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              {movie.title}
            </h1>

            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="flex items-center gap-1.5 text-yellow-500">
                <FaStar /> {movie.vote_average?.toFixed(1) || "N/A"}
              </span>
              <span className="t-muted">{movie.release_date?.split("-")[0] || ""}</span>
            </div>

            <p className="t-muted text-sm sm:text-base lg:text-lg line-clamp-3 leading-relaxed">
              {movie.overview}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onTrailer(movie)}
                className="px-6 sm:px-8 py-3.5 rounded-2xl bg-[color:var(--text)] text-[color:var(--bg)] font-extrabold flex items-center gap-3 hover:scale-105 active:scale-95 transition shadow-2xl cursor-pointer"
              >
                <FaPlay className="text-sm" /> Watch Trailer
              </button>

              <button
                onClick={() => onDetails(movie)}
                className="px-6 sm:px-8 py-3.5 rounded-2xl surface surface-hover border border-line t-main font-bold backdrop-blur-md hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                Details
              </button>

              <button
                onClick={() => onToggleWatchlist(movie)}
                title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                className={`w-12 h-12 rounded-2xl border backdrop-blur-md flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer ${
                  inWatchlist
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "surface surface-hover border-line t-main"
                }`}
              >
                {inWatchlist ? <FaCheck /> : <FaPlus />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {movies.length > 1 && (
        <div className={`absolute bottom-5 z-10 flex gap-2 left-4 sm:left-8 lg:left-12`}>
          {movies.map((m, i) => (
            <button
              key={m.id}
              onClick={() => onIndex(i)}
              aria-label={`Show ${m.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === index ? "w-8 bg-red-500" : "w-4 bg-gray-400/60 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RowSkeleton() {
  return (
    <div className="mb-10">
      <div className={`${PAGE_PAD} mb-4`}>
        <div className="h-7 w-56 rounded-lg surface animate-pulse" />
      </div>
      <div className={`flex gap-4 overflow-hidden ${PAGE_PAD}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[240px] sm:w-[280px] lg:w-[320px] aspect-video rounded-2xl surface animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function Movies() {
  const navigate = useNavigate();
  const location = useLocation();

  // view: "home" | "search" | "watchlist" | "history" | "collection"
  const [view, setView] = useState("home");
  const [collection, setCollection] = useState({ title: "", movies: [] });

  const [catalog, setCatalog] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [heroIndex, setHeroIndex] = useState(0);

  const [watchlist, setWatchlist] = useState([]);
  const [watchedHistory, setWatchedHistory] = useState([]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [resultsFor, setResultsFor] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("recent_searches"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [trailer, setTrailer] = useState(null); // { key, movie }
  const [infoMovie, setInfoMovie] = useState(null);

  const [railExpanded, setRailExpanded] = useState(false);
  const [toast, setToast] = useState("");

  const trackedRef = useRef(false);
  const searchSeq = useRef(0);
  const searchInputRef = useRef(null);
  const toastTimer = useRef(null);

  const watchlistIds = new Set(watchlist.map((m) => m.id));

  /* ── toast (replaces every alert()) ── */
  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const requireAuth = (action) => {
    if (auth.currentUser) return auth.currentUser;
    showToast(`🔒 Please log in to ${action}`);
    localStorage.setItem("auth_redirect_target", "/movies");
    setTimeout(() => navigate("/login"), 900);
    return null;
  };

  /* ── auth: runs once, loads this user's lists ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setWatchlist(readList(watchlistKey(user?.uid)));
      setWatchedHistory(readList(historyKey(user?.uid)));
    });
    return unsubscribe;
  }, []);

  /* ── catalog: loads once (previously re-ran on every location.state change) ── */
  const loadCatalog = useCallback(async () => {
    if (!API_KEY) {
      setErrorMessage("TMDB API key missing. Add VITE_TMDB_API_KEY to your environment.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    const lists = await Promise.all(CATEGORIES.map((c) => safeList(c.path, c.params)));
    const next = {};
    CATEGORIES.forEach((c, i) => {
      next[c.key] = lists[i];
    });
    setCatalog(next);

    if (lists.every((l) => l.length === 0)) {
      setErrorMessage("Couldn't load the catalog. Check your connection and try again.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  /* ── deep links from other pages: navigate("/movies", { state: { filter } }) ── */
  useEffect(() => {
    const filter = location.state?.filter;
    if (!filter) return;
    if (filter === "watchlist") setView("watchlist");
    else if (filter === "watched" || filter === "history") setView("history");
  }, [location.state]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  /* ── hero carousel ── */
  const heroMovies = (catalog.trending || []).filter((m) => m.backdrop_path).slice(0, 5);

  useEffect(() => {
    if (heroMovies.length < 2) return;
    const timer = setInterval(() => setHeroIndex((i) => (i + 1) % heroMovies.length), 8000);
    return () => clearInterval(timer);
  }, [heroMovies.length, heroIndex]);

  /* ── modals: Escape to close + lock page scroll ── */
  useEffect(() => {
    if (!trailer && !infoMovie) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setTrailer(null);
        trackedRef.current = false;
        setInfoMovie(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [trailer, infoMovie]);

  /* ───────────── actions ───────────── */

  const openDetails = (movie) => navigate(`/movie/${movie.id}`);

  const runSearch = async (term) => {
    const q = (term ?? query).trim();
    if (!q) return;
    if (!API_KEY) {
      showToast("TMDB API key missing");
      return;
    }

    setQuery(q);
    setView("search");
    setSearching(true);
    const seq = ++searchSeq.current;

    try {
      const data = await tmdb("/search/movie", `&query=${encodeURIComponent(q)}`);
      if (seq !== searchSeq.current) return; // a newer search replaced this one
      setSearchResults(data.results || []);
      setResultsFor(q);
      setHasSearched(true);

      const updated = [q, ...recentSearches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      try {
        localStorage.setItem("recent_searches", JSON.stringify(updated));
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Search failed:", err);
      if (seq === searchSeq.current) showToast("Search failed. Please try again.");
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  };

  const removeRecent = (index) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const openTrailer = async (movie) => {
    if (!movie) return;
    if (!requireAuth("watch trailers")) return;

    try {
      const data = await tmdb(`/movie/${movie.id}/videos`);
      const found = data.results?.find(
        (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
      );
      if (!found) {
        showToast("No trailer available for this title");
        return;
      }
      trackedRef.current = false;
      setTrailer({ key: found.key, movie });
    } catch (err) {
      console.error("Trailer load failed:", err);
      showToast("Couldn't load the trailer. Please try again.");
    }
  };

  const closeTrailer = () => {
    setTrailer(null);
    trackedRef.current = false;
  };

  const toggleWatchlist = (movie) => {
    const user = requireAuth("manage your Watchlist");
    if (!user) return;

    const exists = watchlist.some((m) => m.id === movie.id);
    const updated = exists ? watchlist.filter((m) => m.id !== movie.id) : [movie, ...watchlist];

    setWatchlist(updated);
    writeList(watchlistKey(user.uid), updated);
    showToast(exists ? "Removed from watchlist" : "Added to watchlist");

    syncUser({
      watchlistCount: increment(exists ? -1 : 1),
      sessionLogs: arrayUnion({
        text: exists ? `Removed "${movie.title}" from Watchlist` : `Added "${movie.title}" to Watchlist`,
        timestamp: nowTime(),
        type: exists ? "WATCHLIST_REMOVE" : "WATCHLIST",
      }),
    });
  };

  const removeFromHistory = (movie) => {
    const user = auth.currentUser;
    if (!user) return;

    const updated = watchedHistory.filter((m) => m.id !== movie.id);
    setWatchedHistory(updated);
    writeList(historyKey(user.uid), updated);
    showToast("Removed from history");

    syncUser({
      watchedCount: increment(-1),
      sessionLogs: arrayUnion({
        text: `Purged "${movie.title}" from screening logs`,
        timestamp: nowTime(),
        type: "HISTORY_PURGE",
      }),
    });
  };

  const markAsWatched = (movie) => {
    if (trackedRef.current || !movie) return; // ref guard: onPlay fires on every resume
    trackedRef.current = true;

    const user = auth.currentUser;
    if (!user) return;

    const isNew = !watchedHistory.some((m) => m.id === movie.id);
    const updated = [movie, ...watchedHistory.filter((m) => m.id !== movie.id)].slice(0, 10);
    setWatchedHistory(updated);
    writeList(historyKey(user.uid), updated);

    let genreField = "genre_other";
    if (movie.genre_ids?.includes(878)) genreField = "genre_scifi";
    else if (movie.genre_ids?.includes(28)) genreField = "genre_action";
    else if (movie.genre_ids?.includes(53)) genreField = "genre_thriller";

    const updates = {
      [genreField]: increment(1),
      sessionLogs: arrayUnion({
        text: `Watched trailer for "${movie.title}"`,
        timestamp: nowTime(),
        type: "SCREENING",
      }),
    };
    if (isNew) updates.watchedCount = increment(1);
    syncUser(updates);
  };

  /* ───────────── navigation ───────────── */

  const goHome = (scrollId) => {
    setView("home");
    if (scrollId) {
      setTimeout(
        () => document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80
      );
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const focusSearch = () => {
    setView("search");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const openCollection = (title, movies) => {
    setCollection({ title, movies });
    setView("collection");
  };

  const openWatchlist = () => {
    if (requireAuth("view your Watchlist")) setView("watchlist");
  };

  const openHistory = () => {
    if (requireAuth("view your History")) setView("history");
  };

  const navItems = [
    { id: "home", label: "Home", icon: <FaHome />, mobile: true, onClick: () => goHome() },
    { id: "search", label: "Search", icon: <FaSearch />, mobile: true, onClick: focusSearch },
    { id: "trending", label: "Trending", icon: <FaFire />, mobile: false, onClick: () => goHome("row-trending") },
    { id: "watchlist", label: "Watchlist", icon: <FaCrown />, mobile: true, onClick: openWatchlist },
    { id: "history", label: "History", icon: <FaHistory />, mobile: true, onClick: openHistory },
    { id: "dashboard", label: "Dashboard", icon: <FaRegCompass />, mobile: true, onClick: () => navigate("/performance") },
    { id: "profile", label: "My Space", icon: <FaUserCircle />, mobile: true, onClick: () => navigate("/profile") },
  ];

  const activeId = view === "collection" ? "home" : view;

  const headerTitle = {
    home: "Discover",
    search: "Search",
    watchlist: "Your Watchlist",
    history: "Watch History",
    collection: collection.title,
  }[view];

  const cardProps = {
    watchlistIds,
    onOpen: openDetails,
    onTrailer: openTrailer,
    onInfo: setInfoMovie,
    onToggleWatchlist: toggleWatchlist,
  };

  /* ───────────── render ───────────── */

  return (
    <div className="app-bg min-h-screen overflow-x-clip font-sans">
      {/* ── DESKTOP SIDE RAIL ── */}
      <aside
        onMouseEnter={() => setRailExpanded(true)}
        onMouseLeave={() => setRailExpanded(false)}
        className={`hidden md:flex fixed top-0 left-0 h-full z-50 flex-col py-6 menu-bg border-r border-line backdrop-blur-2xl transition-all duration-300 select-none ${
          railExpanded ? "w-60 px-4 shadow-2xl" : "w-16 items-center"
        }`}
      >
        <button
          onClick={() => navigate("/")}
          className={`mb-10 flex items-center gap-3 cursor-pointer ${railExpanded ? "pl-1" : ""}`}
          title="MovieMind AI"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-black">
            M
          </div>
          {railExpanded && (
            <span className="t-main font-black tracking-wide whitespace-nowrap">
              MovieMind <span className="text-red-500">AI</span>
            </span>
          )}
        </button>

        <nav className={`flex-1 flex flex-col gap-1 ${railExpanded ? "w-full" : "items-center"}`}>
          {navItems.map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                title={item.label}
                className={`flex items-center rounded-xl transition cursor-pointer ${
                  railExpanded ? "w-full px-4 py-3 gap-4 text-sm font-bold" : "w-11 h-11 justify-center text-lg"
                } ${active ? "text-red-500 surface" : "t-muted surface-hover hover:text-red-500"}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {railExpanded && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => navigate("/")}
          title="Back to site"
          className={`flex items-center t-muted hover:text-red-500 transition cursor-pointer ${
            railExpanded ? "w-full px-4 py-3 gap-4 text-xs font-bold tracking-widest" : "w-11 h-11 justify-center text-lg"
          }`}
        >
          <FaArrowLeft />
          {railExpanded && <span className="whitespace-nowrap">BACK TO SITE</span>}
        </button>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 menu-bg border-t border-line backdrop-blur-2xl flex pb-[env(safe-area-inset-bottom)]">
        {navItems
          .filter((i) => i.mobile)
          .map((item) => {
            const active = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold cursor-pointer ${
                  active ? "text-red-500" : "t-muted"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
      </nav>

      {/* ── MAIN COLUMN ── */}
      <main className="md:pl-16 pb-24 md:pb-12">
        {/* sticky top bar: title + search + theme toggle */}
        <header className="sticky top-0 z-40 nav-bg backdrop-blur-2xl border-b border-line">
          <div className={`flex items-center gap-3 ${PAGE_PAD} py-3`}>
            <h1 className="hidden sm:block t-main text-xl font-black shrink-0 max-w-[220px] truncate">
              {headerTitle}
            </h1>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
              className="relative flex-1 min-w-0 max-w-2xl sm:ml-4"
            >
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full surface border border-line rounded-2xl py-2.5 pl-10 pr-10 text-sm t-main placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}
            </form>

            <div className="ml-auto shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* ═════════ HOME ═════════ */}
        {view === "home" && (
          <>
            {isLoading ? (
              <div className="w-full h-[60vh] min-h-[420px] surface animate-pulse" />
            ) : (
              heroMovies.length > 0 && (
                <Hero
                  movies={heroMovies}
                  index={Math.min(heroIndex, heroMovies.length - 1)}
                  onIndex={setHeroIndex}
                  onTrailer={openTrailer}
                  onDetails={openDetails}
                  inWatchlist={watchlistIds.has(heroMovies[Math.min(heroIndex, heroMovies.length - 1)]?.id)}
                  onToggleWatchlist={toggleWatchlist}
                />
              )
            )}

            {errorMessage && (
              <div className={`${PAGE_PAD} mt-6`}>
                <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 flex items-center gap-4">
                  <FaExclamationTriangle className="text-2xl text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="t-main font-bold">Catalog problem</p>
                    <p className="t-muted text-sm">{errorMessage}</p>
                  </div>
                  <button
                    onClick={loadCatalog}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div className="pt-8">
              {isLoading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : (
                CATEGORIES.map((c) => (
                  <MovieRow
                    key={c.key}
                    id={`row-${c.key}`}
                    title={c.title}
                    icon={c.icon}
                    movies={catalog[c.key]}
                    onViewAll={() => openCollection(c.title, catalog[c.key] || [])}
                    cardProps={cardProps}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* ═════════ SEARCH ═════════ */}
        {view === "search" && (
          <div className={`${PAGE_PAD} py-8`}>
            {recentSearches.length > 0 && (
              <div className="mb-8 flex items-center gap-3 flex-wrap">
                <span className="t-muted text-xs font-bold uppercase tracking-wider">Recent</span>
                {recentSearches.map((term, index) => (
                  <div
                    key={term}
                    onClick={() => runSearch(term)}
                    className="flex items-center gap-2 surface surface-hover border border-line hover:border-red-500/50 pl-4 pr-2 py-1.5 rounded-full text-sm font-medium t-main cursor-pointer transition"
                  >
                    <span>{term}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(index);
                      }}
                      aria-label={`Remove ${term}`}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searching ? (
              <div className="py-24 flex justify-center">
                <FaSpinner className="animate-spin text-4xl text-red-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <h2 className="t-main text-2xl font-black mb-6">
                  Results for “{resultsFor}” <span className="t-muted font-semibold">({searchResults.length})</span>
                </h2>
                <MovieGrid movies={searchResults} cardProps={cardProps} />
              </>
            ) : hasSearched ? (
              <EmptyState
                icon={<FaSearch />}
                title="No movies found"
                text={`Nothing matched “${resultsFor}”. Try a different title or keyword.`}
              />
            ) : (
              <EmptyState
                icon={<FaSearch />}
                title="Find your next watch"
                text="Type a title above and press Enter to search the TMDB catalog."
              />
            )}
          </div>
        )}

        {/* ═════════ WATCHLIST ═════════ */}
        {view === "watchlist" && (
          <div className={`${PAGE_PAD} py-8`}>
            {watchlist.length > 0 ? (
              <>
                <h2 className="t-main text-2xl font-black mb-6">
                  {watchlist.length} saved {watchlist.length === 1 ? "title" : "titles"}
                </h2>
                <MovieGrid
                  movies={watchlist}
                  cardProps={{ ...cardProps, onRemove: toggleWatchlist, removeTitle: "Remove from watchlist" }}
                />
              </>
            ) : (
              <EmptyState
                icon={<FaCrown />}
                title="Your watchlist is empty"
                text="Tap the + on any movie to save it here."
                actionLabel="Browse movies"
                onAction={() => goHome()}
              />
            )}
          </div>
        )}

        {/* ═════════ HISTORY ═════════ */}
        {view === "history" && (
          <div className={`${PAGE_PAD} py-8`}>
            {watchedHistory.length > 0 ? (
              <>
                <h2 className="t-main text-2xl font-black mb-6">Recently watched trailers</h2>
                <MovieGrid
                  movies={watchedHistory}
                  cardProps={{ ...cardProps, onRemove: removeFromHistory, removeTitle: "Remove from history" }}
                />
              </>
            ) : (
              <EmptyState
                icon={<FaHistory />}
                title="Nothing watched yet"
                text="Trailers you watch will show up here."
                actionLabel="Browse movies"
                onAction={() => goHome()}
              />
            )}
          </div>
        )}

        {/* ═════════ COLLECTION ("View All") ═════════ */}
        {view === "collection" && (
          <div className={`${PAGE_PAD} py-8`}>
            <button
              onClick={() => goHome()}
              className="mb-6 flex items-center gap-2 t-muted hover:text-red-500 text-sm font-bold transition cursor-pointer"
            >
              <FaArrowLeft className="text-xs" /> Back to Discover
            </button>
            <h2 className="t-main text-3xl font-black mb-6">{collection.title}</h2>
            {collection.movies.length > 0 ? (
              <MovieGrid movies={collection.movies} cardProps={cardProps} />
            ) : (
              <EmptyState icon={<FaFilm />} title="Nothing to show here yet" />
            )}
          </div>
        )}
      </main>

      {/* ── TRAILER MODAL ── */}
      {trailer && (
        <div
          onClick={closeTrailer}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 border-b border-white/10">
              <span className="text-white/70 text-sm font-semibold truncate pr-4">{trailer.movie.title}</span>
              <button
                onClick={closeTrailer}
                aria-label="Close trailer"
                className="w-9 h-9 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-600 transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="relative pt-[56.25%] w-full">
              <YouTube
                videoId={trailer.key}
                className="absolute inset-0 w-full h-full"
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: { autoplay: 1, modestbranding: 1, rel: 0 },
                }}
                onPlay={() => markAsWatched(trailer.movie)}
                onEnd={() => {
                  trackedRef.current = false;
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MOVIE INFO MODAL ── */}
      {infoMovie && (
        <div
          onClick={() => setInfoMovie(null)}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto menu-bg border border-line rounded-3xl p-6 sm:p-8 shadow-2xl"
          >
            <button
              onClick={() => setInfoMovie(null)}
              aria-label="Close"
              className="absolute top-4 right-4 w-10 h-10 rounded-full surface surface-hover border border-line flex items-center justify-center t-main hover:text-red-500 transition cursor-pointer"
            >
              <FaTimes />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              {infoMovie.poster_path || infoMovie.backdrop_path ? (
                <img
                  src={`${IMG_POSTER}${infoMovie.poster_path || infoMovie.backdrop_path}`}
                  alt={infoMovie.title}
                  className="w-40 sm:w-48 h-auto sm:h-72 object-cover rounded-2xl shadow-lg self-center sm:self-start"
                />
              ) : (
                <div className="w-full sm:w-48 h-72 surface rounded-2xl flex items-center justify-center t-muted text-xs font-mono">
                  NO COVER
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h2 className="t-main text-2xl sm:text-3xl font-black mb-2 pr-10">{infoMovie.title}</h2>
                  <div className="flex items-center gap-3 text-sm t-muted mb-4">
                    <span className="flex items-center gap-1 text-yellow-500 font-bold">
                      <FaStar /> {infoMovie.vote_average?.toFixed(1) || "N/A"}
                    </span>
                    <span>•</span>
                    <span>{infoMovie.release_date || "Release unknown"}</span>
                  </div>
                  <p className="t-muted text-sm leading-relaxed mb-6 line-clamp-6">
                    {infoMovie.overview || "No overview available for this title."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const m = infoMovie;
                      setInfoMovie(null);
                      openTrailer(m);
                    }}
                    className="flex-1 min-w-[140px] py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FaPlay className="text-xs" /> Watch Trailer
                  </button>
                  <button
                    onClick={() => toggleWatchlist(infoMovie)}
                    className="px-5 py-3 surface surface-hover border border-line t-main font-bold rounded-xl transition cursor-pointer"
                  >
                    {watchlistIds.has(infoMovie.id) ? "✓ In Watchlist" : "+ Watchlist"}
                  </button>
                  <button
                    onClick={() => {
                      const m = infoMovie;
                      setInfoMovie(null);
                      openDetails(m);
                    }}
                    className="px-5 py-3 surface surface-hover border border-line t-main font-bold rounded-xl transition cursor-pointer"
                  >
                    Full details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 rounded-2xl menu-bg border border-line t-main text-sm font-semibold shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  );
}