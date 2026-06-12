// src/pages/ChatActions.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { FaPaperPlane, FaRobot, FaUser, FaSync, FaArrowLeft, FaTrashAlt } from "react-icons/fa";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function ChatActions() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const moodSuggestions = [
    { label: "Action", emoji: "🔥", prompt: "Recommend some high-octane action movies with incredible choreography." },
    { label: "Comedy", emoji: "😂", prompt: "Give me a list of hilarious, brilliant comedy movies." },
    { label: "Horror", emoji: "👻", prompt: "What are the scariest horror movies with great atmospheric tension?" },
    { label: "Sci-Fi", emoji: "🚀", prompt: "Suggest mind-bending sci-fi movies featuring space exploration or time anomalies." },
    { label: "Romance", emoji: "❤️", prompt: "Recommend heartwarming romance movies with incredible chemistry." },
    { label: "Thriller", emoji: "🕵️‍♂️", prompt: "What are some intense psychological thrillers that keep you guessing?" },
    { label: "Tamil", emoji: "🎬", prompt: "Give me top-rated blockbuster Tamil cinema recommendations across different genres." },
    { label: "Top IMDb", emoji: "🏆", prompt: "List highly critically acclaimed masterpieces with top IMDb scores." }
  ];

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm MovieMind AI 🎬\n\nAsk me anything:\n• Tamil, Hindi, English, Korean movies\n• Ratings, recommendations, streaming info\n• Actors, directors, box office\n• Latest & upcoming releases",
      createdAt: new Date(),
      isWelcome: true // Flag to render suggestions contextually inside the greeting bubble
    }
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (auth.currentUser) loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const q = query(collection(db, "users", auth.currentUser.uid, "chats"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const history = snap.docs.map(d => ({ ...d.data() }));
        setMessages(history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your screen display session?")) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm MovieMind AI 🎬\n\nAsk me anything:\n• Tamil, Hindi, English, Korean movies\n• Ratings, recommendations, streaming info\n• Actors, directors, box office\n• Latest & upcoming releases",
          createdAt: new Date(),
          isWelcome: true
        }
      ]);
    }
  };

  const executeQueryPipeline = async (userPrompt) => {
    if (!auth.currentUser) {
      const currentChatCount = parseInt(localStorage.getItem("anon_chat_count") || "0", 10);

      if (currentChatCount >= 2) {
        alert("🔒 Strict Security Gate: You've reached your free preview limit of 2 AI chatbot queries. Please log in with your email profile to unlock infinite AI recommendations!");
        localStorage.setItem("auth_redirect_target", "/chatbot");
        navigate("/login");
        return;
      }

      const updatedCount = currentChatCount + 1;
      localStorage.setItem("anon_chat_count", updatedCount.toString());
    }

    setMessages(prev => [...prev, { role: "user", content: userPrompt, createdAt: new Date() }]);
    setLoading(true);

    if (auth.currentUser) {
      await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), { role: "user", content: userPrompt, createdAt: serverTimestamp() });
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [{ role: "system", content: "You are MovieMind AI, an expert cinematic data model specializing in structural film tracking, director metrics, and fluid personalized suggestions." }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userPrompt }]
        })
      });

      const data = await res.json();
      const reply = data.choices[0]?.message?.content || "Error configuring recommendation models.";

      setMessages(prev => [...prev, { role: "assistant", content: reply, createdAt: new Date() }]);

      if (auth.currentUser) {
        await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), { role: "assistant", content: reply, createdAt: serverTimestamp() });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const currentInput = input.trim();
    setInput("");
    executeQueryPipeline(currentInput);
  };

  return (
    <div className="min-h-screen bg-[#040408] text-white font-sans antialiased relative overflow-hidden flex flex-col justify-between">
      
      {/* 🌌 CINEMATIC BACKGROUND GLOWS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-red-600/[0.06] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-purple-600/[0.07] blur-[150px]" />
      </div>

      {/* ── HIGH-FLUID HEADER CONTROL BAR ── */}
      <div className="w-full backdrop-blur-2xl bg-black/40 border-b border-white/5 fixed top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <h1 onClick={() => navigate("/")} className="text-3xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent tracking-tight cursor-pointer">
              MovieMind AI
            </h1>
            <p className="text-white/40 text-xs tracking-wider mt-0.5 font-medium">Curation Matrix Core v2.4</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleClearChat}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-gray-400 text-xs font-semibold flex items-center gap-2 transition-all duration-300 active:scale-95"
              title="Clear current viewport chat log history"
            >
              <FaTrashAlt /> Clear
            </button>
            <button 
              onClick={() => navigate("/")} 
              className="px-5 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all duration-300 active:scale-95"
            >
              <FaArrowLeft className="text-[10px]" /> Back
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN FULL-HEIGHT CHAT STREAM VIEWPORT ── */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 pt-28 pb-32 overflow-y-auto space-y-8 z-10 scrollbar-hide flex flex-col">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-5 w-full max-w-3xl animate-fade-in ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            {/* Context Circular Avatars */}
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === "user" 
                ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                : "bg-gradient-to-br from-red-500 to-pink-500 border-none text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            }`}>
              {msg.role === "user" ? <FaUser className="text-sm" /> : <FaRobot className="text-md" />}
            </div>

            {/* Message Bubble Structure */}
            <div className="flex flex-col gap-4 max-w-2xl w-full">
              <div className={`rounded-3xl p-5 text-md leading-relaxed shadow-xl border ${
                msg.role === "user"
                  ? "bg-[#16121e]/70 border-pink-500/10 text-white/90 rounded-tr-none self-end"
                  : "bg-[#0d0d14]/80 border-white/[0.05] text-white/80 rounded-tl-none"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* 🧩 INTEGRATED MOOD SUGGESTIONS CHIPS (Renders only below first greeting bubble) */}
              {msg.isWelcome && messages.length <= 1 && (
                <div className="mt-2 animate-fade-in">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-1">What are you in the mood for?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {moodSuggestions.map((mood) => (
                      <button
                        key={mood.label}
                        onClick={() => executeQueryPipeline(mood.prompt)}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-left text-sm font-medium hover:bg-white/5 hover:border-pink-500/30 transition-all duration-300 flex items-center gap-3 group active:scale-95"
                      >
                        <span className="text-lg group-hover:scale-125 transition-transform duration-300">{mood.emoji}</span>
                        <span className="text-white/70 group-hover:text-white transition-colors">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Dynamic Matrix Processing Frame Loader */}
        {loading && (
          <div className="flex gap-5 mr-auto animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <FaSync className="text-sm animate-spin" />
            </div>
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs font-mono text-white/40 tracking-widest flex items-center gap-2">
              COMPILING ANALYTICAL SELECTION VECTORS...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── STICKY COMPACT INPUT PANEL ENGINE ── */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-gradient-to-t from-[#040408] via-[#040408]/90 to-transparent pt-10 pb-6 px-6">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="relative flex items-center bg-[#0d0d16] border border-white/10 focus-within:border-pink-500/40 rounded-2xl transition-all p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={auth.currentUser ? "Ask MovieMind AI anything movie related..." : "Ask anything (2 guest prompts left)..."}
              disabled={loading}
              className="w-full bg-transparent outline-none py-4 pl-6 pr-16 text-md text-white placeholder-white/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-3 p-4 bg-gradient-to-r from-red-500 to-pink-500 disabled:from-white/5 disabled:to-transparent disabled:text-white/10 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
          <p className="text-[10px] text-center text-white/20 font-medium tracking-wide mt-3 uppercase font-mono">
            MovieMind AI can formulate analytical errors. Cross-reference streaming index files contextually.
          </p>
        </form>
      </div>

    </div>
  );
}