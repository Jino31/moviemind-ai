// src/components/MovieTrailerModal.jsx
// Shared trailer popup.
//  • Desktop (md+): the same centered card as before.
//  • Phones: a full-screen black sheet. The video is edge-to-edge (so the black
//    bars of widescreen trailers blend in) with the language picker and movie
//    info underneath instead of a cramped header.

import { FaPlay, FaPlus, FaCheck, FaStar, FaTimes } from "react-icons/fa";
import YouTube from "react-youtube";
import AmbientGlow from "./AmbientGlow";
import TrailerLanguageSelect from "./TrailerLanguageSelect";

export default function MovieTrailerModal({
  movie,
  options,
  videoKey,
  onKeyChange,
  onClose,
  onPlay,
  onEnd,
  onError,
  inWatchlist,
  onToggleWatchlist,
  onDetails, // optional: shows a "Full details" button on phones
}) {
  const year = movie?.release_date?.split("-")[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black md:bg-black/90 md:backdrop-blur-xl overflow-y-auto flex md:items-center md:justify-center md:p-10"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative w-full md:max-w-5xl h-fit md:my-auto">
        <div className="hidden md:block">
          <AmbientGlow videoKey={videoKey} />
        </div>

        <div className="relative z-10 bg-black md:border md:border-white/10 md:rounded-3xl overflow-hidden md:shadow-2xl">
          {/* header */}
          <div className="flex items-center justify-between gap-3 pl-4 pr-3 md:px-5 py-2.5 md:py-3 pt-[calc(0.625rem+env(safe-area-inset-top))] md:pt-3 bg-zinc-950 border-b border-white/10">
            <span className="flex-1 min-w-0 text-white/80 md:text-white/70 text-sm font-semibold truncate md:pr-4">
              {movie?.title}
            </span>

            <div className="hidden md:block">
              <TrailerLanguageSelect options={options} value={videoKey} onChange={onKeyChange} />
            </div>

            <button
              onClick={onClose}
              aria-label="Close trailer"
              className="w-10 h-10 md:w-9 md:h-9 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-600 active:bg-red-600 transition cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          {/* player */}
          <div className="relative pt-[56.25%] w-full bg-black">
            <YouTube
              videoId={videoKey}
              className="absolute inset-0 w-full h-full"
              opts={{
                width: "100%",
                height: "100%",
                playerVars: { autoplay: 1, modestbranding: 1, rel: 0, playsinline: 1 },
              }}
              onPlay={onPlay}
              onEnd={onEnd}
              onError={onError}
            />
          </div>

          {/* phones only: language + movie info + actions */}
          <div className="md:hidden px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4">
            {options?.length > 1 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Trailer language</span>
                <TrailerLanguageSelect options={options} value={videoKey} onChange={onKeyChange} />
              </div>
            )}

            <div>
              <h2 className="text-white text-xl font-black leading-tight">{movie?.title}</h2>
              <div className="flex items-center gap-3 text-sm text-white/60 mt-1.5">
                {movie?.vote_average ? (
                  <span className="flex items-center gap-1.5 text-yellow-500 font-bold">
                    <FaStar /> {movie.vote_average.toFixed(1)}
                  </span>
                ) : null}
                {year && <span>{year}</span>}
              </div>
              {movie?.overview && (
                <p className="text-white/70 text-sm leading-relaxed mt-3 line-clamp-4">{movie.overview}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onToggleWatchlist}
                className={`flex-1 h-12 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer ${
                  inWatchlist
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-white/10 border-white/15 text-white"
                }`}
              >
                {inWatchlist ? <FaCheck className="text-xs" /> : <FaPlus className="text-xs" />}
                {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </button>

              {onDetails && (
                <button
                  onClick={onDetails}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                >
                  <FaPlay className="text-[10px]" /> Full details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}