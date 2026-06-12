// src/pages/Profile.jsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaUser, FaEnvelope, FaCamera, FaArrowLeft, FaCalendarAlt } from "react-icons/fa";

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

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

  // Premium Background Particle Animation Effect
  useEffect(() => {
    if (loading || isEditing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particlesArray = [];
    const numberOfParticles = 45;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.35;
        this.speedY = (Math.random() - 0.5) * 0.35;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 72, 153, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }

    const connectParticles = () => {
      let maxDistance = 180;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let dx = particlesArray[a].x - particlesArray[b].x;
          let dy = particlesArray[a].y - particlesArray[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            let opacity = (1 - distance / maxDistance) * 0.18;
            ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      connectParticles();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, isEditing]);

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
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-xs tracking-widest font-mono animate-pulse">LOADING PROFILE MODULE...</p>
      </div>
    );
  }

  const userName = userData?.name || user?.displayName || "Movie Lover";
  const userPhoto = userData?.photoURL || user?.photoURL || "https://ui-avatars.com/api/?name=User";
  const userEmail = userData?.email || user?.email || "No Email";
  const joinedDate = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' }) 
    : "Recently Joined";

  return (
    <div className="min-h-screen bg-[#040408] text-white relative font-sans antialiased overflow-x-hidden selection:bg-pink-500 selection:text-white">
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Cinematic Starfield Canvas Layout */}
      {!isEditing && (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-60"
        />
      )}

      {/* Immersive Deep Corner Ambient Light Bleed Glow Engine */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-red-600/[0.07] blur-[140px] animate-[pulse_8s_infinite_alternate]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-600/[0.08] blur-[140px] animate-[pulse_10s_infinite_alternate]" />
        <div
          className="absolute inset-0 opacity-[0.03] animate-[scrolling-grid_80s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "65px 65px",
          }}
        />
      </div>

      <style>{`
        @keyframes scrolling-grid {
          0% { background-position: 0px 0px; }
          100% { background-position: 0px 1000px; }
        }
      `}</style>

      {/* Fixed Immersive Translucent Top Bar Layout Header */}
      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-14">
            <h1 onClick={() => navigate("/")} className="text-4xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent tracking-tight cursor-pointer hover:opacity-80 transition-all">
              MovieMind AI
            </h1>
            <div className="hidden md:flex items-center gap-10 text-lg font-semibold text-gray-400">
              <button onClick={() => navigate("/")} className="hover:text-white transition-all">Home</button>
              <button onClick={() => navigate("/movies")} className="hover:text-white transition-all">Movies</button>
              <button onClick={() => navigate("/performance")} className="hover:text-white transition-all">Dashboard</button>
            </div>
          </div>

          <button 
            onClick={() => navigate("/")} 
            className="px-6 py-3.5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all text-sm font-semibold flex items-center gap-2"
          >
            <FaArrowLeft className="text-xs" /> Back
          </button>
        </div>
      </div>

      {/* Profiles Workspace Sub-Layout */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-44 pb-24">
        
        {!isEditing ? (
          <div className="flex flex-col items-center text-center">
            {/* Immersive Profile Orb Frame */}
            <div className="relative group cursor-pointer mb-2" onClick={triggerFileSelect}>
              <div className="absolute inset-[-6px] bg-gradient-to-tr from-red-500 via-pink-500 to-purple-600 rounded-full blur-md opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <img
                src={userPhoto}
                alt="profile"
                className={`w-44 h-44 rounded-full object-cover border-[4px] border-black relative z-10 ${updating ? 'animate-pulse' : ''}`}
              />
              <div className="absolute bottom-2 right-2 bg-pink-500 border border-white/10 text-white p-3 rounded-full z-20 shadow-2xl transition-all transform hover:scale-110">
                <FaCamera className="text-sm" />
              </div>
            </div>

            <h1 className="mt-8 text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
              {userName}
            </h1>

            <p className="text-md md:text-lg text-gray-400 font-mono font-medium tracking-wide mt-2">
              {userEmail}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-8 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(236,72,153,0.2)] hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>✏️</span> Edit Profile
            </button>
          </div>
        ) : (
          /* Profile Edit Mode Form View */
          <div className="max-w-xl mx-auto bg-[#0d0d16]/80 border border-white/10 rounded-[36px] p-8 backdrop-blur-2xl shadow-2xl animate-fade-in">
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Update Identity
            </h2>
            <p className="text-gray-400 text-xs mb-8 font-medium">Modify your application profile variables</p>

            <form onSubmit={handleSaveChanges} className="space-y-6">
              
              <div className="flex flex-col items-center mb-4">
                <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                  <div className="absolute inset-[-4px] bg-gradient-to-r from-pink-500 to-red-500 rounded-full blur opacity-40 group-hover:opacity-80 transition-opacity" />
                  <img 
                    src={editPhoto || userPhoto} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-black relative z-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full z-20 transition-opacity">
                    <span className="text-[10px] font-black tracking-widest text-white">CHANGE</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-3 font-medium">Click avatar snapshot disk to replace file resource</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Display Name</label>
                <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl focus-within:border-pink-500/50 transition-all">
                  <FaUser className="absolute left-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    disabled={updating}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-transparent pl-14 pr-5 py-4 text-white outline-none text-sm font-medium disabled:opacity-50"
                    placeholder="Enter custom handle"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(userName);
                    setEditPhoto(userPhoto);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !editName.trim()}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dynamic Account Credentials Content Grid */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-[#0b0b14]/50 border border-white/[0.06] rounded-[32px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-pink-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-pink-500/[0.03] to-transparent blur-xl rounded-bl-full pointer-events-none" />
            
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm flex items-center justify-center text-pink-400">👤</span>
              <span>Account Identification</span>
            </h2>

            <div className="space-y-6">
              <div className="relative">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Full Name</p>
                <div className="mt-2.5 rounded-xl border border-white/5 bg-black/20 p-4 flex items-center gap-4 group-hover:border-white/10 transition-colors">
                  <FaUser className="text-gray-500 text-sm" />
                  <p className="text-sm font-semibold text-white/90">{userName}</p>
                </div>
              </div>

              <div className="relative">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Email Address</p>
                <div className="mt-2.5 rounded-xl border border-white/5 bg-black/20 p-4 flex items-center gap-4 group-hover:border-white/10 transition-colors">
                  <FaEnvelope className="text-gray-500 text-sm" />
                  <p className="text-sm font-medium font-mono text-white/90">{userEmail}</p>
                </div>
              </div>

              <div className="relative">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">System Joining Point</p>
                <div className="mt-2.5 rounded-xl border border-white/5 bg-black/20 p-4 flex items-center gap-4 group-hover:border-white/10 transition-colors">
                  <FaCalendarAlt className="text-gray-500 text-sm" />
                  <p className="text-sm font-semibold text-white/90">{joinedDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}