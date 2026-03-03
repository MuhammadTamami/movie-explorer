/**
 * api.js
 * Semua request fetch ke TVMaze ada di sini.
 * Kita juga support AbortController supaya request lama bisa dibatalkan.
 */

const BASE = "https://api.tvmaze.com";

/**
 * Search show by query
 * Endpoint: /search/shows?q=batman
 * Response: array of { score, show }
 */
export async function searchShows(query, signal) {
  const url = `${BASE}/search/shows?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  // Kita ambil hanya "show" nya
  return data.map((x) => x.show);
}

/**
 * Get show detail by id
 * Endpoint: /shows/:id
 */
export async function getShow(id, signal) {
  const url = `${BASE}/shows/${encodeURIComponent(id)}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return await res.json();
}

// Mengambil random 1 page list
export async function getShowsPage(page = 0, signal) {
  const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`, { signal });
  if (!res.ok) throw new Error("Failed to load show pages");
  return res.json();
}

// Ambil random shows page
export async function getRandomShows(count = 12, signal) {
  const page = Math.floor(Math.random() * 200);
  const shows = await getShowsPage(page, signal);

  // Shuffle
  const copy = Array.isArray(shows) ? [...shows] : [];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}