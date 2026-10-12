// src/components/AdSlot.jsx
//
// Renders one live ad for a placement ("home", "movies", "details").
// Ads created in the admin panel with placement "all" show everywhere.
// Usage:  <AdSlot placement="home" className="my-6" />

import { useEffect, useRef, useState } from "react";
import { collection, doc, increment, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";

const safeUrl = (value) => {
  try {
    const u = new URL(String(value).trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch {
    return "";
  }
};

export default function AdSlot({ placement = "home", className = "" }) {
  const [ad, setAd] = useState(null);
  const [imgOk, setImgOk] = useState(true);
  const counted = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "ads"), where("active", "==", true));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => a.placement === "all" || a.placement === placement);
        // keep showing the same ad while it stays live, otherwise pick another
        setAd((prev) => list.find((a) => a.id === prev?.id) || list[Math.floor(Math.random() * list.length)] || null);
      },
      () => setAd(null)
    );
  }, [placement]);

  // count one view per ad per mount
  useEffect(() => {
    if (!ad || counted.current === ad.id) return;
    counted.current = ad.id;
    setImgOk(true);
    updateDoc(doc(db, "ads", ad.id), { impressions: increment(1) }).catch(() => {});
  }, [ad]);

  const href = ad ? safeUrl(ad.linkUrl) : "";
  const image = ad ? safeUrl(ad.imageUrl) : "";
  if (!ad || !href) return null;

  return (
    <aside className={`mm-card overflow-hidden rounded-2xl ${className}`} aria-label="Sponsored">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => updateDoc(doc(db, "ads", ad.id), { clicks: increment(1) }).catch(() => {})}
        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
      >
        {image && imgOk ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-28 w-full rounded-xl object-cover sm:h-24 sm:w-44"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <span className="t-muted text-[10px] font-bold uppercase tracking-widest">Sponsored</span>
          <p className="t-main text-base font-bold">{ad.title}</p>
          {ad.text ? <p className="t-muted mt-0.5 text-sm">{ad.text}</p> : null}
        </div>
        <span className="shrink-0 self-start rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white sm:self-center">
          {ad.cta || "Learn more"}
        </span>
      </a>
    </aside>
  );
}