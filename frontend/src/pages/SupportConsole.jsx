// frontend/src/pages/SupportConsole.jsx
// Support Center — real-time tickets, AI auto-reply, site Navbar + theme.

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, ai } from "../firebase";
import {
  collection, addDoc, updateDoc, query, where, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaPaperPlane, FaCommentDots, FaBug, FaLifeRing, FaLock, FaRobot, FaInbox,
  FaCheckCircle, FaExclamationCircle, FaWifi,
} from "react-icons/fa";

// ▼▼ Same site navbar + theme as the other pages (adjust paths if needed) ▼▼
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
// ▲▲ ─────────────────────────────────────────────────────────────────── ▲▲

// Fallback navbar height (px) if it can't be measured. Use 0 if it isn't fixed/sticky.
const NAVBAR_FIXED_OFFSET = 72;
const MAX_LEN = 1000;
const DRAFT_KEY = "support_drafts_v1";

const CATEGORIES = [
  { id: "Feedback",   icon: <FaCommentDots />, hint: "Share what you love or what we can improve." },
  { id: "Bug Report", icon: <FaBug />,         hint: "Tell us what broke and how to reproduce it." },
  { id: "Get Help",   icon: <FaLifeRing />,    hint: "Stuck on something? We'll point you the right way." },
];

const PLACEHOLDERS = {
  "Feedback": "What do you like about MovieMind AI? (e.g., 'The interface is beautiful!')",
  "Bug Report": "What went wrong? (e.g., 'The search page crashes when typing too quickly.')",
  "Get Help": "How can we help? (e.g., 'I can't see my previous search history.')",
};

const QUICK = {
  "Feedback": [
    { label: "Excellent UI 🌟", text: "The streaming platform interface is absolutely beautiful and clean!" },
    { label: "AI is Amazing 🤖", text: "The movie recommendation outputs are incredibly accurate and smart." },
    { label: "Love the Theme 🎬", text: "The cinematic look and feel fits perfectly for movie fans." },
  ],
  "Bug Report": [
    { label: "Broken Asset 🖼️", text: "Found a missing or broken poster image in the application." },
    { label: "Blocked Requests 🛡️", text: "A browser shield or extension seems to be blocking database requests on my device." },
    { label: "Page Crash ⚠️", text: "The screen turned completely blank during a page change." },
  ],
  "Get Help": [
    { label: "History Missing 📊", text: "I cannot see my previous search history items in the sidebar panel." },
    { label: "Login Problem 🔒", text: "I'm stuck at the login or profile authentication step and need help." },
    { label: "Slow Loading ⏳", text: "Recommendations are taking too long to load for me." },
  ],
};

const SYSTEM_INSTRUCTION =
  "You are the AI support engineer for MovieMind AI, a premium movie discovery platform. " +
  "Read the user's message and write an empathetic, professional response. " +
  "If it is a Bug Report, explain that the team is looking into it and advise clearing the browser cache. " +
  "If it is Feedback, express gratitude. If it is a Get Help request, give one practical next step. " +
  "Keep it under 4 sentences, plain text, and sign off as 'MovieMind Support AI'.";

const FALLBACK_REPLY = "Thank you for your submission. Our development team has logged your ticket and will review it soon.";

/* ───────────────────────── helpers ───────────────────────── */

function toDate(v) {
  if (!v) return null;
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeAgo(date, now) {
  if (!date) return "Just now";
  const s = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (s < 45) return "Just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusTone(status = "") {
  const s = status.toLowerCase();
  if (s.includes("resolv") || s.includes("closed") || s.includes("done")) return "ok";
  if (s.includes("progress") || s.includes("review")) return "accent";
  return "warn";
}

function readDrafts() {
  try { return { Feedback: "", "Bug Report": "", "Get Help": "", ...JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") }; }
  catch { return { Feedback: "", "Bug Report": "", "Get Help": "" }; }
}

async function generateReply(user, category, message) {
  if (!ai?.models?.generateContent) return FALLBACK_REPLY;
  const call = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `User Name: ${user.displayName || "User"}\nCategory: ${category}\nMessage: "${message}"`,
    config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.3 },
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("AI timeout")), 20000));
  const res = await Promise.race([call, timeout]);
  return (res?.text || "").trim() || FALLBACK_REPLY;
}

/* ───────────────────────── page ───────────────────────── */

export default function SupportConsole() {
  const navigate = useNavigate();

  // theme — from the website's own theme context
  const themeCtx = useTheme() ?? {};
  const isDark =
    typeof themeCtx.theme === "string" ? themeCtx.theme === "dark"
    : themeCtx.isDark ?? themeCtx.darkMode ?? themeCtx.dark ?? true;
  const theme = isDark ? "dark" : "light";

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const uid = user?.uid ?? null;

  const [category, setCategory] = useState("Feedback");
  const [drafts, setDrafts] = useState(readDrafts);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusyId, setAiBusyId] = useState(null);
  const [replyOverrides, setReplyOverrides] = useState({}); // AI replies that couldn't be saved to Firestore
  const [tickets, setTickets] = useState([]);
  const [ticketsReady, setTicketsReady] = useState(false);
  const [ticketsError, setTicketsError] = useState(false);
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [now, setNow] = useState(Date.now());
  const [navOffset, setNavOffset] = useState(NAVBAR_FIXED_OFFSET);
  const toastTimer = useRef(null);

  const message = drafts[category] ?? "";
  const catMeta = CATEGORIES.find((c) => c.id === category);
  const loggedIn = !!uid;

  const flash = useCallback((type, text) => {
    setToast({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

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

  /* ── online / offline + live "x min ago" clock ── */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); clearInterval(tick); clearTimeout(toastTimer.current); };
  }, []);

  /* ── auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    return () => unsub();
  }, []);

  /* ── persist drafts so nothing is lost on refresh ── */
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); } catch { /* ignore */ }
  }, [drafts]);

  /* ── real-time tickets for this user ── */
  useEffect(() => {
    if (!uid) { setTickets([]); setTicketsReady(true); return; }
    setTicketsReady(false);
    // Single-field filter (no composite index needed); sorted on the client.
    const q = query(collection(db, "feedback"), where("uid", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (toDate(b.timestamp)?.getTime() ?? Date.now()) - (toDate(a.timestamp)?.getTime() ?? Date.now()));
        setTickets(list.slice(0, 25));
        setTicketsError(false);
        setTicketsReady(true);
      },
      (err) => {
        console.error("Ticket listener failed:", err);
        setTicketsError(true);
        setTicketsReady(true);
      }
    );
    return () => unsub();
  }, [uid]);

  /* ───────── actions ───────── */

  const setMessage = (val) => setDrafts((d) => ({ ...d, [category]: val.slice(0, MAX_LEN) }));

  const goLogin = () => {
    try { localStorage.setItem("auth_redirect_target", "/support-console"); } catch { /* ignore */ }
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || submitting) return;
    if (!user) { flash("err", "Please log in to submit a ticket."); return; }
    if (!online) { flash("err", "You're offline. Reconnect and try again."); return; }

    setSubmitting(true);
    let ref;
    try {
      // 1) Save the ticket immediately so it shows up live in the list
      ref = await addDoc(collection(db, "feedback"), {
        uid: user.uid,
        userName: user.displayName || "Anonymous Explorer",
        userEmail: user.email ?? null,
        category,
        message: text,
        status: "Submitted",
        autoReply: null,
        timestamp: serverTimestamp(),
      });
      setDrafts((d) => ({ ...d, [category]: "" }));
      flash("ok", "Ticket sent! Our AI is writing a reply…");
    } catch (err) {
      console.error("Ticket submit failed:", err);
      flash("err", "Couldn't send your ticket. Please check your connection and try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    // 2) Generate the AI reply and attach it to the ticket
    setAiBusyId(ref.id);
    let reply = FALLBACK_REPLY;
    try { reply = await generateReply(user, category, text); }
    catch (err) { console.warn("AI reply failed, using fallback:", err); }
    try {
      await updateDoc(ref, { autoReply: reply, status: "Reviewed By AI Engine" });
    } catch (err) {
      // Firestore rules may not allow updates — still show the reply in this session.
      console.warn("Couldn't save AI reply to ticket:", err);
      setReplyOverrides((o) => ({ ...o, [ref.id]: reply }));
    } finally {
      setAiBusyId(null);
    }
  };

  /* ───────── derived ───────── */

  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => statusTone(t.status) !== "ok").length,
  }), [tickets]);

  const navLoading = !authReady;

  /* ───────── render ───────── */

  return (
    <>
      <Navbar />
      <div className="sc-root" data-theme={theme} style={{ paddingTop: navOffset }}>
        <style>{CSS}</style>
        <div className="sc-glow" />

        <main className="sc-wrap">
          <header className="sc-header sc-fade">
            <div>
              <h1 className="sc-title">Support <span>Center</span></h1>
              <p className="sc-muted sc-subtitle">Send feedback, report a bug, or get help — replies appear here in real time.</p>
            </div>
            <span className={`sc-pill ${online ? "sc-pill-live" : "sc-pill-off"}`}>
              <FaWifi /> {online ? "Connected" : "Offline"}
            </span>
          </header>

          <div className="sc-grid">
            {/* ── Form ── */}
            <section className="sc-card sc-pad sc-fade">
              <h2 className="sc-h2">New ticket</h2>

              <div className="sc-tabs" role="tablist" aria-label="Ticket category">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={category === c.id}
                    className={`sc-tab ${category === c.id ? "sc-tab-active" : ""}`}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.icon} <span>{c.id}</span>
                  </button>
                ))}
              </div>
              <p className="sc-muted sc-sm sc-hint">{catMeta.hint}</p>

              {!navLoading && !loggedIn && (
                <div className="sc-lock">
                  <FaLock className="sc-accent" />
                  <span>Log in to submit a ticket and track replies.</span>
                  <button className="sc-btn sc-btn-primary" type="button" onClick={goLogin}>Log in</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="sc-form">
                <div>
                  <label className="sc-label">Quick comments</label>
                  <div className="sc-chips">
                    {QUICK[category].map((q) => (
                      <button key={q.label} type="button" className="sc-chip" disabled={!loggedIn || submitting} onClick={() => setMessage(q.text)}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="sc-label" htmlFor="sc-msg">Your message</label>
                  <div className="sc-textwrap">
                    <textarea
                      id="sc-msg"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={loggedIn ? PLACEHOLDERS[category] : "Please log in to write a ticket…"}
                      disabled={submitting || !loggedIn}
                      rows={7}
                      maxLength={MAX_LEN}
                      className="sc-textarea"
                    />
                    <span className={`sc-count ${message.length > MAX_LEN * 0.9 ? "sc-count-warn" : ""}`}>{message.length}/{MAX_LEN}</span>
                  </div>
                </div>

                <button type="submit" className="sc-btn sc-btn-primary sc-submit" disabled={submitting || !message.trim() || !loggedIn}>
                  {submitting ? <><span className="sc-spinner" /> Sending…</> : <><FaPaperPlane className="text-xs" /> Submit ticket</>}
                </button>
              </form>
            </section>

            {/* ── Live tickets ── */}
            <section className="sc-card sc-pad sc-fade">
              <div className="sc-list-head">
                <div>
                  <h2 className="sc-h2">Your tickets</h2>
                  <p className="sc-muted sc-sm">{loggedIn ? `${counts.total} total · ${counts.open} open` : "Log in to see your tickets"}</p>
                </div>
                {loggedIn && <span className="sc-live-dot" title="Updating live" />}
              </div>

              {!loggedIn ? (
                <div className="sc-empty"><FaInbox className="sc-empty-icon" /><p>Your submitted tickets will appear here.</p></div>
              ) : !ticketsReady ? (
                <div className="sc-empty"><span className="sc-spinner sc-spinner-lg" /></div>
              ) : ticketsError ? (
                <div className="sc-empty">
                  <FaExclamationCircle className="sc-empty-icon" />
                  <p>Couldn't load your ticket history.</p>
                  <p className="sc-muted sc-sm">Allow users to read their own <code>feedback</code> documents in your Firestore rules.</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="sc-empty"><FaInbox className="sc-empty-icon" /><p>No tickets yet.</p><p className="sc-muted sc-sm">Send your first one using the form.</p></div>
              ) : (
                <ul className="sc-tickets">
                  {tickets.map((t) => {
                    const reply = t.autoReply || replyOverrides[t.id];
                    const waiting = !reply && aiBusyId === t.id;
                    const tone = statusTone(t.status);
                    return (
                      <li key={t.id} className="sc-ticket sc-fade">
                        <div className="sc-ticket-top">
                          <span className="sc-cat">{t.category}</span>
                          <span className={`sc-status sc-status-${tone}`}>{t.status || "Submitted"}</span>
                        </div>
                        <p className="sc-ticket-msg">{t.message}</p>
                        <div className="sc-muted sc-xs">{timeAgo(toDate(t.timestamp), now)}</div>

                        {waiting && (
                          <div className="sc-reply sc-reply-wait"><FaRobot /> <span>AI is writing a reply</span><span className="sc-dots"><i /><i /><i /></span></div>
                        )}
                        {reply && (
                          <div className="sc-reply">
                            <div className="sc-reply-title"><FaRobot /> AI support</div>
                            <p>{reply}</p>
                          </div>
                        )}
                        {t.devReply && (
                          <div className="sc-reply sc-reply-dev">
                            <div className="sc-reply-title"><FaCheckCircle /> Developer reply</div>
                            <p>{t.devReply}</p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </main>

        {toast && (
          <div className={`sc-toast sc-fade ${toast.type === "err" ? "sc-toast-err" : "sc-toast-ok"}`} role="status">
            {toast.type === "err" ? <FaExclamationCircle /> : <FaCheckCircle />} {toast.text}
          </div>
        )}
      </div>
    </>
  );
}

/* ───────────────────────── styles (themed via CSS variables) ───────────────────────── */

const CSS = `
.sc-root{
  --bg:#07070d; --glow-a:rgba(220,38,38,.25); --glow-b:rgba(124,58,237,.25);
  --surface:rgba(255,255,255,.045); --surface-2:rgba(255,255,255,.08);
  --border:rgba(255,255,255,.1); --text:#f4f4f8; --muted:rgba(244,244,248,.58);
  --accent:#f472b6; --shadow:0 14px 40px rgba(0,0,0,.4);
  --ok:#34d399; --ok-bg:rgba(16,185,129,.15); --warn:#fbbf24; --warn-bg:rgba(245,158,11,.15);
  --err:#f87171; --err-bg:rgba(239,68,68,.16); --acc-bg:rgba(244,114,182,.15);
}
.sc-root[data-theme="light"]{
  --bg:#f7f5fb; --glow-a:rgba(244,114,182,.32); --glow-b:rgba(129,140,248,.32);
  --surface:#ffffff; --surface-2:#f0edf7;
  --border:rgba(30,20,60,.11); --text:#17141f; --muted:rgba(23,20,31,.6);
  --accent:#db2777; --shadow:0 14px 40px rgba(60,30,90,.12);
  --ok:#047857; --ok-bg:#d1fae5; --warn:#b45309; --warn-bg:#fef3c7;
  --err:#b91c1c; --err-bg:#fee2e2; --acc-bg:#fce7f3;
}
.sc-root{position:relative;min-height:100vh;box-sizing:border-box;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:hidden;
  transition:background .3s,color .3s;-webkit-font-smoothing:antialiased}
.sc-glow{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.5;
  background:radial-gradient(circle at top right,var(--glow-b),transparent 40%),radial-gradient(circle at bottom left,var(--glow-a),transparent 40%)}
.sc-wrap{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:28px 18px 72px;display:flex;flex-direction:column;gap:22px}
.sc-muted{color:var(--muted)}.sc-accent{color:var(--accent)}
.sc-sm{font-size:12.5px}.sc-xs{font-size:11.5px}
.sc-card{background:var(--surface);border:1px solid var(--border);border-radius:22px;box-shadow:var(--shadow);backdrop-filter:blur(14px)}
.sc-pad{padding:24px}
.sc-h2{font-size:1.1rem;font-weight:800;margin-bottom:14px}

.sc-header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.sc-title{font-size:2rem;font-weight:900;letter-spacing:-.02em;line-height:1.1}
.sc-title span{background:linear-gradient(90deg,#ef4444,#ec4899,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent}
.sc-subtitle{font-size:13.5px;margin-top:4px}
.sc-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700}
.sc-pill-live{background:var(--ok-bg);color:var(--ok)}
.sc-pill-off{background:var(--warn-bg);color:var(--warn)}

.sc-grid{display:grid;grid-template-columns:1.15fr 1fr;gap:20px;align-items:start}
@media (max-width:900px){.sc-grid{grid-template-columns:1fr}}

.sc-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:5px;border-radius:16px;background:var(--surface-2)}
.sc-tab{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 6px;border-radius:12px;border:0;background:transparent;color:var(--muted);font-size:12.5px;font-weight:700;cursor:pointer;transition:.2s;font-family:inherit}
.sc-tab:hover{color:var(--text)}
.sc-tab-active{background:var(--surface);color:var(--accent);box-shadow:0 2px 10px rgba(0,0,0,.12)}
@media (max-width:480px){.sc-tab span{display:none}}
.sc-hint{margin:10px 2px 14px}
.sc-form{display:flex;flex-direction:column;gap:18px}
.sc-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:8px}
.sc-chips{display:flex;flex-wrap:wrap;gap:8px}
.sc-chip{padding:8px 13px;border-radius:999px;font-size:12.5px;font-weight:500;background:var(--surface-2);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s;font-family:inherit}
.sc-chip:hover:not(:disabled){border-color:var(--accent);transform:translateY(-1px)}
.sc-chip:disabled{opacity:.45;cursor:not-allowed}
.sc-textwrap{position:relative}
.sc-textarea{width:100%;resize:vertical;min-height:150px;border-radius:16px;background:var(--surface-2);border:1px solid var(--border);outline:none;color:var(--text);padding:14px 14px 30px;font-size:14px;line-height:1.55;font-family:inherit;transition:.2s}
.sc-textarea:focus{border-color:var(--accent)}
.sc-textarea::placeholder{color:var(--muted)}
.sc-textarea:disabled{opacity:.55}
.sc-count{position:absolute;right:14px;bottom:10px;font-size:11px;color:var(--muted);font-family:ui-monospace,monospace}
.sc-count-warn{color:var(--warn)}
.sc-lock{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:16px;border-radius:14px;background:var(--acc-bg);font-size:13px;font-weight:600}

.sc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:13px;font-size:13px;font-weight:700;border:1px solid var(--border);background:var(--surface-2);color:var(--text);cursor:pointer;transition:.2s;font-family:inherit}
.sc-btn:disabled{opacity:.45;cursor:not-allowed}
.sc-btn-primary{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff;box-shadow:0 8px 20px rgba(236,72,153,.28)}
.sc-btn-primary:hover:not(:disabled){opacity:.93;transform:translateY(-1px)}
.sc-submit{width:100%;padding:14px}

.sc-list-head{display:flex;align-items:flex-start;justify-content:space-between}
.sc-list-head .sc-h2{margin-bottom:2px}
.sc-live-dot{width:9px;height:9px;border-radius:50%;background:var(--ok);margin-top:8px;animation:sc-pulse 1.8s infinite}
.sc-tickets{list-style:none;padding:0;margin:14px 0 0;display:flex;flex-direction:column;gap:12px;max-height:640px;overflow-y:auto;padding-right:2px}
.sc-ticket{padding:14px;border-radius:16px;background:var(--surface-2);border:1px solid var(--border);display:flex;flex-direction:column;gap:6px}
.sc-ticket-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sc-cat{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.sc-status{font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:999px}
.sc-status-ok{background:var(--ok-bg);color:var(--ok)}
.sc-status-warn{background:var(--warn-bg);color:var(--warn)}
.sc-status-accent{background:var(--acc-bg);color:var(--accent)}
.sc-ticket-msg{font-size:13.5px;line-height:1.5;font-weight:500;white-space:pre-wrap;word-break:break-word;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.sc-reply{margin-top:6px;padding:11px 13px;border-radius:13px;background:var(--surface);border:1px solid var(--border);font-size:13px;line-height:1.55}
.sc-reply p{white-space:pre-wrap}
.sc-reply-title{display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;color:var(--accent);margin-bottom:4px}
.sc-reply-dev .sc-reply-title{color:var(--ok)}
.sc-reply-wait{display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:600}
.sc-dots{display:inline-flex;gap:3px}
.sc-dots i{width:5px;height:5px;border-radius:50%;background:var(--accent);animation:sc-bounce 1.2s infinite}
.sc-dots i:nth-child(2){animation-delay:.15s}.sc-dots i:nth-child(3){animation-delay:.3s}
.sc-empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;color:var(--muted);font-size:14px;padding:12px}
.sc-empty-icon{font-size:30px;color:var(--accent);opacity:.7;margin-bottom:6px}
.sc-empty code{font-size:12px;background:var(--surface-2);padding:1px 6px;border-radius:6px}

.sc-spinner{width:16px;height:16px;border-radius:50%;border:2px solid #fff;border-top-color:transparent;display:inline-block;animation:sc-spin .8s linear infinite}
.sc-spinner-lg{width:34px;height:34px;border:4px solid var(--accent);border-top-color:transparent}
.sc-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:9px;padding:12px 18px;border-radius:999px;font-size:13px;font-weight:700;box-shadow:var(--shadow);max-width:92vw}
.sc-toast-ok{background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok)}
.sc-toast-err{background:var(--err-bg);color:var(--err);border:1px solid var(--err)}
.sc-fade{animation:sc-in .35s ease both}
@keyframes sc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.sc-toast.sc-fade{animation:sc-toast-in .3s ease both}
@keyframes sc-toast-in{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes sc-spin{to{transform:rotate(360deg)}}
@keyframes sc-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}
@keyframes sc-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}
`;