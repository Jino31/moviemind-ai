// src/components/MovieTrailerModal.jsx
// Shared trailer popup with CUSTOM player controls.
//  • YouTube's own control bar is turned off (controls: 0) and a transparent
//    shield sits over the video so taps never reach YouTube's UI.
//  • Our controls: play/pause, seek bar, time, mute, fullscreen.
//  • Desktop (md+): centered card. Phones: full-screen black sheet.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaPlay,
  FaPause,
  FaPlus,
  FaCheck,
  FaStar,
  FaTimes,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaRedo,
} from "react-icons/fa";
import YouTube from "react-youtube";
import AmbientGlow from "./AmbientGlow";
import TrailerLanguageSelect from "./TrailerLanguageSelect";

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

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

  const playerRef = useRef(null);
  const frameRef = useRef(null); // element we send to fullscreen
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const canFullscreen =
    typeof document !== "undefined" &&
    !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

  // reset the UI whenever the trailer (language) changes
  useEffect(() => {
    setPlaying(false);
    setEnded(false);
    setCurrent(0);
    setDuration(0);
  }, [videoKey]);

  // poll the playhead while playing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime) setCurrent(p.getCurrentTime());
    }, 300);
    return () => clearInterval(id);
  }, [playing]);

  const handleReady = (e) => {
    playerRef.current = e.target;
    setDuration(e.target.getDuration?.() || 0);
    setMuted(e.target.isMuted?.() || false);
  };

  const handleStateChange = (e) => {
    // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    if (e.data === 1) {
      setPlaying(true);
      setEnded(false);
      setDuration(e.target.getDuration?.() || 0);
    } else if (e.data === 2) {
      setPlaying(false);
    } else if (e.data === 0) {
      setPlaying(false);
      setEnded(true);
    }
  };

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (ended) {
      p.seekTo(0, true);
      p.playVideo();
      return;
    }
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing, ended]);

  const handleSeek = (e) => {
    const t = Number(e.target.value);
    setCurrent(t);
    playerRef.current?.seekTo(t, true);
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    const doc = document;
    const active = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (active) {
      (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  };

  const progress = duration ? (current / duration) * 100 : 0;

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
          <div className="flex items-center justify-between gap-2 md:gap-3 pl-4 pr-3 md:px-5 py-2.5 md:py-3 pt-[calc(0.625rem+env(safe-area-inset-top))] md:pt-3 bg-zinc-950 border-b border-white/10">
            <span className="flex-1 min-w-0 text-white/80 md:text-white/70 text-sm font-semibold truncate md:pr-4">
              {movie?.title}
            </span>

            <div className="shrink-0 max-w-[45%] md:max-w-none">
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

          {/* player + custom controls (this block goes fullscreen) */}
          <div ref={frameRef} className="relative pt-[56.25%] w-full bg-black group/player">
            <YouTube
              videoId={videoKey}
              className="absolute inset-0 w-full h-full"
              iframeClassName="w-full h-full"
              opts={{
                width: "100%",
                height: "100%",
                host: "https://www.youtube-nocookie.com",
                playerVars: {
                  autoplay: 1,
                  controls: 0, // hide YouTube's own control bar
                  disablekb: 1, // we handle input ourselves
                  fs: 0,
                  iv_load_policy: 3, // no annotations
                  rel: 0,
                  playsinline: 1,
                },
              }}
              onReady={handleReady}
              onStateChange={handleStateChange}
              onPlay={onPlay}
              onEnd={onEnd}
              onError={onError}
            />

            {/* shield: swallows taps/hover so YouTube's UI never shows; tap = play/pause */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              className="absolute inset-0 z-10 w-full h-full cursor-pointer focus:outline-none"
            >
              {(!playing || ended) && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    {ended ? <FaRedo className="text-xl" /> : <FaPlay className="text-xl ml-1" />}
                  </span>
                </span>
              )}
            </button>

            {/* control bar */}
            <div className="absolute inset-x-0 bottom-0 z-20 px-3 md:px-4 pb-2 md:pb-3 pt-8 bg-gradient-to-t from-black/85 to-transparent">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step="0.1"
                value={Math.min(current, duration || 0)}
                onChange={handleSeek}
                aria-label="Seek"
                style={{
                  background: `linear-gradient(to right, #ef4444 ${progress}%, rgba(255,255,255,0.25) ${progress}%)`,
                }}
                className="w-full h-1 rounded-full appearance-none cursor-pointer accent-red-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-red-500"
              />

              <div className="mt-1.5 flex items-center gap-2 text-white">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/10 transition cursor-pointer"
                >
                  {ended ? <FaRedo className="text-sm" /> : playing ? <FaPause className="text-sm" /> : <FaPlay className="text-sm ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/10 transition cursor-pointer"
                >
                  {muted ? <FaVolumeMute className="text-sm" /> : <FaVolumeUp className="text-sm" />}
                </button>

                <span className="text-xs font-semibold tabular-nums text-white/80">
                  {fmt(current)} / {fmt(duration)}
                </span>

                {canFullscreen && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                    className="ml-auto w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/10 transition cursor-pointer"
                  >
                    <FaExpand className="text-sm" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* phones only: movie info + actions */}
          <div className="md:hidden px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4">
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