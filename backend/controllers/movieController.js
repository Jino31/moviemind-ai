import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getTrendingMovies = async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
    );

    res.json(response.data.results);
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    res.status(500).json({
      message: "Failed to fetch trending movies",
    });
  }
};

export const searchMovies = async (req, res) => {
  try {
    const query = req.query.query;

    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`
    );

    res.json(response.data.results);
  } catch (error) {
    console.error("Error searching movies:", error);

    res.status(500).json({
      message: "Search failed",
    });
  }
};

// ✅ EXPORTED identifyMovie FUNCTION (Fixes the Render crash)
export const identifyMovie = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    // Convert uploaded buffer to inline base64 data for Gemini API
    const imageParts = [
      {
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype,
        },
      },
    ];

    // Query Gemini Vision Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt =
      "Analyze this movie/TV show frame screenshot. Identify the exact movie or show title. Return strictly a raw JSON object with keys: 'movieTitle' (string), 'confidence' (number 0-100), and 'summary' (brief 1-2 sentence description). Do not wrap in markdown code blocks.";

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().trim();

    // Clean JSON response if formatted in markdown backticks
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanedJson);

    // Fetch movie metadata from TMDB if title was found
    let tmdbData = null;
    if (parsedData.movieTitle) {
      const tmdbRes = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          parsedData.movieTitle
        )}`
      );
      if (tmdbRes.data.results.length > 0) {
        tmdbData = tmdbRes.data.results[0];
      }
    }

    res.status(200).json({
      success: true,
      movie: parsedData,
      details: tmdbData,
    });
  } catch (error) {
    console.error("Error identifying movie:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process vision matrix analysis.",
    });
  }
};