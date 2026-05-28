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

  const lower = input.toLowerCase();

  let aiText = "";

  // =========================
  // GREETINGS
  // =========================

  if (
    lower.includes("hi") ||
    lower.includes("hello") ||
    lower.includes("hey")
  ) {

    aiText =
      "👋 Hello! I am MovieMind AI.\n\nAsk me about:\n• Movies\n• Actors\n• Genres\n• Trailers\n• Recommendations\n• IMDb ratings\n• Sci-Fi, Horror, Action and more.";

  }

  // =========================
  // ACTION
  // =========================

  else if (
    lower.includes("action")
  ) {

    aiText =
      "🔥 Best Action Movies:\n\n• John Wick\n• Mad Max Fury Road\n• Extraction\n• Mission Impossible Fallout";

  }

  // =========================
  // COMEDY
  // =========================

  else if (
    lower.includes("comedy")
  ) {

    aiText =
      "😂 Best Comedy Movies:\n\n• The Hangover\n• Superbad\n• Free Guy\n• Deadpool";

  }

  // =========================
  // HORROR
  // =========================

  else if (
    lower.includes("horror")
  ) {

    aiText =
      "👻 Best Horror Movies:\n\n• The Conjuring\n• Insidious\n• The Nun\n• Smile";

  }

  // =========================
  // ROMANCE
  // =========================

  else if (
    lower.includes("romance") ||
    lower.includes("love")
  ) {

    aiText =
      "💖 Best Romance Movies:\n\n• Titanic\n• La La Land\n• Me Before You\n• The Notebook";

  }

  // =========================
  // THRILLER
  // =========================

  else if (
    lower.includes("thriller")
  ) {

    aiText =
      "🕵️ Best Thriller Movies:\n\n• Shutter Island\n• Prisoners\n• Gone Girl\n• Se7en";

  }

  // =========================
  // SCI-FI
  // =========================

  else if (
    lower.includes("sci") ||
    lower.includes("space")
  ) {

    aiText =
      "🚀 Best Sci-Fi Movies:\n\n• Interstellar\n• Inception\n• Dune\n• Blade Runner 2049";

  }

  // =========================
  // SUPERHERO
  // =========================

  else if (
    lower.includes("marvel") ||
    lower.includes("superhero") ||
    lower.includes("dc")
  ) {

    aiText =
      "🦸 Best Superhero Movies:\n\n• Avengers Endgame\n• The Batman\n• Spider-Man No Way Home\n• Joker";

  }

  // =========================
  // ANIME
  // =========================

  else if (
    lower.includes("anime")
  ) {

    aiText =
      "🎌 Best Anime Movies:\n\n• Your Name\n• Spirited Away\n• Weathering With You\n• Suzume";

  }

  // =========================
  // ACTORS
  // =========================

  else if (
    lower.includes("leo") ||
    lower.includes("leonardo")
  ) {

    aiText =
      "⭐ Best Leonardo DiCaprio Movies:\n\n• Inception\n• Titanic\n• The Revenant\n• Wolf of Wall Street";

  }

  else if (
    lower.includes("srk") ||
    lower.includes("shah rukh")
  ) {

    aiText =
      "🎬 Best Shah Rukh Khan Movies:\n\n• Jawan\n• Pathaan\n• My Name Is Khan\n• Chennai Express";

  }

  else if (
    lower.includes("vijay")
  ) {

    aiText =
      "🔥 Best Vijay Movies:\n\n• Leo\n• Master\n• Ghilli\n• Thuppakki";

  }

  else if (
    lower.includes("rajini")
  ) {

    aiText =
      "🌟 Best Rajinikanth Movies:\n\n• Jailer\n• Baasha\n• Sivaji\n• Enthiran";

  }

  // =========================
  // MOOD BASED
  // =========================

  else if (
    lower.includes("sad")
  ) {

    aiText =
      "😢 Emotional Movies:\n\n• The Green Mile\n• Hachi\n• A Silent Voice\n• Grave of the Fireflies";

  }

  else if (
    lower.includes("happy")
  ) {

    aiText =
      "😊 Feel Good Movies:\n\n• Zindagi Na Milegi Dobara\n• 3 Idiots\n• Coco\n• Free Guy";

  }

  else if (
    lower.includes("motiv")
  ) {

    aiText =
      "💪 Motivational Movies:\n\n• Rocky\n• Pursuit of Happyness\n• Whiplash\n• Bhaag Milkha Bhaag";

  }

  // =========================
  // TRAILER
  // =========================

  else if (
    lower.includes("trailer")
  ) {

    aiText =
      "🎥 You can watch official trailers on YouTube by searching the movie name followed by 'official trailer'.";

  }

  // =========================
  // RATING
  // =========================

  else if (
    lower.includes("rating") ||
    lower.includes("imdb")
  ) {

    aiText =
      "⭐ IMDb ratings help identify top movies.\n\nMovies above 8.0 are usually highly recommended.";

  }

  // =========================
  // DEFAULT
  // =========================

  else {

    aiText =
      "🤖 I can help with:\n\n• Movie recommendations\n• Genres\n• Actors\n• Trailers\n• IMDb ratings\n• Trending movies\n• Hollywood & Tamil movies\n\nTry asking:\n• Best horror movies\n• Vijay movies\n• Sci-fi recommendations";

  }

  const aiReply = {
    role: "ai",
    text: aiText,
  };

  setMessages((prev) => [
    ...prev,
    userMessage,
    aiReply,
  ]);

  setInput("");

};

    setMessages((prev) => [...prev, userMessage, aiReply]);

    setInput("");

  };

  return (

    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* BG */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#7f1d1d,transparent_30%),radial-gradient(circle_at_bottom_right,#4c1d95,transparent_30%)] opacity-60"></div>

      <div className="relative z-10 flex flex-col h-screen">

        {/* HEADER */}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-8 py-4 gap-3 border-b border-white/10 backdrop-blur-xl">

          <div>

            <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              MovieMind AI
            </h1>

            <p className="text-white/40 text-xs md:text-sm mt-1">
              AI Powered Recommendation Assistant
            </p>

          </div>

          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500"
          >
            Back
          </button>

        </div>

        {/* MAIN */}

        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-5">

          {/* CARD */}

          <div className="max-w-4xl mx-auto mb-8 px-2">

            <div className="rounded-[25px] md:rounded-[35px] border border-white/10 bg-gradient-to-b from-blue-950/30 to-black backdrop-blur-xl p-5 md:p-8 text-center">

              <h2 className="text-2xl md:text-4xl font-black mb-3">
                What mood are you in today?
              </h2>

              <p className="text-white/50 mb-8 text-sm md:text-base">
                Choose a genre and let AI recommend the perfect movie for you.
              </p>

              <div className="flex flex-wrap justify-center gap-3">

                <button
                  onClick={() => setInput("Best action movies")}
                  className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  🔥 Action
                </button>

                <button
                  onClick={() => setInput("Best comedy movies")}
                  className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  😂 Comedy
                </button>

              </div>

            </div>

          </div>

          {/* CHAT */}

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
                  className={`max-w-[90%] md:max-w-[75%] whitespace-pre-line rounded-3xl px-5 py-4 border border-white/10 ${
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

        {/* INPUT */}

        <div className="border-t border-white/10 bg-black/40 backdrop-blur-2xl p-4">

          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3">

            <input
              type="text"
              placeholder="Ask MovieMind AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSend()
              }
              className="flex-1 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 px-5 py-4 outline-none"
            />

            <button
              onClick={handleSend}
              className="px-8 py-4 rounded-2xl md:rounded-3xl bg-gradient-to-r from-red-500 to-pink-500 font-bold"
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