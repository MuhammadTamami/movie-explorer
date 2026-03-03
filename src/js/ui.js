/**
 * ui.js
 * rendering html + event binding
 * Prinsip : UI ambil data dari state, lalu render ke #app
 */

import { state } from "./state.js";
import { stripHtml, safeText } from "./utils.js";
import { isFavorite } from "./storage.js";

const appEl = () => document.getElementById("app");

function htmlEscape(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

/**
 * Helper : Bikin card show
 */

function showCard(show) {
    const title = htmlEscape(show.name);
    const year = show.premiered ? show.premiered.slice(0, 4) : "-";
    const rating = show.rating?.average ?? "-"
    const img = show.image?.medium || show.image?.original || "";
    const fav = isFavorite(state.favorites, show.id)
    const badge = fav ? `<span class="fav-badge"> ★ Favorite</span>` : ""

    const imgTag = img
        ? `<img class="card__img" src="${img}" alt="${title}" loading="lazy" />`
        : `<div class="card__img" aria-label="No Poster"></div>`;

    return `
        <a class="card" href="#/detail/${show.id}">
            ${imgTag}
            ${badge}
            <div class="card__body">
                <p class="card__title"> ${title}</p>
                <div class="meta">Year: ${htmlEscape(year)} • Rating: ${htmlEscape(rating)}</div>
            </div>
        </a>
    `;
}

export function renderSkeleton() {
    appEl().innerHTML = `
        <section class="section">
            <div class="state">
                <div class="sub">Loading...</div>
                <div class="skeleton">
                    ${new Array(10).fill(0).map(() => `<div class="skel"></div>`).join("")}
                </div>
            </div>
        </section>
    `;
}

export function renderError(message) {
    appEl().innerHTML = `
        <section class="section">
            <div class="state">
                <h2 class="h1">Error</h2>
                <p class="sub">${htmlEscape(message || "Something went Wrong")} </p>
                <a class="btn" href="#/search">Back to Search</a>
            </div>
        </section>
    `;
}

function getGenresFromResults(items) {
    const set = new Set();
    (Array.isArray(items) ? items : []).forEach((s) => {
        (Array.isArray(s.genres) ? s.genres : []).forEach((g) => set.add(g));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function renderSearchView({
    onSearchSubmit,
    onSearchInput,
    onPagePrev,
    onPageNext,
    onToggleTheme,
    onChangeSort,
    onToggleRatedOnly,
    onChangeGenre,
    onPickRecent,
    onClearRecent,
    results,
    allResults,
}) {
    // Ambil result page
    const safeResults = Array.isArray(results) ? results : [];
    const total = safeResults.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const page = Math.min(state.page, totalPages);
    const start = (page - 1) * state.pageSize;
    const pageItems = safeResults.slice(start, start + state.pageSize);
    const isDiscover = !state.query;

    const content = pageItems.length
        ? `<div class="grid">${pageItems.map(showCard).join("")}</div>`
        : `<div class="state"><p class="sub">No Results. Try another keyword.</p></div>`;

    appEl().innerHTML = `
        <section class="section">
           <h1 class="h1">${isDiscover ? "Discover" : "Search"}</h1>
            <p class="sub">
            ${isDiscover ? "Random picks buat kamu. Klik kartu untuk detail." : "Cari show (TVMaze). Debounce + cancel request aktif."}
            </p>
            <div class="controls">
            <button id="themeBtn" class="btn" type="button">
                ${state.theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <select id="sortSelect" class="select">
                <option value="relevance" ${state.sort === "relevance" ? "selected" : ""}>Sort: Relevance</option>
                <option value="rating_desc" ${state.sort === "rating_desc" ? "selected" : ""}>Sort: Rating (High → Low)</option>
            </select>

            <label class="chip" style="display:flex; align-items:center; gap:8px;">
                <input id="ratedOnly" type="checkbox" ${state.filterRatedOnly ? "checked" : ""}/>
                Rated only
            </label>

            <select id="genreSelect" class="select">
                <option value="all" ${state.genre === "all" ? "selected" : ""}>Genre: All</option>
                ${getGenresFromResults(allResults).map(g => `
                <option value="${htmlEscape(g)}" ${state.genre === g ? "selected" : ""}>
                    Genre: ${htmlEscape(g)}
                </option>
                `).join("")}
            </select>
            </div>

            <div class="chip-row">
            <span class="sub" style="margin:0;">Recent:</span>
            ${state.recent.length ? state.recent.map((q) => `
                <button class="chip" type="button" data-recent="${htmlEscape(q)}">${htmlEscape(q)}</button>
            `).join("") : `<span class="sub" style="margin:0;">(empty)</span>`}
            ${state.recent.length ? `<button id="clearRecent" class="chip" type="button">Clear</button>` : ""}
            </div>

            <form id="searchForm" class="searchbar">
            <input id="searchInput" class="input" placeholder="Ketik judul... (contoh: batman)" value="${htmlEscape(state.query)}" />
            <button class="btn" type="submit">Search</button>
            </form>
            
            ${total ? `<p class="sub">Found: ${total} results</p>` : `<p class="sub">Type something to search</p>`}
            
            ${content}
            
            <div class="pager">
                <button id="prevBtn" class="btn" ${page <= 1 ? "disabled" : ""}>Prev</button>
                <span class="pager__info">Page ${page} / ${totalPages}</span>
                <button id="nextBtn" class="btn" ${page >= totalPages ? "disabled" : ""}>Next</button>
            </div>
        </section>
        `;

    // Bind Events
    const form = document.getElementById("searchForm")
    const input = document.getElementById("searchInput")
    const prevBtn = document.getElementById("prevBtn")
    const nextBtn = document.getElementById("nextBtn")
    const themeBtn = document.getElementById("themeBtn")
    const sortSelect = document.getElementById("sortSelect")
    const ratedOnly = document.getElementById("ratedOnly")
    const genreSelect = document.getElementById("genreSelect")
    const clearRecent = document.getElementById("clearRecent")

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        onSearchSubmit(input.value);
    });

    input.addEventListener("input", (e) => {
        onSearchInput(e.target.value)
    });

    prevBtn.addEventListener("click", () => onPagePrev())
    nextBtn.addEventListener("click", () => onPageNext())

    themeBtn?.addEventListener("click", () => onToggleTheme())
    sortSelect?.addEventListener("change", (e) => onChangeSort(e.target.value))
    ratedOnly?.addEventListener("change", (e) => onToggleRatedOnly(e.target.checked))
    genreSelect?.addEventListener("change", (e) => onChangeGenre(e.target.value))

    document.querySelectorAll("[data-recent]").forEach((btn) => {
        btn.addEventListener("click", () => {
            onPickRecent(btn.getAttribute("data-recent"));
        });
    });

    clearRecent?.addEventListener("click", () => onClearRecent());
}

export function renderDetailView({ onToggleFavorites }) {
    const show = state.activeShow;
    if (!show) {
        renderError("Show not found")
        return;
    }

    const title = htmlEscape(show.name);
    const img = show.image?.original || show.image?.medium || "";
    const summary = htmlEscape(stripHtml(show.summary));
    const year = show.premiered ? show.premiered.slice(0, 4) : "";
    const rating = show.rating?.average ?? "-";
    const genres = Array.isArray(show.genres) ? show.genres : [];

    const fav = isFavorite(state.favorites, show.id);

    appEl().innerHTML = `
        <section class="section">
            <a class="btn" href="#/search">← Back</a>
            
            <h1 class="h1">${title}</h1>
            <p class="sub">Year: ${htmlEscape(year)} • Rating : ${htmlEscape(rating)}</p>
            
            <div class="detail">
                <div>
                    ${img
            ? `<img class="detail__poster" src="${img}" alt="${title}" />`
            : `<div class="state">No Poster</div>`
        }
                    <div style="margin-top:12px; display:flex; gap:10px;">
                        <button id="favBtn" class="btn">${fav ? "★ Remove Favorite" : "☆ Add Favorite"}</button>
                        <a class="btn" href="#/favorites">Go to Favorites</a>
                    </div>
                </div>
                
                <div>
                    <div class="badges">
                    ${genres.map((g) => `<span class="badge">${htmlEscape(g)}</span>`).join("")}
                    </div>
                    
                    <div class="state">
                        <p class="sub" style="white-space:pre-wrap; margin:0;">${safeText(summary, "No Summary")}</p>
                    </div>
                </div>
            </div>
        </section>
        `;

    document.getElementById("favBtn").addEventListener("click", () => {
        onToggleFavorites(show);
    });
}


export function renderFavoritesView({ onRemoveFavorite }) {
    const favs = state.favorites;

    const list = favs.length
        ? `<div class="grid">
        ${favs
            .map((f) => {
                const title = htmlEscape(f.name);
                const year = f.premiered ? f.premiered.slice(0, 4) : "-";
                const img = f.image || "";

                const imgTag = img
                    ? `<img class="card__img" src="${img}" alt="${title}" loading="lazy" />`
                    : `<div class="card__img" aria-label="No poster"></div>`;

                return `
              <div class="card">
                <a href="#/detail/${f.id}">
                  ${imgTag}
                </a>
                <div class="card__body">
                  <p class="card__title">${title}</p>
                  <div class="meta">Year: ${htmlEscape(year)}</div>
                  <button class="btn" data-remove="${f.id}" style="margin-top:10px; width:100%;">Remove</button>
                </div>
              </div>
            `;
            })
            .join("")}
      </div>`
        : `<div class="state"><p class="sub">No favorites yet. Add from detail page.</p></div>`;

    appEl().innerHTML = `
        <section class="section">
            <h1 class="h1">Favorites</h1>
            <p class="sub">Disimpan di Local Storage.</p>
            ${list}
        </section>
        `;

    // Bind remove buttons
    document.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = Number(btn.getAttribute("data-remove"))
            onRemoveFavorite(id);
        });
    });
}
