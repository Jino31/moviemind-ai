import { useState, useRef, useEffect } from "react";
import MessageActions from "../components/MessageActions";

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const TMDB_API_KEY   = import.meta.env.VITE_TMDB_API_KEY;
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ── TMDB via Vite proxy ────────────────────────────────────────────────────
async function fetchTamilMovies(year = null) {
  let url = `/tmdb/discover/movie?with_original_language=ta&sort_by=popularity.desc&api_key=${TMDB_API_KEY}`;
  if (year) url += `&primary_release_year=${year}`;
  try {
    const res = await fetch(url);
    if (res.status >= 500 || !res.ok) return null;
    const data = await res.json();
    return data.results?.length ? data.results.slice(0, 10) : null;
  } catch {
    return null;
  }
}

function formatTmdbResults(movies, year) {
  const label = year ? ` — ${year} Releases` : " — Trending Now";
  const list = movies
    .map(
      (m, i) =>
        `${i + 1}. ${m.title} (${m.release_date?.slice(0, 4) ?? "N/A"})\n` +
        `   TMDB Rating: ${m.vote_average ? m.vote_average.toFixed(1) : "Not yet rated"} (${m.vote_count ?? 0} votes)\n` +
        `   ${m.overview ? m.overview.slice(0, 120) + "..." : "No description available."}`
    )
    .join("\n\n");
  return `Tamil Movies${label}  |  Source: TMDB (live)\n\n${list}`;
}

// ── Tavily web search ──────────────────────────────────────────────────────
async function tavilySearch(query) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 5,
      include_answer: true,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  return res.json();
}

// ── Groq API Call with Rate-Limit Handling ─────────────────────────────────
const SYSTEM_PROMPT = `
You are MovieMind AI — an expert movie assistant covering all world cinema.
Expertise: Hollywood, Bollywood, Tamil (Kollywood), Telugu, Malayalam, Korean cinema.
Rules:
1. Plain text only. No bold, no markdown symbols like asterisks.
2. Use web search results as your primary source of truth.
3. Be warm, concise, and use emojis occasionally.
`;

async function callGroq(msgs, systemExtra = "", retries = 3, backoff = 2000) {
  const system = systemExtra ? SYSTEM_PROMPT + "\n\n" + systemExtra : SYSTEM_PROMPT;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: system },
            ...msgs.map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            })),
          ],
          temperature: 0.4,
          max_tokens: 1024,
        }),
      });

      if (res.status === 429 && attempt < retries - 1) {
        console.warn(`Rate limit triggered. Retrying attempt ${attempt + 1} in ${backoff}ms...`);
        await delay(backoff);
        backoff *= 2; 
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Groq HTTP ${res.status}`);
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content ?? "No response.";
      return raw.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

    } catch (error) {
      if (attempt === retries - 1) throw error; 
    }
  }
}

// ── Render Text Links ─────────────────────────────────────────────────────
function MessageContent({ text }) {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRe);
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((p, i) =>
        urlRe.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer"
            style={{ color: "#f87171", textDecoration: "underline", wordBreak: "break-all" }}>
            {p}
          </a>
        ) : p
      )}
    </span>
  );
}

const moodButtons = [
  { label: "🔥 Action",    query: "Best action movies of all time" },
  { label: "😂 Comedy",    query: "Best comedy movies to watch" },
  { label: "👻 Horror",    query: "Best horror movies ever made" },
  { label: "🚀 Sci-Fi",    query: "Best sci-fi movies of all time" },
  { label: "💖 Romance",   query: "Best romance movies to watch" },
  { label: "🕵️ Thriller", query: "Best thriller movies ever" },
  { label: "🎭 Tamil",     query: "Best Tamil movies all time with ratings" },
  { label: "🏆 Top IMDb",  query: "Top 10 highest rated movies on IMDb all time" },
];

const WELCOME = "Hi! I'm MovieMind AI 🎬\n\nAsk me anything:\n• Tamil, Hindi, English, Korean movies\n• Ratings, recommendations, streaming info\n• Actors, directors, box office\n• Latest & upcoming releases";

export default function Chatbot() {
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [statusMsg, setStatus]  = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMsg = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleEditMessage = (msg, index) => {
    setInput(msg.content);
    setMessages(messages.slice(0, index));
    setEditingIndex(null);
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput("");
    setLoading(true);

    let updatedMessages;
    if (editingIndex !== null) {
      updatedMessages = [...messages];
      updatedMessages[editingIndex] = { role: "user", content: userText };
      updatedMessages = updatedMessages.slice(0, editingIndex + 1);
      setEditingIndex(null);
    } else {
      updatedMessages = [...messages, { role: "user", content: userText }];
    }

    setMessages(updatedMessages);
    const lower = userText.toLowerCase();

    const isTamilQuery = lower.includes("tamil movie") || lower.includes("tamil movies") || lower === "tamil";
    const yearMatch = userText.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : null;
    const isFutureYear = year && parseInt(year) >= new Date().getFullYear();

    try {
      if (isTamilQuery && !isFutureYear) {
        setStatus("Fetching from TMDB...");
        const movies = await fetchTamilMovies(year);
        if (movies) {
          addMsg("assistant", formatTmdbResults(movies, year));
          return;
        }
      }

      if (TAVILY_API_KEY) {
        setStatus("Searching the web...");
        const yr = year ?? new Date().getFullYear();
        const queries = isTamilQuery 
          ? [`${yr} Tamil movies released list box office`] 
          : [`${userText} movie details cast rating`];

        const allResults = await Promise.allSettled(queries.map(tavilySearch));
        
        const webContext = allResults
          .filter(r => r.status === "fulfilled")
          .map(r => r.value.results.map(item => item.content?.slice(0, 300)).join("\n"))
          .join("\n")
          .slice(0, 2500);

        setStatus("Generating answer...");
        const reply = await callGroq(updatedMessages, `WEB CONTEXT:\n${webContext}`);
        addMsg("assistant", reply);
        return;
      }

      setStatus("Thinking...");
      const reply = await callGroq(updatedMessages);
      addMsg("assistant", reply);

    } catch (err) {
      addMsg("assistant", `Error: ${err.message}`);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_30%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_30%)] opacity-60" />
      <div className="relative z-10 flex flex-col h-screen">
        
        {/* Header Layout (Refined Padding) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 backdrop-blur-xl bg-black/30">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent tracking-tight">MovieMind AI</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMessages([{ role: "assistant", content: WELCOME }])} className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition">Clear</button>
            <button onClick={() => window.history.back()} className="px-5 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 font-semibold text-sm hover:opacity-90 transition">Back</button>
          </div>
        </div>

        {/* main Chat Screen Component */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          {/* Conditional Mood Suggestions Box (Hides after interaction) */}
          {messages.length <= 1 && (
            <div className="max-w-5xl mx-auto mb-8 transition-all duration-300">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
                <h2 className="text-2xl font-black mb-4">What are you in the mood for?</h2>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {moodButtons.map((btn) => (
                    <button key={btn.label} disabled={loading} onClick={() => sendMessage(btn.query)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 transition text-sm disabled:opacity-40">
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Centered Message Column */}
          <div className="max-w-5xl mx-auto space-y-5 pb-24">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-3xl px-5 py-4 text-[14.5px] leading-relaxed shadow-xl ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium" 
                    : "bg-neutral-900/80 border border-white/10 backdrop-blur-md text-gray-100"
                }`}>
                  <MessageContent text={msg.content} />
                  
                  {msg.role === "user" && (
                    <MessageActions 
                      content={msg.content} 
                      onEdit={() => handleEditMessage(msg, i)} 
                    />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-900/80 border border-white/10 rounded-3xl px-5 py-4 text-sm text-white/60 animate-pulse">
                  {statusMsg || "Thinking..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Perfectly Block-Aligned Input Drawer */}
        <div className="border-t border-white/10 p-4 backdrop-blur-xl bg-black/50">
          <div className="max-w-5xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Ask about any movie, genre, or actor..."
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none text-[14.5px] focus:border-white/20 focus:bg-white/10 placeholder:text-white/30 transition"
            />
            <button
              disabled={loading || !input.trim()}
              onClick={() => sendMessage()}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 font-bold text-sm tracking-wide disabled:opacity-30 hover:opacity-95 transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}