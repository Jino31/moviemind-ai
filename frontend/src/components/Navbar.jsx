import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-black/40 border-b border-white/10">

      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-14">

          {/* LOGO */}
          <Link
            to="/"
            className="group"
          >
            <h1 className="
              text-5xl
              font-black
              bg-gradient-to-r
              from-red-500
              via-pink-500
              to-purple-500
              bg-clip-text
              text-transparent
              transition
              duration-300
              group-hover:scale-105
            ">
              MovieMind AI
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              AI Powered Movie Discovery Platform
            </p>
          </Link>

          {/* NAV LINKS */}
          <div className="hidden md:flex items-center gap-10">

            <Link
              to="/"
              className="
                relative
                text-lg
                font-semibold
                text-white
                hover:text-red-400
                transition
                duration-300
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[3px]
                after:bg-red-500
                after:transition-all
                after:duration-300
                hover:after:w-full
              "
            >
              Home
            </Link>

            <Link
              to="/movies"
              className="
                relative
                text-lg
                font-semibold
                text-white
                hover:text-pink-400
                transition
                duration-300
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[3px]
                after:bg-pink-500
                after:transition-all
                after:duration-300
                hover:after:w-full
              "
            >
              Movies
            </Link>

            <Link
              to="/chatbot"
              className="
                relative
                text-lg
                font-semibold
                text-white
                hover:text-purple-400
                transition
                duration-300
                after:absolute
                after:left-0
                after:-bottom-2
                after:w-0
                after:h-[3px]
                after:bg-purple-500
                after:transition-all
                after:duration-300
                hover:after:w-full
              "
            >
              AI Recommendation
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-5">

          {/* SEARCH */}
          <div className="
            hidden lg:flex
            items-center
            gap-3
            bg-white/5
            border
            border-white/10
            px-5
            py-3
            rounded-2xl
            backdrop-blur-xl
            transition
            duration-300
            focus-within:border-pink-500
            focus-within:shadow-[0_0_30px_rgba(255,0,120,0.25)]
          ">
            <FaSearch className="text-gray-400" />

            <input
              type="text"
              placeholder="Search movies..."
              className="
                bg-transparent
                outline-none
                text-white
                placeholder:text-gray-500
                w-56
              "
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={() => navigate("/login")}
            className="
              px-6
              py-3
              rounded-2xl
              bg-white/5
              border
              border-white/10
              text-white
              font-semibold
              backdrop-blur-xl
              transition-all
              duration-300
              hover:bg-white/10
              hover:scale-105
              hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]
              active:scale-95
            "
          >
            Login
          </button>

          {/* PROFILE BUTTON */}
          <button
            onClick={() => navigate("/profile")}
            className="
              relative
              overflow-hidden
              px-7
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
              hover:shadow-[0_0_35px_rgba(255,0,120,0.6)]
              active:scale-95
            "
          >
            <span className="relative z-10">
              Profile
            </span>

            {/* Glow */}
            <div className="
              absolute
              inset-0
              opacity-0
              hover:opacity-100
              transition
              duration-500
              bg-white/10
            "></div>
          </button>

        </div>
      </div>
    </div>
  );
}

export default Navbar;