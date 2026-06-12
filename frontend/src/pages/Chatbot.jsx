// src/pages/Chatbot.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaPaperPlane, FaRobot, FaUser, FaSync, FaTrashAlt, FaArrowLeft } from "react-icons/fa";
import MessageActions from "../components/MessageActions";

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const TMDB_API_KEY   = import.meta.env.VITE_TMDB_API_KEY;
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ── TMDB Discover Endpoint Pipeline ──────────────────────────────────────────
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

// ── Tavily Web Analytics Crawler ─────────────────────────────────────────────
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

// ── LLM Prompt Matrix Parameters ─────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are MovieMind AI — an expert movie assistant covering all world cinema.
Expertise: Hollywood, Bollywood, Tamil (Kollywood), Telugu, Malayalam, Korean cinema.
Rules:
1. Plain text responses only. Never output bold headers or markdown symbols like asterisks (**).
2. Use web search results as your primary source of truth for cast, rankings, and structural details.
3. Keep responses warm, concise, and organically punctuated with emojis.
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

function MessageContent({ text }) {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRe);
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((p, i) =>
        urlRe.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer"
            className="text-pink-400 underline break-all hover:text-red-400 transition">
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
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [statusMsg, setStatus]  = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Synchronize Firestore history log structures on initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsUserAuthenticated(true);
        try {
          const q = query(
            collection(db, "users", currentUser.uid, "chats"),
            orderBy("createdAt", "asc")
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const history = snapshot.docs.map(doc => ({
              role: doc.data().role,
              content: doc.data().content
            }));
            setMessages(history);
          }
        } catch (err) {
          console.error("Failed to load historical log indices:", err);
        }
      } else {
        setIsUserAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addMsg = (role, content) =>
    setMessages((prev) => [...prev, { role, content }]);

  const handleEditMessage = (msg, index) => {
    setInput(msg.content);
    setMessages(messages.slice(0, index));
    setEditingIndex(null);
  };

  // ============================================
  // UNIFIED SECURE CHAT DEPLOYMENT ENGINE
  // ============================================
  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    // 🔒 STRICT SECURITY INTERCEPTOR ACCESS WALL
    if (!isUserAuthenticated) {
      const anonymousChatCount = parseInt(localStorage.getItem("anon_chat_count") || "0", 10);

      if (anonymousChatCount >= 2) {
        alert("🔒 Strict Security Gate: You've reached your free preview limit of 2 AI chatbot queries. Please log in with your email profile to unlock infinite AI recommendations!");
        localStorage.setItem("auth_redirect_target", "/chatbot");
        navigate("/login");
        return;
      }
      const updatedCount = anonymousChatCount + 1;
      localStorage.setItem("anon_chat_count", updatedCount.toString());
    }

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

    // Save prompt path values directly to user's db tree if authenticated
    if (isUserAuthenticated && auth.currentUser) {
      try {
        await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
          role: "user",
          content: userText,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Firestore user log failed:", err);
      }
    }

    const lower = userText.toLowerCase();
    const isTamilQuery = lower.includes("tamil movie") || lower.includes("tamil movies") || lower === "tamil";
    const yearMatch = userText.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : null;
    const isFutureYear = year && parseInt(year) >= new Date().getFullYear();

    try {
      // Channel 1: Primary TMDB Database Pipeline 
      if (isTamilQuery && !isFutureYear) {
        setStatus("Fetching from TMDB matrix fields...");
        const movies = await fetchTamilMovies(year);
        if (movies) {
          const tmdbReply = formatTmdbResults(movies, year);
          addMsg("assistant", tmdbReply);
          
          if (isUserAuthenticated && auth.currentUser) {
            await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
              role: "assistant",
              content: tmdbReply,
              createdAt: serverTimestamp()
            });
          }
          return;
        }
      }

      // Channel 2: Advanced Web Crawling Context Interpolation
      if (TAVILY_API_KEY) {
        setStatus("Crawling web layers...");
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

        setStatus("Assembling semantic metrics...");
        const reply = await callGroq(updatedMessages, `WEB CONTEXT:\n${webContext}`);
        addMsg("assistant", reply);

        if (isUserAuthenticated && auth.currentUser) {
          await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
            role: "assistant",
            content: reply,
            createdAt: serverTimestamp()
          });
        }
        return;
      }

      // Baseline Channel Fallback
      setStatus("Analyzing cinema branches...");
      const reply = await callGroq(updatedMessages);
      addMsg("assistant", reply);

      if (isUserAuthenticated && auth.currentUser) {
        await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
          role: "assistant",
          content: reply,
          createdAt: serverTimestamp()
        });
      }

    } catch (err) {
      addMsg("assistant", `Error compiling response: ${err.message}`);
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

  const clearChatCanvas = () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    localStorage.removeItem("anon_chat_count");
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-white relative overflow-hidden font-sans antialiased">
      {/* Cinematic Deep Aura Background Vectors */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_35%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_35%)] opacity-50 pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col h-screen w-full">
        
        {/* Navigation Control Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] backdrop-blur-2xl bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
                MovieMind AI
              </h1>
              <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono mt-0.5">
                {!isUserAuthenticated ? "Guest Token Session" : "Secure Intelligence Stream"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={clearChatCanvas} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition flex items-center gap-2 text-white/80 hover:text-white">
              <FaTrashAlt className="text-[10px]" /> Clear Matrix
            </button>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 font-bold text-xs shadow-lg hover:opacity-95 transition flex items-center gap-2">
              <FaArrowLeft className="text-[9px]" /> Back
            </button>
          </div>
        </div>

        {/* Realtime Conversational Stream Component Area (Height Optimized) */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide bg-black/10">
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            
            {messages.map((msg, i) => (
              <div key={i} className="space-y-6">
                
                {/* Unified Contextual Chip Matrix Inserted Inside Message Order Flow */}
                {i === 0 && messages.length <= 1 && (
                  <div className="w-full animate-fade-in my-2">
                    <div className="rounded-[28px] border border-white/[0.06] bg-[#0b0b14]/60 p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/[0.03] to-transparent blur-xl pointer-events-none" />
                      <h2 className="text-md font-bold tracking-wide text-white/80 mb-4 text-center sm:text-left">
                        ⚡ Quick Query Vectors:
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {moodButtons.map((btn) => (
                          <button key={btn.label} disabled={loading} onClick={() => sendMessage(btn.query)} className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-white/80 hover:text-white transition text-xs font-medium disabled:opacity-40">
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Bubble Structures */}
                <div className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Circle Identity Icons */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
                      msg.role === "user" 
                        ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      {msg.role === "user" ? <FaUser className="text-xs" /> : <FaRobot className="text-sm" />}
                    </div>

                    {/* Text chassis bubble container */}
                    <div className={`rounded-2xl px-5 py-4 text-[14.5px] leading-relaxed shadow-xl border ${
                      msg.role === "user" 
                        ? "bg-gradient-to-br from-red-600/15 to-pink-600/15 border-pink-500/10 text-white/90" 
                        : "bg-white/[0.02] border-white/[0.05] text-gray-100"
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
                </div>

              </div>
            ))}

            {/* Micro Processing Matrix Frame Loader */}
            {loading && (
              <div className="flex justify-start gap-4 max-w-xl animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <FaSync className="text-xs animate-spin" />
                </div>
                <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl px-5 py-4 text-xs font-mono text-white/40 tracking-widest flex items-center">
                  {statusMsg || "GENERATING RESPONSE MATRIX..."}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Control Console Block Drawer */}
        <div className="border-t border-white/[0.06] p-5 backdrop-blur-3xl bg-black/40 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-center bg-white/[0.03] border border-white/[0.05] focus-within:border-pink-500/40 rounded-2xl transition-all p-1.5 shadow-inner">
              <input
                type="text"
                placeholder={isUserAuthenticated ? "Query the movie matrix system..." : "Ask cinema questions (2 preview tokens remaining)..."}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none py-3.5 pl-5 pr-16 text-[14.5px] text-white placeholder-white/20"
              />
              <button
                disabled={loading || !input.trim()}
                onClick={() => sendMessage()}
                className="absolute right-2.5 p-3.5 bg-gradient-to-r from-red-500 to-pink-500 disabled:from-white/5 disabled:to-transparent disabled:text-white/10 text-white rounded-xl active:scale-95 transition-all shadow-md"
              >
                <FaPaperPlane className="text-xs" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}