/**
 * app.js
 * Ini otaknya app:
 * - listen route changes
 * - handle search / pagination / detail / favorites
 * - call API
 * - update state
 * - render UI
 */

import { getRoute } from "./router.js";
import { debounce } from "./utils.js";
import { searchShows, getShow, getRandomShows, } from "./api.js";
import {
  state,
  setLoading,
  setError,
  setQuery,
  setPage,
  setResults,
  setActiveShow,
  toggleFavFromShow,
  setRecent,
  setTheme,
  setSort,
  setGenre,
  setfilterRatedOnly,
} from "./state.js";

import {
  renderSkeleton,
  renderError,
  renderSearchView,
  renderDetailView,
  renderFavoritesView,
} from "./ui.js";

import {
   saveFavorites,
   addRecentSearch,
   clearRecentSearch,
   saveTheme, 
  } from "./storage.js";

// AbortController supaya request lama bisa dibatalkan
let searchAbort = null;
let detailAbort = null;
let discoverAbort = null;

// Theme
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

/**
 * Helper: pindah route search dengan query
 */
function goSearch(q) {
  const trimmed = (q || "").trim();
  // encode query ke hash
  window.location.hash = trimmed ? `#/search?q=${encodeURIComponent(trimmed)}` : "#/search";
}

async function loadDiscover() {
  setError("");

  if(discoverAbort) discoverAbort.abort();
  discoverAbort = new AbortController();

  try {
    setLoading(true);
    renderSkeleton();
    const picks = await getRandomShows(50, discoverAbort.signal);
    setResults(picks);
    setPage(1);
  } catch(err) {
    if (err?.name !== "Abort Error") setError(err.message || "Failed to load discover");
  } finally {
    setLoading(false);
    render();
  }
}

/**
 * Search: fetch data dari API lalu simpan ke state
 */
async function doSearch(query) {
  const q = (query || "").trim();
  setError("");

  // kalau query kosong, kosongkan results dan render saja
  if (!q) {
    // setResults([]);
    setQuery("");
    loadDiscover()
    // render();
    return;
  }

  // cancel request lama
  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();

  try {
    setLoading(true);
    renderSkeleton();

    const shows = await searchShows(q, searchAbort.signal);
    setQuery(q);
    setResults(shows);
    const nextRecent = addRecentSearch(q);
    setRecent(nextRecent);

    setPage(1);
  } catch (err) {
    console.error(err)
    // Kalau error karena abort, kita diam saja (itu normal)
    if (err?.name !== "AbortError") {
      setError(err.message || "Failed to search");
    }
  } finally {
    setLoading(false);
    render();
  }
}

/**
 * Detail: fetch show by id
 */
async function doDetail(id) {
  setError("");
  setActiveShow(null);

  if (detailAbort) detailAbort.abort();
  detailAbort = new AbortController();

  try {
    setLoading(true);
    renderSkeleton();

    const show = await getShow(id, detailAbort.signal);
    setActiveShow(show);
  } catch (err) {
    console.error(err);
    if (err?.name !== "AbortError") {
      setError(err.message || "Failed to load detail");
    }
  } finally {
    setLoading(false);
    render();
  }
}

/**
 * Render berdasarkan route saat ini
 */
function render() {
  const { parts, query } = getRoute();

  // Global error handler
  if (state.error) {
    renderError(state.error);
    return;
  }

  // Route: /home
  if (parts[0] || parts[0 === "home"]) {
    // kalau belum ada data, load random
    if(!state.results || state.results.length === 0 || state.query) {
      setQuery("");
      loadDiscover();
      return;
    }
  }

  // Route: /search
  if (parts[0] === "search" || !parts[0]) {
    // Sync query dari URL (kalau user refresh halaman)
    const q = query.q ? decodeURIComponent(query.q) : "";

    // Kalau URL query beda dari state.query, fetch ulang
    // (biar refresh tetap konsisten)
    if (q !== state.query) {
      // panggil search tapi jangan debounce saat initial load
      doSearch(q);
      return;
    }
    
    const displayed = getDisplayedResults();

    renderSearchView({
      results: displayed,
      allResults: state.results,

      onSearchSubmit: (text) => goSearch(text),

      // input event kita debounce supaya tidak spam fetch
      onSearchInput: debouncedSearchInput,

      onPagePrev: () => {
        setPage(state.page - 1);
        render();
      },

      onPageNext: () => {
        setPage(state.page + 1);
        render();
      },

      onToggleTheme: () => {
        const next = state.theme === "dark" ? "light" : "dark";
        setTheme(next);
        saveTheme(next);
        applyTheme();
        render();
      },

      onChangeSort: (v) => { 
        setSort(v);
        setPage(1);
        render(); 
      },

      onToggleRatedOnly: (checked) => {
        setfilterRatedOnly(checked);
        setPage(1);
        render();
      },

      onChangeGenre: (g) => {
        setGenre(g);
        setPage(1);
        render();
      },

      onPickRecent: (q) => {
        goSearch(q);
      },

      onClearRecent: () => {
        const empty = clearRecentSearch();
        setRecent(empty);
        render();
      },

    });

    return;
  }

  // Route: /detail/:id
  if (parts[0] === "detail" && parts[1]) {
    const id = Number(parts[1]);
    // Kalau state.activeShow bukan show ini, fetch
    if (!state.activeShow || state.activeShow.id !== id) {
      doDetail(id);
      return;
    }

    renderDetailView({
      onToggleFavorites: (show) => {
        toggleFavFromShow(show);
        render(); // update tombol favorite
      },
    });

    return;
  }

  // Route: /favorites
  if (parts[0] === "favorites") {
    renderFavoritesView({
      onRemoveFavorites: (id) => {
        // Remove favorite by id (immutable)
        state.favorites = state.favorites.filter((x) => x.id !== id);
        saveFavorites(state.favorites);
        render();
      },
    });
    return;
  }

  // Unknown route -> back to search
  window.location.hash = "#/search";
}

/**
 * Debounced handler untuk input search:
 * - update route search (supaya shareable)
 * - doSearch akan jalan via render() karena route berubah
 */
const debouncedSearchInput = debounce((text) => {
  goSearch(text);
}, 450);

/**
 * Router listener:
 * kalau hash berubah, render ulang
 */
window.addEventListener("hashchange", render);

// Initial render
render();
applyTheme();

function getDisplayedResults() {
  let list = Array.isArray(state.results) ? [...state.results] : [];

  // Filter: rated only
  if (state.filterRatedOnly) {
    list = list.filter(
      (s) => (s.rating?.average ?? null) !== null
    );
  }

  // Filter: genre
  if (state.genre !== "all") {
    list = list.filter(
      (s) => Array.isArray(s.genres) && s.genres.includes(state.genre)
    );
  }

  // Sort: rating high → low
  if (state.sort === "rating_desc") {
    list.sort(
      (a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1)
    );
  }

  return list;
}