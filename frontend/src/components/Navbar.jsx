import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import logo from "../assets/logo.png";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl nav-bg border-b border-line">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3 gap-4">

        {/* LEFT SIDE: LOGO & NAV */}
        <div className="flex items-center gap-8 lg:gap-14">
          
          {/* LOGO */}
          <Link to="/" className="group">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="MovieMind AI"
                className="h-12 w-12 md:h-14 md:w-14 object-contain rounded-xl border-2 border-red-500"
              />

              <div>
                <h1 className="text-xl md:text-3xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  MovieMind AI
                </h1>

                <p className="t-muted text-[10px] md:text-xs">
                  AI Powered Movie Discovery
                </p>
              </div>
            </div>
          </Link>

          {/* NAVIGATION */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              className="text-base font-semibold t-main hover:text-red-400 transition"
            >
              Home
            </Link>

            <Link
              to="/movies"
              className="text-base font-semibold t-main hover:text-pink-400 transition"
            >
              Movies
            </Link>

            <Link
              to="/chatbot"
              className="text-base font-semibold t-main hover:text-purple-400 transition"
            >
              AI Recommendation
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* SEARCH */}
          <div className="hidden lg:flex items-center gap-3 surface border border-line px-4 py-2 rounded-2xl backdrop-blur-xl">
            <FaSearch className="text-gray-400 text-sm" />

            <input
              type="text"
              placeholder="Search movies..."
              className="bg-transparent outline-none t-main placeholder:text-gray-500 w-36 xl:w-48 text-sm"
            />
          </div>

          {/* THEME TOGGLE */}
          <ThemeToggle />

          {/* LOGIN */}
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-2xl surface surface-hover border border-line t-main text-sm font-semibold backdrop-blur-xl transition-all duration-300"
          >
            Login
          </button>

          {/* PROFILE */}
          <button
            onClick={() => navigate("/profile")}
            className="px-4 py-2 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 transition-all duration-300 hover:scale-105"
          >
            Profile
          </button>

        </div>
      </div>
    </div>
  );
}

export default Navbar;