// src/components/MovieTrailerModal.jsx
// Shared trailer popup with CUSTOM player controls.
//  • YouTube's own control bar is off (controls: 0) and a transparent shield
//    sits over the video so taps never reach YouTube's UI.
//  • Controls: play/pause, -5s / +5s, mute + volume, time, CC, settings, fullscreen.
//  • Settings menu: Ambient mode, Annotations, Subtitles/CC, Sleep timer, Playback speed.
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
  FaVolumeDown,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaRedo,
  FaUndoAlt,
  FaRedoAlt,
  FaClosedCaptioning,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import YouTube from "react-youtube";
import AmbientGlow from "./AmbientGlow";
import TrailerLanguageSelect from "./TrailerLanguageSelect";

const SKIP = 5; // seconds for the back / forward buttons
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_OPTIONS = [0, 5, 10, 15, 30, 60]; // minutes, 0 = off

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const speedLabel = (v) => (v === 1 ? "Normal" : `${v}x`);
const sleepLabel = (m) => (m === 0 ? "Off" : `${m} min`);

function Toggle({ on }) {
  return (
    <span
      className={`relative inline-block w-9 h-5 rounded-full transition-colors ${on ? "bg-red-500" : "bg-white/25"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : ""
        }`}
      />
    </span>
  );
}

function IconBtn({ onClick, label, active = false, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-9 h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-full transition cursor-pointer hover:bg-white/10 active:bg-white/10 ${
        active ? "text-red-400" : "text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

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
  const startRef = useRef(0); // where to resume after a player remount

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);

  const [captions, setCaptions] = useState(false);
  const [annotations, setAnnotations] = useState(false);
  const [ambient, setAmbient] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [sleepMin, setSleepMin] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState("main"); // main | speed | sleep
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canFullscreen =
    typeof document !== "undefined" &&
    !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

  /* reset the UI whenever the trailer (language) changes */
  useEffect(() => {
    setPlaying(false);
    setEnded(false);
    setCurrent(0);
    setDuration(0);
    startRef.current = 0;
  }, [videoKey]);

  /* poll the playhead while playing */
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime) setCurrent(p.getCurrentTime());
    }, 300);
    return () => clearInterval(id);
  }, [playing]);

  /* sleep timer: pause after N minutes */
  useEffect(() => {
    if (!sleepMin) return;
    const id = setTimeout(() => {
      playerRef.current?.pauseVideo?.();
      setSleepMin(0);
    }, sleepMin * 60 * 1000);
    return () => clearTimeout(id);
  }, [sleepMin]);

  /* fullscreen state */
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  /* ───── player helpers ───── */

  const applyCaptions = useCallback((player, on) => {
    if (!player) return;
    try {
      if (on) {
        player.loadModule?.("captions");
        player.setOption?.("captions", "reload", true);
      } else {
        player.unloadModule?.("captions");
      }
    } catch {
      // captions module not available for this video, ignore
    }
  }, []);

  const handleReady = (e) => {
    const p = e.target;
    playerRef.current = p;
    setDuration(p.getDuration?.() || 0);
    setVolume(p.getVolume?.() ?? 100);
    setMuted(p.isMuted?.() || false);
    // carry the user's choices into a freshly mounted player
    if (speed !== 1) p.setPlaybackRate?.(speed);
    if (captions) applyCaptions(p, true);
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
    } else if (playing) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, [playing, ended]);

  const seekBy = useCallback(
    (delta) => {
      const p = playerRef.current;
      if (!p) return;
      const now = p.getCurrentTime?.() ?? current;
      const total = p.getDuration?.() || duration || 0;
      const next = Math.max(0, Math.min(total || Infinity, now + delta));
      p.seekTo(next, true);
      setCurrent(next);
      if (ended) setEnded(false);
    },
    [current, duration, ended]
  );

  /* keyboard: ← / → skip 5s while the modal is open */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") seekBy(-SKIP);
      else if (e.key === "ArrowRight") seekBy(SKIP);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seekBy]);

  const handleSeek = (e) => {
    const t = Number(e.target.value);
    setCurrent(t);
    playerRef.current?.seekTo(t, true);
  };

  const handleVolume = (e) => {
    const v = Number(e.target.value);
    const p = playerRef.current;
    setVolume(v);
    if (!p) return;
    p.setVolume(v);
    if (v === 0) {
      p.mute();
      setMuted(true);
    } else if (p.isMuted()) {
      p.unMute();
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted()) {
      p.unMute();
      if (p.getVolume() === 0) {
        p.setVolume(50);
        setVolume(50);
      }
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  };

  const toggleCaptions = () => {
    const next = !captions;
    setCaptions(next);
    applyCaptions(playerRef.current, next);
  };

  const toggleAnnotations = () => {
    // annotations can only be changed when the player is created, so remount at the current time
    startRef.current = Math.floor(playerRef.current?.getCurrentTime?.() ?? current);
    setAnnotations((a) => !a);
  };

  const changeSpeed = (v) => {
    setSpeed(v);
    playerRef.current?.setPlaybackRate?.(v);
    setMenuView("main");
  };

  const toggleFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    if (active) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuView("main");
  };

  const progress = duration ? (current / duration) * 100 : 0;
  const volProgress = muted ? 0 : volume;
  const VolumeIcon = muted || volume === 0 ? FaVolumeMute : volume < 50 ? FaVolumeDown : FaVolumeUp;

  const menuRow =
    "w-full flex items-center justify-between gap-6 px-4 py-2.5 text-left text-sm font-medium text-white/90 hover:bg-white/10 active:bg-white/10 transition cursor-pointer";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black md:bg-black/90 md:backdrop-blur-xl overflow-y-auto flex md:items-center md:justify-center md:p-10"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative w-full md:max-w-5xl h-fit md:my-auto">
        {ambient && (
          <div className="hidden md:block">
            <AmbientGlow videoKey={videoKey} />
          </div>
        )}

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
          <div
            ref={frameRef}
            className="relative pt-[56.25%] w-full bg-black [&:fullscreen]:pt-0 [&:fullscreen]:h-full [&:-webkit-full-screen]:pt-0 [&:-webkit-full-screen]:h-full"
          >
            <YouTube
              key={`${videoKey}-${annotations ? "a" : "n"}`}
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
                  disablekb: 1, // we handle the keyboard ourselves
                  fs: 0,
                  iv_load_policy: annotations ? 1 : 3,
                  rel: 0,
                  playsinline: 1,
                  start: startRef.current || 0,
                },
              }}
              onReady={handleReady}
              onStateChange={handleStateChange}
              onPlay={onPlay}
              onEnd={onEnd}
              onError={onError}
            />

            {/* shield: swallows taps/hover so YouTube's UI never gets them; tap = play/pause */}
            <button
              type="button"
              onClick={() => (menuOpen ? closeMenu() : togglePlay())}
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

            {/* settings menu */}
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 md:right-4 bottom-16 md:bottom-20 z-30 w-[min(18rem,calc(100%-1rem))] max-h-[70%] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl py-1.5"
              >
                {menuView === "main" && (
                  <>
                    <div className="hidden md:block">
                      <button type="button" onClick={() => setAmbient((a) => !a)} className={menuRow}>
                        <span>Ambient mode</span>
                        <Toggle on={ambient} />
                      </button>
                    </div>

                    <button type="button" onClick={toggleAnnotations} className={menuRow}>
                      <span>Annotations</span>
                      <Toggle on={annotations} />
                    </button>

                    <button type="button" onClick={toggleCaptions} className={menuRow}>
                      <span>Subtitles/CC</span>
                      <Toggle on={captions} />
                    </button>

                    <button type="button" onClick={() => setMenuView("sleep")} className={menuRow}>
                      <span>Sleep timer</span>
                      <span className="flex items-center gap-2 text-white/60">
                        {sleepLabel(sleepMin)} <FaChevronRight className="text-[10px]" />
                      </span>
                    </button>

                    <button type="button" onClick={() => setMenuView("speed")} className={menuRow}>
                      <span>Playback speed</span>
                      <span className="flex items-center gap-2 text-white/60">
                        {speedLabel(speed)} <FaChevronRight className="text-[10px]" />
                      </span>
                    </button>
                  </>
                )}

                {menuView === "speed" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMenuView("main")}
                      className={`${menuRow} !justify-start gap-3 border-b border-white/10 font-bold`}
                    >
                      <FaChevronLeft className="text-[10px]" /> Playback speed
                    </button>
                    {SPEEDS.map((v) => (
                      <button key={v} type="button" onClick={() => changeSpeed(v)} className={menuRow}>
                        <span>{speedLabel(v)}</span>
                        {speed === v && <FaCheck className="text-xs text-red-500" />}
                      </button>
                    ))}
                  </>
                )}

                {menuView === "sleep" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMenuView("main")}
                      className={`${menuRow} !justify-start gap-3 border-b border-white/10 font-bold`}
                    >
                      <FaChevronLeft className="text-[10px]" /> Sleep timer
                    </button>
                    {SLEEP_OPTIONS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSleepMin(m);
                          setMenuView("main");
                        }}
                        className={menuRow}
                      >
                        <span>{sleepLabel(m)}</span>
                        {sleepMin === m && <FaCheck className="text-xs text-red-500" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* control bar */}
            <div className="absolute inset-x-0 bottom-0 z-20 px-3 md:px-4 pb-1.5 md:pb-3 pt-8 bg-gradient-to-t from-black/85 to-transparent">
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
                className="w-full h-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-red-500"
              />

              <div className="mt-1 flex items-center gap-0.5 md:gap-1 text-white">
                <IconBtn onClick={togglePlay} label={playing ? "Pause" : "Play"}>
                  {ended ? (
                    <FaRedo className="text-sm" />
                  ) : playing ? (
                    <FaPause className="text-sm" />
                  ) : (
                    <FaPlay className="text-sm ml-0.5" />
                  )}
                </IconBtn>

                <IconBtn onClick={() => seekBy(-SKIP)} label={`Back ${SKIP} seconds`}>
                  <span className="relative flex items-center justify-center">
                    <FaUndoAlt className="text-[15px]" />
                    <span className="absolute text-[7px] font-black leading-none">{SKIP}</span>
                  </span>
                </IconBtn>

                <IconBtn onClick={() => seekBy(SKIP)} label={`Forward ${SKIP} seconds`}>
                  <span className="relative flex items-center justify-center">
                    <FaRedoAlt className="text-[15px]" />
                    <span className="absolute text-[7px] font-black leading-none">{SKIP}</span>
                  </span>
                </IconBtn>

                <IconBtn onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
                  <VolumeIcon className="text-sm" />
                </IconBtn>

                {/* volume slider: wider screens only, phones use the device volume keys */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                  aria-label="Volume"
                  style={{
                    background: `linear-gradient(to right, #fff ${volProgress}%, rgba(255,255,255,0.25) ${volProgress}%)`,
                  }}
                  className="hidden sm:block w-16 md:w-24 h-1 mx-1 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
                />

                <span className="ml-1 text-[11px] md:text-xs font-semibold tabular-nums text-white/80 whitespace-nowrap">
                  {fmt(current)} / {fmt(duration)}
                </span>

                <div className="ml-auto flex items-center gap-0.5 md:gap-1">
                  <IconBtn onClick={toggleCaptions} label="Subtitles/CC" active={captions}>
                    <FaClosedCaptioning className="text-base" />
                  </IconBtn>

                  <IconBtn
                    onClick={() => {
                      setMenuView("main");
                      setMenuOpen((o) => !o);
                    }}
                    label="Settings"
                    active={menuOpen}
                  >
                    <FaCog className={`text-sm transition-transform ${menuOpen ? "rotate-45" : ""}`} />
                  </IconBtn>

                  {canFullscreen && (
                    <IconBtn onClick={toggleFullscreen} label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                      {isFullscreen ? <FaCompress className="text-sm" /> : <FaExpand className="text-sm" />}
                    </IconBtn>
                  )}
                </div>
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