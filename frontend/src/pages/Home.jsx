import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
await signOut(auth);
import { useEffect, useState, useRef } from "react";

import { onAuthStateChanged } from "firebase/auth";

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
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_35%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_35%)] opacity-60"></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

      <div className="relative z-10">

        {/* NAVBAR */}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-10 py-5 md:py-8 border-b border-white/10 gap-4">

          <div>

            <h1 className="text-3xl md:text-5xl font-black leading-tight bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-white/50 mt-2 text-sm md:text-base">
              AI Powered Movie Discovery Platform
            </p>

          </div>

          {/* RIGHT */}

          <div className="flex gap-4 items-center">

            {!user ? (

              <button
                onClick={() => navigate("/login")}
                className="
                  px-6 py-3
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  hover:bg-white/10
                  transition
                "
              >
                Login
              </button>

            ) : (

             <div
  className="relative"
  ref={menuRef}
>

  <div
    onClick={() =>
      setShowMenu(!showMenu)
    }
    className="
      flex items-center gap-3
      px-4 md:px-5 py-2
      rounded-2xl
      bg-gradient-to-r
      from-red-500
      to-pink-500
      cursor-pointer
      hover:scale-105
      transition-all
    "
  >
    <img
      src={user.photoURL}
      alt="profile"
      className="
        w-8 h-8 md:w-10 md:h-10
        rounded-full
        object-cover
        border border-white/20
      "
    />

    <span className="font-semibold text-sm md:text-base">
      {user.displayName}
    </span>
  </div>

  
{showMenu && (
  <div
    className="
      absolute
      right-0
      mt-3
      w-72
      rounded-3xl
      border border-white/10
      bg-black/95
      backdrop-blur-xl
      overflow-hidden
      z-50
      shadow-[0_0_30px_rgba(255,0,100,0.2)]
    "
  >

    {/* Profile */}
    <button
      onClick={() => {
        setShowMenu(false);
        navigate("/profile");
      }}
      className="
        w-full
        text-left
        px-5
        py-4
        hover:bg-white/10
        transition-all
      "
    >
      👤 My Profile
    </button>

    {/* Performance */}
    <button
      onClick={() => {
        setShowMenu(false);
        navigate("/performance");
      }}
      className="
        w-full
        text-left
        px-5
        py-4
        hover:bg-white/10
        transition-all
      "
    >
      📊 Performance
    </button>

    {/* Settings */}
    <button
      onClick={() => {
        setShowMenu(false);
        navigate("/settings");
      }}
      className="
        w-full
        text-left
        px-5
        py-4
        hover:bg-white/10
        transition-all
      "
    >
      ⚙️ Settings
    </button>

    {/* Divider */}
    <div className="border-t border-white/10" />

    {/* Logout */}
    <button
      onClick={async () => {
        try {
          import { signOut } from "firebase/auth";
          setShowMenu(false);
          navigate("/login");
        } catch (error) {
          console.log(error);
        }
      }}
      className="
        w-full
        text-left
        px-5
        py-4
        text-red-400
        hover:bg-red-500/10
        transition-all
      "
    >
      🚪 Logout
    </button>

  </div>
)}
</div>

            )}

          </div>

        </div>

        {/* HERO */}

        <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-red-500/20 bg-red-500/10 text-sm text-red-300 mb-8">
            ● AI Powered Movie Discovery
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6">

            Discover Movies
            <br />

            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
              With AI Intelligence
            </span>

          </h1>

          <p className="max-w-3xl mx-auto text-base md:text-xl text-white/60 leading-relaxed mb-10">

            Personalized movie discovery powered by AI.
            Explore trending films, emotional stories,
            dark thrillers, sci-fi adventures and more.

          </p>

          {/* BUTTONS */}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">

            <button
              onClick={() => navigate("/movies")}
              className="
                w-full sm:w-auto
                px-8 md:px-10 py-4 md:py-5
                rounded-3xl
                bg-gradient-to-r
                from-red-500
                to-pink-500
                hover:scale-105
                transition-all
                shadow-[0_0_40px_rgba(255,0,100,0.4)]
                text-lg font-bold
              "
            >
              ▶ Explore Movies
            </button>

            <button
              onClick={() => navigate("/chatbot")}
              className="
                w-full sm:w-auto
                px-8 md:px-10 py-4 md:py-5
                rounded-3xl
                border border-white/10
                bg-white/5
                hover:bg-white/10
                transition-all
                text-lg font-bold
                backdrop-blur-xl
              "
            >
              ✨ AI Recommendation
            </button>

          </div>

        </section>

        {/* FEATURES */}

        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* CARD 1 */}

            <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:scale-[1.02] transition">

              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl mb-6">
                🎬
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Explore Movies
              </h2>

              <p className="text-white/60 leading-relaxed">
                Discover trending, top-rated, upcoming,
                action, thriller, romance, sci-fi and
                thousands of movies instantly.
              </p>

            </div>

            {/* CARD 2 */}

            <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:scale-[1.02] transition">

              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl mb-6">
                🤖
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                AI Recommendation
              </h2>

              <p className="text-white/60 leading-relaxed">
                Ask MovieMind AI anything about actors,
                genres, emotional movies, trailers,
                recommendations and more.
              </p>

            </div>

            {/* CARD 3 */}

            <div className="rounded-[35px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:scale-[1.02] transition">

              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-3xl mb-6">
                🔥
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Premium Experience
              </h2>

              <p className="text-white/60 leading-relaxed">
                Modern cinematic UI inspired by premium
                streaming platforms with immersive
                visuals and animations.
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Home;