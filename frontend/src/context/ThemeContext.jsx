// src/context/ThemeContext.jsx
//
// Site-wide appearance preferences. Anything changed here is applied to the
// <html> element immediately, so every page updates in real time:
//   - theme         -> data-theme="dark|light" (+ color-scheme)
//   - fontSize      -> root font-size (all rem-based Tailwind sizes scale)
//   - fontFamily    -> --font-body CSS variable, applied to the whole app
//   - reducedMotion -> data-motion="reduced|full"
//
// Preferences are saved in localStorage and, when logged in, synced to
// users/{uid}.preferences in Firestore so they follow the user across devices.
//
// Fonts are bundled with the app (@fontsource-variable/*) and loaded on demand,
// so they work even where Google Fonts is blocked or offline.
//
//   npm i @fontsource-variable/inter @fontsource-variable/plus-jakarta-sans \
//         @fontsource-variable/lexend @fontsource-variable/merriweather

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORAGE_KEY = "moviemind_prefs";

/* eslint-disable react-refresh/only-export-components */

/* ───────────────────────── FONTS ───────────────────────── */

export const FONTS = {
  inter: {
    label: "Inter",
    desc: "Clean and neutral",
    stack: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  jakarta: {
    label: "Plus Jakarta Sans",
    desc: "Modern and friendly",
    stack: '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif',
  },
  lexend: {
    label: "Lexend",
    desc: "Easy to read",
    stack: '"Lexend Variable", Lexend, system-ui, sans-serif',
  },
  merriweather: {
    label: "Merriweather",
    desc: "Classic serif",
    stack: '"Merriweather Variable", Merriweather, Georgia, serif',
  },
  system: {
    label: "System",
    desc: "Your device font",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
};

// Each loader pulls in the font's CSS + files only when that font is needed.
const FONT_LOADERS = {
  inter: () => import("@fontsource-variable/inter"),
  jakarta: () => import("@fontsource-variable/plus-jakarta-sans"),
  lexend: () => import("@fontsource-variable/lexend"),
  merriweather: () => import("@fontsource-variable/merriweather"),
};

const requestedFonts = new Set();

export function ensureFont(key) {
  const load = FONT_LOADERS[key];
  if (!load || requestedFonts.has(key)) return;
  requestedFonts.add(key);
  load().catch((err) => {
    requestedFonts.delete(key);
    console.warn(`Couldn't load the ${key} font:`, err.message);
  });
}

export const FONT_SIZES = {
  sm: { label: "Small", scale: 87.5 },
  md: { label: "Default", scale: 100 },
  lg: { label: "Large", scale: 112.5 },
  xl: { label: "Extra large", scale: 125 },
};

export const THEMES = ["dark", "light", "system"];

export const DEFAULT_PREFS = {
  theme: "dark",
  fontFamily: "inter",
  fontSize: "md",
  reducedMotion: false,
};

/* ───────────────────────── GLOBAL CSS (injected) ─────────────────────────
   Injected here so the font override, motion setting and the shared design
   tokens work without anyone having to edit global.css. */

const PREFS_CSS = `
:root { --font-body: ${FONTS.inter.stack}; }

/* the chosen typeface applies to the whole app (code/mono labels excluded) */
html body,
html .font-sans { font-family: var(--font-body); }

/* shared design tokens */
html[data-theme="dark"], html:not([data-theme]) {
  --card: #0d1322;
  --card-border: rgba(255,255,255,0.08);
  --field: #0a0f1c;
  --inset: rgba(255,255,255,0.03);
  --hover: rgba(255,255,255,0.06);
  --toggle-off: rgba(255,255,255,0.18);
  --shadow-card: none;
}
html[data-theme="light"] {
  --card: #ffffff;
  --card-border: #e2e8f0;
  --field: #ffffff;
  --inset: #f8fafc;
  --hover: #f1f5f9;
  --toggle-off: #cbd5e1;
  --shadow-card: 0 1px 2px rgba(15,23,42,0.06);
}

.mm-card { background: var(--card); border: 1px solid var(--card-border); box-shadow: var(--shadow-card); }
.mm-inset { background: var(--inset); border: 1px solid var(--card-border); }
.mm-opt { background: var(--inset); border-color: var(--card-border); }
.mm-opt:hover { border-color: rgba(239,68,68,0.5); }
.mm-divide > * + * { border-top: 1px solid var(--card-border); }
.mm-hover:hover { background: var(--hover); }
.mm-toggle-off { background: var(--toggle-off); }
.mm-field { background: var(--field); border: 1px solid var(--card-border); color: var(--text); }
.mm-field:focus { outline: none; border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.25); }
.mm-btn { background: var(--card); border: 1px solid var(--card-border); color: var(--text); }
.mm-btn:hover:not(:disabled) { background: var(--hover); }
.mm-btn-danger { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.35); color: #ef4444; }
.mm-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.16); }
.mm-focus:focus-visible { outline: 2px solid #f87171; outline-offset: 2px; }

/* reduce motion */
html[data-motion="reduced"] { scroll-behavior: auto !important; }
html[data-motion="reduced"] *,
html[data-motion="reduced"] *::before,
html[data-motion="reduced"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
`;

function injectPrefsStyle() {
  if (typeof document === "undefined" || document.getElementById("mm-prefs-style")) return;
  const el = document.createElement("style");
  el.id = "mm-prefs-style";
  el.textContent = PREFS_CSS;
  document.head.appendChild(el); // last in <head>, so it wins over equal-specificity rules
}

/* ───────────────────────── STATE HELPERS ───────────────────────── */

function sanitize(p) {
  return {
    theme: THEMES.includes(p?.theme) ? p.theme : DEFAULT_PREFS.theme,
    fontFamily: FONTS[p?.fontFamily] ? p.fontFamily : DEFAULT_PREFS.fontFamily,
    fontSize: FONT_SIZES[p?.fontSize] ? p.fontSize : DEFAULT_PREFS.fontSize,
    reducedMotion: p?.reducedMotion === true,
  };
}

const getSystemDark = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") return sanitize(saved);
  } catch {
    // fall through to defaults
  }

  let theme = DEFAULT_PREFS.theme;
  try {
    const legacy = localStorage.getItem("theme"); // key used by the first theme toggle
    if (legacy === "light" || legacy === "dark") theme = legacy;
  } catch {
    // ignore
  }

  const prefersReduced =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return { ...DEFAULT_PREFS, theme, reducedMotion: prefersReduced };
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(loadLocal);
  const [systemDark, setSystemDark] = useState(getSystemDark);
  const [syncReady, setSyncReady] = useState(false);

  const uidRef = useRef(null);
  const lastSaved = useRef("");

  const resolvedTheme =
    prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  useEffect(() => {
    injectPrefsStyle();
  }, []);

  /* ── follow the OS theme while "system" is selected ── */
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* ── apply to the page, instantly ── */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SIZES[prefs.fontSize].scale}%`;
  }, [prefs.fontSize]);

  useEffect(() => {
    ensureFont(prefs.fontFamily);
    document.documentElement.style.setProperty("--font-body", FONTS[prefs.fontFamily].stack);
  }, [prefs.fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-motion", prefs.reducedMotion ? "reduced" : "full");
  }, [prefs.reducedMotion]);

  /* ── persist on this device ── */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      localStorage.setItem("theme", resolvedTheme); // keeps older code paths working
    } catch {
      // storage blocked, ignore
    }
  }, [prefs, resolvedTheme]);

  /* ── load this user's saved preferences when they log in ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      uidRef.current = user?.uid || null;
      setSyncReady(false);
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const remote = snap.exists() ? snap.data().preferences : null;
        if (remote && typeof remote === "object") {
          const merged = sanitize({ ...DEFAULT_PREFS, ...remote });
          lastSaved.current = JSON.stringify(merged);
          setPrefs(merged);
        }
      } catch (err) {
        console.warn("Couldn't load saved preferences:", err.message);
      } finally {
        if (uidRef.current === user.uid) setSyncReady(true);
      }
    });
    return unsubscribe;
  }, []);

  /* ── save changes to the account (debounced) ── */
  useEffect(() => {
    if (!syncReady || !uidRef.current) return;
    const json = JSON.stringify(prefs);
    if (json === lastSaved.current) return;

    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", uidRef.current), { preferences: prefs }, { merge: true });
        lastSaved.current = json;
      } catch (err) {
        console.warn("Couldn't sync preferences:", err.message);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [prefs, syncReady]);

  /* ── public API ── */
  const update = useCallback((patch) => setPrefs((p) => sanitize({ ...p, ...patch })), []);

  const value = useMemo(
    () => ({
      // `theme` is always the RESOLVED theme ("dark" | "light"), so existing
      // code like ThemeToggle keeps working unchanged.
      theme: resolvedTheme,
      themePreference: prefs.theme, // "dark" | "light" | "system"
      fontFamily: prefs.fontFamily,
      fontSize: prefs.fontSize,
      reducedMotion: prefs.reducedMotion,
      isSynced: syncReady,
      setTheme: (theme) => update({ theme }),
      setFontFamily: (fontFamily) => update({ fontFamily }),
      setFontSize: (fontSize) => update({ fontSize }),
      setReducedMotion: (reducedMotion) => update({ reducedMotion }),
      toggleTheme: () => update({ theme: resolvedTheme === "dark" ? "light" : "dark" }),
      resetPreferences: () => setPrefs({ ...DEFAULT_PREFS }),
    }),
    [prefs, resolvedTheme, syncReady, update]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}