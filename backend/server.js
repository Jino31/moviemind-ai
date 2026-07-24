import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from "./routes/movieRoutes.js";

dotenv.config();

// Verify critical environment variables
console.log("TMDB KEY Loaded:", process.env.TMDB_API_KEY ? "YES" : "NO");
console.log("GEMINI KEY Loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

const app = express();

// ✅ Explicit CORS Configuration for production frontend
app.use(
  cors({
    origin: "*", // Accepts requests from Vercel deployment
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ Health Check Endpoint for Render keep-alive
app.get("/", (req, res) => {
  res.send("MovieMind AI Backend is Live and Healthy! 🚀");
});

// ✅ Register Movie API Routes under /api/movies
app.use("/api/movies", movieRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});