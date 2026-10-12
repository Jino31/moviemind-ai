// src/pages/Admin.jsx
//
// Real-time admin console for MovieMind AI.
//   - Login: admin username + password, verified by YOUR Render server (env vars), which
//     returns a Firebase custom token with { admin: true }
//   - Tabs: Overview, Feedback, Announcements, Ads, Users, Site
//   - Everything updates live through Firestore onSnapshot listeners.
//
// SECURITY: the real protection is in firestore.rules (isAdmin()). This page only
// decides what to *show*; never put an admin password in front-end code.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  FaAd,
  FaArrowLeft,
  FaBullhorn,
  FaChartLine,
  FaCheck,
  FaCog,
  FaComments,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaReply,
  FaRobot,
  FaSearch,
  FaSignOutAlt,
  FaStar,
  FaTrash,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { auth, db } from "../firebase";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

// Public URL of the admin-server deployed on Render (not a secret).
const ADMIN_API = (import.meta.env.VITE_ADMIN_API_URL || "").replace(/\/$/, "");

const safeUrl = (value) => {
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch {
    return "";
  }
};

const fmtTime = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "just now";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
};

/* Live listener for a whole collection. */
function useLive(name, { order = "createdAt", max = 300 } = {}) {
  const [state, setState] = useState({ items: [], loading: true, error: "" });
  useEffect(() => {
    const ref = collection(db, name);
    const q = order ? query(ref, orderBy(order, "desc"), limit(max)) : query(ref, limit(max));
    return onSnapshot(
      q,
      (snap) =>
        setState({
          items: snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })),
          loading: false,
          error: "",
        }),
      (err) => setState((s) => ({ ...s, loading: false, error: err.message }))
    );
  }, [name, order, max]);
  return state;
}

/* ------------------------------------------------------------------ */
/* small UI pieces (top level on purpose, so they never remount)       */
/* ------------------------------------------------------------------ */

const TONES = {
  red: "bg-red-500/15 text-red-500",
  green: "bg-emerald-500/15 text-emerald-500",
  amber: "bg-amber-500/15 text-amber-500",
  blue: "bg-sky-500/15 text-sky-500",
  gray: "bg-gray-500/15 t-muted",
};

function Pill({ tone = "gray", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`mm-focus relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-red-600" : "bg-gray-500/40"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function Stars({ value = 0 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} className={`text-xs ${n <= value ? "text-amber-400" : "t-muted opacity-30"}`} />
      ))}
    </span>
  );
}

function ConfirmDelete({ onConfirm }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
      className="mm-btn-danger mm-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
    >
      <FaTrash className="text-[10px]" />
      {armed ? "Confirm?" : "Delete"}
    </button>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="mm-card rounded-2xl p-4">
      <p className="t-muted text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      {sub ? <p className="t-muted mt-1 text-xs">{sub}</p> : null}
    </div>
  );
}

function Empty({ text }) {
  return <div className="mm-inset t-muted rounded-2xl p-8 text-center text-sm">{text}</div>;
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="t-muted mb-1 block text-xs font-semibold">{label}</span>
      {children}
      {hint ? <span className="t-muted mt-1 block text-[11px]">{hint}</span> : null}
    </label>
  );
}

const inputCls = "mm-field w-full rounded-xl px-3 py-2 text-sm";
const primaryBtn =
  "mm-focus inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50";

/* ------------------------------------------------------------------ */
/* login                                                               */
/* ------------------------------------------------------------------ */

function LoginScreen({ deniedEmail }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!ADMIN_API) throw new Error("Admin server URL is not set (VITE_ADMIN_API_URL).");
      const res = await fetch(`${ADMIN_API}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error("Too many attempts. Try again in 15 minutes.");
      if (!res.ok || !data.token) {
        throw new Error(res.status === 401 ? "Wrong username or password." : data.error || "Sign-in failed.");
      }
      await signInWithCustomToken(auth, data.token);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Can't reach the admin server. It may be waking up, so try again in a minute."
          : err.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-bg t-main flex min-h-screen items-center justify-center px-4">
      <div className="mm-card w-full max-w-sm rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-red-600/15 text-xl text-red-500">
            <FaUserShield />
          </span>
          <h1 className="text-xl font-extrabold">Admin sign in</h1>
          <p className="t-muted mt-1 text-sm">MovieMind AI control panel</p>
        </div>

        {deniedEmail ? (
          <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-500">
            You're signed in as <b>{deniedEmail}</b>, which is a normal user account. Signing in below with the admin
            username and password switches this browser to the admin session.
          </div>
        ) : null}
          <form onSubmit={submit} className="space-y-4" autoComplete="on">
            <Field label="Username">
              <input
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="admin"
              />
            </Field>
            <Field label="Admin password">
              <div className="relative">
                <input
                  className={`${inputCls} pr-10`}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="t-muted mm-focus absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            {error ? (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
              <FaLock className="text-xs" />
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

        <Link to="/" className="t-muted mt-5 flex items-center justify-center gap-2 text-xs hover:underline">
          <FaArrowLeft className="text-[10px]" /> Back to website
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* tabs                                                                */
/* ------------------------------------------------------------------ */

/* Support tickets use the same shape SupportConsole writes:
   uid, userName, userEmail, category, message, status, autoReply, devReply, timestamp */
function ticketState(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("resolv") || s.includes("closed") || s.includes("done")) return "resolved";
  if (s.includes("progress")) return "progress";
  return "open";
}

const STATE_TONE = { open: "amber", progress: "blue", resolved: "green" };
const CAT_TONE = { Feedback: "blue", "Bug Report": "red", "Get Help": "amber" };

function OverviewTab({ feedback, announcements, ads, users, goTo }) {
  const fb = feedback.items;
  const open = fb.filter((f) => ticketState(f.status) !== "resolved");
  const needsReply = open.filter((f) => !f.devReply);
  const impressions = ads.items.reduce((a, x) => a + (x.impressions || 0), 0);
  const clicks = ads.items.reduce((a, x) => a + (x.clicks || 0), 0);
  const ctr = impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : "–";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Users" value={users.items.length} sub="registered accounts" />
        <Stat label="Open tickets" value={open.length} sub={`${fb.length} total`} />
        <Stat label="Needs reply" value={needsReply.length} sub="no developer reply yet" />
        <Stat label="Ad CTR" value={ctr} sub={`${clicks} clicks / ${impressions} views`} />
        <Stat
          label="Live announcements"
          value={announcements.items.filter((a) => a.active).length}
          sub={`${announcements.items.length} total`}
        />
        <Stat label="Live ads" value={ads.items.filter((a) => a.active).length} sub={`${ads.items.length} total`} />
      </div>

      <section className="mm-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Latest tickets</h2>
          <button onClick={() => goTo("feedback")} className="text-xs font-semibold text-red-500 hover:underline">
            View all
          </button>
        </div>
        {fb.length === 0 ? (
          <p className="t-muted text-sm">No tickets yet. They appear here the moment a user submits one.</p>
        ) : (
          <ul className="mm-divide divide-y">
            {fb.slice(0, 5).map((f) => (
              <li key={f.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={CAT_TONE[f.category] || "gray"}>{f.category || "Feedback"}</Pill>
                  <Pill tone={STATE_TONE[ticketState(f.status)]}>{f.status || "Submitted"}</Pill>
                  <span className="t-muted text-xs">{fmtTime(f.timestamp)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const FB_FILTERS = [
  ["all", "All"],
  ["open", "Open"],
  ["progress", "In progress"],
  ["resolved", "Resolved"],
];
const TICKET_CATEGORIES = ["Feedback", "Bug Report", "Get Help"];

function TicketCard({ t, act }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const state = ticketState(t.status);
  const ref = doc(db, "feedback", t.id);

  const setStatus = (status) => act(() => updateDoc(ref, { status }));

  const openComposer = () => {
    setText(t.devReply || "");
    setReplying(true);
  };

  const sendReply = (resolve) => {
    const reply = text.trim();
    if (!reply) return;
    act(
      () =>
        updateDoc(ref, {
          devReply: reply.slice(0, 1000),
          devReplyAt: serverTimestamp(),
          ...(resolve ? { status: "Resolved" } : {}),
        }),
      "Reply sent. The user sees it live."
    );
    setReplying(false);
    setText("");
  };

  return (
    <li className="mm-card rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={CAT_TONE[t.category] || "gray"}>{t.category || "Feedback"}</Pill>
        <Pill tone={STATE_TONE[state]}>{t.status || "Submitted"}</Pill>
        {!t.devReply && state !== "resolved" ? <Pill tone="red">Needs reply</Pill> : null}
        <span className="t-muted ml-auto text-xs">{fmtTime(t.timestamp)}</span>
      </div>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{t.message}</p>
      <p className="t-muted mt-2 text-xs">
        {t.userName || "Anonymous"}
        {t.userEmail ? ` · ${t.userEmail}` : ""}
      </p>

      {t.autoReply ? (
        <div className="mm-inset mt-3 rounded-xl p-3 text-sm">
          <p className="t-muted mb-1 flex items-center gap-1.5 text-xs font-bold">
            <FaRobot /> AI reply
          </p>
          <p className="whitespace-pre-wrap">{t.autoReply}</p>
        </div>
      ) : null}

      {t.devReply && !replying ? (
        <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
            <FaCheck className="text-[10px]" /> Your reply
          </p>
          <p className="whitespace-pre-wrap">{t.devReply}</p>
        </div>
      ) : null}

      {replying ? (
        <div className="mt-3 space-y-2">
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Write a reply. The user sees it instantly in their Support Center."
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => sendReply(false)} disabled={!text.trim()} className={primaryBtn}>
              <FaReply className="text-xs" /> Send reply
            </button>
            <button
              onClick={() => sendReply(true)}
              disabled={!text.trim()}
              className="mm-btn mm-focus rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Send &amp; resolve
            </button>
            <button onClick={() => setReplying(false)} className="mm-btn mm-focus rounded-xl px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={openComposer}
            className="mm-btn mm-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
          >
            <FaReply className="text-[10px]" /> {t.devReply ? "Edit reply" : "Reply"}
          </button>
          {state === "open" ? (
            <button onClick={() => setStatus("In Progress")} className="mm-btn mm-focus rounded-lg px-2.5 py-1.5 text-xs font-semibold">
              Mark in progress
            </button>
          ) : null}
          {state !== "resolved" ? (
            <button
              onClick={() => setStatus("Resolved")}
              className="mm-btn mm-focus inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            >
              <FaCheck className="text-[10px]" /> Resolve
            </button>
          ) : (
            <button onClick={() => setStatus("In Progress")} className="mm-btn mm-focus rounded-lg px-2.5 py-1.5 text-xs font-semibold">
              Reopen
            </button>
          )}
          <ConfirmDelete onConfirm={() => act(() => deleteDoc(ref), "Ticket deleted")} />
        </div>
      )}
    </li>
  );
}

function FeedbackTab({ feedback, act }) {
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = { all: feedback.items.length, open: 0, progress: 0, resolved: 0 };
    feedback.items.forEach((f) => {
      c[ticketState(f.status)] += 1;
    });
    return c;
  }, [feedback.items]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feedback.items.filter((f) => {
      if (filter !== "all" && ticketState(f.status) !== filter) return false;
      if (category !== "all" && f.category !== category) return false;
      if (!q) return true;
      return [f.message, f.userName, f.userEmail, f.category].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [feedback.items, filter, category, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FB_FILTERS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`mm-focus rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === key ? "bg-red-600 text-white" : "mm-btn"
              }`}
            >
              {label} <span className="opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select className={`${inputCls} sm:w-40`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="relative w-full sm:w-56">
            <FaSearch className="t-muted absolute left-3 top-1/2 -translate-y-1/2 text-xs" />
            <input
              className={`${inputCls} pl-8`}
              placeholder="Search tickets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty text={feedback.items.length ? "Nothing matches this filter." : "No tickets yet."} />
      ) : (
        <ul className="space-y-3">
          {shown.map((t) => (
            <TicketCard key={t.id} t={t} act={act} />
          ))}
        </ul>
      )}
    </div>
  );
}

const ANN_STYLE = {
  info: "border-sky-500/40 bg-sky-500/10 text-sky-500",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-500",
};

function AnnouncementsTab({ announcements, act }) {
  const [form, setForm] = useState({ title: "", message: "", type: "info", active: true });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setBusy(true);
    await act(
      () =>
        addDoc(collection(db, "announcements"), {
          title: form.title.trim().slice(0, 100),
          message: form.message.trim().slice(0, 500),
          type: form.type,
          active: form.active,
          createdAt: serverTimestamp(),
        }),
      form.active ? "Announcement is live" : "Announcement saved as draft"
    );
    setForm({ title: "", message: "", type: "info", active: true });
    setBusy(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="mm-card h-fit space-y-4 rounded-2xl p-4">
        <h2 className="text-sm font-bold">New announcement</h2>
        <Field label="Title">
          <input className={inputCls} value={form.title} onChange={set("title")} maxLength={100} placeholder="New feature!" />
        </Field>
        <Field label="Message">
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={form.message}
            onChange={set("message")}
            maxLength={500}
            placeholder="What do you want users to know?"
          />
        </Field>
        <Field label="Style">
          <select className={inputCls} value={form.type} onChange={set("type")}>
            <option value="info">Info (blue)</option>
            <option value="success">Success (green)</option>
            <option value="warning">Warning (amber)</option>
          </select>
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-sm">Publish immediately</span>
          <Switch on={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Publish immediately" />
        </div>
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          <FaBullhorn className="text-xs" /> {busy ? "Saving…" : "Create"}
        </button>
      </form>

      <div className="space-y-3">
        {announcements.items.length === 0 ? (
          <Empty text="No announcements yet." />
        ) : (
          announcements.items.map((a) => (
            <div key={a.id} className="mm-card rounded-2xl p-4">
              <div className={`rounded-xl border px-3 py-2 text-sm ${ANN_STYLE[a.type] || ANN_STYLE.info}`}>
                <b>{a.title}</b>
                <span className="opacity-90"> — {a.message}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Switch
                  on={!!a.active}
                  onChange={(v) => act(() => updateDoc(doc(db, "announcements", a.id), { active: v }))}
                  label="Active"
                />
                <Pill tone={a.active ? "green" : "gray"}>{a.active ? "Live on site" : "Hidden"}</Pill>
                <span className="t-muted text-xs">{fmtTime(a.createdAt)}</span>
                <span className="ml-auto">
                  <ConfirmDelete
                    onConfirm={() => act(() => deleteDoc(doc(db, "announcements", a.id)), "Announcement deleted")}
                  />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const PLACEMENTS = [
  ["all", "Everywhere"],
  ["home", "Home page"],
  ["movies", "Movies page"],
  ["details", "Movie details"],
];

function AdsTab({ ads, act }) {
  const empty = { title: "", text: "", imageUrl: "", linkUrl: "", cta: "Learn more", placement: "all", active: true };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const link = safeUrl(form.linkUrl);
    const image = form.imageUrl.trim() ? safeUrl(form.imageUrl) : "";
    if (!form.title.trim()) return setFormError("Add a title.");
    if (!link) return setFormError("Link must be a full http(s) URL.");
    if (form.imageUrl.trim() && !image) return setFormError("Image must be a full http(s) URL.");
    setFormError("");
    setBusy(true);
    await act(
      () =>
        addDoc(collection(db, "ads"), {
          title: form.title.trim().slice(0, 80),
          text: form.text.trim().slice(0, 200),
          imageUrl: image,
          linkUrl: link,
          cta: form.cta.trim().slice(0, 24) || "Learn more",
          placement: form.placement,
          active: form.active,
          impressions: 0,
          clicks: 0,
          createdAt: serverTimestamp(),
        }),
      "Ad created"
    );
    setForm(empty);
    setBusy(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="mm-card h-fit space-y-4 rounded-2xl p-4">
        <h2 className="text-sm font-bold">New ad</h2>
        <Field label="Title">
          <input className={inputCls} value={form.title} onChange={set("title")} maxLength={80} />
        </Field>
        <Field label="Text (optional)">
          <textarea className={`${inputCls} min-h-[70px] resize-y`} value={form.text} onChange={set("text")} maxLength={200} />
        </Field>
        <Field label="Image URL (optional)" hint="Use a direct https link to an image.">
          <input className={inputCls} value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…" />
        </Field>
        <Field label="Link URL">
          <input className={inputCls} value={form.linkUrl} onChange={set("linkUrl")} placeholder="https://…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button text">
            <input className={inputCls} value={form.cta} onChange={set("cta")} maxLength={24} />
          </Field>
          <Field label="Show on">
            <select className={inputCls} value={form.placement} onChange={set("placement")}>
              {PLACEMENTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Live immediately</span>
          <Switch on={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Live immediately" />
        </div>
        {formError ? <p className="text-xs text-red-500">{formError}</p> : null}
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          <FaAd className="text-xs" /> {busy ? "Saving…" : "Create ad"}
        </button>
      </form>

      <div className="space-y-3">
        {ads.items.length === 0 ? (
          <Empty text="No ads yet." />
        ) : (
          ads.items.map((a) => {
            const imp = a.impressions || 0;
            const clk = a.clicks || 0;
            return (
              <div key={a.id} className="mm-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row">
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt=""
                    className="h-24 w-full rounded-xl object-cover sm:w-40"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="truncate text-sm">{a.title}</b>
                    <Pill tone="blue">{PLACEMENTS.find(([v]) => v === a.placement)?.[1] || a.placement}</Pill>
                    <Pill tone={a.active ? "green" : "gray"}>{a.active ? "Live" : "Paused"}</Pill>
                  </div>
                  {a.text ? <p className="t-muted mt-1 text-sm">{a.text}</p> : null}
                  <a
                    href={safeUrl(a.linkUrl) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 break-all text-xs text-red-500 hover:underline"
                  >
                    {a.linkUrl} <FaExternalLinkAlt className="text-[9px]" />
                  </a>
                  <p className="t-muted mt-2 text-xs tabular-nums">
                    {imp} views · {clk} clicks · {imp ? ((clk / imp) * 100).toFixed(1) : "0.0"}% CTR
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Switch
                      on={!!a.active}
                      onChange={(v) => act(() => updateDoc(doc(db, "ads", a.id), { active: v }))}
                      label="Active"
                    />
                    <span className="ml-auto">
                      <ConfirmDelete onConfirm={() => act(() => deleteDoc(doc(db, "ads", a.id)), "Ad deleted")} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function UsersTab({ users }) {
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.items
      .map((u) => ({
        id: u.id,
        name: u.name || u.displayName || u.username || "",
        email: u.email || "",
        watchlist: u.watchlistCount || 0,
        watched: u.watchedCount || 0,
      }))
      .filter((u) => !q || `${u.name} ${u.email} ${u.id}`.toLowerCase().includes(q))
      .sort((a, b) => b.watched + b.watchlist - (a.watched + a.watchlist));
  }, [users.items, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="t-muted text-sm">{users.items.length} accounts · live</p>
        <div className="relative w-full sm:w-64">
          <FaSearch className="t-muted absolute left-3 top-1/2 -translate-y-1/2 text-xs" />
          <input className={`${inputCls} pl-8`} placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      {rows.length === 0 ? (
        <Empty text="No users found." />
      ) : (
        <div className="mm-card overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="t-muted text-xs uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 text-right">Watchlist</th>
                <th className="px-4 py-3 text-right">Watched</th>
              </tr>
            </thead>
            <tbody className="mm-divide divide-y">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.name || u.email || "Unnamed user"}</p>
                    <p className="t-muted text-xs">
                      {u.name && u.email ? `${u.email} · ` : ""}
                      {u.id.slice(0, 8)}…
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.watchlist}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.watched}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SiteTab({ site, act, adminEmail }) {
  const [message, setMessage] = useState("");
  useEffect(() => setMessage(site?.maintenanceMessage || ""), [site?.maintenanceMessage]);

  const save = (patch, ok) => act(() => setDoc(doc(db, "config", "site"), patch, { merge: true }), ok);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="mm-card space-y-4 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold">Maintenance banner</h2>
            <p className="t-muted mt-1 text-xs">Shows a banner on every page, live, until you turn it off.</p>
          </div>
          <Switch
            on={!!site?.maintenance}
            onChange={(v) => save({ maintenance: v }, v ? "Maintenance banner is live" : "Maintenance banner removed")}
            label="Maintenance mode"
          />
        </div>
        <Field label="Banner message">
          <textarea
            className={`${inputCls} min-h-[70px] resize-y`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            placeholder="We're doing some maintenance. Some features may be unavailable."
          />
        </Field>
        <button
          onClick={() => save({ maintenanceMessage: message.trim().slice(0, 300) }, "Message saved")}
          className={primaryBtn}
        >
          Save message
        </button>
      </section>

      <section className="mm-card rounded-2xl p-4">
        <h2 className="text-sm font-bold">Signed in as</h2>
        <p className="t-muted mt-1 text-sm">{adminEmail}</p>
        <p className="t-muted mt-3 text-xs">
          The admin username and password live in your Render service's environment variables. To change
          them, edit <code>ADMIN_USERNAME</code> / <code>ADMIN_PASSWORD</code> there and redeploy.
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* dashboard shell                                                     */
/* ------------------------------------------------------------------ */

function Dashboard({ user }) {
  const [tab, setTab] = useState("overview");
  const [notice, setNotice] = useState(null);
  const [, setTick] = useState(0);
  const [site, setSite] = useState({});

  const feedback = useLive("feedback", { order: "timestamp" });
  const announcements = useLive("announcements");
  const ads = useLive("ads");
  const users = useLive("users", { order: null, max: 500 });

  useEffect(() => onSnapshot(doc(db, "config", "site"), (s) => setSite(s.data() || {}), () => {}), []);

  // keep "5m ago" labels fresh
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const act = useCallback(async (fn, okMessage) => {
    try {
      await fn();
      if (okMessage) setNotice({ text: okMessage, tone: "ok" });
    } catch (err) {
      setNotice({
        text:
          err.code === "permission-denied"
            ? "Permission denied. Publish the new firestore.rules and sign in through the admin login."
            : err.message,
        tone: "err",
      });
    }
  }, []);

  const firstError = [feedback, announcements, ads, users].find((s) => s.error)?.error;
  const newFeedback = feedback.items.filter((f) => ticketState(f.status) !== "resolved" && !f.devReply).length;

  const tabs = [
    ["overview", "Overview", FaChartLine, 0],
    ["feedback", "Support", FaComments, newFeedback],
    ["announcements", "Announcements", FaBullhorn, 0],
    ["ads", "Ads", FaAd, 0],
    ["users", "Users", FaUsers, 0],
    ["site", "Site", FaCog, 0],
  ];

  return (
    <div className="app-bg t-main min-h-screen">
      <header className="nav-bg sticky top-0 z-30 border-b border-line backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-600/15 text-red-500">
            <FaUserShield />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold">MovieMind Admin</p>
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="mm-btn mm-focus inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold">
              <FaArrowLeft className="text-[10px]" /> <span className="hidden sm:inline">Website</span>
            </Link>
            <button
              onClick={() => signOut(auth)}
              className="mm-btn-danger mm-focus inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              <FaSignOutAlt className="text-[10px]" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Admin sections">
          {tabs.map(([key, label, Icon, badge]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`mm-focus flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === key ? "bg-red-600 text-white" : "t-muted hover:bg-gray-500/10"
              }`}
            >
              <Icon className="text-xs" />
              {label}
              {badge > 0 ? (
                <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-red-600">{badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {firstError ? (
          <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
            A live connection failed: {firstError}. If it says "permissions", publish the new firestore.rules and make sure you signed in through the admin login.
          </div>
        ) : null}

        {tab === "overview" && (
          <OverviewTab feedback={feedback} announcements={announcements} ads={ads} users={users} goTo={setTab} />
        )}
        {tab === "feedback" && <FeedbackTab feedback={feedback} act={act} />}
        {tab === "announcements" && <AnnouncementsTab announcements={announcements} act={act} />}
        {tab === "ads" && <AdsTab ads={ads} act={act} />}
        {tab === "users" && <UsersTab users={users} />}
        {tab === "site" && <SiteTab site={site} act={act} adminEmail={user.email || "Admin console"} />}
      </main>

      {notice ? (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${
            notice.tone === "err" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* page: decides login vs dashboard                                    */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const [phase, setPhase] = useState("checking"); // checking | out | denied | ok
  const [user, setUser] = useState(null);
  const seq = useRef(0);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Admin · MovieMind";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        const mine = ++seq.current;
        if (!u) {
          setUser(null);
          setPhase("out");
          return;
        }
        setUser(u);
        setPhase("checking");
        let isAdmin = false;
        try {
          isAdmin = (await u.getIdTokenResult()).claims.admin === true;
        } catch {
          isAdmin = false;
        }
        if (mine === seq.current) setPhase(isAdmin ? "ok" : "denied");
      }),
    []
  );

  if (phase === "checking") {
    return (
      <div className="app-bg t-muted grid min-h-screen place-items-center text-sm">Checking access…</div>
    );
  }
  if (phase === "ok" && user) return <Dashboard user={user} />;
  return <LoginScreen deniedEmail={phase === "denied" ? user?.email || "This account" : ""} />;
}