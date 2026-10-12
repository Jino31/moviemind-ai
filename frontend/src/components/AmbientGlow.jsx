// src/components/AmbientGlow.jsx
// Soft "ambient lighting" behind the trailer player.
// Browsers don't let a page read pixels from a YouTube player, so this uses the
// video's own preview frames (frames 1, 2, 3 and the main poster frame), blurs them
// into a colour wash, and cross-fades between them so the glow shifts with the video's palette.
import { useEffect, useState } from "react";

const FRAMES = ["1", "2", "3", "0"];

export default function AmbientGlow({ videoKey }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState({});

  useEffect(() => {
    setIndex(0);
    setBroken({});
    const timer = setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), 3500);
    return () => clearInterval(timer);
  }, [videoKey]);

  if (!videoKey) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-6 sm:-inset-10 z-0 animate-[pulse_5s_ease-in-out_infinite] motion-reduce:animate-none"
    >
      {FRAMES.map((frame, i) =>
        broken[frame] ? null : (
          <img
            key={frame}
            src={`https://i.ytimg.com/vi/${videoKey}/${frame}.jpg`}
            alt=""
            onError={() => setBroken((b) => ({ ...b, [frame]: true }))}
            className={`absolute inset-0 h-full w-full scale-110 rounded-[48px] object-cover blur-3xl saturate-[2.2] transition-opacity duration-[2500ms] ${
              i === index ? "opacity-70" : "opacity-0"
            }`}
          />
        )
      )}
    </div>
  );
}