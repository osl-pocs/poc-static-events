(function() {
  // Smooth scroll for in-page anchors (works with absolute/relative links)
  document.querySelectorAll('a.nav-link[href*="#"]').forEach(function(a) {
    a.addEventListener("click", function(e) {
      const hash = a.hash || (function() { try { return new URL(a.href).hash; } catch { return ""; } })();
      if (!hash || hash === "#") return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 72, behavior: "smooth" });
      history.replaceState(null, "", hash);
    });
  });

  // Highlight active section
  const ids = ["featured", "map", "search"];
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
  const links = Array.from(document.querySelectorAll('a.nav-link[href*="#"]'));
  const opt = { rootMargin: "-40% 0px -55% 0px", threshold: 0 };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = "#" + entry.target.id;
        links.forEach(l => {
          const h = l.hash || (function() { try { return new URL(l.href).hash; } catch { return ""; } })();
          l.classList.toggle("active", h === id);
        });
      }
    });
  }, opt);
  sections.forEach(s => io.observe(s));
})();
