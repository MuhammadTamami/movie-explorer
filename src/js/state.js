/**
 * state.js
 * State global sederhana (bukan React).
 * Kita simpan data di 1 tempat, supaya UI gampang.
 */

import { loadFavorites, saveFavorites, toggleFavorite, loadRecentSearch, loadTheme } from "./storage.js";

export const state = {
  // query pencarian saat ini
  query: "",

  // pagination (kita buat client-side paging)
  page: 1,
  pageSize: 10,

  // hasil search mentah (array show dari API)
  results: [],

  // detail show yang sedang dibuka
  activeShow: null,

  // favorites dari localStorage
  favorites: loadFavorites(),

  // UI states
  isLoading: false,
  error: "",

  // Recent search
  recent: loadRecentSearch(),

  // tema
  theme: loadTheme(),

  // Controls
  sort: "relevance",
  filterRatedOnly: false,
  genre: "all",
};

export function setLoading(v) {
  state.isLoading = v;
}

export function setError(msg) {
  state.error = msg || "";
}

export function setQuery(q) {
  state.query = q;
  state.page = 1; // kalau query berubah, balik ke page 1
}

export function setPage(p) {
  state.page = Math.max(1, p);
}

export function setResults(list) {
  state.results = Array.isArray(list) ? list : [];
}

export function setActiveShow(show) {
  state.activeShow = show || null;
}

export function toggleFavFromShow(show) {
  // Simpan data minimal biar localStorage ringan
  const item = {
    id: show.id,
    name: show.name,
    image: show.image?.medium || show.image?.original || null,
    premiered: show.premiered || "",
  };

  state.favorites = toggleFavorite(state.favorites, item);
  saveFavorites(state.favorites);
}

export function setRecent(list) {
  state.recent = Array.isArray(list) ? list : [];
}

export function setTheme(theme) {
  state.theme = theme === "light" ? "light" : "dark";
}

export function setSort(v) {
  state.sort = v === "rating_desc" ? "rating_desc" : "relevance"
}

export function setfilterRatedOnly(v) {
  state.filterRatedOnly = Boolean(v);
}

export function setGenre(v) {
  state.genre = v || "all";
}