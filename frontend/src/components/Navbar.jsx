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
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/60 dark:bg-black/80 backdrop-blur-3xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-6">

        {/* LEFT: BRAND LOGO & TITLE */}
        <Link to="/" className="flex items-center gap-3.5 group flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <img
              src="/logo.png"
              alt="MovieMind AI"
              className="relative h-11 w-11 md:h-12 md:w-12 object-contain rounded-2xl border border-white/20 bg-black/40 group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent tracking-tight leading-tight">
              MovieMind AI
            </span>
            <span className="text-gray-400 text-[10px] md:text-xs font-semibold tracking-wide uppercase opacity-80">
              AI Cinematic Engine
            </span>
          </div>
        </Link>

        {/* CENTER: ICONIC NAV CHIPS */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-2xl shadow-inner">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaCompass className="text-red-400" /> Home
          </Link>
          <Link
            to="/movies"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaFilm className="text-pink-400" /> Movies
          </Link>
          <Link
            to="/chatbot"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaRobot className="text-purple-400" /> AI Matrix
          </Link>
        </div>

        {/* RIGHT: SEARCH, THEME, PROFILE/LOGIN */}
        <div className="flex items-center gap-3">
          
          {/* SEARCH BOX */}
          <div className="hidden xl:flex items-center gap-2.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-xl focus-within:border-red-500/50 transition">
            <FaSearch className="text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search films..."
              className="bg-transparent outline-none text-white placeholder:text-gray-500 text-xs w-36 2xl:w-48 font-medium"
            />
          </div>

          <ThemeToggle />

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-white text-xs font-bold hover:bg-red-500/30 transition-all shadow-md cursor-pointer"
            >
              Login Matrix
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <div
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white cursor-pointer hover:scale-105 transition-all select-none shadow-[0_0_20px_rgba(255,0,100,0.3)]"
              >
                <img
                  src={
                    user.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
                  }
                  alt="profile"
                  className="w-8 h-8 rounded-xl object-cover border border-white/30 flex-shrink-0"
                />
                <span className="font-bold text-xs hidden sm:inline pr-1">
                  {user.displayName?.split(" ")[0] || "Explorer"}
                </span>
              </div>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-white/15 bg-black/95 backdrop-blur-3xl overflow-hidden z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                  <div className="p-4 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/profile");
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-white/10 transition-all font-semibold text-xs text-gray-200 hover:text-white cursor-pointer flex items-center gap-3"
                  >
                    👤 My Profile Matrix
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/performance");
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-white/10 transition-all font-semibold text-xs text-gray-200 hover:text-white cursor-pointer flex items-center gap-3"
                  >
                    📊 Performance Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-5 py-3.5 hover:bg-white/10 transition-all font-semibold text-xs text-gray-200 hover:text-white cursor-pointer flex items-center gap-3"
                  >
                    ⚙️ System Settings
                  </button>

                  <div className="border-t border-white/10" />

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
                    className="w-full text-left px-5 py-3.5 text-red-400 hover:bg-red-500/20 transition-all font-bold text-xs cursor-pointer flex items-center gap-3"
                  >
                    🚪 Terminate Session (Logout)
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