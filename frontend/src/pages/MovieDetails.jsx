// src/pages/MovieDetails.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { auth, db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { 
  FaPlay, FaArrowLeft, FaStar, 
  FaCalendarAlt, FaExclamationTriangle, FaClock, 
  FaGlobe, FaRedo, FaFilm, FaTimes 
} from "react-icons/fa";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── State Management ──
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(false);

  // ── Refs & Locks ──
  const sessionLoggedRef = useRef(false);
  const closeButtonRef = useRef(null);

  // ── 1. Validate TMDB Numeric ID ──
  const isValidMovieId = Boolean(id && /^\d+$/.test(id) && parseInt(id, 10) > 0);

  // ── 2. Data Fetching Strategy ──
  const fetchMovieDetails = useCallback(async () => {
    if (!isValidMovieId) {
      setError("Invalid Movie Identifier. Please select a valid movie from the catalog.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    if (!API_KEY) {
      setError("TMDB API Key is missing. Check environment configuration.");
      setLoading(false);
      return;
    }

    try {
      // Fetch core details + videos in a single request
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=videos`
      );

      if (!res.ok) {
        if (res.status === 404) throw new Error("Movie not found in the catalog database.");
        throw new Error(`TMDB Server Error (Code: ${res.status})`);
      }

      const data = await res.json();

      if (!data || !data.id) {
        throw new Error("Malformed dataset received from provider.");
      }

      // Safe Release Year Extraction
      let releaseYear = "N/A";
      if (typeof data.release_date === "string" && data.release_date.trim() !== "") {
        const parts = data.release_date.split("-");
        if (parts[0] && parts[0].length === 4) releaseYear = parts[0];
      }

      // Extract Official YouTube Trailer
      let foundTrailerKey = null;
      if (data.videos && Array.isArray(data.videos.results)) {
        const trailerObj = data.videos.results.find(
          (vid) =>
            vid.site === "YouTube" &&
            (vid.type === "Trailer" || vid.type === "Teaser") &&
            vid.key
        ) || data.videos.results.find((vid) => vid.site === "YouTube" && vid.key);

        if (trailerObj) foundTrailerKey = trailerObj.key;
      }

      setMovie({
        id: data.id,
        title: data.title || "Untitled Production",
        overview: data.overview || "No plot summary is currently available for this title.",
        poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
        backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
        releaseYear,
        runtime: data.runtime && data.runtime > 0 ? `${data.runtime} min` : "N/A",
        vote_average: typeof data.vote_average === "number" && data.vote_average > 0 ? data.vote_average.toFixed(1) : "N/A",
        vote_count: data.vote_count ? data.vote_count.toLocaleString() : null,
        genres: Array.isArray(data.genres) ? data.genres : [],
        original_language: data.original_language ? data.original_language.toUpperCase() : "N/A",
        popularity: data.popularity ? Math.round(data.popularity) : null
      });

      setTrailerKey(foundTrailerKey);
    } catch (err) {
      console.error("Movie Details Fetch Error:", err);
      setError(err.message || "Failed to establish stream connection. Please check network settings.");
    } finally {
      setLoading(false);
    }
  }, [id, isValidMovieId]);

  useEffect(() => {
    fetchMovieDetails();
    sessionLoggedRef.current = false; // Reset lock on route change
  }, [fetchMovieDetails]);

  // ── 3. Single-Session Telemetry Logger ──
  const logStreamStartToFirestore = async () => {
    if (sessionLoggedRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user || !movie) return;

      sessionLoggedRef.current = true; // Lock session guard

      await updateDoc(doc(db, "users", user.uid), {
        sessionLogs: arrayUnion({
          text: `Started watching official trailer for "${movie.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "MOVIE_WATCH_START",
          movieId: movie.id
        })
      });
    } catch (firestoreErr) {
      console.warn("Firestore logging bypassed safely:", firestoreErr.message);
    }
  };

  // ── 4. Player Control Lifecycle ──
  const handleOpenPlayer = () => {
    if (!trailerKey) return;
    setIsPlayerOpen(true);
    setTrailerLoading(true);
    logStreamStartToFirestore();
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setTrailerLoading(false);
  };

  // Accessibility: Handle Escape key & Modal Focus Trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPlayerOpen) {
        handleClosePlayer();
      }
    };

    if (isPlayerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlayerOpen]);

  // ── 5. Skeleton Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#04040a] text-white font-sans antialiased relative overflow-hidden pb-24">
        <div className="max-w-6xl mx-auto px-6 pt-16 relative z-10 animate-pulse">
          <div className="w-36 h-10 bg-white/5 rounded-xl mb-10" />
          <div className="flex flex-col md:flex-row gap-10 items-start bg-[#0b0b14]/50 border border-white/[0.05] p-8 md:p-10 rounded-[40px]">
            <div className="w-full md:w-72 h-[400px] shrink-0 rounded-2xl bg-white/10" />
            <div className="flex-1 space-y-6 w-full">
              <div className="flex gap-3">
                <div className="w-24 h-6 bg-white/10 rounded-lg" />
                <div className="w-20 h-6 bg-white/10 rounded-lg" />
              </div>
              <div className="w-3/4 h-12 bg-white/10 rounded-xl" />
              <div className="flex gap-2">
                <div className="w-16 h-6 bg-white/5 rounded-md" />
                <div className="w-20 h-6 bg-white/5 rounded-md" />
                <div className="w-16 h-6 bg-white/5 rounded-md" />
              </div>
              <div className="space-y-3 pt-4">
                <div className="w-full h-4 bg-white/5 rounded" />
                <div className="w-full h-4 bg-white/5 rounded" />
                <div className="w-2/3 h-4 bg-white/5 rounded" />
              </div>
              <div className="pt-6 flex gap-4">
                <div className="w-48 h-14 bg-white/10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 6. Interactive Error State ──
  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#04040a] flex flex-col items-center justify-center text-white gap-5 font-sans px-6 text-center antialiased">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-2xl shadow-lg shadow-red-500/5">
          <FaExclamationTriangle />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Unable to Load Media Stream</h2>
        <p className="text-sm text-neutral-400 max-w-md leading-relaxed">{error || "Catalog entry unavailable."}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            onClick={fetchMovieDetails}
            className="px-6 py-3 rounded-xl bg-pink-500/20 border border-pink-500/30 hover:bg-pink-500/30 text-pink-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            aria-label="Retry loading movie details"
          >
            <FaRedo className="text-[10px]" /> Retry Connection
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs font-bold transition-all cursor-pointer active:scale-95"
            aria-label="Return to catalog page"
          >
            Return to Discovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04040a] text-white font-sans antialiased relative pb-24 overflow-x-hidden selection:bg-pink-500 selection:text-white">
      
      {/* ── Background Backdrop Layer ── */}
      {movie.backdrop_path ? (
        <div 
          className="absolute top-0 left-0 w-full h-[75vh] bg-cover bg-center opacity-25 blur-xl pointer-events-none transform scale-105 transition-transform duration-1000 motion-reduce:transform-none motion-reduce:transition-none"
          style={{ backgroundImage: `url(${movie.backdrop_path})` }}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-[75vh] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
      )}
      <div className="absolute top-0 left-0 w-full h-[75vh] bg-gradient-to-b from-[#04040a]/20 via-[#04040a]/80 to-[#04040a] pointer-events-none" aria-hidden="true" />

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-6 pt-12 md:pt-16 relative z-10">
        
        {/* Navigation Action Hook */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 md:mb-10 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          aria-label="Navigate back to previous page"
        >
          <FaArrowLeft className="text-[10px]" /> Back to Discovery
        </button>

        {/* ── IMMERSIVE MEDIA PROFILE PRESENTATION CARD ── */}
        <article className="flex flex-col md:flex-row gap-8 md:gap-10 items-start bg-[#0b0b14]/60 border border-white/[0.08] backdrop-blur-2xl p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl shadow-black/80">
          
          {/* Cover Art Artwork Anchor */}
          <div className="w-full sm:w-64 md:w-72 shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group relative">
            {movie.poster_path ? (
              <img 
                src={movie.poster_path} 
                alt={`${movie.title} official poster`} 
                className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                loading="eager"
              />
            ) : (
              <div className="w-full aspect-[2/3] flex flex-col items-center justify-center gap-3 text-neutral-500 bg-neutral-900/80 p-6 text-center">
                <FaFilm className="text-3xl text-neutral-600" />
                <span className="font-mono text-xs uppercase tracking-wider">Poster Unavailable</span>
              </div>
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
          </div>

          {/* Metadata Block */}
          <div className="flex-1 space-y-6 w-full">
            
            <header className="space-y-3">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-mono text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                  <FaStar className="text-[10px]" /> {movie.vote_average} TMDB SCORE
                </span>

                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 font-mono text-[11px] tracking-wider flex items-center gap-1.5">
                  <FaCalendarAlt className="text-[10px]" /> {movie.releaseYear}
                </span>

                {movie.runtime !== "N/A" && (
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 font-mono text-[11px] tracking-wider flex items-center gap-1.5">
                    <FaClock className="text-[10px]" /> {movie.runtime}
                  </span>
                )}

                {movie.original_language !== "N/A" && (
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 font-mono text-[11px] tracking-wider flex items-center gap-1.5">
                    <FaGlobe className="text-[10px]" /> {movie.original_language}
                  </span>
                )}
              </div>
              
              {/* Movie Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {movie.title}
              </h1>

              {/* Genre Pills */}
              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1" aria-label="Genres">
                  {movie.genres.map((genre) => (
                    <span 
                      key={genre.id || genre.name} 
                      className="px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs font-medium tracking-wide hover:bg-white/[0.08] transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Overview */}
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl font-normal">
              {movie.overview}
            </p>

            {/* Player Trigger Options */}
            <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/[0.08]">
              {trailerKey ? (
                <button
                  onClick={handleOpenPlayer}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-black text-xs tracking-widest uppercase shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400"
                  aria-label={`Watch official trailer for ${movie.title}`}
                >
                  <FaPlay className="text-[10px]" /> Watch Official Trailer
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white/40 font-bold text-xs tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
                  aria-disabled="true"
                >
                  <FaFilm className="text-xs" /> Trailer Unavailable
                </button>
              )}
            </div>

          </div>
        </article>
      </main>

      {/* ── 7. CINEMATIC PLAYER MODAL ── */}
      {isPlayerOpen && trailerKey && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Dark Glass Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" 
            onClick={handleClosePlayer}
            aria-hidden="true"
          />

          {/* Player Shell Container */}
          <div className="relative w-full max-w-5xl bg-[#0b0b14] border border-white/15 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/10 z-10 flex flex-col transform transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#07070d]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" aria-hidden="true" />
                <h2 id="modal-title" className="text-xs font-mono font-bold tracking-widest text-white/80 uppercase truncate max-w-xs sm:max-w-md">
                  Official Trailer — {movie.title}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                onClick={handleClosePlayer}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500"
                aria-label="Close trailer player"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {/* Video Player Viewport */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {trailerLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-pink-400 font-mono text-xs z-0">
                  <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span>INITIALIZING STREAM...</span>
                </div>
              )}
              
              <YouTube
                videoId={trailerKey}
                className="w-full h-full relative z-10"
                iframeClassName="w-full h-full border-0"
                onReady={() => setTrailerLoading(false)}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0
                  }
                }}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}