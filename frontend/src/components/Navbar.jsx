// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaChevronDown,
  FaCog,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import ThemeToggle from "./ThemeToggle";

const menuItems = [
  {
    label: "My Profile",
    hint: "View and edit your account",
    to: "/profile",
    icon: FaUser,
    tint: "bg-red-500/15 text-red-500",
  },
  {
    label: "Performance",
    hint: "Your activity and stats",
    to: "/performance",
    icon: FaChartLine,
    tint: "bg-pink-500/15 text-pink-500",
  },
  {
    label: "Settings",
    hint: "Preferences and privacy",
    to: "/settings",
    icon: FaCog,
    tint: "bg-purple-500/15 text-purple-500",
  },
];

/* Profile photo with a letter fallback if the image is missing or fails to load */
function Avatar({ user, className = "h-8 w-8", textClass = "text-xs" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [user?.photoURL]);

  const initial = (user?.displayName || user?.email || "E")
    .trim()
    .charAt(0)
    .toUpperCase();

  if (user?.photoURL && !failed) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} flex-shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} ${textClass} flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 font-bold text-white`}
    >
      {initial}
    </span>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const menuRef = useRef(null);
  const mobileSearchRef = useRef(null);

  /* Auth state (authLoading prevents the Login button flashing on refresh) */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /* Close the profile menu on outside click / touch or Escape */
  useEffect(() => {
    if (!showMenu) return;

    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setShowMenu(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer, { passive: true });
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showMenu]);

  /* Stronger shadow once the page is scrolled */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menus whenever the route changes */
  useEffect(() => {
    setShowMenu(false);
    setShowSearch(false);
  }, [location.pathname]);

  /* Focus the mobile search field when it opens */
  useEffect(() => {
    if (showSearch) mobileSearchRef.current?.focus();
  }, [showSearch]);

  const handleSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    navigate(`/movies?q=${encodeURIComponent(term)}`);
    setShowSearch(false);
  };

  const handleLogout = async () => {
    setShowMenu(false);
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const firstName =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Explorer";

  return (
    <nav
      className={`nav-bg border-line fixed inset-x-0 top-0 z-50 border-b backdrop-blur-2xl transition-shadow duration-300 ${
        scrolled ? "shadow-lg" : "shadow-none"
      }`}
    >
      {/* Full width so the brand and controls sit in the corners */}
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* LEFT CORNER: BRAND */}
        <Link
          to="/"
          aria-label="MovieMind AI home"
          className="group flex flex-shrink-0 items-center gap-3"
        >
          <img
            src="/logo.png"
            alt=""
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105 md:h-11 md:w-11"
          />
          <div className="flex flex-col leading-tight">
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-lg font-black tracking-tight text-transparent md:text-xl">
              MovieMind AI
            </span>
            <span className="t-muted hidden text-[10px] font-semibold uppercase tracking-wide sm:block">
              AI Powered Movie Discovery
            </span>
          </div>
        </Link>

        {/* RIGHT CORNER: SEARCH, THEME, PROFILE */}
        <div className="flex items-center gap-2.5">
          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="surface border-line hidden items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-pink-500/60 md:flex"
          >
            <FaSearch className="t-muted text-xs" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              aria-label="Search movies"
              className="t-main t-placeholder w-36 bg-transparent text-xs outline-none placeholder:text-gray-400 lg:w-52"
            />
          </form>

          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            aria-label={showSearch ? "Close search" : "Open search"}
            aria-expanded={showSearch}
            className="surface surface-hover border-line t-main flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition md:hidden"
          >
            {showSearch ? (
              <FaTimes className="text-xs" />
            ) : (
              <FaSearch className="text-xs" />
            )}
          </button>

          <ThemeToggle />

          {/* Auth area */}
          {authLoading ? (
            <div
              aria-hidden="true"
              className="surface h-9 w-9 animate-pulse rounded-full sm:w-24"
            />
          ) : !user ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-pink-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/30 active:scale-95"
            >
              Login
            </button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={showMenu}
                aria-label="Open profile menu"
                className="surface surface-hover border-line flex cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 sm:pr-3"
              >
                <Avatar user={user} />
                <span className="t-main hidden max-w-[96px] truncate text-xs font-semibold sm:inline">
                  {firstName}
                </span>
                <FaChevronDown
                  aria-hidden="true"
                  className={`t-muted hidden text-[10px] transition-transform duration-300 sm:block ${
                    showMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile dropdown */}
              <div
                role="menu"
                aria-hidden={!showMenu}
                className={`menu-bg border-line absolute right-0 top-full mt-3 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-200 ${
                  showMenu
                    ? "visible translate-y-0 scale-100 opacity-100"
                    : "invisible -translate-y-1 scale-95 opacity-0"
                }`}
              >
                {/* Accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-500" />

                {/* Identity */}
                <div className="border-line flex items-center gap-3 border-b p-4">
                  <Avatar
                    user={user}
                    className="h-12 w-12"
                    textClass="text-base"
                  />
                  <div className="min-w-0">
                    <p className="t-main truncate text-sm font-bold">
                      {user.displayName || firstName}
                    </p>
                    <p className="t-muted truncate text-xs">{user.email}</p>
                  </div>
                </div>

                {/* Links */}
                <div className="p-2">
                  {menuItems.map(({ label, hint, to, icon: Icon, tint }) => (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      tabIndex={showMenu ? 0 : -1}
                      onClick={() => setShowMenu(false)}
                      className="surface-hover group flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
                    >
                      <span
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm transition-transform duration-300 group-hover:scale-110 ${tint}`}
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0">
                        <span className="t-main block text-sm font-semibold">
                          {label}
                        </span>
                        <span className="t-muted block truncate text-[11px]">
                          {hint}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-line border-t p-2">
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={showMenu ? 0 : -1}
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-red-500 transition hover:bg-red-500/10"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-sm">
                      <FaSignOutAlt />
                    </span>
                    <span className="text-sm font-semibold">Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search row */}
      {showSearch && (
        <form
          onSubmit={handleSearch}
          role="search"
          className="border-line border-t px-4 pb-3 pt-3 sm:px-6 md:hidden"
        >
          <div className="surface border-line flex items-center gap-2 rounded-xl border px-3 py-2.5 focus-within:border-pink-500/60">
            <FaSearch className="t-muted text-xs" aria-hidden="true" />
            <input
              ref={mobileSearchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies..."
              aria-label="Search movies"
              className="t-main w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </form>
      )}
    </nav>
  );
}

export default Navbar;