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
 
  <div className="min-h-screen bg-black text-white relative overflow-hidden">

    {/* Background */}

    <div className="fixed inset-0 -z-10">

      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-red-600/20 blur-[180px]" />

      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-purple-600/20 blur-[180px]" />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

    </div>

    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* Header */}

      <div className="flex items-center justify-between mb-12">

        <div>

          <h1 className="text-6xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent">
            Performance Dashboard
          </h1>

          <p className="text-gray-400 mt-3 text-lg">
            Welcome back. Here's your movie journey.
          </p>

        </div>

        <button
          onClick={() => navigate("/")}
          className="
            px-6 py-3
            rounded-2xl
            bg-white/10
            border border-white/10
            hover:bg-white/20
            transition-all
          "
        >
          ← Back
        </button>

      </div>

      {/* Stats */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-pink-500/30 transition-all">

          <div className="text-4xl mb-4">🎬</div>

          <h2 className="text-5xl font-black">
            {stats.watchedCount || 0}
          </h2>

          <p className="text-gray-400 mt-3">
            Movies Watched
          </p>

        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-pink-500/30 transition-all">

          <div className="text-4xl mb-4">📚</div>

          <h2 className="text-5xl font-black">
            {stats.watchlistCount || 0}
          </h2>

          <p className="text-gray-400 mt-3">
            Watchlist
          </p>

        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-pink-500/30 transition-all">

          <div className="text-4xl mb-4">⏱</div>

          <h2 className="text-5xl font-black">
            {stats.watchHours || 0}h
          </h2>

          <p className="text-gray-400 mt-3">
            Watch Hours
          </p>

        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-pink-500/30 transition-all">

          <div className="text-4xl mb-4">🤖</div>

          <h2 className="text-5xl font-black text-pink-400">
            {stats.aiMatch || 70}%
          </h2>

          <p className="text-gray-400 mt-3">
            AI Match
          </p>

          <div className="mt-4 h-3 bg-white/10 rounded-full">

            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500"
              style={{
                width: `${stats.aiMatch || 70}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* Middle Section */}

      <div className="grid lg:grid-cols-2 gap-6 mt-10">

        {/* Genres */}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

          <h2 className="text-3xl font-bold mb-8">
            🎭 Favorite Genres
          </h2>

          <div className="space-y-6">

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

            <div>

              <div className="flex justify-between mb-2">
                <span>Thriller</span>
                <span>40%</span>
              </div>

              <div className="h-3 rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: "40%" }}
                />

              </div>

            </div>

          </div>

        </div>

        {/* Watch Progress */}

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

          <h2 className="text-3xl font-bold mb-8">
            ⏱ Watch Progress
          </h2>

          <div className="flex flex-col items-center justify-center h-[250px]">

            <h1 className="text-8xl font-black text-pink-500">
              {stats.watchHours || 0}h
            </h1>

            <p className="text-gray-400 mt-4">
              Total Hours Watched
            </p>

          </div>

        </div>

      </div>

      {/* Recent Activity */}

      <div className="mt-10 bg-white/5 border border-white/10 rounded-3xl p-8">

        <h2 className="text-3xl font-bold mb-8">
          🕒 Recent Activity
        </h2>

        <div className="space-y-4">

          <div className="p-5 rounded-2xl bg-white/5">
            📚 Added movies to Watchlist
          </div>

          <div className="p-5 rounded-2xl bg-white/5">
            🎬 Watched new movies
          </div>

          <div className="p-5 rounded-2xl bg-white/5">
            🤖 AI recommendations generated
          </div>

        </div>

      </div>

      {/* Bottom Cards */}

      <div className="grid lg:grid-cols-2 gap-6 mt-10">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

          <h2 className="text-3xl font-bold mb-6">
            🤖 AI Insights
          </h2>

          <div className="space-y-4">

            <div className="p-4 rounded-2xl bg-white/5">
              Favorite Genre: Sci-Fi
            </div>

            <div className="p-4 rounded-2xl bg-white/5">
              Recommendation Accuracy: {stats.aiMatch || 70}%
            </div>

            <div className="p-4 rounded-2xl bg-white/5">
              Viewing Style: Explorer
            </div>

          </div>

        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">

          <h2 className="text-3xl font-bold mb-6">
            🏆 Achievements
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div className="p-4 rounded-2xl bg-white/5 text-center">
              🎬 Explorer
            </div>

            <div className="p-4 rounded-2xl bg-white/5 text-center">
              📚 Collector
            </div>

            <div className="p-4 rounded-2xl bg-white/5 text-center">
              🤖 AI Fan
            </div>

            <div className="p-4 rounded-2xl bg-white/5 text-center">
              🔥 Active User
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
);
}