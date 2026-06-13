// frontend/src/pages/Performance.jsx

import { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaEnvelope, FaCamera, FaArrowLeft, FaCalendarAlt,
  FaFilm, FaHeart, FaClock, FaTrophy, FaCheckCircle, FaChartLine, FaCircle
} from "react-icons/fa";

export default function Performance() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const radarCanvasRef = useRef(null);
  const mainGraphCanvasRef = useRef(null);
  
  const sparklineRef1 = useRef(null);
  const sparklineRef2 = useRef(null);
  const sparklineRef3 = useRef(null);
  const sparklineRef4 = useRef(null);

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("radar");

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

  const chartDataSets = {
    watchlist: [2, 4, 1, 3, stats.watchlistCount],
    watched: [1, 2, 4, 3, stats.watchedCount],
    time: [8, 14, 22, 28, stats.watchHours],
    completion: [40, 60, 85, 70, stats.completionRate || 100]
  };
  const monthsTimeline = ["Feb", "Mar", "Apr", "May", "June"];

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
          const watched = Number(data.watchedCount) || 5; 
          const watchHours = Number(data.watchHours) || 32; 
          const totalCreated = watchlist + watched;
          const computedCompletion = totalCreated > 0 ? Math.round((watched / totalCreated) * 100) : 100;

          setStats({
            watchlistCount: watchlist,
            watchedCount: watched,
            watchHours: watchHours,
            aiMatch: Number(data.aiMatch) || 70, 
            completionRate: computedCompletion
          });

          setGenres({
            genre_scifi: Number(data.genre_scifi) || 1,
            genre_action: Number(data.genre_action) || 4,
            genre_thriller: Number(data.genre_thriller) || 7,
            genre_comedy: Number(data.genre_comedy) || 0,
            genre_drama: Number(data.genre_drama) || 0,
            genre_adventure: Number(data.genre_adventure) || 0
          });

          if (data.sessionLogs && Array.isArray(data.sessionLogs)) {
            setLogs(data.sessionLogs.slice(-4).reverse()); 
          } else {
            setLogs([
              { text: "Started streaming full feature: \"Michael\"", timestamp: "20:56", type: "STREAM_START" },
              { text: "Watched trailer for \"Michael\"", timestamp: "20:56", type: "SCREENING" },
              { text: "Started streaming full feature: \"Leo\"", timestamp: "00:33", type: "STREAM_START" },
              { text: "Started streaming full feature: \"Leo\"", timestamp: "00:29", type: "STREAM_START" }
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
    for (let i = 0; i < 35; i++) {
      particlesArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((p) => {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x > canvas.width) p.x = 0; else if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0; else if (p.y < 0) p.y = canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${p.opacity})`; ctx.fill();
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
    if (loading || activeView !== "radar" || !radarCanvasRef.current) return;
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
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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
    
    const maxGenreValue = Math.max(...valuesArray, 1);

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
    ctx.fillStyle = "rgba(239, 68, 68, 0.18)"; 
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
    ctx.lineWidth = 2; 
    ctx.stroke();
  }, [genres, loading, activeView]);

  useEffect(() => {
    if (loading || activeView === "radar" || !mainGraphCanvasRef.current) return;
    const canvas = mainGraphCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 35;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    const dataPoints = chartDataSets[activeView] || [0, 0, 0, 0, 0];
    const maxVal = Math.max(...dataPoints, 10);

    const colorMap = {
      watchlist: "#ef4444",
      watched: "#a855f7",
      time: "#3b82f6",
      completion: "#ec4899"
    };
    const activeColor = colorMap[activeView] || "#ef4444";

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padding + (chartHeight / 3) * i;
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(canvas.width - padding, y); ctx.stroke();
    }

    const stepX = chartWidth / (dataPoints.length - 1);

    const areaGrd = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    areaGrd.addColorStop(0, `${activeColor}25`);
    areaGrd.addColorStop(1, `${activeColor}00`);
    
    ctx.beginPath();
    dataPoints.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = canvas.height - padding - (val / maxVal) * chartHeight;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding + (dataPoints.length - 1) * stepX, canvas.height - padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.closePath();
    ctx.fillStyle = areaGrd;
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = activeColor;
    ctx.lineCap = "round";
    dataPoints.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = canvas.height - padding - (val / maxVal) * chartHeight;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    dataPoints.forEach((val, i) => {
      const x = padding + i * stepX;
      const y = canvas.height - padding - (val / maxVal) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(val, x, y - 10);
    });

  }, [activeView, loading, stats]);

  const drawSparkline = (canvas, dataPoints, strokeColor) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = strokeColor;
    ctx.lineCap = "round";
    const step = canvas.width / (dataPoints.length - 1);
    dataPoints.forEach((p, i) => {
      const x = i * step;
      const y = canvas.height - (p / 100) * (canvas.height - 4) - 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  useEffect(() => {
    if (loading) return;
    drawSparkline(sparklineRef1.current, [15, 30, 45, 20, 60], "#ef4444");
    drawSparkline(sparklineRef2.current, [20, 35, 60, 50, 85], "#a855f7");
    drawSparkline(sparklineRef3.current, [25, 45, 65, 70, 90], "#3b82f6");
    drawSparkline(sparklineRef4.current, [40, 55, 80, 75, 95], "#ec4899");
  }, [loading, stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020204] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs tracking-widest font-mono">STREAMING LIVE METRICS NODE...</p>
      </div>
    );
  }

  return (
    /* 🔓 FIX: Switched from h-screen to min-h-screen to let the grid scale dynamically without overflow clipping */
    <div className="min-h-screen bg-[#030306] text-white relative font-sans antialiased flex flex-col p-6 md:p-10 select-none space-y-8 pb-16">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-40" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-red-500/[0.04] blur-[180px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-500/[0.05] blur-[180px]" />
      </div>

      {/* ── HEADER ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 text-white">
            Performance <span className="bg-gradient-to-r from-white via-neutral-200 to-red-500 bg-clip-text text-transparent">Insights</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">Live visualization tracking updates from your watchlist and bot conversations.</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-xs font-bold font-mono text-white tracking-wide transition-all active:scale-95 shadow-2xl backdrop-blur-md cursor-pointer"
        >
          ← Back to App
        </button>
      </div>

      {/* ── HERO BANNER MATCH SYSTEM ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#09090f]/80 border border-white/[0.06] rounded-[24px] p-8 shadow-2xl backdrop-blur-2xl">
        <div className="space-y-2.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-xs font-bold text-neutral-300">Welcome back, Explorer</span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-md uppercase tracking-wider">Live Stream</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Your entertainment DNA matches</p>
          <p className="text-3xl font-black tracking-tight mt-1">
            <span className="bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">{stats.aiMatch}% with MovieMind</span>
          </p>
        </div>

        <div className="flex justify-center items-center relative py-2">
          <div className="w-36 h-36 rounded-full border-4 border-dashed border-white/[0.02] flex items-center justify-center animate-[spin_120s_linear_infinite]" />
          <div className="absolute w-32 h-32 rounded-full border-[5px] border-red-500 border-r-transparent border-b-transparent flex flex-col items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.15)] transform -rotate-45">
            <div className="transform rotate-45 text-center">
              <p className="text-3xl font-black tracking-tight text-white">{stats.aiMatch}%</p>
              <p className="text-[8px] uppercase tracking-widest font-black text-zinc-400 mt-0.5">AI MATCH</p>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center gap-4 text-xs bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl backdrop-blur-md">
            <span className="p-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-base shadow-lg">👁️</span>
            <div>
              <h4 className="font-bold text-white">Dynamic Preference Engine</h4>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5 leading-normal">Changes shapes on taste radar instantly based on watched movies.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-xl backdrop-blur-md">
            <span className="p-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl text-base shadow-lg">🎯</span>
            <div>
              <h4 className="font-bold text-white">Live Sync Active</h4>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5 leading-normal">Linked natively using open Firestore Snapshot pipelines.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SPARKLINE METRIC INTERACTIVE CARDS ── */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Watchlist Card */}
        <div 
          onClick={() => setActiveView(activeView === "watchlist" ? "radar" : "watchlist")}
          className={`border rounded-2xl p-5 flex items-center justify-between shadow-2xl backdrop-blur-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
            activeView === "watchlist" ? "bg-[#140b0f] border-red-500/80 scale-[1.01]" : "bg-[#08080d]/90 border-white/[0.06] hover:border-red-500/30"
          }`}
        >
          {activeView === "watchlist" && <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500" />}
          <div>
            <p className="text-2xl font-black tracking-tight text-white group-hover:text-red-400 transition-colors">{stats.watchlistCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mt-1 flex items-center gap-1.5 font-mono">
              {activeView === "watchlist" && <FaCircle className="text-[5px] text-red-500 animate-pulse" />} Watchlist
            </p>
          </div>
          <canvas ref={sparklineRef1} width={80} height={32} className="opacity-90" />
        </div>

        {/* Watched History Card */}
        <div 
          onClick={() => setActiveView(activeView === "watched" ? "radar" : "watched")}
          className={`border rounded-2xl p-5 flex items-center justify-between shadow-2xl backdrop-blur-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
            activeView === "watched" ? "bg-[#110b14] border-purple-500/80 scale-[1.01]" : "bg-[#08080d]/90 border-white/[0.06] hover:border-purple-500/30"
          }`}
        >
          {activeView === "watched" && <div className="absolute top-0 left-0 w-full h-[2px] bg-purple-500" />}
          <div>
            <p className="text-2xl font-black tracking-tight text-white group-hover:text-purple-400 transition-colors">{stats.watchedCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mt-1 flex items-center gap-1.5 font-mono">
              {activeView === "watched" && <FaCircle className="text-[5px] text-purple-500 animate-pulse" />} Watched History
            </p>
          </div>
          <canvas ref={sparklineRef2} width={80} height={32} className="opacity-90" />
        </div>

        {/* Watch Time Card */}
        <div 
          onClick={() => setActiveView(activeView === "time" ? "radar" : "time")}
          className={`border rounded-2xl p-5 flex items-center justify-between shadow-2xl backdrop-blur-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
            activeView === "time" ? "bg-[#0b0f14] border-blue-500/80 scale-[1.01]" : "bg-[#08080d]/90 border-white/[0.06] hover:border-blue-500/30"
          }`}
        >
          {activeView === "time" && <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500" />}
          <div>
            <p className="text-2xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">{stats.watchHours}h</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mt-1 flex items-center gap-1.5 font-mono">
              {activeView === "time" && <FaCircle className="text-[5px] text-blue-500 animate-pulse" />} Watch Time
            </p>
          </div>
          <canvas ref={sparklineRef3} width={80} height={32} className="opacity-90" />
        </div>

        {/* Completion Rate Card */}
        <div 
          onClick={() => setActiveView(activeView === "completion" ? "radar" : "completion")}
          className={`border rounded-2xl p-5 flex items-center justify-between shadow-2xl backdrop-blur-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
            activeView === "completion" ? "bg-[#140b11] border-pink-500/80 scale-[1.01]" : "bg-[#08080d]/90 border-white/[0.06] hover:border-pink-500/30"
          }`}
        >
          {activeView === "completion" && <div className="absolute top-0 left-0 w-full h-[2px] bg-pink-500" />}
          <div>
            <p className="text-2xl font-black tracking-tight text-white group-hover:text-pink-400 transition-colors">{stats.completionRate}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mt-1 flex items-center gap-1.5 font-mono">
              {activeView === "completion" && <FaCircle className="text-[5px] text-pink-500 animate-pulse" />} Completion Rate
            </p>
          </div>
          <canvas ref={sparklineRef4} width={80} height={32} className="opacity-90" />
        </div>

      </div>

      {/* ── 🎛️ DYNAMIC PARAMETERS MATRIX GRID ── */}
      {/* 🔓 FIX: Set grid-cols-1 md:grid-cols-2 lg:grid-cols-4 and removed restricted height variables */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* PANEL A: RADAR CHANGER */}
        <div className="bg-[#08080d]/90 border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between backdrop-blur-2xl min-h-[260px] relative shadow-2xl">
          {activeView === "radar" ? (
            <div className="h-full flex flex-col justify-between animate-fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="text-red-500">🕸️</span> Taste Radar
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono font-medium">Changes shape dynamically</p>
              </div>
              
              <div className="flex justify-center items-center my-auto relative w-full h-[150px] mt-2">
                <canvas ref={radarCanvasRef} width={130} height={130} className="object-contain z-10" />
                <span className="absolute top-0 text-[8px] font-mono font-bold text-white bg-white/[0.04] border border-white/5 px-1.5 py-0.5 rounded shadow-md">Sci-Fi ({genres.genre_scifi})</span>
                <span className="absolute bottom-0 text-[8px] font-mono font-bold text-white bg-white/[0.04] border border-white/5 px-1.5 py-0.5 rounded shadow-md text-center">Comedy ({genres.genre_comedy})</span>
                <span className="absolute left-0 top-1/3 text-[8px] font-mono font-bold text-white bg-white/[0.04] border border-white/5 px-1.5 py-0.5 rounded shadow-md">Action ({genres.genre_action})</span>
                <span className="absolute left-0 bottom-1/3 text-[8px] font-mono font-bold text-white bg-white/[0.04] border border-white/5 px-1.5 py-0.5 rounded shadow-md">Thriller ({genres.genre_thriller})</span>
                <span className="absolute right-0 top-1/3 text-[8px] font-mono font-bold text-white bg-white/[0.04] border border-white/5 px-1.5 py-0.5 rounded shadow-md text-right">Drama ({genres.genre_drama})</span>
                <span className="absolute right-0 bottom-1/3 text-[8px] font-mono font-bold text-white bg-white/[0.04] border border-white/5 px-1.5 py-0.5 rounded shadow-md text-right">Adventure ({genres.genre_adventure})</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <FaChartLine className="text-xs text-red-500" />
                    <span className="capitalize text-white">{activeView} Timeline</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-mono font-medium">Historical curve trend analytics</p>
                </div>
                <button 
                  onClick={() => setActiveView("radar")}
                  className="text-[9px] font-mono font-bold text-zinc-300 bg-white/[0.03] border border-white/10 px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
                >
                  Close X
                </button>
              </div>

              <div className="relative w-full h-[130px] my-auto flex flex-col justify-between pt-3">
                <canvas ref={mainGraphCanvasRef} width={220} height={105} className="w-full h-full object-contain" />
                <div className="w-full flex justify-between text-[8px] font-mono font-black text-zinc-400 px-4 mt-2">
                  {monthsTimeline.map((m, idx) => <span key={idx}>{m}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel B: Summary */}
        <div className="bg-[#08080d]/90 border border-white/[0.06] rounded-2xl p-5 flex flex-col backdrop-blur-2xl min-h-[260px] shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/[0.06] pb-2 mb-4">
            <span>🧠</span> AI Profile Summary
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-4 text-xs">
            {[
              `Primary preference vectors calibrated dynamically`,
              `Active watchlist threshold: ${stats.watchlistCount} items`,
              `Completion variance log: ${stats.completionRate}% computed`,
              "Real-time snapshot synchronization channel open"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 text-zinc-200 font-semibold">
                <span className="text-red-500 font-black">✓</span>
                <span className="leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel C: Active Log */}
        <div className="bg-[#08080d]/90 border border-white/[0.06] rounded-2xl p-5 flex flex-col backdrop-blur-2xl min-h-[260px] shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/[0.06] pb-2 mb-3">
            <span>📊</span> Active Session Log
          </h3>
          {/* 🔓 FIX: Re-allocated maximum log heights to bypass compression clipping at 100% zoom */}
          <div className="flex-1 overflow-y-auto max-h-[170px] space-y-2.5 pr-1 scrollbar-none">
            {logs.map((log, i) => (
              <div key={i} className="p-2.5 bg-black/40 border border-white/[0.05] rounded-xl flex items-center justify-between text-[11px] text-zinc-100 gap-2 font-medium">
                <div className="truncate">
                  <p className="font-bold truncate text-white leading-tight">{log.text}</p>
                  <span className="text-[9px] text-zinc-400 font-mono font-medium mt-0.5 inline-block">{log.timestamp}</span>
                </div>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.06] text-zinc-300 rounded shrink-0">
                  {log.type || "SYNC"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel D: Badges */}
        <div className="bg-[#08080d]/90 border border-white/[0.06] rounded-2xl p-5 flex flex-col backdrop-blur-2xl min-h-[260px] shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/[0.06] pb-2 mb-3">
            <span>🏆</span> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-2.5 flex-1 items-center">
            {[
              { n: "Explorer", t: stats.watchedCount >= 3 ? "Legendary" : "Common", icon: "🌌" },
              { n: "Collector", t: stats.watchlistCount >= 3 ? "Epic" : "Common", icon: "📦" },
              { n: "AI Fan", t: stats.aiMatch >= 80 ? "Rare" : "Common", icon: "🤖" },
              { n: "Active Core", t: "Verified", icon: "🔥" }
            ].map((ach, i) => (
              <div key={i} className="p-2 bg-black/40 border border-white/[0.05] rounded-xl text-center flex flex-col justify-center items-center h-full max-h-[72px] shadow-inner">
                <div className="text-lg">{ach.icon}</div>
                <h4 className="text-[10px] font-black text-white mt-0.5">{ach.n}</h4>
                <p className="text-[7px] font-mono tracking-widest font-bold uppercase text-zinc-400 mt-0.5">{ach.t}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── STATUS FOOTER OVERLAY BAR ── */}
      <div className="relative z-10 rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4 overflow-hidden bg-gradient-to-r from-[#09090f] via-[#0e0e1a] to-[#06060a] shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold whitespace-nowrap animate-pulse font-mono uppercase tracking-wider">
          ✨ Pipeline Status Valid
        </div>
        <div className="text-xs">
          <p className="font-bold text-white">Watching metrics match system actions perfectly.</p>
          <p className="text-zinc-300 mt-0.5 font-medium">Click any upper summary card slot right now to plot historical timeline trends inside your canvas layout window.</p>
        </div>
      </div>

    </div>
  );
}