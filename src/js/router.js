/**
 * router.js
 * Hash router
 * - #/search?q=...
 * - #/detail/:id
 * - #/favorites
 */

import { parseHashQuery } from "./utils.js";

export function getRoute() {
    const hash = window.location.hash || "#/search";

    // memisahkan path dan query
    const path = hash.split("?")[0]; // "#/search" atau "#/detail/123"
    const query = parseHashQuery(hash)

    // Normalisasi
    const clean = path.replace(/^#/, ""); // "/search" atau "/detail/123"

    // Pecah jadi segmen
    const parts = clean.split("/").filter(Boolean); // ["search"] atau ["detail", "123"]

    return { parts, query, raw: hash};
}
