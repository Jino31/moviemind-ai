// src/components/FeedbackButton.jsx
//
// Floating "Feedback" button + modal. Submissions land in the admin panel live.
// Place it once in App.jsx (inside the Router).

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FaCheckCircle, FaCommentDots, FaStar, FaTimes } from "react-icons/fa";
import { auth, db } from "../firebase";

const CATEGORIES = ["Idea", "Bug", "Praise", "Other"];
const COOLDOWN_MS = 30000;

export default function FeedbackButton() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(auth.currentUser);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Idea");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const close = () => {
    setOpen(false);
    setSent(false);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return setError("Please write a short message.");

    let last = 0;
    try {
      last = Number(localStorage.getItem("feedback_last")) || 0;
    } catch {
      /* ignore */
    }
    if (Date.now() - last < COOLDOWN_MS) return setError("Please wait a few seconds before sending again.");

    setBusy(true);
    setError("");
    try {
      await addDoc(collection(db, "feedback"), {
        message: text.slice(0, 1000),
        rating,
        category,
        name: (user.displayName || "").slice(0, 100),
        email: (user.email || "").slice(0, 120),
        uid: user.uid,
        page: pathname.slice(0, 150),
        status: "new",
        createdAt: serverTimestamp(),
      });
      try {
        localStorage.setItem("feedback_last", String(Date.now()));
      } catch {
        /* ignore */
      }
      setSent(true);
      setMessage("");
      setRating(0);
    } catch {
      setError("Couldn't send right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mm-focus fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-500 md:bottom-6"
        aria-label="Send feedback"
      >
        <FaCommentDots /> <span className="hidden sm:inline">Feedback</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <div role="dialog" aria-modal="true" aria-label="Send feedback" className="mm-card t-main w-full max-w-md rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Send feedback</h2>
              <button onClick={close} className="t-muted mm-focus rounded p-1.5" aria-label="Close">
                <FaTimes />
              </button>
            </div>

            {!user ? (
              <p className="t-muted text-sm">
                Please{" "}
                <Link to="/login" onClick={close} className="font-semibold text-red-500 underline">
                  log in
                </Link>{" "}
                to send feedback.
              </p>
            ) : sent ? (
              <div className="py-6 text-center">
                <FaCheckCircle className="mx-auto mb-3 text-4xl text-emerald-500" />
                <p className="font-semibold">Thanks! We got it.</p>
                <button onClick={close} className="mm-btn mm-focus mt-4 rounded-xl px-4 py-2 text-sm font-semibold">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`mm-focus rounded-full px-3 py-1.5 text-xs font-semibold ${
                        category === c ? "bg-red-600 text-white" : "mm-btn"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setRating(n === rating ? 0 : n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      className="mm-focus rounded p-1"
                    >
                      <FaStar className={`text-xl ${n <= rating ? "text-amber-400" : "t-muted opacity-30"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="mm-field min-h-[110px] w-full resize-y rounded-xl px-3 py-2 text-sm"
                  placeholder="Tell us what you think…"
                  value={message}
                  maxLength={1000}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {error ? <p className="text-xs text-red-500">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="mm-focus w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}