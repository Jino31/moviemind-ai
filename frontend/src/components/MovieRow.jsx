import { useState } from "react";

import MovieCard from "./MovieCard";
import MovieModal from "./MovieModal";

export default function MovieRow({
  title,
  movies,
}) {

  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    <div className="px-8 md:px-14 mt-16">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-8">

        <h2 className="text-3xl md:text-4xl font-black text-white">

          {title}

        </h2>

        <button className="text-red-500 hover:text-red-400 transition font-semibold">

          View All →

        </button>

      </div>

      {/* MOVIES */}

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">

        {movies?.map((movie) => (

          <div
            key={movie.id}
            onClick={() => setSelectedMovie(movie)}
            className="cursor-pointer"
          >

            <MovieCard movie={movie} />

          </div>

        ))}

      </div>

      {/* MODAL */}

      {selectedMovie && (

        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />

      )}

    </div>
  );
}