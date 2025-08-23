<!-- Sections only; header & hero are provided by the custom theme -->

<!-- Featured -->
<section id="featured" class="mb-5">
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h2 class="h4 mb-0">Featured Events</h2>
    <a href="#search" class="btn btn-outline-primary btn-sm">Find events</a>
  </div>
  <div class="row g-4" id="featured-columns">
    <!-- Filled by JS: three columns, one Bootstrap carousel per column -->
  </div>
</section>

<!-- Map -->
<section id="map" class="mb-5">
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h2 class="h4 mb-0">On the map</h2>
    <span class="text-muted small" id="map-status">Loading events…</span>
  </div>
  <div id="events-map" class="rounded-3 shadow-sm"></div>
</section>

<!-- Search -->
<section id="search" class="mb-5">
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h2 class="h4 mb-0">Search</h2>
    <span class="text-muted small" id="results-status"></span>
  </div>

  <div class="row g-3 mb-3">
    <div class="col-md-8">
      <label for="search-input" class="form-label">Search by event name or location</label>
      <input id="search-input" type="search" class="form-control form-control-lg" placeholder="e.g. Python La Paz, Bioinformatics, Zurich…">
    </div>
    <div class="col-md-4 d-flex align-items-end gap-2">
      <button id="search-btn" class="btn btn-primary btn-lg flex-grow-1">Search</button>
      <button id="clear-btn" class="btn btn-outline-secondary btn-lg">Clear</button>
    </div>
  </div>

  <div id="results" class="row g-4">
    <!-- Filled by JS: cards grid with results -->
  </div>
</section>

<footer class="py-4 text-center text-muted small">
  Built with MkDocs, Bootstrap, and Leaflet · <a href="assets/data/events.json">events.json</a>
</footer>