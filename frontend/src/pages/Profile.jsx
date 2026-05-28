import { useNavigate } from "react-router-dom";
import {
  FaFilm,
  FaBookmark,
  FaRobot,
  FaClock,
} from "react-icons/fa";

import userData from "../data/userData";

function Profile() {

  const navigate = useNavigate();

  return (

    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0">

        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-red-600/20 blur-[180px]"></div>

        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-purple-600/20 blur-[180px]"></div>

      </div>

      {/* NAVBAR */}
      <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">

        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

          <div>

            <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-gray-400 mt-1 text-sm">
              AI Powered Movie Discovery Platform
            </p>

          </div>

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500"
          >
            ← Back
          </button>

        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-44 pb-24">

        {/* PROFILE TOP */}
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">

          {/* AVATAR */}
          <div>

            <img
              src={userData.avatar}
              alt="profile"
              className="w-40 h-40 rounded-full object-cover border-4 border-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.5)]"
            />

          </div>

          {/* USER INFO */}
          <div className="flex-1">

            <h1 className="text-5xl font-black bg-gradient-to-r from-white to-pink-500 bg-clip-text text-transparent">
              {userData.name}
            </h1>

            <p className="text-lg text-gray-400 mt-3">
              {userData.bio}
            </p>

            {/* AI MATCH */}
            <div className="mt-8">

              <div className="flex justify-between mb-3">

                <span className="font-semibold text-base">
                  AI Taste Match
                </span>

                <span className="text-pink-400 font-bold">
                  {userData.aiMatch}%
                </span>

              </div>

              <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden">

                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500"
                  style={{
                    width: `${userData.aiMatch}%`,
                  }}
                ></div>

              </div>

            </div>

          </div>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">

          {[
            {
              icon: <FaFilm />,
              value: userData.moviesWatched,
              title: "Movies Watched",
              color: "from-red-500 to-pink-500",
            },

            {
              icon: <FaBookmark />,
              value: userData.watchlistCount,
              title: "Watchlist",
              color: "from-pink-500 to-purple-500",
            },

            {
              icon: <FaRobot />,
              value: `${userData.aiMatch}%`,
              title: "AI Match",
              color: "from-purple-500 to-indigo-500",
            },

            {
              icon: <FaClock />,
              value: `${userData.watchHours}h`,
              title: "Watch Hours",
              color: "from-orange-500 to-red-500",
            },

          ].map((item, index) => (

            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
            >

              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center text-xl`}>
                {item.icon}
              </div>

              <h2 className="text-4xl font-black mt-6">
                {item.value}
              </h2>

              <p className="text-gray-400 mt-2">
                {item.title}
              </p>

            </div>

          ))}

        </div>

      </div>
    </div>
  );
}

export default Profile;