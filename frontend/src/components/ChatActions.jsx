import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { FaPaperPlane, FaRobot, FaUser, FaLock, FaSync } from "react-icons/fa";

// Immersive styling helpers for chat streams
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function ChatActions() {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your MovieMind AI assistant. Ask me anything about directors, cinema stats, hidden details, or movie analysis parameters!",
      createdAt: new Date()
    }
  ]);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-scroll anchor stream tracker
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Sync existing database history loops if authenticated on initialization
  useEffect(() => {
    if (auth.currentUser) {
      loadChatHistory();
    }
  }, []);

  const loadChatHistory = async () => {
    try {
      const q = query(
        collection(db, "users", auth.currentUser.uid, "chats"),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(history);
      }
    } catch (err) {
      console.error("Chat history fetch error:", err);
    }
  };

  // ============================================
  // GATED CHAT ACTION DISPATCH INTERCEPTOR
  // ============================================

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userPrompt = input.trim();
    setInput(""); // Clear immediately for snappy UI feel

    // 1. Strict Authentication Validation Interception Layer
    const isLoggedIn = auth.currentUser;

    if (!isLoggedIn) {
      // Pull anonymous tracking count integers from local disk storage memory
      const anonymousChatCount = parseInt(localStorage.getItem("anon_chat_count") || "0", 10);

      // Block prompt evaluation if the 2 free queries have been spent
      if (anonymousChatCount >= 2) {
        alert("🔒 Strict Security Gate: You've reached your free preview limit of 2 AI queries. Please log in with your email profile to unlock infinite AI recommendations!");
        navigate("/login");
        return;
      }

      // Increment visitor token log parameters
      const updatedCount = anonymousChatCount + 1;
      localStorage.setItem("anon_chat_count", updatedCount.toString());
      console.warn(`⚠️ Guest Chat Warning: Dispatched ${updatedCount}/2 free preview queries.`);
    }

    // 2. Append User Prompt locally to layout
    const userMessage = {
      role: "user",
      content: userPrompt,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Save prompt to user document profile history matrix dynamically if authenticated
    if (isLoggedIn) {
      try {
        await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
          role: "user",
          content: userPrompt,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Firestore prompt logging failed:", err);
      }
    }

    // 3. Request LLM completion logic from Groq Core Pipeline APIs
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: "You are MovieMind AI, an expert cinematic analytical data model specializing in film structure, screenwriting insights, and personalized curation vectors." },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) throw new Error("Server engine returned an invalid authentication context token.");
      
      const data = await response.json();
      const assistantReply = data.choices[0]?.message?.content || "I ran into a problem tracking that movie dataset signature. Please try again.";

      const botMessage = {
        role: "assistant",
        content: assistantReply,
        createdAt: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);

      // Sync reply entry back into Firestore context parameters if authenticated
      if (isLoggedIn) {
        await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
          role: "assistant",
          content: assistantReply,
          createdAt: serverTimestamp()
        });
      }

    } catch (apiError) {
      console.error("Groq AI infrastructure crash pipeline fallback:", apiError);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ System Connection Error: Unable to query Groq deep intelligence matrices. Verify VITE_GROQ_API_KEY integration tokens.",
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-4xl mx-auto bg-[#0a0a10]/90 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative backdrop-blur-2xl">
      
      {/* Dynamic Status Indicator Header */}
      <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="font-bold text-md tracking-tight flex items-center gap-2">
              MovieMind Assistant 
              {!auth.currentUser && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/20 rounded-md uppercase tracking-wider font-mono">Guest Mode</span>}
            </h3>
            <p className="text-xs text-white/40">Powered by Groq Intelligence Systems</p>
          </div>
        </div>
        <button onClick={() => navigate("/")} className="text-xs text-gray-400 hover:text-white border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5 transition-all">
          Exit Matrix
        </button>
      </div>

      {/* Realtime Conversational Stream Feed Row Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex gap-4 w-full max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            {/* Context Character Avatars */}
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
              msg.role === "user" 
                ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {msg.role === "user" ? <FaUser className="text-xs" /> : <FaRobot className="text-sm" />}
            </div>

            {/* Markdown Messaging Bubble Chassis */}
            <div className={`rounded-2xl p-4 text-sm leading-relaxed max-w-xl shadow-lg border ${
              msg.role === "user"
                ? "bg-gradient-to-br from-red-600/20 to-pink-600/20 border-pink-500/10 text-white/90"
                : "bg-white/[0.03] border-white/5 text-white/80"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Dynamic Matrix Processing Frame Loader */}
        {loading && (
          <div className="flex gap-4 mr-auto animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <FaSync className="text-xs animate-spin" />
            </div>
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 text-xs font-mono text-white/40 tracking-widest flex items-center gap-2">
              PROCESSING CURATION VECTOR NODES...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Prompt Construction Form Block */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/20 relative z-10">
        <div className="relative flex items-center bg-white/[0.04] border border-white/5 focus-within:border-pink-500/40 rounded-2xl transition-all p-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={auth.currentUser ? "Ask MovieMind AI..." : "Ask anything (2 guest prompts left)..."}
            className="w-full bg-transparent outline-none py-3.5 pl-5 pr-14 text-sm text-white placeholder-white/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 p-3.5 bg-gradient-to-r from-red-500 to-pink-500 disabled:from-white/5 disabled:to-transparent disabled:text-white/10 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <FaPaperPlane className="text-xs" />
          </button>
        </div>
      </form>
    </div>
  );
}