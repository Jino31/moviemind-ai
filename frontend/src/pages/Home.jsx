import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_35%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_35%)] opacity-60"></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

      {/* CONTENT */}
      <div className="relative z-10">

        {/* NAVBAR */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-white/10">

          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-white/50 mt-2 text-sm">
              AI Powered Movie Discovery Platform
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="px-5 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition text-sm"
            >
              Profile
            </button>
          </div>
        </div>

        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-red-500/20 bg-red-500/10 text-xs text-red-300 mb-8">
            ● AI Powered Movie Discovery
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-8">
            Discover Movies
            <br />

            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
              With AI Intelligence
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg text-white/60 leading-relaxed mb-14">
            Personalized movie discovery powered by AI.
            Explore trending films, emotional stories,
            dark thrillers, sci-fi adventures and more.
          </p>

          {/* BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-6">

            <button
              onClick={() => navigate("/movies")}
              className="px-8 py-4 rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,0,100,0.4)] text-base font-bold"
            >
              ▶ Explore Movies
            </button>

            <button
              onClick={() => navigate("/chatbot")}
              className="px-8 py-4 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-base font-bold backdrop-blur-xl"
            >
              ✨ AI Recommendation
            </button>

          </div>
        </section>

      </div>
    </div>
  );
}

export default Home;