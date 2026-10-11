// src/context/ThemeContext.jsx
//
// Site-wide appearance preferences. Anything changed here is applied to the
// <html> element immediately, so every page updates in real time:
//   - theme         -> data-theme="dark|light" (+ color-scheme)
//   - fontSize      -> root font-size (all rem-based Tailwind sizes scale)
//   - fontFamily    -> --font-body CSS variable
//   - reducedMotion -> data-motion="reduced|full"
//
// Preferences are saved in localStorage and, when logged in, synced to
// users/{uid}.preferences in Firestore so they follow the user across devices.

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

export const FONTS = {
  inter: {
    label: "Inter",
    note: "Clean default",
    stack: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    google: "Inter:wght@400;500;600;700;800;900",
  },
  poppins: {
    label: "Poppins",
    note: "Rounded and friendly",
    stack: "Poppins, system-ui, sans-serif",
    google: "Poppins:wght@400;500;600;700;800;900",
  },
  lexend: {
    label: "Lexend",
    note: "Easy to read",
    stack: "Lexend, system-ui, sans-serif",
    google: "Lexend:wght@400;500;600;700;800;900",
  },
  merriweather: {
    label: "Merriweather",
    note: "Classic serif",
    stack: "Merriweather, Georgia, serif",
    google: "Merriweather:wght@400;700;900",
  },
  system: {
    label: "System",
    note: "Your device font",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    google: null,
  },
};

export const FONT_SIZES = {
  sm: { label: "Small", scale: 87.5 },
  md: { label: "Medium", scale: 100 },
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

export function ensureFont(key) {
  const font = FONTS[key];
  if (!font?.google || typeof document === "undefined") return;
  const id = `mm-font-${key}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  document.head.appendChild(link);
}

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