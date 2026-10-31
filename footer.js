/* OHS · FOOTER CODE (the NanoBlue page)
     Load via <script src> in Tracking Code → Footer Code.
     This is the script only. The footer you see on the page is paste/footer.html.
     It wires up:
       1. Plan picker: selected card, button price, checkout link (?plan=…, UTM tags kept)
       2. Sticky "Add to cart" bar on phones once the buy box scrolls away
       3. Gallery thumbnails + 1 / 5 counter
       4. FAQ: keyboard support for ClickFunnels' native Accordion (Tab, Enter / Space)
       5. Cards fade up as they scroll in (skipped for "reduce motion" users)
       6. Footer link groups collapse into tap-to-open rows on phones
     Everything is found by data-ohs attributes or the snippets' own markup. */
(function () {
  var d = document;
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }
  function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

  /* 1 + 2 · Plan picker and sticky bar */
  function checkoutUrl(base, plan) {
    var keep = new URLSearchParams(location.search);
    keep.delete('plan');
    keep.set('plan', plan);
    return base + (base.indexOf('?') > -1 ? '&' : '?') + keep.toString();
  }
  function initPlan() {
    all('[data-ohs-plan]').forEach(function (box) {
      var base = box.getAttribute('data-checkout') || '';
      var cta = box.querySelector('.ohs-plan__cta');
      var price = box.querySelector('[data-ohs-price]');
      var sticky = box.querySelector('[data-ohs-sticky]');
      var stickyCta = sticky && sticky.querySelector('[data-ohs-sticky-cta]');
      var stickyMeta = sticky && sticky.querySelector('[data-ohs-sticky-meta]');
      var opts = all('.ohs-plan__opt', box);
      var group = box.querySelector('.ohs-plan__options');
      // ClickFunnels drops custom HTML with ids / ARIA roles, so they're added here
      if (!d.getElementById('buy')) box.id = 'buy';
      if (group) { group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-label', 'Choose how you buy'); }
      all('.ohs-plan__radio', box).forEach(function (r) { r.setAttribute('aria-hidden', 'true'); });
      opts.forEach(function (o) { o.setAttribute('role', 'radio'); });
      function money(o) { return '$' + o.getAttribute('data-price'); }
      function current() { return box.querySelector('.ohs-plan__opt.is-selected') || opts[0]; }
      function sync() {
        var opt = current();
        if (!opt) return;
        var href = checkoutUrl(base, opt.getAttribute('data-plan'));
        if (price) price.textContent = money(opt);
        if (cta) cta.href = href;
        if (stickyCta) stickyCta.href = href;
        if (stickyMeta) stickyMeta.textContent = money(opt) + ' · ' + opt.getAttribute('data-short');
      }
      function choose(opt, focus) {
        opts.forEach(function (o) {
          var on = o === opt;
          o.setAttribute('aria-checked', on ? 'true' : 'false');
          o.classList.toggle('is-selected', on);
          o.tabIndex = on ? 0 : -1;
        });
        if (focus) opt.focus();
        sync();
      }
      opts.forEach(function (o, i) {
        o.addEventListener('click', function () { choose(o); });
        o.addEventListener('keydown', function (e) {
          var step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          choose(opts[(i + step + opts.length) % opts.length], true);
        });
      });
      choose(current());
      if (base === 'CHECKOUT_URL' && window.console) console.warn('[OHS] Plan picker: replace CHECKOUT_URL with your checkout step URL.');

      if (sticky) { sticky.setAttribute('aria-hidden', 'true'); if (stickyCta) stickyCta.tabIndex = -1; }
      if (sticky && cta && 'IntersectionObserver' in window) {
        d.body.appendChild(sticky);
        new IntersectionObserver(function (entries) {
          var e = entries[0];
          var on = !e.isIntersecting && e.boundingClientRect.top < 0;
          sticky.classList.toggle('is-on', on);
          sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
          if (stickyCta) stickyCta.tabIndex = on ? 0 : -1;
        }).observe(cta);
      }
    });
  }

  /* 3 · Gallery */
  function initGallery() {
    all('[data-ohs-gallery]').forEach(function (g) {
      var track = g.querySelector('.ohs-gallery__track');
      var slides = all('.ohs-gallery__slide', g);
      var thumbs = all('.ohs-gallery__thumb', g);
      var count = g.querySelector('.ohs-gallery__count');
      if (!track || !slides.length) return;
      function mark(i) {
        thumbs.forEach(function (t, n) {
          t.classList.toggle('is-active', n === i);
          if (n === i) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
        });
        if (count) count.textContent = (i + 1) + ' / ' + slides.length;
      }
      thumbs.forEach(function (t, i) {
        t.addEventListener('click', function () {
          track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
          mark(i);
        });
      });
      var raf = 0;
      track.addEventListener('scroll', function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          mark(Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
        });
      }, { passive: true });
    });
  }

  /* 4 · FAQ: ClickFunnels' Accordion opens on click only. Make each question
         reachable by Tab, openable with Enter / Space, and announce its state. */
  function initFaq() {
    all('[data-ohs~="faq"] .elAccordionItemHeader').forEach(function (h) {
      var item = h.closest('[data-page-element="AccordionItem"]');
      if (!item) return;
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      function sync() { h.setAttribute('aria-expanded', item.classList.contains('elAccordionItemOpen') ? 'true' : 'false'); }
      sync();
      new MutationObserver(sync).observe(item, { attributes: true, attributeFilter: ['class'] });
      h.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h.click(); }
      });
    });
  }

  /* 5 · Reveal on scroll */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = all('[data-ohs~="card"], [data-ohs~="step"], [data-ohs~="trust"], [data-ohs~="review"], [data-ohs~="reveal"]');
    if (!items.length) return;
    d.documentElement.classList.add('ohs-motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });
  }

  /* 6 · Footer: Shop / Learn / Support stay open on desktop, become tap-to-open rows on phones */
  function initFooter() {
    var heads = all('.ohs-footer__head');
    if (!heads.length || !window.matchMedia) return;
    var mq = matchMedia('(max-width: 767px)');
    function set(h, open) {
      h.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (h.nextElementSibling) h.nextElementSibling.hidden = !open;
    }
    function reset() { heads.forEach(function (h) { set(h, !mq.matches); }); }
    heads.forEach(function (h) {
      h.addEventListener('click', function () { if (mq.matches) set(h, h.getAttribute('aria-expanded') !== 'true'); });
    });
    reset();
    if (mq.addEventListener) mq.addEventListener('change', reset);
  }

  ready(function () { initPlan(); initGallery(); initFaq(); initReveal(); initFooter(); });
})();
