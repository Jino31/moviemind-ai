import { motion } from "framer-motion";
import {
  FaTimes,
  FaFire,
  FaHeart,
  FaClock,
  FaStar,
  FaRobot,
  FaFilm,
  FaBookmark,
} from "react-icons/fa";

export default function ProfileModal({ closeModal }) {
  const stats = [
    {
      title: "Movies Watched",
      value: "148",
      icon: <FaFilm />,
      glow: "from-red-500 to-pink-500",
    },
    {
      title: "Watchlist",
      value: "32",
      icon: <FaBookmark />,
      glow: "from-pink-500 to-purple-500",
    },
    {
      title: "AI Matches",
      value: "96%",
      icon: <FaRobot />,
      glow: "from-purple-500 to-indigo-500",
    },
    {
      title: "Hours Watched",
      value: "421h",
      icon: <FaClock />,
      glow: "from-orange-500 to-red-500",
    },
  ];

  const genres = [
    "Sci-Fi",
    "Thriller",
    "Action",
    "Drama",
    "Mystery",
    "Adventure",
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center px-6">
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-6xl rounded-[40px] overflow-hidden border border-white/10 bg-[#070707] shadow-[0_0_80px_rgba(255,0,100,0.15)]"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,0,90,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(120,0,255,0.18),transparent_35%)]"></div>

        {/* Close */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-red-500 transition duration-300"
        >
          <FaTimes />
        </button>

        <div className="relative z-10 p-10">
          {/* Top Section */}
          <div className="flex items-center gap-8 flex-wrap">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 p-[4px] shadow-[0_0_40px_rgba(255,0,120,0.5)]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-5xl font-black">
                  J
                </div>
              </div>

              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-400 border-4 border-black"></div>
            </motion.div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-5xl font-black">
                  Jino
                </h1>

                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-sm font-bold">
                  PREMIUM MEMBER
                </div>
              </div>

              <p className="text-gray-400 mt-3 text-lg">
                AI Powered Movie Explorer
              </p>

              {/* AI Taste */}
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">
                    AI Taste Match
                  </span>

                  <span className="text-pink-400 font-bold">
                    96%
                  </span>
                </div>

                <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "96%" }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 shadow-[0_0_25px_rgba(255,0,120,0.6)]"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mt-12">
            {stats.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{
                  y: -10,
                  scale: 1.03,
                }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
              >
                {/* Glow */}
                <div
                  className={`absolute inset-0 opacity-10 bg-gradient-to-br ${item.glow}`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${item.glow} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {item.icon}
                  </div>

                  <h2 className="mt-6 text-4xl font-black">
                    {item.value}
                  </h2>

                  <p className="text-gray-400 mt-2">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Favorite Genres */}
          <div className="mt-14">
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <FaFire className="text-red-500" />
              Favorite Genres
            </h2>

            <div className="flex flex-wrap gap-4">
              {genres.map((genre, index) => (
                <motion.div
                  key={index}
                  whileHover={{
                    scale: 1.08,
                    boxShadow:
                      "0px 0px 25px rgba(255,0,120,0.4)",
                  }}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-lg font-semibold cursor-pointer"
                >
                  {genre}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Continue Watching */}
          <div className="mt-14">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
              <FaHeart className="text-pink-500" />
              Continue Watching
            </h2>

            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  title: "Interstellar",
                  image:
                    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                },
                {
                  title: "The Batman",
                  image:
                    "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
                },
                {
                  title: "Dune",
                  image:
                    "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
                },
              ].map((movie, index) => (
                <motion.div
                  key={index}
                  whileHover={{
                    scale: 1.04,
                    y: -8,
                  }}
                  className="group relative rounded-3xl overflow-hidden border border-white/10"
                >
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-[240px] object-cover group-hover:scale-110 transition duration-700"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

                  <div className="absolute bottom-5 left-5">
                    <h3 className="text-2xl font-black">
                      {movie.title}
                    </h3>

                    <button className="mt-3 px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 font-semibold shadow-[0_0_20px_rgba(255,0,120,0.5)]">
                      Continue
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}