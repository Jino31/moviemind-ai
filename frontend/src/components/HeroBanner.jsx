import { useState } from "react";
import { fetchMovieTrailer } from "../services/tmdbApi";
import TrailerModal from "./TrailerModal";

function HeroBanner() {
  const [trailerKey, setTrailerKey] = useState(null);

  const handleTrailer = async () => {
    const key = await fetchMovieTrailer(950387);

    if (key) {
      setTrailerKey(key);
    }
  };

  return (
    <>
      <div
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://image.tmdb.org/t/p/original/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>

        <div className="relative z-10 flex items-center h-full px-12">
          <div className="max-w-2xl">
            <h1 className="text-7xl font-extrabold leading-tight mb-6">
              Discover Movies with AI
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Explore trending movies, trailers, AI recommendations,
              and personalized entertainment experiences.
            </p>

            <button
              onClick={handleTrailer}
              className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full text-lg font-bold transition"
            >
              ▶ Watch Trailer
            </button>
          </div>
        </div>
      </div>

      <TrailerModal
        trailerKey={trailerKey}
        onClose={() => setTrailerKey(null)}
      />
    </>
  );
}

export default HeroBanner;