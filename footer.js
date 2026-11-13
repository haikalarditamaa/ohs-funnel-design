(function () {
  var d = document;
  var SELF = (d.currentScript && d.currentScript.src) || '';   // e.g. …/ohs-funnel-design@<commit>/footer.js
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }
  function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

  /* 1 + 2 · Plan picker and sticky bar */
  function checkoutUrl(base, plan, bottles) {
    // Pass marketing tags (utm_*, ad click ids) through to checkout; drop everything else (e.g. preview=true)
    var keep = new URLSearchParams();
    new URLSearchParams(location.search).forEach(function (v, k) {
      if (/^utm_/.test(k) || /^(fbclid|gclid|msclkid|ttclid|affiliate_id|aff_sub)$/.test(k)) keep.set(k, v);
    });
    keep.set('plan', plan);
    keep.set('bottles', bottles || '1');
    return base + (base.indexOf('?') > -1 ? '&' : '?') + keep.toString();
  }
  /* The plan picker markup (generated from paste/plan-picker.html by build.py). Used when the
     page has a native element tagged "plan-slot" instead of the Custom JS/HTML snippet, so the
     picker doesn't depend on ClickFunnels keeping a Custom HTML block. The slot's own Custom
     Attribute "data-checkout" carries the checkout URL. */
  var PLAN_HTML = "<div class=\"ohs ohs-plan\" data-ohs-plan data-checkout=\"CHECKOUT_URL\"><div class=\"ohs-plan__head\"><span class=\"ohs-plan__label\">Choose how you buy</span><span class=\"ohs-badge ohs-badge--green\" data-ohs-save>Save 10%</span></div><div class=\"ohs-plan__qty\" data-qty=\"1|1 Bottle / Monthly|month;3|3 Bottles / Every 3 Months|3 months;5|5 Bottles / Every 5 Months|5 months\" data-label=\"Quantity\"></div><div class=\"ohs-plan__options\"><div class=\"ohs-plan__opt\" data-plan=\"once\" data-short=\"One-time\" data-prices=\"1|40.00;3|80.00;5|120.00\"><span class=\"ohs-plan__radio\"></span><span class=\"ohs-plan__body\"><span class=\"ohs-plan__title\">One-time purchase</span><span class=\"ohs-plan__price\">&#36;40.00</span><span class=\"ohs-plan__detail\" data-detail=\"Paying with HSA/FSA via TrueMed? Choose this option.\">Paying with HSA/FSA via TrueMed? Choose this option.</span></span></div><div class=\"ohs-plan__opt is-selected\" data-plan=\"subscribe\" data-short=\"Subscribe\" data-prices=\"1|36.00;3|72.00;5|108.00\"><span class=\"ohs-plan__radio\"></span><span class=\"ohs-plan__body\"><span class=\"ohs-plan__title\">Ship every <span data-ohs-period>month</span></span><span class=\"ohs-plan__price\">&#36;36.00</span><span class=\"ohs-plan__detail\" data-detail=\"Subscribe &amp; save 10% · Skip, pause or cancel anytime\">Subscribe &amp; save 10% · Skip, pause or cancel anytime</span></span></div></div><a class=\"ohs-btn ohs-btn--block ohs-plan__cta\" href=\"CHECKOUT_URL?plan=subscribe&amp;bottles=1\">Add to cart · <span data-ohs-price>&#36;36.00</span></a><ul class=\"ohs-plan__micro\"><li class=\"ohs-i ohs-i--lock\">Secure checkout</li><li class=\"ohs-i ohs-i--truck\">Usually ready in 24 hrs</li><li class=\"ohs-i ohs-i--shield\">30-day money-back guarantee</li></ul><div class=\"ohs ohs-sticky\" data-ohs-sticky><img class=\"ohs-sticky__img\" src=\"https://www.optimalhealthsystems.com/cdn/shop/files/OHS-NanoBlue1.png?width=120\" alt=\"\" width=\"48\" height=\"48\"><span class=\"ohs-sticky__text\"><span class=\"ohs-sticky__name\">Optimal NanoBlue</span><span class=\"ohs-sticky__meta\" data-ohs-sticky-meta>&#36;36.00 · Subscribe</span></span><a class=\"ohs-btn ohs-btn--plain\" data-ohs-sticky-cta href=\"CHECKOUT_URL?plan=subscribe&amp;bottles=1\">Add to cart</a></div></div>";
  function initPlanSlots() {
    all('[data-ohs~="plan-slot"]').forEach(function (slot) {
      if (slot.querySelector('[data-ohs-plan]') || d.querySelector('[data-ohs-plan]')) return;
      var url = slot.getAttribute('data-checkout') || 'CHECKOUT_URL';
      slot.insertAdjacentHTML('beforeend', PLAN_HTML.split('CHECKOUT_URL').join(url));
    });
  }
  /* Quantity dropdown + two radio cards (One-time purchase / Ship every <period>).
     .ohs-plan__qty lists the choices in data-qty as "bottles|label|period;…" and each card
     lists its prices in data-prices as "bottles|price;…" (one ClickFunnels product per bottle
     count: NanoBlue, NanoBlue - 3 Bottles, …). The <select> is built here, not in the snippet,
     because ClickFunnels drops custom HTML that contains form inputs. */
  var PLAN_CSS =
    '.ohs-plan__qty{display:grid;gap:6px}' +
    '.ohs-plan__qty-label{font-size:14px;line-height:20px;font-weight:600;color:var(--ohs-ink,#1f2d4a)}' +
    '.ohs-plan__select{position:relative}' +
    '.ohs-plan__select select{display:block;width:100%;height:48px;margin:0;padding:0 44px 0 16px;border:1px solid var(--ohs-line,#d9dee5);border-radius:12px;' +
      'background:#fff;color:var(--ohs-ink,#1f2d4a);font:inherit;font-size:16px;font-weight:500;line-height:20px;cursor:pointer;-webkit-appearance:none;appearance:none;box-shadow:none}' +
    '.ohs-plan__select select:hover{border-color:var(--ohs-green-100,#bcd9cb)}' +
    '.ohs-plan__select select:focus-visible{outline:none;border-color:var(--ohs-green,#2f7a5b);box-shadow:var(--ohs-ring,0 0 0 3px rgba(47,122,91,.25))}' +
    '.ohs-plan__select::after{content:"";position:absolute;right:18px;top:50%;width:8px;height:8px;margin-top:-6px;border:solid var(--ohs-ink,#1f2d4a);border-width:0 2px 2px 0;transform:rotate(45deg);pointer-events:none}' +
    '.ohs-plan__price s{margin-left:6px;font-weight:400;color:var(--ohs-muted,#5b6577)}' +
    '.ohs-plan__micro{justify-content:center}' +
    '[data-ohs~="price"] s{margin-right:8px;color:var(--ohs-muted,#5b6577)}';
  function parseList(s, keys) {
    return (s || '').split(';').map(function (part) {
      var p = part.split('|');
      if (p.length < keys.length) return null;
      var o = {};
      keys.forEach(function (k, i) { o[k] = (i === keys.length - 1 ? p.slice(i).join('|') : p[i]).trim(); });
      return o;
    }).filter(Boolean);
  }
  function fmt(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function initPlan() {
    initPlanSlots();
    all('[data-ohs-plan]').forEach(function (box) {
      var base = box.getAttribute('data-checkout') || '';
      var cta = box.querySelector('.ohs-plan__cta');
      var price = box.querySelector('[data-ohs-price]');
      var save = box.querySelector('[data-ohs-save]');
      var sticky = box.querySelector('[data-ohs-sticky]');
      var stickyCta = sticky && sticky.querySelector('[data-ohs-sticky-cta]');
      var stickyMeta = sticky && sticky.querySelector('[data-ohs-sticky-meta]');
      var opts = all('.ohs-plan__opt', box);
      var group = box.querySelector('.ohs-plan__options');
      var qtyBox = box.querySelector('.ohs-plan__qty');
      var qtys = parseList(qtyBox && qtyBox.getAttribute('data-qty'), ['qty', 'label', 'period']);
      // the price Paragraphs under the review stars (data-ohs = price) in the same column
      var col = box.closest('[data-page-element^="Col"]') || d;
      var heroPrices = all('[data-ohs~="price"]', col).filter(function (p) { return !box.contains(p); });
      // ClickFunnels drops custom HTML with ids / ARIA roles, so they're added here
      if (!d.getElementById('buy')) box.id = 'buy';
      if (group) { group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-label', 'Choose how you buy'); }
      all('.ohs-plan__radio', box).forEach(function (r) { r.setAttribute('aria-hidden', 'true'); });
      addCss('ohs-plan-css', PLAN_CSS);

      var sel = null;
      if (qtyBox && qtys.length && !qtyBox.querySelector('select')) {
        var lab = d.createElement('label');
        lab.className = 'ohs-plan__qty-label';
        lab.htmlFor = 'ohs-plan-qty';
        lab.textContent = qtyBox.getAttribute('data-label') || 'Quantity';
        var wrap = d.createElement('span');
        wrap.className = 'ohs-plan__select';
        sel = d.createElement('select');
        sel.id = 'ohs-plan-qty';
        qtys.forEach(function (q) {
          var op = d.createElement('option');
          op.value = q.qty;
          op.textContent = q.label;
          sel.appendChild(op);
        });
        wrap.appendChild(sel);
        qtyBox.appendChild(lab);
        qtyBox.appendChild(wrap);
        sel.addEventListener('change', sync);
      }
      opts.forEach(function (o, i) {
        o.setAttribute('role', 'radio');
        o.ohsPrices = parseList(o.getAttribute('data-prices'), ['qty', 'price']);
        var title = o.querySelector('.ohs-plan__title');
        if (title) { title.id = title.id || 'ohs-plan-t' + i; o.setAttribute('aria-labelledby', title.id); }
      });

      function qty() { return sel ? sel.value : '1'; }
      function qtyInfo() { var q = qty(); return qtys.filter(function (x) { return x.qty === q; })[0] || { qty: q, label: '', period: 'month' }; }
      function priceOf(plan, q) {
        var o = opts.filter(function (x) { return x.getAttribute('data-plan') === plan; })[0];
        var p = o && (o.ohsPrices || []).filter(function (x) { return x.qty === q; })[0];
        return p ? parseFloat(p.price) : NaN;
      }
      function current() { return box.querySelector('.ohs-plan__opt.is-selected') || opts[0]; }
      function sync() {
        var opt = current();
        if (!opt) return;
        var q = qty(), info = qtyInfo(), n = parseInt(q, 10) || 1;
        var once = priceOf('once', q), sub = priceOf('subscribe', q);
        all('[data-ohs-period]', box).forEach(function (s) { s.textContent = info.period; });
        opts.forEach(function (o) {
          var plan = o.getAttribute('data-plan');
          var amt = priceOf(plan, q);
          var p = o.querySelector('.ohs-plan__price');
          if (p && !isNaN(amt)) p.innerHTML = esc(fmt(amt)) + (plan === 'subscribe' && once > amt ? '<s>' + esc(fmt(once)) + '</s>' : '');
          var det = o.querySelector('.ohs-plan__detail');
          if (det && det.hasAttribute('data-detail')) det.textContent = (n > 1 && !isNaN(amt) ? fmt(amt / n) + ' per bottle · ' : '') + det.getAttribute('data-detail');
        });
        var plan = opt.getAttribute('data-plan');
        var amount = priceOf(plan, q);
        var href = checkoutUrl(base, plan, q);
        if (price) price.textContent = fmt(amount);
        if (cta) cta.href = href;
        if (stickyCta) stickyCta.href = href;
        if (stickyMeta) stickyMeta.textContent = fmt(amount) + ' · ' + (plan === 'subscribe' ? 'Every ' + info.period : 'One-time') + (n > 1 ? ' · ' + n + ' bottles' : '');
        if (save) {
          var diff = once - sub;
          if (diff > 0) { save.textContent = 'Save ' + fmt(diff).replace('.00', '') + (n === 1 ? ' / month' : ' every ' + info.period); save.hidden = false; }
          else save.hidden = true;
        }
        // hero price under the review stars: big price (+ struck one-time price), then a caption
        if (heroPrices.length) {
          var big = '<b>' + esc(fmt(amount)) + '</b>' + (plan === 'subscribe' && once > amount ? '<s>' + esc(fmt(once)) + '</s>' : '');
          var bottles = n + (n > 1 ? ' bottles' : ' bottle');
          var cap = plan === 'subscribe'
            ? bottles + ' every ' + info.period + ' with Subscribe &amp; Save' + (n > 1 ? ' · ' + esc(fmt(amount / n)) + ' per bottle' : '')
            : bottles + ', one-time purchase' + (n > 1 ? ' · ' + esc(fmt(amount / n)) + ' per bottle' : '') + (sub < amount ? ' · ' + esc(fmt(sub)) + ' with Subscribe &amp; Save' : '');
          var target = function (p) { return p.querySelector('.elParagraph') || p; };
          if (heroPrices.length > 1) { target(heroPrices[0]).innerHTML = big; target(heroPrices[1]).innerHTML = cap; }
          else target(heroPrices[0]).innerHTML = big + ' ' + cap;
        }
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
          if (e.target !== o) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(o); return; }
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

  /* 9 · Checkout page: honour ?plan=subscribe|once&bottles=1|3|5[&price=<id>] from the lander's plan picker.
         price (optional, sent by buybox.js in product mode) selects that exact price, e.g. one of
         several subscription intervals; if the checkout doesn't offer it, the plan rule below applies.
         bottles picks the product card: the one whose name holds that number of bottles
         ("NanoBlue - 3 Bottles"); a name without a number counts as 1 bottle. With no match
         (or no bottles in the link) the selected card is kept. The card is clicked (ClickFunnels
         then re-renders it), then its native price dropdown (select[name="variant_price"]) is set
         to the product's recurring or one-time price, found in the product data ClickFunnels
         prints next to its product card (option text as a fallback).
         ClickFunnels keeps the chosen price in its own cart (Checkout.computed.checkoutCart) and
         only updates it from a change event on that dropdown, once its handlers are attached.
         Setting the dropdown earlier shows the right plan while the cart keeps the old price
         (the order summary and the charge follow the cart), so the change is re-sent until the
         cart holds the wanted price. Stops for good as soon as the shopper picks a product or
         plan by hand. */
  function initCheckoutPlan() {
    var q = new URLSearchParams(location.search);
    var plan = q.get('plan');
    if (plan !== 'subscribe' && plan !== 'once') return;
    if (d.querySelector('[data-ohs-plan-native]')) return;   // store page: its own picker handles this
    var root = d.querySelector('[data-page-element="Checkout/V2"]');
    if (!root) return;
    var wantSub = plan === 'subscribe';
    var wantBottles = parseInt(q.get('bottles'), 10) || 0;   // 0 = keep the selected product
    var wantPrice = q.get('price') || '';
    var userPicked = false;
    // capture phase: ClickFunnels stops the event on the dropdown itself
    root.addEventListener('change', function (e) {
      if (e.isTrusted && e.target.name === 'variant_price') userPicked = true;
    }, true);
    root.addEventListener('click', function (e) {
      if (e.isTrusted && e.target.closest && e.target.closest('[data-page-element="CheckoutProductCard/V2"]')) userPicked = true;
    }, true);
    function cartHas(priceId) {
      try {
        return window.Checkout.computed.checkoutCart.get().items.some(function (i) { return String(i.price_id) === priceId; });
      } catch (e) { return false; }   // cart not readable: keep re-sending until the timer ends
    }
    function cardData(card) {
      var json = card && card.parentElement.querySelector('script[type="application/json"]');
      try { return JSON.parse(json.textContent); } catch (e) { return null; }
    }
    function bottlesOf(card) {
      var data = cardData(card);
      var name = (data && ((data.variant && data.variant.name) || (data.product && data.product.name))) ||
        ((card.querySelector('.elProductCardInfoName') || card).textContent);
      var m = /(\d+)\s*(?:x\s*)?bottles?/i.exec(name || '');
      return m ? parseInt(m[1], 10) : 1;
    }
    function cards() {
      var list = all('[data-page-element="CheckoutProductCard/V2"]', root);
      var shown = list.filter(function (c) { return c.offsetParent !== null; });
      return shown.length ? shown : list;
    }
    function apply() {
      if (userPicked) return;
      var list = cards();
      var card = null;
      if (wantBottles) list.forEach(function (c) { if (!card && bottlesOf(c) === wantBottles) card = c; });
      if (!card) card = list.filter(function (c) { return c.classList.contains('elProductSelected'); })[0] || (list.length === 1 ? list[0] : null);
      if (!card) return;
      if (!card.classList.contains('elProductSelected') && card.getAttribute('data-select-type') !== 'multiple') {
        card.click();          // ClickFunnels re-renders the card; the price is set on the next pass
        setTimeout(apply, 150);
        return;
      }
      var s = card.querySelector('select[name="variant_price"]');
      if (!s) return;
      var want = null;
      if (wantPrice && Array.prototype.some.call(s.options, function (o) { return o.value === wantPrice; })) want = wantPrice;
      if (want === null) try {
        var data = cardData(card);
        var v = data.variant || data.product.default_variant;
        v.prices.forEach(function (p) { if (want === null && !!p.is_recurring === wantSub) want = String(p.id); });
      } catch (e) {}
      if (want === null) {
        Array.prototype.forEach.call(s.options, function (o) { if (want === null && /subscri|recurr|every|month|\//i.test(o.text) === wantSub) want = o.value; });
      }
      if (want === null || (s.value === want && cartHas(want))) return;
      s.value = want;
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }
    apply();
    var n = 0;
    var t = setInterval(function () { apply(); if (++n >= 20 || userPicked) clearInterval(t); }, 500);
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
  /* Style fixes made after the live style.css (too large to push from here); each is also in
     src/base.css, so they become no-ops once style.css is next updated on GitHub. */
  var FIX_CSS =
    '[data-ohs~="card"] .col-inner{margin-left:0!important;margin-right:0!important}';   // card text in line with its icon
  function addCss(id, css) {
    if (d.getElementById(id)) return false;
    var st = d.createElement('style');
    st.id = id;
    st.textContent = css;
    d.head.appendChild(st);
    return true;
  }
  function initStickyHeader() {
    var h = d.querySelector('[data-ohs~="hdr"]');
    if (!h || !addCss('ohs-hdr-css', HDR_CSS)) return;
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

  /* 11 · ClickFunnels' Product Image Carousel (CheckoutProductImageCarousel, built on Swiper):
          reskinned to match the custom gallery (sand stage, rounded corners, 5 thumbnail tiles with
          a green active border; on phones edge to edge, swipe, a 1 / n counter, no thumbnails).
          No tag needed: it styles every carousel on pages that load this script.
          Optional badge: give the carousel a Custom Attribute data-badge (e.g. 15% off · code BIRTHDAY);
          it is drawn by the CSS, so it also shows in the editor. ClickFunnels re-renders the carousel
          when the product changes, so the phone counter is re-added when it disappears. */
  var CAROUSEL = '[data-page-element="CheckoutProductImageCarousel/V1"]';
  /* The skin itself is carousel.css (src/carousel.css). It is loaded from the same jsDelivr commit as
     this script, so the two always match; the page CSS can also @import it, which styles the editor. */
  var CAROUSEL_CSS_URL = /\/footer\.js(\?.*)?$/.test(SELF)
    ? SELF.replace(/footer\.js(\?.*)?$/, 'carousel.css')
    : 'https://cdn.jsdelivr.net/gh/haikalarditamaa/ohs-funnel-design@main/carousel.css';
  function initCarousel() {
    var list = all(CAROUSEL);
    if (!list.length) return;
    // Swiper measured the slides before the skin changed their size: have it measure again
    function remeasure() {
      all(CAROUSEL + ' .swiper', d).forEach(function (el) { try { if (el.swiper) el.swiper.update(); } catch (e) {} });
    }
    if (!d.getElementById('ohs-carousel-css')) {
      var link = d.createElement('link');
      link.id = 'ohs-carousel-css';
      link.rel = 'stylesheet';
      link.href = CAROUSEL_CSS_URL;
      link.onload = function () { remeasure(); setTimeout(remeasure, 300); };
      d.head.appendChild(link);
    }
    remeasure();
    window.addEventListener('load', remeasure);
    list.forEach(function (c) {
      var busy = false;
      function dress() {
        var stage = c.querySelector('.slider-main-wrapper');
        if (!stage) return;
        busy = true;
        var slides = all('.slider-main .swiper-slide:not(.swiper-slide-duplicate)', c);
        var count = stage.querySelector('.ohs-carousel__count');
        if (slides.length > 1) {
          if (!count) {
            count = d.createElement('span');
            count.className = 'ohs-carousel__count';
            count.setAttribute('aria-hidden', 'true');
            stage.appendChild(count);
          }
          var active = c.querySelector('.slider-main .swiper-slide-active');
          var i = active ? parseInt(active.getAttribute('data-swiper-slide-index') || active.getAttribute('data-image-position') || '0', 10) : 0;
          var t = (i + 1) + ' / ' + slides.length;
          if (count.textContent !== t) count.textContent = t;
        } else if (count) count.parentNode.removeChild(count);
        busy = false;
      }
      dress();
      // slide changes (class swaps) and re-renders (new nodes) both land here
      new MutationObserver(function () { if (!busy) dress(); })
        .observe(c, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    });
  }

  /* 12 · Checkout order summary. A native Paragraph tagged order-summary (in its own column next
          to the Checkout element) becomes a summary card of what ClickFunnels will charge: it
          reads ClickFunnels' cart (Checkout.computed.checkoutCart) and the product data printed
          next to each product card, and re-draws whenever the cart changes, so it follows both
          the lander's choice (?plan=…&bottles=…) and any change made on the checkout itself.
          Desktop: the column sticks while the form scrolls. Phones: the column moves above the
          form and the card folds into a one-line "Order summary · $80.00" bar.
          Optional Custom Attributes on the Paragraph: data-title (product name to show, e.g.
          Optimal NanoBlue), data-image (fallback image URL), data-once-pill (tag on one-time
          purchases, e.g. HSA / FSA eligible), data-top (sticky offset in px, default 104). */
  var SUM_CSS =
    '[data-ohs~="order-summary"]{margin:0!important}' +
    '[data-ohs~="order-summary"]>.elParagraph{display:none!important}' +
    /* ClickFunnels' clearfix ::before/::after on divs would become extra flex / grid items */
    '.ohs-sum div::before,.ohs-sum div::after,.ohs-sum dl::before,.ohs-sum dl::after{content:none!important;display:none!important}' +
    '.ohs-sum dt,.ohs-sum dd,.ohs-sum__total>*,.ohs-sum__item>*{margin:0!important}' +
    '.ohs-sum{border:1px solid var(--ohs-line,#dedad3);border-radius:20px;background:#fff;overflow:hidden;font-family:inherit;color:var(--ohs-text,#3a4458);text-align:left}' +
    '.ohs-sum__head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;background:var(--ohs-sand,#f5f4f2)}' +
    '.ohs-sum__toggle{all:unset;display:flex;align-items:center;gap:10px;flex:1;cursor:default;font-size:18px;line-height:24px;font-weight:700;color:var(--ohs-ink,#1f2d4a)}' +
    '.ohs-sum__toggle:focus-visible{outline:2px solid var(--ohs-green,#108474);outline-offset:4px;border-radius:4px}' +
    '.ohs-sum__mini{display:none;margin-left:auto;font-weight:800}' +
    '.ohs-sum__change{font-size:14px;line-height:20px;font-weight:600;color:var(--ohs-green,#108474)!important;text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
    '.ohs-sum__item{display:grid;grid-template-columns:72px 1fr auto;gap:16px;align-items:center;padding:20px}' +
    '.ohs-sum__item+.ohs-sum__item{border-top:1px solid var(--ohs-line,#dedad3)}' +
    '.ohs-sum__img{position:relative;width:72px;height:72px;border-radius:12px;background:var(--ohs-sand,#f5f4f2)}' +
    '.ohs-sum__img img{display:block;width:100%;height:100%;object-fit:contain;border-radius:12px}' +
    '.ohs-sum__qty{position:absolute;top:-8px;right:-8px;min-width:24px;height:24px;padding:0 7px;box-sizing:border-box;border-radius:999px;background:var(--ohs-ink,#1f2d4a);color:#fff;font-size:12px;line-height:24px;font-weight:700;text-align:center}' +
    '.ohs-sum__name{font-size:16px;line-height:22px;font-weight:700;color:var(--ohs-ink,#1f2d4a)}' +
    '.ohs-sum__plan{margin-top:2px;font-size:14px;line-height:20px;color:var(--ohs-muted,#5b6577)}' +
    '.ohs-sum__pill{display:inline-flex;margin-top:8px;padding:2px 10px;border-radius:999px;background:var(--ohs-green-50,#eef6f4);color:var(--ohs-green-700,#0b5f54);font-size:11px;line-height:18px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}' +
    '.ohs-sum__price{text-align:right;font-size:16px;line-height:22px;font-weight:700;color:var(--ohs-ink,#1f2d4a);white-space:nowrap}' +
    '.ohs-sum__price s{display:block;font-size:13px;font-weight:400;color:var(--ohs-muted,#5b6577)}' +
    '.ohs-sum__rows{justify-items:stretch;margin:0;padding:16px 20px;border-top:1px solid var(--ohs-line,#dedad3);display:grid;gap:8px}' +
    '.ohs-sum__row{display:flex;justify-content:space-between;gap:16px;width:100%;box-sizing:border-box;font-size:14px;line-height:20px}' +
    '.ohs-sum__row dt{color:var(--ohs-muted,#5b6577)}.ohs-sum__row dd{margin:0;color:var(--ohs-ink,#1f2d4a);font-weight:500;text-align:right}' +
    '.ohs-sum__row--save dt,.ohs-sum__row--save dd{color:var(--ohs-green-700,#0b5f54);font-weight:600}' +
    '.ohs-sum__total{display:flex;justify-content:space-between;align-items:baseline;padding:16px 20px;border-top:1px solid var(--ohs-line,#dedad3);font-weight:600;color:var(--ohs-ink,#1f2d4a)}' +
    '.ohs-sum__total strong{font-size:26px;line-height:30px;font-weight:800}' +
    '.ohs-sum__renew{margin:0;padding:12px 20px;font-size:13px;line-height:18px;color:var(--ohs-green-700,#0b5f54);background:var(--ohs-green-50,#eef6f4)}' +
    '.ohs-sum__empty{margin:0;padding:20px;font-size:14px;color:var(--ohs-muted,#5b6577)}' +
    '.ohs-sum__assure{display:grid;gap:6px;margin:0;padding:14px 20px 18px;list-style:none;font-size:13px;line-height:18px;color:var(--ohs-muted,#5b6577);border-top:1px solid var(--ohs-line,#dedad3)}' +
    '.ohs-sum__assure li{display:block;width:100%;text-align:left}' +
    '.ohs-sum__assure li::before{content:"\\2713";color:var(--ohs-green,#108474);font-weight:700;margin-right:8px}' +
    '@media (min-width:768px){[data-ohs-sumcol]{position:sticky;top:var(--ohs-sum-top,104px);align-self:flex-start}}' +
    '@media (max-width:767px){' +
      '[data-ohs-sumcol]{order:-1;margin-bottom:24px}' +
      '.ohs-sum__toggle{cursor:pointer}' +
      '.ohs-sum__toggle::after{content:"";width:7px;height:7px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translateY(-3px);transition:transform .2s;order:1}' +
      '.ohs-sum.is-open .ohs-sum__toggle::after{transform:rotate(-135deg) translateY(-1px)}' +
      '.ohs-sum__mini{display:inline;order:2}' +
      '.ohs-sum__change{display:none}' +
      '.ohs-sum:not(.is-open) .ohs-sum__body{display:none}' +
      '.ohs-sum__item{grid-template-columns:60px 1fr}.ohs-sum__img{width:60px;height:60px}' +
      '.ohs-sum__price{grid-column:2;text-align:left}.ohs-sum__price s{display:inline;margin-left:6px}' +
    '}';
  function initOrderSummary() {
    var slot = d.querySelector('[data-ohs~="order-summary"]');
    var root = d.querySelector('[data-page-element="Checkout/V2"]');
    if (!slot || !root || slot.querySelector('.ohs-sum')) return;
    addCss('ohs-sum-css', SUM_CSS);
    var col = slot.closest('[data-page-element^="ColContainer"]');
    if (col) col.setAttribute('data-ohs-sumcol', '');
    var top = parseInt(slot.getAttribute('data-top'), 10);
    if (top >= 0 && col) col.style.setProperty('--ohs-sum-top', top + 'px');
    var phone = window.matchMedia ? matchMedia('(max-width: 767px)') : { matches: false };

    function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function money(c) { return '$' + (c / 100).toFixed(2); }
    function products() {
      // every product card's data, keyed by price id (ClickFunnels prints some cards twice)
      var map = {};
      all('[data-page-element="CheckoutProductCard/V2"]', root).forEach(function (card) {
        var json = card.parentElement.querySelector('script[type="application/json"]');
        var data; try { data = JSON.parse(json.textContent); } catch (e) { return; }
        var v = data.variant || (data.product && data.product.default_variant);
        if (!v || !v.prices) return;
        var name = (data.product && data.product.name) || v.name || '';
        var once = v.prices.filter(function (p) { return !p.is_recurring; })[0];
        var m = /(\d+)\s*(?:x\s*)?bottles?/i.exec(name);
        var img = v.image || (data.product && data.product.image) || '';
        if (typeof img === 'object') img = img.url || img.src || '';
        v.prices.forEach(function (p) {
          if (!map[p.id]) map[p.id] = { name: name, bottles: m ? +m[1] : 1, price: p, once: once, img: img, card: card };
        });
      });
      return map;
    }
    function every(p, bottles) {
      var m = /(?:\/|every)\s*(\d+)?\s*(day|week|month|year)s?/i.exec(p.name || '');   // "$72.00 / 3 months" or "Delivery Every 2 Month"
      var n = m ? +(m[1] || 1) : bottles, unit = m ? m[2].toLowerCase() : 'month';
      return n > 1 ? n + ' ' + unit + 's' : unit;
    }

    var box = el('div', 'ohs-sum');
    var head = el('div', 'ohs-sum__head');
    var toggle = el('button', 'ohs-sum__toggle');
    toggle.type = 'button';
    toggle.appendChild(el('span', '', 'Order summary'));
    var mini = el('span', 'ohs-sum__mini');
    toggle.appendChild(mini);
    var change = el('a', 'ohs-sum__change', 'Change');
    change.href = '#';
    head.appendChild(toggle);
    head.appendChild(change);
    var body = el('div', 'ohs-sum__body');
    body.id = 'ohs-sum-body';
    body.setAttribute('aria-live', 'polite');
    box.appendChild(head);
    box.appendChild(body);
    slot.appendChild(box);

    function setPhone() {
      if (phone.matches) {
        toggle.removeAttribute('tabindex');
        toggle.setAttribute('aria-controls', body.id);
        toggle.setAttribute('aria-expanded', box.classList.contains('is-open') ? 'true' : 'false');
      } else {
        box.classList.add('is-open');
        toggle.tabIndex = -1;            // nothing to toggle on desktop
        toggle.removeAttribute('aria-expanded');
        toggle.removeAttribute('aria-controls');
      }
    }
    toggle.addEventListener('click', function () {
      if (!phone.matches) return;
      box.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', box.classList.contains('is-open') ? 'true' : 'false');
    });
    if (phone.addEventListener) phone.addEventListener('change', setPhone);
    setPhone();
    change.addEventListener('click', function (e) {
      e.preventDefault();
      var target = all('[data-page-element="CheckoutProductSelect/V2"]', root).filter(function (x) { return x.offsetParent !== null; })[0] || root;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    var last = '';
    function render() {
      var items = [];
      try { items = window.Checkout.computed.checkoutCart.get().items || []; } catch (e) {}
      var map = products();
      var lines = items.map(function (i) { var p = map[String(i.price_id)]; return p ? { p: p, qty: i.quantity || 1 } : null; }).filter(Boolean);
      var key = JSON.stringify(lines.map(function (l) { return [l.p.price.id, l.qty]; }));
      if (key === last && body.firstChild) return;
      last = key;
      body.textContent = '';
      if (!lines.length) {
        mini.textContent = '';
        body.appendChild(el('p', 'ohs-sum__empty', 'Choose a product below to see your order.'));
        return;
      }
      var full = 0, total = 0, renew = [];
      lines.forEach(function (l) {
        var p = l.p, pr = p.price, sub = !!pr.is_recurring, n = p.bottles;
        var cents = pr.price_cents * l.qty;
        var was = (sub && p.once ? p.once.price_cents : pr.price_cents) * l.qty;
        full += was; total += cents;
        var row = el('div', 'ohs-sum__item');
        var pic = el('div', 'ohs-sum__img');
        var src = p.img || slot.getAttribute('data-image') || (function () { for (var k in map) if (map[k].img) return map[k].img; return ''; })();
        if (src) { var im = el('img'); im.src = src; im.alt = ''; pic.appendChild(im); }
        pic.appendChild(el('span', 'ohs-sum__qty', String(n * l.qty)));
        var info = el('div');
        var title = slot.getAttribute('data-title') || p.name.replace(/\s*[-–·]\s*\d+\s*(?:x\s*)?bottles?$/i, '');
        info.appendChild(el('div', 'ohs-sum__name', title + ' · ' + (n * l.qty) + (n * l.qty > 1 ? ' bottles' : ' bottle')));
        var per = n * l.qty > 1 ? ' · ' + money(cents / (n * l.qty)) + ' per bottle' : '';
        info.appendChild(el('div', 'ohs-sum__plan', (sub ? 'Ships every ' + every(pr, n) : 'One-time purchase') + per));
        var pill = sub
          ? (was > cents ? 'Subscribe & Save ' + Math.round((1 - cents / was) * 100) + '%' : 'Subscription')
          : slot.getAttribute('data-once-pill');
        if (pill) info.appendChild(el('span', 'ohs-sum__pill', pill));
        var price = el('div', 'ohs-sum__price', money(cents));
        if (was > cents) price.appendChild(el('s', '', money(was)));
        row.appendChild(pic); row.appendChild(info); row.appendChild(price);
        body.appendChild(row);
        if (sub) renew.push(money(cents) + ' every ' + every(pr, n));
      });
      var rows = el('dl', 'ohs-sum__rows');
      function addRow(k, v, cls) { var r = el('div', 'ohs-sum__row' + (cls ? ' ' + cls : '')); r.appendChild(el('dt', '', k)); r.appendChild(el('dd', '', v)); rows.appendChild(r); }
      addRow('Subtotal', money(full));
      if (full > total) addRow('Subscribe & Save', '−' + money(full - total), 'ohs-sum__row--save');
      addRow('Shipping', 'Calculated after address');
      body.appendChild(rows);
      var tot = el('div', 'ohs-sum__total');
      tot.appendChild(el('span', '', 'Due today'));
      tot.appendChild(el('strong', '', money(total)));
      body.appendChild(tot);
      mini.textContent = money(total);
      if (renew.length) body.appendChild(el('p', 'ohs-sum__renew', 'Then ' + renew.join(' + ') + '. Skip, pause or cancel anytime.'));
      var ul = el('ul', 'ohs-sum__assure');
      ['Secure, encrypted checkout', 'Usually ready to ship in 24 hrs', '30-day money-back guarantee'].forEach(function (t) { ul.appendChild(el('li', '', t)); });
      body.appendChild(ul);
    }
    render();
    // the cart is a nanostores atom: redraw on every change (falls back to polling if it isn't there yet)
    var tries = 0;
    (function hook() {
      var cart = window.Checkout && window.Checkout.computed && window.Checkout.computed.checkoutCart;
      if (cart && cart.subscribe) { cart.subscribe(render); return; }
      render();
      if (++tries < 40) setTimeout(hook, 250);
    })();
  }

  addCss('ohs-fix-css', FIX_CSS);
  ready(function () { initPlan(); initGallery(); initFaq(); initReveal(); initFooter(); initNativePlan(); initChrome(); initCheckoutPlan(); initStickyHeader(); initCarousel(); initOrderSummary(); });
})();
