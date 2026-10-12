// src/components/AnnouncementBanner.jsx
//
// Shows the newest live announcement (and the maintenance notice, if on) at the
// top of every page. Updates instantly when the admin changes anything.
// Place it once in App.jsx, above <Routes>.

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

const STYLE = {
  info: "bg-sky-600 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-black",
};

const DISMISS_KEY = "dismissed_announcements";

function readDismissed() {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISS_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function AnnouncementBanner() {
  const [items, setItems] = useState([]);
  const [site, setSite] = useState({});
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const q = query(collection(db, "announcements"), where("active", "==", true));
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }))),
      () => setItems([])
    );
  }, []);

  useEffect(
    () => onSnapshot(doc(db, "config", "site"), (s) => setSite(s.data() || {}), () => setSite({})),
    []
  );

  const current = useMemo(() => {
    const visible = items.filter((a) => !dismissed.includes(a.id));
    visible.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    return visible[0] || null;
  }, [items, dismissed]);

  const dismiss = (id) => {
    const next = [...dismissed, id].slice(-50);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: banner just returns next visit */
    }
  };

  return (
    <>
      {site.maintenance ? (
        <div role="status" className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
          {site.maintenanceMessage || "We're doing some maintenance. Some features may be unavailable."}
        </div>
      ) : null}
      {current ? (
        <div role="status" className={`flex items-center gap-3 px-4 py-2 text-sm ${STYLE[current.type] || STYLE.info}`}>
          <p className="min-w-0 flex-1 text-center">
            <b>{current.title}</b>
            {current.message ? <span className="opacity-95"> — {current.message}</span> : null}
          </p>
          <button
            onClick={() => dismiss(current.id)}
            className="shrink-0 rounded px-2 py-0.5 text-lg leading-none opacity-80 hover:opacity-100"
            aria-label="Dismiss announcement"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}