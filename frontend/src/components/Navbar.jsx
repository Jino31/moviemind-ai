import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3">

        {/* LEFT SIDE: LOGO & NAV */}
        <div className="flex items-center gap-8 lg:gap-12">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="MovieMind AI"
              className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-xl"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                MovieMind AI
              </h1>
              <p className="text-gray-400 text-[10px] md:text-xs">
                AI Powered Movie Discovery Platform
              </p>
            </div>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm lg:text-base font-semibold text-gray-300 hover:text-red-400 transition">
              Home
            </Link>
            <Link to="/movies" className="text-sm lg:text-base font-semibold text-gray-300 hover:text-pink-400 transition">
              Movies
            </Link>
            <Link to="/chatbot" className="text-sm lg:text-base font-semibold text-gray-300 hover:text-purple-400 transition">
              AI Recommendation
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* SEARCH */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl">
            <FaSearch className="text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search movies..."
              className="bg-transparent outline-none text-white placeholder:text-gray-500 text-sm w-36 xl:w-48"
            />
          </div>

          <ThemeToggle />

          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm font-semibold hover:bg-gray-800 transition"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 transition hover:scale-105"
          >
            Profile
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;