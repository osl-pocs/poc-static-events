// EventHub - vanilla JS app (Bootstrap 5 + Leaflet)
// Robust init with global namespace + late-DOM fallback

/**
 * @typedef {Object} EventItem
 * @property {string} name
 * @property {string} start_date  // ISO date (YYYY-MM-DD)
 * @property {string} end_date    // ISO date (YYYY-MM-DD)
 * @property {string} location
 * @property {"free"|"paid"} free_or_paid
 * @property {string} organization_url
 * @property {string} logo
 * @property {boolean} featured
 * @property {number=} lat
 * @property {number=} lng
 */

/** @type {EventItem[]} */
let ALL_EVENTS = [];

/** @type {L.Map | null} */
let MAP = null;

/** @type {L.LayerGroup | null} */
let MAP_MARKERS = null;

// Global namespace to avoid shadowing
// (Prevents any accidental override by other scripts)
window.EventHub = window.EventHub || {};

/**
 * Join a MkDocs base_url with a relative path, safely handling slashes.
 * @param {string} base
 * @param {string} rel
 * @returns {string}
 */
function joinURL(base, rel) {
  if (!base) return rel;
  const b = base.endsWith("/") ? base : base + "/";
  const r = rel.startsWith("/") ? rel.slice(1) : rel;
  return b + r;
}

/**
 * Parse a YYYY-MM-DD to Date at local midnight.
 * @param {string} s
 * @returns {Date}
 */
function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Whether an event is current or in the future (end_date >= today).
 * @param {EventItem} ev
 * @returns {boolean}
 */
function isCurrentOrNext(ev) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = parseISODate(ev.end_date);
  return end >= today;
}

/**
 * Round-robin split of array into N buckets.
 * @template T
 * @param {T[]} arr
 * @param {number} buckets
 * @returns {T[][]}
 */
function splitRoundRobin(arr, buckets) {
  const out = Array.from({ length: buckets }, () => []);
  arr.forEach((item, idx) => {
    out[idx % buckets].push(item);
  });
  return out;
}

/**
 * Create a Bootstrap carousel column for a list of events.
 * @param {EventItem[]} events
 * @param {number} index
 * @returns {HTMLElement}
 */
function createCarouselColumn(events, index) {
  const col = document.createElement("div");
  col.className = "col-md-4";

  const carouselId = `featured-carousel-${index}`;
  const indicators = events.map((_, i) => `
    <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${i}" ${i===0?"class=\"active\"" : ""} aria-label="Slide ${i+1}"></button>
  `).join("");

  const innerSlides = events.map((ev, i) => `
    <div class="carousel-item ${i===0 ? "active" : ""}">
      <div class="card event-card">
        <img src="${ev.logo || 'assets/img/event-placeholder.svg'}" alt="${ev.name}" class="card-img-top"/>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h3 class="h6 mb-0">${ev.name}</h3>
            <span class="badge ${ev.free_or_paid === "free" ? "badge-free" : "badge-paid"}">
              ${ev.free_or_paid === "free" ? "Free" : "Paid"}
            </span>
          </div>
          <p class="mb-2 text-muted small"><i class="bi bi-geo-alt me-1"></i>${ev.location}</p>
          <p class="mb-3 small">${ev.start_date} → ${ev.end_date}</p>
          <a href="${ev.organization_url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">Details</a>
        </div>
      </div>
    </div>
  `).join("");

  col.innerHTML = `
    <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
      <div class="carousel-indicators">${indicators}</div>
      <div class="carousel-inner">${innerSlides}</div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev" aria-label="Previous">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next" aria-label="Next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
      </button>
    </div>
  `;
  return col;
}

/**
 * Render Featured section with three carousels.
 * @param {EventItem[]} events
 */
function renderFeatured(events) {
  const container = document.getElementById("featured-columns");
  if (!container) return;
  container.innerHTML = "";

  const featured = events.filter(e => e.featured && isCurrentOrNext(e));
  if (featured.length === 0) {
    container.innerHTML = '<div class="col-12 text-muted">No featured events.</div>';
    return;
  }
  const chunks = splitRoundRobin(featured, 3);
  chunks.forEach((chunk, i) => {
    if (chunk.length === 0) return;
    container.appendChild(createCarouselColumn(chunk, i + 1));
  });
}

/**
 * Initialize Leaflet map and add markers for current/future events.
 * @param {EventItem[]} events
 */
function initMap(events) {
  const mapEl = document.getElementById("events-map");
  if (!mapEl) return;
  const status = document.getElementById("map-status");

  if (!MAP) {
    MAP = L.map("events-map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(MAP);
  }
  if (MAP_MARKERS) {
    MAP.removeLayer(MAP_MARKERS);
  }
  MAP_MARKERS = L.layerGroup().addTo(MAP);

  const current = events.filter(isCurrentOrNext);
  const pts = [];

  current.forEach(ev => {
    if (typeof ev.lat === "number" && typeof ev.lng === "number") {
      const m = L.marker([ev.lat, ev.lng]).addTo(MAP_MARKERS);
      m.bindPopup(`
        <strong>${ev.name}</strong><br/>
        ${ev.location}<br/>
        ${ev.start_date} → ${ev.end_date}<br/>
        <a href="${ev.organization_url}" target="_blank" rel="noopener">Details</a>
      `);
      pts.push([ev.lat, ev.lng]);
    }
  });

  if (pts.length) {
    const bounds = L.latLngBounds(pts);
    MAP.fitBounds(bounds.pad(0.2));
    if (status) status.textContent = `${pts.length} event${pts.length > 1 ? "s" : ""} on map`;
  } else {
    MAP.setView([0, 0], 2);
    if (status) status.textContent = "No mappable events";
  }
}

/**
 * Render results list and sync map markers to results.
 * @param {EventItem[]} events
 */
function renderResults(events) {
  const grid = document.getElementById("results");
  const status = document.getElementById("results-status");
  if (!grid) return;
  grid.innerHTML = "";

  events.forEach(ev => {
    const col = document.createElement("div");
    col.className = "col-md-4";
    col.innerHTML = `
      <div class="card event-card h-100">
        <img src="${ev.logo || 'assets/img/event-placeholder.svg'}" alt="${ev.name}" class="card-img-top"/>
        <div class="card-body d-flex flex-column">
          <h3 class="h6">${ev.name}</h3>
          <p class="small text-muted mb-1">${ev.location}</p>
          <p class="small mb-3">${ev.start_date} → ${ev.end_date}</p>
          <div class="mt-auto d-flex align-items-center justify-content-between">
            <span class="badge ${ev.free_or_paid === "free" ? "badge-free" : "badge-paid"}">
              ${ev.free_or_paid === "free" ? "Free" : "Paid"}
            </span>
            <a href="${ev.organization_url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">Details</a>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });

  if (status) {
    status.textContent = events.length ? `${events.length} match${events.length > 1 ? "es" : ""}` : "No matches";
  }

  // Sync the map to results subset
  initMap(events);
}

/**
 * Simple text search by name or location.
 * @param {string} q
 * @returns {EventItem[]}
 */
function searchEvents(q) {
  const query = q.trim().toLowerCase();
  if (!query) return ALL_EVENTS.filter(isCurrentOrNext);
  return ALL_EVENTS.filter(ev =>
    isCurrentOrNext(ev) &&
    (ev.name.toLowerCase().includes(query) || ev.location.toLowerCase().includes(query))
  );
}

/**
 * Try to attach search listeners. Returns true if attached.
 * Uses id selectors to avoid relying on structure.
 * @returns {boolean}
 */
function attachSearchListeners() {
  const input = document.getElementById("search-input");
  const btn = document.getElementById("search-btn");
  const clear = document.getElementById("clear-btn");
  if (!input || !btn || !clear) return false;

  const run = () => {
    const results = searchEvents(input.value || "");
    renderResults(results);
  };

  btn.addEventListener("click", run);
  clear.addEventListener("click", () => {
    input.value = "";
    renderResults(ALL_EVENTS.filter(isCurrentOrNext));
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });

  console.log("[EventHub] Search listeners attached");
  return true;
}

/**
 * Initialize search UI (namespaced, global, robust).
 */
window.EventHub.initSearch = function initSearch() {
  console.log("[EventHub] initSearch() called");

  // Attempt immediate attach; if DOM not ready, observe and attach once available
  if (!attachSearchListeners()) {
    console.log("[EventHub] Waiting for search controls to appear…");
    const observer = new MutationObserver(() => {
      if (attachSearchListeners()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
};

/**
 * Load events from local JSON (base_url aware).
 * @returns {Promise<EventItem[]>}
 */
async function loadEvents() {
  const url = joinURL(typeof base_url !== "undefined" ? base_url : "", "assets/data/events.json");
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error("Failed to load events.json: " + res.status);
  /** @type {EventItem[]} */
  const data = await res.json();
  return data;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Always init search UI so buttons work even if data fails to load
  if (window.EventHub && typeof window.EventHub.initSearch === "function") {
    window.EventHub.initSearch();
  } else {
    console.warn("[EventHub] initSearch not defined");
  }

  try {
    ALL_EVENTS = await loadEvents();
    console.log("[EventHub] Loaded events:", ALL_EVENTS.length);
    renderFeatured(ALL_EVENTS);
    initMap(ALL_EVENTS.filter(isCurrentOrNext));
    renderResults(ALL_EVENTS.filter(isCurrentOrNext));
  } catch (err) {
    console.error(err);
    const status = document.getElementById("results-status");
    if (status) status.textContent = "Failed to load events.";
    renderResults([]);
    initMap([]);
  }
});
