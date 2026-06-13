// frontend/src/pages/Performance.jsx

import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaEnvelope, FaCamera, FaArrowLeft, FaCalendarAlt,
  FaFilm, FaHeart, FaClock, FaTrophy, FaCheckCircle
} from "react-icons/fa";

export default function Performance() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const radarCanvasRef = useRef(null);
  
  const sparklineRef1 = useRef(null);
  const sparklineRef2 = useRef(null);
  const sparklineRef3 = useRef(null);
  const sparklineRef4 = useRef(null);

  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    watchlistCount: 0,
    watchedCount: 0,
    watchHours: 0,
    aiMatch: 70, 
    completionRate: 0
  });

  const [genres, setGenres] = useState({
    genre_scifi: 0,
    genre_action: 0,
    genre_thriller: 0,
    genre_comedy: 0,
    genre_drama: 0,
    genre_adventure: 0
  });

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          
          const watchlist = Number(data.watchlistCount) || 0;
          const watched = Number(data.watchedCount) || 0;
          const totalCreated = watchlist + watched;
          const computedCompletion = totalCreated > 0 ? Math.round((watched / totalCreated) * 100) : 0;

          setStats({
            watchlistCount: watchlist,
            watchedCount: watched,
            watchHours: Number(data.watchHours) || 0,
            aiMatch: Number(data.aiMatch) || 70, 
            completionRate: computedCompletion
          });

          setGenres({
            genre_scifi: Number(data.genre_scifi) || 0,
            genre_action: Number(data.genre_action) || 0,
            genre_thriller: Number(data.genre_thriller) || 0,
            genre_comedy: Number(data.genre_comedy) || 0,
            genre_drama: Number(data.genre_drama) || 0,
            genre_adventure: Number(data.genre_adventure) || 0
          });

          if (data.sessionLogs && Array.isArray(data.sessionLogs)) {
            setLogs(data.sessionLogs.slice(-4).reverse()); 
          } else {
            setLogs([
              { text: "Realtime tracking node active. Explore titles to log streams.", timestamp: "Live", type: "SYNC" }
            ]);
          }
        }
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
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
    for (let i = 0; i < 25; i++) {
      particlesArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.12,
        speedY: (Math.random() - 0.5) * 0.12,
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((p) => {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x > canvas.width) p.x = 0; else if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0; else if (p.y < 0) p.y = canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244, 63, 94, ${p.opacity})`; ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading]);

  useEffect(() => {
    if (!radarCanvasRef.current) return;
    const canvas = radarCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 5;
    const maxRadius = 55;
    const totalSides = 6;
    
    [25, 50, 100].forEach((lvl) => {
      ctx.beginPath();
      const r = (lvl / 100) * maxRadius;
      for (let i = 0; i < totalSides; i++) {
        const angle = (i * 2 * Math.PI) / totalSides - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); 
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; 
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const valuesArray = [
      genres.genre_scifi, 
      genres.genre_drama, 
      genres.genre_adventure, 
      genres.genre_comedy, 
      genres.genre_thriller, 
      genres.genre_action
    ];
    
    const maxGenreValue = Math.max(...valuesArray, 0);

    ctx.beginPath();
    valuesArray.forEach((val, i) => {
      const angle = (i * 2 * Math.PI) / totalSides - Math.PI / 2;
      const scaleFactor = maxGenreValue > 0 ? (val / maxGenreValue) * 0.70 + 0.30 : 0.30;
      const r = scaleFactor * maxRadius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(244, 63, 94, 0.22)"; 
    ctx.fill();
    ctx.strokeStyle = "#f43f5e"; 
    ctx.lineWidth = 2; 
    ctx.stroke();
  }, [genres, loading]);

  const drawSparkline = (canvas, dataPoints, strokeColor) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = strokeColor;
    const step = canvas.width / (dataPoints.length - 1);
    dataPoints.forEach((p, i) => {
      const x = i * step;
      const y = canvas.height - (p / 100) * canvas.height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  useEffect(() => {
    if (loading) return;
    drawSparkline(sparklineRef1.current, [15, 30, stats.watchlistCount * 12, stats.watchlistCount ? 80 : 15], "#ff2a5f");
    drawSparkline(sparklineRef2.current, [10, 25, stats.watchedCount * 15, stats.watchedCount ? 85 : 10], "#b55fe6");
    drawSparkline(sparklineRef3.current, [5, 20, stats.watchHours * 10, stats.watchHours ? 75 : 5], "#2f82ff");
    drawSparkline(sparklineRef4.current, [20, 40, 55, stats.completionRate || 20], "#ff4399");
  }, [loading, stats]);

  if (loading) {
    return (
      <div className="h-screen bg-[#030307] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 text-xs tracking-widest font-mono">STREAMING LIVE METRICS NODE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040408] text-white relative font-sans antialiased overflow-y-auto flex flex-col p-6 md:p-8 select-none space-y-6">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 mix-blend-screen" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-rose-600/[0.08] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-600/[0.1] blur-[160px]" />
      </div>

      {/* ── 🛡️ HEADER SECTION ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.05] pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            Performance <span className="bg-gradient-to-r from-white via-neutral-200 to-rose-500 bg-clip-text text-transparent">Insights</span>
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">Live visualization tracking updates from your watchlist and bot conversations.</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold font-mono text-neutral-200 hover:bg-white/[0.08] cursor-pointer active:scale-95 transition shadow-lg">
          ← Back to App
        </button>
      </div>

      {/* ── 👤 HERO PANEL WITH CENTRAL MATCH CIRCLE ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#0d0d17]/80 border border-white/[0.06] rounded-[24px] p-8 shadow-2xl backdrop-blur-xl">
        
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-sm font-semibold text-neutral-200">Welcome back, Explorer</span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-md">Live Stream</span>
          </div>
          <p className="text-xs text-neutral-400">Your entertainment DNA matches</p>
          <p className="text-3xl font-black tracking-tight mt-1">
            <span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">{stats.aiMatch}% with MovieMind</span>
          </p>
        </div>

        {/* Precise Concentric Dynamic Alignment Core */}
        <div className="flex justify-center items-center relative py-2">
          <div className="w-36 h-36 rounded-full border-4 border-dashed border-white/[0.03] flex items-center justify-center animate-[spin_100s_linear_infinite]" />
          <div className="absolute w-32 h-32 rounded-full border-[5px] border-rose-500 border-r-transparent border-b-transparent flex flex-col items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.2)] transform -rotate-45">
            <div className="transform rotate-45 text-center">
              <p className="text-3xl font-black tracking-tight text-white">{stats.aiMatch}%</p>
              <p className="text-[8px] uppercase tracking-widest font-black text-neutral-400 mt-0.5">AI MATCH</p>
            </div>
          </div>
        </div>

        {/* Removed the middle list navigation routing stack map to clean workspace links */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-3.5 text-xs bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
            <span className="p-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm">👁️</span>
            <div>
              <h4 className="font-bold text-neutral-200">Dynamic Preference Engine</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">Changes shapes on taste radar instantly based on watched movies.</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-xs bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
            <span className="p-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm">🎯</span>
            <div>
              <h4 className="font-bold text-neutral-200">Live Sync Active</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">Linked natively using open Firestore Snapshot pipelines.</p>
            </div>
          </div>
        </div>

      </div>

      {/* ── 📊 SPARKLINE ANALYTICS SUMMARY GRID ROW ── */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Watchlist", val: stats.watchlistCount, ref: sparklineRef1 },
          { label: "Watched History", val: stats.watchedCount, ref: sparklineRef2 },
          { label: "Watch Time", val: `${stats.watchHours}h`, ref: sparklineRef3 },
          { label: "Completion Rate", val: `${stats.completionRate}%`, ref: sparklineRef4 }
        ].map((m, idx) => (
          <div key={idx} className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-2xl font-black tracking-tight text-neutral-100">{m.val}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-0.5">{m.label}</p>
            </div>
            <canvas ref={m.ref} width={75} height={30} className="opacity-90" />
          </div>
        ))}
      </div>

      {/* ── 🎛️ SYSTEM CONTEXT PARAMETERS ROW ── */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Panel A: Radar Grid */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md min-h-[220px]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>🕸️</span> Taste Radar
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Changes shape dynamically</p>
          </div>
          
          <div className="flex justify-center items-center my-auto relative w-full h-[140px]">
            <canvas ref={radarCanvasRef} width={130} height={130} className="object-contain z-10" />
            <span className="absolute top-0 text-[9px] font-mono font-bold text-neutral-400">Sci-Fi ({genres.genre_scifi})</span>
            <span className="absolute bottom-0 text-[9px] font-mono font-bold text-neutral-400 text-center">Comedy ({genres.genre_comedy})</span>
            <span className="absolute left-0 top-1/3 text-[9px] font-mono font-bold text-neutral-400">Action ({genres.genre_action})</span>
            <span className="absolute left-0 bottom-1/3 text-[9px] font-mono font-bold text-neutral-400">Thriller ({genres.genre_thriller})</span>
            <span className="absolute right-0 top-1/3 text-[9px] font-mono font-bold text-neutral-400 text-right">Drama ({genres.genre_drama})</span>
            <span className="absolute right-0 bottom-1/3 text-[9px] font-mono font-bold text-neutral-400 text-right">Adventure ({genres.genre_adventure})</span>
          </div>
        </div>

        {/* Panel B: Summary */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-5 flex flex-col backdrop-blur-md min-h-[220px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/[0.04] pb-2 mb-4">
            <span>🧠</span> AI Profile Summary
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-3 text-xs">
            {[
              `Primary preference vectors calibrated dynamically`,
              `Active watchlist threshold: ${stats.watchlistCount} items`,
              `Completion variance log: ${stats.completionRate}% computed`,
              "Real-time snapshot synchronization channel open"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 text-neutral-300 font-medium">
                <span className="text-rose-500 font-bold">✓</span>
                <span className="leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel C: Active Log */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-5 flex flex-col backdrop-blur-md min-h-[220px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/[0.04] pb-2 mb-3">
            <span>📊</span> Active Session Log
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
            {logs.map((log, i) => (
              <div key={i} className="p-2.5 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between text-[11px] text-neutral-300 gap-2">
                <div className="truncate">
                  <p className="font-semibold truncate text-neutral-200">{log.text}</p>
                  <span className="text-[9px] text-neutral-500">{log.timestamp}</span>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.05] text-neutral-400 rounded shrink-0">
                  {log.type || "SYNC"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel D: Badges */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-5 flex flex-col backdrop-blur-md min-h-[220px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/[0.04] pb-2 mb-3">
            <span>🏆</span> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-2 flex-1 items-center">
            {[
              { n: "Explorer", t: stats.watchedCount >= 3 ? "Legendary" : "Common", icon: "🌌" },
              { n: "Collector", t: stats.watchlistCount >= 3 ? "Epic" : "Common", icon: "📦" },
              { n: "AI Fan", t: stats.aiMatch >= 80 ? "Rare" : "Common", icon: "🤖" },
              { n: "Active Core", t: "Verified", icon: "🔥" }
            ].map((ach, i) => (
              <div key={i} className="p-2 bg-gradient-to-br from-neutral-500/5 to-transparent border border-white/5 rounded-xl text-center flex flex-col justify-center items-center h-full max-h-[64px]">
                <div className="text-lg">{ach.icon}</div>
                <h4 className="text-[10px] font-black text-neutral-200 mt-0.5">{ach.n}</h4>
                <p className="text-[7px] font-mono tracking-widest uppercase opacity-50">{ach.t}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 📜 ACCOMPANYING COMPLIANCE BOTTOM PANEL ── */}
      <div className="relative z-10 rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4 overflow-hidden bg-gradient-to-r from-[#0d0d16] via-[#121223] to-[#08080f] shadow-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold whitespace-nowrap animate-pulse font-mono uppercase tracking-wider">
          ✨ Pipeline Status Valid
        </div>
        <div className="text-xs">
          <p className="font-bold text-neutral-100">Watching metrics match system actions perfectly.</p>
          <p className="text-neutral-500 mt-0.5 font-medium">As you explore categories or finish video tracks, your taste profile updates instantly.</p>
        </div>
      </div>

    </div>
  );
}