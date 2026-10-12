// src/components/TrailerLanguageSelect.jsx
import { useState, useRef, useEffect } from "react";
import { FaGlobe, FaChevronDown, FaCheck } from "react-icons/fa";

export default function TrailerLanguageSelect({ options = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  if (!options.length) return null;

  const isDisabled = options.length < 2;
  const selectedOption = options.find((o) => o.key === value) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative ml-auto mr-3 shrink-0" ref={dropdownRef}>
      {/* Transparent Trigger Button */}
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        aria-label="Trailer language"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg bg-transparent px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:text-white focus:outline-none disabled:cursor-default disabled:opacity-50"
      >
        <FaGlobe className="text-[11px] text-white/60" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Language</span>
        
        {/* Selected label & type preview */}
        <span className="text-white">
          {selectedOption?.label} · {selectedOption?.type}
        </span>

        <FaChevronDown
          className={`text-[9px] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isDisabled ? "opacity-40" : "opacity-60"}`}
          aria-hidden="true"
        />
      </button>

      {/* Custom Redesigned Dropdown Panel */}
      {isOpen && !isDisabled && (
        <div className="absolute right-0 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/90 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
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
                  className={`flex items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-white/10 text-white font-semibold"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>
                    {o.label} · {o.type}
                  </span>
                  {isSelected && <FaCheck className="text-[10px] text-red-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}