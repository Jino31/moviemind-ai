import express from "express";
import {
  getTrendingMovies,
  searchMovies,
} from "../controllers/movieController.js";

const router = express.Router();

router.get("/trending", getTrendingMovies);
router.get("/search", searchMovies);

export default router;