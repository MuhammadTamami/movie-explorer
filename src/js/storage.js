/**
 * storage.js
 * Semua urusan localStorage ditaruh disini
 */

const KEY = "movie_explorer_favorites_v1";

const RECENT_KEY = "movie_explorer_recent_v1";
const RECENT_LIMIT = 8;

export function loadRecentSearch() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        if (!raw) return[];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return[];
    }
}

export function saveRecentSearch(list) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

/**
 * Menambahkan keyword ke recent :
 * - trim
 * - dedupe
 * - limit recent_limit-nya
 */

export function addRecentSearch(keyword) {
    const k = (keyword || "").trim();
    if (!k) return loadRecentSearch();

    const current = loadRecentSearch();
    const next = [k, ...current.filter((x) => x.toLowerCase() !== k.toLowerCase())].slice(0, RECENT_LIMIT);
    saveRecentSearch(next);
    return next;
}

export function clearRecentSearch() {
    localStorage.removeItem(RECENT_KEY);
    return
}

// Tema
const THEME_KEY = "movie_explorer_theme_v1";

export function loadTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
}

export function saveTheme(theme) {
    return localStorage.setItem(THEME_KEY, theme);
}

export function loadFavorites() {
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return [];
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}


export function saveFavorites(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
}

/**
 * Apakah sudah ada id di favorites
 */

export function isFavorite(favs, id) {
    return favs.some((x) => x.id === id);
}

/**
 * Toggle Favorite :
 * kalau sudah ada -> remove
 * kalau belum -> add
 */

export function toggleFavorite(favs, item) {
    const exists = isFavorite(favs, item.id)

    if (exists) {
        return favs.filter((x) => x.id !== item.id)
    }

    return [...favs, item];
}