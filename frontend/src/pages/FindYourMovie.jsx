// src/pages/FindYourMovie.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaCloudUploadAlt, FaFilm, FaArrowLeft, FaSync, FaTv, FaMagic, FaHistory, FaTimes, FaTrashAlt } from "react-icons/fa";

export default function FindYourMovie() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); 
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  
  // Dynamic State Framework for Multi-Match Selection Panels
  const [matchedMovie, setMatchedMovie] = useState(null);
  const [allMatchesList, setAllMatchesList] = useState([]);

  // Search History State parameters
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsUserAuthenticated(true);
        loadSearchHistory(user.uid);
      } else {
        setIsUserAuthenticated(false);
        setSearchHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Retrieve past visual matching searches from Firestore subcollections
  const loadSearchHistory = async (uid) => {
    try {
      const q = query(
        collection(db, "users", uid, "visionHistory"),
        orderBy("timestamp", "desc"),
        limit(15)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const rawHistory = snapshot.docs.map(doc => ({ id: doc.id, filename: doc.data().fileName, matchedTitle: doc.data().matchedTitle }));
        
        // Remove duplicate items from tracking layout rows to keep panel concise
        const uniqueHistory = [];
        const seenTitles = new Set();

        for (const item of rawHistory) {
          const normalTitle = item.matchedTitle.trim().toLowerCase();
          if (!seenTitles.has(normalTitle)) {
            seenTitles.add(normalTitle);
            uniqueHistory.push(item);
          }
          if (uniqueHistory.length >= 10) break;
        }
        setSearchHistory(uniqueHistory);
      } else {
        setSearchHistory([]);
      }
    } catch (err) {
      console.error("Failed to read search history parameters:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    if (!isUserAuthenticated) {
      alert("🔒 Strict Security Gate: Visual matching using neural networks requires an active community profile. Please log in with your email to identify movies!");
      localStorage.setItem("auth_redirect_target", "/find-your-movie");
      navigate("/login");
      return;
    }

    setSelectedFile(file);
    setFileType(file.type.startsWith("video/") ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(file));
    setMatchedMovie(null); 
    setAllMatchesList([]);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  // ============================================================
  // 🧠 REAL AI COGNITIVE DEEP REVERSE MATCHING PIPELINE
  // ============================================================
  const triggerVisualAnalysis = async () => {
    if (!selectedFile || analyzing) return;

    setAnalyzing(true);
    setAnalysisStatus("Extracting cinematic color histograms...");
    
    try {
      // Assemble standard Multi-part Form Payload
      const formData = new FormData();
      formData.append("mediaBlock", selectedFile);

      // Async artificial delay steps to sustain original status animation layout structures
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStatus("Analyzing pixel metadata and actor contours...");
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStatus("Querying regional database indexing maps via Gemini Vision...");

      // ✅ Safe Cloud-Ready Dynamic Path Configuration Targeting Live Systems Or fallbacks
      const API_BASE_URL = import.meta.env.VITE_API_URL || "https://your-live-backend-domain.com";
      const targetEndpoint = `${API_BASE_URL}/api/movies/identify-movie`;
      
      const response = await fetch(targetEndpoint, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Cloud analysis engine failure response status code.");
      }

      const reportResult = await response.json();

      if (reportResult.success && reportResult.matches && reportResult.matches.length > 0) {
        const topHit = reportResult.matches[0];
        setAllMatchesList(reportResult.matches);
        setMatchedMovie(topHit);

        // Commit standard background Firebase log tracking entries matching system criteria
        if (auth.currentUser) {
          const uid = auth.currentUser.uid;
          
          // Log core history node
          await addDoc(collection(db, "users", uid, "visionHistory"), {
            fileName: selectedFile.name,
            matchedTitle: topHit.title,
            timestamp: serverTimestamp()
          });

          // Log session action node
          await addDoc(collection(db, "users", uid, "sessionLogs"), {
            text: `Used Vision AI to identify clip from "${topHit.title}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "VISION_AI",
            createdAt: serverTimestamp()
          });

          loadSearchHistory(uid);
        }
      } else {
        alert(reportResult.message || "We couldn't confidently identify this movie.");
        resetScannerCanvas();
      }

    } catch (networkErr) {
      console.error("Critical routing core error:", networkErr);
      alert("System connection error: Failed to process framework visual block components via Cloud Architecture APIs. Check backend endpoint health properties.");
    } finally {
      setAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const selectAlternativeMovieCandidate = (chosenMovie) => {
    setMatchedMovie(chosenMovie);
  };

  const handleDeleteSingleHistory = async (e, itemId) => {
    e.stopPropagation();
    if (!isUserAuthenticated || !auth.currentUser) return;

    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "visionHistory", itemId));
      setSearchHistory(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Error clearing search token:", err);
    }
  };

  const clearAllSearchHistory = async () => {
    if (!isUserAuthenticated || !auth.currentUser) return;
    if (window.confirm("Are you sure you want to completely wipe your vision search logs?")) {
      try {
        const snapshot = await getDocs(collection(db, "users", auth.currentUser.uid, "visionHistory"));
        await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
        setSearchHistory([]);
        alert("Vision history log cleared successfully 🧼");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const resetScannerCanvas = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setMatchedMovie(null);
    setAllMatchesList([]);
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-white relative overflow-hidden font-sans antialiased flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4c1d95,transparent_35%),radial-gradient(circle_at_bottom_left,#7f1d1d,transparent_35%)] opacity-50 pointer-events-none z-0" />

      {/* MAIN VIEW WORKSPACE CONSOLE */}
      <div className="relative z-10 flex flex-col h-screen w-full transition-all duration-500">
        
        {/* Navigation Control Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] backdrop-blur-2xl bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
                MovieMind Vision AI
              </h1>
              <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono mt-0.5">
                Reverse-Frame Image & Video Identification Terminal
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {isUserAuthenticated && (
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition flex items-center gap-2 text-white/80">
                <FaHistory className="text-[11px]" /> {isSidebarOpen ? "Close History" : "Search History"}
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <FaArrowLeft className="text-[9px]" /> Back to Home
            </button>
          </div>
        </div>

        {/* Central Grid Split Components */}
        <div className="flex-1 overflow-y-auto px-6 py-10 flex items-center justify-center bg-black/10">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Dropzone Panel Chassis */}
            <div className="w-full space-y-4">
              <div className="bg-[#0b0b14]/60 border border-white/[0.06] rounded-[32px] p-6 backdrop-blur-xl shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
                  <span>📹</span> Input Scanner Grid
                </h3>

                {!previewUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                    className="w-full h-72 border-2 border-dashed border-white/10 hover:border-pink-500/40 rounded-2xl bg-black/20 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                    <FaCloudUploadAlt className="text-5xl text-white/20 group-hover:text-pink-400 transition-colors duration-300 mb-4" />
                    <p className="text-sm font-semibold text-neutral-200">Drag & drop movie clip or screenshot</p>
                    <p className="text-xs text-neutral-500 mt-2 font-mono">Accepts PNG, JPG, MP4, or MOV file formats</p>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="w-full h-72 rounded-2xl overflow-hidden border border-white/10 bg-black relative shadow-inner">
                      {fileType === "video" ? (
                        <video src={previewUrl} controls className="w-full h-full object-contain" />
                      ) : (
                        <img src={previewUrl} alt="Screenshot target source" className="w-full h-full object-contain" />
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button onClick={resetScannerCanvas} disabled={analyzing} className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition disabled:opacity-40 cursor-pointer">Discard File</button>
                      <button onClick={triggerVisualAnalysis} disabled={analyzing} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 font-bold text-xs shadow-lg hover:opacity-95 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
                        {analyzing ? <FaSync className="animate-spin text-xs" /> : <FaMagic className="text-xs" />}
                        {analyzing ? "Scanning..." : "Analyze Media Block"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {analyzing && (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                    <FaSync className="text-xs animate-spin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-white/40 tracking-widest uppercase">VISION MATRIX PROCESSING...</p>
                    <p className="text-xs text-pink-400 mt-1 truncate font-medium">{analysisStatus}</p>
                  </div>
                </div>
              )}

              {/* TOP 5 MULTI-MATCH CARD PANEL INTERFACE DESIGNS */}
              {!analyzing && allMatchesList.length > 1 && (
                <div className="bg-[#0b0b14]/60 border border-white/[0.06] rounded-2xl p-4 backdrop-blur-xl space-y-2 animate-fade-in">
                  <p className="text-[11px] font-mono text-white/40 uppercase tracking-wider">Top Alternative Matches Found:</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {allMatchesList.map((item, index) => (
                      <button
                        key={`${item.title}-${index}`}
                        onClick={() => selectAlternativeMovieCandidate(item)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-xs flex justify-between items-center border transition ${
                          matchedMovie?.title === item.title 
                            ? "bg-pink-500/10 border-pink-500/30 text-pink-400 font-bold" 
                            : "bg-white/[0.02] border-white/[0.04] text-neutral-300 hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate">{(index + 1)}. {item.title} ({item.year})</span>
                        <span className="font-mono text-[10px] opacity-70 bg-black/30 px-1.5 py-0.5 rounded">{item.matchConfidence}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results Delivery Render Card Card */}
            <div className="w-full">
              <div className="bg-[#0b0b14]/60 border border-white/[0.06] rounded-[32px] p-6 backdrop-blur-xl shadow-2xl min-h-[380px] flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/[0.05] pb-3 mb-4 flex items-center gap-1.5">
                    <FaTv className="text-xs text-purple-400" /> Neural Match Result
                  </h3>

                  {!matchedMovie ? (
                    <div className="text-center py-24 text-xs font-mono text-white/20 tracking-widest uppercase leading-relaxed">
                      {!analyzing 
                        ? "Upload a scene screenshot or video loop to trigger discovery algorithms." 
                        : "Processing frame contours across databases..."}
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex gap-4 items-start">
                        {matchedMovie.posterPath ? (
                          <div className="w-24 h-36 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0 bg-zinc-800">
                            <img src={matchedMovie.posterPath} alt="TMDB Match" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-36 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-center p-2 text-[10px] text-white/30 tracking-tight shrink-0 bg-black/40">
                            No Poster Found
                          </div>
                        )}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-black text-neutral-100 truncate max-w-full">{matchedMovie.title}</span>
                            <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-md font-bold text-neutral-400">{matchedMovie.year}</span>
                          </div>
                          
                          <p className="text-xs text-neutral-400 font-medium">Directed by <span className="text-neutral-200 font-bold">{matchedMovie.director}</span></p>
                          
                          {matchedMovie.runtime && (
                            <p className="text-[11px] text-neutral-400 font-mono">Length: <span className="text-neutral-300 font-medium">{matchedMovie.runtime}</span></p>
                          )}
                          
                          <div className="flex gap-1.5 flex-wrap pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
                              🎯 {matchedMovie.matchConfidence}
                            </span>
                            {matchedMovie.rating && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                                ⭐ {matchedMovie.rating} TMDB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Displaying Extracted Genres Metadata */}
                      {matchedMovie.genres && matchedMovie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-t border-b border-white/[0.04] py-2">
                          {matchedMovie.genres.map((g, idx) => (
                            <span key={idx} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-neutral-400 font-medium">{g}</span>
                          ))}
                        </div>
                      )}

                      {matchedMovie.cast && matchedMovie.cast.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Starring Cast:</h4>
                          <p className="text-xs text-neutral-300 font-medium truncate">{matchedMovie.cast.join(", ")}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Synopsis Analysis Block:</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">{matchedMovie.overview || "No overview plot description available."}</p>
                      </div>
                    </div>
                  )}
                </div>

                {matchedMovie && (
                  <button
                    onClick={() => {
                      if (matchedMovie.trailerUrl) {
                        window.open(matchedMovie.trailerUrl, "_blank", "noopener,noreferrer");
                      } else {
                        navigate("/movies", { state: { filter: "all" } });
                      }
                    }}
                    className="mt-6 w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-neutral-200 hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <FaFilm className="text-[10px]" /> {matchedMovie.trailerUrl ? "Play Official Trailer Video (YouTube)" : "Go to Streams Catalog to Watch Trailer"}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── PREMIUM REUSABLE SEARCH HISTORY SLIDE SIDEBAR ── */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-[#07070f] border-l border-white/[0.06] shadow-2xl z-50 transform transition-transform duration-500 backdrop-blur-2xl bg-opacity-95 ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-6 flex flex-col h-full">
          
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.06] mb-5">
            <div className="flex items-center gap-2 text-md font-bold tracking-wide">
              <FaHistory className="text-pink-400 text-sm" /> Vision History
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 transition text-white cursor-pointer">
              <FaTimes className="text-xs" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-hide pr-1">
            {searchHistory.length === 0 ? (
              <div className="text-center py-10 text-xs font-mono text-white/30 tracking-widest uppercase">
                No visual matching records found.
              </div>
            ) : (
              searchHistory.map((item) => (
                <div 
                  key={item.id}
                  className="group/item relative w-full px-4 py-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs font-medium text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/10 hover:border-pink-500/20 text-left transition flex items-center justify-between overflow-hidden"
                >
                  <div className="truncate pr-4 flex flex-col gap-0.5">
                    <span className="text-[10px] text-white/30 font-mono truncate">{item.filename}</span>
                    <span className="text-white/80 font-semibold truncate">🎬 {item.matchedTitle}</span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteSingleHistory(e, item.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-2 text-white/40 hover:text-red-400 rounded-lg hover:bg-white/5 transition duration-300 shrink-0 cursor-pointer"
                    title="Delete record"
                  >
                    <FaTimes className="text-[10px]" />
                  </button>
                </div>
              ))
            )}
          </div>

          {searchHistory.length > 0 && (
            <button 
              onClick={clearAllSearchHistory}
              className="mt-4 w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaTrashAlt className="text-[10px]" /> Wipe Vision Logs
            </button>
          )}

        </div>
      </div>

    </div>
  );
}