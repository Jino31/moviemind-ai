// src/pages/Home.jsx

import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ThemeToggle from "../components/ThemeToggle";

function Home() {
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
    <div className="min-h-screen app-bg overflow-hidden font-sans">
      {/* PREMIUM BACKDROP GRAPHIC ARRAYS */}
      <div className="absolute inset-0 backdrop-glow"></div>
      <div className="absolute inset-0 grid-lines"></div>

      <div className="relative z-10">
        {/* NAVBAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-5 md:py-8 border-b border-line gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
              MovieMind AI
            </h1>
            <p className="t-muted mt-2 text-sm md:text-base">
              AI Powered Movie Discovery Platform
            </p>
          </div>

          {/* RIGHT PROFILE AREA */}
          <div className="flex gap-4 items-center">
            <ThemeToggle />

            {!user ? (
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 rounded-2xl border border-line surface surface-hover t-main transition cursor-pointer font-bold text-sm"
              >
                Login
              </button>
            ) : (
              <div className="relative" ref={menuRef}>
                <div
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 px-4 md:px-5 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white cursor-pointer hover:scale-105 transition-all select-none"
                >
                  <img
                    src={
                      user.photoURL ||
                      "https://cdn-icons-png.flaticon.com/512/3177/3177440.png"
                    }
                    alt="profile"
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-white/20"
                  />
                  <span className="font-semibold text-sm md:text-base">
                    {user.displayName || "Explorer"}
                  </span>
                </div>

                {showMenu && (
                  <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-line menu-bg backdrop-blur-xl overflow-hidden z-50 shadow-[0_0_30px_rgba(255,0,100,0.2)]">
                    {/* Profile Link */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-5 py-4 surface-hover transition-all font-semibold text-sm cursor-pointer t-main"
                    >
                      👤 My Profile
                    </button>

                    {/* Performance Link */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/performance");
                      }}
                      className="w-full text-left px-5 py-4 surface-hover transition-all font-semibold text-sm cursor-pointer t-main"
                    >
                      📊 Performance
                    </button>

                    {/* Settings Link */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/settings");
                      }}
                      className="w-full text-left px-5 py-4 surface-hover transition-all font-semibold text-sm cursor-pointer t-main"
                    >
                      ⚙️ Settings
                    </button>

                    {/* Divider Break */}
                    <div className="border-t border-line" />

                    {/* Logout Trigger */}
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

        {/* HERO CALL TO ACTION */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-red-500/20 bg-red-500/10 text-sm text-red-500 mb-8 font-medium animate-pulse">
            ● AI Powered Movie Discovery
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 tracking-tight">
            Discover Movies
            <br />
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
              With AI Intelligence
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base md:text-xl t-muted leading-relaxed mb-10 font-medium">
            Personalized movie discovery powered by AI. Explore trending films,
            emotional stories, dark thrillers, sci-fi adventures and more.
          </p>

          {/* BUTTON ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <button
              onClick={() => navigate("/movies")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:scale-105 active:scale-98 transition-all shadow-[0_0_40px_rgba(255,0,100,0.4)] text-lg font-bold cursor-pointer"
            >
              ▶ Explore Movies Trailers
            </button>

            <button
              onClick={() => navigate("/find-your-movie")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-3xl border border-line surface surface-hover hover:scale-105 active:scale-98 transition-all text-lg font-bold backdrop-blur-xl t-main cursor-pointer"
            >
              🔍 Find Your Movie
            </button>

            <button
              onClick={() => navigate("/chatbot")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-3xl border border-line surface surface-hover hover:scale-105 active:scale-98 transition-all text-lg font-bold backdrop-blur-xl t-main cursor-pointer"
            >
              ✨ AI Recommendation
            </button>
          </div>
        </section>

        {/* FEATURE BLOCKS */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FEATURE A */}
            <div className="rounded-[35px] border border-line surface backdrop-blur-xl p-8 hover:scale-[1.02] transition duration-300">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                🎬
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                Explore Movies
              </h2>
              <p className="t-muted leading-relaxed text-sm md:text-base">
                Discover trending, top-rated, upcoming, action, thriller,
                romance, sci-fi and thousands of movies instantly.
              </p>
            </div>

            {/* FEATURE B */}
            <div className="rounded-[35px] border border-line surface backdrop-blur-xl p-8 hover:scale-[1.02] transition duration-300">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                🤖
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                AI Recommendation
              </h2>
              <p className="t-muted leading-relaxed text-sm md:text-base">
                Ask MovieMind AI anything about actors, genres, emotional
                movies, trailers, recommendations and more.
              </p>
            </div>

            {/* FEATURE C */}
            <div className="rounded-[35px] border border-line surface backdrop-blur-xl p-8 hover:scale-[1.02] transition duration-300">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                🔥
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                Premium Experience
              </h2>
              <p className="t-muted leading-relaxed text-sm md:text-base">
                Modern x-axis UI inspired by high-end streaming platforms with
                immersive visuals, depth shadows, and hardware accelerated
                canvas animations.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;