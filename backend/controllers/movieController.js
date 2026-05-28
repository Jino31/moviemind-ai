import axios from "axios";

const API_KEY = process.env.TMDB_API_KEY;

export const getTrendingMovies = async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
    );

    res.json(response.data.results);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to fetch trending movies",
    });
  }
};

export const searchMovies = async (req, res) => {
  try {
    const query = req.query.query;

    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
    );

    res.json(response.data.results);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Search failed",
    });
  }
};