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
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-3 gap-4">

        {/* LEFT SIDE: LOGO & NAV LINKS */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="MovieMind AI"
              className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-xl border border-white/10 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                MovieMind AI
              </h1>
              <p className="text-gray-400 text-[10px] md:text-xs">
                AI Powered Movie Discovery
              </p>
            </div>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm lg:text-base font-semibold t-main hover:text-red-400 transition">
              Home
            </Link>
            <Link to="/movies" className="text-sm lg:text-base font-semibold t-main hover:text-pink-400 transition">
              Movies
            </Link>
            <Link to="/chatbot" className="text-sm lg:text-base font-semibold t-main hover:text-purple-400 transition">
              AI Recommendation
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE: SEARCH, THEME, PROFILE/LOGIN */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* SEARCH BAR */}
          <div className="hidden lg:flex items-center gap-2 surface border border-line px-3 py-2 rounded-xl">
            <FaSearch className="text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search movies..."
              className="bg-transparent outline-none t-main placeholder:text-gray-500 text-sm w-36 xl:w-48"
            />
          </div>

          <ThemeToggle />

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl surface surface-hover border border-line t-main text-sm font-semibold transition"
            >
              Login
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <div
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white cursor-pointer hover:scale-105 transition-all select-none"
              >
                <img
                  src={
                    user.photoURL ||
                    "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
                  }
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <span className="font-semibold text-sm hidden sm:inline">
                  {user.displayName || "Explorer"}
                </span>
              </div>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-line menu-bg backdrop-blur-xl overflow-hidden z-50 shadow-[0_0_30px_rgba(255,0,100,0.2)]">
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