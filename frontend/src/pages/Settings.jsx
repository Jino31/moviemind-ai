// frontend/src/pages/Settings.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, deleteUser } from "firebase/auth";
import { 
  FaShieldAlt, FaBell, FaGlobe, FaEye, FaBrain, 
  FaTrashAlt, FaArrowLeft, FaCheckCircle, FaSpinner, FaTimes
} from "react-icons/fa";

export default function Settings() {
  const navigate = useNavigate();
  
  // 💾 STATE HOOK MANAGEMENT MATRIX
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Preference States
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [aiQuality, setAiQuality] = useState(true);

  // Floating Notification Banner Alert State (Custom Toast)
  const [toast, setToast] = useState({ show: false, message: "" });

  // Monitor Authentication Session Stream State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // If your database profile stores user preferences, you could fetch and set states here
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔊 Helper function to trigger elegant custom feedback toast alerts
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3500);
  };

  // ⚙️ TOGGLE EVENT HANDLER INTERFACES
  const toggleNotifications = async () => {
    const nextState = !notifications;
    setNotifications(nextState);
    showToast(`🔔 Notifications successfully ${nextState ? "Enabled" : "Muted"}.`);
  };

  const toggleDarkMode = () => {
    const nextState = !darkMode;
    setDarkMode(nextState);
    showToast(`✨ System Appearance switched to ${nextState ? "Dark Mode Aura" : "Light Studio Mode"}.`);
  };

  const toggleAiQuality = () => {
    const nextState = !aiQuality;
    setAiQuality(nextState);
    showToast(`🧠 Deep Neural recommendations are now ${nextState ? "Hyper-Personalized" : "Standardized"}.`);
  };

  const handleLanguageChange = () => {
    const nextLang = language === "English" ? "Tamil" : "English";
    setLanguage(nextLang);
    showToast(`🌐 Primary App dialect updated to [ ${nextLang} ].`);
  };

  const handleManageSecurity = () => {
    if (!currentUser) {
      showToast("🔒 Security block: Please authenticate your session first.");
      return;
    }
    navigate("/profile"); // Routes user to manage their baseline security vectors
  };

  // ⚠️ ACCELERATED CRITICAL TRASH PIPELINE BLOCK (Danger Zone Action)
  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    const firstConfirmation = window.confirm("⚠️ DANGER ACCELERATION BARRIER:\nAre you absolutely sure you want to completely wipe out your MovieMind AI Profile?");
    if (!firstConfirmation) return;

    const finalChallenge = window.prompt("🔒 SECURITY DESTRUCTION CODE:\nType your account email address exactly to authorize permanent system deletion:");
    if (finalChallenge !== currentUser.email) {
      alert("❌ Authentication Token Mismatch: Verification failed. Aborting destruction sequence.");
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Evaporate the core document metrics from Cloud Firestore root collections
      const userDocRef = doc(db, "users", currentUser.uid);
      await deleteDoc(userDocRef);

      // 2. Erase the account authentication identity node completely from Google server registries
      await deleteUser(currentUser);
      
      alert("💥 Account Purged: Your profile telemetry has been successfully scrubbed from our systems.");
      navigate("/login");
    } catch (err) {
      console.error("Scrub protocol crash logs:", err);
      alert("🔒 Security Challenge Timeout: Recent login validation required. Please log out, sign back in, and try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex items-center justify-center text-white font-mono">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-4xl text-pink-500" />
          <p className="text-xs text-white/40 tracking-widest uppercase">Syncing Global Configurations Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04040a] text-white relative overflow-x-hidden font-sans antialiased pb-20">
      
      {/* ── CINEMATIC DYNAMIC BACKDROP FLOATING AURAS ── */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-red-600/[0.08] rounded-full blur-[160px] animate-pulse duration-[8s]" />
        <div className="absolute bottom-10 right-10 w-[700px] h-[700px] bg-purple-600/[0.08] rounded-full blur-[180px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* ── TRANSIENT PREFERENCE TOAST NOTIFICATION FLOATER ── */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl animate-fade-in">
          <FaCheckCircle className="text-pink-500 text-sm animate-bounce" />
          <span className="text-xs font-semibold tracking-wide text-white/90">{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 pt-16">
        
        {/* ── HEADER NAVIGATION CHASSIS ── */}
        <div className="flex items-end justify-between mb-16 pb-6 border-b border-white/[0.06]">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
              Settings
            </h1>
            <p className="text-white/40 mt-2.5 text-sm font-medium tracking-wide">
              Calibrate and protect your MovieMind streaming metrics workspace.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
          >
            <FaArrowLeft className="text-[10px]" /> Back Home
          </button>
        </div>

        {/* ── CORE SETTINGS SECTIONS GRID GRID ── */}
        <div className="space-y-6">
          
          {/* 1. Security & Notifications Control Deck Row */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Security Interface */}
            <div className="group bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-6 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-xl group-hover:bg-pink-500/10 group-hover:text-pink-400 transition-colors">
                  <FaShieldAlt />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold tracking-tight">Security Credentials</h2>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    Audit active logging parameters, sessions, and connected identity nodes.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleManageSecurity}
                className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 font-bold text-xs tracking-wide transition-all cursor-pointer text-center"
              >
                Manage Security Profile
              </button>
            </div>

            {/* Notifications Toggle Interface */}
            <div className="group bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-6 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-xl group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                  <FaBell />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold tracking-tight">System Push Notifications</h2>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    Toggle active pings regarding fresh releases, system data drops, and trending trailers.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between p-1 rounded-xl bg-black/40 border border-white/[0.04]">
                <span className="text-xs font-mono text-white/50 pl-3">CURRENT CONFIG: {notifications ? "LIVE" : "MUTED"}</span>
                <button 
                  type="button"
                  onClick={toggleNotifications}
                  className={`px-5 py-2 rounded-lg font-extrabold text-xs tracking-wide transition-all duration-300 cursor-pointer ${
                    notifications 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" 
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {notifications ? "Active Alerts" : "Mute Alerts"}
                </button>
              </div>
            </div>

          </div>

          {/* 2. Global Profile Preferences Immersive Block */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-[36px] p-8 backdrop-blur-xl relative overflow-hidden">
            <h2 className="text-xl font-black uppercase tracking-widest text-white/30 font-mono mb-6">System Preferences</h2>
            
            <div className="divide-y divide-white/[0.05] space-y-6">
              
              {/* Language Parameter */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-sm text-pink-400">
                    <FaGlobe />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Application Interface Dialect</h3>
                    <p className="text-xs text-white/40 mt-0.5">Adjust the global localization string files structure.</p>
                  </div>
                </div>
                <button 
                  onClick={handleLanguageChange}
                  className="px-4 py-2 text-xs font-extrabold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer font-mono"
                >
                  {language}
                </button>
              </div>

              {/* Appearance Parameter */}
              <div className="flex justify-between items-center pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-sm text-purple-400">
                    <FaEye />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Display Layout Style</h3>
                    <p className="text-xs text-white/40 mt-0.5">Toggle immersive workspace color themes and deep lighting contrast profiles.</p>
                  </div>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-300 border cursor-pointer font-mono ${
                    darkMode 
                      ? "border-pink-500/20 bg-pink-500/5 text-pink-400" 
                      : "border-white/10 bg-white/5 text-white/60"
                  }`}
                >
                  {darkMode ? "Dark Core" : "Light Aura"}
                </button>
              </div>

              {/* Recommendation Processing Pipeline Option */}
              <div className="flex justify-between items-center pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-sm text-fuchsia-400">
                    <FaBrain />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">AI Recommendation Quality</h3>
                    <p className="text-xs text-white/40 mt-0.5">Unlock customized, hyper-focused algorithm filters matching profile history trends.</p>
                  </div>
                </div>
                <button 
                  onClick={toggleAiQuality}
                  className={`px-5 py-2 text-xs font-black rounded-xl tracking-wide uppercase transition-all duration-300 cursor-pointer border ${
                    aiQuality 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg border-transparent" 
                      : "bg-white/5 border-white/10 text-white/30"
                  }`}
                >
                  {aiQuality ? "Deep AI Active" : "Standard"}
                </button>
              </div>

            </div>
          </div>

          {/* 3. The Danger Zone Destructive Segment Block */}
          <div className="border border-red-500/20 bg-gradient-to-b from-red-500/[0.02] to-transparent rounded-[36px] p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.01] blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-red-400 tracking-tight flex items-center gap-2">
                  <span>Danger Zone Boundary Node</span>
                </h2>
                <p className="text-xs text-white/40 leading-relaxed max-w-xl">
                  Permanently wipe your MovieMind profile registry, telemetry, tracking metrics, and historical logs. This action is terminal and cannot be reversed by system technicians.
                </p>
              </div>
              
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting || !currentUser}
                className="px-6 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-lg shadow-red-900/20 active:scale-98 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {isDeleting ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" />
                    <span>Purging Account...</span>
                  </>
                ) : (
                  <>
                    <FaTrashAlt className="text-xs" />
                    <span>Scrub Account From Cloud</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}