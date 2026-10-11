// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"; // 👈 Import Footer

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen app-bg overflow-hidden font-sans relative">
      {/* PREMIUM BACKDROP GRAPHIC ARRAYS & GRID PATTERN */}
      <div className="absolute inset-0 backdrop-glow pointer-events-none"></div>
      <div className="absolute inset-0 grid-lines pointer-events-none"></div>

      <div className="relative z-10">
        {/* NAVBAR */}
        <Navbar />

        {/* HERO CALL TO ACTION */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 pt-36 md:pt-44 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-red-500/20 bg-red-500/10 text-sm text-red-500 mb-8 font-semibold animate-pulse shadow-sm">
            ● AI Powered Movie Discovery
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 tracking-tight">
            Discover Movies
            <br />
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-fuchsia-500 bg-clip-text text-transparent">
              With AI Intelligence
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base md:text-xl t-muted leading-relaxed mb-12 font-medium">
            Personalized movie discovery powered by AI. Explore trending films,
            emotional stories, dark thrillers, sci-fi adventures and more.
          </p>

          {/* BUTTON ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 md:gap-6">
            <button
              onClick={() => navigate("/movies")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 text-white hover:scale-105 active:scale-98 transition-all shadow-[0_0_40px_rgba(255,0,100,0.4)] text-lg font-bold cursor-pointer"
            >
              ▶ Explore Movies Trailers
            </button>

            <button
              onClick={() => navigate("/find-your-movie")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-3xl border border-line surface surface-hover hover:scale-105 active:scale-98 transition-all text-lg font-bold backdrop-blur-xl t-main cursor-pointer shadow-sm"
            >
              🔍 Find Your Movie
            </button>

            <button
              onClick={() => navigate("/chatbot")}
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-3xl border border-line surface surface-hover hover:scale-105 active:scale-98 transition-all text-lg font-bold backdrop-blur-xl t-main cursor-pointer shadow-sm"
            >
              ✨ AI Recommendation
            </button>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-[35px] border border-line surface backdrop-blur-2xl p-8 md:p-10 hover:scale-[1.02] transition duration-300 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                🎬
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight t-main">
                Explore Movies
              </h2>
              <p className="t-muted leading-relaxed text-sm md:text-base font-medium">
                Discover trending, top-rated, upcoming, action, thriller,
                romance, sci-fi and thousands of movies instantly.
              </p>
            </div>

            <div className="rounded-[35px] border border-line surface backdrop-blur-2xl p-8 md:p-10 hover:scale-[1.02] transition duration-300 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                🤖
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight t-main">
                AI Recommendation
              </h2>
              <p className="t-muted leading-relaxed text-sm md:text-base font-medium">
                Ask MovieMind AI anything about actors, genres, emotional
                movies, trailers, recommendations and more.
              </p>
            </div>

            <div className="rounded-[35px] border border-line surface backdrop-blur-2xl p-8 md:p-10 hover:scale-[1.02] transition duration-300 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-3xl mb-6 shadow-inner">
                🔥
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight t-main">
                Premium Experience
              </h2>
              <p className="t-muted leading-relaxed text-sm md:text-base font-medium">
                Modern x-axis UI inspired by high-end streaming platforms with
                immersive visuals, depth shadows, and hardware accelerated
                canvas animations.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
}

export default Home;