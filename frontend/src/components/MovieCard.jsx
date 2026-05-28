import React, { useEffect, useState } from "react";

function MovieCard() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetch(
      "https://api.themoviedb.org/3/trending/movie/week?api_key=YOUR_TMDB_API_KEY"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data);

        if (data.results) {
          setMovies(data.results);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="px-6 py-10">
      <h1 className="text-white text-4xl font-bold mb-8">
        Trending Movies
      </h1>

      <div className="flex gap-6 overflow-x-auto">
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="min-w-[220px] bg-gray-900 rounded-2xl overflow-hidden"
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-[320px] object-cover"
            />

            <div className="p-4">
              <h2 className="text-white text-lg font-semibold">
                {movie.title}
              </h2>

              <p className="text-yellow-400 mt-2">
                ⭐ {movie.vote_average}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MovieCard;