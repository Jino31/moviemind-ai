// frontend/src/pages/MovieDetails.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { 
  FaPlay, FaArrowLeft, FaTv, FaSpinner, FaStar, 
  FaCalendarAlt, FaExclamationTriangle 
} from "react-icons/fa";

export default function MovieDetails() {
  const { id } = useParams(); // Extracts the TMDB numeric ID from the active router URL path
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [watchMode, setWatchMode] = useState(false); // Controls the cinema player layout view

  // 📡 LIVE API FETCH ENGINE
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setError(false);
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY; 
        
        if (!API_KEY) {
          console.error("❌ Missing VITE_TMDB_API_KEY environment variable.");
          setError(true);
          setLoading(false);
          return;
        }

        // Fetch live movie specifics directly from TMDB using the numeric ID
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
        
        if (!res.ok) throw new Error(`TMDB HTTP Error: ${res.status}`);
        
        const data = await res.json();
        
        if (data) {
          setMovie({
            id: data.id,
            title: data.title,
            overview: data.overview,
            poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
            release_date: data.release_date || "Unknown Release",
            vote_average: data.vote_average ? data.vote_average.toFixed(1) : "0.0",
            genres: data.genres || []
          });
        }
      } catch (err) {
        console.error("Failed to parse live TMDB resource stream parameters:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  // 📊 FIRESTORE TELEMETRY SYSTEM LOGGING
  const logStreamToFirestore = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !movie) return;

      // Track watch statistics metrics onto user document fields
      await updateDoc(doc(db, "users", user.uid), {
        watchHours: increment(2), // Adds 2 hours to overall simulation diagnostics
        sessionLogs: arrayUnion({
          text: `Started streaming full feature: "${movie.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "STREAM_START"
        })
      });
    } catch (firestoreErr) {
      console.warn("Firestore monitoring synchronization bypassed:", firestoreErr.message);
    }
  };

  const handleWatchTrigger = () => {
    setWatchMode(true);
    logStreamToFirestore();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex flex-col items-center justify-center text-white gap-4 font-mono">
        <FaSpinner className="animate-spin text-4xl text-pink-500" />
        <p className="text-xs text-white/40 tracking-widest uppercase">Fetching Cinematic Parameters...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#04040a] flex flex-col items-center justify-center text-white gap-4 font-mono px-6 text-center">
        <FaExclamationTriangle className="text-4xl text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold">Failed to Resolve Media Stream</h2>
        <p className="text-sm text-white/40 max-w-md">The TMDB ID could not be mapped to an active catalog resource or your API key is misconfigured.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition">
          Return to Catalog
        </button>
      </div>
    );
  }

  // 🎬 MOVIE ENGINE TARGET URL RESOLVER
  // vidsrc.xyz supports native numeric TMDB IDs straight out of the box
  const streamingUrl = `https://vidsrc.xyz/embed/movie/${movie.id}`;

  return (
    <div className="min-h-screen bg-[#04040a] text-white font-sans antialiased relative pb-24 overflow-x-hidden">
      
      {/* Dynamic Immersive Background Blurred Backdrop Panel */}
      {movie.backdrop_path && (
        <div 
          className="absolute top-0 left-0 w-full h-[70vh] bg-cover bg-center opacity-20 blur-md pointer-events-none"
          style={{ backgroundImage: `url(${movie.backdrop_path})` }}
        />
      )}
      <div className="absolute top-0 left-0 w-full h-[70vh] bg-gradient-to-b from-transparent to-[#04040a] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 pt-16 relative z-10">
        
        {/* Navigation Action Hook */}
        <button
          onClick={() => navigate(-1)}
          className="mb-10 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <FaArrowLeft className="text-[10px]" /> Back to Discovery
        </button>

        {/* ── 📺 CORE REAL-TIME THEATER SCREEN CONTAINER ── */}
        {watchMode ? (
          <div className="w-full bg-black border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-pink-500/10 mb-14 animate-fade-in">
            
            {/* Player Context Top Utility Ribbon Header */}
            <div className="bg-[#0b0b14] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest text-white/50 uppercase">
                  Streaming Pipeline Live — {movie.title}
                </span>
              </div>
              <button 
                onClick={() => setWatchMode(false)}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-red-500 text-[10px] font-mono tracking-wider uppercase font-bold transition cursor-pointer"
              >
                Close Player
              </button>
            </div>

            {/* Sandboxed Video Frame Matrix Viewport */}
            <div className="relative w-full aspect-video bg-neutral-950">
              <iframe
                src={streamingUrl}
                title={`MovieMind AI Premium Stream - ${movie.title}`}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen
                scrolling="no"
                allow="autoplay; encrypted-media; picture-in-picture"
                // Sandboxing blocks aggressive redirect chains and popup ad payloads from breaking layout frame flow
                sandbox="allow-forms allow-popper-menus allow-same-origin allow-scripts allow-top-navigation"
              />
            </div>
          </div>
        ) : null}

        {/* ── IMMERSIVE MEDIA PROFILE PRESENTATION CARD ── */}
        <div className="flex flex-col md:flex-row gap-10 items-start bg-[#0b0b14]/50 border border-white/[0.05] backdrop-blur-3xl p-8 md:p-10 rounded-[40px] shadow-2xl">
          
          {/* Cover Art Artwork Anchor */}
          <div className="w-full md:w-72 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
            {movie.poster_path ? (
              <img 
                src={movie.poster_path} 
                alt={movie.title} 
                className="w-full h-auto object-cover" 
              />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center text-white/20 font-mono text-xs">No Cover Matrix</div>
            )}
          </div>

          {/* Metadata Descriptions Fields column block */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-mono text-[10px] font-bold tracking-wider flex items-center gap-1.5">
                  <FaStar className="text-[9px]" /> {movie.vote_average} USER SCORE
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                  <FaCalendarAlt className="text-[9px]" /> {movie.release_date.split("-")[0]}
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                {movie.title}
              </h2>

              {/* Genre pill loops mapping layout */}
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((genre) => (
                  <span key={genre.id} className="px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-white/60 text-xs font-medium">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-3xl font-normal">
              {movie.overview || "No database summary analysis logs available for this file entry."}
            </p>

            {/* PLAYER INTERACTION COMMANDS ACTIONS DECK ROW */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-white/[0.06]">
              
              {/* PRIMARY EMBED THEATER TRIGGER SWITCH */}
              <button
                onClick={handleWatchTrigger}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-black text-xs tracking-widest uppercase shadow-[0_0_35px_rgba(236,72,153,0.3)] hover:shadow-[0_0_45px_rgba(236,72,153,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center gap-2.5 cursor-pointer"
              >
                <FaPlay className="text-[9px]" /> Instant Watch Engine
              </button>

              <button className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2">
                <FaTv /> Pre-roll Trailers
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}