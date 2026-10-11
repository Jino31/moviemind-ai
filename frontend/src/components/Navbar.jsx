// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
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
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-3.5 flex items-center justify-between gap-6">

        {/* LEFT CORNER: LOGO & BRAND */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/logo.png"
              alt="MovieMind AI"
              className="h-11 w-11 md:h-12 md:w-12 object-contain group-hover:scale-105 transition-transform flex-shrink-0"
            />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent leading-none">
                MovieMind AI
              </h1>
              <p className="t-muted text-[10px] md:text-xs font-semibold mt-1">
                AI Powered Movie Discovery
              </p>
            </div>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-sm font-bold t-main hover:text-red-500 transition">
              Home
            </Link>
            <Link to="/movies" className="text-sm font-bold t-main hover:text-pink-500 transition">
              Movies
            </Link>
            <Link to="/chatbot" className="text-sm font-bold t-main hover:text-purple-500 transition">
              AI Recommendation
            </Link>
          </div>
        </div>

        {/* RIGHT CORNER: SEARCH, THEME, PROFILE / LOGIN */}
        <div className="flex items-center gap-4">
          
          {/* SEARCH BAR */}
          <div className="hidden xl:flex items-center gap-3 surface border border-line px-4 py-2 rounded-2xl backdrop-blur-xl">
            <FaSearch className="text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search movies..."
              className="bg-transparent outline-none t-main placeholder:text-gray-400 text-sm w-44"
            />
          </div>

          <ThemeToggle />

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-2xl surface surface-hover border border-line t-main text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              Login
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <div
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white cursor-pointer hover:scale-105 transition-all select-none shadow-md"
              >
                <img
                  src={
                    user.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
                  }
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
                />
                <span className="font-bold text-sm hidden sm:inline">
                  {user.displayName || "Explorer"}
                </span>
              </div>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-line menu-bg backdrop-blur-3xl overflow-hidden z-50 shadow-[0_0_30px_rgba(255,0,100,0.2)]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/profile");
                    }}
                    className="w-full text-left px-5 py-4 surface-hover transition-all font-semibold text-sm cursor-pointer t-main"
                  >
                    👤 My Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/performance");
                    }}
                    className="w-full text-left px-5 py-4 surface-hover transition-all font-semibold text-sm cursor-pointer t-main"
                  >
                    📊 Performance
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-5 py-4 surface-hover transition-all font-semibold text-sm cursor-pointer t-main"
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
                    className="w-full text-left px-5 py-4 text-red-500 hover:bg-red-500/10 transition-all font-semibold text-sm cursor-pointer"
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