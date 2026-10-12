// src/components/TrailerLanguageSelect.jsx
import { FaGlobe, FaChevronDown } from "react-icons/fa";

export default function TrailerLanguageSelect({ options = [], value, onChange }) {
  if (!options.length) return null;

  const isDisabled = options.length < 2;

  return (
    <label className="ml-auto mr-3 flex shrink-0 items-center gap-2 text-xs font-semibold text-white/70">
      <FaGlobe className="text-[11px] text-white/60" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Language</span>
      
      {/* Container to position custom arrow alongside the native select */}
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          aria-label="Trailer language"
          className="h-9 w-full max-w-[150px] cursor-pointer appearance-none rounded-xl border border-white/15 bg-white/10 py-1.5 pl-3 pr-8 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:cursor-default disabled:opacity-60 sm:max-w-[220px]"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key} className="bg-zinc-900 text-white">
              {o.label} · {o.type}
            </option>
          ))}
        </select>

        {/* Custom Chevron Icon (hidden pointer-events-none so click passes to select) */}
        <FaChevronDown 
          className={`absolute right-2.5 text-[10px] pointer-events-none transition-opacity ${
            isDisabled ? "opacity-40" : "opacity-60"
          }`} 
          aria-hidden="true" 
        />
      </div>
    </label>
  );
}