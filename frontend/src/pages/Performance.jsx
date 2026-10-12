// frontend/src/pages/Performance.jsx
// Performance Insights — real-time Firestore dashboard, themed with the site's theme + Navbar.

import { useEffect, useMemo, useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaBookmark, FaCheckCircle, FaClock, FaChartLine, FaTrophy, FaLightbulb,
  FaHistory, FaWifi, FaLock, FaBrain,
} from "react-icons/fa";

// ▼▼ Same site navbar + theme as the other pages (adjust paths if needed) ▼▼
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
// ▲▲ ─────────────────────────────────────────────────────────────────── ▲▲

// Fallback navbar height (px) if it can't be measured. Use 0 if it isn't fixed/sticky.
const NAVBAR_FIXED_OFFSET = 72;

/* ───────────────────────── helpers ───────────────────────── */

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function toDate(v) {
  if (!v) return null;
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtLogTime(v) {
  const d = toDate(v);
  if (d) return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return typeof v === "string" ? v : "";
}

const GENRES = [
  { key: "genre_scifi",     label: "Sci-Fi" },
  { key: "genre_drama",     label: "Drama" },
  { key: "genre_adventure", label: "Adventure" },
  { key: "genre_comedy",    label: "Comedy" },
  { key: "genre_thriller",  label: "Thriller" },
  { key: "genre_action",    label: "Action" },
];

/* ───────────────────────── SVG charts (theme-aware via CSS vars) ───────────────────────── */

function Sparkline({ values, color }) {
  const w = 84, h = 34, pad = 3;
  if (!values || values.length < 2) {
    return (
      <svg width={w} height={h} aria-hidden="true">
        <line x1={pad} x2={w - pad} y1={h / 2} y2={h / 2} className="pm-spark-empty" />
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / (values.length - 1), h - pad - ((v - min) / span) * (h - pad * 2)]);
  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

function Gauge({ value, color }) {
  const r = 56, c = 2 * Math.PI * r;
  const has = value != null;
  const dash = has ? (Math.min(Math.max(value, 0), 100) / 100) * c : 0;
  return (
    <svg viewBox="0 0 140 140" className="pm-gauge" role="img" aria-label={has ? `AI match ${value}%` : "AI match not calculated"}>
      <circle cx="70" cy="70" r={r} className="pm-gauge-track" fill="none" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`} transform="rotate(-90 70 70)" style={{ transition: "stroke-dasharray .8s ease" }}
      />
      <text x="70" y="70" textAnchor="middle" className="pm-gauge-num">{has ? `${value}%` : "—"}</text>
      <text x="70" y="90" textAnchor="middle" className="pm-gauge-sub">AI MATCH</text>
    </svg>
  );
}

function Radar({ items }) {
  const size = 340, c = size / 2, R = 96, n = items.length;
  const max = Math.max(...items.map((i) => i.value), 0);
  const ang = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, f) => [c + R * f * Math.cos(ang(i)), c + R * f * Math.sin(ang(i))];
  const ring = (f) => items.map((_, i) => pt(i, f).join(",")).join(" ");
  const data = items.map((it, i) => pt(i, max > 0 ? 0.1 + 0.9 * (it.value / max) : 0).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="pm-radar" role="img" aria-label="Genre taste radar">
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} className="pm-grid-poly" fill="none" />)}
      {items.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={c} y1={c} x2={x} y2={y} className="pm-grid-line" />; })}
      {max > 0 && <polygon points={data} className="pm-radar-fill" />}
      {max > 0 && items.map((it, i) => { const [x, y] = pt(i, 0.1 + 0.9 * (it.value / max)); return <circle key={i} cx={x} cy={y} r="3.5" className="pm-radar-dot" />; })}
      {items.map((it, i) => {
        const [x, y] = pt(i, 1.27);
        const cos = Math.cos(ang(i));
        const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        return (
          <text key={it.label} x={x} y={y} textAnchor={anchor} dominantBaseline="central" className="pm-radar-label">
            {it.label} <tspan className="pm-radar-val">{it.value}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

function TrendChart({ points, color, format }) {
  const uid = useId().replace(/:/g, "");
  const W = 640, H = 260, L = 46, R = 20, T = 24, B = 38;
  const n = points.length;
  const max = Math.max(...points.map((p) => p.value), 1);
  const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(n - 1)},${H - B} L${x(0)},${H - B} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pm-trend" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => {
        const v = max * (1 - i / 3);
        const yy = T + ((H - T - B) / 3) * i;
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={yy} y2={yy} className="pm-grid-line" />
            <text x={L - 8} y={yy} textAnchor="end" dominantBaseline="central" className="pm-axis">{format(Math.round(v))}</text>
          </g>
        );
      })}
      {n > 1 && <path d={area} fill={`url(#g${uid})`} />}
      {n > 1 && <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="5" className="pm-dot" stroke={color} strokeWidth="2.5" />
          <text x={x(i)} y={y(p.value) - 12} textAnchor="middle" className="pm-dot-label">{format(p.value)}</text>
          <text x={x(i)} y={H - 12} textAnchor="middle" className="pm-axis">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function Performance() {
  const navigate = useNavigate();

  // theme — from the website's own theme context
  const themeCtx = useTheme() ?? {};
  const isDark =
    typeof themeCtx.theme === "string" ? themeCtx.theme === "dark"
    : themeCtx.isDark ?? themeCtx.darkMode ?? themeCtx.dark ?? true;
  const theme = isDark ? "dark" : "light";

  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState(null);
  const [data, setData] = useState(null); // raw user document
  const [dataReady, setDataReady] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [listenError, setListenError] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [metric, setMetric] = useState("watchlist");
  const [navOffset, setNavOffset] = useState(NAVBAR_FIXED_OFFSET);

  /* ── measure the site navbar ── */
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector("nav") || document.querySelector("body > header, #root > header");
      if (!nav) { setNavOffset(NAVBAR_FIXED_OFFSET); return; }
      const pos = getComputedStyle(nav).position;
      setNavOffset(pos === "fixed" || pos === "sticky" ? Math.round(nav.getBoundingClientRect().bottom) : 0);
    };
    measure();
    const t = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, []);

  /* ── online / offline ── */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /* ── auth: redirect guests ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        try { localStorage.setItem("auth_redirect_target", "/performance"); } catch { /* ignore */ }
        navigate("/login", { replace: true });
        return;
      }
      setUid(u.uid);
      setAuthReady(true);
    });
    return () => unsub();
  }, [navigate]);

  /* ── real-time user document ── */
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      doc(db, "users", uid),
      { includeMetadataChanges: true },
      (snap) => {
        setData(snap.exists() ? snap.data() : {});
        setFromCache(snap.metadata.fromCache);
        setListenError(false);
        setUpdatedAt(new Date());
        setDataReady(true);
      },
      (err) => {
        console.error("Performance listener failed:", err);
        setListenError(true);
        setData((prev) => prev ?? {});
        setDataReady(true);
      }
    );
    return () => unsub();
  }, [uid]);

  /* ───────── derived data (no invented numbers: missing data shows as 0 / "—") ───────── */

  const stats = useMemo(() => {
    const d = data ?? {};
    const watchlist = num(d.watchlistCount);
    const watched = num(d.watchedCount);
    const total = watchlist + watched;
    return {
      watchlist,
      watched,
      time: num(d.watchHours),
      completion: total > 0 ? Math.round((watched / total) * 100) : null,
      aiMatch: d.aiMatch != null && Number.isFinite(Number(d.aiMatch)) ? Math.round(Number(d.aiMatch)) : null,
    };
  }, [data]);

  const genres = useMemo(() => GENRES.map((g) => ({ label: g.label, value: num(data?.[g.key]) })), [data]);
  const genreTotal = genres.reduce((s, g) => s + g.value, 0);
  const rankedGenres = useMemo(() => [...genres].sort((a, b) => b.value - a.value), [genres]);

  // Optional history written by your app: users/{uid}.statsHistory = [{ date|label, watchlistCount, watchedCount, watchHours }]
  const history = useMemo(() => {
    const raw = Array.isArray(data?.statsHistory) ? data.statsHistory : [];
    return raw.slice(-11).map((h, i) => {
      const d = toDate(h.date ?? h.timestamp);
      const wl = num(h.watchlistCount);
      const wd = num(h.watchedCount);
      return {
        label: h.label ?? (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `#${i + 1}`),
        watchlist: wl,
        watched: wd,
        time: num(h.watchHours),
        completion: h.completionRate != null ? num(h.completionRate) : wl + wd > 0 ? Math.round((wd / (wl + wd)) * 100) : 0,
      };
    });
  }, [data]);

  const metrics = useMemo(
    () => [
      { id: "watchlist", label: "Watchlist", icon: <FaBookmark />, color: "#ef4444", value: stats.watchlist, text: String(stats.watchlist), fmt: (v) => String(v) },
      { id: "watched", label: "Watched", icon: <FaCheckCircle />, color: "#a855f7", value: stats.watched, text: String(stats.watched), fmt: (v) => String(v) },
      { id: "time", label: "Watch time", icon: <FaClock />, color: "#3b82f6", value: stats.time, text: `${stats.time}h`, fmt: (v) => `${v}h` },
      { id: "completion", label: "Completion", icon: <FaChartLine />, color: "#ec4899", value: stats.completion ?? 0, text: stats.completion == null ? "—" : `${stats.completion}%`, fmt: (v) => `${v}%` },
    ],
    [stats]
  );

  const seriesFor = (m) => {
    if (!history.length) return [];
    return [...history.map((h) => ({ label: h.label, value: h[m.id] })), { label: "Now", value: m.value }];
  };

  const activeMetric = metrics.find((m) => m.id === metric) ?? metrics[0];
  const activeSeries = seriesFor(activeMetric);

  const logs = useMemo(() => {
    const raw = Array.isArray(data?.sessionLogs) ? data.sessionLogs : [];
    return raw.slice(-8).reverse();
  }, [data]);

  const insights = useMemo(() => {
    const out = [];
    if (genreTotal > 0) out.push({ t: `Your top genre is ${rankedGenres[0].label} (${Math.round((rankedGenres[0].value / genreTotal) * 100)}% of your taste profile).` });
    if (stats.watched > 0 && stats.time > 0) out.push({ t: `You average about ${(stats.time / stats.watched).toFixed(1)} hours per watched title.` });
    if (stats.completion != null) out.push({ t: `${stats.completion}% of the titles you've tracked are watched.` });
    if (stats.watchlist > 0) out.push({ t: `${stats.watchlist} ${stats.watchlist === 1 ? "title is" : "titles are"} waiting in your watchlist.` });
    return out;
  }, [genreTotal, rankedGenres, stats]);

  const achievements = [
    { name: "Explorer", icon: "🌌", desc: "Watch 10 titles", cur: stats.watched, target: 10 },
    { name: "Collector", icon: "📦", desc: "Save 10 to your watchlist", cur: stats.watchlist, target: 10 },
    { name: "AI Fan", icon: "🤖", desc: "Reach an 80% AI match", cur: stats.aiMatch ?? 0, target: 80 },
    { name: "Binge Pro", icon: "🔥", desc: "Log 50 hours of watch time", cur: stats.time, target: 50 },
  ];

  const live = online && !fromCache && !listenError;

  /* ───────── render ───────── */

  if (!authReady || !dataReady) {
    return (
      <>
        <Navbar />
        <div className="pm-root" data-theme={theme} style={{ paddingTop: navOffset }}>
          <style>{CSS}</style>
          <div className="pm-loading">
            <div className="pm-spinner" />
            <p className="pm-muted text-xs tracking-widest">LOADING LIVE METRICS…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pm-root" data-theme={theme} style={{ paddingTop: navOffset }}>
        <style>{CSS}</style>
        <div className="pm-glow" />

        <main className="pm-wrap">
          {/* Page header */}
          <header className="pm-header pm-fade">
            <div>
              <h1 className="pm-title">Performance <span>Insights</span></h1>
              <p className="pm-muted pm-subtitle">Live view of your watchlist, viewing habits and taste profile.</p>
            </div>
            <div className="pm-status-group">
              <span className={`pm-pill ${live ? "pm-pill-live" : "pm-pill-off"}`}>
                <FaWifi /> {live ? "Live" : online ? "Reconnecting…" : "Offline"}
              </span>
              {updatedAt && <span className="pm-muted pm-updated">Updated {updatedAt.toLocaleTimeString()}</span>}
            </div>
          </header>

          {listenError && (
            <div className="pm-alert">Couldn't connect to live data. Check your Firestore rules and connection — showing the last known values.</div>
          )}

          {/* KPI cards */}
          <section className="pm-kpis pm-fade" aria-label="Key metrics">
            {metrics.map((m) => {
              const series = seriesFor(m).map((p) => p.value);
              const active = metric === m.id;
              return (
                <button
                  key={m.id}
                  className={`pm-card pm-kpi ${active ? "pm-kpi-active" : ""}`}
                  style={{ "--c": m.color }}
                  onClick={() => setMetric(m.id)}
                  aria-pressed={active}
                >
                  <div className="pm-kpi-top">
                    <span className="pm-kpi-icon">{m.icon}</span>
                    <Sparkline values={series} color={m.color} />
                  </div>
                  <div className="pm-kpi-num">{m.text}</div>
                  <div className="pm-muted pm-kpi-label">{m.label}</div>
                </button>
              );
            })}
          </section>

          {/* Trend + AI match */}
          <section className="pm-split pm-fade">
            <div className="pm-card pm-pad">
              <div className="pm-card-head">
                <div>
                  <h2 className="pm-h2">{activeMetric.label} trend</h2>
                  <p className="pm-muted pm-sm">Select a metric above to change the chart.</p>
                </div>
              </div>
              {activeSeries.length >= 2 ? (
                <TrendChart points={activeSeries} color={activeMetric.color} format={activeMetric.fmt} />
              ) : (
                <div className="pm-empty">
                  <FaChartLine className="pm-empty-icon" />
                  <p>Trend history will appear here as your activity builds up.</p>
                  <p className="pm-muted pm-sm">Current {activeMetric.label.toLowerCase()}: <strong>{activeMetric.text}</strong></p>
                </div>
              )}
            </div>

            <div className="pm-card pm-pad pm-center">
              <h2 className="pm-h2 self-start">Entertainment DNA</h2>
              <Gauge value={stats.aiMatch} color="#ef4444" />
              <p className="pm-muted pm-sm pm-center-text">
                {stats.aiMatch == null
                  ? "Your MovieMind match score appears once enough preferences are recorded."
                  : `Your taste matches MovieMind recommendations at ${stats.aiMatch}%.`}
              </p>
            </div>
          </section>

          {/* Taste radar + genre breakdown */}
          <section className="pm-split pm-split-even pm-fade">
            <div className="pm-card pm-pad">
              <h2 className="pm-h2">Taste radar</h2>
              <p className="pm-muted pm-sm">Updates instantly as your genre activity changes.</p>
              <Radar items={genres} />
              {genreTotal === 0 && <p className="pm-muted pm-sm pm-center-text">No genre activity yet.</p>}
            </div>

            <div className="pm-card pm-pad">
              <h2 className="pm-h2">Genre breakdown</h2>
              <p className="pm-muted pm-sm mb-4">Ranked by share of your activity.</p>
              <div className="pm-bars">
                {rankedGenres.map((g) => {
                  const pct = genreTotal > 0 ? Math.round((g.value / genreTotal) * 100) : 0;
                  return (
                    <div key={g.label} className="pm-bar-row">
                      <div className="pm-bar-head"><span>{g.label}</span><span className="pm-muted">{g.value} · {pct}%</span></div>
                      <div className="pm-bar-track"><div className="pm-bar-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Insights + activity */}
          <section className="pm-split pm-split-even pm-fade">
            <div className="pm-card pm-pad">
              <h2 className="pm-h2 pm-h2-icon"><FaLightbulb className="pm-accent" /> Insights</h2>
              {insights.length ? (
                <ul className="pm-list">
                  {insights.map((i, k) => <li key={k}><FaBrain className="pm-accent" /> <span>{i.t}</span></li>)}
                </ul>
              ) : (
                <p className="pm-muted pm-sm mt-3">Start watching and saving movies to unlock personalised insights.</p>
              )}
            </div>

            <div className="pm-card pm-pad">
              <h2 className="pm-h2 pm-h2-icon"><FaHistory className="pm-accent" /> Recent activity</h2>
              {logs.length ? (
                <ul className="pm-logs">
                  {logs.map((l, i) => (
                    <li key={i}>
                      <div className="min-w-0">
                        <p className="pm-log-text">{l.text}</p>
                        <span className="pm-muted pm-log-time">{fmtLogTime(l.timestamp)}</span>
                      </div>
                      <span className="pm-tag">{l.type || "SYNC"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pm-muted pm-sm mt-3">No activity recorded yet.</p>
              )}
            </div>
          </section>

          {/* Achievements */}
          <section className="pm-card pm-pad pm-fade">
            <h2 className="pm-h2 pm-h2-icon"><FaTrophy className="pm-accent" /> Achievements</h2>
            <div className="pm-ach">
              {achievements.map((a) => {
                const pct = Math.min(100, Math.round((a.cur / a.target) * 100));
                const done = a.cur >= a.target;
                return (
                  <div key={a.name} className={`pm-ach-item ${done ? "pm-ach-done" : ""}`}>
                    <div className="pm-ach-icon">{done ? a.icon : <FaLock />}</div>
                    <div className="pm-ach-name">{a.name}</div>
                    <div className="pm-muted pm-xs">{a.desc}</div>
                    <div className="pm-bar-track pm-ach-bar"><div className="pm-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <div className="pm-muted pm-xs">{Math.min(a.cur, a.target)} / {a.target}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

/* ───────────────────────── styles (themed via CSS variables) ───────────────────────── */

const CSS = `
.pm-root{
  --bg:#07070d; --glow-a:rgba(220,38,38,.25); --glow-b:rgba(124,58,237,.25);
  --surface:rgba(255,255,255,.045); --surface-2:rgba(255,255,255,.08);
  --border:rgba(255,255,255,.1); --text:#f4f4f8; --muted:rgba(244,244,248,.58);
  --accent:#f472b6; --shadow:0 14px 40px rgba(0,0,0,.4); --grid:rgba(255,255,255,.1);
  --ok:#34d399; --ok-bg:rgba(16,185,129,.15); --warn:#fbbf24; --warn-bg:rgba(245,158,11,.15);
}
.pm-root[data-theme="light"]{
  --bg:#f7f5fb; --glow-a:rgba(244,114,182,.32); --glow-b:rgba(129,140,248,.32);
  --surface:#ffffff; --surface-2:#f0edf7;
  --border:rgba(30,20,60,.11); --text:#17141f; --muted:rgba(23,20,31,.6);
  --accent:#db2777; --shadow:0 14px 40px rgba(60,30,90,.12); --grid:rgba(30,20,60,.12);
  --ok:#047857; --ok-bg:#d1fae5; --warn:#b45309; --warn-bg:#fef3c7;
}
.pm-root{position:relative;min-height:100vh;box-sizing:border-box;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:hidden;
  transition:background .3s,color .3s;-webkit-font-smoothing:antialiased}
.pm-glow{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.5;
  background:radial-gradient(circle at top left,var(--glow-a),transparent 38%),radial-gradient(circle at bottom right,var(--glow-b),transparent 38%)}
.pm-wrap{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:28px 18px 72px;display:flex;flex-direction:column;gap:20px}
.pm-muted{color:var(--muted)}.pm-accent{color:var(--accent)}
.pm-sm{font-size:12.5px}.pm-xs{font-size:11px}
.pm-card{background:var(--surface);border:1px solid var(--border);border-radius:22px;box-shadow:var(--shadow);backdrop-filter:blur(14px)}
.pm-pad{padding:22px}
.pm-h2{font-size:1.05rem;font-weight:800;margin-bottom:2px}
.pm-h2-icon{display:flex;align-items:center;gap:10px;margin-bottom:12px}

.pm-header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.pm-title{font-size:2rem;font-weight:900;letter-spacing:-.02em;line-height:1.1}
.pm-title span{background:linear-gradient(90deg,#ef4444,#ec4899,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent}
.pm-subtitle{font-size:13.5px;margin-top:4px}
.pm-status-group{display:flex;align-items:center;gap:12px}
.pm-updated{font-size:12px;font-family:ui-monospace,monospace}
.pm-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700}
.pm-pill-live{background:var(--ok-bg);color:var(--ok)}
.pm-pill-live::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ok);animation:pm-pulse 1.8s infinite}
.pm-pill-off{background:var(--warn-bg);color:var(--warn)}
.pm-alert{padding:12px 16px;border-radius:14px;background:var(--warn-bg);color:var(--warn);font-size:13px;font-weight:600}

.pm-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media (max-width:900px){.pm-kpis{grid-template-columns:repeat(2,1fr)}}
.pm-kpi{text-align:left;padding:18px;cursor:pointer;color:var(--text);transition:.25s;position:relative;overflow:hidden;font-family:inherit}
.pm-kpi:hover{transform:translateY(-2px);border-color:var(--c)}
.pm-kpi-active{border-color:var(--c);box-shadow:0 0 0 1px var(--c),var(--shadow)}
.pm-kpi-active::after{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--c)}
.pm-kpi-top{display:flex;align-items:center;justify-content:space-between}
.pm-kpi-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--c);font-size:15px}
.pm-kpi-num{font-size:2rem;font-weight:900;line-height:1.1;margin-top:14px}
.pm-kpi-label{font-size:12px;font-weight:600;margin-top:2px}
.pm-spark-empty{stroke:var(--grid);stroke-width:2;stroke-dasharray:4 4}

.pm-split{display:grid;grid-template-columns:2fr 1fr;gap:16px}
.pm-split-even{grid-template-columns:1fr 1fr}
@media (max-width:900px){.pm-split,.pm-split-even{grid-template-columns:1fr}}
.pm-card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
.pm-trend{width:100%;height:auto;display:block}
.pm-axis{fill:var(--muted);font-size:11px;font-family:ui-monospace,monospace}
.pm-dot{fill:var(--bg)}
.pm-dot-label{fill:var(--text);font-size:11px;font-weight:700;font-family:ui-monospace,monospace}
.pm-grid-line{stroke:var(--grid);stroke-width:1}
.pm-grid-poly{stroke:var(--grid);stroke-width:1}
.pm-empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;color:var(--muted);font-size:14px}
.pm-empty-icon{font-size:30px;color:var(--accent);opacity:.7;margin-bottom:6px}
.pm-empty strong{color:var(--text)}

.pm-center{display:flex;flex-direction:column;align-items:center;gap:6px}
.pm-center-text{text-align:center;margin-top:8px}
.pm-gauge{width:190px;height:190px;margin:6px 0}
.pm-gauge-track{stroke:var(--surface-2)}
.pm-gauge-num{fill:var(--text);font-size:30px;font-weight:900}
.pm-gauge-sub{fill:var(--muted);font-size:8.5px;font-weight:800;letter-spacing:.18em}

.pm-radar{width:100%;max-width:380px;display:block;margin:6px auto 0}
.pm-radar-fill{fill:rgba(239,68,68,.22);stroke:#ef4444;stroke-width:2.2;stroke-linejoin:round}
.pm-radar-dot{fill:#ef4444}
.pm-radar-label{fill:var(--text);font-size:11.5px;font-weight:700}
.pm-radar-val{fill:var(--muted);font-family:ui-monospace,monospace;font-weight:600}

.pm-bars{display:flex;flex-direction:column;gap:14px}
.pm-bar-head{display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:6px}
.pm-bar-track{height:8px;border-radius:999px;background:var(--surface-2);overflow:hidden}
.pm-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#ef4444,#ec4899);transition:width .7s ease}

.pm-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.pm-list li{display:flex;gap:12px;align-items:flex-start;font-size:13.5px;line-height:1.5;font-weight:500}
.pm-list li svg{margin-top:4px;flex-shrink:0}
.pm-logs{list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;max-height:320px;overflow-y:auto}
.pm-logs li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;border-radius:13px;background:var(--surface-2);border:1px solid var(--border)}
.pm-log-text{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pm-log-time{font-size:11px;font-family:ui-monospace,monospace}
.pm-tag{font-size:9.5px;font-weight:800;letter-spacing:.06em;padding:3px 8px;border-radius:7px;background:var(--surface);border:1px solid var(--border);color:var(--muted);flex-shrink:0}

.pm-ach{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media (max-width:900px){.pm-ach{grid-template-columns:repeat(2,1fr)}}
.pm-ach-item{padding:16px;border-radius:16px;background:var(--surface-2);border:1px solid var(--border);text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;opacity:.85}
.pm-ach-done{opacity:1;border-color:var(--accent)}
.pm-ach-icon{font-size:26px;height:34px;display:flex;align-items:center;color:var(--muted)}
.pm-ach-name{font-weight:800;font-size:14px}
.pm-ach-bar{width:100%;margin:8px 0 2px}

.pm-loading{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.pm-spinner{width:42px;height:42px;border-radius:50%;border:4px solid var(--accent);border-top-color:transparent;animation:pm-spin .8s linear infinite}
.pm-fade{animation:pm-in .4s ease both}
@keyframes pm-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pm-spin{to{transform:rotate(360deg)}}
@keyframes pm-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}
`;