// src/pages/FindYourMovie.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  FaBolt,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaExclamationTriangle,
  FaFilm,
  FaHistory,
  FaLock,
  FaMagic,
  FaPlay,
  FaSearch,
  FaStop,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import { auth, db } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ───────── CONFIG ───────── */
const MAX_FILE_MB = 50;
const REQUEST_TIMEOUT_MS = 120000;
const HISTORY_LIMIT = 12;
const IDENTIFY_PATH = "/api/movies/identify-movie";

/* Local dev talks to localhost; production uses VITE_API_URL */
function getApiBase() {
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const base = isLocal ? "http://localhost:5000" : import.meta.env.VITE_API_URL || "";
  return base.replace(/\/+$/, "");
}

/* ───────── HELPERS ───────── */
const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* "92%", "92", 0.92 -> 92. Anything non-numeric (e.g. "High") -> null */
const confidenceValue = (raw) => {
  const text = String(raw ?? "");
  const n = parseFloat(text);
  if (!Number.isFinite(n)) return null;
  const pct = n > 0 && n <= 1 && !text.includes("%") ? n * 100 : n;
  return Math.min(100, Math.max(0, pct));
};

/* Only the fields we want to keep with a history record */
const snapshotOf = (match) =>
  JSON.parse(
    JSON.stringify({
      title: match.title,
      year: match.year,
      director: match.director,
      runtime: match.runtime,
      rating: match.rating,
      genres: match.genres,
      cast: match.cast,
      overview: match.overview,
      posterPath: match.posterPath,
      trailerUrl: match.trailerUrl,
      matchConfidence: match.matchConfidence,
    })
  );

/* Collapse duplicate titles into one row, remembering every doc id */
function groupHistory(docs) {
  const map = new Map();
  for (const d of docs) {
    const data = d.data();
    const title = (data.matchedTitle || "").trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.ids.push(d.id);
      if (!existing.match && data.match) existing.match = data.match;
      continue;
    }
    map.set(key, {
      ids: [d.id],
      title,
      fileName: data.fileName || "",
      match: data.match || null,
    });
  }
  return [...map.values()].slice(0, HISTORY_LIMIT);
}

/* Upload with real progress events (fetch cannot report upload progress) */
function uploadForAnalysis(url, body, { signal, onProgress, onUploaded }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = REQUEST_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.upload.onload = () => {
      onProgress(100);
      onUploaded();
    };

    xhr.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON response */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
      } else {
        reject(new Error(payload?.message || `Server responded with status ${xhr.status}.`));
      }
    };
    xhr.onerror = () =>
      reject(new Error("Could not reach the MovieMind server. Check that the backend is running."));
    xhr.ontimeout = () =>
      reject(new Error("The analysis took too long. Try a shorter clip or a clearer screenshot."));
    xhr.onabort = () => reject(new DOMException("Cancelled", "AbortError"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(body);
  });
}

/* ───────── SMALL COMPONENTS ───────── */
function Poster({ src, title, className }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`${className} border-line surface t-muted flex items-center justify-center border border-dashed`}
      >
        <FaFilm aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${title} poster`}
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}

function Steps({ phase }) {
  const steps = [
    { key: "uploading", label: "Upload" },
    { key: "analyzing", label: "Analyze" },
    { key: "done", label: "Match" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === phase);

  return (
    <ol className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                  : "surface t-muted"
              }`}
            >
              {done ? <FaCheckCircle /> : i + 1}
            </span>
            <span className={active || done ? "t-main" : "t-muted"}>{step.label}</span>
            {i < steps.length - 1 && <span className="border-line h-px w-6 border-t" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ───────── PAGE ───────── */
export default function FindYourMovie() {
  const navigate = useNavigate();

  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const resultRef = useRef(null);
  const dragDepth = useRef(0);

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | ready | uploading | analyzing | done
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "error" | "info", text }

  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const busy = phase === "uploading" || phase === "analyzing";
  const fileKind = file?.type.startsWith("video/") ? "video" : "image";

  /* Auth */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  /* Live history: updates instantly, also across tabs and devices */
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    const historyQuery = query(
      collection(db, "users", user.uid, "visionHistory"),
      orderBy("timestamp", "desc"),
      limit(40)
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        setHistory(groupHistory(snapshot.docs));
        setHistoryLoading(false);
      },
      (err) => {
        console.error("Live history error:", err);
        setHistoryLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  /* Free the preview URL when it changes or the page unmounts */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* Live elapsed timer while the server works */
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [busy]);

  /* Abort any request still running when leaving the page */
  useEffect(() => () => abortRef.current?.abort(), []);

  const goLogin = () => {
    localStorage.setItem("auth_redirect_target", "/find-your-movie");
    navigate("/login");
  };

  const processFile = useCallback(
    (incoming) => {
      if (!incoming || busy) return;

      if (!user) {
        setNotice({ type: "error", text: "Please log in to identify movies." });
        return;
      }

      const isImage = incoming.type.startsWith("image/");
      const isVideo = incoming.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setNotice({ type: "error", text: "Unsupported file. Use a PNG, JPG, MP4 or MOV file." });
        return;
      }
      if (incoming.size > MAX_FILE_MB * 1024 * 1024) {
        setNotice({
          type: "error",
          text: `That file is ${formatSize(incoming.size)}. The limit is ${MAX_FILE_MB} MB.`,
        });
        return;
      }

      setFile(incoming);
      setPreviewUrl(URL.createObjectURL(incoming));
      setMatches([]);
      setSelected(null);
      setNotice(null);
      setProgress(0);
      setPhase("ready");
    },
    [busy, user]
  );

  /* Paste a screenshot straight from the clipboard */
  useEffect(() => {
    const onPaste = (event) => {
      const item = [...(event.clipboardData?.items || [])].find(
        (i) => i.kind === "file" && (i.type.startsWith("image/") || i.type.startsWith("video/"))
      );
      const pasted = item?.getAsFile();
      if (pasted) {
        event.preventDefault();
        processFile(pasted);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processFile]);

  const handleFileChange = (event) => {
    processFile(event.target.files?.[0]);
    event.target.value = ""; // lets the same file be chosen again
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const handleDragLeave = (event) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  const resetScanner = () => {
    if (busy) return;
    setFile(null);
    setPreviewUrl(null);
    setMatches([]);
    setSelected(null);
    setNotice(null);
    setProgress(0);
    setPhase("idle");
  };

  const cancelAnalysis = () => abortRef.current?.abort();

  const saveToHistory = async (match, fileName) => {
    const current = auth.currentUser;
    if (!current) return;
    try {
      await addDoc(collection(db, "users", current.uid, "visionHistory"), {
        fileName,
        matchedTitle: match.title,
        match: snapshotOf(match),
        timestamp: serverTimestamp(),
      });
      await addDoc(collection(db, "users", current.uid, "sessionLogs"), {
        text: `Used Vision AI to identify clip from "${match.title}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "VISION_AI",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Could not save history:", err);
    }
  };

  const analyze = async () => {
    if (!file || busy) return;

    const base = getApiBase();
    if (!base) {
      setNotice({
        type: "error",
        text: "The API URL is not configured. Set VITE_API_URL in your deployment environment.",
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setNotice(null);
    setMatches([]);
    setSelected(null);
    setProgress(0);
    setPhase("uploading");

    try {
      const body = new FormData();
      body.append("mediaBlock", file);

      const result = await uploadForAnalysis(`${base}${IDENTIFY_PATH}`, body, {
        signal: controller.signal,
        onProgress: setProgress,
        onUploaded: () => setPhase("analyzing"),
      });

      if (result?.success && result.matches?.length) {
        setMatches(result.matches);
        setSelected(result.matches[0]);
        setPhase("done");
        saveToHistory(result.matches[0], file.name);
        requestAnimationFrame(() =>
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      } else {
        setPhase("ready");
        setNotice({
          type: "info",
          text: result?.message || "We couldn't confidently identify this movie. Try a clearer frame.",
        });
      }
    } catch (err) {
      setPhase("ready");
      if (err?.name === "AbortError") {
        setNotice({ type: "info", text: "Analysis cancelled." });
      } else {
        console.error("Identify error:", err);
        setNotice({ type: "error", text: err.message || "Something went wrong. Please try again." });
      }
    } finally {
      abortRef.current = null;
    }
  };

  const openHistoryItem = (item) => {
    if (busy || !item.match) return;
    setFile(null);
    setPreviewUrl(null);
    setMatches([item.match]);
    setSelected(item.match);
    setNotice(null);
    setPhase("done");
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteHistoryItem = async (item) => {
    if (!user) return;
    try {
      await Promise.all(
        item.ids.map((id) => deleteDoc(doc(db, "users", user.uid, "visionHistory", id)))
      );
    } catch (err) {
      console.error("Could not delete record:", err);
      setNotice({ type: "error", text: "Could not delete that record. Please try again." });
    }
  };

  const clearAllHistory = async () => {
    if (!user) return;
    setConfirmClear(false);
    try {
      const snapshot = await getDocs(collection(db, "users", user.uid, "visionHistory"));
      for (let i = 0; i < snapshot.docs.length; i += 400) {
        const batch = writeBatch(db);
        snapshot.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.error("Could not clear history:", err);
      setNotice({ type: "error", text: "Could not clear your history. Please try again." });
    }
  };

  const openPicker = () => inputRef.current?.click();
  const confidencePct = selected ? confidenceValue(selected.matchConfidence) : null;

  return (
    <div className="app-bg relative min-h-screen overflow-hidden font-sans">
      {/* Grid + glow, top of the page only */}
      <div
        aria-hidden="true"
        className="hero-backdrop pointer-events-none absolute inset-x-0 top-0 h-[800px]"
      >
        <div className="backdrop-glow absolute inset-0" />
        <div className="grid-lines absolute inset-0" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-28 sm:px-6 md:px-10 md:pt-32">
          {/* HEADER */}
          <header className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
            <div className="hero-reveal hero-reveal-1 mb-5 inline-flex items-center gap-2.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              MovieMind Vision AI
            </div>

            <h1 className="hero-reveal hero-reveal-1 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Name any movie from{" "}
              <span className="gradient-flow bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
                a single scene
              </span>
            </h1>

            <p className="hero-reveal hero-reveal-3 t-muted mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed md:text-lg">
              Upload a screenshot or a short clip and our AI identifies the film in seconds.
            </p>

            <div className="hero-reveal hero-reveal-4 t-muted mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
              {["Drag & drop", "Paste with Ctrl + V", `PNG, JPG, MP4, MOV up to ${MAX_FILE_MB} MB`].map(
                (hint) => (
                  <span key={hint} className="border-line surface rounded-full border px-3 py-1.5">
                    {hint}
                  </span>
                )
              )}
            </div>
          </header>

          {/* NOTICE */}
          {notice && (
            <div
              role="alert"
              className={`fade-in-up mx-auto mb-6 flex max-w-5xl items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                notice.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-500"
                  : "border-line surface t-main"
              }`}
            >
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="flex-1">{notice.text}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
                className="cursor-pointer opacity-70 transition hover:opacity-100"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* WORKSPACE */}
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* UPLOAD */}
            <section className="border-line surface rounded-[28px] border p-5 shadow-xl backdrop-blur-xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="t-main flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <FaCloudUploadAlt className="text-pink-500" aria-hidden="true" />
                  Your scene
                </h2>
                {file && (
                  <span className="t-muted max-w-[55%] truncate font-mono text-[11px]">
                    {file.name} · {formatSize(file.size)}
                  </span>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {authReady && !user ? (
                <div className="border-line flex aspect-video min-h-[240px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/15 text-xl text-pink-500">
                    <FaLock aria-hidden="true" />
                  </span>
                  <p className="t-main text-base font-bold">Log in to identify movies</p>
                  <p className="t-muted mt-1 max-w-xs text-xs leading-relaxed">
                    An account lets us save your matches so you can find them again later.
                  </p>
                  <button
                    type="button"
                    onClick={goLogin}
                    className="mt-5 cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                  >
                    Log in
                  </button>
                </div>
              ) : !previewUrl ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload a screenshot or video clip"
                  onClick={openPicker}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPicker();
                    }
                  }}
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group flex aspect-video min-h-[240px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 ${
                    dragging
                      ? "scale-[1.01] border-pink-500 bg-pink-500/10"
                      : "border-line hover:border-pink-500/50 hover:bg-pink-500/5"
                  }`}
                >
                  <span
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-all duration-300 ${
                      dragging
                        ? "-translate-y-1 bg-pink-500/20 text-pink-500"
                        : "t-muted surface group-hover:-translate-y-1 group-hover:text-pink-500"
                    }`}
                  >
                    <FaCloudUploadAlt aria-hidden="true" />
                  </span>
                  <p className="t-main text-base font-bold">
                    {dragging ? "Drop it here" : "Drop a movie clip or screenshot"}
                  </p>
                  <p className="t-muted mt-1 text-xs font-medium">
                    or click to browse. You can also paste with Ctrl + V
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-line relative aspect-video w-full overflow-hidden rounded-2xl border bg-black">
                    {fileKind === "video" ? (
                      <video
                        src={previewUrl}
                        controls={!busy}
                        muted
                        playsInline
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Your uploaded scene"
                        className="h-full w-full object-contain"
                      />
                    )}

                    {busy && (
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                        <div className="scan-line" />
                      </div>
                    )}
                  </div>

                  {busy && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="border-line rounded-2xl border p-4"
                    >
                      <Steps phase={phase} />

                      <div className="surface relative h-1.5 overflow-hidden rounded-full">
                        {phase === "uploading" ? (
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                          />
                        ) : (
                          <div className="bar-indeterminate h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500" />
                        )}
                      </div>

                      <p className="t-muted mt-2.5 flex items-center justify-between text-xs font-medium">
                        <span>
                          {phase === "uploading"
                            ? `Uploading... ${progress}%`
                            : "AI is analyzing the scene..."}
                        </span>
                        <span className="font-mono">{elapsed}s</span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {busy ? (
                      <button
                        type="button"
                        onClick={cancelAnalysis}
                        className="border-line surface surface-hover t-main flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition active:scale-95"
                      >
                        <FaStop className="text-xs" aria-hidden="true" />
                        Cancel
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={resetScanner}
                          className="border-line surface surface-hover t-main flex-1 cursor-pointer rounded-xl border py-3 text-sm font-bold transition active:scale-95"
                        >
                          Choose another
                        </button>
                        <button
                          type="button"
                          onClick={analyze}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                        >
                          <FaMagic className="text-xs" aria-hidden="true" />
                          Identify movie
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* RESULT */}
            <section
              ref={resultRef}
              aria-live="polite"
              className="border-line surface scroll-mt-28 rounded-[28px] border p-5 shadow-xl backdrop-blur-xl sm:p-6"
            >
              <h2 className="t-main border-line mb-5 flex items-center gap-2 border-b pb-4 text-sm font-bold uppercase tracking-wider">
                <FaBolt className="text-purple-500" aria-hidden="true" />
                Match result
              </h2>

              {busy ? (
                <div className="animate-pulse space-y-5" aria-hidden="true">
                  <div className="flex gap-4">
                    <div className="surface h-36 w-24 flex-shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="surface h-6 w-3/4 rounded-lg" />
                      <div className="surface h-4 w-1/2 rounded-lg" />
                      <div className="surface h-4 w-1/3 rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="surface h-3 w-full rounded" />
                    <div className="surface h-3 w-full rounded" />
                    <div className="surface h-3 w-2/3 rounded" />
                  </div>
                </div>
              ) : selected ? (
                <div key={selected.title} className="fade-in-up space-y-5">
                  <div className="flex gap-4">
                    <Poster
                      src={selected.posterPath}
                      title={selected.title}
                      className="h-36 w-24 flex-shrink-0 rounded-xl shadow-lg"
                    />

                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="t-main text-2xl font-black leading-tight">
                        {selected.title}
                        {selected.year && (
                          <span className="t-muted ml-2 text-base font-semibold">
                            ({selected.year})
                          </span>
                        )}
                      </h3>

                      {selected.director && (
                        <p className="t-muted text-xs font-medium">
                          Directed by <span className="t-main font-bold">{selected.director}</span>
                        </p>
                      )}
                      {selected.runtime && (
                        <p className="t-muted font-mono text-[11px]">
                          Runtime: <span className="t-main font-medium">{selected.runtime}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selected.matchConfidence && (
                          <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-500">
                            {selected.matchConfidence} match
                          </span>
                        )}
                        {selected.rating && (
                          <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                            ★ {selected.rating} TMDB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {confidencePct !== null && (
                    <div>
                      <div className="surface h-1.5 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 transition-all duration-700"
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selected.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.genres.map((genre) => (
                        <span
                          key={genre}
                          className="border-line surface t-muted rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {selected.cast?.length > 0 && (
                    <div>
                      <h4 className="t-muted mb-1 text-[11px] font-bold uppercase tracking-wider">
                        Starring
                      </h4>
                      <p className="t-main text-sm font-medium">{selected.cast.join(", ")}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="t-muted mb-1 text-[11px] font-bold uppercase tracking-wider">
                      Synopsis
                    </h4>
                    <p className="t-main text-sm font-medium leading-relaxed opacity-90">
                      {selected.overview || "No plot description available."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {selected.trailerUrl && (
                      <a
                        href={selected.trailerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                      >
                        <FaPlay className="text-xs" aria-hidden="true" />
                        Watch trailer
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/movies?q=${encodeURIComponent(selected.title)}`)}
                      className="border-line surface surface-hover t-main flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition active:scale-95"
                    >
                      <FaSearch className="text-xs" aria-hidden="true" />
                      Find in catalog
                    </button>
                  </div>

                  {matches.length > 1 && (
                    <div className="border-line border-t pt-4">
                      <p className="t-muted mb-2 text-[11px] font-bold uppercase tracking-wider">
                        Other possible matches
                      </p>
                      <div className="grid gap-1.5">
                        {matches.map((item, index) => {
                          const active = item.title === selected.title;
                          return (
                            <button
                              key={`${item.title}-${index}`}
                              type="button"
                              onClick={() => setSelected(item)}
                              aria-pressed={active}
                              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs transition ${
                                active
                                  ? "border-pink-500/40 bg-pink-500/10 font-bold text-pink-500"
                                  : "border-line surface-hover t-main"
                              }`}
                            >
                              <span className="truncate">
                                {index + 1}. {item.title}
                                {item.year ? ` (${item.year})` : ""}
                              </span>
                              {item.matchConfidence && (
                                <span className="font-mono text-[10px] opacity-70">
                                  {item.matchConfidence}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <span className="t-muted surface mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl">
                    <FaFilm aria-hidden="true" />
                  </span>
                  <p className="t-main text-base font-bold">No scene analyzed yet</p>
                  <p className="t-muted mt-1 max-w-xs text-xs leading-relaxed">
                    Upload a screenshot or a short clip and the movie details will appear here.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* LIVE HISTORY */}
          {user && (
            <section className="mx-auto mt-10 max-w-5xl md:mt-14">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="t-main flex items-center gap-2 text-xl font-black tracking-tight md:text-2xl">
                    <FaHistory className="text-pink-500" aria-hidden="true" />
                    Recent matches
                  </h2>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                {history.length > 0 &&
                  (confirmClear ? (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="t-muted">Delete all history?</span>
                      <button
                        type="button"
                        onClick={clearAllHistory}
                        className="cursor-pointer rounded-lg bg-red-500 px-3 py-1.5 text-white transition active:scale-95"
                      >
                        Yes, clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="border-line surface surface-hover t-main cursor-pointer rounded-lg border px-3 py-1.5 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                    >
                      <FaTrashAlt className="text-[10px]" aria-hidden="true" />
                      Clear all
                    </button>
                  ))}
              </div>

              {historyLoading ? (
                <div className="grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((n) => (
                    <div key={n} className="surface h-24 rounded-2xl" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="border-line surface t-muted rounded-2xl border border-dashed px-6 py-10 text-center text-sm font-medium">
                  Your identified movies will show up here instantly.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {history.map((item) => (
                    <div
                      key={item.ids[0]}
                      className="border-line surface group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-500/40"
                    >
                      <button
                        type="button"
                        onClick={() => openHistoryItem(item)}
                        disabled={!item.match || busy}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left disabled:cursor-default"
                      >
                        <Poster
                          src={item.match?.posterPath}
                          title={item.title}
                          className="h-16 w-11 flex-shrink-0 rounded-lg"
                        />
                        <span className="min-w-0">
                          <span className="t-main block truncate text-sm font-bold">
                            {item.title}
                          </span>
                          {item.fileName && (
                            <span className="t-muted block truncate font-mono text-[10px]">
                              {item.fileName}
                            </span>
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteHistoryItem(item)}
                        aria-label={`Delete ${item.title} from history`}
                        className="t-muted flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg opacity-100 transition hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
