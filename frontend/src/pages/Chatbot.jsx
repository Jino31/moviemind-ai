import { useState } from "react";

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi 👋 I am MovieMind AI. Ask me anything about movies, actors, genres, moods, trailers, or recommendations.",
    },
  ]);

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
    };

    let aiText = "";

    const lower = input.toLowerCase();

    if (lower.includes("action")) {
      aiText =
        "🔥 Best Action Movies:\n\n• John Wick\n• Mad Max Fury Road\n• Extraction\n• The Dark Knight\n• Mission Impossible Fallout";
    } else if (lower.includes("comedy")) {
      aiText =
        "😂 Best Comedy Movies:\n\n• The Hangover\n• Superbad\n• Free Guy\n• 21 Jump Street\n• Deadpool";
    } else if (lower.includes("horror")) {
      aiText =
        "👻 Best Horror Movies:\n\n• The Conjuring\n• Insidious\n• Hereditary\n• Smile\n• IT";
    } else if (lower.includes("romance")) {
      aiText =
        "💖 Best Romance Movies:\n\n• Titanic\n• La La Land\n• Me Before You\n• The Notebook";
    } else if (lower.includes("sci")) {
      aiText =
        "🚀 Best Sci-Fi Movies:\n\n• Interstellar\n• Dune\n• Inception\n• Blade Runner 2049\n• The Matrix";
    } else if (lower.includes("thriller")) {
      aiText =
        "🕵 Best Thriller Movies:\n\n• Se7en\n• Prisoners\n• Zodiac\n• Gone Girl\n• Shutter Island";
    } else if (lower.includes("vijay")) {
      aiText =
        "🔥 Best Vijay Movies:\n\n• Leo\n• Ghilli\n• Thuppakki\n• Master\n• Kaththi\n• Bigil";
    } else {
      aiText =
        "🎬 Recommended Movies:\n\n• Interstellar\n• The Dark Knight\n• Inception\n• Avengers Endgame\n• Fight Club";
    }

    const aiReply = {
      role: "ai",
      text: aiText,
    };

    setMessages((prev) => [...prev, userMessage, aiReply]);

    setInput("");
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_30%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_30%)] opacity-60"></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:55px_55px]"></div>

      <div className="relative z-10 flex flex-col h-screen">

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 backdrop-blur-xl">

          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-white/40 text-sm mt-1">
              AI Powered Recommendation Assistant
            </p>
          </div>

          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105 transition"
          >
            Back
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* MOOD CARD */}
          <div className="max-w-4xl mx-auto mb-10">

            <div className="rounded-[35px] border border-white/10 bg-gradient-to-b from-blue-950/30 to-black backdrop-blur-xl p-8 text-center shadow-2xl">

              <h2 className="text-4xl font-black mb-3">
                What mood are you in today?
              </h2>

              <p className="text-white/50 mb-8">
                Choose a genre and let AI recommend the perfect movie for you.
              </p>

              <div className="flex flex-wrap justify-center gap-4">

                <button
                  onClick={() => setInput("Best action movies")}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/20 transition"
                >
                  🔥 Action
                </button>

                <button
                  onClick={() => setInput("Best comedy movies")}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-pink-500/20 transition"
                >
                  😂 Comedy
                </button>

                <button
                  onClick={() => setInput("Best sci-fi movies")}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-purple-500/20 transition"
                >
                  🚀 Sci-Fi
                </button>

                <button
                  onClick={() => setInput("Best horror movies")}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-900/30 transition"
                >
                  👻 Horror
                </button>

                <button
                  onClick={() => setInput("Best romance movies")}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-pink-400/20 transition"
                >
                  💖 Romance
                </button>

                <button
                  onClick={() => setInput("Best thriller movies")}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-yellow-500/20 transition"
                >
                  🕵 Thriller
                </button>

              </div>
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div className="max-w-5xl mx-auto space-y-5 pb-32">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] whitespace-pre-line rounded-3xl px-6 py-5 border border-white/10 shadow-xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-red-500 to-pink-500"
                      : "bg-white/5 backdrop-blur-xl"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* INPUT BAR */}
        <div className="border-t border-white/10 bg-black/40 backdrop-blur-2xl p-5">

          <div className="max-w-6xl mx-auto flex gap-4">

            <input
              type="text"
              placeholder="Ask MovieMind AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 rounded-3xl bg-white/5 border border-white/10 px-6 py-5 outline-none focus:border-pink-500 transition"
            />

            <button
              onClick={handleSend}
              className="px-10 rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 font-bold hover:scale-105 transition shadow-[0_0_30px_rgba(255,0,100,0.35)]"
            >
              Send
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;