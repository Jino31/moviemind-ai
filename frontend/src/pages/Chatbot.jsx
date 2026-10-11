// src/pages/Chatbot.jsx
// MovieMind AI — redesigned, real-time, dark/light themed.

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection, addDoc, query, orderBy, limit, serverTimestamp,
  onSnapshot, deleteDoc, doc, writeBatch, getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaPaperPlane, FaRobot, FaUser, FaTrashAlt, FaHistory, FaBars,
  FaTimes, FaPlus, FaStop, FaRedo, FaStar, FaLock,
} from "react-icons/fa";
import MessageActions from "../components/MessageActions";

// ▼▼ ADJUST THESE TO YOUR PROJECT (the site's own navbar + theme) ▼▼
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
// ▲▲ ─────────────────────────────────────────────────────────── ▲▲

// Set to 0 if your Navbar is NOT fixed/sticky (i.e. it takes up normal space).
const NAVBAR_FIXED_OFFSET = 72;

/* ───────────────────────── config ───────────────────────── */

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const TMDB_API_KEY   = import.meta.env.VITE_TMDB_API_KEY;
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

const GUEST_LIMIT = 2;
const MAX_CONTEXT_MESSAGES = 10;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const moodButtons = [
  { label: "🔥 Action",   query: "Best action movies of all time" },
  { label: "😂 Comedy",   query: "Best comedy movies to watch" },
  { label: "👻 Horror",   query: "Best horror movies ever made" },
  { label: "🚀 Sci-Fi",   query: "Best sci-fi movies of all time" },
  { label: "💖 Romance",  query: "Best romance movies to watch" },
  { label: "🕵️ Thriller", query: "Best thriller movies ever" },
  { label: "🎭 Tamil",    query: "Tamil movies" },
  { label: "🏆 Top IMDb", query: "Top 10 highest rated movies on IMDb all time" },
];

const WELCOME_POINTS = [
  "Tamil, Hindi, English, Korean & more",
  "Ratings, recommendations, streaming info",
  "Actors, directors, box office",
  "Latest & upcoming releases",
];

/* ───────────────────────── helpers ───────────────────────── */

// The model is told to answer in plain text — strip any markdown that slips through.
function cleanText(s = "") {
  return s
    .replace(/\*\*/g, "")
    .replace(/^\s*[*-]\s+/gm, "• ")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "");
}

function buildSystemPrompt(extra = "") {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  return `You are MovieMind AI — an expert movie assistant covering all world cinema.
Expertise: Hollywood, Bollywood, Tamil (Kollywood), Telugu, Malayalam, Korean cinema.
Today's date is ${today}.
Rules:
1. Plain text only. Never use markdown symbols such as asterisks or hash headers. Use "•" for lists.
2. When WEB CONTEXT is provided, treat it as the primary source of truth for cast, rankings, dates and ratings.
3. If you are unsure, say so instead of guessing.
4. Keep responses warm, concise, and lightly sprinkled with emojis.${extra ? "\n\n" + extra : ""}`;
}

async function fetchTamilMovies(year, signal) {
  const qs = `with_original_language=ta&sort_by=popularity.desc&api_key=${TMDB_API_KEY}` +
    (year ? `&primary_release_year=${year}` : "");
  // Try the dev proxy first, then TMDB directly.
  const urls = [`/tmdb/discover/movie?${qs}`, `https://api.themoviedb.org/3/discover/movie?${qs}`];
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results?.length) {
        return data.results.slice(0, 10).map((m) => ({
          id: m.id,
          title: m.title,
          year: m.release_date?.slice(0, 4) ?? "N/A",
          rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : null,
          votes: m.vote_count ?? 0,
          poster: m.poster_path ?? null,
          overview: m.overview ? m.overview.slice(0, 140) + (m.overview.length > 140 ? "…" : "") : "",
        }));
      }
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }
  return null;
}

async function tavilySearch(q, signal) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: q,
      search_depth: "advanced",
      max_results: 5,
      include_answer: true,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  return res.json();
}

// Streams tokens from Groq. Retries on 429 before the stream starts.
async function streamGroq({ messages, extra = "", signal, onToken, retries = 3 }) {
  let backoff = 1500;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        stream: true,
        temperature: 0.4,
        max_tokens: 1024,
        messages: [
          { role: "system", content: buildSystemPrompt(extra) },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content.slice(0, 1500),
          })),
        ],
      }),
    });

    if (res.status === 429 && attempt < retries - 1) {
      await delay(backoff);
      backoff *= 2;
      continue;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return cleanText(full);
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onToken(cleanText(full));
          }
        } catch { /* ignore partial JSON chunks */ }
      }
    }
    return cleanText(full);
  }
  throw new Error("Rate limited. Please try again in a moment.");
}

/* ───────────────────────── small components ───────────────────────── */

function MessageContent({ text }) {
  // split() with a capture group puts the URLs at odd indexes — no global-regex .test() bug.
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {parts.map((p, i) => {
        if (i % 2 === 0) return p;
        const trail = p.match(/[.,;:!?)]+$/)?.[0] ?? "";
        const href = trail ? p.slice(0, -trail.length) : p;
        return (
          <span key={i}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="mm-link break-all">{href}</a>
            {trail}
          </span>
        );
      })}
    </span>
  );
}

function MovieCards({ movies }) {
  return (
    <div className="mm-cards">
      {movies.map((m, i) => (
        <a
          key={m.id ?? i}
          className="mm-poster"
          href={m.id ? `https://www.themoviedb.org/movie/${m.id}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="mm-poster-img">
            {m.poster ? (
              <img src={`https://image.tmdb.org/t/p/w342${m.poster}`} alt={m.title} loading="lazy" />
            ) : (
              <div className="mm-poster-fallback">🎬</div>
            )}
            <span className="mm-rank">{i + 1}</span>
            <span className="mm-rating"><FaStar /> {m.rating ?? "NR"}</span>
          </div>
          <div className="mm-poster-meta">
            <div className="mm-poster-title">{m.title}</div>
            <div className="mm-muted text-[11px]">{m.year} · {m.votes} votes</div>
          </div>
        </a>
      ))}
    </div>
  );
}

function Bubble({ msg, onEdit, children }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex w-full mm-fade ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[92%] sm:max-w-[82%] ${isUser ? "flex-row-reverse" : ""}`}>
        <div className={`mm-avatar ${isUser ? "mm-avatar-user" : "mm-avatar-ai"}`}>
          {isUser ? <FaUser className="text-xs" /> : <FaRobot className="text-sm" />}
        </div>
        <div className="min-w-0">
          <div className={`mm-bubble ${isUser ? "mm-bubble-user" : "mm-bubble-ai"}`}>
            <MessageContent text={msg.content} />
            {children}
            {isUser && onEdit && <MessageActions content={msg.content} onEdit={onEdit} />}
          </div>
          {msg.movies?.length > 0 && <MovieCards movies={msg.movies} />}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function Chatbot() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // auth
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const uid = user?.uid ?? null;

  // theme — comes from the website's own theme context (no separate toggle here)
  const themeCtx = useTheme() ?? {};
  const isDark =
    typeof themeCtx.theme === "string" ? themeCtx.theme === "dark"
    : themeCtx.isDark ?? themeCtx.darkMode ?? themeCtx.dark ?? true;
  const theme = isDark ? "dark" : "light";

  // messages: guests keep them locally, signed-in users read live from Firestore
  const [localMessages, setLocalMessages] = useState([]);
  const [cloudMessages, setCloudMessages] = useState([]);
  const [streaming, setStreaming] = useState(null); // { content } while the model is typing
  const [errorMsg, setErrorMsg] = useState(null);   // { text, retryText }
  const [searchHistory, setSearchHistory] = useState([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatus] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [toast, setToast] = useState(null);
  const [navOffset, setNavOffset] = useState(NAVBAR_FIXED_OFFSET);
  const [guestCount, setGuestCount] = useState(() => {
    try { return parseInt(localStorage.getItem("anon_chat_count") || "0", 10); } catch { return 0; }
  });

  const messages = uid ? cloudMessages : localMessages;
  const guestLeft = Math.max(0, GUEST_LIMIT - guestCount);
  const guestLocked = authReady && !uid && guestLeft === 0;

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }, []);

  /* ── measure the site's navbar so the page sits right below it ── */
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector("nav") || document.querySelector("body > header, #root > header");
      if (!nav) { setNavOffset(NAVBAR_FIXED_OFFSET); return; }
      const pos = getComputedStyle(nav).position;
      const covers = pos === "fixed" || pos === "sticky";
      setNavOffset(covers ? Math.round(nav.getBoundingClientRect().bottom) : 0);
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
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ── auth ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) { setCloudMessages([]); setSearchHistory([]); }
    });
    return () => unsub();
  }, []);

  /* ── real-time Firestore listeners (chat + search history) ── */
  useEffect(() => {
    if (!uid) return;

    const chatQ = query(collection(db, "users", uid, "chats"), orderBy("createdAt", "asc"));
    const unsubChat = onSnapshot(
      chatQ,
      (snap) => {
        setCloudMessages(snap.docs.map((d) => {
          const { role, content, movies } = d.data();
          return { id: d.id, role, content, movies };
        }));
      },
      (err) => console.error("Chat listener failed:", err)
    );

    const histQ = query(collection(db, "users", uid, "searchHistory"), orderBy("timestamp", "desc"), limit(60));
    const unsubHist = onSnapshot(
      histQ,
      (snap) => {
        const seen = new Set();
        const unique = [];
        for (const d of snap.docs) {
          const text = d.data().query;
          if (!text) continue;
          const key = text.trim().toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          unique.push({ id: d.id, query: text });
          if (unique.length >= 15) break;
        }
        setSearchHistory(unique);
      },
      (err) => console.error("History listener failed:", err)
    );

    return () => { unsubChat(); unsubHist(); };
  }, [uid]);

  /* ── autoscroll ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 220;
    if (nearBottom || loading) chatEndRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming, loading, errorMsg]);

  /* ── textarea auto-grow ── */
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 160) + "px";
  }, [input]);

  /* ── Esc closes sidebar ── */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setIsSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── abort in-flight request on unmount ── */
  useEffect(() => () => abortRef.current?.abort(), []);

  /* ───────── persistence helpers ───────── */

  const saveMessage = async (role, content, movies) => {
    const payload = { role, content, createdAt: serverTimestamp() };
    if (movies?.length) payload.movies = movies;
    if (uid) {
      try { await addDoc(collection(db, "users", uid, "chats"), payload); }
      catch (err) { console.error("Failed to save message:", err); showToast("Couldn't sync message to cloud"); }
    } else {
      setLocalMessages((prev) => [...prev, { role, content, movies }]);
    }
  };

  const deleteAllIn = async (sub) => {
    const snap = await getDocs(collection(db, "users", uid, sub));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  };

  /* ───────── actions ───────── */

  const stopGeneration = () => abortRef.current?.abort();

  const sendMessage = async (text) => {
    const userText = (typeof text === "string" ? text : input).trim();
    if (!userText || loading) return;

    if (!authReady) return;
    if (!uid) {
      if (guestCount >= GUEST_LIMIT) {
        localStorage.setItem("auth_redirect_target", "/chatbot");
        showToast("Free preview used up — please log in to continue");
        return;
      }
      const next = guestCount + 1;
      setGuestCount(next);
      try { localStorage.setItem("anon_chat_count", String(next)); } catch { /* ignore */ }
    }

    setInput("");
    setErrorMsg(null);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const history = [...messages, { role: "user", content: userText }].slice(-MAX_CONTEXT_MESSAGES);
    let partial = "";

    try {
      await saveMessage("user", userText);
      if (uid) {
        addDoc(collection(db, "users", uid, "searchHistory"), { query: userText, timestamp: serverTimestamp() })
          .catch((e) => console.error("History write failed:", e));
      }

      const lower = userText.toLowerCase();
      const isTamilQuery = /\btamil\s+movies?\b/.test(lower) || lower === "tamil";
      const year = userText.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
      const isFutureYear = year && parseInt(year, 10) >= new Date().getFullYear() + 1;

      // 1) Live TMDB for Tamil lists (renders poster cards)
      if (isTamilQuery && !isFutureYear && TMDB_API_KEY) {
        setStatus("Fetching live data from TMDB…");
        const movies = await fetchTamilMovies(year, signal);
        if (movies) {
          const label = year ? `${year} Releases` : "Trending Now";
          await saveMessage("assistant", `Tamil Movies — ${label} 🎭\nSource: TMDB (live). Tap a poster for details.`, movies);
          return;
        }
      }

      // 2) Web search for grounding
      let webContext = "";
      let sources = [];
      if (TAVILY_API_KEY) {
        setStatus("Searching the web…");
        const yr = year ?? new Date().getFullYear();
        const q = isTamilQuery ? `${yr} Tamil movies released list box office` : `${userText} movie details cast rating`;
        try {
          const data = await tavilySearch(q, signal);
          const items = data.results ?? [];
          sources = items.slice(0, 3).filter((r) => r.url);
          webContext =
            (data.answer ? `Summary: ${data.answer}\n` : "") +
            items.map((r) => r.content?.slice(0, 300)).filter(Boolean).join("\n");
          webContext = webContext.slice(0, 2500);
        } catch (e) {
          if (e.name === "AbortError") throw e;
          console.warn("Web search failed, continuing without it:", e);
        }
      }

      // 3) Stream the answer
      setStatus("Thinking…");
      let reply = await streamGroq({
        messages: history,
        extra: webContext ? `WEB CONTEXT:\n${webContext}` : "",
        signal,
        onToken: (t) => { partial = t; setStatus(""); setStreaming({ content: t }); },
      });
      if (sources.length) {
        reply += "\n\nSources:\n" + sources.map((s) => s.url).join("\n");
      }
      await saveMessage("assistant", reply);
    } catch (err) {
      if (err.name === "AbortError") {
        if (partial) await saveMessage("assistant", partial + " …(stopped)");
      } else {
        console.error(err);
        setErrorMsg({ text: err.message || "Something went wrong.", retryText: userText });
      }
    } finally {
      setStreaming(null);
      setLoading(false);
      setStatus("");
      abortRef.current = null;
    }
  };

  const handleEditMessage = async (msg, index) => {
    if (loading) return;
    setInput(msg.content);
    setErrorMsg(null);
    if (uid) {
      const toDelete = messages.slice(index).filter((m) => m.id);
      try {
        const batch = writeBatch(db);
        toDelete.forEach((m) => batch.delete(doc(db, "users", uid, "chats", m.id)));
        await batch.commit();
      } catch (err) {
        console.error("Edit cleanup failed:", err);
        showToast("Couldn't edit message");
      }
    } else {
      setLocalMessages((prev) => prev.slice(0, index));
    }
    textareaRef.current?.focus();
  };

  const handleNewChat = async () => {
    if (loading) return;
    if (messages.length > 0 && !window.confirm("Start a new chat? The current conversation will be cleared.")) return;
    setLocalMessages([]);
    setErrorMsg(null);
    setInput("");
    if (uid) {
      try { await deleteAllIn("chats"); }
      catch (err) { console.error("Failed to clear chat:", err); showToast("Couldn't clear cloud chat"); }
    }
  };

  const handleDeleteSingleSearch = async (e, id) => {
    e.stopPropagation();
    if (!uid) return;
    try { await deleteDoc(doc(db, "users", uid, "searchHistory", id)); }
    catch (err) { console.error(err); showToast("Couldn't delete that search"); }
  };

  const clearSearchHistory = async () => {
    if (!uid || !window.confirm("Clear your entire search history?")) return;
    try { await deleteAllIn("searchHistory"); showToast("Search history cleared 🧼"); }
    catch (err) { console.error(err); showToast("Couldn't clear history"); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goLogin = () => {
    localStorage.setItem("auth_redirect_target", "/chatbot");
    navigate("/login");
  };

  const lastCloud = cloudMessages[cloudMessages.length - 1];
  const showStreaming =
    streaming && !(uid && lastCloud?.role === "assistant" && lastCloud.content === streaming.content);
  const isEmpty = messages.length === 0 && !loading;

  const placeholder = useMemo(() => {
    if (!authReady) return "Connecting…";
    if (uid) return "Ask about any movie, actor or genre…";
    return guestLeft > 0
      ? `Ask about movies (${guestLeft} free ${guestLeft === 1 ? "question" : "questions"} left)…`
      : "Log in to keep chatting";
  }, [authReady, uid, guestLeft]);

  /* ───────── render ───────── */

  return (
    <>
    {/* The website's own navbar (handles navigation + theme toggle) */}
    <Navbar />
    <div className="mm-root" data-theme={theme} style={{ paddingTop: navOffset }}>
      <style>{CSS}</style>
      <div className="mm-glow" />

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Menu button (left) — opens New Chat + History */}
        <div className="mm-topbar">
          <button
            className="mm-btn mm-icon-btn"
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label="Open menu"
            title="Menu"
          >
            <FaBars className="text-sm" />
          </button>
        </div>

        {!online && <div className="mm-offline">You're offline — messages will fail until you reconnect.</div>}

        {/* Messages */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 mm-scroll">
          <div className="max-w-4xl mx-auto space-y-5 pb-8">
            {isEmpty && (
              <section className="mm-hero mm-fade">
                <div className="mm-hero-icon">🎬</div>
                <h2 className="mm-hero-title">What are we watching tonight?</h2>
                <p className="mm-muted text-sm mb-5">I'm MovieMind AI — ask me anything about cinema.</p>
                <ul className="mm-points">
                  {WELCOME_POINTS.map((p) => <li key={p}>{p}</li>)}
                </ul>
                <div className="mm-label">⚡ Quick picks</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {moodButtons.map((b) => (
                    <button key={b.label} className="mm-chip" disabled={loading || guestLocked} onClick={() => sendMessage(b.query)}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {messages.map((msg, i) => (
              <Bubble key={msg.id ?? `l-${i}`} msg={msg} onEdit={loading ? null : () => handleEditMessage(msg, i)} />
            ))}

            {showStreaming && (
              <Bubble msg={{ role: "assistant", content: streaming.content }}>
                <span className="mm-caret" />
              </Bubble>
            )}

            {loading && !streaming && (
              <div className="flex gap-3 mm-fade">
                <div className="mm-avatar mm-avatar-ai"><FaRobot className="text-sm" /></div>
                <div className="mm-bubble mm-bubble-ai flex items-center gap-3">
                  <span className="mm-dots"><i /><i /><i /></span>
                  <span className="mm-muted text-xs">{statusMsg || "Working…"}</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mm-error mm-fade">
                <div>⚠️ {errorMsg.text}</div>
                <button className="mm-btn mt-2" onClick={() => sendMessage(errorMsg.retryText)}>
                  <FaRedo className="text-[10px]" /> Retry
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Composer */}
        <footer className="mm-footer">
          <div className="max-w-4xl mx-auto">
            {guestLocked ? (
              <div className="mm-lock">
                <FaLock className="mm-accent" />
                <span>You've used your {GUEST_LIMIT} free questions. Log in for unlimited recommendations.</span>
                <button className="mm-btn mm-btn-primary" onClick={goLogin}>Log in</button>
              </div>
            ) : (
              <div className="mm-composer">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  disabled={!authReady}
                  placeholder={placeholder}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mm-textarea"
                />
                {loading ? (
                  <button className="mm-send mm-send-stop" onClick={stopGeneration} title="Stop generating" aria-label="Stop">
                    <FaStop className="text-xs" />
                  </button>
                ) : (
                  <button className="mm-send" disabled={!input.trim() || !authReady} onClick={() => sendMessage()} aria-label="Send">
                    <FaPaperPlane className="text-xs" />
                  </button>
                )}
              </div>
            )}
            <p className="mm-hint">Enter to send · Shift+Enter for a new line</p>
          </div>
        </footer>
      </div>

      {/* Left menu drawer: New Chat + History */}
      {isSidebarOpen && (
        <div className="mm-overlay" style={{ top: navOffset }} onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside
        className={`mm-drawer ${isSidebarOpen ? "mm-drawer-open" : ""}`}
        style={{ top: navOffset, height: `calc(100% - ${navOffset}px)` }}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex items-center justify-between pb-4 mb-4 mm-divider">
          <div className="flex items-center gap-2 font-bold">
            <FaBars className="mm-accent text-sm" /> Menu
          </div>
          <button className="mm-btn mm-icon-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
            <FaTimes className="text-xs" />
          </button>
        </div>

        <button
          className="mm-btn mm-btn-primary w-full justify-center mb-5"
          disabled={loading}
          onClick={() => { setIsSidebarOpen(false); handleNewChat(); }}
        >
          <FaPlus className="text-[10px]" /> New Chat
        </button>

        <div className="mm-label flex items-center gap-2 !mb-3 !text-left">
          <FaHistory className="mm-accent" /> Recent Searches
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mm-scroll pr-1">
          {!uid ? (
            <div className="mm-muted text-center py-10 text-xs">Log in to save and see your search history.</div>
          ) : searchHistory.length === 0 ? (
            <div className="mm-muted text-center py-10 text-xs tracking-widest uppercase">No searches yet</div>
          ) : (
            searchHistory.map((h) => (
              <div
                key={h.id}
                className="mm-hist"
                onClick={() => { setIsSidebarOpen(false); sendMessage(h.query); }}
              >
                <span className="truncate">🔍 {h.query}</span>
                <button className="mm-hist-del" onClick={(e) => handleDeleteSingleSearch(e, h.id)} title="Delete" aria-label="Delete search">
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
            ))
          )}
        </div>
        {searchHistory.length > 0 && (
          <button className="mm-wipe" onClick={clearSearchHistory}>
            <FaTrashAlt className="text-[10px]" /> Clear all history
          </button>
        )}
      </aside>

      {toast && <div className="mm-toast mm-fade">{toast}</div>}
    </div>
    </>
  );
}

/* ───────────────────────── styles (themed via CSS variables) ───────────────────────── */

const CSS = `
.mm-root{
  --bg:#07070d; --bg-glow-a:rgba(220,38,38,.28); --bg-glow-b:rgba(124,58,237,.28);
  --surface:rgba(255,255,255,.04); --surface-2:rgba(255,255,255,.08);
  --header:rgba(10,10,18,.65); --border:rgba(255,255,255,.09);
  --text:#f4f4f8; --muted:rgba(244,244,248,.55);
  --accent:#f472b6; --link:#f9a8d4;
  --user-bg:linear-gradient(135deg,rgba(220,38,38,.28),rgba(219,39,119,.28)); --user-border:rgba(244,114,182,.25);
  --drawer:#0b0b14; --shadow:0 10px 30px rgba(0,0,0,.35);
  --error-bg:rgba(239,68,68,.12); --error-border:rgba(239,68,68,.35);
}
.mm-root[data-theme="light"]{
  --bg:#f7f5fb; --bg-glow-a:rgba(244,114,182,.35); --bg-glow-b:rgba(129,140,248,.35);
  --surface:#ffffff; --surface-2:#f0edf7;
  --header:rgba(255,255,255,.75); --border:rgba(30,20,60,.1);
  --text:#17141f; --muted:rgba(23,20,31,.58);
  --accent:#db2777; --link:#be185d;
  --user-bg:linear-gradient(135deg,#fee2e2,#fce7f3); --user-border:rgba(219,39,119,.25);
  --drawer:#ffffff; --shadow:0 10px 30px rgba(60,30,90,.12);
  --error-bg:#fef2f2; --error-border:#fecaca;
}
.mm-root{position:relative;height:100vh;box-sizing:border-box;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;
  transition:background .3s,color .3s;-webkit-font-smoothing:antialiased}
.mm-glow{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(circle at top left,var(--bg-glow-a),transparent 38%),
             radial-gradient(circle at bottom right,var(--bg-glow-b),transparent 38%);opacity:.55}
.mm-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;
  background:var(--header);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);flex-shrink:0}
.mm-title{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;line-height:1.1;
  background:linear-gradient(90deg,#ef4444,#ec4899,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent}
.mm-sub{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-family:ui-monospace,monospace;margin-top:2px}
.mm-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.mm-dot-on{background:#10b981;animation:mm-pulse 2s infinite}
.mm-dot-off{background:#f59e0b}
.mm-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:12px;font-size:12px;font-weight:600;
  background:var(--surface);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s}
.mm-btn:hover:not(:disabled){background:var(--surface-2)}
.mm-btn:disabled{opacity:.45;cursor:not-allowed}
.mm-icon-btn{padding:9px 11px}
.mm-btn-primary{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff;box-shadow:0 6px 18px rgba(236,72,153,.3)}
.mm-btn-primary:hover:not(:disabled){background:linear-gradient(90deg,#ef4444,#ec4899);opacity:.92}
.mm-accent{color:var(--accent)}
.mm-muted{color:var(--muted)}
.mm-link{color:var(--link);text-decoration:underline}
.mm-offline{background:#f59e0b;color:#1c1300;text-align:center;font-size:12px;font-weight:600;padding:6px}
.mm-scroll{scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.mm-hero{text-align:center;padding:28px 18px;border-radius:28px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow)}
.mm-hero-icon{font-size:2.6rem;margin-bottom:6px}
.mm-hero-title{font-size:1.5rem;font-weight:800;margin-bottom:4px}
.mm-points{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:0 auto 22px;max-width:640px;padding:0;list-style:none}
.mm-points li{font-size:12.5px;padding:9px 12px;border-radius:12px;background:var(--surface-2);color:var(--muted)}
.mm-label{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;font-weight:700}
.mm-chip{padding:8px 14px;border-radius:999px;font-size:12.5px;font-weight:500;background:var(--surface-2);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s}
.mm-chip:hover:not(:disabled){transform:translateY(-1px);border-color:var(--accent)}
.mm-chip:disabled{opacity:.4;cursor:not-allowed}
.mm-avatar{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid}
.mm-avatar-user{background:rgba(236,72,153,.12);border-color:rgba(236,72,153,.3);color:var(--accent)}
.mm-avatar-ai{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#ef4444}
.mm-bubble{border-radius:18px;padding:13px 16px;font-size:14.5px;line-height:1.65;border:1px solid var(--border);box-shadow:var(--shadow)}
.mm-bubble-user{background:var(--user-bg);border-color:var(--user-border);color:var(--text)}
.mm-bubble-ai{background:var(--surface);color:var(--text)}
.mm-caret{display:inline-block;width:7px;height:15px;margin-left:3px;vertical-align:-2px;background:var(--accent);animation:mm-blink 1s steps(2) infinite;border-radius:2px}
.mm-dots{display:inline-flex;gap:4px}
.mm-dots i{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:mm-bounce 1.2s infinite}
.mm-dots i:nth-child(2){animation-delay:.15s}.mm-dots i:nth-child(3){animation-delay:.3s}
.mm-cards{display:flex;gap:12px;overflow-x:auto;padding:12px 2px 6px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.mm-poster{width:132px;flex-shrink:0;text-decoration:none;color:var(--text);transition:transform .2s}
.mm-poster:hover{transform:translateY(-3px)}
.mm-poster-img{position:relative;aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:var(--surface-2);border:1px solid var(--border);box-shadow:var(--shadow)}
.mm-poster-img img{width:100%;height:100%;object-fit:cover;display:block}
.mm-poster-fallback{height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem}
.mm-rank{position:absolute;top:6px;left:6px;min-width:22px;height:22px;border-radius:8px;background:rgba(0,0,0,.7);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}
.mm-rating{position:absolute;bottom:6px;right:6px;display:flex;align-items:center;gap:4px;padding:3px 7px;border-radius:8px;background:rgba(0,0,0,.72);color:#fcd34d;font-size:11px;font-weight:700}
.mm-poster-meta{padding:8px 2px 0}
.mm-poster-title{font-size:12.5px;font-weight:700;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mm-error{padding:14px 16px;border-radius:16px;background:var(--error-bg);border:1px solid var(--error-border);font-size:13.5px}
.mm-footer{padding:12px 16px 10px;background:var(--header);backdrop-filter:blur(18px);border-top:1px solid var(--border);flex-shrink:0}
.mm-composer{position:relative;display:flex;align-items:flex-end;gap:8px;padding:6px;border-radius:18px;background:var(--surface);border:1px solid var(--border);transition:.2s;box-shadow:var(--shadow)}
.mm-composer:focus-within{border-color:var(--accent)}
.mm-textarea{flex:1;resize:none;background:transparent;outline:none;border:0;color:var(--text);font-size:14.5px;padding:11px 12px;max-height:160px;line-height:1.5;font-family:inherit}
.mm-textarea::placeholder{color:var(--muted)}
.mm-send{width:42px;height:42px;border-radius:13px;border:0;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;
  background:linear-gradient(90deg,#ef4444,#ec4899);transition:.15s;flex-shrink:0}
.mm-send:hover:not(:disabled){transform:scale(1.05)}.mm-send:active:not(:disabled){transform:scale(.95)}
.mm-send:disabled{opacity:.4;cursor:not-allowed}
.mm-send-stop{background:#374151}
.mm-hint{text-align:center;font-size:10.5px;color:var(--muted);margin-top:7px}
.mm-lock{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:14px;border-radius:16px;background:var(--surface);border:1px solid var(--border);font-size:13px}
.mm-topbar{display:flex;align-items:center;padding:10px 16px 0;flex-shrink:0}
.mm-overlay{position:fixed;left:0;right:0;bottom:0;z-index:40;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);animation:mm-in .2s}
.mm-drawer{position:fixed;left:0;width:min(320px,88vw);z-index:45;background:var(--drawer);border-right:1px solid var(--border);
  box-shadow:10px 0 40px rgba(0,0,0,.25);padding:22px;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.mm-drawer-open{transform:translateX(0)}
.mm-divider{border-bottom:1px solid var(--border)}
.mm-hist{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-radius:12px;font-size:12.5px;font-weight:500;
  background:var(--surface);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s}
.mm-hist:hover{border-color:var(--accent);background:var(--surface-2)}
.mm-hist-del{opacity:0;padding:6px;border-radius:8px;border:0;background:transparent;color:var(--muted);cursor:pointer;transition:.2s;flex-shrink:0}
.mm-hist:hover .mm-hist-del,.mm-hist-del:focus{opacity:1}
.mm-hist-del:hover{color:#ef4444;background:var(--surface-2)}
@media (hover:none){.mm-hist-del{opacity:1}}
.mm-wipe{margin-top:14px;width:100%;padding:11px;border-radius:12px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.1);color:#ef4444;
  font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:.2s}
.mm-wipe:hover{background:#ef4444;color:#fff}
.mm-toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:60;padding:10px 18px;border-radius:999px;background:var(--text);color:var(--bg);font-size:12.5px;font-weight:600;box-shadow:var(--shadow)}
.mm-fade{animation:mm-in .3s ease both}
@keyframes mm-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mm-blink{50%{opacity:0}}
@keyframes mm-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}
@keyframes mm-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}
`;