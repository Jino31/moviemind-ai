import { FaStar } from "react-icons/fa";

function MovieModal({ movie, onClose }) {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">

      <div className="bg-zinc-900 rounded-[30px] overflow-hidden max-w-5xl w-full border border-white/10 relative">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 bg-red-500 px-4 py-2 rounded-xl"
        >
          Close
        </button>

        <div className="grid md:grid-cols-2">

          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt=""
            className="w-full h-full object-cover"
          />

          <div className="p-10">

            <h1 className="text-5xl font-black mb-4">
              {movie.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">

              <div className="flex items-center gap-2 text-yellow-400">
                <FaStar />
                {movie.vote_average?.toFixed(1)}
              </div>

              <span className="text-white/50">
                {movie.release_date}
              </span>

            </div>

            <p className="text-white/70 leading-relaxed">
              {movie.overview}
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;