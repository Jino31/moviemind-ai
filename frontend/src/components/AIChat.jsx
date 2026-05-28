import { useState } from "react";

export default function AIChat({
  onGenreSelect,
}) {
  const [open, setOpen] = useState(false);

  const suggestions = [
    {
      text: "🔥 Action Movies",
      genre: 28,
    },
    {
      text: "😂 Comedy Movies",
      genre: 35,
    },
    {
      text: "🚀 Sci-Fi Movies",
      genre: 878,
    },
    {
      text: "👻 Horror Movies",
      genre: 27,
    },
    {
      text: "❤️ Romance Movies",
      genre: 10749,
    },
    {
      text: "🧠 Thriller Movies",
      genre: 53,
    },
  ];

  return (
    <>
      {/* Floating Button */}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-2xl shadow-2xl red-glow"
      >
        🤖
      </button>

      {/* Chat Box */}

      {open && (
        <div className="fixed bottom-28 right-6 w-[340px] glass rounded-3xl p-6 z-50 shadow-2xl border border-white/10">

          <h2 className="text-2xl font-bold mb-2">
            MovieMind AI
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Ask AI to recommend movies
          </p>

          <div className="space-y-3">

            {suggestions.map((item) => (
              <button
                key={item.genre}
                onClick={() => {
                  onGenreSelect(item.genre);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-red-600 transition"
              >
                {item.text}
              </button>
            ))}

          </div>
        </div>
      )}
    </>
  );
}