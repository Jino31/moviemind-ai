// controllers/movieController.js
//
// NOTE: environment variables are read inside functions, not at the top of
// the file. ES module imports run before dotenv.config() in server.js, so a
// top-level process.env.X would be undefined.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";
const MAX_MATCHES = 5;

const httpError = (status, message) => Object.assign(new Error(message), { status });

const PROMPT = `You are a film expert. Identify the movie that this image or video clip comes from.
Use everything visible: actors, costumes, sets, vehicles, visible text and cinematography.

Respond with JSON only, in exactly this shape:
{"matches":[{"title":"Movie title","year":2014,"confidence":85}]}

Rules:
- Return up to ${MAX_MATCHES} matches, best match first.
- "confidence" is a number from 0 to 100.
- If you cannot identify the movie with reasonable confidence, return {"matches":[]}.
- Never invent titles.`;

/* ───────── GEMINI ───────── */
async function askGemini(file) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) throw httpError(500, "GEMINI_API_KEY is missing on the server.");

  const response = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inline_data: {
                mime_type: file.mimetype,
                data: file.buffer.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error(`Gemini error ${response.status}:`, details.slice(0, 500));

    if (response.status === 429) {
      throw httpError(429, "The AI service is busy right now. Please try again in a minute.");
    }
    if (response.status === 404) {
      throw httpError(500, `Gemini model "${model}" was not found. Set GEMINI_MODEL in your .env.`);
    }
    throw httpError(502, "The AI service could not process this file.");
  }

  const data = await response.json();
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");

  // Models sometimes wrap JSON in code fences even in JSON mode
  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Could not parse Gemini output:", cleaned.slice(0, 300));
    return [];
  }

  return (Array.isArray(parsed?.matches) ? parsed.matches : [])
    .filter((m) => m && typeof m.title === "string" && m.title.trim())
    .slice(0, MAX_MATCHES);
}

/* ───────── TMDB ───────── */
async function tmdb(path, params = {}) {
  const key = process.env.TMDB_API_KEY;
  const url = new URL(`${TMDB_BASE}${path}`);
  const headers = {};

  // Supports both a v3 API key and a v4 read access token
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    url.searchParams.set("api_key", key);
  }

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(name, String(value));
    }
  }

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`TMDB responded with ${response.status}`);
  return response.json();
}

const formatRuntime = (minutes) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

/* Adds poster, cast, director, trailer, etc. If TMDB fails, keep the AI result. */
async function enrich(match) {
  const confidence = Number(match.confidence);
  const pct = Number.isFinite(confidence) ? Math.min(100, Math.max(0, confidence)) : 50;

  const base = {
    title: match.title.trim(),
    year: match.year ? String(match.year) : "",
    matchConfidence: `${Math.round(pct)}%`,
  };

  try {
    let search = await tmdb("/search/movie", {
      query: base.title,
      year: base.year,
      include_adult: "false",
    });
    let hit = search.results?.[0];

    // The year from the AI can be off by one, so retry without it
    if (!hit && base.year) {
      search = await tmdb("/search/movie", { query: base.title, include_adult: "false" });
      hit = search.results?.[0];
    }
    if (!hit) return base;

    const details = await tmdb(`/movie/${hit.id}`, { append_to_response: "credits,videos" });

    const director = details.credits?.crew?.find((c) => c.job === "Director")?.name || "";
    const cast = (details.credits?.cast || []).slice(0, 5).map((c) => c.name);
    const trailer = (details.videos?.results || []).find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    );

    return {
      ...base,
      title: details.title || base.title,
      year: details.release_date?.slice(0, 4) || base.year,
      director,
      runtime: formatRuntime(details.runtime),
      rating: details.vote_average ? details.vote_average.toFixed(1) : "",
      genres: (details.genres || []).map((g) => g.name),
      cast,
      overview: details.overview || "",
      posterPath: details.poster_path ? `${TMDB_IMAGE}${details.poster_path}` : "",
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
    };
  } catch (err) {
    console.error(`TMDB lookup failed for "${base.title}":`, err.message);
    return base;
  }
}

/* ───────── ROUTE HANDLER ───────── */
export const identifyMovie = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file received. Upload a screenshot or a short clip.",
      });
    }
    if (!process.env.TMDB_API_KEY) {
      throw httpError(500, "TMDB_API_KEY is missing on the server.");
    }

    const candidates = await askGemini(req.file);

    if (candidates.length === 0) {
      return res.json({
        success: false,
        matches: [],
        message:
          "We couldn't confidently identify this movie. Try a clearer frame with faces or distinctive scenery.",
      });
    }

    const enriched = await Promise.all(candidates.map(enrich));

    // Remove duplicate titles
    const seen = new Set();
    const matches = enriched.filter((m) => {
      const key = m.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return res.json({ success: true, matches });
  } catch (err) {
    console.error("identify-movie error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Something went wrong while identifying the movie.",
    });
  }
};