// frontend/src/pages/Profile.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  FaUser, FaEnvelope, FaCamera, FaArrowLeft, FaCalendarAlt,
  FaFilm, FaHeart, FaClock, FaTrophy, FaCheckCircle
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
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs tracking-widest font-mono animate-pulse">LOADING PROFILE MODULE...</p>
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
    <div className="min-h-screen bg-[#030305] text-white relative font-sans antialiased pb-24 overflow-x-hidden selection:bg-red-600 selection:text-white">
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ── BACKGROUND MISC DECORATION ELEMENTS ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Soft Red Vignette Spotlight Glows */}
        <div className="absolute top-0 left-0 w-[50vw] h-[40vh] rounded-full bg-red-950/[0.15] blur-[150px]" />
        <div className="absolute top-[20%] right-0 w-[40vw] h-[40vh] rounded-full bg-red-900/[0.08] blur-[130px]" />
        
        {/* Left Film Reel Decorative Shape */}
        <div className="absolute left-[-5%] top-[25%] opacity-[0.15] mix-blend-screen scale-75 md:scale-100 transition-all duration-500">
          <div className="w-[340px] h-[340px] rounded-full border-[12px] border-dashed border-white/80 flex items-center justify-center animate-[spin_60s_linear_infinite]">
            <div className="w-[260px] h-[260px] rounded-full border-[6px] border-white/60 flex items-center justify-center" />
          </div>
        </div>

        {/* Right Backlit Stage Light Beam Overlay */}
        <div className="absolute right-[5%] top-[15%] opacity-[0.15] mix-blend-screen hidden md:block">
          <div className="w-44 h-44 bg-zinc-800 rounded-2xl border border-white/10 relative flex items-center justify-center">
            <div className="w-32 h-32 bg-amber-100 rounded-full shadow-[0_0_90px_rgba(251,191,36,0.5)]" />
          </div>
        </div>
      </div>

      {/* ── 🛡️ CLEAN CORNER-ONLY HEADER NAVBAR ── */}
      <div className="absolute top-0 left-0 w-full z-50 bg-transparent">
        <div className="w-full px-8 md:px-16 py-8 flex items-center justify-between">
          
          {/* Branded Logo Anchor (Flush Left) */}
          <div onClick={() => navigate("/")} className="flex items-center gap-3 cursor-pointer select-none">
            <span className="text-2xl">🎬</span>
            <h1 className="text-2xl font-black tracking-tight text-white font-sans">
              MovieMind <span className="text-red-600">AI</span>
            </h1>
          </div>

          {/* Action Back Hook Button (Flush Right) */}
          <button 
            onClick={() => navigate(-1)} 
            className="px-5 py-2.5 rounded-xl bg-[#12121a]/80 border border-white/10 hover:bg-white/10 text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <FaArrowLeft className="text-[10px]" /> BACK
          </button>
          
        </div>
      </div>

      {/* ── MAIN DESIGN GRID CONTAINER ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36">
        
        {/* ── CENTRAL AVATAR PROFILE CONTAINER ── */}
        {!isEditing ? (
          <div className="flex flex-col items-center text-center mb-14 animate-fade-in">
            
            {/* Red Glowing Profile Frame Wrapper */}
            <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
              <div className="absolute inset-[-4px] bg-gradient-to-r from-red-600 to-orange-500 rounded-full blur-sm opacity-80" />
              <img
                src={userPhoto}
                alt="user identity snapshot"
                className={`w-36 h-36 rounded-full object-cover border-[4px] border-[#030305] relative z-10 ${updating ? 'animate-pulse' : ''}`}
              />
              <div className="absolute bottom-1 right-1 bg-red-600 border border-white/10 text-white p-2.5 rounded-full z-20 shadow-xl">
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
              className="mt-6 px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase transition-all active:scale-95 shadow-lg shadow-red-900/20 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          /* Inline Mode Input Form Box */
          <div className="max-w-xl mx-auto bg-[#0a0a10]/95 border border-white/10 rounded-3xl p-8 shadow-2xl mb-14 animate-fade-in">
            <h3 className="text-xl font-black mb-1 text-white">Update Core Identity</h3>
            <p className="text-neutral-400 text-xs mb-6">Modify your profile settings</p>

            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-2">Display Name</label>
                <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl focus-within:border-red-500/40 transition-all">
                  <FaUser className="absolute left-4 text-neutral-500 text-xs" />
                  <input
                    type="text"
                    required
                    disabled={updating}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-transparent pl-11 pr-4 py-3 text-white outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-500"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── 📊 HORIZONTAL METRICS MATRIX SCOREBOARD ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
          
          <div className="bg-[#09090f]/90 border border-white/[0.06] p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-lg">
              <FaFilm />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">128</h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Movies Watched</p>
            </div>
          </div>

          <div className="bg-[#09090f]/90 border border-white/[0.06] p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-lg">
              <FaHeart />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">45</h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Favorites</p>
            </div>
          </div>

          <div className="bg-[#09090f]/90 border border-white/[0.06] p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-lg">
              <FaClock />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">312</h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Hours Watched</p>
            </div>
          </div>

          <div className="bg-[#09090f]/90 border border-white/[0.06] p-5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-lg">
              <FaTrophy />
            </div>
            <div>
              <h4 className="text-2xl font-mono font-black text-white">12</h4>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Achievements</p>
            </div>
          </div>

        </div>

        {/* ── 💳 ACCOUNT IDENTIFICATION GRID BLOCK ── */}
        <div className="bg-[#08080d]/90 border border-red-600/30 rounded-[20px] p-8 relative overflow-hidden max-w-4xl mx-auto shadow-xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
          
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2.5 pb-3 border-b border-white/[0.05]">
            <span className="text-red-500">👤</span> Account Identification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            
            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Full Name</p>
              <div className="mt-2 rounded-xl border border-white/[0.05] bg-[#0c0c14]/50 p-4 flex items-center gap-3">
                <FaUser className="text-neutral-500 text-xs" />
                <p className="text-sm font-semibold text-neutral-200">{userName}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">System Joining Point</p>
              <div className="mt-2 rounded-xl border border-white/[0.05] bg-[#0c0c14]/50 p-4 flex items-center gap-3">
                <FaCalendarAlt className="text-neutral-500 text-xs" />
                <p className="text-sm font-semibold text-neutral-200">{joinedDate}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Email Address</p>
              <div className="mt-2 rounded-xl border border-white/[0.05] bg-[#0c0c14]/50 p-4 flex items-center gap-3">
                <FaEnvelope className="text-neutral-500 text-xs" />
                <p className="text-sm font-medium text-neutral-300 font-mono">{userEmail}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Account Status</p>
              <div className="mt-2 rounded-xl border border-white/[0.05] bg-[#0c0c14]/50 p-4 flex items-center gap-3">
                <FaCheckCircle className="text-green-500 text-xs" />
                <span className="px-2.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 📜 PHILOSOPHICAL FOOTER QUOTE ── */}
        <div className="mt-16 text-center opacity-40 select-none">
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