// src/components/TrailerLanguageSelect.jsx
import { FaGlobe } from "react-icons/fa";

export default function TrailerLanguageSelect({ options = [], value, onChange }) {
  if (!options.length) return null;

  return (
    <label className="ml-auto mr-3 flex shrink-0 items-center gap-2 text-xs font-semibold text-white/70">
      <FaGlobe className="text-[11px]" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Language</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={options.length < 2}
        aria-label="Trailer language"
        className="h-9 max-w-[150px] cursor-pointer rounded-xl border border-white/15 bg-white/10 px-2 text-xs font-semibold text-white focus:border-red-500 focus:outline-none disabled:cursor-default disabled:opacity-60 sm:max-w-[220px]"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key} className="text-black">
            {o.label} · {o.type}
          </option>
        ))}
      </select>
    </label>
  );
}