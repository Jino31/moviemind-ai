// frontend/src/pages/Profile.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  FaUser, FaEnvelope, FaCamera, FaArrowLeft, FaCalendarAlt,
  FaFilm, FaHeart, FaClock, FaTrophy, FaCheckCircle,
  FaThLarge, FaStar, FaList, FaLaptopCode, FaUsers
} from "react-icons/fa";

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setEditName(data.name || currentUser.displayName || "");
          setEditPhoto(data.photoURL || currentUser.photoURL || "");
        }
      } catch (error) {
        console.error("Firestore loading error:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1500000) {
      alert("Image is too large. Please pick an image smaller than 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setEditPhoto(base64String);

      if (!isEditing) {
        try {
          setUpdating(true);
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, { photoURL: base64String });
          setUserData((prev) => ({ ...prev, photoURL: base64String }));
        } catch (err) {
          console.error("Failed to upload file snapshot:", err);
        } finally {
          setUpdating(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    if (!updating) fileInputRef.current.click();
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setUpdating(true);
      const userDocRef = doc(db, "users", user.uid);
      
      await updateDoc(userDocRef, {
        name: editName.trim(),
        photoURL: editPhoto.trim(),
      });

      setUserData((prev) => ({
        ...prev,
        name: editName.trim(),
        photoURL: editPhoto.trim(),
      }));
      
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040408] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs tracking-widest font-mono animate-pulse">LOADING CINEMA PROFILE MODULE...</p>
      </div>
    );
  }

  const userName = userData?.name || user?.displayName || "Movie Lover";
  const userPhoto = userData?.photoURL || user?.photoURL || "https://ui-avatars.com/api/?name=User";
  const userEmail = userData?.email || user?.email || "No Email";
  const joinedDate = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' }) 
    : "12 June 2026";

  return (
    <div className="min-h-screen bg-[#030306] text-white relative font-sans antialiased pb-24 overflow-x-hidden selection:bg-red-500 selection:text-white">
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ── BACKGROUND THEATER CINEMA MISC LAYER OVERLAYS ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        
        {/* Curtains Vignette Red Glow Ambient Blurs */}
        <div className="absolute top-[-5%] left-[-10%] w-[60vw] h-[50vh] rounded-full bg-red-900/[0.12] blur-[150px]" />
        <div className="absolute top-[20%] right-[-5%] w-[45vw] h-[45vh] rounded-full bg-orange-900/[0.08] blur-[130px]" />
        
        {/* Left Side: Film Reel Vector Element Mockup */}
        <div className="absolute left-[-4%] top-[24%] opacity-[0.14] mix-blend-screen scale-75 md:scale-100 origin-top-left transition-all duration-700">
          <div className="w-[320px] h-[320px] rounded-full border-[14px] border-dashed border-white flex items-center justify-center animate-[spin_50s_linear_infinite]">
            <div className="w-[240px] h-[240px] rounded-full border-[8px] border-white flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white" />
            </div>
          </div>
          <div className="w-44 h-96 border-l-4 border-dashed border-white/40 absolute top-72 left-32 rotate-12" />
        </div>

        {/* Right Side: Backlit Stage Spotlight Graphic Element */}
        <div className="absolute right-0 top-[12%] w-[500px] h-[450px] bg-gradient-to-bl from-amber-400/[0.08] to-transparent opacity-60 blur-2xl pointer-events-none rotate-12 transform origin-top-right" />
        <div className="absolute right-[4%] top-[16%] opacity-[0.12] mix-blend-screen scale-75 md:scale-100 origin-top-right hidden md:block">
          <div className="w-40 h-40 bg-zinc-700 rounded-lg relative flex items-center justify-center border border-white/20">
            <div className="w-28 h-28 bg-amber-200 rounded-full shadow-[0_0_80px_rgba(251,191,36,0.6)]" />
          </div>
          <div className="w-1 h-64 bg-zinc-800 mx-auto transform translate-y-2 rotate-6" />
        </div>
      </div>

      {/* ── 🛡️ CINEMATIC TOP NAVBAR ROUTING HEADER ── */}
      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-[#07070c]/70 border-b border-white/[0.04]">
        <div className="w-full px-6 md:px-14 py-4 flex items-center justify-between">
          
          {/* Branded Logo Anchor Pinned Corner Left */}
          <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer group select-none">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🎬</span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              MovieMind <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">AI</span>
            </h1>
          </div>

          {/* 🧭 Reference Image Synchronized Navigation Links Deck */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-mono tracking-wider text-neutral-400">
            <button onClick={() => navigate("/performance")} className="flex items-center gap-2 px-3 py-1.5 text-white border-b-2 border-red-500 font-bold transition-all">
              <FaThLarge className="text-[11px] text-red-500" /> DASHBOARD
            </button>
            <button onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-1.5 hover:text-white transition-all">
              <FaStar className="text-[11px]" /> RECOMMENDATIONS
            </button>
            <button onClick={() => navigate("/watchlist")} className="flex items-center gap-2 px-3 py-1.5 hover:text-white transition-all">
              <FaList className="text-[11px]" /> WATCHLIST
            </button>
            <button onClick={() => navigate("/studio")} className="flex items-center gap-2 px-3 py-1.5 hover:text-white transition-all">
              <FaLaptopCode className="text-[11px]" /> AI STUDIO
            </button>
            <button onClick={() => navigate("/community")} className="flex items-center gap-2 px-3 py-1.5 hover:text-white transition-all">
              <FaUsers className="text-[11px]" /> COMMUNITY
            </button>
          </div>

          {/* Action Back Button Pinned Corner Right */}
          <button 
            onClick={() => navigate(-1)} 
            className="px-5 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 text-xs font-bold font-mono tracking-wide flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <FaArrowLeft className="text-[9px]" /> BACK
          </button>
          
        </div>
      </div>

      {/* ── MAIN WORKSPACE PLATFORM BODY CONTAINER ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36">
        
        {/* ── PROFILE IDENTIFICATION HUB SECTION ── */}
        {!isEditing ? (
          <div className="flex flex-col items-center text-center mb-12 animate-fade-in">
            
            {/* Custom Orb Circular Border Photo Layout */}
            <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
              <div className="absolute inset-[-5px] bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-sm opacity-70 group-hover:opacity-100 group-hover:scale-102 transition-all duration-300" />
              <img
                src={userPhoto}
                alt="profile snapshot core"
                className={`w-36 h-36 rounded-full object-cover border-[4px] border-[#030306] relative z-10 ${updating ? 'animate-pulse' : ''}`}
              />
              <div className="absolute bottom-1 right-1 bg-red-600 border border-white/10 text-white p-2.5 rounded-full z-20 shadow-xl transition-all transform group-hover:scale-105 active:scale-95">
                <FaCamera className="text-xs" />
              </div>
            </div>

            <h2 className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-white">
              {userName}
            </h2>

            <p className="text-sm text-neutral-400 font-mono mt-1 tracking-wide">
              {userEmail}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 active:scale-95 flex items-center gap-2 shadow-lg shadow-red-900/20 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          /* Inline Editing State Module View */
          <div className="max-w-xl mx-auto bg-[#09090f]/90 border border-white/[0.06] rounded-3xl p-8 backdrop-blur-2xl shadow-2xl mb-12 animate-fade-in">
            <h3 className="text-xl font-black mb-1 text-white">Update Core Identity</h3>
            <p className="text-neutral-400 text-xs mb-6">Modify your live application profile tracking logs.</p>

            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div className="flex flex-col items-center mb-2">
                <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                  <img 
                    src={editPhoto || userPhoto} 
                    alt="Preview matrix placeholder" 
                    className="w-20 h-20 rounded-full object-cover border border-white/10 relative z-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono tracking-widest text-white">REPLACE</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-2">Handle Name</label>
                <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl focus-within:border-red-500/40 transition-all">
                  <FaUser className="absolute left-4 text-neutral-500 text-xs" />
                  <input
                    type="text"
                    required
                    disabled={updating}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-transparent pl-11 pr-4 py-3 text-white outline-none text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(userName);
                    setEditPhoto(userPhoto);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editName.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  {updating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── 📊 METRICS STATISTICS SCOREBOARD COUNTER PANEL ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          <div className="bg-[#09090f]/60 border border-white/[0.04] p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-lg shadow-inner">
              <FaFilm />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">128</h4>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Movies Watched</p>
            </div>
          </div>

          <div className="bg-[#09090f]/60 border border-white/[0.04] p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-lg shadow-inner">
              <FaHeart />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">45</h4>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Favorites</p>
            </div>
          </div>

          <div className="bg-[#09090f]/60 border border-white/[0.04] p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-lg shadow-inner">
              <FaClock />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">312</h4>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Hours Watched</p>
            </div>
          </div>

          <div className="bg-[#09090f]/60 border border-white/[0.04] p-5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 text-lg shadow-inner">
              <FaTrophy />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">12</h4>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Achievements</p>
            </div>
          </div>

        </div>

        {/* ── 💳 DUAL-COLUMN ACCOUNT IDENTIFICATION CARD ── */}
        <div className="bg-[#08080d]/80 border border-white/[0.05] rounded-[24px] p-8 shadow-xl relative overflow-hidden group hover:border-red-500/20 transition-all duration-500 max-w-4xl mx-auto">
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-500/[0.02] to-transparent blur-xl pointer-events-none rounded-bl-full" />
          
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5 border-b border-white/[0.04] pb-3.5">
            <span className="text-red-500 text-base">👤</span> Account Identification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            
            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Full Name</p>
              <div className="mt-2 rounded-xl border border-white/[0.04] bg-black/30 p-3.5 flex items-center gap-3.5 group-hover:border-white/[0.08] transition-colors">
                <FaUser className="text-neutral-500 text-xs" />
                <p className="text-sm font-semibold text-neutral-200">{userName}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">System Joining Point</p>
              <div className="mt-2 rounded-xl border border-white/[0.04] bg-black/30 p-3.5 flex items-center gap-3.5 group-hover:border-white/[0.08] transition-colors">
                <FaCalendarAlt className="text-neutral-500 text-xs" />
                <p className="text-sm font-semibold text-neutral-200">{joinedDate}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Email Address</p>
              <div className="mt-2 rounded-xl border border-white/[0.04] bg-black/30 p-3.5 flex items-center gap-3.5 group-hover:border-white/[0.08] transition-colors">
                <FaEnvelope className="text-neutral-500 text-xs" />
                <p className="text-sm font-medium text-neutral-300 font-mono">{userEmail}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Account Status</p>
              <div className="mt-2 rounded-xl border border-white/[0.04] bg-black/30 p-3.5 flex items-center gap-3.5 group-hover:border-white/[0.08] transition-colors">
                <FaCheckCircle className="text-green-500 text-xs" />
                <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  Active
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 📜 PHILOSOPHICAL QUOTE INTERACTIVE FOOTER TAIL ── */}
        <div className="mt-14 text-center select-none font-sans opacity-40 hover:opacity-60 transition-opacity duration-300">
          <p className="text-xs italic text-neutral-400 max-w-md mx-auto leading-relaxed">
            "Cinema is a mirror by which we often see ourselves."
          </p>
          <span className="block text-[10px] font-mono font-bold text-neutral-500 mt-1.5 tracking-widest uppercase">
            — Alejandro González Iñárritu
          </span>
        </div>

      </div>
    </div>
  );
}