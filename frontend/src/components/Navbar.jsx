// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaCompass, FaRobot, FaFilm } from "react-icons/fa";
import { auth } from "../firebase";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 nav-bg backdrop-blur-2xl border-b border-line shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">

        {/* LEFT: BRAND LOGO & TITLE */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <img
            src="/logo.png"
            alt="MovieMind AI"
            className="h-10 w-10 md:h-11 md:w-11 object-contain bg-transparent group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent leading-tight">
              MovieMind AI
            </span>
            <span className="t-muted text-[9px] md:text-[10px] font-semibold tracking-wide uppercase">
              AI Powered Movie Discovery
            </span>
          </div>
        </Link>

        {/* CENTER: NAV CHIPS */}
        <div className="hidden md:flex items-center gap-1.5 surface border border-line px-3 py-1.5 rounded-full backdrop-blur-xl">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold t-main hover:text-red-500 hover:surface-hover transition"
          >
            <FaCompass className="text-red-500 text-xs" /> Home
          </Link>
          <Link
            to="/movies"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold t-main hover:text-pink-500 hover:surface-hover transition"
          >
            <FaFilm className="text-pink-500 text-xs" /> Movies
          </Link>
          <Link
            to="/chatbot"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold t-main hover:text-purple-500 hover:surface-hover transition"
          >
            <FaRobot className="text-purple-500 text-xs" /> AI Recommendation
          </Link>
        </div>

        {/* RIGHT: SEARCH, THEME, PROFILE/LOGIN */}
        <div className="flex items-center gap-2.5">
          
          {/* SEARCH BOX */}
          <div className="hidden lg:flex items-center gap-2 surface border border-line px-3 py-1.5 rounded-xl backdrop-blur-xl">
            <FaSearch className="text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search movies..."
              className="bg-transparent outline-none t-main placeholder:text-gray-400 text-xs w-32 xl:w-44"
            />
          </div>

          <ThemeToggle />

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="px-3.5 py-1.5 rounded-xl surface surface-hover border border-line t-main text-xs font-semibold transition cursor-pointer"
            >
              Login
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <div
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white cursor-pointer hover:scale-105 transition-all select-none shadow-sm"
              >
                <img
                  src={
                    user.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
                  }
                  alt="profile"
                  className="w-6 h-6 rounded-full object-cover border border-white/20 flex-shrink-0"
                />
                <span className="font-semibold text-xs hidden sm:inline">
                  {user.displayName?.split(" ")[0] || "Explorer"}
                </span>
              </div>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-line menu-bg backdrop-blur-2xl overflow-hidden z-50 shadow-2xl">
                  <div className="p-3 border-b border-line surface">
                    <p className="text-[10px] t-muted">Signed in as</p>
                    <p className="text-xs font-bold t-main truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/profile");
                    }}
                    className="w-full text-left px-4 py-3 surface-hover transition font-semibold text-xs t-main cursor-pointer"
                  >
                    👤 My Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/performance");
                    }}
                    className="w-full text-left px-4 py-3 surface-hover transition font-semibold text-xs t-main cursor-pointer"
                  >
                    📊 Performance
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-4 py-3 surface-hover transition font-semibold text-xs t-main cursor-pointer"
                  >
                    ⚙️ Settings
                  </button>

                  <div className="border-t border-line" />

                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                        setShowMenu(false);
                        navigate("/login");
                      } catch (error) {
                        console.error("Sign out error:", error);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 transition font-semibold text-xs cursor-pointer"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;