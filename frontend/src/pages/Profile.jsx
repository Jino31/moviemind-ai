import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
    const numberOfParticles = 40;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
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
            let opacity = (1 - distance / maxDistance) * 0.15;
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm tracking-widest animate-pulse">LOADING PROFILE...</p>
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
    <div className="min-h-screen bg-black text-white relative font-sans antialiased overflow-x-hidden selection:bg-pink-500 selection:text-white">
      
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!isEditing && (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-70"
        />
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-red-600/15 blur-[180px] animate-[pulse_8s_infinite_alternate]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-purple-600/15 blur-[180px] animate-[pulse_10s_infinite_alternate]" />
        <div
          className="absolute inset-0 opacity-5 animate-[scrolling-grid_60s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <style>{`
        @keyframes scrolling-grid {
          0% { background-position: 0px 0px; }
          100% { background-position: 0px 1000px; }
        }
      `}</style>

      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 onClick={() => navigate("/")} className="text-3xl md:text-5xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent tracking-tight cursor-pointer">
              MovieMind AI
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              AI Powered Movie Discovery Platform
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-44 pb-24">
        
        {!isEditing ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
              <div className="absolute inset-[-6px] bg-gradient-to-tr from-red-500 via-pink-500 to-purple-600 rounded-full blur-sm opacity-50 group-hover:opacity-90 transition-all duration-300" />
              <img
                src={userPhoto}
                alt="profile"
                className={`w-44 h-44 rounded-full object-cover border-4 border-pink-500 shadow-[0_0_40px_rgba(255,0,100,0.3)] relative z-10 ${updating ? 'animate-pulse' : ''}`}
              />
              <div className="absolute bottom-2 right-2 bg-pink-500 hover:bg-pink-600 border border-white/20 text-white p-3 rounded-full z-20 shadow-xl transition-all transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <h1 className="mt-8 text-5xl md:text-7xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent tracking-tight">
              {userName}
            </h1>

            <p className="text-lg md:text-2xl text-gray-400 mt-4 font-medium tracking-wide">
              {userEmail}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-8 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold tracking-wide hover:opacity-95 transform active:scale-95 transition-all flex items-center gap-2"
            >
              ✏️ Edit Profile
            </button>
          </div>
        ) : (
          /* Profile Edit Mode Form View */
          <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Update Identity
            </h2>
            <p className="text-gray-400 text-sm mb-8">Modify your display configurations below</p>

            <form onSubmit={handleSaveChanges} className="space-y-6">
              
              <div className="flex flex-col items-center mb-4">
                <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                  <img 
                    src={editPhoto || userPhoto} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-pink-500/60 group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                    <span className="text-[11px] font-bold tracking-wider text-white">UPLOAD</span>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-2">Click image avatar preview to change picture file</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  disabled={updating}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-black/60 rounded-2xl px-5 py-4 text-white outline-none border border-white/10 focus:border-pink-500/50 transition-colors disabled:opacity-50"
                  placeholder="Enter custom handle"
                />
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
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Details */}
        <div className="mt-16 space-y-8 max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>👤</span> Account Identification
            </h2>

            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</p>
                <p className="text-xl font-semibold mt-1 text-white/90">{userName}</p>
              </div>

              <div className="border-b border-white/5 pb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</p>
                <p className="text-xl font-semibold mt-1 text-white/90">{userEmail}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Joining Point</p>
                <p className="text-xl font-semibold mt-1 text-white/90">{joinedDate}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}