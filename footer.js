(function () {
  var d = document;
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }
  function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

  /* 1 + 2 · Plan picker and sticky bar */
  function checkoutUrl(base, plan) {
    // Pass marketing tags (utm_*, ad click ids) through to checkout; drop everything else (e.g. preview=true)
    var keep = new URLSearchParams();
    new URLSearchParams(location.search).forEach(function (v, k) {
      if (/^utm_/.test(k) || /^(fbclid|gclid|msclkid|ttclid|affiliate_id|aff_sub)$/.test(k)) keep.set(k, v);
    });
    keep.set('plan', plan);
    return base + (base.indexOf('?') > -1 ? '&' : '?') + keep.toString();
  }
  /* The plan picker markup (generated from paste/plan-picker.html by build.py). Used when the
     page has a native element tagged "plan-slot" instead of the Custom JS/HTML snippet, so the
     picker doesn't depend on ClickFunnels keeping a Custom HTML block. The slot's own Custom
     Attribute "data-checkout" carries the checkout URL. */
  var PLAN_HTML = "<div class=\"ohs ohs-plan\" data-ohs-plan data-checkout=\"CHECKOUT_URL\"><div class=\"ohs-plan__head\"><span class=\"ohs-plan__label\">Choose how you buy</span><span class=\"ohs-badge ohs-badge--green\">Save &#36;4 / month</span></div><div class=\"ohs-plan__options\"><button type=\"button\" class=\"ohs-plan__opt is-selected\" data-plan=\"subscribe\" data-price=\"36.00\" data-short=\"Subscribe\"><span class=\"ohs-plan__radio\"></span><span class=\"ohs-plan__body\"><span class=\"ohs-plan__title\">Subscribe &amp; Save 10%</span><span class=\"ohs-plan__price\">&#36;36.00</span><span class=\"ohs-plan__detail\">Delivered every 30 days · Skip, pause or cancel anytime</span></span></button><button type=\"button\" class=\"ohs-plan__opt\" data-plan=\"once\" data-price=\"40.00\" data-short=\"One-time\"><span class=\"ohs-plan__radio\"></span><span class=\"ohs-plan__body\"><span class=\"ohs-plan__title\">One-time purchase</span><span class=\"ohs-plan__price\">&#36;40.00</span><span class=\"ohs-plan__detail\">Paying with HSA/FSA via TrueMed? Choose this option.</span></span></button></div><a class=\"ohs-btn ohs-btn--block ohs-plan__cta\" href=\"CHECKOUT_URL?plan=subscribe\">Add to cart · <span data-ohs-price>&#36;36.00</span></a><ul class=\"ohs-plan__micro\"><li class=\"ohs-i ohs-i--lock\">Secure checkout</li><li class=\"ohs-i ohs-i--truck\">Usually ready in 24 hrs</li><li class=\"ohs-i ohs-i--shield\">30-day money-back guarantee</li></ul><div class=\"ohs ohs-sticky\" data-ohs-sticky><img class=\"ohs-sticky__img\" src=\"https://www.optimalhealthsystems.com/cdn/shop/files/OHS-NanoBlue1.png?width=120\" alt=\"\" width=\"48\" height=\"48\"><span class=\"ohs-sticky__text\"><span class=\"ohs-sticky__name\">Optimal NanoBlue</span><span class=\"ohs-sticky__meta\" data-ohs-sticky-meta>&#36;36.00 · Subscribe</span></span><a class=\"ohs-btn ohs-btn--plain\" data-ohs-sticky-cta href=\"CHECKOUT_URL?plan=subscribe\">Add to cart</a></div></div>";
  function initPlanSlots() {
    all('[data-ohs~="plan-slot"]').forEach(function (slot) {
      if (slot.querySelector('[data-ohs-plan]') || d.querySelector('[data-ohs-plan]')) return;
      var url = slot.getAttribute('data-checkout') || 'CHECKOUT_URL';
      slot.insertAdjacentHTML('beforeend', PLAN_HTML.split('CHECKOUT_URL').join(url));
    });
  }
  function initPlan() {
    initPlanSlots();
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

  /* 7 · Store product page: ODS plan cards drive ClickFunnels' native Checkout.
         Cards are built from the product's own price data (the JSON ClickFunnels prints next
         to its product card). Picking one selects the native product + price; Continue opens
         the checkout at the Shipping step. State lives on the column ([data-ohs~="checkout"]),
         not on ClickFunnels' checkout nodes, because ClickFunnels re-renders those. */
  function initNativePlan() {
    all('[data-ohs-plan-native]').forEach(function (box) {
      var root = d.querySelector('[data-page-element="Checkout/V2"]');
      var ms = root && root.querySelector('[data-page-element="CheckoutMultiStep/V2"]');
      var card = ms && ms.querySelector('[data-page-element="CheckoutProductCard/V2"]');
      var json = card && card.parentElement.querySelector('script[type="application/json"]');
      var data;
      try { data = JSON.parse(json.textContent); } catch (e) { return; }   // leave the native checkout as is
      var variant = data.variant || (data.product && data.product.default_variant);
      if (!variant || !variant.prices || !variant.prices.length) return;
      var prices = variant.prices.slice().sort(function (a, b) { return b.is_recurring - a.is_recurring; });
      var cur = variant.currency || '$';
      var col = root.closest('[data-ohs~="checkout"]') || box.parentElement;
      function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
      function num(s) { return parseFloat(String(s || '').replace(/[^0-9.]/g, '')) || 0; }

      box.textContent = '';   // drop the placeholder line
      var head = el('div', 'ohs-plan__head');
      head.appendChild(el('span', 'ohs-plan__label', box.getAttribute('data-label') || 'Choose how you buy'));
      var sub = prices.filter(function (p) { return p.is_recurring && p.compare_at_amount; })[0];
      if (sub) {
        var save = num(sub.compare_at_amount) - num(sub.price);
        if (save > 0) head.appendChild(el('span', 'ohs-badge ohs-badge--green', 'Save ' + cur + (save % 1 ? save.toFixed(2) : save) + ' ' + (box.getAttribute('data-save-suffix') || '')));
      }
      var group = el('div', 'ohs-plan__options');
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-label', box.getAttribute('data-label') || 'Choose how you buy');
      var opts = prices.map(function (p) {
        var b = el('button', 'ohs-plan__opt');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        var radio = el('span', 'ohs-plan__radio');
        radio.setAttribute('aria-hidden', 'true');
        var body = el('span', 'ohs-plan__body');
        body.appendChild(el('span', 'ohs-plan__title', p.name));
        var price = el('span', 'ohs-plan__price', p.price);
        if (p.compare_at_amount) price.appendChild(el('s', 'ohs-plan__was', p.compare_at_amount));
        body.appendChild(price);
        var detail = box.getAttribute(p.is_recurring ? 'data-sub-detail' : 'data-once-detail');
        if (detail) body.appendChild(el('span', 'ohs-plan__detail', detail));
        b.appendChild(radio);
        b.appendChild(body);
        group.appendChild(b);
        b.ohsPrice = p;
        return b;
      });
      var cta = el('button', 'ohs-btn ohs-btn--block ohs-plan__cta');
      cta.type = 'button';
      box.appendChild(head);
      box.appendChild(group);
      box.appendChild(cta);
      col.setAttribute('data-ohs-co', 'closed');
      if (!d.getElementById('buy')) box.id = 'buy';   // scroll target for every #buy button

      function syncNative(p) {
        // look both up each time: selecting the card makes ClickFunnels re-render it (new <select>)
        var c = ms.querySelector('[data-page-element="CheckoutProductCard/V2"]');
        if (c && !c.classList.contains('elProductSelected')) c.click();
        var s = ms.querySelector('select[name="variant_price"]');
        if (s && s.value !== p.id) {
          s.value = p.id;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      var chosen;
      function choose(b, focus) {
        chosen = b;
        opts.forEach(function (o) {
          var on = o === b;
          o.setAttribute('aria-checked', on ? 'true' : 'false');
          o.classList.toggle('is-selected', on);
          o.tabIndex = on ? 0 : -1;
        });
        if (focus) b.focus();
        cta.textContent = (box.getAttribute('data-cta') || 'Continue to checkout') + ' · ' + b.ohsPrice.price;
        syncNative(b.ohsPrice);
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
      cta.addEventListener('click', function () {
        syncNative(chosen.ohsPrice);
        col.setAttribute('data-ohs-co', 'open');
        var first = ms.querySelector('.elMultiStepBody[data-step-state="active"]');
        var next = first && first.querySelector('a[href="#!next-step"]');
        if (next && first === ms.querySelector('.elMultiStepBody')) next.click();   // still on Select Product
        setTimeout(function () { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
      });
      choose(opts[0]);
    });
  }

  /* 8 · Native header & footer: ClickFunnels sections are plain divs, so give them the
         landmarks <header> and <footer> would have (screen readers jump by these) */
  function initChrome() {
    all('[data-ohs~="hdr"]').forEach(function (s) { s.setAttribute('role', 'banner'); });
    all('[data-ohs~="ftr"]').forEach(function (s) { s.setAttribute('role', 'contentinfo'); });
  }

  /* 9 · Checkout page: honour ?plan=subscribe|once from the lander's plan picker.
         Sets ClickFunnels' native price dropdown (select[name="variant_price"]) to the
         product's recurring or one-time price, found in the product data ClickFunnels prints
         next to its product card (option text as a fallback). Re-applied while the checkout
         loads and whenever a step opens, because ClickFunnels re-renders the card. */
  function initCheckoutPlan() {
    var plan = new URLSearchParams(location.search).get('plan');
    if (plan !== 'subscribe' && plan !== 'once') return;
    if (d.querySelector('[data-ohs-plan-native]')) return;   // store page: its own picker handles this
    var root = d.querySelector('[data-page-element="Checkout/V2"]');
    if (!root) return;
    var wantSub = plan === 'subscribe';
    function apply() {
      all('select[name="variant_price"]', root).forEach(function (s) {
        var want = null;
        var card = s.closest('[data-page-element="CheckoutProductCard/V2"]');
        var json = card && card.parentElement.querySelector('script[type="application/json"]');
        try {
          var data = JSON.parse(json.textContent);
          var v = data.variant || data.product.default_variant;
          v.prices.forEach(function (p) { if (want === null && !!p.is_recurring === wantSub) want = String(p.id); });
        } catch (e) {}
        if (want === null) {
          Array.prototype.forEach.call(s.options, function (o) { if (want === null && /subscri|recurr|every/i.test(o.text) === wantSub) want = o.value; });
        }
        if (want !== null && s.value !== want) {
          s.value = want;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
    apply();
    var n = 0;
    var t = setInterval(function () { apply(); if (++n >= 12) clearInterval(t); }, 500);
    new MutationObserver(function () { apply(); }).observe(root, { subtree: true, attributes: true, attributeFilter: ['data-step-state'] });
  }

  /* 10 · Sticky header (section tagged hdr): it sticks to the top once the promo bar has scrolled
          away, slides up out of view while the visitor scrolls down, and slides back in as soon
          as they scroll up. Its CSS ships here with the behaviour, so every page that loads this
          script gets both (data-ohs-hdr="stuck" / "stuck hidden" on the section). */
  var HDR_CSS =
    '[data-ohs~="hdr"]{position:sticky!important;top:0;z-index:100;transition:transform .3s cubic-bezier(.2,.7,.2,1),box-shadow .3s}' +
    '[data-ohs~="hdr"][data-ohs-hdr~="stuck"]{box-shadow:0 4px 12px rgba(31,45,74,.08)}' +
    '[data-ohs~="hdr"][data-ohs-hdr~="hidden"]{transform:translateY(-100%);box-shadow:none}' +
    '@media (prefers-reduced-motion:reduce){[data-ohs~="hdr"]{transition:none}}';
  function initStickyHeader() {
    var h = d.querySelector('[data-ohs~="hdr"]');
    if (!h || d.getElementById('ohs-hdr-css')) return;
    var st = d.createElement('style');
    st.id = 'ohs-hdr-css';
    st.textContent = HDR_CSS;
    d.head.appendChild(st);
    var prev = h.previousElementSibling;                  // the promo bar, if any
    var last = window.pageYOffset, ticking = false;
    function set(stuck, hidden) { h.setAttribute('data-ohs-hdr', (stuck ? 'stuck' : '') + (hidden ? ' hidden' : '')); }
    function update() {
      ticking = false;
      var y = Math.max(window.pageYOffset, 0);
      var start = prev ? prev.getBoundingClientRect().bottom + y : 0;   // where the header starts sticking
      var dy = y - last;
      if (y <= start + h.offsetHeight) { set(y > start, false); last = y; return; }   // near the top: always shown
      if (Math.abs(dy) < 6) return;                                                   // ignore tiny jitters
      set(true, dy > 0 && !h.contains(d.activeElement));  // keep it while a keyboard user is in it
      last = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    h.addEventListener('focusin', function () { set(/stuck/.test(h.getAttribute('data-ohs-hdr') || ''), false); });
    update();
  }

  ready(function () { initPlan(); initGallery(); initFaq(); initReveal(); initFooter(); initNativePlan(); initChrome(); initCheckoutPlan(); initStickyHeader(); });
})();
