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
    const unsubscribe = auth.onAuthStateChanged(
      async (user) => {
        if (!user) return;

        try {
          const snap = await getDoc(
            doc(db, "users", user.uid)
          );

          if (snap.exists()) {
            setStats((prev) => ({
              ...prev,
              ...snap.data(),
            }));
          }
        } catch (error) {
          console.log(error);
        }
      }
    );

    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-red-600/20 blur-[180px]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-purple-600/20 blur-[180px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* Header */}
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent">
          Performance Dashboard
        </h1>

        <p className="text-gray-400 mt-4 text-xl">
          Track your movie journey and AI insights
        </p>

        <div className="mt-8 mb-10">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
          >
            ← Back
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-5xl font-black">
              {stats.watchedCount || 0}
            </h2>
            <p className="text-gray-400 mt-3">
              Movies Watched
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-5xl font-black">
              {stats.watchlistCount || 0}
            </h2>
            <p className="text-gray-400 mt-3">
              Watchlist
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-5xl font-black">
              {stats.watchHours || 0}h
            </h2>
            <p className="text-gray-400 mt-3">
              Watch Hours
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-5xl font-black text-pink-400">
              {stats.aiMatch || 70}%
            </h2>

            <p className="text-gray-400 mt-3">
              AI Match
            </p>

            <div className="mt-4 h-3 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500"
                style={{
                  width: `${stats.aiMatch || 70}%`,
                }}
              />
            </div>
          </div>

        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mt-12">

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              🎬 Favorite Genres
            </h2>

            <div className="space-y-4">

              <div>
                <div className="flex justify-between mb-2">
                  <span>Sci-Fi</span>
                  <span>70%</span>
                </div>

                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-pink-500"
                    style={{ width: "70%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span>Action</span>
                  <span>55%</span>
                </div>

                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: "55%" }}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              ⏱ Watch Progress
            </h2>

            <div className="text-center">
              <h1 className="text-6xl font-black text-pink-500">
                {stats.watchHours || 0}h
              </h1>

              <div className="mt-6 h-3 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{
                    width: `${Math.min(
                      (stats.watchHours || 0) * 5,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="text-gray-400 mt-4">
                Total Hours Watched
              </p>
            </div>
          </div>

        </div>

        {/* Recent Activity */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-3xl font-bold mb-6">
            🕒 Recent Activity
          </h2>

          <div className="space-y-4">

            {stats.watchlistCount > 0 && (
              <div className="p-4 rounded-2xl bg-white/5">
                📚 Added movies to watchlist
              </div>
            )}

            {stats.watchedCount > 0 && (
              <div className="p-4 rounded-2xl bg-white/5">
                🎬 Watched movies recently
              </div>
            )}

            <div className="p-4 rounded-2xl bg-white/5">
              🤖 AI recommendations generated
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6 mt-12">

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-6">
              🤖 AI Insights
            </h2>

            <p className="text-gray-300 leading-relaxed">
              You seem to enjoy Action and Sci-Fi movies.
              AI confidence level is currently{" "}
              {stats.aiMatch || 70}%.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-6">
              🏆 Achievements
            </h2>

            <div className="space-y-4">

              {stats.watchedCount >= 1 && (
                <div className="p-4 rounded-2xl bg-white/5">
                  🎬 First Movie Watched
                </div>
              )}

              {stats.watchlistCount >= 5 && (
                <div className="p-4 rounded-2xl bg-white/5">
                  📚 Watchlist Builder
                </div>
              )}

              {stats.aiMatch >= 80 && (
                <div className="p-4 rounded-2xl bg-white/5">
                  🤖 AI Expert
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}