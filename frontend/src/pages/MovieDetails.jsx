// src/pages/MovieDetails.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, increment, arrayUnion } from "firebase/firestore";
import {
  FaPlay,
  FaPlus,
  FaCheck,
  FaArrowLeft,
  FaSpinner,
  FaStar,
  FaCalendarAlt,
  FaClock,
  FaTimes,
  FaExternalLinkAlt,
  FaExclamationTriangle,
  FaTv,
} from "react-icons/fa";
import YouTube from "react-youtube";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

/* ───────────────────────── CONFIG ───────────────────────── */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// In production the calls go through the Vercel rewrites in vercel.json
// (works even when a network blocks api.themoviedb.org).
const PROXY = import.meta.env.PROD;
const TMDB = PROXY ? "/tmdb" : "https://api.themoviedb.org/3";
const IMG = PROXY ? "/tmdb-img" : "https://image.tmdb.org/t/p";

// Video languages to request (English + major Indian languages + language-neutral)
const VIDEO_LANGS = "en,hi,ta,te,ml,kn,null";

const REGIONS = [
  ["IN", "India"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
];

const PROVIDER_GROUPS = [
  { key: "flatrate", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "ads", label: "Free with ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

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

const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

// Best video first: official trailer, trailer, teaser, then clip / featurette
const videoRank = (v) =>
  ({ Trailer: 0, Teaser: 1, Clip: 2, Featurette: 3 }[v.type] ?? 4) * 2 + (v.official ? 0 : 1);

// setDoc + merge works even if the user document doesn't exist yet
async function syncUser(updates) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await setDoc(doc(db, "users", user.uid), updates, { merge: true });
  } catch (error) {
    console.error("Firestore sync failed:", error);
  }
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const [user, setUser] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [region, setRegion] = useState(() => {
    try {
      return localStorage.getItem("watch_region") || "IN";
    } catch {
      return "IN";
    }
  });

  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const trackedRef = useRef(false);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ── auth ── */
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    const list = readList(watchlistKey(user?.uid));
    setInWatchlist(list.some((m) => String(m.id) === String(id)));
  }, [user, id]);

  /* ── load movie (details + videos + watch providers in ONE request) ── */
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setTrailerOpen(false);

    if (!API_KEY) {
      setError("TMDB API key missing. Add VITE_TMDB_API_KEY to your environment.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    (async () => {
      try {
        const res = await fetch(
          `${TMDB}/movie/${id}?api_key=${API_KEY}&append_to_response=videos,watch/providers&include_video_language=${VIDEO_LANGS}`,
          { signal: controller.signal }
        );
        if (res.status === 404) throw new Error("NOT_FOUND");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMovie(await res.json());
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Movie load failed:", err);
        setError(
          err.message === "NOT_FOUND"
            ? "We couldn't find that movie."
            : "Couldn't reach the movie database. Check your connection and try again."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, attempt]);

  /* ── trailer modal: Escape + scroll lock ── */
  useEffect(() => {
    if (!trailerOpen) return;
    const onKey = (e) => e.key === "Escape" && setTrailerOpen(false);
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [trailerOpen]);

  /* ───────────── derived data ───────────── */

  const videos = movie?.videos?.results || [];
  const ytVideos = videos.filter((v) => v.site === "YouTube");
  const trailer = [...ytVideos].sort((a, b) => videoRank(a) - videoRank(b))[0] || null;

  const providersByRegion = movie?.["watch/providers"]?.results || {};
  const regionData = providersByRegion[region] || null;
  const providerGroups = regionData
    ? PROVIDER_GROUPS.map((g) => ({ ...g, list: regionData[g.key] || [] })).filter((g) => g.list.length > 0)
    : [];

  const year = movie?.release_date ? movie.release_date.split("-")[0] : "—";
  const runtime = formatRuntime(movie?.runtime);

  /* ───────────── actions ───────────── */

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/movies");
  };

  const openTrailer = () => {
    if (!user) {
      showToast("🔒 Please log in to watch trailers");
      localStorage.setItem("auth_redirect_target", `/movie/${id}`);
      setTimeout(() => navigate("/login"), 900);
      return;
    }
    if (!trailer) {
      // No video on TMDB: fall back to a YouTube search so the button is never a dead end
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${movie?.title || ""} ${movie?.release_date?.slice(0, 4) || ""} official trailer`
        )}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    trackedRef.current = false;
    setTrailerOpen(true);
  };

  const closeTrailer = () => {
    setTrailerOpen(false);
    trackedRef.current = false;
  };

  const toMovieEntry = () => ({
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    genre_ids: (movie.genres || []).map((g) => g.id),
  });

  const toggleWatchlist = () => {
    if (!user) {
      showToast("🔒 Please log in to manage your Watchlist");
      localStorage.setItem("auth_redirect_target", `/movie/${id}`);
      setTimeout(() => navigate("/login"), 900);
      return;
    }

    const key = watchlistKey(user.uid);
    const list = readList(key);
    const exists = list.some((m) => m.id === movie.id);
    const updated = exists ? list.filter((m) => m.id !== movie.id) : [toMovieEntry(), ...list];

    writeList(key, updated);
    setInWatchlist(!exists);
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

  const markAsWatched = () => {
    if (trackedRef.current || !movie || !user) return; // onPlay fires on every resume
    trackedRef.current = true;

    const key = historyKey(user.uid);
    const history = readList(key);
    const isNew = !history.some((m) => m.id === movie.id);
    const entry = toMovieEntry();
    writeList(key, [entry, ...history.filter((m) => m.id !== movie.id)].slice(0, 10));

    const genreIds = entry.genre_ids;
    let genreField = "genre_other";
    if (genreIds.includes(878)) genreField = "genre_scifi";
    else if (genreIds.includes(28)) genreField = "genre_action";
    else if (genreIds.includes(53)) genreField = "genre_thriller";

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

  const changeRegion = (value) => {
    setRegion(value);
    try {
      localStorage.setItem("watch_region", value);
    } catch {
      // ignore
    }
  };

  /* ───────────── shared top bar ───────────── */

  const TopBar = ({ title }) => (
    <header className="sticky top-0 z-40 nav-bg backdrop-blur-2xl border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={goBack}
          aria-label="Go back"
          className="shrink-0 h-11 px-3 sm:px-4 rounded-2xl surface surface-hover border border-line t-main font-bold text-sm flex items-center gap-2 transition hover:text-red-500 active:scale-95 cursor-pointer"
        >
          <FaArrowLeft className="text-xs" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <p className="flex-1 min-w-0 t-main font-black text-base sm:text-lg truncate">{title}</p>

        <button
          onClick={() => navigate("/movies")}
          className="hidden sm:flex shrink-0 h-11 px-4 rounded-2xl surface surface-hover border border-line t-main font-bold text-sm items-center gap-2 transition hover:text-red-500 cursor-pointer"
        >
          <FaTv className="text-xs" /> Discover
        </button>

        <ThemeToggle />
      </div>
    </header>
  );

  /* ───────────── loading / error ───────────── */

  if (loading) {
    return (
      <div className="app-bg min-h-screen font-sans">
        <TopBar title="Loading…" />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-red-500" />
          <p className="t-muted text-xs tracking-widest uppercase">Loading movie details</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="app-bg min-h-screen font-sans">
        <TopBar title="Movie details" />
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <FaExclamationTriangle className="text-4xl text-red-500" />
          <h2 className="t-main text-xl font-bold">Couldn't load this movie</h2>
          <p className="t-muted text-sm max-w-md">{error || "Something went wrong."}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setAttempt((a) => a + 1)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:scale-105 transition cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={goBack}
              className="px-6 py-3 rounded-2xl surface surface-hover border border-line t-main font-bold text-sm transition cursor-pointer"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────── page ───────────── */

  return (
    <div className="app-bg min-h-screen overflow-x-clip font-sans">
      <TopBar title={movie.title} />

      {/* blurred backdrop that fades into the page background */}
      {movie.backdrop_path && (
        <div className="absolute top-0 left-0 w-full h-[75vh] overflow-hidden pointer-events-none">
          <img
            src={`${IMG}/w1280${movie.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover opacity-25 blur-sm scale-105"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 0%, var(--bg) 85%)" }}
          />
        </div>
      )}

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* ── main card ── */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start surface backdrop-blur-3xl border border-line p-6 sm:p-8 md:p-10 rounded-[32px] shadow-2xl">
          <div className="w-48 sm:w-60 md:w-72 shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden border border-line shadow-2xl surface">
            {movie.poster_path ? (
              <img src={`${IMG}/w500${movie.poster_path}`} alt={movie.title} className="w-full h-auto object-cover" />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center t-muted font-mono text-xs">
                No cover
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-600 font-bold text-xs flex items-center gap-1.5">
                  <FaStar className="text-[10px]" /> {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                  <span className="font-medium opacity-70">({movie.vote_count || 0})</span>
                </span>
                <span className="px-3 py-1.5 rounded-lg surface border border-line t-muted text-xs font-semibold flex items-center gap-1.5">
                  <FaCalendarAlt className="text-[10px]" /> {year}
                </span>
                {runtime && (
                  <span className="px-3 py-1.5 rounded-lg surface border border-line t-muted text-xs font-semibold flex items-center gap-1.5">
                    <FaClock className="text-[10px]" /> {runtime}
                  </span>
                )}
              </div>

              <h1 className="t-main text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                {movie.title}
              </h1>

              {movie.tagline && <p className="t-muted italic mt-2">{movie.tagline}</p>}

              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {movie.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-3 py-1 rounded-full surface border border-line t-muted text-xs font-semibold"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="t-muted text-sm sm:text-base leading-relaxed max-w-3xl">
              {movie.overview || "No overview available for this title."}
            </p>

            <div className="flex flex-wrap gap-3 pt-5 border-t border-line">
              <button
                onClick={openTrailer}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-black text-sm shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <FaPlay className="text-xs" /> {trailer ? "Watch Trailer" : "Search trailer"}
              </button>

              <button
                onClick={toggleWatchlist}
                className={`px-6 py-3.5 rounded-2xl border font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
                  inWatchlist
                    ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
                    : "surface surface-hover border-line t-main"
                }`}
              >
                {inWatchlist ? <FaCheck className="text-xs" /> : <FaPlus className="text-xs" />}
                {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </button>

              {movie.homepage && (
                <a
                  href={movie.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl surface surface-hover border border-line t-main font-bold text-sm transition flex items-center gap-2"
                >
                  Official site <FaExternalLinkAlt className="text-[10px]" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── where to watch ── */}
        <section className="mt-8 surface border border-line rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="t-main text-2xl font-black">Where to watch</h2>
              <p className="t-muted text-sm mt-1">Legal streaming, rental and purchase options.</p>
            </div>

            <label className="flex items-center gap-2 text-sm t-muted font-semibold">
              Region
              <select
                value={region}
                onChange={(e) => changeRegion(e.target.value)}
                className="h-10 px-3 rounded-xl surface border border-line t-main text-sm font-semibold focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {REGIONS.map(([code, name]) => (
                  <option key={code} value={code} className="text-black">
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {providerGroups.length > 0 ? (
            <div className="space-y-6">
              {providerGroups.map((group) => (
                <div key={group.key}>
                  <h3 className="t-muted text-xs font-bold uppercase tracking-wider mb-3">{group.label}</h3>
                  <div className="flex flex-wrap gap-3">
                    {group.list.map((p) => (
                      <a
                        key={p.provider_id}
                        href={regionData.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${p.provider_name} — open on JustWatch`}
                        className="flex items-center gap-3 pr-4 pl-2 py-2 rounded-2xl surface surface-hover border border-line hover:border-red-500/50 transition"
                      >
                        {p.logo_path ? (
                          <img
                            src={`${IMG}/w92${p.logo_path}`}
                            alt=""
                            loading="lazy"
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="w-10 h-10 rounded-xl surface" />
                        )}
                        <span className="t-main text-sm font-semibold">{p.provider_name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="t-muted text-sm py-4">
              No streaming, rental or purchase options are listed for this title in{" "}
              {REGIONS.find(([c]) => c === region)?.[1] || region} right now. Try another region.
            </p>
          )}

          <p className="t-muted text-xs mt-6 opacity-70">
            Streaming availability data provided by JustWatch via TMDB.
          </p>
        </section>
      </main>

      <Footer />

      {/* ── trailer modal ── */}
      {trailerOpen && trailer && (
        <div
          onClick={closeTrailer}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 border-b border-white/10">
              <span className="text-white/70 text-sm font-semibold truncate pr-4">{movie.title}</span>
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
                onPlay={markAsWatched}
                onEnd={() => {
                  trackedRef.current = false;
                }}
                onError={() => {
                  closeTrailer();
                  showToast("This video can't be played here. Try the YouTube search instead.");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── toast ── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 rounded-2xl menu-bg border border-line t-main text-sm font-semibold shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  );
}