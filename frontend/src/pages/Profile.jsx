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

  const user = auth.currentUser;

  // LOGOUT

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

  // USER

  const userName =
    user?.displayName || "Movie Lover";

  const userPhoto =
    user?.photoURL ||
    "https://i.pravatar.cc/300";

  const userEmail =
    user?.email || "No Email";

  // WATCHLIST

  const watchlist =
    JSON.parse(
      localStorage.getItem("watchlist")
    ) || [];

  const moviesWatched =
    JSON.parse(
      localStorage.getItem("watchedMovies")
    ) || [];

  // STATS

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

      {/* BG */}

      <div className="absolute inset-0">

        <div
          className="
            absolute top-0 left-0
            w-[500px] md:w-[700px]
            h-[500px] md:h-[700px]
            bg-red-600/20
            blur-[180px]
          "
        ></div>

        <div
          className="
            absolute bottom-0 right-0
            w-[500px] md:w-[700px]
            h-[500px] md:h-[700px]
            bg-purple-600/20
            blur-[180px]
          "
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
            flex flex-col md:flex-row
            items-start md:items-center
            justify-between
            px-4 md:px-6
            py-4 gap-4
          "
        >

          {/* LOGO */}

          <div>

            <h1
              className="
                text-3xl md:text-5xl
                font-black
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

            <p className="text-gray-400 mt-2 text-xs md:text-sm">
              AI Powered Movie Discovery Platform
            </p>

          </div>

          {/* BUTTONS */}

          <div className="flex gap-3 w-full md:w-auto">

            <button
              onClick={() => navigate(-1)}
              className="
                flex-1 md:flex-none
                px-5 py-3
                rounded-2xl
                bg-white/5
                border border-white/10
                text-white font-semibold
              "
            >
              ← Back
            </button>

            <button
              onClick={handleLogout}
              className="
                flex-1 md:flex-none
                px-5 py-3
                rounded-2xl
                bg-red-500
                text-white
                font-semibold
              "
            >
              Logout
            </button>

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-40 pb-20">

        {/* PROFILE */}

        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">

          {/* IMAGE */}

          <div>

            <img
              src={userPhoto}
              alt="profile"
              className="
                w-28 h-28 md:w-40 md:h-40
                rounded-full
                object-cover
                border-4 border-pink-500
              "
            />

          </div>

          {/* DETAILS */}

          <div className="flex-1 text-center lg:text-left">

            <h1
              className="
                text-3xl sm:text-4xl md:text-7xl
                font-black
                bg-gradient-to-r
                from-white
                to-pink-500
                bg-clip-text
                text-transparent
              "
            >
              {userName}
            </h1>

            <p className="text-sm md:text-xl text-gray-400 mt-4 break-all">
              {userEmail}
            </p>

            {/* AI */}

            <div className="mt-8">

              <div className="flex justify-between mb-3">

                <span className="font-semibold text-sm md:text-lg">
                  AI Taste Match
                </span>

                <span className="text-pink-400 font-bold">
                  {aiMatch}%
                </span>

              </div>

              <div
                className="
                  w-full h-3 md:h-4
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
            grid grid-cols-2 lg:grid-cols-4
            gap-4 md:gap-6 mt-14
          "
        >

          {/* MOVIES */}

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-6">

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-xl md:text-2xl">
              <FaFilm />
            </div>

            <h2 className="text-2xl md:text-4xl font-black mt-4">
              {watchedCount}
            </h2>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Movies Watched
            </p>

          </div>

          {/* WATCHLIST */}

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-6">

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-xl md:text-2xl">
              <FaBookmark />
            </div>

            <h2 className="text-2xl md:text-4xl font-black mt-4">
              {watchlistCount}
            </h2>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Watchlist
            </p>

          </div>

          {/* AI */}

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-6">

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xl md:text-2xl">
              <FaRobot />
            </div>

            <h2 className="text-2xl md:text-4xl font-black mt-4">
              {aiMatch}%
            </h2>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              AI Match
            </p>

          </div>

          {/* HOURS */}

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-6">

            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-xl md:text-2xl">
              <FaClock />
            </div>

            <h2 className="text-2xl md:text-4xl font-black mt-4">
              {watchHours}h
            </h2>

            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Watch Hours
            </p>

          </div>

        </div>

      </div>

    </div>

  );
}

export default Profile;