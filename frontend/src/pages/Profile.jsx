import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

import {
  FaFilm,
  FaBookmark,
  FaRobot,
  FaClock,
} from "react-icons/fa";

function Profile() {

  const navigate = useNavigate();

  // =========================
  // FIREBASE USER
  // =========================

  const user = auth.currentUser;

  // =========================
  // REAL-TIME USER DATA
  // =========================

  const userName =
    user?.displayName || "Movie Lover";

  const userPhoto =
    user?.photoURL ||
    "https://i.pravatar.cc/300";

  const userEmail =
    user?.email || "No Email";

  // =========================
  // WATCHLIST DATA
  // =========================

  const watchlist =
    JSON.parse(
      localStorage.getItem("watchlist")
    ) || [];

  const moviesWatched =
    JSON.parse(
      localStorage.getItem("watchedMovies")
    ) || [];

  // =========================
  // DYNAMIC STATS
  // =========================

  const watchlistCount = watchlist.length;

  const watchedCount = moviesWatched.length;

  const watchHours =
    Math.floor(watchedCount * 2.3);

  const aiMatch =
    Math.min(
      70 + watchedCount,
      98
    );

  return (

    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0">

        <div
          className="
            absolute top-0 left-0
            w-[700px] h-[700px]
            bg-red-600/20
            blur-[180px]
          "
        ></div>

        <div
          className="
            absolute bottom-0 right-0
            w-[700px] h-[700px]
            bg-purple-600/20
            blur-[180px]
          "
        ></div>

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        ></div>

      </div>

      {/* NAVBAR */}
      <div
        className="
          fixed top-0 left-0 w-full z-50
          backdrop-blur-2xl
          bg-black/40
          border-b border-white/10
        "
      >

        <div
          className="
            max-w-7xl mx-auto
            flex items-center justify-between
            px-6 py-5
          "
        >

          {/* LOGO */}
          <div>

            <h1
              className="
                text-3xl md:text-5xl font-black leading-none
                bg-gradient-to-r
                from-red-500
                via-pink-500
                to-purple-500
                bg-clip-text
                text-transparent
              "
            >
              MovieMind AI
            </h1>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              AI Powered Movie Discovery Platform
            </p>

          </div>

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="
              px-6 py-3
              rounded-2xl
              bg-white/5
              border border-white/10
              text-white font-semibold
              backdrop-blur-xl
              transition-all duration-300
              hover:scale-105
            "
          >
            ← Back
          </button>

        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-44 pb-24">

        {/* PROFILE TOP */}
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">

          {/* AVATAR */}
          <div>

            <img
              src={userPhoto}
              alt="profile"
              className="
                w-40 h-40
                rounded-full
                object-cover
                border-4 border-pink-500
                shadow-[0_0_50px_rgba(236,72,153,0.5)]
              "
            />

          </div>

          {/* USER INFO */}
          <div className="flex-1">

            <h1
              className="
                text-5xl md:text-7xl font-black
                bg-gradient-to-r
                from-white
                to-pink-500
                bg-clip-text
                text-transparent
              "
            >
              {userName}
            </h1>

            <p className="text-lg md:text-2xl text-gray-400 mt-4">
              {userEmail}
            </p>

            {/* AI MATCH */}
            <div className="mt-10">

              <div className="flex justify-between mb-3">

                <span className="font-semibold text-lg">
                  AI Taste Match
                </span>

                <span className="text-pink-400 font-bold">
                  {aiMatch}%
                </span>

              </div>

              <div
                className="
                  w-full h-4
                  rounded-full
                  bg-white/10
                  overflow-hidden
                "
              >

                <div
                  className="
                    h-full rounded-full
                    bg-gradient-to-r
                    from-red-500
                    via-pink-500
                    to-purple-500
                  "
                  style={{
                    width: `${aiMatch}%`,
                  }}
                ></div>

              </div>

            </div>

          </div>

        </div>

        {/* STATS */}
        <div
          className="
            grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
            gap-6 mt-20
          "
        >

          {/* MOVIES */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-2xl">
              <FaFilm />
            </div>

            <h2 className="text-4xl font-black mt-6">
              {watchedCount}
            </h2>

            <p className="text-gray-400 mt-2">
              Movies Watched
            </p>

          </div>

          {/* WATCHLIST */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-2xl">
              <FaBookmark />
            </div>

            <h2 className="text-4xl font-black mt-6">
              {watchlistCount}
            </h2>

            <p className="text-gray-400 mt-2">
              Watchlist
            </p>

          </div>

          {/* AI */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-2xl">
              <FaRobot />
            </div>

            <h2 className="text-4xl font-black mt-6">
              {aiMatch}%
            </h2>

            <p className="text-gray-400 mt-2">
              AI Match
            </p>

          </div>

          {/* HOURS */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-2xl">
              <FaClock />
            </div>

            <h2 className="text-4xl font-black mt-6">
              {watchHours}h
            </h2>

            <p className="text-gray-400 mt-2">
              Watch Hours
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;