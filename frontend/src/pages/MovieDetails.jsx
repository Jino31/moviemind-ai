import { useLocation, useNavigate } from "react-router-dom";

export default function MovieDetails() {

  const navigate = useNavigate();
  const location = useLocation();

  const movie = location.state;

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-5xl font-bold">
          No Movie Found
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,0,100,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(120,0,255,0.15),transparent_30%)]"></div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-10 py-12">

        <button
          onClick={() => navigate(-1)}
          className="mb-10 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 font-bold"
        >
          ← Back
        </button>

        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* POSTER */}
          <div>

            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full rounded-[40px] shadow-2xl"
            />

          </div>

          {/* DETAILS */}
          <div>

            <h1 className="text-7xl font-black">
              {movie.title}
            </h1>

            <div className="flex gap-4 mt-6 mb-8">

              <span className="px-5 py-2 rounded-full bg-yellow-400 text-black font-bold">
                ⭐ {movie.vote_average?.toFixed(1)}
              </span>

              <span className="px-5 py-2 rounded-full bg-white/10 border border-white/10">
                {movie.release_date}
              </span>

            </div>

            <p className="text-white/70 text-2xl leading-relaxed">
              {movie.overview}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}