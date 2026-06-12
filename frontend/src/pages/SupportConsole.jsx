// frontend/src/pages/SupportConsole.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaArrowLeft, FaPaperPlane, FaSync, FaHeadset } from "react-icons/fa";

export default function SupportConsole() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("Feedback");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // 🤖 CONFIGURATION: AUTOMATIC PLACEHOLDER DICTIONARY
  const placeholders = {
    "Feedback": "What do you like about MovieMind AI? (e.g., 'The interface is beautiful, and I love the cinematic styling!')",
    "Bug Report": "What went wrong? Please include steps to reproduce. (e.g., 'The Find Your Movie poster image fails to load when I upload a high-res PNG file.')",
    "Get Help": "How can the developer assist you? (e.g., 'I am unable to see my search history panel. Can you please verify my account data stream sync?')"
  };

  // ⚡ CONFIGURATION: PRE-FIXED QUICK COMMENTS KEYED PER ROUTE BUTTON
  const quickComments = {
    "Feedback": [
      { label: "Excellent UI 🌟", text: "The streaming platform interface is absolutely beautiful and clean!" },
      { label: "AI is Amazing 🤖", text: "The movie recommendation outputs are incredibly accurate and smart." },
      { label: "Love the Theme 🎬", text: "The dark cinematic background aura fits perfectly for movie geeks." }
    ],
    "Bug Report": [
      { label: "Broken Asset 🖼️", text: "Found a missing or broken poster image resource string in the application." },
      { label: "Shield Block 🛡️", text: "Brave shields are intercepting database write networks on my client build." },
      { label: "Page Crash ⚠️", text: "The screen turned completely black during specific internal routing changes." }
    ],
    "Get Help": [
      { label: "History Missing 📊", text: "I cannot see my previous reverse-image search items in the sidebar panel." },
      { label: "Auth Barrier 🔒", text: "Stuck at the profile authentication wall. Requesting manual stream validation." },
      { label: "Slow Sync ⏳", text: "The simulated machine learning processing loop is taking too long to populate." }
    ]
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsUserLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    if (!isUserLoggedIn || !auth.currentUser) {
      alert("🔒 Authentication Required: Please log in to your profile before submitting developer help tickets.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "feedback"), {
        uid: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous Explorer",
        userEmail: auth.currentUser.email,
        category: category,
        message: message.trim(),
        timestamp: serverTimestamp(),
      });

      alert("✨ Ticket Transmitted: Thank you! Your feedback has been routed directly to the developer console.");
      setMessage("");
      navigate(-1); // Automatically send user back to previous page view context node
    } catch (err) {
      console.error("Developer contact pipeline crash:", err);
      alert("❌ Submission Failure: Permissions layer blocked writing to database. Check security rules.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-white relative overflow-hidden font-sans antialiased flex flex-col justify-between">
      {/* Immersive Background Cinematic Aura Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4c1d95,transparent_45%),radial-gradient(circle_at_bottom_left,#7f1d1d,transparent_45%)] opacity-40 pointer-events-none z-0" />

      {/* Top Application Navigation Bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.06] backdrop-blur-2xl bg-black/20">
        <div className="flex items-center gap-3">
          <FaHeadset className="text-xl text-pink-500 animate-pulse" />
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
              Developer Support Console
            </h1>
            <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono mt-0.5">
              Direct Developer Pipeline Node
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <FaArrowLeft className="text-[9px]" /> Back
        </button>
      </div>

      {/* Main Workspace Frame Panel */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-[#0b0b14]/60 border border-white/[0.06] rounded-[36px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/[0.04] to-transparent blur-2xl pointer-events-none" />

          <form onSubmit={handleSubmitFeedback} className="space-y-6">
            
            {/* Category Select Buttons */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-white/40 mb-2.5">Select Category</label>
              <div className="grid grid-cols-3 gap-3">
                {["Feedback", "Bug Report", "Get Help"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setMessage(""); 
                    }}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer ${
                      category === cat
                        ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-pink-500/40 text-pink-400 shadow-md scale-[1.01]"
                        : "bg-white/[0.02] border-white/[0.05] text-white/60 hover:bg-white/[0.05]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Comment Clickable Tags */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-white/40 mb-2">Quick Comments</label>
              <div className="flex flex-wrap gap-2">
                {quickComments[category].map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={!isUserLoggedIn}
                    onClick={() => setMessage(item.text)}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-pink-500/30 hover:bg-pink-500/5 text-xs text-white/70 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input message row */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-white/40 mb-2">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isUserLoggedIn ? placeholders[category] : "Please log in to submit your support logs..."}
                disabled={submitting || !isUserLoggedIn}
                rows={6}
                className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.05] focus:border-pink-500/40 outline-none p-5 text-sm text-white placeholder-white/30 transition-all resize-none leading-relaxed h-40 focus:bg-white/[0.01]"
                maxLength={1000}
              />
            </div>

            {/* Premium Submit Action Trigger */}
            <button
              type="submit"
              disabled={submitting || !message.trim() || !isUserLoggedIn}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 text-white font-extrabold text-sm tracking-wide transition-all duration-300 transform border border-white/10 shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:scale-[1.01] active:scale-[0.99] disabled:from-white/5 disabled:to-transparent disabled:text-white/10 disabled:border-white/5 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <FaSync className="animate-spin text-xs" />
                  <span>TRANSMITTING TICKET...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs" />
                  <span>Transmit Ticket To Developer</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer System Status Strip */}
      <div className="relative z-10 text-center py-4 border-t border-white/[0.03] bg-black/10 text-[11px] text-white/20 font-mono tracking-widest uppercase">
        MovieMind AI Core Client Support © 2026
      </div>
    </div>
  );
}