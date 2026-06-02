import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";


import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import {
  FaFilm,
  FaBookmark,
  FaRobot,
  FaClock,
} from "react-icons/fa";

function Profile() {
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef();

  const user = auth.currentUser;

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      localStorage.removeItem("user");

      alert("Logged out successfully");

      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const userName =
    user?.displayName || "Movie Lover";

  const userPhoto =
    user?.photoURL ||
    "https://i.pravatar.cc/300";

  const userEmail =
    user?.email || "No Email";

  const watchlist =
    JSON.parse(
      localStorage.getItem("watchlist")
    ) || [];

  const moviesWatched =
    JSON.parse(
      localStorage.getItem("watchedMovies")
    ) || [];

  const watchlistCount =
    watchlist.length;

  const watchedCount =
    moviesWatched.length;

  const watchHours =
    Math.floor(watchedCount * 2.3);

  const aiMatch =
    Math.min(
      70 + watchedCount,
      98
    );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background */}

      <div className="absolute inset-0">
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

      {/* Navbar */}

      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              AI Powered Movie Discovery Platform
            </p>
          </div>

          {/* Profile Dropdown */}

          <div
            className="relative"
            ref={menuRef}
          >
            <button
              onClick={() =>
                setShowMenu(!showMenu)
              }
              className="
                flex items-center gap-3
                px-4 py-2
                rounded-2xl
                bg-gradient-to-r
                from-red-500
                to-pink-500
                hover:scale-105
                transition
              "
            >
              <img
                src={userPhoto}
                alt=""
                className="w-8 h-8 rounded-full"
              />

              <span className="font-semibold">
                {userName}
              </span>
            </button>

            {showMenu && (
              <div
                className="
                  absolute right-0 mt-3
                  w-64
                  bg-black/95
                  border border-white/10
                  rounded-2xl
                  overflow-hidden
                  backdrop-blur-xl
                  shadow-2xl
                "
              >
                <button
                  onClick={() =>
                    navigate("/")
                  }
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  🏠 Home
                </button>

                <button
                  onClick={() =>
                    navigate("/movies")
                  }
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  🎬 Movies
                </button>

                <button
                  onClick={() =>
                    navigate("/chatbot")
                  }
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  🤖 AI Chatbot
                </button>

                <button
                  onClick={() =>
                    navigate("/profile")
                  }
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  👤 Profile
                </button>

                <button
                  onClick={() =>
                    alert(
                      "Settings Coming Soon"
                    )
                  }
                  className="w-full text-left px-5 py-4 hover:bg-white/10"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="
                    w-full text-left px-5 py-4
                    text-red-400
                    hover:bg-red-500/10
                  "
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-44 pb-24">
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          <img
            src={userPhoto}
            alt=""
            className="
              w-40 h-40
              rounded-full
              object-cover
              border-4 border-pink-500
              shadow-[0_0_50px_rgba(236,72,153,0.5)]
            "
          />

          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent">
              {userName}
            </h1>

            <p className="text-lg md:text-2xl text-gray-400 mt-4">
              {userEmail}
            </p>

            <div className="mt-10">
              <div className="flex justify-between mb-3">
                <span className="font-semibold text-lg">
                  AI Taste Match
                </span>

                <span className="text-pink-400 font-bold">
                  {aiMatch}%
                </span>
              </div>

              <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"
                  style={{
                    width: `${aiMatch}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-2xl">
              <FaFilm />
            </div>
            {/* Favorite Movies */}

<div className="mt-20">
  <h2 className="text-3xl font-bold mb-8">
    🎬 Favorite Movies
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[
      "Interstellar",
      "Inception",
      "Leo",
      "Avatar",
    ].map((movie) => (
      <div
        key={movie}
        className="
          p-6
          rounded-3xl
          bg-white/5
          border border-white/10
          backdrop-blur-xl
          hover:scale-105
          transition
        "
      >
        <h3 className="font-bold text-lg">
          {movie}
        </h3>
      </div>
    ))}
  </div>
</div>

{/* AI Recommendations */}

<div className="mt-20">
  <h2 className="text-3xl font-bold mb-8">
    🤖 AI Recommendations
  </h2>

  <div className="grid md:grid-cols-3 gap-6">
    {[
      "Sci-Fi",
      "Action",
      "Thriller",
    ].map((genre) => (
      <div
        key={genre}
        className="
          p-8
          rounded-3xl
          bg-gradient-to-r
          from-red-500/10
          to-purple-500/10
          border border-white/10
        "
      >
        <h3 className="text-xl font-bold">
          {genre}
        </h3>

        <p className="text-gray-400 mt-2">
          Recommended by AI
        </p>
      </div>
    ))}
  </div>
</div>

{/* Quick Actions */}

<div className="mt-20">
  <h2 className="text-3xl font-bold mb-8">
    ⚡ Quick Actions
  </h2>

  <div className="grid md:grid-cols-4 gap-6">
    <button
      onClick={() => navigate("/")}
      className="
        p-5 rounded-2xl
        bg-white/5
        border border-white/10
        hover:bg-white/10
      "
    >
      🏠 Home
    </button>

    <button
      onClick={() => navigate("/movies")}
      className="
        p-5 rounded-2xl
        bg-white/5
        border border-white/10
        hover:bg-white/10
      "
    >
      🎬 Movies
    </button>

    <button
      onClick={() => navigate("/chatbot")}
      className="
        p-5 rounded-2xl
        bg-white/5
        border border-white/10
        hover:bg-white/10
      "
    >
      🤖 Chatbot
    </button>

    <button
      onClick={handleLogout}
      className="
        p-5 rounded-2xl
        bg-red-500/10
        border border-red-500/20
        text-red-400
      "
    >
      🚪 Logout
    </button>
  </div>
</div>

            <h2 className="text-4xl font-black mt-6">
              {watchedCount}
            </h2>

            <p className="text-gray-400 mt-2">
              Movies Watched
            </p>
          </div>

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