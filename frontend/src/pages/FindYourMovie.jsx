// src/pages/FindYourMovie.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaCloudUploadAlt, FaFilm, FaArrowLeft, FaSync, FaTv, FaMagic } from "react-icons/fa";

export default function FindYourMovie() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Match Result State (Simulated backend machine-learning analytics response payload)
  const [matchedMovie, setMatchedMovie] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsUserAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    // 🔒 STRICT SECURITY ACCESSIBILITY WALL FOR VISUAL REVERSE MATCHING
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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  // ============================================================
  // NEURAL ENGINE ANALYTICS SIMULATION PIPELINE
  // ============================================================
  const triggerVisualAnalysis = async () => {
    if (!selectedFile || analyzing) return;

    setAnalyzing(true);
    setAnalysisStatus("Extracting cinematic color histograms...");
    await new Promise((r) => setTimeout(r, 1500));

    setAnalysisStatus("Querying structural face & frame recognition matrices...");
    await new Promise((r) => setTimeout(r, 1800));

    setAnalysisStatus("Matching timeline metadata logs...");
    await new Promise((r) => setTimeout(r, 1200));

    const mockResult = {
      title: "Leo",
      year: "2023",
      rating: "6.9",
      director: "Lokesh Kanagaraj",
      matchConfidence: "94.8%",
      overview: "An ordinary cafe owner becomes the target of a massive gang syndicate who suspect him of being a legendary former executioner handler hiding under a deep alias footprint.",
      posterPath: "https://image.tmdb.org/t/p/w500/yrp9R24m7f2Mv39MvHj3jN0jVRE.jpg"
    };

    setMatchedMovie(mockResult);
    setAnalyzing(false);
    setAnalysisStatus("");

    // Push action metadata directly into the user document history timeline array on Firestore
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, "users", auth.currentUser.uid, "sessionLogs"), {
          text: `Used Vision AI to identify clip from "${mockResult.title}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: "VISION_AI",
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Firestore tracking log write failure:", err);
      }
    }
  };

  const resetScannerCanvas = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setMatchedMovie(null);
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-white relative overflow-hidden font-sans antialiased">
      {/* Immersive Background Canvas Vector Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4c1d95,transparent_35%),radial-gradient(circle_at_bottom_left,#7f1d1d,transparent_35%)] opacity-50 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col h-screen w-full">
        
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
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <FaArrowLeft className="text-[9px]" /> Back to Home
          </button>
        </div>

        {/* Workspace Central Split Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-10 flex items-center justify-center bg-black/10">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* LEFT COLUMN: Input Media Chassis Dropzone */}
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
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                      className="hidden"
                    />
                    <FaCloudUploadAlt className="text-5xl text-white/20 group-hover:text-pink-400 transition-colors duration-300 mb-4" />
                    <p className="text-sm font-semibold text-neutral-200">
                      Drag & drop movie clip or scene screenshot
                    </p>
                    <p className="text-xs text-neutral-500 mt-2 font-mono">
                      Accepts PNG, JPG, MP4, or MOV file formats
                    </p>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="w-full h-72 rounded-2xl overflow-hidden border border-white/10 bg-black relative shadow-inner">
                      {fileType === "video" ? (
                        <video src={previewUrl} controls className="w-full h-full object-contain" />
                      ) : (
                        <img src={previewUrl} alt="Target signature frame" className="w-full h-full object-contain" />
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={resetScannerCanvas}
                        disabled={analyzing}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                      >
                        Discard File
                      </button>
                      <button
                        onClick={triggerVisualAnalysis}
                        disabled={analyzing}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 font-bold text-xs shadow-lg hover:opacity-95 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {/* FIXED: Replaced standard missing parameters with unified FaMagic model sets */}
                        {analyzing ? <FaSync className="animate-spin text-xs" /> : <FaMagic className="text-xs" />}
                        {analyzing ? "Scanning..." : "Analyze Media Block"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Scanning Overlay Catcher */}
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
            </div>

            {/* RIGHT COLUMN: Results Return Module Render Chassis */}
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
                        : "Mapping matrix nodes across regional server segments..."}
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex gap-5 items-start">
                        {matchedMovie.posterPath && (
                          <div className="w-24 h-36 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0 bg-zinc-800">
                            <img src={matchedMovie.posterPath} alt="Movie Poster" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl font-black text-neutral-100">{matchedMovie.title}</span>
                            <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-md font-bold text-neutral-400">{matchedMovie.year}</span>
                          </div>
                          <p className="text-xs text-neutral-400 font-medium">Directed by <span className="text-neutral-200 font-bold">{matchedMovie.director}</span></p>
                          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
                            🎯 {matchedMovie.matchConfidence} Confidence Match Rate
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Synopsis Analysis Block:</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">{matchedMovie.overview}</p>
                      </div>
                    </div>
                  )}
                </div>

                {matchedMovie && (
                  <button
                    onClick={() => navigate("/movies", { state: { filter: "all" } })}
                    className="mt-6 w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-neutral-200 hover:bg-white/10 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <FaFilm className="text-[10px]" /> Open Media Catalog to Watch Trailer
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}