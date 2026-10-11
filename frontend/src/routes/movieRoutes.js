// routes/movieRoutes.js
import express from "express";
import multer from "multer";
import { identifyMovie } from "../controllers/movieController.js";
import { identifyMovie } from "../controllers/identifyController.js";

const router = express.Router();

// Gemini accepts about 20 MB per request including base64 overhead,
// so keep uploads at 14 MB or less. Keep MAX_FILE_MB in the frontend in sync.
const MAX_UPLOAD_MB = 14;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^(image|video)\//.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed."));
    }
  },
});

// Wraps multer so upload errors come back as JSON the frontend can display
const receiveMedia = (req, res, next) => {
  upload.single("mediaBlock")(req, res, (err) => {
    if (!err) return next();

    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      message: tooLarge
        ? `That file is too large. The limit is ${MAX_UPLOAD_MB} MB.`
        : err.message,
    });
  });
};

// POST /api/movies/identify-movie
router.post("/identify-movie", receiveMedia, identifyMovie);

export default router;