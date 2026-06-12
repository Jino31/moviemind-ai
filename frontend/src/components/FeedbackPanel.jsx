// src/components/FeedbackPanel.jsx

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaCommentAlt, FaTimes, FaPaperPlane, FaSync } from "react-icons/fa";

export default function FeedbackPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("Feedback");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const placeholders = {
    "Feedback": "What do you like about MovieMind AI? (e.g., 'The interface is beautiful, and I love the cinematic styling!')",
    "Bug Report": "What went wrong? Please include steps to reproduce. (e.g., 'The Find Your Movie poster image fails to load when I upload a high-res PNG file.')",
    "Get Help": "How can the developer assist you? (e.g., 'I am unable to see my search history panel. Can you please verify my account data stream sync?')"
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
      setIsOpen(false);
    } catch (err) {
      console.error("Developer contact pipeline crash:", err);
      alert("❌ Submission Failure: Permissions layer blocked writing to database. Check security rules.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] font-sans antialiased">
      
      {/* ── FLOATING CORNER CONTACT TRIGGER BUTTON ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-white/10 group"
          title="Contact Developer & Help"
        >
          <FaCommentAlt className="text-lg group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* ── IMMERSIVE GLASSMORPHISM SUPPORT DRAWER PANEL ── */}
      {isOpen && (
        <div className="w-96 rounded-3xl border border-white/[0.08] bg-[#090911]/95 backdrop-blur-2xl p-6 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/[0.03] to-transparent blur-xl pointer-events-none" />
          
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
            <div>
              <h3 className="text-md font-black tracking-tight bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                Developer Support Console
              </h3>
              <p className="text-[10px] text-white/40 tracking-wider font-mono uppercase mt-0.5">Direct Developer Pipeline</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 transition text-white cursor-pointer"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>

          {/* Form Engine */}
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-white/40 mb-2">Select Category</label>
              <div className="grid grid-cols-3 gap-2">
                {["Feedback", "Bug Report", "Get Help"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      if (!message.trim()) setMessage(""); 
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer ${
                      category === cat
                        ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-pink-500/40 text-pink-400 shadow-md"
                        : "bg-white/[0.02] border-white/[0.05] text-white/60 hover:bg-white/[0.05]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-white/40 mb-2">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isUserLoggedIn ? placeholders[category] : "Please log in to submit your support logs..."}
                disabled={submitting || !isUserLoggedIn}
                rows={4}
                className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.05] focus:border-pink-500/40 outline-none p-4 text-xs text-white placeholder-white/30 transition-all resize-none leading-relaxed h-28 focus:bg-white/[0.01]"
                maxLength={1000}
              />
            </div>

            {/* ── 🔥 NEW ULTRA-PREMIUM INTERACTIVE SUBMIT BUTTON BLOCK ── */}
            <button
              type="submit"
              disabled={submitting || !message.trim() || !isUserLoggedIn}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 text-white font-extrabold text-sm tracking-wide transition-all duration-300 transform border border-white/10 shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:from-white/5 disabled:to-transparent disabled:text-white/10 disabled:border-white/5 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <FaSync className="animate-spin text-xs" />
                  <span>TRANSMITTING TICKET...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-xs transition-transform group-hover:translate-x-1" />
                  <span>Transmit Ticket To Developer</span>
                </>
              )}
            </button>
          </form>

        </div>
      )}
    </div>
  );
}