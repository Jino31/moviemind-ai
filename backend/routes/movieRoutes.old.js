import express from "express";
import multer from "multer";
import {
  getTrendingMovies,
  searchMovies,
  identifyMovie, // Make sure to export this in movieController.js or implement your controller logic
} from "../controllers/movieController.js";

const router = express.Router();

// Multer setup in memory for receiving image/video uploads from frontend
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// GET /api/movies/trending
router.get("/trending", getTrendingMovies);

// GET /api/movies/search
router.get("/search", searchMovies);

// POST /api/movies/identify-movie (THIS FIXES THE 404 ERROR)
router.post("/identify-movie", upload.single("mediaBlock"), identifyMovie);

export default router;