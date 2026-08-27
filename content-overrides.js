// Applies saved CMS content overrides to the current page.
// Editable blocks are tagged with data-cc="cN" (inside <main>). Default copy
// stays in the HTML (good for SEO and first paint); this script swaps in any
// admin-edited text after load. Fails silently if unavailable.
(function () {
  var path = location.pathname.replace(/^\/+|\/+$/g, '');
  var page = path === '' ? 'index' : path;
  if (!/^[a-z0-9-]{1,64}$/.test(page)) return;

  fetch('/api/content?page=' + encodeURIComponent(page))
    .then(function (r) { return r.ok ? r.json() : { content: {} }; })
    .then(function (d) {
      var content = (d && d.content) || {};
      Object.keys(content).forEach(function (key) {
        if (!/^c[0-9]+$/.test(key)) return;
        var el = document.querySelector('[data-cc="' + key + '"]');
        if (el && typeof content[key] === 'string' && content[key].length) {
          el.textContent = content[key];
        }
      });
    })
    .catch(function () {});
})();
