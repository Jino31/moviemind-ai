import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Performance() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    watchlistCount: 0,
    watchedCount: 0,
    watchHours: 0,
    aiMatch: 70,
  });

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;

      if (!user) return;

      const snap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (snap.exists()) {
        setStats(snap.data());
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_35%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_35%)] opacity-50"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-8">

        <button
          onClick={() => navigate("/")}
          className="mb-8 px-6 py-3 rounded-2xl bg-white/10"
        >
          ← Back
        </button>

        <h1 className="text-6xl font-black mb-4">
          📊 Performance Dashboard
        </h1>

        <p className="text-white/60 text-xl mb-12">
          Track your movie journey
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-5xl font-black">
              {stats.watchedCount || 0}
            </h2>
            <p className="text-white/60 mt-3">
              Movies Watched
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-5xl font-black">
              {stats.watchlistCount || 0}
            </h2>
            <p className="text-white/60 mt-3">
              Watchlist
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-5xl font-black">
              {stats.watchHours || 0}h
            </h2>
            <p className="text-white/60 mt-3">
              Watch Hours
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h2 className="text-5xl font-black">
              {stats.aiMatch || 70}%
            </h2>
            <p className="text-white/60 mt-3">
              AI Match
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}