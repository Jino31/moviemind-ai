// frontend/src/pages/MovieDetails.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlay, FaArrowLeft, FaTv, FaSpinner, FaFilm } from "react-icons/fa";

export default function MovieDetails() {
  const { id } = useParams(); // Grabs the TMDB ID straight from the router path matrix
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchMode, setWatchMode] = useState(false); // 🎬 Controls the theater curtain toggle

  // Simulated internal lookup array - Replace this with your actual TMDB / Firestore fetch loop block
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        // Example fallback object frame mapping standard parameters
        const mockMovieData = {
          id: id,
          title: "Leo",
          overview: "A mild-mannered cafe owner becomes a local hero through an act of violence, triggering old scores and hidden pasts.",
          poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500",
          backdrop_path: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
          release_date: "2023-10-19",
          vote_average: "8.4"
        };
        setMovie(mockMovieData);
      } catch (err) {
        console.error("Failed to parse movie resource:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center text-white">
        <FaSpinner className="animate-spin text-4xl text-pink-500" />
      </div>
    );
  }

  // 🤖 STREAMING ENGINE ROUTE LINK RESOLVER
  // vidsrc provides automatic, zero-config high-speed media resolution over basic catalog string IDs
  const streamingUrl = `https://vidsrc.to/embed/movie/${id}`;

  return (
    <div className="min-h-screen bg-[#04040a] text-white font-sans antialiased relative pb-16">
      
      {/* Dynamic Background Backdrop Aura Panel */}
      <div 
        className="absolute top-0 left-0 w-full h-[60vh] bg-cover bg-center opacity-15 blur-sm pointer-events-none"
        style={{ backgroundImage: `url(${movie?.backdrop_path})` }}
      />
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-transparent to-[#04040a] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        
        {/* Navigation Action Strip */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <FaArrowLeft className="text-[10px]" /> Back to Discovery
        </button>

        {/* ── 🎬 REAL-TIME THEATER ENGINE CONTAINER ── */}
        {watchMode ? (
          <div className="w-full bg-black border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-pink-500/5 animate-fade-in mb-12">
            
            {/* Control Bar strip */}
            <div className="bg-[#0b0b14] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-widest text-white/60 uppercase">
                  Streaming Source Node Alpha — {movie?.title}
                </span>
              </div>
              <button 
                onClick={() => setWatchMode(false)}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-red-500 text-[11px] font-bold transition cursor-pointer"
              >
                Close Media Core
              </button>
            </div>

            {/* Video IFrame viewport sandbox matrix */}
            <div className="relative w-full aspect-video bg-neutral-950">
              <iframe
                src={streamingUrl}
                title={`MovieMind AI Streaming Interface - ${movie?.title}`}
                className="absolute top-0 left-0 w-full h-full border-0"
                allowFullScreen
                scrolling="no"
                allow="autoplay; encrypted-media; picture-in-picture"
                sandbox="allow-forms allow-popper-menus allow-same-origin allow-scripts allow-top-navigation"
              />
            </div>
          </div>
        ) : null}

        {/* ── MOVIE INFO PRESENTATION PANEL ── */}
        <div className="flex flex-col md:flex-row gap-8 items-start bg-[#0b0b14]/40 border border-white/[0.04] backdrop-blur-2xl p-8 rounded-[36px]">
          
          {/* Left Hand Image Column */}
          <div className="w-full md:w-64 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
            <img 
              src={movie?.poster_path} 
              alt={movie?.title} 
              className="w-full h-auto object-cover group-hover:scale-105 transition duration-500" 
            />
          </div>

          {/* Right Hand Meta Details Content Column */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono text-[10px] font-bold tracking-wider uppercase">
                  Rating: {movie?.vote_average} ★
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/40 font-mono text-[10px] tracking-wider uppercase">
                  Released: {movie?.release_date}
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                {movie?.title}
              </h2>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed max-w-3xl">
              {movie?.overview}
            </p>

            {/* ACTION TRIGGERS BAR */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/[0.05]">
              
              {/* ✅ STREAM TRIGGER BUTTON */}
              <button
                onClick={() => setWatchMode(true)}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_0_30px_rgba(236,72,153,0.25)] hover:shadow-[0_0_40px_rgba(236,72,153,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2.5 cursor-pointer"
              >
                <FaPlay className="text-[10px]" /> Instant Watch Engine
              </button>

              <button className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2">
                <FaTv /> Stream Trailer
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}