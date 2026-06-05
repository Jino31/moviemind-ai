import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 md:px-8 py-4 gap-4">

        {/* LEFT SIDE */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-14">

          {/* LOGO */}
          <Link to="/" className="group">
            <div className="flex items-center gap-3">

              <img
  src={logo}
  alt="MovieMind AI"
  className="h-32 w-32 border-4 border-red-500"
/>

              <div>
                <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  MovieMind AI
                </h1>

                <p className="text-gray-400 text-xs md:text-sm mt-1">
                  AI Powered Movie Discovery Platform
                </p>
              </div>

            </div>
          </Link>

          {/* NAVIGATION */}
          <div className="hidden md:flex items-center gap-6 lg:gap-10">

            <Link
              to="/"
              className="text-base lg:text-lg font-semibold text-white hover:text-red-400 transition"
            >
              Home
            </Link>

            <Link
              to="/movies"
              className="text-base lg:text-lg font-semibold text-white hover:text-pink-400 transition"
            >
              Movies
            </Link>

            <Link
              to="/chatbot"
              className="text-base lg:text-lg font-semibold text-white hover:text-purple-400 transition"
            >
              AI Recommendation
            </Link>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-wrap items-center gap-3 md:gap-5 w-full lg:w-auto">

          {/* SEARCH */}
          <div
            className="
              hidden lg:flex
              items-center
              gap-3
              bg-white/5
              border border-white/10
              px-5 py-3
              rounded-2xl
              backdrop-blur-xl
            "
          >
            <FaSearch className="text-gray-400" />

            <input
              type="text"
              placeholder="Search movies..."
              className="
                bg-transparent
                outline-none
                text-white
                placeholder:text-gray-500
                w-40 xl:w-56
              "
            />
          </div>

          {/* LOGIN */}
          <button
            onClick={() => navigate("/login")}
            className="
              px-5 md:px-6
              py-3
              rounded-2xl
              bg-white/5
              border border-white/10
              text-white
              font-semibold
              backdrop-blur-xl
              transition-all
              duration-300
              hover:bg-white/10
            "
          >
            Login
          </button>

          {/* PROFILE */}
          <button
            onClick={() => navigate("/profile")}
            className="
              px-5 md:px-7
              py-3
              rounded-2xl
              font-bold
              text-white
              bg-gradient-to-r
              from-red-500
              via-pink-500
              to-purple-500
              transition-all
              duration-300
              hover:scale-105
            "
          >
            Profile
          </button>

        </div>
      </div>
    </div>
  );
}

export default Navbar;