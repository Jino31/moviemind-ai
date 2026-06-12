// src/components/ChatActions.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { FaPaperPlane, FaRobot, FaUser, FaSync } from "react-icons/fa";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function ChatActions() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your MovieMind AI assistant. Ask me anything about directors, cinema stats, or personalized recommendations!",
      createdAt: new Date()
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
      if (!snap.empty) setMessages(snap.docs.map(d => ({ ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================
  // CRITICAL 3RD CHAT ATTEMPT LOCKOUT INTERCEPTOR
  // ============================================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userPrompt = input.trim();

    // Verification check sequence
    if (!auth.currentUser) {
      const currentChatCount = parseInt(localStorage.getItem("anon_chat_count") || "0", 10);

      // LOCK CONTEXT AT COUNTER 2 (THE 3RD ATTEMPT)
      if (currentChatCount >= 2) {
        alert("🔒 Strict Security Gate: You've reached your free preview limit of 2 AI chatbot queries. Please log in with your email profile to unlock infinite AI recommendations!");
        localStorage.setItem("auth_redirect_target", "/chatbot"); // Save back-route target
        navigate("/login");
        return;
      }

      const updatedCount = currentChatCount + 1;
      localStorage.setItem("anon_chat_count", updatedCount.toString());
    }

    setInput("");
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
          messages: [{ role: "system", content: "You are MovieMind AI, an expert cinematic data model." }, ...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userPrompt }]
        })
      });

      const data = await res.json();
      const reply = data.choices[0]?.message?.content || "Error configuring recommendations.";

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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-4xl mx-auto bg-[#0a0a10]/90 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative mt-24">
      <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">MovieMind Assistant {!auth.currentUser && <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md">Preview Mode</span>}</h3>
        <button onClick={() => navigate("/")} className="text-xs text-gray-400 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5">Exit</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>{msg.role === "user" ? <FaUser /> : <FaRobot />}</div>
            <div className={`rounded-2xl p-4 text-sm max-w-xl ${msg.role === "user" ? "bg-gradient-to-br from-red-600/20 to-pink-600/20 text-white/90 border-pink-500/10" : "bg-white/[0.03] text-white/80 border-white/5"}`}><p className="whitespace-pre-wrap">{msg.content}</p></div>
          </div>
        ))}
        {loading && <div className="flex gap-4 animate-pulse"><div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center text-red-400"><FaSync className="animate-spin" /></div><div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs font-mono text-white/40">COMPILING...</div></div>}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/20">
        <div className="relative flex items-center bg-white/[0.04] border border-white/5 rounded-2xl p-1.5 focus-within:border-pink-500/40 transition-all">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={auth.currentUser ? "Ask MovieMind AI..." : "Ask anything (2 guest prompts left)..."} className="w-full bg-transparent outline-none py-3.5 pl-5 pr-14 text-sm text-white placeholder-white/20" />
          <button type="submit" disabled={!input.trim() || loading} className="absolute right-3 p-3.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl active:scale-95 transition-all"><FaPaperPlane className="text-xs" /></button>
        </div>
      </form>
    </div>
  );
}