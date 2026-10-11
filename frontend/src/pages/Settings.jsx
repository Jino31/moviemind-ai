// src/pages/Settings.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, deleteDoc, increment, arrayUnion } from "firebase/firestore";
import {
  FaArrowLeft,
  FaMoon,
  FaSun,
  FaDesktop,
  FaUndo,
  FaTrashAlt,
  FaSpinner,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaSignInAlt,
} from "react-icons/fa";
import { useTheme, FONTS, FONT_SIZES, ensureFont } from "../context/ThemeContext";

/* ───────────────────────── CONSTANTS / HELPERS ───────────────────────── */

const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";

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

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const readRegion = () => {
  try {
    return localStorage.getItem("watch_region") || "IN";
  } catch {
    return "IN";
  }
};

/* ───────────────────────── SMALL UI PIECES ───────────────────────── */

function Card({ title, subtitle, danger = false, children }) {
  return (
    <section
      className={`rounded-[28px] p-6 sm:p-8 border backdrop-blur-xl ${
        danger ? "border-red-500/30 bg-red-500/[0.04]" : "border-line surface"
      }`}
    >
      <div className="mb-6">
        <h2 className={`text-xl font-black tracking-tight ${danger ? "text-red-500" : "t-main"}`}>{title}</h2>
        {subtitle && <p className="t-muted text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 py-5 first:pt-0 last:pb-0 border-b border-line last:border-b-0">
      <div className="min-w-0">
        <h3 className="t-main text-sm font-bold">{title}</h3>
        {description && <p className="t-muted text-xs mt-1 max-w-md leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 p-1 rounded-2xl surface border border-line"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              active
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md"
                : "t-muted surface-hover"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition cursor-pointer ${
        checked ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gray-400/40"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function ActionRow({ title, description, label, armed, disabled = false, onClick }) {
  return (
    <Row title={title} description={description}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
          armed ? "bg-red-600 border-red-500 text-white" : "surface surface-hover border-line t-main"
        }`}
      >
        {armed ? "Tap again to confirm" : label}
      </button>
    </Row>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

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

  const [region, setRegion] = useState(readRegion);

  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const [confirmKey, setConfirmKey] = useState("");
  const confirmTimer = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
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

  /* ── load every font once so the picker can preview them ── */
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

  /* ───────────── actions ───────────── */

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleReset = () => {
    resetPreferences();
    showToast("Appearance reset to defaults");
  };

  const handleRegion = (value) => {
    setRegion(value);
    try {
      localStorage.setItem("watch_region", value);
    } catch {
      // ignore
    }
    showToast("Streaming region saved");
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

  const clearSearches = () => {
    safeRemove("recent_searches");
    showToast("Recent searches cleared");
  };

  const clearHistory = async () => {
    if (!user) return;
    safeRemove(historyKey(user.uid));
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
    showToast("Watch history cleared");
  };

  const clearWatchlist = async () => {
    if (!user) return;
    safeRemove(watchlistKey(user.uid));
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
    showToast("Watchlist cleared");
  };

  /* ── delete account ── */
  const providerIds = user?.providerData?.map((p) => p.providerId) || [];
  const needsPassword = providerIds.includes("password");
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
      // fresh login is required before deleting an account
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

  /* ───────────── options ───────────── */

  const themeOptions = [
    { value: "dark", label: "Dark", icon: <FaMoon className="text-xs" /> },
    { value: "light", label: "Light", icon: <FaSun className="text-xs" /> },
    { value: "system", label: "System", icon: <FaDesktop className="text-xs" /> },
  ];

  const sizeOptions = Object.entries(FONT_SIZES).map(([value, s], i) => ({
    value,
    label: s.label,
    icon: <span style={{ fontSize: `${10 + i * 3}px`, lineHeight: 1 }}>A</span>,
  }));

  /* ───────────── render ───────────── */

  if (authLoading) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-red-500" />
      </div>
    );
  }

  return (
    <div className="app-bg min-h-screen overflow-x-clip font-sans pb-20">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-40 nav-bg backdrop-blur-2xl border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="shrink-0 h-11 px-3 sm:px-4 rounded-2xl surface surface-hover border border-line t-main font-bold text-sm flex items-center gap-2 transition hover:text-red-500 active:scale-95 cursor-pointer"
          >
            <FaArrowLeft className="text-xs" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="flex-1 t-main font-black text-xl sm:text-2xl tracking-tight">Settings</h1>

          <button
            onClick={handleReset}
            className="shrink-0 h-11 px-4 rounded-2xl surface surface-hover border border-line t-muted font-bold text-sm flex items-center gap-2 transition hover:text-red-500 cursor-pointer"
          >
            <FaUndo className="text-xs" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* ── account ── */}
        {user ? (
          <Card title="Account">
            <div className="flex items-center gap-4">
              <img
                src={user.photoURL || FALLBACK_AVATAR}
                alt=""
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border border-line"
              />
              <div className="flex-1 min-w-0">
                <p className="t-main font-bold truncate">{user.displayName || "Explorer"}</p>
                <p className="t-muted text-sm truncate">{user.email}</p>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="shrink-0 px-4 py-2.5 rounded-xl surface surface-hover border border-line t-main text-sm font-bold transition cursor-pointer"
              >
                View profile
              </button>
            </div>
          </Card>
        ) : (
          <Card title="You're not logged in" subtitle="Your settings are saved on this device. Log in to keep them on every device.">
            <button
              onClick={() => {
                localStorage.setItem("auth_redirect_target", "/settings");
                navigate("/login");
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:scale-105 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <FaSignInAlt className="text-xs" /> Log in
            </button>
          </Card>
        )}

        {/* ── appearance ── */}
        <Card
          title="Appearance"
          subtitle={
            isSynced
              ? "Changes apply instantly across the whole site and are saved to your account."
              : "Changes apply instantly across the whole site and are saved on this device."
          }
        >
          <Row title="Theme" description="Dark, light, or follow your device setting.">
            <Segmented label="Theme" options={themeOptions} value={themePreference} onChange={setTheme} />
          </Row>

          <div className="py-5 border-b border-line">
            <h3 className="t-main text-sm font-bold">Font</h3>
            <p className="t-muted text-xs mt-1 mb-4">Applies to every page.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(FONTS).map(([key, f]) => {
                const active = fontFamily === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFontFamily(key)}
                    aria-pressed={active}
                    className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer ${
                      active ? "border-red-500 surface" : "border-transparent surface surface-hover"
                    }`}
                  >
                    <span className="block text-2xl font-bold t-main" style={{ fontFamily: f.stack }}>
                      Aa
                    </span>
                    <span className="block text-sm font-bold t-main mt-1" style={{ fontFamily: f.stack }}>
                      {f.label}
                    </span>
                    <span className="block text-xs t-muted">{f.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Row title="Text size" description="Scales text and spacing everywhere.">
            <Segmented label="Text size" options={sizeOptions} value={fontSize} onChange={setFontSize} />
          </Row>

          <Row
            title="Reduce motion"
            description="Turns off animations and transitions. Turned on automatically if your device asks for it."
          >
            <Switch checked={reducedMotion} onChange={setReducedMotion} label="Reduce motion" />
          </Row>
        </Card>

        {/* ── streaming region ── */}
        <Card title="Where to watch" subtitle="Used on movie pages to show which services carry a title.">
          <Row title="Streaming region" description="Pick the country whose services you want to see.">
            <select
              value={region}
              onChange={(e) => handleRegion(e.target.value)}
              className="h-11 px-4 rounded-xl surface border border-line t-main text-sm font-semibold focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {REGIONS.map(([code, name]) => (
                <option key={code} value={code} className="text-black">
                  {name}
                </option>
              ))}
            </select>
          </Row>
        </Card>

        {/* ── data ── */}
        <Card title="Your data" subtitle="Clean up what MovieMind stores for you.">
          <ActionRow
            title="Recent searches"
            description="Removes the search suggestions saved on this device."
            label="Clear searches"
            armed={confirmKey === "searches"}
            onClick={() => confirmThen("searches", clearSearches)}
          />
          <ActionRow
            title="Watch history"
            description={user ? "Removes watched trailers and resets your watched count." : "Log in to manage your history."}
            label="Clear history"
            armed={confirmKey === "history"}
            disabled={!user}
            onClick={() => confirmThen("history", clearHistory)}
          />
          <ActionRow
            title="Watchlist"
            description={user ? "Removes every saved movie from your watchlist." : "Log in to manage your watchlist."}
            label="Clear watchlist"
            armed={confirmKey === "watchlist"}
            disabled={!user}
            onClick={() => confirmThen("watchlist", clearWatchlist)}
          />
        </Card>

        {/* ── danger zone ── */}
        {user && (
          <Card
            danger
            title="Delete account"
            subtitle="Permanently removes your profile, stats and history. This can't be undone."
          >
            <button
              onClick={openDelete}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <FaTrashAlt className="text-xs" /> Delete my account
            </button>
          </Card>
        )}
      </main>

      {/* ── delete dialog ── */}
      {deleteOpen && user && (
        <div
          onClick={() => !deleting && setDeleteOpen(false)}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md menu-bg border border-line rounded-3xl p-6 sm:p-8 shadow-2xl"
          >
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full surface surface-hover border border-line flex items-center justify-center t-main hover:text-red-500 transition cursor-pointer disabled:opacity-40"
            >
              <FaTimes className="text-sm" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-500 text-xl mb-4">
              <FaExclamationTriangle />
            </div>
            <h2 className="t-main text-xl font-black mb-2">Delete your account?</h2>
            <p className="t-muted text-sm leading-relaxed mb-5">
              This permanently deletes your account and all of your data. Type{" "}
              <span className="t-main font-bold break-all">{confirmWord}</span> to confirm.
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmWord}
              autoComplete="off"
              className="w-full h-12 px-4 rounded-xl surface border border-line t-main text-sm placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition mb-3"
            />

            {needsPassword && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full h-12 px-4 rounded-xl surface border border-line t-main text-sm placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition mb-3"
              />
            )}

            {!needsPassword && providerIds.includes("google.com") && (
              <p className="t-muted text-xs mb-3">You'll be asked to confirm with Google before the account is deleted.</p>
            )}

            {deleteError && <p className="text-red-500 text-sm font-semibold mb-3">{deleteError}</p>}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl surface surface-hover border border-line t-main font-bold text-sm transition cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" /> Deleting…
                  </>
                ) : (
                  "Delete forever"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── toast ── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 rounded-2xl menu-bg border border-line t-main text-sm font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <FaCheckCircle className="text-emerald-500" />
          {toast}
        </div>
      )}
    </div>
  );
}