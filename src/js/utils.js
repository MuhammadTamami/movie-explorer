/**
 * utils.js
 * Kumpulan helper kecil:
 * - debounce: nahan input biar fetch tidak spam
 * - qs: parse query string dari hash
 * - stripHtml: buang tag HTML dari summary (TVMaze summary itu HTML)
 */

export function debounce(fn, wait = 400) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Parse query string dari hash route.
 * Contoh hash: "#/search?q=batman&page=2"
 * return: { q: "batman", page: "2" }
 */
export function parseHashQuery(hash) {
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return {};

  const queryString = hash.slice(qIndex + 1);
  const params = new URLSearchParams(queryString);

  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

export function stripHtml(html) {
  if (!html) return "";
  // Cara simple buang tag
  return html.replace(/<[^>]*>/g, "").trim();
}

export function safeText(text, fallback = "-") {
  if (text === null || text === undefined || String(text).trim() === "") return fallback;
  return String(text);
}