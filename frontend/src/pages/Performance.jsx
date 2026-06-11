// src/pages/Performance.jsx

import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Performance() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const radarCanvasRef = useRef(null);
  
  // Sparkline references
  const sparklineRef1 = useRef(null);
  const sparklineRef2 = useRef(null);
  const sparklineRef3 = useRef(null);
  const sparklineRef4 = useRef(null);

  const [loading, setLoading] = useState(true);
  
  // Standard metric parameters
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

  // ── FIREBASE REALTIME ON-SNAPSHOT STREAM PIPELINE ──
  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      // Establish open listening connection pipeline directly to user document reference
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

          // Unpack explicit category counter flags natively matching movie data outputs
          setGenres({
            genre_scifi: Number(data.genre_scifi) || 0,
            genre_action: Number(data.genre_action) || 0,
            genre_thriller: Number(data.genre_thriller) || 0,
            genre_comedy: Number(data.genre_comedy) || 0,
            genre_drama: Number(data.genre_drama) || 0,
            genre_adventure: Number(data.genre_adventure) || 0
          });

          // Unpack user history streams array
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

  // 1. Particle Flow Background Animation Loop
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

  // 2. High-Precision Variable Radar Canvas Drawing Loop (Guarantees Re-rendering)
  useEffect(() => {
    if (!radarCanvasRef.current) return;
    const canvas = radarCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 5;
    const maxRadius = 55;
    const totalSides = 6;
    
    // Web grid layout rings
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

    // Draw active user metric shape plot
    ctx.beginPath();
    valuesArray.forEach((val, i) => {
      const angle = (i * 2 * Math.PI) / totalSides - Math.PI / 2;
      // Fixed layout ratio equation to avoid zero coordinate clipping artifacts
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
  }, [genres, loading]); // Dependency updates force canvas clear and redraw execution maps

  // 3. Sparkline trend graph plotting
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
    <div className="h-screen bg-[#040408] text-white relative font-sans antialiased overflow-hidden flex flex-col justify-between p-6 select-none">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 mix-blend-screen" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] bg-rose-600/[0.08] blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-600/[0.1] blur-[160px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.05] pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            Performance <span className="bg-gradient-to-r from-white via-neutral-200 to-rose-500 bg-clip-text text-transparent">Insights</span>
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">Live visualization tracking updates from your watchlist and bot conversations.</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-neutral-200 hover:bg-white/[0.08] transition shadow-lg">
          ← Back to App
        </button>
      </div>

      {/* Profile Hero Panel */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 my-4 items-center bg-gradient-to-br from-[#0d0d17]/90 to-[#07070d]/95 border border-white/[0.06] rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-100">Welcome back, Explorer</span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-md">Live Stream</span>
          </div>
          <p className="text-xs text-neutral-400">Your entertainment DNA matches</p>
          <p className="text-3xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">{stats.aiMatch}% with MovieMind</span>
          </p>
        </div>

        <div className="flex justify-center items-center relative">
          <div className="w-36 h-36 rounded-full border-4 border-dashed border-white/[0.03] flex items-center justify-center animate-[spin_100s_linear_infinite]" />
          <div className="absolute w-32 h-32 rounded-full border-[5px] border-rose-500 border-r-transparent border-b-transparent flex flex-col items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.25)] transform -rotate-45">
            <div className="transform rotate-45 text-center">
              <p className="text-3.5xl font-black tracking-tight text-white">{stats.aiMatch}%</p>
              <p className="text-[9px] uppercase tracking-widest font-black text-neutral-400 mt-0.5">AI MATCH</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { t: "Dynamic Preference Engine", d: "Changes shapes on taste radar instantly based on watched movies.", icon: "👁️" },
            { t: "Live Sync Active", d: "Linked natively using open Firestore Snapshot pipelines.", icon: "🎯" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <span className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-sm">{item.icon}</span>
              <div>
                <h4 className="font-bold text-neutral-200">{item.t}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Cards Sparklines Row */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 my-2">
        {[
          { label: "Watchlist", val: stats.watchlistCount, ref: sparklineRef1 },
          { label: "Watched", val: stats.watchedCount, ref: sparklineRef2 },
          { label: "Watch Time", val: `${stats.watchHours}h`, ref: sparklineRef3 },
          { label: "Completion Rate", val: `${stats.completionRate}%`, ref: sparklineRef4 }
        ].map((m, idx) => (
          <div key={idx} className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
            <div>
              <p className="text-2xl font-black tracking-tight text-neutral-100">{m.val}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-0.5">{m.label}</p>
            </div>
            <canvas ref={m.ref} width={75} height={30} className="opacity-90 object-contain" />
          </div>
        ))}
      </div>

      {/* Grid Layout Containers split workspace */}
      <div className="relative z-10 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2 min-h-0">
        
        {/* Panel A: Dynamic Taste Radar Map Canvas */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between relative backdrop-blur-md">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span>🕸️</span> Taste Radar
            </h3>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">Changes shape dynamically</p>
          </div>
          
          <div className="flex justify-center items-center my-auto relative w-full h-[150px]">
            <canvas ref={radarCanvasRef} width={140} height={140} className="object-contain z-10" />
            <span className="absolute top-1 text-[9px] font-mono font-bold text-neutral-300">Sci-Fi ({genres.genre_scifi})</span>
            <span className="absolute bottom-1 text-[9px] font-mono font-bold text-neutral-300 text-center">Comedy ({genres.genre_comedy})</span>
            <span className="absolute left-1 top-1/3 text-[9px] font-mono font-bold text-neutral-300">Action ({genres.genre_action})</span>
            <span className="absolute left-1 bottom-1/3 text-[9px] font-mono font-bold text-neutral-300">Thriller ({genres.genre_thriller})</span>
            <span className="absolute right-1 top-1/3 text-[9px] font-mono font-bold text-neutral-300 text-right">Drama ({genres.genre_drama})</span>
            <span className="absolute right-1 bottom-1/3 text-[9px] font-mono font-bold text-neutral-300 text-right">Adventure ({genres.genre_adventure})</span>
          </div>
        </div>

        {/* Panel B: Profile Summary List */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/[0.04] pb-2">
            <span>🧠</span> AI Profile Summary
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-3.5 my-2 text-xs">
            {[
              `Primary preference vectors calibrated dynamically`,
              `Active watchlist threshold: ${stats.watchlistCount} items`,
              `Completion variance log: ${stats.completionRate}% computed`,
              "Real-time snapshot synchronization channel open"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 text-neutral-300 leading-relaxed font-medium">
                <span className="text-rose-500 font-bold">✓</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel C: Session Logs History Array */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/[0.04] pb-2">
            <span>📊</span> Active Session Log
          </h3>
          <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2.5 scrollbar-none">
            {logs.map((log, i) => (
              <div key={i} className="p-2.5 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between text-[11px] text-neutral-300 gap-2">
                <div className="truncate">
                  <p className="font-semibold truncate text-neutral-200">{log.text}</p>
                  <span className="text-[9px] text-neutral-500">{log.timestamp}</span>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.05] text-neutral-400 rounded">
                  {log.type || "SYNC"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel D: Achievement Badges */}
        <div className="bg-[#0b0b14]/60 border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              <span>🏆</span> Achievements
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1 items-center my-2">
            {[
              { n: "Explorer", t: stats.watchedCount >= 3 ? "Legendary" : "Common", icon: "🌌", color: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-400" },
              { n: "Collector", t: stats.watchlistCount >= 3 ? "Epic" : "Common", icon: "📦", color: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400" },
              { n: "AI Fan", t: stats.aiMatch >= 80 ? "Rare" : "Common", icon: "🤖", color: "from-pink-500/10 to-transparent border-pink-500/20 text-pink-400" },
              { n: "Active Core", t: "Verified", icon: "🔥", color: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400" }
            ].map((ach, i) => (
              <div key={i} className={`p-2 bg-gradient-to-br ${ach.color} border rounded-xl text-center flex flex-col justify-center items-center h-full max-h-[72px] shadow-lg`}>
                <div className="text-xl">{ach.icon}</div>
                <h4 className="text-[11px] font-black text-neutral-200 mt-1">{ach.n}</h4>
                <p className="text-[8px] font-mono tracking-widest uppercase opacity-50 mt-0.5">{ach.t}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Status Overlay Line */}
      <div className="relative z-10 rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4 overflow-hidden shadow-2xl bg-gradient-to-r from-[#0d0d16] via-[#121223] to-[#08080f] backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold whitespace-nowrap">
          ✨ Real-Time Pipeline Safe
        </div>
        <div className="text-xs">
          <p className="font-bold text-neutral-100">Watching metrics match system actions perfectly.</p>
          <p className="text-neutral-500 mt-0.5 font-medium">As you explore categories or finish video tracks, your taste profile updates instantly.</p>
        </div>
      </div>

    </div>
  );
}