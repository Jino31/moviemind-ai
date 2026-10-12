// src/pages/Settings.jsx
// MovieMind AI — Settings. Every control applies instantly across the whole app
// through the shared preferences in ../context/ThemeContext.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { useTheme, FONTS, FONT_SIZES, ensureFont } from "../context/ThemeContext";
import { FALLBACK_AVATAR } from "../constants";

/* =========================================================
   Tokens (the mm-* classes are injected by ThemeContext)
========================================================= */
const BTN =
  "mm-btn mm-focus inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const BTN_PRIMARY =
  "mm-focus inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50";
const BTN_DANGER =
  "mm-btn-danger mm-focus inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const FIELD = "mm-field rounded-xl px-4 py-2.5 text-sm transition placeholder:text-gray-500";

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: "palette" },
  { id: "display", label: "Display & accessibility", icon: "type" },
  { id: "streaming", label: "Streaming", icon: "globe" },
  { id: "data", label: "Data & privacy", icon: "database" },
  { id: "account", label: "Account", icon: "user" },
];

const REGIONS = [
  ["IN", "India"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
];

const watchlistKey = (uid) => `watchlist_${uid}`;
const historyKey = (uid) => `watched_history_${uid}`;

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const readList = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

const readRegion = () => {
  try {
    return localStorage.getItem("watch_region") || "IN";
  } catch {
    return "IN";
  }
};

/* =========================================================
   UI pieces
========================================================= */
function Icon({ name, size = 18, stroke = 1.8 }) {
  const icons = {
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z" />
        <circle cx="7.5" cy="11" r="1" />
        <circle cx="10" cy="7" r="1" />
        <circle cx="15" cy="7.5" r="1" />
      </>
    ),
    type: <path d="M5 7V5h14v2M12 5v14M9 19h6" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5.5" rx="8" ry="3" />
        <path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    download: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
    trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
    reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    back: <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
    alert: (
      <>
        <path d="M12 3 2 20h20L12 3Z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`mm-focus relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-red-600" : "mm-toggle-off"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Row({ title, desc, children, stack }) {
  return (
    <div
      className={`flex gap-4 py-5 first:pt-0 last:pb-0 ${
        stack ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between"
      }`}
    >
      <div className="min-w-0 sm:max-w-md">
        <h3 className="t-main text-sm font-semibold">{title}</h3>
        {desc && <p className="t-muted mt-1 text-sm leading-6">{desc}</p>}
      </div>
      <div className={stack ? "" : "shrink-0"}>{children}</div>
    </div>
  );
}

function Panel({ title, desc, danger = false, children }) {
  return (
    <section
      className={`rounded-2xl p-6 ${danger ? "border border-red-500/30 bg-red-500/[0.05]" : "mm-card"}`}
    >
      <h2 className={`text-base font-semibold ${danger ? "text-red-500" : "t-main"}`}>{title}</h2>
      {desc && <p className="t-muted mt-1 text-sm">{desc}</p>}
      <div className={`mt-5 ${danger ? "" : "mm-divide"}`}>{children}</div>
    </section>
  );
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="mm-inset flex w-full rounded-xl p-1">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`mm-focus flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
              on ? "bg-red-500/15 text-red-500" : "t-muted mm-hover"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Selectable card used for theme / typeface.
function Choice({ selected, onClick, label, desc, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`mm-focus relative rounded-xl border p-3 text-left transition ${
        selected ? "border-red-500 bg-red-500/[0.06] ring-1 ring-red-500/30" : "mm-opt"
      }`}
    >
      {children}
      <span className="t-main mt-3 block text-sm font-semibold">{label}</span>
      {desc && <span className="t-muted block text-xs">{desc}</span>}
      {selected && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
          <Icon name="check" size={12} stroke={3} />
        </span>
      )}
    </button>
  );
}

// Tiny mock of the app in a given look.
function Mini({ page, surface, line, accent = "#ef4444" }) {
  return (
    <span className="block h-16 overflow-hidden rounded-lg border border-black/10 p-2" style={{ background: page }}>
      <span className="block h-2 w-8 rounded-full" style={{ background: accent }} />
      <span className="mt-2 block h-7 rounded-md" style={{ background: surface }}>
        <span className="block h-1.5 w-10 translate-x-1.5 translate-y-1.5 rounded-full" style={{ background: line }} />
      </span>
    </span>
  );
}

function ActionRow({ title, desc, label, armed, disabled = false, danger = false, icon, onClick }) {
  return (
    <Row title={title} desc={desc}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={armed ? `${BTN_PRIMARY}` : danger ? BTN_DANGER : BTN}
      >
        {icon && <Icon name={icon} size={16} />}
        {armed ? "Click again to confirm" : label}
      </button>
    </Row>
  );
}

/* =========================================================
   Page
========================================================= */
export default function Settings() {
  const navigate = useNavigate();
  const {
    themePreference,
    fontFamily,
    fontSize,
    reducedMotion,
    isSynced,
    setTheme,
    setFontFamily,
    setFontSize,
    setReducedMotion,
    resetPreferences,
  } = useTheme();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [section, setSection] = useState("appearance");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef(null);

  const [notice, setNotice] = useState(null); // { tone: "ok" | "warn", text }
  const noticeTimer = useRef(null);

  const [region, setRegion] = useState(readRegion);

  const [rev, setRev] = useState(0);
  const summary = useMemo(
    () => ({
      watchlist: user ? readList(watchlistKey(user.uid)).length : 0,
      history: user ? readList(historyKey(user.uid)).length : 0,
      searches: readList("recent_searches").length,
    }),
    [user, rev, section] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [confirmKey, setConfirmKey] = useState("");
  const confirmTimer = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(
    () => () => {
      clearTimeout(savedTimer.current);
      clearTimeout(noticeTimer.current);
      clearTimeout(confirmTimer.current);
    },
    []
  );

  /* ── auth ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ── load every typeface so the picker can preview them ── */
  useEffect(() => {
    Object.keys(FONTS).forEach(ensureFont);
  }, []);

  /* ── delete dialog: Escape + scroll lock ── */
  useEffect(() => {
    if (!deleteOpen) return;
    const onKey = (e) => e.key === "Escape" && !deleting && setDeleteOpen(false);
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [deleteOpen, deleting]);

  /* ───────────── helpers ───────────── */

  const flash = () => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  const change = (setter, value) => {
    setter(value);
    flash();
  };

  const showNotice = (tone, text) => {
    setNotice({ tone, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleRegion = (value) => {
    setRegion(value);
    try {
      localStorage.setItem("watch_region", value);
    } catch {
      /* ignore */
    }
    flash();
  };

  // two-step confirm: first click arms the button, second click runs it
  const confirmThen = (key, action) => {
    if (confirmKey === key) {
      clearTimeout(confirmTimer.current);
      setConfirmKey("");
      action();
      return;
    }
    setConfirmKey(key);
    clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmKey(""), 4000);
  };

  /* ── data actions ── */
  const handleExport = () => {
    const payload = {
      app: "MovieMind AI",
      exportedAt: new Date().toISOString(),
      preferences: { theme: themePreference, fontFamily, fontSize, reducedMotion },
      streamingRegion: region,
      watchlist: user ? readList(watchlistKey(user.uid)) : [],
      watchHistory: user ? readList(historyKey(user.uid)) : [],
      recentSearches: readList("recent_searches"),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moviemind-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("ok", "Your data was downloaded.");
  };

  const clearSearches = () => {
    safeRemove("recent_searches");
    setRev((r) => r + 1);
    showNotice("ok", "Recent searches cleared.");
  };

  const clearHistory = async () => {
    if (!user) return;
    safeRemove(historyKey(user.uid));
    setRev((r) => r + 1);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          watchedCount: 0,
          sessionLogs: arrayUnion({ text: "Cleared watch history", timestamp: nowTime(), type: "HISTORY_PURGE" }),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("History sync failed:", err);
    }
    showNotice("ok", "Watch history cleared.");
  };

  const clearWatchlist = async () => {
    if (!user) return;
    safeRemove(watchlistKey(user.uid));
    setRev((r) => r + 1);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          watchlistCount: 0,
          sessionLogs: arrayUnion({ text: "Cleared watchlist", timestamp: nowTime(), type: "WATCHLIST_REMOVE" }),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Watchlist sync failed:", err);
    }
    showNotice("ok", "Watchlist cleared.");
  };

  const handleReset = () => {
    resetPreferences();
    flash();
    showNotice("ok", "Appearance settings restored to defaults.");
  };

  /* ── account actions ── */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
      showNotice("warn", "Couldn't sign out. Please try again.");
    }
  };

  const providerIds = user?.providerData?.map((p) => p.providerId) || [];
  const needsPassword = providerIds.includes("password");
  const providerLabel = providerIds.includes("google.com")
    ? "Google"
    : needsPassword
    ? "Email & password"
    : "Account";
  const confirmWord = user?.email || "DELETE";
  const canDelete =
    confirmText.trim().toLowerCase() === confirmWord.toLowerCase() &&
    (!needsPassword || password.length > 0) &&
    !deleting;

  const openDelete = () => {
    setConfirmText("");
    setPassword("");
    setDeleteError("");
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!user || !canDelete) return;
    setDeleting(true);
    setDeleteError("");

    try {
      // a fresh login is required before an account can be deleted
      if (needsPassword) {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      } else if (providerIds.includes("google.com")) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }

      const uid = user.uid;
      await deleteDoc(doc(db, "users", uid));
      await deleteUser(user);

      safeRemove(watchlistKey(uid));
      safeRemove(historyKey(uid));
      safeRemove("recent_searches");
      navigate("/login");
    } catch (err) {
      console.error("Account deletion failed:", err);
      const code = err?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setDeleteError("That password is incorrect.");
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setDeleteError("Verification was cancelled. Try again.");
      } else if (code === "auth/requires-recent-login") {
        setDeleteError("Please log out, sign in again, and retry.");
      } else if (code === "auth/too-many-requests") {
        setDeleteError("Too many attempts. Wait a few minutes and try again.");
      } else {
        setDeleteError("Couldn't delete your account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  /* =======================================================
     Panels
  ======================================================= */
  const themeOptions = [
    { id: "light", label: "Light", desc: "Bright and clear" },
    { id: "dark", label: "Dark", desc: "Easy on the eyes" },
    { id: "system", label: "System", desc: "Match your device" },
  ];

  const appearance = (
    <Panel
      title="Theme"
      desc={
        isSynced
          ? "Choose how MovieMind AI looks. Saved to your account."
          : "Choose how MovieMind AI looks. Saved on this device."
      }
    >
      <Row title="Colour mode" desc="System follows your device setting." stack>
        <div role="radiogroup" aria-label="Colour mode" className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((t) => (
            <Choice
              key={t.id}
              selected={themePreference === t.id}
              onClick={() => change(setTheme, t.id)}
              label={t.label}
              desc={t.desc}
            >
              {t.id === "light" && <Mini page="#f8f7fb" surface="#ffffff" line="#cbd5e1" />}
              {t.id === "dark" && <Mini page="#020617" surface="#0d1322" line="#334155" />}
              {t.id === "system" && (
                <span
                  className="block h-16 overflow-hidden rounded-lg border border-black/10"
                  style={{ background: "linear-gradient(110deg, #f8f7fb 50%, #020617 50%)" }}
                />
              )}
            </Choice>
          ))}
        </div>
      </Row>
    </Panel>
  );

  const display = (
    <Panel title="Display & accessibility" desc="Make reading comfortable. Changes apply to every page instantly.">
      <Row title="Text size" desc="Scales text across the whole app." stack>
        <div className="grid gap-4 lg:grid-cols-2 lg:items-center">
          <Segmented
            label="Text size"
            value={fontSize}
            onChange={(v) => change(setFontSize, v)}
            options={Object.entries(FONT_SIZES).map(([value, s]) => ({ value, label: s.label }))}
          />
          <p className="mm-inset t-muted rounded-xl p-3 text-sm leading-6">
            Preview: Every great movie night starts with the right pick.
          </p>
        </div>
      </Row>

      <Row title="Typeface" desc="Pick the style that is easiest for you to read." stack>
        <div role="radiogroup" aria-label="Typeface" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(FONTS).map(([id, f]) => (
            <Choice
              key={id}
              selected={fontFamily === id}
              onClick={() => change(setFontFamily, id)}
              label={f.label}
              desc={f.desc}
            >
              <span className="t-main block text-2xl font-semibold" style={{ fontFamily: f.stack }}>
                Aa
              </span>
            </Choice>
          ))}
        </div>
      </Row>

      <Row title="Reduce motion" desc="Turns off animations and transitions. Starts on if your device asks for it.">
        <Toggle checked={reducedMotion} onChange={(v) => change(setReducedMotion, v)} label="Reduce motion" />
      </Row>
    </Panel>
  );

  const streaming = (
    <Panel title="Streaming" desc="Movie pages show where a title is available to watch legally.">
      <Row title="Region" desc="Choose the country whose streaming services you want to see.">
        <select
          aria-label="Streaming region"
          value={region}
          onChange={(e) => handleRegion(e.target.value)}
          className={`${FIELD} cursor-pointer`}
        >
          {REGIONS.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </Row>
    </Panel>
  );

  const dataPanel = (
    <>
      <Panel title="Your data" desc="Lists are stored in this browser. Nothing is uploaded from this page.">
        <Row title="Stored for you" stack>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Watchlist", summary.watchlist],
              ["Watched trailers", summary.history],
              ["Recent searches", summary.searches],
            ].map(([k, v]) => (
              <div key={k} className="mm-inset rounded-xl p-4">
                <div className="t-muted text-[11px] font-semibold uppercase tracking-wider">{k}</div>
                <div className="t-main mt-1.5 text-xl font-bold">{v}</div>
              </div>
            ))}
          </div>
        </Row>

        <Row title="Download your data" desc="Save your watchlist, history and preferences as a JSON file.">
          <button type="button" onClick={handleExport} className={BTN}>
            <Icon name="download" size={16} />
            Export data
          </button>
        </Row>

        <ActionRow
          title="Recent searches"
          desc="Removes the search suggestions saved on this device."
          label="Clear searches"
          icon="trash"
          armed={confirmKey === "searches"}
          onClick={() => confirmThen("searches", clearSearches)}
        />

        <ActionRow
          title="Watch history"
          desc={user ? "Removes watched trailers and resets your watched count." : "Log in to manage your history."}
          label="Clear history"
          icon="trash"
          armed={confirmKey === "history"}
          disabled={!user}
          onClick={() => confirmThen("history", clearHistory)}
        />

        <ActionRow
          title="Watchlist"
          desc={user ? "Removes every saved movie from your watchlist." : "Log in to manage your watchlist."}
          label="Clear watchlist"
          icon="trash"
          armed={confirmKey === "watchlist"}
          disabled={!user}
          onClick={() => confirmThen("watchlist", clearWatchlist)}
        />
      </Panel>

      <Panel title="Reset" desc="Start fresh when you need to.">
        <Row title="Reset appearance" desc="Restore theme, typeface, text size and motion to their defaults.">
          <button type="button" onClick={handleReset} className={BTN}>
            <Icon name="reset" size={16} />
            Reset settings
          </button>
        </Row>
      </Panel>
    </>
  );

  const account = user ? (
    <>
      <Panel title="Account" desc="Your sign-in details.">
        <Row title="Signed in as" stack>
          <div className="flex items-center gap-4">
            <img
              src={user.photoURL || FALLBACK_AVATAR}
              alt=""
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-full border border-black/10 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="t-main truncate font-semibold">{user.displayName || "Explorer"}</p>
              <p className="t-muted truncate text-sm">{user.email}</p>
            </div>
            <span className="mm-inset t-muted shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
              {providerLabel}
            </span>
          </div>
        </Row>
        <Row title="Profile" desc="View your stats and edit your details.">
          <Link to="/profile" className={BTN}>
            View profile
          </Link>
        </Row>
        <Row title="Log out" desc="Sign out of MovieMind AI on this device.">
          <button type="button" onClick={handleLogout} className={BTN}>
            <Icon name="logout" size={16} />
            Log out
          </button>
        </Row>
      </Panel>

      <Panel danger title="Delete account" desc="Permanently removes your profile, stats and history. This can't be undone.">
        <button type="button" onClick={openDelete} className={BTN_DANGER}>
          <Icon name="trash" size={16} />
          Delete my account
        </button>
      </Panel>
    </>
  ) : (
    <Panel title="Account" desc="Log in to sync your settings and manage your data.">
      <Row title="You're not logged in" desc="Your settings are saved on this device until you log in.">
        <Link
          to="/login"
          onClick={() => {
            try {
              localStorage.setItem("auth_redirect_target", "/settings");
            } catch {
              /* ignore */
            }
          }}
          className={BTN_PRIMARY}
        >
          Log in
        </Link>
      </Row>
    </Panel>
  );

  const panels = { appearance, display, streaming, data: dataPanel, account };
  const current = SECTIONS.find((s) => s.id === section);

  /* ───────────── render ───────────── */

  if (authLoading) {
    return (
      <div className="app-bg flex min-h-screen items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="app-bg min-h-screen overflow-x-clip font-sans">
      {/* ── top bar ── */}
      <header className="nav-bg border-line sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className={`${BTN} h-10 !px-3 sm:!px-4`}
          >
            <Icon name="back" size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <Link to="/" className="mm-focus flex items-center gap-2.5 rounded-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 font-black text-white">
              M
            </span>
            <span className="t-main hidden text-base font-bold tracking-tight sm:block">
              MovieMind <span className="text-red-500">AI</span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            <Link to="/movies" className="t-muted mm-hover mm-focus hidden rounded-lg px-3 py-2 text-sm font-semibold sm:inline-flex">
              Movies
            </Link>
            <Link to="/performance" className="t-muted mm-hover mm-focus hidden rounded-lg px-3 py-2 text-sm font-semibold sm:inline-flex">
              Dashboard
            </Link>
            {user ? (
              <Link to="/profile" aria-label="Your profile" className="mm-focus ml-1 rounded-full">
                <img
                  src={user.photoURL || FALLBACK_AVATAR}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="border-line h-9 w-9 rounded-full border object-cover"
                />
              </Link>
            ) : (
              <Link to="/login" className={`${BTN_PRIMARY} ml-1 !py-2`}>
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="t-muted text-xs">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="transition hover:text-red-500">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="t-main font-medium">
              Settings
            </li>
          </ol>
        </nav>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="t-main text-3xl font-bold tracking-tight">Settings</h1>
            <p className="t-muted mt-2 max-w-xl text-sm leading-6">
              Customise MovieMind AI. Changes save automatically and apply to every page straight away.
            </p>
          </div>
          <div className="flex h-9 items-center" aria-live="polite">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-500/25 transition-opacity ${
                saved ? "opacity-100" : "opacity-0"
              }`}
            >
              <Icon name="check" size={13} stroke={3} />
              Saved
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[250px_1fr]">
          {/* section nav */}
          <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-24">
            <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {SECTIONS.map((s) => {
                const on = section === s.id;
                return (
                  <li key={s.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => {
                        setSection(s.id);
                        setNotice(null);
                        setConfirmKey("");
                      }}
                      className={`mm-focus flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                        on ? "bg-red-500/10 text-red-500" : "t-muted mm-hover"
                      }`}
                    >
                      <Icon name={s.icon} size={17} />
                      <span className="whitespace-nowrap">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* content */}
          <div className="min-w-0 space-y-6" role="region" aria-label={current.label}>
            {notice && (
              <div
                role="status"
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  notice.tone === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                }`}
              >
                <span className="mt-0.5">
                  <Icon name={notice.tone === "ok" ? "check" : "info"} size={16} />
                </span>
                {notice.text}
              </div>
            )}
            {panels[section]}
          </div>
        </div>
      </main>

      <footer className="border-line border-t">
        <div className="t-muted mx-auto max-w-6xl px-4 py-6 text-xs sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MovieMind AI. All rights reserved.
        </div>
      </footer>

      {/* ── delete dialog ── */}
      {deleteOpen && user && (
        <div
          onClick={() => !deleting && setDeleteOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="menu-bg border-line relative w-full max-w-md rounded-2xl border p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              aria-label="Close"
              className="mm-btn mm-focus absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-40"
            >
              <Icon name="close" size={14} stroke={2.2} />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
              <Icon name="alert" size={22} />
            </div>
            <h2 id="delete-title" className="t-main mb-2 text-xl font-bold">
              Delete your account?
            </h2>
            <p className="t-muted mb-5 text-sm leading-relaxed">
              This permanently deletes your account and all of your data. Type{" "}
              <span className="t-main break-all font-semibold">{confirmWord}</span> to confirm.
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmWord}
              autoComplete="off"
              className={`${FIELD} mb-3 h-12 w-full`}
            />

            {needsPassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className={`${FIELD} mb-3 h-12 w-full`}
              />
            )}

            {!needsPassword && providerIds.includes("google.com") && (
              <p className="t-muted mb-3 text-xs">
                You'll be asked to confirm with Google before the account is deleted.
              </p>
            )}

            {deleteError && <p className="mb-3 text-sm font-semibold text-red-500">{deleteError}</p>}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className={`${BTN} flex-1`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete}
                className="mm-focus flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting…
                  </>
                ) : (
                  "Delete forever"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}