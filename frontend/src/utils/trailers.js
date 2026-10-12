// src/utils/trailers.js
// Helpers for picking trailers in every available language.

// Languages requested from TMDB (TMDB has no "all languages" switch, so we list them).
// "null" includes videos that have no language set.
export const VIDEO_LANGS =
  "en,hi,ta,te,ml,kn,bn,mr,gu,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh,ar,tr,th,id,vi,pl,nl,sv,da,no,fi,cs,hu,el,he,ro,uk,fa,ms,tl,null";

const TYPE_RANK = { Trailer: 0, Teaser: 1, Clip: 2, Featurette: 3 };

// Lower score = better video (trailer before teaser before clip; official before unofficial)
const score = (v) => (TYPE_RANK[v.type] ?? 4) * 2 + (v.official ? 0 : 1);

export function languageName(code) {
  if (!code || code === "xx") return "No language";
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

// One best YouTube video per language, best overall first.
// Returns [{ key, lang, label, type }]
export function buildTrailerOptions(videos = []) {
  const best = new Map();

  for (const v of videos) {
    if (v.site !== "YouTube" || !v.key) continue;
    const lang = v.iso_639_1 || "xx";
    const current = best.get(lang);
    if (!current || score(v) < score(current)) best.set(lang, v);
  }

  return [...best.entries()]
    .map(([lang, v]) => ({
      key: v.key,
      lang,
      label: languageName(lang),
      type: v.type,
      score: score(v),
    }))
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
    .map(({ score: _score, ...option }) => option);
}