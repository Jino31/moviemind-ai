import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from "./routes/movieRoutes.js";

dotenv.config();

console.log("TMDB KEY Loaded:", process.env.TMDB_API_KEY ? "YES" : "NO");
console.log("GEMINI KEY Loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

const app = express();

// ✅ Explicit CORS Configuration for Vercel Frontend
app.use(
  cors({
    origin: "*", // Allows requests from Vercel or any client domain
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Root Health Check Endpoint for Render
app.get("/", (req, res) => {
  res.send("MovieMind AI Backend is Live and Healthy! 🚀");
});

// ✅ Movie Identification Routes
app.use("/api/movies", movieRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});