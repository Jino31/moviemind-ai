// backend/adminLogin.js
//
// Admin login route for the MovieMind admin page.
// The admin username and password live ONLY in this backend's environment
// variables (Render → Environment). The browser never sees them. On a correct
// login this returns a Firebase custom token carrying { admin: true }, which
// your Firestore rules trust.
//
// Mount it in server.js:
//   import adminLogin from "./adminLogin.js";
//   app.set("trust proxy", 1);      // required on Render (see note below)
//   app.use(adminLogin);

import "dotenv/config";
import crypto from "node:crypto";
import { Router, json } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const router = Router();

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "https://moviemind-ai-chi.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim());

// Constant-time comparison (hash first so lengths always match).
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

// Accepts the service-account key however it was pasted into the env var:
// plain one-line JSON, wrapped in quotes, base64, or with newlines turned into real line breaks.
function parseServiceAccount(raw) {
  let s = String(raw).trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) s = s.slice(1, -1).trim();
  if (!s.startsWith("{")) {
    s = Buffer.from(s, "base64").toString("utf8").trim();
    if (!s.startsWith("{")) throw new Error("value is not JSON. Paste the whole key file contents (starts with { )");
  }

  let obj;
  try {
    obj = JSON.parse(s);
  } catch {
    // retry: real line breaks inside the private key
    obj = JSON.parse(s.replace(/\r?\n/g, "\\n"));
  }
  if (typeof obj.private_key === "string") obj.private_key = obj.private_key.replace(/\\n/g, "\n");
  if (!obj.client_email || !obj.private_key) throw new Error("JSON is missing client_email or private_key");
  return obj;
}

// Set up Firebase Admin once, the first time someone tries to log in.
// A missing/bad config only breaks this route, never the rest of your backend.
function ready() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, FIREBASE_SERVICE_ACCOUNT } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !FIREBASE_SERVICE_ACCOUNT) {
    return "Admin login is not configured on the server.";
  }
  if (ADMIN_PASSWORD.length < 12) return "ADMIN_PASSWORD must be at least 12 characters.";
  if (!getApps().length) {
    try {
      initializeApp({ credential: cert(parseServiceAccount(FIREBASE_SERVICE_ACCOUNT)) });
    } catch (err) {
      return `FIREBASE_SERVICE_ACCOUNT is not valid: ${err.message}`;
    }
  }
  return null;
}

// 5 wrong attempts per 15 minutes per IP. Successful logins don't count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const adminCors = cors({ origin: allowedOrigins, methods: ["POST"], allowedHeaders: ["Content-Type"] });

// answer the browser's preflight ourselves, so a wide-open global cors() can't loosen this route
router.options("/admin-login", adminCors);

router.post(
  "/admin-login",
  adminCors,
  json({ limit: "2kb" }),
  loginLimiter,
  async (req, res) => {
    const problem = ready();
    if (problem) {
      console.error(problem);
      return res.status(503).json({ error: "Admin login is unavailable." });
    }

    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Username and password required." });
    }

    // evaluate both so timing doesn't reveal which one was wrong
    const userOk = safeEqual(username.trim(), process.env.ADMIN_USERNAME);
    const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);
    if (!(userOk && passOk)) return res.status(401).json({ error: "Wrong username or password." });

    try {
      const token = await getAuth().createCustomToken("admin-console", { admin: true });
      return res.json({ token });
    } catch (err) {
      console.error("createCustomToken failed:", err.message);
      return res.status(500).json({ error: "Server could not create a sign-in token." });
    }
  }
);

// Say right at startup whether admin login will work, and if not, exactly why.
console.log("ADMIN LOGIN check:", ready() || "OK, ready to accept logins");

export default router;