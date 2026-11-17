// src/pages/Chatbot.jsx
// MovieMind AI — a cinema-only assistant (movies, series, actors, directors, OTT).
// v5: real conversations (like Claude): every chat is one thread in the sidebar, "New chat" starts a fresh one,
//     clicking a chat re-opens the whole conversation. Off-topic questions are politely declined.
//     Also fixes the page being scrolled up under the navbar (no more scrollIntoView on the window).
//
// FIRESTORE: chats sync to  users/{uid}/conversations/{conversationId}  — allow read/write for the owner in your rules.
// If the rules block it, chats are still saved on this device automatically.

import { useState, useRef, useEffect, useMemo, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection, query, orderBy, limit, onSnapshot, deleteDoc, doc, setDoc, writeBatch, getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaPaperPlane, FaRobot, FaUser, FaTrashAlt, FaHistory, FaTimes, FaPlus,
  FaStop, FaRedo, FaStar, FaLock, FaSearch, FaGlobe, FaCopy, FaCheck, FaArrowDown,
  FaSignInAlt, FaPlay, FaTv, FaInfoCircle, FaPen, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

// ▼▼ the site's own navbar + theme ▼▼
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
// ▲▲ ───────────────────────────── ▲▲

// Fallback height used only if the navbar can't be measured. Real height is measured at runtime.
const NAVBAR_FIXED_OFFSET = 72;

// The "Trailer" button opens your own Explore / movie page (movie.jsx) instead of YouTube.
// ▼ Change this one line to match your route, e.g. `/explore/${m.id}` or `/movie?id=${m.id}`. m.id is the TMDB movie id.
const trailerPath = (m) => `/movie/${m.id}`;

/* ───────────────────────── config ───────────────────────── */

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const TMDB_API_KEY   = import.meta.env.VITE_TMDB_API_KEY;
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

const MODEL_CANDIDATES = [...new Set([
  import.meta.env.VITE_GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
].filter(Boolean))];
let workingModel = null;
const GUEST_LIMIT = 2;
const MAX_CONTEXT_MESSAGES = 16;
const MAX_CARDS = 8;
const MAX_CONVS = 30;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const STARTERS = [
  "Best sci-fi movies of the last 10 years",
  "Tamil movies",
  "Where can I watch Inception?",
  "Suggest a feel-good movie for tonight",
  "Best movies of actor Vijay",
  "Upcoming movie releases",
];

const SIDEBAR_LINKS = [
  { label: "Trending movies",   query: "What are the most popular movies right now?" },
  { label: "Tamil cinema",      query: "Tamil movies" },
  { label: "Upcoming releases", query: "Upcoming movie releases" },
  { label: "Top rated ever",    query: "Top rated movies of all time" },
  { label: "Movie for tonight", query: "Suggest a feel-good movie for tonight" },
];

const SEARCH_MODES = [
  { key: "auto", label: "Auto",   hint: "Searches the web only when the question needs fresh facts" },
  { key: "on",   label: "Always", hint: "Search the web for every question" },
  { key: "off",  label: "Off",    hint: "Answer from the model only" },
];

const newId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const titleOf = (t) => {
  const s = String(t).replace(/\s+/g, " ").trim();
  return s.length > 48 ? s.slice(0, 47) + "…" : s;
};

/* ───────────────────────── TMDB: live data + direct links ───────────────────────── */

const LANGS = {
  tamil: "ta", hindi: "hi", telugu: "te", malayalam: "ml", kannada: "kn", korean: "ko",
  japanese: "ja", french: "fr", spanish: "es", bengali: "bn", marathi: "mr", punjabi: "pa", chinese: "zh",
};
const GENRES = {
  action: 28, adventure: 12, animation: 16, animated: 16, comedy: 35, crime: 80, documentary: 99, drama: 18,
  family: 10751, fantasy: 14, history: 36, horror: 27, musical: 10402, mystery: 9648, romance: 10749,
  romantic: 10749, "sci-fi": 878, scifi: 878, "science fiction": 878, thriller: 53, war: 10752, western: 37,
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Tries the dev/Vercel proxy first, then TMDB directly.
async function tmdb(path, params = {}, signal) {
  if (!TMDB_API_KEY) return null;
  const qs = new URLSearchParams({ api_key: TMDB_API_KEY, language: "en-US", ...params }).toString();
  for (const url of [`/tmdb${path}?${qs}`, `https://api.themoviedb.org/3${path}?${qs}`]) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) continue;
      return await res.json();
    } catch (e) {
      if (e.name === "AbortError") throw e;
    }
  }
  return null;
}

// Turns a TMDB movie (details-with-append, or a plain list item) into a compact card with direct links.
function toCard(d) {
  const year = d.release_date?.slice(0, 4) || "TBA";
  const wp = d["watch/providers"]?.results ?? {};
  const region = wp.IN ?? wp.US ?? Object.values(wp)[0] ?? null;
  const providers = [...new Set(
    region ? [...(region.flatrate ?? []), ...(region.rent ?? []), ...(region.buy ?? [])].map((p) => p.provider_name) : []
  )].slice(0, 3);
  const vids = d.videos?.results ?? [];
  const vid =
    vids.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    vids.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    vids.find((v) => v.site === "YouTube");
  const q = encodeURIComponent(`${d.title} ${year !== "TBA" ? year : ""}`.trim());
  return {
    id: d.id,
    title: d.title,
    year,
    rating: d.vote_average ? Number(d.vote_average.toFixed(1)) : null,
    votes: d.vote_count ?? 0,
    poster: d.poster_path ?? null,
    overview: (d.overview || "").slice(0, 220),
    runtime: d.runtime ?? null,
    genres: (d.genres ?? []).slice(0, 3).map((g) => g.name),
    providers,
    links: {
      details: `https://www.themoviedb.org/movie/${d.id}`,
      watch: region?.link || `https://www.justwatch.com/in/search?q=${q}`,
      trailer: vid ? `https://www.youtube.com/watch?v=${vid.key}` : `https://www.youtube.com/results?search_query=${q}+trailer`,
    },
  };
}

async function movieFromId(base, signal) {
  const d = await tmdb(
    `/movie/${base.id}`,
    { append_to_response: "videos,watch/providers", include_video_language: "en,hi,ta,te,ml,kn,null" },
    signal
  );
  return toCard(d ?? base);
}

// Old saved messages may not have links — always give every card three working links.
function linksFor(m) {
  if (m.links) return m.links;
  const q = encodeURIComponent(`${m.title} ${m.year && m.year !== "N/A" ? m.year : ""}`.trim());
  return {
    details: m.id ? `https://www.themoviedb.org/movie/${m.id}` : `https://www.themoviedb.org/search?query=${q}`,
    watch: `https://www.justwatch.com/in/search?q=${q}`,
    trailer: `https://www.youtube.com/results?search_query=${q}+trailer`,
  };
}

async function fetchMovieList(intent, signal) {
  const data = await tmdb(intent.path, intent.params, signal);
  const base = (data?.results ?? []).filter((r) => r.id).slice(0, MAX_CARDS);
  if (!base.length) return null;
  return Promise.all(base.map((r) => movieFromId(r, signal)));
}

async function fetchTitleMovies(q, signal, max = 3, year) {
  let data = await tmdb("/search/movie", { query: q, include_adult: "false", ...(year ? { year } : {}) }, signal);
  if (!data?.results?.length && year) data = await tmdb("/search/movie", { query: q, include_adult: "false" }, signal);
  const base = (data?.results ?? []).filter((r) => r.id).slice(0, max);
  if (!base.length) return null;
  return Promise.all(base.map((r) => movieFromId(r, signal)));
}

// Best films of an actor / director straight from TMDB credits (so the answer matches the cards).
async function fetchPersonMovies(name, wantsDirector, signal) {
  const s = await tmdb("/search/person", { query: name, include_adult: "false" }, signal);
  const person = s?.results?.[0];
  if (!person) return null;
  const c = await tmdb(`/person/${person.id}/movie_credits`, {}, signal);
  if (!c) return null;
  const pool = wantsDirector ? (c.crew ?? []).filter((x) => x.job === "Director") : (c.cast ?? []);
  const seen = new Set();
  const score = (x) => (x.vote_average || 0) * Math.log10((x.vote_count || 0) + 10);
  const base = pool
    .filter((x) =>
      x.id && x.release_date && (x.vote_count || 0) >= 50 &&
      !(x.genre_ids ?? []).some((g) => g === 99 || g === 10770) &&
      !/self|himself|herself|archive/i.test(x.character || "") &&
      !seen.has(x.id) && seen.add(x.id)
    )
    .sort((a, b) => score(b) - score(a))
    .slice(0, MAX_CARDS);
  if (!base.length) return null;
  const movies = await Promise.all(base.map((r) => movieFromId(r, signal)));
  return { person: person.name, movies };
}

// Picks the RIGHT movie for a title: exact title + language + year + popularity.
async function pickMovie(title, year, lang, signal) {
  let data = await tmdb("/search/movie", { query: title, include_adult: "false", ...(year ? { year } : {}) }, signal);
  if (!data?.results?.length && year) data = await tmdb("/search/movie", { query: title, include_adult: "false" }, signal);
  const res = (data?.results ?? []).filter((r) => r.id);
  if (!res.length) return null;
  const score = (r) =>
    (norm(r.title) === norm(title) || norm(r.original_title) === norm(title) ? 6 : 0) +
    (lang && r.original_language === lang ? 5 : 0) +
    (year && r.release_date?.startsWith(year) ? 3 : 0) +
    Math.log10((r.popularity || 0) + 1) +
    Math.log10((r.vote_count || 0) + 1) * 0.5;
  const best = [...res].sort((a, b) => score(b) - score(a))[0];
  return movieFromId(best, signal);
}

// Resolves the model's "[[MOVIES: Title (Year, lang); …]]" tag into real cards with links.
async function resolveTitles(titles, signal, hintLang) {
  const found = await Promise.all(titles.map(async (raw) => {
    const ym = raw.match(/\(\s*(\d{4})\s*(?:[,/]\s*([a-z]{2,3}))?\s*\)\s*$/i);
    const title = raw.replace(/\(\s*\d{4}[^)]*\)\s*$/, "").trim();
    if (!title) return null;
    try { return await pickMovie(title, ym?.[1], (ym?.[2] || hintLang || "").toLowerCase() || undefined, signal); }
    catch (e) { if (e.name === "AbortError") throw e; return null; }
  }));
  const seen = new Set();
  return found.filter((m) => m && !seen.has(m.id) && seen.add(m.id));
}

const TITLE_STOP = /^(tonight|today|something|anything|this|that|it|them|one|next|now|with|on|me|good|a|an)\b/i;
function extractTitle(text) {
  const t = text.trim().replace(/[?.!]+$/, "");
  let m = t.match(
    /(?:where (?:can i|do i|to|can we) (?:watch|stream)|\b(?:watch|stream)|trailer (?:of|for)|(?:direct )?links? (?:for|of|to)|details (?:of|about|on))\s+(?:the\s+)?(?:movie\s+|film\s+)?(.+?)(?:\s+(?:movie|film|online|full movie|on (?:netflix|prime|hotstar|ott)))?$/i
  );
  if (!m) m = t.match(/^(.+?)\s+(?:movie\s+)?(?:link|links|trailer|ott|watch online|where to watch)$/i);
  const q = m?.[1]?.trim();
  if (!q || q.split(/\s+/).length > 6 || TITLE_STOP.test(q)) return null;
  return q;
}

// "best movies of actor vijay with links" → { name: "vijay", director: false }
function extractPerson(text) {
  const t = text.trim().replace(/[?.!]+$/, "");
  const m = t.match(
    /\b(?:movies?|films?)\s+(?:of|by|starring)\s+(?:the\s+)?(?:(actor|actress|hero|heroine|director|star|superstar)\s+)?(.+)$/i
  );
  if (!m) return null;
  const name = m[2]
    .replace(/\s+(?:with|and|plus)\s+(?:the\s+)?(?:direct\s+)?(?:movie\s+)?(?:links?|trailers?|watch.*)$/i, "")
    .replace(/\s+(?:please|pls)$/i, "")
    .trim();
  const n = norm(name);
  if (!n || n.split(" ").length > 4) return null;
  if (/\b(19|20)\d{2}\b|\b(year|years|time|decade|all|the 80s|the 90s|today|tonight|week|month)\b/.test(n)) return null;
  if (GENRES[n] || LANGS[n]) return null;
  return { name, director: (m[1] || "").toLowerCase() === "director" };
}

// Decides whether a message is a movie request we can answer with live TMDB data.
function detectMovieIntent(text) {
  const t = text.toLowerCase().trim();

  const person = extractPerson(text);
  if (person) return { kind: "person", ...person, label: `Top films of ${person.name}` };

  const year = t.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
  const wantsMovies = /\b(movies?|films?|cinema|releases?)\b/.test(t);

  const lang = Object.keys(LANGS).find((l) => new RegExp(`\\b${l}\\b`).test(t) && (wantsMovies || t === l));
  const genre = Object.keys(GENRES).find((g) => new RegExp(`(^|[^a-z])${g.replace("-", "[- ]?")}([^a-z]|$)`).test(t));
  const upcoming = /\b(upcoming|coming soon|releasing)\b/.test(t);
  const nowPlaying = /\b(now playing|in theat(?:er|re)s|running in)\b/.test(t);
  const topRated = /\b(top rated|highest rated|top \d+|best ever|all time|imdb)\b/.test(t);
  const trending = /\b(trending|popular|right now|this week)\b/.test(t);
  const lastN = t.match(/last (\d{1,2}) years?/)?.[1];

  const isList = (lang || genre || upcoming || nowPlaying || topRated || trending) && wantsMovies;
  if (isList || (lang && t === lang)) {
    let path = "/discover/movie";
    let params = { sort_by: "popularity.desc", "vote_count.gte": "30", include_adult: "false" };
    let label = "Popular right now";
    if (upcoming) {
      path = "/movie/upcoming"; params = { region: "IN" }; label = "Upcoming releases";
    } else if (nowPlaying) {
      path = "/movie/now_playing"; params = { region: "IN" }; label = "Now playing";
    } else if (topRated && !lang && !genre) {
      path = "/movie/top_rated"; params = {}; label = "Top rated of all time";
    } else if (trending && !lang && !genre) {
      path = "/trending/movie/week"; params = {}; label = "Trending this week";
    } else {
      if (topRated) { params.sort_by = "vote_average.desc"; params["vote_count.gte"] = lang ? "300" : "1500"; label = "Top rated"; }
    }
    if (path === "/discover/movie") {
      if (lang) params.with_original_language = LANGS[lang];
      if (genre) params.with_genres = String(GENRES[genre]);
      if (year) params.primary_release_year = year;
      if (lastN) params["primary_release_date.gte"] = `${new Date().getFullYear() - Number(lastN)}-01-01`;
      const parts = [lang && cap(lang), genre && cap(genre)].filter(Boolean).join(" ");
      label = `${parts ? parts + " movies" : "Movies"} — ${year ? year : label}`;
    }
    return { kind: "list", path, params, label };
  }

  const title = extractTitle(text);
  if (title) return { kind: "title", q: title, label: `Results for “${title}”` };
  return null;
}

/* ───────────────────────── web search + LLM helpers ───────────────────────── */

function buildSystemPrompt(extra = "") {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  return `You are MovieMind AI — a friendly cinema expert. You ONLY discuss movies and the film / OTT world: films, web series and TV shows, actors and actresses, directors, music directors and songs from films, box office, awards, release dates, where to watch, recommendations, trivia, reviews and plot explanations — across Hollywood, Bollywood, Tamil, Telugu, Malayalam, Kannada, Korean and world cinema.
Today's date is ${today}.

SCOPE RULE (most important): if the question is NOT about movies, series, actors, directors or cinema — for example society, politics, environment, news, science, health, coding, maths, studies, finance or general advice — do NOT answer it, not even partially. Reply with one or two short, polite sentences saying you only help with movies, actors and cinema, then suggest 2–3 example questions you CAN answer. Do not add the [[MOVIES: …]] line in that case. Greetings and thanks are fine: reply briefly and invite a movie question. Follow-up questions about movies already discussed in this chat are on-topic. A film about a social or environmental theme is fine only when the question is about the film itself (cast, plot, rating, where to watch), never the real-world issue.

How to answer on-topic questions:
1. Lead with the direct answer, then add the useful detail. Don't pad.
2. Make answers easy and pleasant to read: a one-line intro, then a bulleted or numbered list with ONE item per line like "**Title (Year)** — one-line reason", then a short closing line. Use short paragraphs and **bold** for key terms. NEVER use Markdown tables.
3. Reply in the same language the user writes in (Tamil, Hindi, English, Tanglish, etc.).
4. When LIVE TMDB DATA or WEB CONTEXT is provided it is the primary source for current facts (dates, rankings, cast, ratings, where to watch, news). Use it, don't contradict it, and never invent facts or sources that are not in it.
5. If you are not sure, or the information may be outdated, say so plainly instead of guessing. Never invent a release year, rating or cast member.
6. Ask at most one short clarifying question, and only when the request is truly ambiguous; otherwise make a sensible assumption and state it.
7. For movie questions include year, director, lead cast and rating when known. Offer 3–5 similar picks for recommendations.
8. Tone: warm, clear, and concise. A light emoji now and then is fine.
9. MOVIE LINKS: whenever your answer names or recommends specific movies, finish with ONE last line in exactly this format and nothing after it: [[MOVIES: Title (Year, lang); Title (Year, lang)]] — real, existing movie titles only, at most 6, in the order you mention them, where lang is the movie's original-language ISO code (ta, hi, te, ml, kn, en, ko…). Example: [[MOVIES: Leo (2023, ta); Inception (2010, en)]]. The app turns that line into Watch / Trailer / Info link cards, so never mention the line and never print raw URLs yourself. Skip the line when no specific movie is involved.${extra ? "\n\n" + extra : ""}`;
}

const MOVIE_RE = /\b(movie|movies|film|films|cinema|actor|actress|director|cast|imdb|box office|trailer|ott|netflix|prime video|hotstar|kollywood|bollywood|tollywood|hollywood|series|web series|oscar|release)\b/i;
const FILM_FOLLOWUP_RE = /\b(directed|starring|plot|sequel|prequel|hero|heroine|villain|song|songs|climax|ending|story|remake|dubbed|ott|streaming|stream|rating|review|reviews|music director|screenplay|cameo)\b/i;
const FRESH_RE = /\b(latest|today|tonight|tomorrow|yesterday|now|current|currently|recent|recently|new|news|trending|upcoming|released?|release date|box office|ranking|rank|who won|what happened|this (week|month|year)|20(2[4-9]|3\d))\b/i;
const CHAT_RE = /^(hi|hello|hey|thanks|thank you|ok|okay|bye|good (morning|evening|night)|how are you)\b/i;

// Only search the web for film-related questions; everything else is declined by the model anyway.
function shouldSearch(text, mode) {
  if (mode === "off") return false;
  const t = text.trim();
  if (t.length < 4 || CHAT_RE.test(t)) return false;
  if (mode === "on") return true;
  if (MOVIE_RE.test(t)) return true;
  return FILM_FOLLOWUP_RE.test(t) && FRESH_RE.test(t);
}

async function tavilySearch(q, signal) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: q,
      search_depth: "advanced",
      max_results: 6,
      include_answer: true,
    }),
  });
  if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
  return res.json();
}

// Splits the model output into visible text and the hidden movie-title tag (works mid-stream too).
function splitReply(text) {
  const m = text.match(/\[\[\s*MOVIES\s*:([\s\S]*?)\]\]/i);
  const titles = m ? m[1].split(/;|\|/).map((s) => s.trim()).filter(Boolean).slice(0, 6) : [];
  const clean = text
    .replace(/\n*\[\[\s*MOVIES[\s\S]*$/i, "")
    .replace(/\n*\[\[[^\]]{0,12}$/, "")
    .trim();
  return { clean, titles };
}

function moviesContext(movies, label) {
  return (
    `LIVE TMDB DATA — ${label} (fetched just now):\n` +
    movies.map((m, i) =>
      `${i + 1}. ${m.title} (${m.year}) — TMDB rating ${m.rating ?? "NR"}/10` +
      `${m.genres?.length ? `, ${m.genres.join("/")}` : ""}` +
      `${m.providers?.length ? `, available on: ${m.providers.join(", ")}` : ""}. ${m.overview}`
    ).join("\n")
  );
}

async function streamGroqOnce({ model, messages, extra = "", signal, onToken, retries = 3 }) {
  let backoff = 1500;
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.4,
        max_tokens: 3000,
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
        messages: [
          { role: "system", content: buildSystemPrompt(extra) },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content ?? "").slice(0, 4000),
          })),
        ],
      }),
    });

    if (res.status === 429 && attempt < retries - 1) {
      await delay(backoff);
      backoff *= 2;
      continue;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err?.error?.message || `Groq HTTP ${res.status}`);
      e.modelMissing = res.status === 404 || ["model_not_found", "model_decommissioned"].includes(err?.error?.code);
      throw e;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return full;
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
          if (delta) { full += delta; onToken(full); }
        } catch { /* ignore partial JSON chunks */ }
      }
    }
    return full;
  }
  throw new Error("Rate limited. Please try again in a moment.");
}

async function streamGroq(args) {
  const order = workingModel
    ? [workingModel, ...MODEL_CANDIDATES.filter((m) => m !== workingModel)]
    : MODEL_CANDIDATES;
  let lastErr = null;
  for (const model of order) {
    try {
      const out = await streamGroqOnce({ ...args, model });
      workingModel = model;
      return out;
    } catch (e) {
      if (e.modelMissing) { lastErr = e; continue; }
      throw e;
    }
  }
  throw lastErr ?? new Error("No Groq model is available for this API key.");
}

function groupHistory(items) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const DAY = 86400000;
  const groups = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };
  for (const it of items) {
    const day = startOfDay(new Date(it.ts));
    if (day >= today) groups.Today.push(it);
    else if (day >= today - DAY) groups.Yesterday.push(it);
    else if (day >= today - 7 * DAY) groups["Previous 7 days"].push(it);
    else groups.Older.push(it);
  }
  return Object.entries(groups).filter(([, v]) => v.length);
}

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

// Small, Firestore-safe copy of the movie cards stored with a message.
const slimMovies = (movies = []) =>
  JSON.parse(JSON.stringify(
    movies.map(({ id, title, year, rating, poster, runtime, genres, providers, links }) =>
      ({ id, title, year, rating, poster, runtime, genres, providers, links }))
  ));

// Firestore-safe message (no undefined fields, slim movie cards).
const cleanMsg = (m) => JSON.parse(JSON.stringify({
  role: m.role,
  content: String(m.content ?? "").slice(0, 20000),
  ...(m.movies?.length ? { movies: slimMovies(m.movies) } : {}),
  ...(m.sources?.length ? { sources: m.sources } : {}),
}));

/* ───────────────────────── markdown renderer (no dependencies) ───────────────────────── */

function inline(s, keyBase = "i") {
  const out = [];
  const re = /(`[^`\n]+`)|(\*\*(?:(?!\*\*)[^\n])+\*\*)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))|(https?:\/\/[^\s<>)]+)|(\*[^*\n]+\*)|(\\[*_`#|\[\]()])/g;
  let last = 0, m, n = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    const key = `${keyBase}-${n++}`;
    if (m[1]) out.push(<code key={key} className="mm-icode">{t.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={key}>{inline(t.slice(2, -2), key)}</strong>);
    else if (m[3]) {
      const mm = t.match(/^\[([^\]]+)\]\((.+)\)$/);
      out.push(<a key={key} href={mm[2]} target="_blank" rel="noopener noreferrer" className="mm-link">{mm[1]}</a>);
    } else if (m[4]) {
      const trail = t.match(/[.,;:!?]+$/)?.[0] ?? "";
      const href = trail ? t.slice(0, -trail.length) : t;
      out.push(
        <Fragment key={key}>
          <a href={href} target="_blank" rel="noopener noreferrer" className="mm-link">{href}</a>{trail}
        </Fragment>
      );
    } else if (m[5]) out.push(<em key={key}>{t.slice(1, -1)}</em>);
    else if (m[6]) out.push(t.slice(1));
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

const isTableSep = (s) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(s ?? "");
const tableCells = (s) => s.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const ULI = /^\s*[-*•]\s+(.*)/;
const OLI = /^\s*\d+[.)]\s+(.*)/;

function renderBlocks(src, keyBase) {
  const lines = src.split("\n");
  const out = [];
  let para = [];
  let list = null;
  let k = 0;
  const nk = () => `${keyBase}-${k++}`;

  const flushPara = () => {
    if (!para.length) return;
    out.push(
      <p key={nk()}>
        {para.map((l, i) => (
          <Fragment key={i}>{i > 0 && <br />}{inline(l, `${keyBase}-p${k}-${i}`)}</Fragment>
        ))}
      </p>
    );
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.type;
    out.push(
      <Tag key={nk()} start={list.type === "ol" && list.start > 1 ? list.start : undefined}>
        {list.items.map((it, i) => <li key={i}>{inline(it, `${keyBase}-l${k}-${i}`)}</li>)}
      </Tag>
    );
    list = null;
  };
  const nextNonBlank = (from) => {
    for (let j = from; j < lines.length; j++) if (lines[j].trim()) return lines[j];
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, "");
    if (!line.trim()) {
      flushPara();
      // keep one list together even if the model leaves blank lines between items
      if (list) {
        const nxt = nextNonBlank(i + 1);
        const same = nxt && (list.type === "ul" ? ULI.test(nxt) : OLI.test(nxt));
        if (!same) flushList();
      }
      continue;
    }

    let m;
    if (line.includes("|") && isTableSep(lines[i + 1])) {
      flushPara(); flushList();
      const head = tableCells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) { rows.push(tableCells(lines[i])); i++; }
      i--;
      const tk = nk();
      out.push(
        <div key={tk} className="mm-tablewrap">
          <table className="mm-table">
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c, `${tk}-h${j}`)}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `${tk}-${ri}-${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if ((m = line.match(/^(#{1,4})\s+(.*)/))) {
      flushPara(); flushList();
      out.push(<div key={nk()} className={`mm-h mm-h${m[1].length}`}>{inline(m[2], nk())}</div>);
    } else if ((m = line.match(ULI))) {
      flushPara();
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(OLI))) {
      flushPara();
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [], start: parseInt(line.match(/\d+/)[0], 10) }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^>\s?(.*)/))) {
      flushPara(); flushList();
      out.push(<blockquote key={nk()} className="mm-quote">{inline(m[1], nk())}</blockquote>);
    } else if (/^[-*_]{3,}$/.test(line.trim())) {
      flushPara(); flushList();
      out.push(<hr key={nk()} className="mm-hr" />);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return out;
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (await copyToClipboard(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <div className="mm-code">
      <div className="mm-code-head">
        <span>{lang || "code"}</span>
        <button onClick={onCopy} aria-label="Copy code">
          {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function Markdown({ text }) {
  const nodes = useMemo(() => {
    const blocks = [];
    const re = /```([\w+#.-]*)[ \t]*\n?([\s\S]*?)(?:```|$)/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) blocks.push({ t: "md", v: text.slice(last, m.index) });
      blocks.push({ t: "code", lang: m[1], v: m[2].replace(/\n$/, "") });
      last = re.lastIndex;
    }
    if (last < text.length) blocks.push({ t: "md", v: text.slice(last) });
    return blocks.map((b, i) =>
      b.t === "code"
        ? <CodeBlock key={i} lang={b.lang} code={b.v} />
        : <Fragment key={i}>{renderBlocks(b.v, `b${i}`)}</Fragment>
    );
  }, [text]);
  return <div className="mm-md">{nodes}</div>;
}

/* ───────────────────────── small components ───────────────────────── */

function MovieCards({ movies }) {
  const navigate = useNavigate();
  // Opens the in-site page; Ctrl/Cmd/middle-click still opens it in a new tab.
  const openTrailer = (e, path) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(path);
  };
  return (
    <div className="mm-mcards">
      {movies.map((m, i) => {
        const l = linksFor(m);
        return (
          <article key={m.id ?? i} className="mm-mcard">
            <a className="mm-mposter" href={l.details} target="_blank" rel="noopener noreferrer" aria-label={`${m.title} details`}>
              {m.poster ? (
                <img src={`https://image.tmdb.org/t/p/w185${m.poster}`} alt={m.title} loading="lazy" />
              ) : (
                <div className="mm-poster-fallback">🎬</div>
              )}
              <span className="mm-rank">{i + 1}</span>
            </a>
            <div className="mm-mbody">
              <div className="mm-mtitle">{m.title}</div>
              <div className="mm-mmeta">
                <span className="mm-mrate"><FaStar /> {m.rating ?? "NR"}</span>
                <span>{m.year}</span>
                {m.runtime ? <span>{m.runtime} min</span> : null}
              </div>
              {m.genres?.length > 0 && <div className="mm-muted mm-mgenres">{m.genres.join(" · ")}</div>}
              {m.providers?.length > 0 && (
                <div className="mm-chips">{m.providers.map((p) => <span key={p} className="mm-chip">{p}</span>)}</div>
              )}
              <div className="mm-mlinks">
                <a className="mm-mlink mm-mlink-main" href={l.watch} target="_blank" rel="noopener noreferrer"><FaTv /> Watch</a>
                {m.id ? (
                  <a className="mm-mlink" href={trailerPath(m)} onClick={(e) => openTrailer(e, trailerPath(m))}><FaPlay /> Trailer</a>
                ) : (
                  <a className="mm-mlink" href={l.trailer} target="_blank" rel="noopener noreferrer"><FaPlay /> Trailer</a>
                )}
                <a className="mm-mlink" href={l.details} target="_blank" rel="noopener noreferrer"><FaInfoCircle /> Info</a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Sources({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="mm-sources">
      <span className="mm-sources-label"><FaGlobe /> Sources</span>
      {sources.map((s, i) => {
        let host = s.url;
        try { host = new URL(s.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
        return (
          <a key={i} className="mm-source" href={s.url} target="_blank" rel="noopener noreferrer" title={s.title || host}>
            {host}
          </a>
        );
      })}
    </div>
  );
}

// onEdit(newText): when provided on a user message, the bubble edits in place.
function Bubble({ msg, onEdit, onRegenerate, children }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const taRef = useRef(null);

  const copy = async () => {
    if (await copyToClipboard(msg.content)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  const startEdit = () => { setDraft(msg.content); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const submitEdit = () => {
    const t = draft.trim();
    if (!t) return;
    setEditing(false);
    if (t !== msg.content.trim()) onEdit(t);
  };

  useEffect(() => {
    const t = taRef.current;
    if (!editing || !t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 240) + "px";
  }, [draft, editing]);
  useEffect(() => {
    const t = taRef.current;
    if (editing && t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  }, [editing]);

  const waiting = !isUser && !msg.content;
  return (
    <div className={`mm-row mm-fade ${isUser ? "mm-row-user" : ""} ${editing ? "mm-row-editing" : ""}`}>
      <div className={`mm-avatar ${isUser ? "mm-avatar-user" : "mm-avatar-ai"}`}>
        {isUser ? <FaUser style={{ fontSize: 12 }} /> : <FaRobot style={{ fontSize: 14 }} />}
      </div>
      <div className="mm-col">
        {isUser && editing ? (
          <div className="mm-editbox">
            <textarea
              ref={taRef}
              value={draft}
              rows={1}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelEdit();
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submitEdit(); }
              }}
              aria-label="Edit your message"
            />
            <div className="mm-editbar">
              <span className="mm-muted mm-edithint">Enter to send · Esc to cancel</span>
              <div className="mm-editbtns">
                <button className="mm-ebtn" onClick={cancelEdit}>Cancel</button>
                <button className="mm-ebtn mm-ebtn-primary" onClick={submitEdit} disabled={!draft.trim()}>
                  <FaPaperPlane /> Save &amp; send
                </button>
              </div>
            </div>
          </div>
        ) : (
          (msg.content || children) && (
            <div className={`mm-bubble ${isUser ? "mm-bubble-user" : "mm-bubble-ai"}`}>
              {isUser
                ? <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</span>
                : waiting
                  ? <span className="mm-dots"><i /><i /><i /></span>
                  : <Markdown text={msg.content} />}
              {!waiting && children}
            </div>
          )
        )}

        {isUser && !editing && (
          <div className="mm-uactions">
            {onEdit && (
              <button onClick={startEdit} aria-label="Edit message"><FaPen /> Edit</button>
            )}
            <button onClick={copy} aria-label="Copy message">
              {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
            </button>
          </div>
        )}

        {msg.movies?.length > 0 && <MovieCards movies={msg.movies} />}
        {!isUser && <Sources sources={msg.sources} />}
        {!isUser && !children && (
          <div className="mm-actions">
            <button onClick={copy} aria-label="Copy answer">
              {copied ? <><FaCheck /> Copied</> : <><FaCopy /> Copy</>}
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate} aria-label="Regenerate answer"><FaRedo /> Regenerate</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuButton({ open, onClick }) {
  return (
    <button
      className={`mm-menu ${open ? "mm-menu-open" : ""}`}
      onClick={onClick}
      aria-label={open ? "Hide menu" : "Show menu"}
      aria-expanded={open}
      title={open ? "Hide menu (Ctrl+B)" : "Show menu (Ctrl+B)"}
    >
      <span className="mm-menu-icon" aria-hidden="true"><i /><i /><i /></span>
      <span className="mm-menu-label">{open ? "Hide" : "Menu"}</span>
    </button>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function Chatbot() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // auth
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const uid = user?.uid ?? null;

  // theme — from the website's own theme context
  const themeCtx = useTheme() ?? {};
  const isDark =
    typeof themeCtx.theme === "string" ? themeCtx.theme === "dark"
    : themeCtx.isDark ?? themeCtx.darkMode ?? themeCtx.dark ?? true;
  const theme = isDark ? "dark" : "light";

  // conversations: [{ id, title, ts, messages: [{role, content, movies?, sources?}] }]
  const [localConvs, setLocalConvs] = useState([]);
  const [cloudConvs, setCloudConvs] = useState([]);
  const [activeId, setActiveId] = useState(null); // null = a blank new chat
  const [streaming, setStreaming] = useState(null); // { convId, content, movies }
  const [errorMsg, setErrorMsg] = useState(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth >= 1024
  );
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );
  const [historyFilter, setHistoryFilter] = useState("");
  const [searchMode, setSearchMode] = useState(() => {
    try { return localStorage.getItem("mm_search_mode") || "auto"; } catch { return "auto"; }
  });
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [toast, setToast] = useState(null);
  const [showJump, setShowJump] = useState(false);
  const [navBox, setNavBox] = useState({ offset: NAVBAR_FIXED_OFFSET, fixed: true });
  const [guestCount, setGuestCount] = useState(() => {
    try { return parseInt(localStorage.getItem("anon_chat_count") || "0", 10); } catch { return 0; }
  });
  const [cloudBroken, setCloudBroken] = useState(false);

  const guestLeft = Math.max(0, GUEST_LIMIT - guestCount);
  const guestLocked = authReady && !uid && guestLeft === 0;

  // Local copy is the source of truth in-session; cloud adds chats from other devices.
  const convKey = `mm_convs_${uid ?? "guest"}`;
  const convKeyRef = useRef(convKey);
  convKeyRef.current = convKey;
  const localRef = useRef([]);
  const cloudBrokenRef = useRef(false);
  const warnedRef = useRef(false);

  const convs = useMemo(() => {
    const map = new Map();
    for (const c of localConvs) map.set(c.id, c);
    for (const c of cloudConvs) {
      const p = map.get(c.id);
      if (!p || c.ts > p.ts) map.set(c.id, c);
    }
    return [...map.values()].sort((a, b) => b.ts - a.ts);
  }, [localConvs, cloudConvs]);
  const convsRef = useRef([]);
  convsRef.current = convs;

  const activeConv = convs.find((c) => c.id === activeId) ?? null;
  const messages = activeConv?.messages ?? [];

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const cycleSearchMode = () => {
    const i = SEARCH_MODES.findIndex((m) => m.key === searchMode);
    const next = SEARCH_MODES[(i + 1) % SEARCH_MODES.length];
    setSearchMode(next.key);
    try { localStorage.setItem("mm_search_mode", next.key); } catch { /* ignore */ }
    showToast(`Web search: ${next.label} — ${next.hint}`);
  };

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  /* ── sit exactly below the site's own navbar; the page itself renders no navbar ── */
  useEffect(() => {
    const getEls = () =>
      [...document.querySelectorAll("nav:not(.mm-nav), header")].filter((el) => !el.closest(".mm-root"));
    const measure = () => {
      let bottom = 0, fixed = false;
      getEls().forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.top <= 8 && r.bottom > bottom) {
          bottom = r.bottom;
          const pos = getComputedStyle(el).position;
          fixed = pos === "fixed" || pos === "sticky";
        }
      });
      if (!bottom) { setNavBox({ offset: NAVBAR_FIXED_OFFSET, fixed: true }); return; }
      setNavBox({ offset: Math.round(bottom), fixed });
    };
    measure();
    const t = setTimeout(measure, 300);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    getEls().forEach((el) => ro?.observe(el));
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); ro?.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  /* ── the chat scrolls internally: lock page scroll and make sure the page itself is at the top ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    // if anything ever scrolls the page, snap it back so the navbar / sidebar top never hide
    const snap = () => { if (window.scrollY !== 0) window.scrollTo(0, 0); };
    window.addEventListener("scroll", snap, { passive: true });
    return () => { document.body.style.overflow = prev; window.removeEventListener("scroll", snap); };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const desk = window.innerWidth >= 1024;
      setIsDesktop((prev) => {
        if (prev !== desk) setSidebarOpen(desk);
        return desk;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) setCloudConvs([]);
    });
    return () => unsub();
  }, []);

  // load this account's / guest's chats from the device
  useEffect(() => {
    if (!authReady) return;
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(convKey) || "[]"); } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    localRef.current = arr;
    setLocalConvs(arr);
    setActiveId(null);
    setErrorMsg(null);
  }, [convKey, authReady]);

  /* ── real-time Firestore sync of conversations ── */
  useEffect(() => {
    if (!uid) { setCloudConvs([]); return; }
    cloudBrokenRef.current = false;
    warnedRef.current = false;
    setCloudBroken(false);
    const q = query(collection(db, "users", uid, "conversations"), orderBy("ts", "desc"), limit(40));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCloudConvs(snap.docs.map((d) => {
          const x = d.data();
          return { id: d.id, title: x.title || "Chat", ts: x.ts || 0, messages: Array.isArray(x.messages) ? x.messages : [] };
        }));
      },
      (err) => {
        console.error("Conversation listener failed:", err);
        cloudBrokenRef.current = true;
        setCloudBroken(true);
        showToast("Cloud sync is blocked — chats are saved on this device");
      }
    );
    return () => unsub();
  }, [uid, showToast]);

  /* ── autoscroll (container only — never the window) ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
    if (nearBottom || loading) scrollToBottom(streaming ? "auto" : "smooth");
  }, [messages, streaming, loading, errorMsg, scrollToBottom]);

  // opening another chat jumps to its latest message
  useEffect(() => {
    const t = setTimeout(() => scrollToBottom("auto"), 30);
    return () => clearTimeout(t);
  }, [activeId, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 320);
  };

  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 180) + "px";
  }, [input]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !isDesktop) setSidebarOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "TEXTAREA" && tag !== "INPUT") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDesktop]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ───────── conversation persistence ───────── */

  const saveConv = (conv) => {
    convsRef.current = [conv, ...convsRef.current.filter((c) => c.id !== conv.id)];
    const next = [conv, ...localRef.current.filter((c) => c.id !== conv.id)]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_CONVS);
    localRef.current = next;
    setLocalConvs(next);
    try { localStorage.setItem(convKeyRef.current, JSON.stringify(next)); } catch { /* ignore */ }
    if (uid && !cloudBrokenRef.current) {
      setDoc(doc(db, "users", uid, "conversations", conv.id), {
        title: conv.title, ts: conv.ts, messages: conv.messages,
      }).catch((e) => {
        console.error("Cloud save failed:", e);
        if (!warnedRef.current) { warnedRef.current = true; showToast("Couldn't sync to the cloud — chats are saved on this device"); }
      });
    }
  };

  const getConv = (id) => convsRef.current.find((c) => c.id === id);

  const addMsg = (convId, msg) => {
    const base = getConv(convId) ?? { id: convId, title: "New chat", ts: Date.now(), messages: [] };
    const title = base.messages.length === 0 && msg.role === "user" ? titleOf(msg.content) : base.title;
    saveConv({ ...base, title, ts: Date.now(), messages: [...base.messages, cleanMsg(msg)] });
  };

  const truncateConv = (convId, index) => {
    const base = getConv(convId);
    if (!base) return;
    saveConv({ ...base, ts: Date.now(), messages: base.messages.slice(0, index) });
  };

  const deleteAllIn = async (sub) => {
    const snap = await getDocs(collection(db, "users", uid, sub));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  };

  /* ───────── actions ───────── */

  const stopGeneration = () => abortRef.current?.abort();

  // opts.convId: continue this chat; opts.fresh: start a brand-new chat; opts.regen / opts.edited: don't count as a new guest question
  const sendMessage = async (text, opts = {}) => {
    const userText = (typeof text === "string" ? text : input).trim();
    if (!userText || loading) return;
    if (!authReady) return;

    if (!uid && !opts.regen && !opts.edited) {
      if (guestCount >= GUEST_LIMIT) {
        try { localStorage.setItem("auth_redirect_target", "/chatbot"); } catch { /* ignore */ }
        showToast("Free preview used up — please log in to continue");
        return;
      }
      const next = guestCount + 1;
      setGuestCount(next);
      try { localStorage.setItem("anon_chat_count", String(next)); } catch { /* ignore */ }
    }

    setInput("");
    setErrorMsg(null);
    setLoading(true);
    if (!isDesktop) setSidebarOpen(false);

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    let convId = opts.fresh ? null : (opts.convId ?? activeId);
    if (!convId) convId = newId();
    setActiveId(convId);

    // Earlier assistant movie cards are summarised so follow-ups ("the second one") work.
    const prior = (getConv(convId)?.messages ?? []).map((m) =>
      m.movies?.length
        ? { ...m, content: `${m.content}\n(Movie cards shown: ${m.movies.map((x) => `${x.title} (${x.year})`).join("; ")})` }
        : m
    );
    const history = [...prior, { role: "user", content: userText }].slice(-MAX_CONTEXT_MESSAGES);
    let partial = "";
    let listMovies = [];

    try {
      addMsg(convId, { role: "user", content: userText });

      // 1) Live TMDB: movie lists, actor lookups and title lookups come back with direct Watch / Trailer / Info links
      let listLabel = "";
      const intent = TMDB_API_KEY ? detectMovieIntent(userText) : null;
      if (intent) {
        setStatus("Fetching live movie data…");
        let found = null;
        listLabel = intent.label;
        if (intent.kind === "title") found = await fetchTitleMovies(intent.q, signal);
        else if (intent.kind === "person") {
          const r = await fetchPersonMovies(intent.name, intent.director, signal);
          if (r) { found = r.movies; listLabel = `Top films of ${r.person}`; }
        } else found = await fetchMovieList(intent, signal);
        if (found?.length) {
          listMovies = found;
          setStreaming({ convId, content: "", movies: found }); // cards appear instantly, the answer streams in below
        }
      }

      // 2) Web search for grounding (skipped when TMDB already answered, unless set to Always)
      let webContext = "";
      let sources = [];
      const skipWeb = listMovies.length > 0 && searchMode !== "on";
      if (TAVILY_API_KEY && !skipWeb && shouldSearch(userText, searchMode)) {
        setStatus("Searching the web…");
        const q = MOVIE_RE.test(userText) ? `${userText} movie details cast rating` : userText;
        try {
          const data = await tavilySearch(q, signal);
          const items = data.results ?? [];
          sources = items.filter((r) => r.url).slice(0, 4).map((r) => ({ title: r.title ?? "", url: r.url }));
          webContext =
            (data.answer ? `Summary: ${data.answer}\n\n` : "") +
            items.slice(0, 5).map((r, i) => `[${i + 1}] ${r.title ?? ""}: ${r.content?.slice(0, 500) ?? ""}`).join("\n");
          webContext = webContext.slice(0, 4000);
        } catch (e) {
          if (e.name === "AbortError") throw e;
          console.warn("Web search failed, continuing without it:", e);
        }
      }

      const extraParts = [];
      if (listMovies.length) {
        extraParts.push(
          moviesContext(listMovies, listLabel) +
          "\n\nMovie cards with direct Watch, Trailer and Info links appear under your answer automatically. " +
          "Do NOT print URLs, do NOT use a table and do NOT add the [[MOVIES: …]] line this time. " +
          "Write a short intro, then ONE bullet per movie in the SAME order as the data above: **Title (Year)** — ⭐ rating — one-line highlight. " +
          "Use only this data for facts about these movies; do not add movies that are not in the list."
        );
      }
      if (webContext) extraParts.push(`WEB CONTEXT (fetched just now):\n${webContext}`);

      // 3) Stream the answer
      setStatus("Thinking…");
      const reply = await streamGroq({
        messages: history,
        extra: extraParts.join("\n\n"),
        signal,
        onToken: (t) => {
          const { clean } = splitReply(t);
          partial = clean;
          setStatus("");
          setStreaming({ convId, content: clean, movies: listMovies });
        },
      });

      // 4) If the model named movies itself, turn them into link cards
      const { clean, titles } = splitReply(reply);
      let finalMovies = listMovies;
      if (!finalMovies.length && titles.length && TMDB_API_KEY) {
        setStatus("Finding movie links…");
        const hintLang = LANGS[Object.keys(LANGS).find((l) => new RegExp(`\\b${l}\\b`).test(userText.toLowerCase()))];
        try { finalMovies = await resolveTitles(titles, signal, hintLang); }
        catch (e) { if (e.name === "AbortError") throw e; finalMovies = []; }
      }
      const finalText =
        clean || (finalMovies.length ? "Here's what I found 🎬" : "I couldn't come up with an answer — please try rephrasing.");
      addMsg(convId, { role: "assistant", content: finalText, sources, movies: finalMovies });
    } catch (err) {
      if (err.name === "AbortError") {
        if (partial || listMovies.length) {
          addMsg(convId, { role: "assistant", content: (partial ? partial + "\n\n" : "") + "*(stopped)*", movies: listMovies });
        }
      } else {
        console.error(err);
        setErrorMsg({ text: err.message || "Something went wrong.", retryText: userText, convId });
      }
    } finally {
      setStreaming(null);
      setLoading(false);
      setStatus("");
      abortRef.current = null;
    }
  };

  // Edit happens inside the bubble; this runs when the person presses "Save & send".
  const handleEditMessage = (index, newText) => {
    if (loading || !activeId) return;
    const text = newText.trim();
    if (!text) return;
    setErrorMsg(null);
    truncateConv(activeId, index);
    sendMessage(text, { convId: activeId, edited: true });
  };

  const handleRegenerate = () => {
    if (loading || !activeId) return;
    let idx = -1;
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "user") { idx = i; break; }
    if (idx < 0) return;
    const userText = messages[idx].content;
    truncateConv(activeId, idx);
    sendMessage(userText, { convId: activeId, regen: true });
  };

  // Like Claude: "New chat" just opens a blank conversation; the old one stays in the list.
  const handleNewChat = () => {
    if (loading) return;
    setActiveId(null);
    setErrorMsg(null);
    setInput("");
    if (!isDesktop) setSidebarOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const openConv = (id) => {
    if (loading) return;
    setActiveId(id);
    setErrorMsg(null);
    if (!isDesktop) setSidebarOpen(false);
  };

  const deleteConv = async (e, c) => {
    e.stopPropagation();
    if (loading) return;
    const next = localRef.current.filter((x) => x.id !== c.id);
    localRef.current = next;
    setLocalConvs(next);
    try { localStorage.setItem(convKeyRef.current, JSON.stringify(next)); } catch { /* ignore */ }
    setCloudConvs((prev) => prev.filter((x) => x.id !== c.id));
    if (activeId === c.id) setActiveId(null);
    if (uid && !cloudBrokenRef.current) {
      try { await deleteDoc(doc(db, "users", uid, "conversations", c.id)); }
      catch (err) { console.error(err); showToast("Removed here, but couldn't delete it from the cloud"); }
    }
  };

  const clearAllChats = async () => {
    if (loading) return;
    if (!window.confirm("Delete all your chats?")) return;
    localRef.current = [];
    setLocalConvs([]);
    try { localStorage.setItem(convKeyRef.current, "[]"); } catch { /* ignore */ }
    setCloudConvs([]);
    setActiveId(null);
    if (uid && !cloudBrokenRef.current) {
      try { await deleteAllIn("conversations"); }
      catch (err) { console.error(err); showToast("Cleared here, but couldn't clear the cloud copy"); return; }
    }
    showToast("All chats deleted 🧼");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goLogin = () => {
    try { localStorage.setItem("auth_redirect_target", "/chatbot"); } catch { /* ignore */ }
    navigate("/login");
  };

  const showStreaming = streaming && streaming.convId === activeId;
  const isEmpty = messages.length === 0 && !loading;
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  const placeholder = useMemo(() => {
    if (!authReady) return "Connecting…";
    if (uid) return "Ask about a movie, actor or director…";
    return guestLeft > 0
      ? `Ask about movies (${guestLeft} free ${guestLeft === 1 ? "question" : "questions"} left)…`
      : "Log in to keep chatting";
  }, [authReady, uid, guestLeft]);

  const filteredConvs = useMemo(() => {
    const f = historyFilter.trim().toLowerCase();
    if (!f) return convs;
    return convs.filter((c) =>
      c.title.toLowerCase().includes(f) || c.messages.some((m) => String(m.content ?? "").toLowerCase().includes(f))
    );
  }, [convs, historyFilter]);
  const grouped = useMemo(() => groupHistory(filteredConvs), [filteredConvs]);

  const mode = SEARCH_MODES.find((m) => m.key === searchMode) ?? SEARCH_MODES[0];
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest";

  // Explore shortcuts start a fresh chat of their own
  const runFromSidebar = (q) => {
    if (!isDesktop) setSidebarOpen(false);
    sendMessage(q, { fresh: true });
  };

  /* ───────── render ───────── */

  return (
    <>
      {/* The website's own navbar — this page adds no navbar of its own */}
      <Navbar />
      <div
        className="mm-root"
        data-theme={theme}
        style={{ "--nav": `${navBox.offset}px`, marginTop: navBox.fixed ? navBox.offset : 0 }}
      >
        <style>{CSS}</style>
        <div className="mm-glow" />

        <div className="mm-shell">
          {sidebarOpen && !isDesktop && (
            <div className="mm-overlay" style={{ top: navBox.offset }} onClick={() => setSidebarOpen(false)} />
          )}

          {/* Always-visible edge handle to hide / show the menu */}
          {!(sidebarOpen && !isDesktop) && (
            <button
              className="mm-edge"
              style={{ left: sidebarOpen && isDesktop ? 290 : 0 }}
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? "Hide menu" : "Show menu"}
              title={sidebarOpen ? "Hide menu (Ctrl+B)" : "Show menu (Ctrl+B)"}
            >
              {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </button>
          )}

          {/* ───── Sidebar ───── */}
          <aside
            className={`mm-side ${sidebarOpen ? "mm-side-open" : ""} ${isDesktop ? "mm-side-desk" : "mm-side-mobile"}`}
            style={!isDesktop ? { top: navBox.offset, height: `calc(100% - ${navBox.offset}px)` } : undefined}
            aria-hidden={!sidebarOpen}
          >
            <div className="mm-side-inner">
              <div className="mm-side-top">
                <button className="mm-newchat" disabled={loading} onClick={handleNewChat}>
                  <FaPlus /> New chat
                </button>
                <button className="mm-iconbtn" onClick={() => setSidebarOpen(false)} aria-label="Hide menu" title="Hide menu">
                  <FaChevronLeft />
                </button>
              </div>

              <div className="mm-side-scroll mm-scroll">
                <div className="mm-sec">Explore</div>
                <div className="mm-nav">
                  {SIDEBAR_LINKS.map((l) => (
                    <button key={l.label} className="mm-navitem" disabled={loading || guestLocked} onClick={() => runFromSidebar(l.query)}>
                      {l.label}
                    </button>
                  ))}
                </div>

                <div className="mm-sec mm-sec-row">
                  <span><FaHistory /> Your chats</span>
                  {convs.length > 0 && (
                    <button className="mm-link-btn" onClick={clearAllChats}>
                      <FaTrashAlt /> Clear
                    </button>
                  )}
                </div>

                {convs.length > 0 && (
                  <div className="mm-find">
                    <FaSearch />
                    <input
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      placeholder="Search chats"
                      aria-label="Search chats"
                    />
                    {historyFilter && (
                      <button onClick={() => setHistoryFilter("")} aria-label="Clear search"><FaTimes /></button>
                    )}
                  </div>
                )}

                {convs.length === 0 ? (
                  <div className="mm-empty-note">
                    Your chats will show up here.{!uid && <><br />Log in to sync them across devices.</>}
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="mm-empty-note">No chats match “{historyFilter}”.</div>
                ) : (
                  grouped.map(([label, items]) => (
                    <div key={label} className="mm-group">
                      <div className="mm-group-label">{label}</div>
                      {items.map((c) => (
                        <div
                          key={c.id}
                          className={`mm-hist ${c.id === activeId ? "mm-hist-active" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => openConv(c.id)}
                          onKeyDown={(e) => e.key === "Enter" && openConv(c.id)}
                          title={c.title}
                        >
                          <span className="mm-hist-text">{c.title}</span>
                          <button className="mm-hist-del" onClick={(e) => deleteConv(e, c)} title="Delete chat" aria-label="Delete chat">
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <div className="mm-side-foot">
                {uid ? (
                  <div className="mm-account">
                    <div className="mm-account-av">{displayName.charAt(0).toUpperCase()}</div>
                    <div className="mm-account-meta">
                      <div className="mm-account-name">{displayName}</div>
                      <div className="mm-muted" style={{ fontSize: 11 }}>{cloudBroken ? "Saved on this device" : "Live-synced to your account"}</div>
                    </div>
                  </div>
                ) : (
                  <button className="mm-btn mm-btn-primary mm-full" onClick={goLogin}>
                    <FaSignInAlt /> Log in to save chats
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* ───── Main ───── */}
          <section className="mm-main">
            <div className="mm-toolbar">
              <div className="mm-toolbar-left">
                <MenuButton open={sidebarOpen} onClick={() => setSidebarOpen((o) => !o)} />
                <button className="mm-pill mm-pill-new" onClick={handleNewChat} disabled={loading} title="Start a new chat">
                  <FaPlus /> <span className="mm-pill-text">New chat</span>
                </button>
                <span className={`mm-live ${online ? "" : "mm-live-off"}`}>
                  <i className="mm-dot" /> {online ? "Live · movies + web" : "Offline"}
                </span>
              </div>
              <div className="mm-toolbar-right">
                <button
                  className={`mm-pill ${searchMode === "off" ? "mm-pill-off" : ""}`}
                  onClick={cycleSearchMode}
                  title={`Web search: ${mode.label}. ${mode.hint}. Click to change.`}
                >
                  <FaGlobe /> Web: {mode.label}
                </button>
              </div>
            </div>

            {!online && <div className="mm-offline">You're offline — messages will fail until you reconnect.</div>}

            {/* Messages */}
            <main ref={scrollRef} onScroll={onScroll} className="mm-messages mm-scroll">
              <div className="mm-stream">
                {isEmpty && (
                  <section className="mm-hero mm-fade">
                    <div className="mm-hero-icon">🎬</div>
                    <h2 className="mm-hero-title">
                      {uid ? `Hi ${displayName}, what shall we watch?` : "What shall we watch?"}
                    </h2>
                    <p className="mm-muted mm-hero-sub">
                      Ask about any movie, series, actor or director and I'll answer with live details plus direct Watch, Trailer and Info links. I only talk cinema 🍿
                    </p>

                    <div className="mm-prompts">
                      {STARTERS.map((p) => (
                        <button key={p} className="mm-prompt" disabled={loading || guestLocked} onClick={() => sendMessage(p, { fresh: true })}>
                          <span>{p}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {messages.map((msg, i) => (
                  <Bubble
                    key={`${activeId}-${i}`}
                    msg={msg}
                    onEdit={loading || msg.role !== "user" ? null : (t) => handleEditMessage(i, t)}
                    onRegenerate={!loading && i === lastAssistantIdx ? handleRegenerate : null}
                  />
                ))}

                {showStreaming && (
                  <Bubble msg={{ role: "assistant", content: streaming.content, movies: streaming.movies }}>
                    <span className="mm-caret" />
                  </Bubble>
                )}

                {loading && !showStreaming && (
                  <div className="mm-row mm-fade">
                    <div className="mm-avatar mm-avatar-ai"><FaRobot style={{ fontSize: 14 }} /></div>
                    <div className="mm-bubble mm-bubble-ai mm-working">
                      <span className="mm-dots"><i /><i /><i /></span>
                      <span className="mm-muted" style={{ fontSize: 12 }}>{statusMsg || "Working…"}</span>
                    </div>
                  </div>
                )}

                {errorMsg && (!errorMsg.convId || errorMsg.convId === activeId) && (
                  <div className="mm-error mm-fade">
                    <div>⚠️ {errorMsg.text}</div>
                    <button className="mm-btn" style={{ marginTop: 10 }} onClick={() => sendMessage(errorMsg.retryText, { convId: errorMsg.convId })}>
                      <FaRedo style={{ fontSize: 10 }} /> Retry
                    </button>
                  </div>
                )}
              </div>

              {showJump && (
                <button className="mm-jump" onClick={() => scrollToBottom("smooth")} aria-label="Scroll to latest">
                  <FaArrowDown />
                </button>
              )}
            </main>

            {/* Composer */}
            <footer className="mm-footer">
              <div className="mm-composer-wrap">
                {guestLocked ? (
                  <div className="mm-lock">
                    <FaLock className="mm-accent" />
                    <span>You've used your {GUEST_LIMIT} free questions. Log in for unlimited chats.</span>
                    <button className="mm-btn mm-btn-primary" onClick={goLogin}>Log in</button>
                  </div>
                ) : (
                  <div className="mm-composer">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      disabled={!authReady}
                      placeholder={placeholder}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="mm-textarea"
                    />
                    {loading ? (
                      <button className="mm-send mm-send-stop" onClick={stopGeneration} title="Stop generating" aria-label="Stop">
                        <FaStop style={{ fontSize: 12 }} />
                      </button>
                    ) : (
                      <button className="mm-send" disabled={!input.trim() || !authReady} onClick={() => sendMessage()} aria-label="Send">
                        <FaPaperPlane style={{ fontSize: 13 }} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </footer>
          </section>
        </div>

        {toast && <div className="mm-toast mm-fade">{toast}</div>}
      </div>
    </>
  );
}

/* ───────────────────────── styles (themed via CSS variables) ───────────────────────── */

const CSS = `
.mm-root{
  --bg:#07070d; --bg-glow-a:rgba(220,38,38,.22); --bg-glow-b:rgba(124,58,237,.24);
  --surface:rgba(255,255,255,.045); --surface-2:rgba(255,255,255,.085);
  --header:rgba(10,10,18,.7); --border:rgba(255,255,255,.09);
  --text:#f4f4f8; --muted:rgba(244,244,248,.55);
  --accent:#f472b6; --link:#f9a8d4;
  --user-bg:linear-gradient(135deg,rgba(220,38,38,.3),rgba(219,39,119,.3)); --user-border:rgba(244,114,182,.28);
  --side:rgba(11,11,20,.92); --code-bg:#0d0d17; --code-head:rgba(255,255,255,.06);
  --shadow:0 10px 30px rgba(0,0,0,.35);
  --error-bg:rgba(239,68,68,.12); --error-border:rgba(239,68,68,.35);
}
.mm-root[data-theme="light"]{
  --bg:#f7f5fb; --bg-glow-a:rgba(244,114,182,.32); --bg-glow-b:rgba(129,140,248,.32);
  --surface:#ffffff; --surface-2:#f0edf7;
  --header:rgba(255,255,255,.8); --border:rgba(30,20,60,.1);
  --text:#17141f; --muted:rgba(23,20,31,.58);
  --accent:#db2777; --link:#be185d;
  --user-bg:linear-gradient(135deg,#fee2e2,#fce7f3); --user-border:rgba(219,39,119,.25);
  --side:rgba(255,255,255,.95); --code-bg:#1b1830; --code-head:rgba(255,255,255,.08);
  --shadow:0 10px 30px rgba(60,30,90,.12);
  --error-bg:#fef2f2; --error-border:#fecaca;
}
.mm-root *{box-sizing:border-box}
.mm-root{position:relative;z-index:1;height:calc(100vh - var(--nav,0px));background:var(--bg);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;
  transition:background .3s,color .3s;-webkit-font-smoothing:antialiased}
@supports (height:100dvh){.mm-root{height:calc(100dvh - var(--nav,0px))}}
.mm-glow{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(circle at top left,var(--bg-glow-a),transparent 38%),
             radial-gradient(circle at bottom right,var(--bg-glow-b),transparent 38%);opacity:.55}
.mm-shell{position:relative;z-index:1;display:flex;height:100%;width:100%}
.mm-scroll{scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.mm-muted{color:var(--muted)}
.mm-accent{color:var(--accent)}
.mm-link{color:var(--link);text-decoration:underline;word-break:break-all}

/* buttons */
.mm-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:12px;font-size:12px;font-weight:600;
  background:var(--surface);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s}
.mm-btn:hover:not(:disabled){background:var(--surface-2)}
.mm-btn:disabled{opacity:.45;cursor:not-allowed}
.mm-btn-primary{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff;box-shadow:0 6px 18px rgba(236,72,153,.3);justify-content:center}
.mm-btn-primary:hover:not(:disabled){background:linear-gradient(90deg,#ef4444,#ec4899);opacity:.92}
.mm-full{width:100%}
.mm-iconbtn{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:11px;font-size:13px;
  background:var(--surface);border:1px solid var(--border);color:var(--text);cursor:pointer;transition:.2s;flex-shrink:0}
.mm-iconbtn:hover:not(:disabled){background:var(--surface-2);border-color:var(--accent)}
.mm-iconbtn:disabled{opacity:.45;cursor:not-allowed}

/* edge handle (hide / show menu) */
.mm-edge{position:absolute;top:50%;transform:translateY(-50%);z-index:46;width:22px;height:64px;padding:0;
  border-radius:0 12px 12px 0;border:1px solid var(--border);border-left:0;background:var(--surface-2);color:var(--text);
  cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;backdrop-filter:blur(10px);
  transition:left .3s cubic-bezier(.2,.8,.2,1),background .2s,color .2s,width .2s}
.mm-edge:hover{background:var(--accent);color:#fff;width:26px}

/* sidebar */
.mm-side{flex-shrink:0;background:var(--side);backdrop-filter:blur(18px);border-right:1px solid var(--border);overflow:hidden;
  transition:width .3s cubic-bezier(.2,.8,.2,1),transform .3s cubic-bezier(.2,.8,.2,1)}
.mm-side-desk{width:0}
.mm-side-desk.mm-side-open{width:290px}
.mm-side-mobile{position:fixed;left:0;z-index:45;width:min(310px,88vw);transform:translateX(-100%);box-shadow:10px 0 40px rgba(0,0,0,.28)}
.mm-side-mobile.mm-side-open{transform:translateX(0)}
.mm-side-inner{width:290px;max-width:100%;height:100%;display:flex;flex-direction:column;padding:14px}
.mm-side-mobile .mm-side-inner{width:100%}
.mm-side-top{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-shrink:0}
.mm-newchat{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 14px;border-radius:13px;border:0;cursor:pointer;
  font-size:13px;font-weight:700;color:#fff;background:linear-gradient(90deg,#ef4444,#ec4899);box-shadow:0 6px 18px rgba(236,72,153,.28);transition:.2s}
.mm-newchat:hover:not(:disabled){transform:translateY(-1px)}
.mm-newchat:disabled{opacity:.5;cursor:not-allowed}
.mm-side-scroll{flex:1;overflow-y:auto;margin:0 -4px;padding:0 4px;min-height:0}
.mm-sec{display:flex;align-items:center;gap:7px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted);margin:14px 4px 8px}
.mm-sec-row{justify-content:space-between}
.mm-sec-row span{display:inline-flex;align-items:center;gap:7px}
.mm-link-btn{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:none;color:var(--muted);
  background:transparent;border:0;cursor:pointer;padding:3px 6px;border-radius:8px}
.mm-link-btn:hover{color:#ef4444;background:var(--surface)}
.mm-nav{display:flex;flex-direction:column;gap:3px}
.mm-navitem{text-align:left;padding:9px 12px;border-radius:11px;font-size:13px;font-weight:500;color:var(--text);background:transparent;border:0;cursor:pointer;transition:.15s}
.mm-navitem:hover:not(:disabled){background:var(--surface-2)}
.mm-navitem:disabled{opacity:.45;cursor:not-allowed}
.mm-find{display:flex;align-items:center;gap:8px;padding:8px 11px;margin-bottom:6px;border-radius:11px;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:12px}
.mm-find:focus-within{border-color:var(--accent)}
.mm-find input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:var(--text);font-size:12.5px;font-family:inherit}
.mm-find button{background:transparent;border:0;color:var(--muted);cursor:pointer;padding:2px}
.mm-group{margin-bottom:8px}
.mm-group-label{font-size:10.5px;font-weight:600;color:var(--muted);margin:10px 6px 4px}
.mm-hist{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:9px 10px;border-radius:10px;font-size:12.5px;cursor:pointer;transition:.15s;color:var(--text);border:1px solid transparent}
.mm-hist:hover,.mm-hist:focus-visible{background:var(--surface-2);outline:0}
.mm-hist-active{background:var(--surface-2);border-color:var(--accent);font-weight:600}
.mm-hist-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mm-hist-del{opacity:0;flex-shrink:0;padding:5px;border-radius:7px;border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:10px;transition:.15s}
.mm-hist:hover .mm-hist-del,.mm-hist-del:focus{opacity:1}
.mm-hist-del:hover{color:#ef4444;background:var(--surface)}
@media (hover:none){.mm-hist-del{opacity:1}}
.mm-empty-note{font-size:12px;color:var(--muted);text-align:center;padding:22px 10px;line-height:1.5}
.mm-side-foot{border-top:1px solid var(--border);padding-top:12px;margin-top:8px;flex-shrink:0}
.mm-account{display:flex;align-items:center;gap:10px;padding:6px}
.mm-account-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;background:linear-gradient(135deg,#ef4444,#8b5cf6);flex-shrink:0}
.mm-account-meta{min-width:0}
.mm-account-name{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mm-overlay{position:fixed;left:0;right:0;bottom:0;z-index:40;background:rgba(0,0,0,.5);backdrop-filter:blur(2px);animation:mm-in .2s}

/* main */
.mm-main{flex:1;min-width:0;display:flex;flex-direction:column;height:100%}
.mm-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 16px;background:var(--header);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);flex-shrink:0}
.mm-toolbar-left,.mm-toolbar-right{display:flex;align-items:center;gap:10px;min-width:0}
.mm-live{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:var(--muted);white-space:nowrap}
.mm-dot{width:7px;height:7px;border-radius:50%;background:#10b981;animation:mm-pulse 2s infinite;display:inline-block}
.mm-live-off .mm-dot{background:#f59e0b;animation:none}
.mm-pill{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border-radius:999px;font-size:11.5px;font-weight:700;cursor:pointer;
  color:var(--accent);background:var(--surface);border:1px solid var(--border);transition:.2s;white-space:nowrap;font-family:inherit}
.mm-pill:hover:not(:disabled){border-color:var(--accent)}
.mm-pill:disabled{opacity:.5;cursor:not-allowed}
.mm-pill-off{color:var(--muted)}
.mm-pill-new{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff;box-shadow:0 6px 16px rgba(236,72,153,.25)}
.mm-pill-new:hover:not(:disabled){border-color:transparent;opacity:.92}
.mm-offline{background:#f59e0b;color:#1c1300;text-align:center;font-size:12px;font-weight:600;padding:6px;flex-shrink:0}
.mm-messages{position:relative;flex:1;overflow-y:auto;padding:26px 16px}
.mm-stream{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:28px;padding-bottom:28px}

/* hero */
.mm-hero{text-align:center;padding:30px 12px 10px}
.mm-hero-icon{font-size:2.8rem;margin-bottom:8px}
.mm-hero-title{font-size:1.65rem;font-weight:800;letter-spacing:-.02em;margin:0 0 6px}
.mm-hero-sub{font-size:13.5px;max-width:560px;margin:0 auto 22px;line-height:1.55}
.mm-prompts{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;max-width:700px;margin:0 auto;text-align:left}
.mm-prompt{padding:14px 16px;border-radius:16px;font-size:13px;line-height:1.45;font-weight:500;cursor:pointer;color:var(--text);
  background:var(--surface);border:1px solid var(--border);transition:.2s;box-shadow:var(--shadow);text-align:left}
.mm-prompt:hover:not(:disabled){transform:translateY(-2px);border-color:var(--accent)}
.mm-prompt:disabled{opacity:.45;cursor:not-allowed}

/* messages */
.mm-row{display:flex;gap:12px;width:100%}
.mm-row-user{flex-direction:row-reverse}
.mm-col{min-width:0;max-width:calc(100% - 52px);flex:1 1 auto}
.mm-row-user .mm-col{display:flex;flex-direction:column;align-items:flex-end;flex:0 1 auto}
.mm-row-editing .mm-col{flex:1 1 auto;width:100%}
.mm-avatar{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid}
.mm-avatar-user{background:rgba(236,72,153,.12);border-color:rgba(236,72,153,.3);color:var(--accent)}
.mm-avatar-ai{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#ef4444}
.mm-bubble{border-radius:20px;padding:16px 20px;font-size:15px;line-height:1.75;border:1px solid var(--border);box-shadow:var(--shadow);max-width:100%;display:inline-block}
.mm-bubble-user{background:var(--user-bg);border-color:var(--user-border);color:var(--text);border-top-right-radius:6px}
.mm-bubble-ai{background:var(--surface);color:var(--text);border-top-left-radius:6px}
.mm-working{display:flex;align-items:center;gap:12px}
.mm-caret{display:inline-block;width:7px;height:15px;margin-left:3px;vertical-align:-2px;background:var(--accent);animation:mm-blink 1s steps(2) infinite;border-radius:2px}
.mm-dots{display:inline-flex;gap:4px}
.mm-dots i{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:mm-bounce 1.2s infinite}
.mm-dots i:nth-child(2){animation-delay:.15s}.mm-dots i:nth-child(3){animation-delay:.3s}
.mm-dots + .mm-caret{display:none}

/* action buttons under messages */
.mm-actions,.mm-uactions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mm-actions{padding-left:2px}
.mm-actions button,.mm-uactions button{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;
  border:1px solid var(--border);background:var(--surface);color:var(--muted);cursor:pointer;font-size:11.5px;font-weight:600;font-family:inherit;transition:.18s}
.mm-actions button svg,.mm-uactions button svg{font-size:10.5px}
.mm-actions button:hover,.mm-uactions button:hover{background:var(--surface-2);color:var(--accent);border-color:var(--accent);transform:translateY(-1px)}
.mm-uactions{opacity:.6;transition:opacity .2s}
.mm-row:hover .mm-uactions,.mm-uactions:focus-within{opacity:1}
@media (hover:none){.mm-uactions{opacity:1}}

/* inline edit box */
.mm-editbox{width:100%;max-width:100%;padding:12px 14px;border-radius:20px;border-top-right-radius:6px;background:var(--surface);
  border:1.5px solid var(--accent);box-shadow:var(--shadow);animation:mm-in .2s ease both}
.mm-editbox textarea{display:block;width:100%;resize:none;background:transparent;border:0;outline:0;color:var(--text);font-size:15px;line-height:1.65;
  font-family:inherit;padding:2px 2px 8px;max-height:240px}
.mm-editbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--border)}
.mm-edithint{font-size:11px}
.mm-editbtns{display:flex;gap:8px;margin-left:auto}
.mm-ebtn{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 14px;border-radius:999px;font-size:12px;font-weight:700;font-family:inherit;
  cursor:pointer;background:var(--surface-2);border:1px solid var(--border);color:var(--text);transition:.18s}
.mm-ebtn:hover:not(:disabled){border-color:var(--accent);color:var(--accent)}
.mm-ebtn:disabled{opacity:.45;cursor:not-allowed}
.mm-ebtn-primary{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff}
.mm-ebtn-primary:hover:not(:disabled){color:#fff;opacity:.92;border-color:transparent}
.mm-ebtn svg{font-size:10.5px}

/* sources */
.mm-sources{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px}
.mm-sources-label{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:2px}
.mm-source{font-size:11px;padding:4px 10px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border);color:var(--text);text-decoration:none;transition:.15s;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mm-source:hover{border-color:var(--accent);color:var(--accent)}

/* markdown — roomier, easier to scan */
.mm-md>*:first-child{margin-top:0}.mm-md>*:last-child{margin-bottom:0}
.mm-md p{margin:0 0 14px;word-break:break-word}
.mm-md ul,.mm-md ol{margin:0 0 16px;padding-left:24px}
.mm-md ul{list-style:disc}.mm-md ol{list-style:decimal}
.mm-md li{margin:0 0 9px;padding-left:4px;word-break:break-word;line-height:1.7}
.mm-md li::marker{color:var(--accent);font-weight:700}
.mm-md strong{font-weight:700}
.mm-h{font-weight:800;margin:20px 0 10px;line-height:1.3;padding-bottom:6px;border-bottom:1px solid var(--border)}
.mm-h1{font-size:1.25rem}.mm-h2{font-size:1.12rem}.mm-h3{font-size:1.02rem}.mm-h4{font-size:.95rem;border-bottom:0}
.mm-quote{margin:0 0 14px;padding:6px 14px;border-left:3px solid var(--accent);color:var(--muted);background:var(--surface-2);border-radius:0 10px 10px 0}
.mm-hr{border:0;border-top:1px solid var(--border);margin:16px 0}
.mm-icode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;padding:2px 6px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border)}
.mm-tablewrap{margin:4px 0 16px;overflow-x:auto;border-radius:12px;border:1px solid var(--border)}
.mm-table{width:100%;border-collapse:collapse;font-size:13.5px;line-height:1.5}
.mm-table th{text-align:left;font-weight:700;padding:10px 14px;background:var(--surface-2);border-bottom:1px solid var(--border);white-space:nowrap}
.mm-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top}
.mm-table tr:last-child td{border-bottom:0}
.mm-table tbody tr:hover td{background:var(--surface-2)}
.mm-code{margin:12px 0 16px;border-radius:12px;overflow:hidden;background:var(--code-bg);border:1px solid var(--border)}
.mm-code-head{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--code-head);font-size:11px;color:rgba(255,255,255,.6);font-family:ui-monospace,monospace}
.mm-code-head button{display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;color:rgba(255,255,255,.7);cursor:pointer;font-size:11px;padding:3px 6px;border-radius:6px}
.mm-code-head button:hover{background:rgba(255,255,255,.1);color:#fff}
.mm-code pre{margin:0;padding:12px 14px;overflow-x:auto;font-size:12.5px;line-height:1.6;color:#e8e8f2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre}

/* movie link cards */
.mm-mcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;margin-top:14px}
.mm-mcard{display:flex;gap:12px;padding:10px;border-radius:16px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow);transition:.2s;min-width:0}
.mm-mcard:hover{border-color:var(--accent);transform:translateY(-2px)}
.mm-mposter{position:relative;width:86px;flex-shrink:0;aspect-ratio:2/3;border-radius:11px;overflow:hidden;background:var(--surface-2);display:block}
.mm-mposter img{width:100%;height:100%;object-fit:cover;display:block}
.mm-poster-fallback{height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem}
.mm-rank{position:absolute;top:5px;left:5px;min-width:20px;height:20px;border-radius:7px;background:rgba(0,0,0,.72);color:#fff;font-size:10.5px;font-weight:800;display:flex;align-items:center;justify-content:center}
.mm-mbody{min-width:0;flex:1;display:flex;flex-direction:column;gap:5px}
.mm-mtitle{font-size:14px;font-weight:800;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mm-mmeta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;font-size:11.5px;color:var(--muted)}
.mm-mrate{display:inline-flex;align-items:center;gap:4px;color:#f59e0b;font-weight:700}
.mm-mgenres{font-size:11px}
.mm-chips{display:flex;flex-wrap:wrap;gap:5px}
.mm-chip{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--surface-2);border:1px solid var(--border)}
.mm-mlinks{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:4px}
.mm-mlink{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:9px;font-size:11.5px;font-weight:700;text-decoration:none;color:var(--text);
  background:var(--surface-2);border:1px solid var(--border);transition:.15s}
.mm-mlink:hover{border-color:var(--accent);color:var(--accent)}
.mm-mlink-main{background:linear-gradient(90deg,#ef4444,#ec4899);border-color:transparent;color:#fff}
.mm-mlink-main:hover{color:#fff;opacity:.9;border-color:transparent}

.mm-error{padding:14px 16px;border-radius:16px;background:var(--error-bg);border:1px solid var(--error-border);font-size:13.5px}
.mm-jump{position:sticky;bottom:6px;left:100%;margin-right:4px;float:right;width:38px;height:38px;border-radius:50%;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;transition:.2s}
.mm-jump:hover{border-color:var(--accent);color:var(--accent)}

/* composer */
.mm-footer{padding:10px 16px;background:var(--header);backdrop-filter:blur(18px);border-top:1px solid var(--border);flex-shrink:0}
.mm-composer-wrap{max-width:860px;margin:0 auto}
.mm-composer{display:flex;align-items:flex-end;gap:8px;padding:6px;border-radius:20px;background:var(--surface);border:1px solid var(--border);transition:.2s;box-shadow:var(--shadow)}
.mm-composer:focus-within{border-color:var(--accent)}
.mm-textarea{flex:1;resize:none;background:transparent;outline:none;border:0;color:var(--text);font-size:14.5px;padding:11px 12px;max-height:180px;line-height:1.5;font-family:inherit}
.mm-textarea::placeholder{color:var(--muted)}
.mm-send{width:42px;height:42px;border-radius:14px;border:0;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;
  background:linear-gradient(90deg,#ef4444,#ec4899);transition:.15s;flex-shrink:0}
.mm-send:hover:not(:disabled){transform:scale(1.05)}.mm-send:active:not(:disabled){transform:scale(.95)}
.mm-send:disabled{opacity:.4;cursor:not-allowed}
.mm-send-stop{background:#374151}
.mm-lock{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:14px;border-radius:16px;background:var(--surface);border:1px solid var(--border);font-size:13px}

.mm-toast{position:fixed;bottom:96px;left:50%;transform:translateX(-50%);z-index:60;padding:10px 18px;border-radius:999px;background:var(--text);color:var(--bg);font-size:12.5px;font-weight:600;box-shadow:var(--shadow);max-width:90vw;text-align:center}
.mm-fade{animation:mm-in .3s ease both}
@keyframes mm-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mm-blink{50%{opacity:0}}
@keyframes mm-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}
@keyframes mm-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}

/* menu button */
.mm-menu{display:inline-flex;align-items:center;gap:10px;height:38px;padding:0 14px 0 12px;border-radius:999px;cursor:pointer;color:var(--text);
  font-family:inherit;font-size:12.5px;font-weight:700;letter-spacing:.02em;border:1px solid transparent;
  background:linear-gradient(var(--surface-2),var(--surface-2)) padding-box,linear-gradient(90deg,#ef4444,#ec4899,#8b5cf6) border-box;
  transition:transform .2s,box-shadow .2s}
.mm-menu:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(236,72,153,.28)}
.mm-menu:active{transform:scale(.96)}
.mm-menu:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.mm-menu-icon{position:relative;width:18px;height:14px;flex-shrink:0;display:block}
.mm-menu-icon i{position:absolute;left:0;height:2px;border-radius:2px;background:linear-gradient(90deg,#ef4444,#ec4899);
  transition:transform .3s cubic-bezier(.2,.8,.2,1),opacity .2s,width .3s,top .3s}
.mm-menu-icon i:nth-child(1){top:0;width:18px}
.mm-menu-icon i:nth-child(2){top:6px;width:12px}
.mm-menu-icon i:nth-child(3){top:12px;width:15px}
.mm-menu:hover .mm-menu-icon i{width:18px}
.mm-menu-open .mm-menu-icon i:nth-child(1){top:6px;width:18px;transform:rotate(45deg)}
.mm-menu-open .mm-menu-icon i:nth-child(2){opacity:0;transform:translateX(-6px)}
.mm-menu-open .mm-menu-icon i:nth-child(3){top:6px;width:18px;transform:rotate(-45deg)}
@media (max-width:480px){.mm-menu-label{display:none}.mm-menu{padding:0 12px}}
@media (max-width:900px){.mm-live{display:none}}

@media (max-width:640px){
  .mm-toolbar{padding:8px 10px}
  .mm-messages{padding:16px 10px 16px 18px}
  .mm-pill{padding:7px 10px}
  .mm-hero-title{font-size:1.35rem}
  .mm-col{max-width:calc(100% - 46px)}
  .mm-avatar{width:32px;height:32px}
  .mm-bubble{padding:14px 16px;font-size:14.5px}
  .mm-mcards{grid-template-columns:1fr}
}
`;