// src/components/TrailerLanguageSelect.jsx
import { useState, useRef, useEffect } from "react";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";

export default function TrailerLanguageSelect({ options = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking / tapping outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isOpen]);

  // hooks first, early return after
  if (!options.length) return null;

  const isDisabled = options.length < 2;
  const selectedOption = options.find((o) => o.key === value) || options[0];

  return (
    <div className="relative shrink-0 min-w-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen((o) => !o)}
        disabled={isDisabled}
        aria-label="Trailer language"
        aria-expanded={isOpen}
        className="flex h-9 max-w-full items-center gap-1.5 rounded-lg bg-white/10 md:bg-transparent px-2.5 text-xs font-semibold text-white/80 transition-colors hover:text-white focus:outline-none disabled:cursor-default disabled:opacity-60"
      >
        <FaGlobe className="shrink-0 text-[11px] text-white/60" aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Language</span>

        {/* phones: language only; md+: language · type */}
        <span className="min-w-0 truncate text-white">
          {selectedOption?.label}
          <span className="hidden md:inline"> · {selectedOption?.type}</span>
        </span>

        <FaChevronDown
          className={`shrink-0 text-[9px] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isDisabled ? "opacity-0 w-0" : "opacity-60"}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute right-0 top-full z-50 mt-2 w-max min-w-[180px] max-w-[70vw] max-h-[50vh] overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 py-1.5 shadow-2xl backdrop-blur-xl">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Select Language
          </div>
          <div className="mt-1 flex flex-col">
            {options.map((o) => {
              const isSelected = o.key === value;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => {
                    onChange(o.key);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-white/10 text-white font-semibold"
                      : "text-white/70 hover:bg-white/5 hover:text-white active:bg-white/10"
                  }`}
                >
                  <span>
                    {o.label} · {o.type}
                  </span>
                  {isSelected && <FaCheck className="shrink-0 text-[10px] text-red-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}