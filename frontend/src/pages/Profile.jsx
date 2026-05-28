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

        <div className="
          absolute top-0 left-0
          w-[700px] h-[700px]
          bg-red-600/20
          blur-[180px]
        "></div>

        <div className="
          absolute bottom-0 right-0
          w-[700px] h-[700px]
          bg-purple-600/20
          blur-[180px]
        "></div>

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
            px-8 py-6
          "
        >

          {/* LOGO */}
          <div>

            <h1
              className="
                text-5xl font-black leading-none
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

            <p className="text-gray-400 mt-2">
              AI Powered Movie Discovery Platform
            </p>

          </div>

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="
              px-8 py-4
              rounded-2xl
              bg-white/5
              border border-white/10
              text-white font-semibold
              backdrop-blur-xl
              transition-all duration-300
              hover:scale-105
              hover:bg-gradient-to-r
              hover:from-red-500
              hover:to-pink-500
              hover:border-transparent
              hover:shadow-[0_0_35px_rgba(236,72,153,0.5)]
              active:scale-95
            "
          >
            ← Back
          </button>

        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-52 pb-24">

        {/* PROFILE TOP */}
        <div className="flex flex-col lg:flex-row gap-14 items-center lg:items-start">

          {/* AVATAR */}
          <div>

            <img
              src={userData.avatar}
              alt="profile"
              className="
                w-48 h-48
                rounded-full
                object-cover
                border-4 border-pink-500
                shadow-[0_0_50px_rgba(236,72,153,0.5)]
              "
            />

          </div>

          {/* USER INFO */}
          <div className="flex-1">

            <h1 className="
              text-7xl font-black
              bg-gradient-to-r
              from-white
              to-pink-500
              bg-clip-text
              text-transparent
            ">
              {userData.name}
            </h1>

            <p className="text-2xl text-gray-400 mt-4">
              {userData.bio}
            </p>

            {/* AI MATCH */}
            <div className="mt-10">

              <div className="flex justify-between mb-3">

                <span className="font-semibold text-lg">
                  AI Taste Match
                </span>

                <span className="text-pink-400 font-bold">
                  {userData.aiMatch}%
                </span>

              </div>

              <div className="
                w-full h-5
                rounded-full
                bg-white/10
                overflow-hidden
              ">

                <div
                  className="
                    h-full rounded-full
                    bg-gradient-to-r
                    from-red-500
                    via-pink-500
                    to-purple-500
                    shadow-[0_0_30px_rgba(236,72,153,0.7)]
                  "
                  style={{
                    width: `${userData.aiMatch}%`,
                  }}
                ></div>

              </div>

            </div>

            {/* BUTTONS */}
            <div className="flex gap-5 mt-10 flex-wrap">

              <button
                className="
                  px-8 py-4
                  rounded-2xl
                  bg-gradient-to-r
                  from-red-500
                  to-pink-500
                  font-bold
                  transition-all duration-300
                  hover:scale-105
                  hover:shadow-[0_0_35px_rgba(236,72,153,0.6)]
                "
              >
                Edit Profile
              </button>

              <button
                className="
                  px-8 py-4
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  font-bold
                  transition-all duration-300
                  hover:scale-105
                  hover:bg-white/10
                "
              >
                Watchlist
              </button>

            </div>

          </div>

        </div>

        {/* STATS */}
        <div className="
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
          gap-8 mt-20
        ">

          {/* CARD */}
          <div className="
            rounded-3xl
            border border-white/10
            bg-white/5
            backdrop-blur-xl
            p-8
          ">

            <div className="
              w-16 h-16 rounded-2xl
              bg-gradient-to-r
              from-red-500
              to-pink-500
              flex items-center justify-center
              text-2xl
            ">
              <FaFilm />
            </div>

            <h2 className="text-6xl font-black mt-8">
              {userData.moviesWatched}
            </h2>

            <p className="text-gray-400 mt-2 text-xl">
              Movies Watched
            </p>

          </div>

          {/* CARD */}
          <div className="
            rounded-3xl
            border border-white/10
            bg-white/5
            backdrop-blur-xl
            p-8
          ">

            <div className="
              w-16 h-16 rounded-2xl
              bg-gradient-to-r
              from-pink-500
              to-purple-500
              flex items-center justify-center
              text-2xl
            ">
              <FaBookmark />
            </div>

            <h2 className="text-6xl font-black mt-8">
              {userData.watchlistCount}
            </h2>

            <p className="text-gray-400 mt-2 text-xl">
              Watchlist
            </p>

          </div>

          {/* CARD */}
          <div className="
            rounded-3xl
            border border-white/10
            bg-white/5
            backdrop-blur-xl
            p-8
          ">

            <div className="
              w-16 h-16 rounded-2xl
              bg-gradient-to-r
              from-purple-500
              to-indigo-500
              flex items-center justify-center
              text-2xl
            ">
              <FaRobot />
            </div>

            <h2 className="text-6xl font-black mt-8">
              {userData.aiMatch}%
            </h2>

            <p className="text-gray-400 mt-2 text-xl">
              AI Match
            </p>

          </div>

          {/* CARD */}
          <div className="
            rounded-3xl
            border border-white/10
            bg-white/5
            backdrop-blur-xl
            p-8
          ">

            <div className="
              w-16 h-16 rounded-2xl
              bg-gradient-to-r
              from-orange-500
              to-red-500
              flex items-center justify-center
              text-2xl
            ">
              <FaClock />
            </div>

            <h2 className="text-6xl font-black mt-8">
              {userData.watchHours}h
            </h2>

            <p className="text-gray-400 mt-2 text-xl">
              Watch Hours
            </p>

          </div>

        </div>

        {/* RECENTLY WATCHED */}
        <div className="mt-24">

          <h2 className="
            text-5xl font-black mb-10
            bg-gradient-to-r
            from-white
            to-pink-500
            bg-clip-text
            text-transparent
          ">
            Recently Watched
          </h2>

          <div className="
            grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
            gap-8
          ">

            {userData.recentlyWatched.map((movie) => (

              <div
                key={movie.id}
                className="
                  relative rounded-3xl overflow-hidden
                  border border-white/10
                  group cursor-pointer
                  hover:scale-105
                  transition-all duration-500
                "
              >

                <img
                  src={movie.image}
                  alt={movie.title}
                  className="
                    w-full h-[420px]
                    object-cover
                    group-hover:scale-110
                    transition-all duration-700
                  "
                />

                <div className="
                  absolute inset-0
                  bg-gradient-to-t
                  from-black
                  via-black/20
                  to-transparent
                "></div>

                <div className="
                  absolute bottom-0 left-0
                  p-6
                ">

                  <h3 className="
                    text-3xl font-black
                    mb-4
                  ">
                    {movie.title}
                  </h3>

                  <button
                    className="
                      px-6 py-3
                      rounded-xl
                      bg-gradient-to-r
                      from-red-500
                      to-pink-500
                      font-bold
                      hover:scale-105
                      transition-all duration-300
                    "
                  >
                    Continue Watching
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;