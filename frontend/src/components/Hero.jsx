import logo from "../assets/logo.png";
export default function Hero({
  onGenreSelect,
}) {
  const genres = [
    { name: "🔥 Action", id: 28 },
    { name: "😂 Comedy", id: 35 },
    { name: "🚀 Sci-Fi", id: 878 },
    { name: "👻 Horror", id: 27 },
    { name: "❤️ Romance", id: 10749 },
    { name: "🧠 Thriller", id: 53 },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

      {/* BACKGROUND GLOW */}

      <div className="absolute inset-0">

        <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-red-600/20 blur-[160px] rounded-full" />

        <div className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-purple-600/20 blur-[180px] rounded-full" />

      </div>

      {/* GRID */}

      <div className="absolute inset-0 opacity-[0.04]">

        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

      </div>

      {/* CONTENT */}

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">

        {/* TOP BADGE */}

        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-red-500/20 bg-red-500/10 backdrop-blur-xl mb-10">

          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

          <span className="text-red-300 text-sm font-medium tracking-wide">
            AI Powered Movie Discovery
          </span>

        </div>

        {/* TITLE */}

        <h1 className="text-6xl md:text-8xl font-black leading-[0.95] tracking-tight">

          <span className="block text-white">
            Discover Movies
          </span>

          <span className="block mt-3 bg-gradient-to-r from-red-500 via-pink-400 to-red-300 bg-clip-text text-transparent">
            With AI Intelligence
          </span>

        </h1>

        {/* SUBTITLE */}

        <p className="max-w-3xl mx-auto text-gray-400 text-lg md:text-2xl mt-10 leading-relaxed">

          Personalized movie discovery powered by AI.
          Explore trending films, emotional stories,
          dark thrillers, sci-fi adventures and more —
          all tailored to your taste.

        </p>

        {/* BUTTONS */}

        <div className="flex flex-wrap justify-center gap-5 mt-12">

          <button className="px-8 py-4 rounded-full bg-red-600 hover:bg-red-500 transition duration-300 text-lg font-semibold shadow-2xl shadow-red-500/20">

            ▶ Explore Movies

          </button>

          <button className="px-8 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition duration-300 text-lg font-semibold">

            ✨ AI Recommendations

          </button>

        </div>

        {/* AI PROMPT BOX */}

        <div className="mt-20 max-w-4xl mx-auto glass rounded-[32px] p-10 border border-white/10 shadow-2xl">

          <h3 className="text-2xl font-bold mb-3">
            What mood are you in today?
          </h3>

          <p className="text-gray-400 mb-10">
            Choose a genre and let AI recommend
            the perfect movies for you.
          </p>

          {/* GENRES */}

          <div className="flex flex-wrap justify-center gap-4">

            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() =>
                  onGenreSelect(genre.id)
                }
                className="px-6 py-3 rounded-full bg-zinc-900 hover:bg-red-600 hover:scale-105 transition duration-300 font-medium border border-white/5"
              >
                {genre.name}
              </button>
            ))}

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-20">

          <div>

            <h2 className="text-5xl font-black text-red-500">
              10K+
            </h2>

            <p className="text-gray-400 mt-2">
              Movies Indexed
            </p>

          </div>

          <div>

            <h2 className="text-5xl font-black text-red-500">
              AI Powered
            </h2>

            <p className="text-gray-400 mt-2">
              Smart Recommendations
            </p>

          </div>

          <div>

            <h2 className="text-5xl font-black text-red-500">
              Real-Time
            </h2>

            <p className="text-gray-400 mt-2">
              Trending Discovery
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}