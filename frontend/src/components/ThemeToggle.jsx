// src/components/ThemeToggle.jsx
import { useTheme } from "../context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="surface surface-hover border-line t-main flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition"
    >
      {theme === "dark" ? (
        <FaSun className="text-xs text-amber-400" />
      ) : (
        <FaMoon className="text-xs text-indigo-400" />
      )}
    </button>
  );
}