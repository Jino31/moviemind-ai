// src/pages/Profile.jsx
// Redesigned profile page — uses the site's Navbar + theme, live Firestore sync.

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc, setDoc, onSnapshot, serverTimestamp, collection, getCountFromServer,
} from "firebase/firestore";
import { onAuthStateChanged, updateProfile, signOut } from "firebase/auth";
import {
  FaUser, FaEnvelope, FaCamera, FaCalendarAlt, FaClock, FaPen, FaSignOutAlt,
  FaCheckCircle, FaExclamationCircle, FaTrashAlt, FaCommentDots, FaSearch, FaShieldAlt,
} from "react-icons/fa";

// ▼▼ Same site navbar + theme as the Chatbot page (adjust paths if needed) ▼▼
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
// ▲▲ ─────────────────────────────────────────────────────────────────── ▲▲

// Fallback navbar height (px) if the navbar can't be measured. Use 0 if it isn't fixed/sticky.
const NAVBAR_FIXED_OFFSET = 72;
const MAX_NAME = 40;

/* ───────────────────────── helpers ───────────────────────── */

function toDate(v) {
  if (!v) return null;
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(d, withTime = false) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// Firestore docs are limited to 1 MiB, so shrink the avatar to a small square JPEG.
function compressImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image is too large (max 8 MB)."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that image.")); };
    img.src = url;
  });
}

const providerLabel = (id) =>
  ({ "google.com": "Google", password: "Email & password", "github.com": "GitHub", "facebook.com": "Facebook" }[id] ?? id ?? "Email");

/* ───────────────────────── page ───────────────────────── */

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // theme — from the website's own theme context
  const themeCtx = useTheme() ?? {};
  const isDark =
    typeof themeCtx.theme === "string" ? themeCtx.theme === "dark"
    : themeCtx.isDark ?? themeCtx.darkMode ?? themeCtx.dark ?? true;
  const theme = isDark ? "dark" : "light";

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userData, setUserData] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "err", text }
  const [counts, setCounts] = useState({ chats: null, searches: null });
  const [navOffset, setNavOffset] = useState(NAVBAR_FIXED_OFFSET);

  const flash = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3200);
  }, []);

  /* ── measure the site navbar ── */
  useEffect(() => {
    const measure = () => {
      const nav = document.querySelector("nav") || document.querySelector("body > header, #root > header");
      if (!nav) { setNavOffset(NAVBAR_FIXED_OFFSET); return; }
      const pos = getComputedStyle(nav).position;
      setNavOffset(pos === "fixed" || pos === "sticky" ? Math.round(nav.getBoundingClientRect().bottom) : 0);
    };
    measure();
    const t = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, []);

  /* ── auth: redirect guests to login ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        try { localStorage.setItem("auth_redirect_target", "/profile"); } catch { /* ignore */ }
        navigate("/login", { replace: true });
        return;
      }
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, [navigate]);

  /* ── live user document (updates instantly, also across tabs) ── */
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => { setUserData(snap.exists() ? snap.data() : {}); setDataReady(true); },
      (err) => { console.error("Profile listener failed:", err); setUserData({}); setDataReady(true); }
    );
    return () => unsub();
  }, [user]);

  /* ── activity counts ── */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          getCountFromServer(collection(db, "users", user.uid, "chats")),
          getCountFromServer(collection(db, "users", user.uid, "searchHistory")),
        ]);
        if (!cancelled) setCounts({ chats: c.data().count, searches: s.data().count });
      } catch (err) {
        console.warn("Couldn't load activity counts:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  /* ── background particles (theme-aware, respects reduced motion) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !authReady) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let raf;
    const dot = isDark ? "236,72,153" : "219,39,119";
    const line = isDark ? "239,68,68" : "190,24,93";
    const alphaScale = isDark ? 1 : 0.55;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const parts = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.5 + 0.2,
    }));

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot},${p.o * alphaScale})`;
        ctx.fill();
      }
      for (let a = 0; a < parts.length; a++) {
        for (let b = a + 1; b < parts.length; b++) {
          const dx = parts[a].x - parts[b].x;
          const dy = parts[a].y - parts[b].y;
          const d = Math.hypot(dx, dy);
          if (d < 180) {
            ctx.strokeStyle = `rgba(${line},${(1 - d / 180) * 0.18 * alphaScale})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(parts[a].x, parts[a].y);
            ctx.lineTo(parts[b].x, parts[b].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    frame();

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else frame();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [authReady, isDark]);

  /* ───────── derived values ───────── */

  const name = userData?.name || user?.displayName || "Movie Lover";
  const email = userData?.email || user?.email || "No email";
  const photo =
    userData?.photoURL || user?.photoURL ||
    `https://ui-avatars.com/api/?background=ec4899&color=fff&bold=true&name=${encodeURIComponent(name)}`;
  const joined = toDate(userData?.createdAt) || toDate(user?.metadata?.creationTime);
  const lastLogin = toDate(user?.metadata?.lastSignInTime);
  const provider = providerLabel(user?.providerData?.[0]?.providerId);

  /* ───────── actions ───────── */

  const saveProfile = async (fields) => {
    const payload = { ...fields, email: user.email ?? null, updatedAt: serverTimestamp() };
    if (!userData?.createdAt) payload.createdAt = user.metadata?.creationTime ?? new Date().toISOString();
    // setDoc + merge also works when the user doc doesn't exist yet (updateDoc would throw).
    await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    if (fields.name && fields.name !== user.displayName) {
      await updateProfile(auth.currentUser, { displayName: fields.name }).catch(() => {});
    }
  };

  const startEditing = () => {
    setEditName(name);
    setEditPhoto(userData?.photoURL || user?.photoURL || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName("");
    setEditPhoto("");
  };

  const triggerFileSelect = () => { if (!updating) fileInputRef.current?.click(); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      setUpdating(true);
      const dataUrl = await compressImage(file);
      if (isEditing) {
        setEditPhoto(dataUrl);
      } else {
        await saveProfile({ photoURL: dataUrl });
        flash("ok", "Profile photo updated");
      }
    } catch (err) {
      console.error(err);
      flash("err", err.message || "Couldn't update photo");
    } finally {
      setUpdating(false);
    }
  };

  const removePhoto = async () => {
    if (isEditing) { setEditPhoto(""); return; }
    try {
      setUpdating(true);
      await saveProfile({ photoURL: "" });
      flash("ok", "Photo removed");
    } catch (err) {
      console.error(err);
      flash("err", "Couldn't remove photo");
    } finally {
      setUpdating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const clean = editName.trim();
    if (!clean) return;
    try {
      setUpdating(true);
      await saveProfile({ name: clean, photoURL: editPhoto });
      setIsEditing(false);
      flash("ok", "Profile saved");
    } catch (err) {
      console.error("Error updating profile:", err);
      flash("err", "Couldn't save changes. Check your connection and try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); navigate("/login", { replace: true }); }
    catch (err) { console.error(err); flash("err", "Couldn't sign out"); }
  };

  /* ───────── render ───────── */

  const loading = !authReady || !dataReady;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pf-root" data-theme={theme} style={{ paddingTop: navOffset }}>
          <style>{CSS}</style>
          <div className="pf-loading">
            <div className="pf-spinner" />
            <p className="pf-muted text-xs tracking-widest">LOADING PROFILE…</p>
          </div>
        </div>
      </>
    );
  }

  const formPhoto = editPhoto || `https://ui-avatars.com/api/?background=ec4899&color=fff&bold=true&name=${encodeURIComponent(editName || name)}`;

  return (
    <>
      <Navbar />
      <div className="pf-root" data-theme={theme} style={{ paddingTop: navOffset }}>
        <style>{CSS}</style>
        <canvas ref={canvasRef} className="pf-canvas" />
        <div className="pf-glow" />

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        <main className="pf-wrap">
          {/* Hero card */}
          <section className="pf-card pf-hero pf-fade">
            <div className="pf-banner" />
            <div className="pf-hero-body">
              <button className="pf-avatar" onClick={triggerFileSelect} disabled={updating} aria-label="Change profile photo">
                <img src={isEditing ? formPhoto : photo} alt="Profile" className={updating ? "pf-pulse" : ""} />
                <span className="pf-avatar-badge"><FaCamera /></span>
              </button>

              <div className="pf-hero-info">
                <h1 className="pf-name">{name}</h1>
                <p className="pf-email">{email}</p>
                <div className="pf-badges">
                  <span className={`pf-badge ${user?.emailVerified ? "pf-badge-ok" : "pf-badge-warn"}`}>
                    {user?.emailVerified ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {user?.emailVerified ? "Email verified" : "Email not verified"}
                  </span>
                  <span className="pf-badge"><FaShieldAlt /> {provider}</span>
                </div>
              </div>

              <div className="pf-actions">
                {!isEditing && (
                  <button className="pf-btn pf-btn-primary" onClick={startEditing}>
                    <FaPen className="text-[11px]" /> Edit Profile
                  </button>
                )}
                <button className="pf-btn" onClick={handleSignOut}>
                  <FaSignOutAlt className="text-[11px]" /> Sign out
                </button>
              </div>
            </div>
          </section>

          {message && (
            <div className={`pf-msg pf-fade ${message.type === "err" ? "pf-msg-err" : "pf-msg-ok"}`} role="status">
              {message.type === "err" ? <FaExclamationCircle /> : <FaCheckCircle />} {message.text}
            </div>
          )}

          {/* Edit form */}
          {isEditing && (
            <section className="pf-card pf-pad pf-fade">
              <h2 className="pf-h2">Edit profile</h2>
              <p className="pf-muted text-xs mb-6">Update how your name and photo appear across MovieMind AI.</p>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="flex items-center gap-5 flex-wrap">
                  <button type="button" className="pf-avatar pf-avatar-sm" onClick={triggerFileSelect} disabled={updating}>
                    <img src={formPhoto} alt="Preview" />
                    <span className="pf-avatar-badge"><FaCamera /></span>
                  </button>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className="pf-btn" onClick={triggerFileSelect} disabled={updating}>
                      <FaCamera className="text-[11px]" /> Upload photo
                    </button>
                    {editPhoto && (
                      <button type="button" className="pf-btn pf-btn-danger" onClick={removePhoto} disabled={updating}>
                        <FaTrashAlt className="text-[11px]" /> Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="pf-label" htmlFor="pf-name">Display name</label>
                  <div className="pf-input-wrap">
                    <FaUser className="pf-input-icon" />
                    <input
                      id="pf-name"
                      type="text"
                      required
                      maxLength={MAX_NAME}
                      disabled={updating}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="pf-input"
                    />
                    <span className="pf-count">{editName.length}/{MAX_NAME}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" className="pf-btn flex-1 justify-center" disabled={updating} onClick={cancelEditing}>
                    Cancel
                  </button>
                  <button type="submit" className="pf-btn pf-btn-primary flex-1 justify-center" disabled={updating || !editName.trim()}>
                    {updating ? <span className="pf-spinner pf-spinner-sm" /> : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Stats */}
          <section className="pf-stats pf-fade">
            <div className="pf-card pf-stat">
              <FaCommentDots className="pf-accent" />
              <div className="pf-stat-num">{counts.chats ?? "—"}</div>
              <div className="pf-muted text-xs">Chat messages</div>
            </div>
            <div className="pf-card pf-stat">
              <FaSearch className="pf-accent" />
              <div className="pf-stat-num">{counts.searches ?? "—"}</div>
              <div className="pf-muted text-xs">Searches</div>
            </div>
            <div className="pf-card pf-stat">
              <FaCalendarAlt className="pf-accent" />
              <div className="pf-stat-num pf-stat-text">{joined ? joined.getFullYear() : "—"}</div>
              <div className="pf-muted text-xs">Member since</div>
            </div>
          </section>

          {/* Account details */}
          <section className="pf-card pf-pad pf-fade">
            <h2 className="pf-h2 mb-5">Account details</h2>
            <div className="pf-grid">
              <Detail icon={<FaUser />} label="Full name" value={name} />
              <Detail icon={<FaEnvelope />} label="Email address" value={email} mono />
              <Detail icon={<FaCalendarAlt />} label="Joined" value={fmtDate(joined)} />
              <Detail icon={<FaClock />} label="Last sign-in" value={fmtDate(lastLogin, true)} />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function Detail({ icon, label, value, mono }) {
  return (
    <div className="pf-detail">
      <div className="pf-label">{label}</div>
      <div className="pf-detail-row">
        <span className="pf-detail-icon">{icon}</span>
        <span className={`truncate ${mono ? "pf-mono" : ""}`}>{value}</span>
      </div>
    </div>
  );
}

/* ───────────────────────── styles (themed via CSS variables) ───────────────────────── */

const CSS = `
.pf-root{
  --bg:#07070d; --glow-a:rgba(220,38,38,.28); --glow-b:rgba(124,58,237,.28);
  --surface:rgba(255,255,255,.045); --surface-2:rgba(255,255,255,.08);
  --border:rgba(255,255,255,.1); --text:#f4f4f8; --muted:rgba(244,244,248,.58);
  --accent:#f472b6; --shadow:0 14px 40px rgba(0,0,0,.4);
  --ok:#34d399; --ok-bg:rgba(16,185,129,.14); --warn:#fbbf24; --warn-bg:rgba(245,158,11,.14);
  --err:#f87171; --err-bg:rgba(239,68,68,.14);
}
.pf-root[data-theme="light"]{
  --bg:#f7f5fb; --glow-a:rgba(244,114,182,.35); --glow-b:rgba(129,140,248,.35);
  --surface:#ffffff; --surface-2:#f0edf7;
  --border:rgba(30,20,60,.11); --text:#17141f; --muted:rgba(23,20,31,.6);
  --accent:#db2777; --shadow:0 14px 40px rgba(60,30,90,.12);
  --ok:#047857; --ok-bg:#d1fae5; --warn:#b45309; --warn-bg:#fef3c7;
  --err:#b91c1c; --err-bg:#fee2e2;
}
.pf-root{position:relative;min-height:100vh;box-sizing:border-box;background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:hidden;
  transition:background .3s,color .3s;-webkit-font-smoothing:antialiased}
.pf-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
.pf-glow{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.55;
  background:radial-gradient(circle at top left,var(--glow-a),transparent 38%),radial-gradient(circle at bottom right,var(--glow-b),transparent 38%)}
.pf-wrap{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:28px 16px 72px;display:flex;flex-direction:column;gap:20px}
.pf-card{background:var(--surface);border:1px solid var(--border);border-radius:26px;box-shadow:var(--shadow);backdrop-filter:blur(14px);overflow:hidden}
.pf-pad{padding:26px}
.pf-muted{color:var(--muted)}
.pf-accent{color:var(--accent)}
.pf-h2{font-size:1.2rem;font-weight:800}
.pf-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:8px;display:block}
.pf-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

.pf-hero{padding:0}
.pf-banner{height:110px;background:linear-gradient(110deg,#ef4444,#ec4899 50%,#8b5cf6)}
.pf-hero-body{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;padding:0 26px 26px;margin-top:-52px}
.pf-avatar{position:relative;width:112px;height:112px;border-radius:50%;padding:0;border:4px solid var(--bg);background:var(--surface-2);cursor:pointer;flex-shrink:0;transition:transform .2s}
.pf-avatar:hover:not(:disabled){transform:scale(1.04)}
.pf-avatar:disabled{cursor:wait}
.pf-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
.pf-avatar-sm{width:84px;height:84px;border-width:3px}
.pf-avatar-badge{position:absolute;right:0;bottom:2px;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#ec4899);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid var(--bg)}
.pf-hero-info{flex:1;min-width:200px;padding-top:56px}
.pf-name{font-size:1.9rem;font-weight:900;letter-spacing:-.02em;line-height:1.15;word-break:break-word}
.pf-email{color:var(--muted);font-size:.9rem;margin-top:2px;word-break:break-all}
.pf-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.pf-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:11.5px;font-weight:600;background:var(--surface-2);border:1px solid var(--border);color:var(--muted)}
.pf-badge-ok{background:var(--ok-bg);color:var(--ok);border-color:transparent}
.pf-badge-warn{background:var(--warn-bg);color:var(--warn);border-color:transparent}
.pf-actions{display:flex;gap:10px;flex-wrap:wrap;padding-top:56px}
@media (max-width:640px){.pf-hero-info,.pf-actions{padding-top:0}.pf-hero-body{margin-top:-52px}.pf-actions{width:100%}}

.pf-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:13px;font-size:13px;font-weight:600;
  background:var(--surface-2);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s}
.pf-btn:hover:not(:disabled){border-color:var(--accent);transform:translateY(-1px)}
.pf-btn:disabled{opacity:.5;cursor:not-allowed}
.pf-btn-primary{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff;box-shadow:0 8px 20px rgba(236,72,153,.28)}
.pf-btn-primary:hover:not(:disabled){border-color:transparent;opacity:.93}
.pf-btn-danger{color:var(--err)}

.pf-msg{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:14px;font-size:13px;font-weight:600}
.pf-msg-ok{background:var(--ok-bg);color:var(--ok)}
.pf-msg-err{background:var(--err-bg);color:var(--err)}

.pf-input-wrap{position:relative;display:flex;align-items:center;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;transition:.2s}
.pf-input-wrap:focus-within{border-color:var(--accent)}
.pf-input-icon{position:absolute;left:16px;color:var(--muted);font-size:13px}
.pf-input{width:100%;background:transparent;border:0;outline:none;color:var(--text);padding:14px 60px 14px 42px;font-size:14px;font-family:inherit}
.pf-input::placeholder{color:var(--muted)}
.pf-input:disabled{opacity:.5}
.pf-count{position:absolute;right:14px;font-size:11px;color:var(--muted)}

.pf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.pf-stat{padding:18px;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.pf-stat-num{font-size:1.9rem;font-weight:900;line-height:1.1}
@media (max-width:520px){.pf-stats{grid-template-columns:1fr}}

.pf-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media (max-width:640px){.pf-grid{grid-template-columns:1fr}}
.pf-detail-row{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border);font-size:14px;font-weight:600;min-width:0}
.pf-detail-icon{color:var(--muted);font-size:13px;flex-shrink:0}

.pf-loading{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.pf-spinner{width:42px;height:42px;border-radius:50%;border:4px solid var(--accent);border-top-color:transparent;animation:pf-spin .8s linear infinite}
.pf-spinner-sm{width:18px;height:18px;border-width:2px;border-color:#fff;border-top-color:transparent;display:inline-block}
.pf-pulse{animation:pf-pulse 1s ease-in-out infinite}
.pf-fade{animation:pf-in .35s ease both}
@keyframes pf-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pf-spin{to{transform:rotate(360deg)}}
@keyframes pf-pulse{50%{opacity:.45}}
`;