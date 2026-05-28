import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from "./routes/movieRoutes.js";

dotenv.config();

// ✅ Check if TMDB key is loading
console.log("TMDB KEY:", process.env.TMDB_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/movies", movieRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});