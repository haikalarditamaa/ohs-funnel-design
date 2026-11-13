/* OHS · NanoBlue bundle buybox (One-time / Subscribe & Save × Buy 1 / Buy 3 / Buy 5)
   ClickFunnels 2.0 · styled to ODS (Optimal Design System, Figma "OHS" → Optimal Design Systems):
     · Purchase option cards: radius/md, 1px line → selected 2px green + green-50 fill
     · Badges: Label/Overline 12/16 Bold +12%, pill (green-50/green, navy-50/navy, gold/ink)
     · One gold element per section · Muted text never below 14px · Subscribe & Save default-selected
     · Motion: colour 150ms, radios 250ms, ease/standard cubic-bezier(.4,0,.2,1); off under reduced motion
   ---------------------------------------------------------------------------
   Renders into a native Paragraph tagged with the Custom Attribute
     data-ohs = bundle-slot
   Settings = more Custom Attributes on that same Paragraph:
     data-checkout     (required) checkout step URL, e.g. https://…/test-checkout
     data-prices       (optional) one-time prices   "bottles|price;…"  default "1|40;3|80;5|120"
     data-sub-prices   (optional) subscribe prices  "bottles|price;…"  default "1|36;3|72;5|108"
     data-unit         (optional) regular price of 1 bottle (struck-through price)    default 40
     data-default      (optional) bundle selected on load: 1, 3 or 5                  default 3
     data-plan         (optional) plan selected on load: subscribe or once            default subscribe
     data-slides       (optional) product image shown per bundle "bottles|image#;…"  default "1|1;3|5;5|6"
                       (image numbers count from 1 in the ClickFunnels Product Image Carousel; "" turns it off)
     data-name         (optional) product name in the phone sticky bar               default "Optimal NanoBlue"
     data-image        (optional) image URL in the phone sticky bar                  default NanoBlue bottle
     data-one-note     (optional) note under Buy 1 on One-time                       default "1 bottle · 30 servings"
   Single product: give data-prices / data-sub-prices only a "1|…" entry and the bundle cards disappear;
   the two plan cards show their own prices instead (store-style Subscribe & Save / One-time choice).

   "Add to cart" opens  <checkout>?plan=subscribe|once&bottles=1|3|5  (+ utm_* / ad click ids).
   footer.js on the checkout selects the product whose name holds that bottle count
   (NanoBlue · NanoBlue - 3 Bottles · NanoBlue - 5 Bottles) and its matching price.
   Needs style.css (ODS tokens, .ohs-btn, .ohs-sticky, icons): already on the lander. Runs once. */
(function () {
  if (window.__ohsBuybox) return;
  window.__ohsBuybox = true;
  var d = document;

  var BUNDLES = [
    { qty: 1, title: 'Buy 1', deal: '', period: 'month' },
    { qty: 3, title: 'Buy 3', deal: 'Buy 2, Get 1 Free', period: '3 months', ribbon: 'Most popular', gold: true },
    { qty: 5, title: 'Buy 5', deal: 'Buy 3, Get 2 Free', period: '5 months', ribbon: 'Best value' }
  ];

  var E = 'cubic-bezier(.4,0,.2,1)';   // ODS ease/standard
  var CSS =
    '[data-ohs~="bundle-slot"]:has(.ohs-bb)>:not(.ohs-bb){display:none!important}' +
    '[data-ohs~="bundle-slot"]{margin-top:24px!important}' +
    '.ohs-bb{display:grid;gap:12px;color:var(--ohs-ink)}' +
    /* head: label + saved badge (same as the ODS plan picker head) */
    '.ohs-bb__head{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
    '.ohs-bb__label{font-size:16px;line-height:24px;font-weight:600;color:var(--ohs-ink)}' +
    /* ODS badge */
    '.ohs-bb__badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;line-height:16px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;background:var(--ohs-green-50);color:var(--ohs-green-700)}' +
    '.ohs-bb__badge--navy{background:var(--ohs-navy-50);color:var(--ohs-navy)}' +
    '.ohs-bb__badge--gold{background:var(--ohs-gold);color:var(--ohs-ink)}' +
    '.ohs-bb__badge[hidden]{display:none}' +
    '.ohs-bb__opt.is-selected [data-bb-save]{background:#fff}' +
    /* ODS purchase option card (shared by the plan toggle and the bundles) */
    '.ohs-bb__opt{position:relative;display:flex;align-items:center;gap:12px;padding:16px;border:1px solid var(--ohs-line);border-radius:var(--ohs-r-md);background:#fff;cursor:pointer;' +
      'transition:border-color 150ms ' + E + ',background-color 150ms ' + E + ',box-shadow 150ms ' + E + ';-webkit-tap-highlight-color:transparent}' +
    '.ohs-bb__opt:hover{border-color:var(--ohs-green-100)}' +
    '.ohs-bb__opt:focus-visible{outline:none!important;box-shadow:var(--ohs-ring)}' +
    '.ohs-bb__opt.is-selected{border:2px solid var(--ohs-green);padding:15px;background:var(--ohs-green-50)}' +
    '.ohs-bb__radio{flex:none;width:20px;height:20px;border:1.5px solid var(--ohs-line);border-radius:50%;background:#fff;transition:border-width 250ms ' + E + ',border-color 250ms ' + E + '}' +
    '.ohs-bb__opt.is-selected .ohs-bb__radio{border:6px solid var(--ohs-green)}' +
    /* plan toggle: two compact cards side by side */
    '.ohs-bb__plans{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.ohs-bb__plans .ohs-bb__opt{align-items:flex-start;min-height:48px;padding:12px 14px}' +
    '.ohs-bb__plans .ohs-bb__opt.is-selected{padding:11px 13px}' +
    '.ohs-bb__plans .ohs-bb__radio{margin-top:2px}' +
    '.ohs-bb__ptext{display:grid;min-width:0}' +
    '.ohs-bb__ptitle{font-size:16px;line-height:24px;font-weight:600;color:var(--ohs-ink)}' +
    '.ohs-bb__psub{font-size:14px;line-height:20px;color:var(--ohs-muted)}' +
    /* bundle cards */
    '.ohs-bb__bundles{display:grid;gap:12px}' +
    '.ohs-bb__bundles .ohs-bb__opt.has-ribbon{margin-top:8px}' +
    '.ohs-bb__main{flex:1;min-width:0;display:grid}' +
    '.ohs-bb__top{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px}' +
    '.ohs-bb__title{font-size:20px;line-height:28px;font-weight:700;color:var(--ohs-ink)}' +
    '.ohs-bb__deal{font-size:16px;line-height:24px;font-weight:600;color:var(--ohs-green-700)}' +
    '.ohs-bb__note{font-size:14px;line-height:20px;color:var(--ohs-muted)}' +
    '.ohs-bb__prices{flex:none;display:grid;justify-items:end;text-align:right}' +
    '.ohs-bb__price{font-size:20px;line-height:28px;font-weight:800;letter-spacing:-.01em;color:var(--ohs-ink)}' +
    '.ohs-bb__prices s{font-size:14px;line-height:20px;color:var(--ohs-muted)}' +
    '.ohs-bb__per{font-size:14px;line-height:20px;color:var(--ohs-muted)}' +
    '.ohs-bb__ribbon{position:absolute;top:-12px;right:16px}' +
    '.ohs-bb__cta{margin-top:4px}' +
    '.ohs-bb .ohs-plan__micro{justify-content:center}' +
    '[data-ohs~="price"] s{margin-right:8px;color:var(--ohs-muted)}' +
    '@media (max-width:400px){.ohs-bb__plans .ohs-bb__opt{padding:12px 10px;gap:8px}.ohs-bb__plans .ohs-bb__opt.is-selected{padding:11px 9px}.ohs-bb__ptitle{font-size:15px;line-height:22px}.ohs-bb__deal{font-size:14px;line-height:20px}.ohs-bb__bundles .ohs-bb__opt{gap:10px;padding:16px 12px}.ohs-bb__bundles .ohs-bb__opt.is-selected{padding:15px 11px}}' +
    /* single product (only one bundle priced): plan cards become full-width rows with prices, bundle list hidden */
    '.ohs-bb__bundles[hidden]{display:none!important}' +
    '.ohs-bb--single .ohs-bb__plans{grid-template-columns:1fr}' +
    '.ohs-bb--single .ohs-bb__plans .ohs-bb__opt{align-items:center;padding:16px}' +
    '.ohs-bb--single .ohs-bb__plans .ohs-bb__opt.is-selected{padding:15px}' +
    '.ohs-bb--single .ohs-bb__ptext{flex:1}' +
    '.ohs-bb--single .ohs-bb__ptitle{font-size:18px;line-height:26px}' +
    '@media (prefers-reduced-motion:reduce){.ohs-bb__opt,.ohs-bb__radio{transition:none}}';

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }
  function fmt(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
  function short(n) { return fmt(n).replace(/\.00$/, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function parsePrices(s) {
    var o = {};
    (s || '').split(';').forEach(function (part) {
      var p = part.split('|');
      if (p.length === 2 && !isNaN(parseFloat(p[1]))) o[parseInt(p[0], 10)] = parseFloat(p[1]);
    });
    return o;
  }
  function checkoutUrl(base, plan, bottles) {
    var keep = new URLSearchParams();
    new URLSearchParams(location.search).forEach(function (v, k) {
      if (/^utm_/.test(k) || /^(fbclid|gclid|msclkid|ttclid|affiliate_id|aff_sub)$/.test(k)) keep.set(k, v);
    });
    keep.set('plan', plan);
    keep.set('bottles', String(bottles));
    return base + (base.indexOf('?') > -1 ? '&' : '?') + keep.toString();
  }
  function addCss() {
    if (d.getElementById('ohs-bb-css')) return;
    var st = d.createElement('style');
    st.id = 'ohs-bb-css';
    st.textContent = CSS;
    d.head.appendChild(st);
  }
  function radioGroup(opts, onChoose) {
    function choose(opt, focus) {
      opts.forEach(function (o) {
        var on = o === opt;
        o.classList.toggle('is-selected', on);
        o.setAttribute('aria-checked', on ? 'true' : 'false');
        o.tabIndex = on ? 0 : -1;
      });
      if (focus) opt.focus();
      onChoose(opt, user);
    }
    var user = false;   // true only while the shopper's own click / key is being handled
    function pick(opt, focus) { user = true; try { choose(opt, focus); } finally { user = false; } }
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { pick(o); });
      o.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(o); return; }
        var step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        pick(opts[(i + step + opts.length) % opts.length], true);
      });
    });
    return choose;
  }

  /* Product Image Carousel (ClickFunnels CheckoutProductImageCarousel/V1, a Swiper slider with
     thumbnails): show image n (1-based). Its thumbnails follow the main slider by themselves. */
  function showImage(n) {
    var car = d.querySelector('[data-page-element="CheckoutProductImageCarousel/V1"]');
    if (!car || !(n > 0)) return;
    var main = car.querySelector('.slider-main') || car.querySelector('.swiper');
    var sw = main && main.swiper;
    if (sw && !sw.destroyed) {
      if (n > main.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length) return;
      if (sw.params.loop && sw.slideToLoop) sw.slideToLoop(n - 1); else sw.slideTo(n - 1);
      return;
    }
    // slider not ready yet: click the matching thumbnail instead
    var th = car.querySelector('.slider-nav [data-image-position="' + (n - 1) + '"]');
    if (th) th.click();
  }

  function build(slot, index) {
    if (slot.querySelector('.ohs-bb')) return;
    var base = slot.getAttribute('data-checkout') || '';
    if (!base && window.console) console.warn('[OHS] Buybox: add a data-checkout Custom Attribute (the checkout URL) to the bundle-slot Paragraph.');
    var price = {
      once: parsePrices(slot.getAttribute('data-prices') || '1|40;3|80;5|120'),
      subscribe: parsePrices(slot.getAttribute('data-sub-prices') || '1|36;3|72;5|108')
    };
    var unit = parseFloat(slot.getAttribute('data-unit')) || price.once[1] || 40;
    var list = BUNDLES.filter(function (b) { return price.once[b.qty] != null; });
    if (!list.length) return;
    var hasSub = list.every(function (b) { return price.subscribe[b.qty] != null; });
    var defQty = parseInt(slot.getAttribute('data-default'), 10) || 3;
    var defPlan = hasSub && (slot.getAttribute('data-plan') || 'subscribe') !== 'once' ? 'subscribe' : 'once';
    var subPct = hasSub ? Math.round((1 - price.subscribe[1] / price.once[1]) * 100) : 0;
    var uid = 'ohs-bb' + index;
    var slidesAttr = slot.getAttribute('data-slides');
    var slides = parsePrices(slidesAttr == null ? '1|1;3|5;5|6' : slidesAttr);
    var oneNoteAttr = slot.getAttribute('data-one-note');
    var oneNote = oneNoteAttr == null ? '1 bottle · 30 servings' : oneNoteAttr;

    var single = list.length === 1 && hasSub;
    var pp = single ? function (pl) { return '<span class="ohs-bb__prices"><span class="ohs-bb__price" data-bb-pprice="' + pl + '"></span><s data-bb-pwas="' + pl + '"></s></span>'; } : function () { return ''; };
    var html = '<div class="ohs ohs-bb' + (single ? ' ohs-bb--single' : '') + '" data-ohs-bb>' +
      '<div class="ohs-bb__head"><span class="ohs-bb__label" id="' + uid + '-h">' + (single ? 'Choose how you buy' : 'Choose your bundle') + '</span><span class="ohs-bb__badge" data-bb-saved hidden></span></div>';
    if (hasSub) {
      html += '<div class="ohs-bb__plans" role="radiogroup" aria-label="Purchase type">' +
        '<div class="ohs-bb__opt" role="radio" data-plan="subscribe"><span class="ohs-bb__radio" aria-hidden="true"></span>' +
          '<span class="ohs-bb__ptext"><span class="ohs-bb__ptitle">Subscribe &amp; Save</span><span class="ohs-bb__psub">' + (single ? 'Save ' + subPct + '% · ships every ' + list[0].period + ' · cancel anytime' : 'Extra ' + subPct + '% off') + '</span></span>' + pp('subscribe') + '</div>' +
        '<div class="ohs-bb__opt" role="radio" data-plan="once"><span class="ohs-bb__radio" aria-hidden="true"></span>' +
          '<span class="ohs-bb__ptext"><span class="ohs-bb__ptitle">One-time</span><span class="ohs-bb__psub">' + (single ? 'Single order · HSA/FSA via TrueMed' : 'HSA/FSA via TrueMed') + '</span></span>' + pp('once') + '</div>' +
      '</div>';
    }
    html += '<div class="ohs-bb__bundles" role="radiogroup" aria-labelledby="' + uid + '-h"' + (single ? ' hidden' : '') + '>';
    list.forEach(function (b) {
      html += '<div class="ohs-bb__opt' + (b.ribbon ? ' has-ribbon' : '') + '" role="radio" data-qty="' + b.qty + '">' +
        (b.ribbon ? '<span class="ohs-bb__badge ohs-bb__ribbon' + (b.gold ? ' ohs-bb__badge--gold' : ' ohs-bb__badge--navy') + '">' + esc(b.ribbon) + '</span>' : '') +
        '<span class="ohs-bb__radio" aria-hidden="true"></span>' +
        '<span class="ohs-bb__main">' +
          '<span class="ohs-bb__top"><span class="ohs-bb__title">' + esc(b.title) + '</span><span class="ohs-bb__badge" data-bb-save hidden></span></span>' +
          '<span class="ohs-bb__deal" data-bb-deal></span>' +
          '<span class="ohs-bb__note" data-bb-note></span>' +
        '</span>' +
        '<span class="ohs-bb__prices"><span class="ohs-bb__price" data-bb-price></span><s data-bb-was></s></span>' +
      '</div>';
    });
    html += '</div>' +
      '<a class="ohs-btn ohs-btn--block ohs-bb__cta" href="' + esc(base) + '">Add to cart · <span data-bb-cta></span></a>' +
      (hasSub ? '<p class="ohs-bb__note" style="text-align:center" data-bb-terms></p>' : '') +
      '<ul class="ohs-plan__micro"><li class="ohs-i ohs-i--lock">Secure checkout</li><li class="ohs-i ohs-i--truck">Usually ready in 24 hrs</li><li class="ohs-i ohs-i--shield">30-day money-back guarantee</li></ul>' +
      '</div>';
    slot.insertAdjacentHTML('beforeend', html);

    var box = slot.querySelector('.ohs-bb');
    var planOpts = all('.ohs-bb__plans .ohs-bb__opt', box);
    var bundleOpts = all('.ohs-bb__bundles .ohs-bb__opt', box);
    var cta = box.querySelector('.ohs-bb__cta');
    var ctaPrice = box.querySelector('[data-bb-cta]');
    var saved = box.querySelector('[data-bb-saved]');
    if (!d.getElementById('buy')) box.id = 'buy';   // header "Buy Now" scrolls here

    // price Paragraphs under the review stars (data-ohs = price) in the same column
    var col = slot.closest('[data-page-element^="Col"]') || d;
    var heroPrices = all('[data-ohs~="price"]', col).filter(function (p) { return !slot.contains(p); });

    // sticky "Add to cart" bar on phones (ODS Elevation/3, styles from style.css)
    var sticky = null, stickyCta = null, stickyMeta = null;
    if (!d.querySelector('.ohs-sticky')) {
      sticky = d.createElement('div');
      sticky.className = 'ohs ohs-sticky';
      sticky.setAttribute('aria-hidden', 'true');
      sticky.innerHTML = '<img class="ohs-sticky__img" src="' + esc(slot.getAttribute('data-image') || 'https://www.optimalhealthsystems.com/cdn/shop/files/OHS-NanoBlue1.png?width=120') + '" alt="" width="48" height="48">' +
        '<span class="ohs-sticky__text"><span class="ohs-sticky__name">' + esc(slot.getAttribute('data-name') || 'Optimal NanoBlue') + '</span><span class="ohs-sticky__meta"></span></span>' +
        '<a class="ohs-btn ohs-btn--plain" tabindex="-1" href="' + esc(base) + '">Add to cart</a>';
      stickyCta = sticky.querySelector('a');
      stickyMeta = sticky.querySelector('.ohs-sticky__meta');
      d.body.appendChild(sticky);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          var e = entries[0];
          var on = !e.isIntersecting && e.boundingClientRect.top < 0;
          sticky.classList.toggle('is-on', on);
          sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
          stickyCta.tabIndex = on ? 0 : -1;
        }).observe(cta);
      }
    }

    function plan() { var o = box.querySelector('.ohs-bb__plans .is-selected'); return o ? o.getAttribute('data-plan') : 'once'; }
    function qty() { var o = box.querySelector('.ohs-bb__bundles .is-selected'); return parseInt(o.getAttribute('data-qty'), 10); }
    function info(q) { return list.filter(function (x) { return x.qty === q; })[0]; }
    function dealText(b, p) {
      if (p === 'subscribe') return b.deal ? b.deal + ' + ' + subPct + '% off' : 'Save ' + subPct + '% every month';
      return b.deal;
    }

    function sync() {
      var p = plan(), q = qty(), b = info(q);
      // every bundle card follows the plan
      bundleOpts.forEach(function (o) {
        var n = parseInt(o.getAttribute('data-qty'), 10), bi = info(n);
        var amt = price[p][n], was = unit * n, save = was - amt;
        o.querySelector('[data-bb-price]').textContent = fmt(amt);
        var s = o.querySelector('[data-bb-was]');
        s.textContent = save > 0.005 ? fmt(was) : '';
        s.hidden = !(save > 0.005);
        var badge = o.querySelector('[data-bb-save]');
        badge.textContent = 'Save ' + short(save);
        badge.hidden = !(save > 0.005);
        var deal = o.querySelector('[data-bb-deal]');
        deal.textContent = dealText(bi, p);
        deal.hidden = !deal.textContent;
        var notes = [];
        if (n > 1) notes.push(fmt(amt / n) + ' per bottle');
        if (p === 'subscribe') notes.push('Ships every ' + bi.period);
        else if (n === 1 && oneNote) notes.push(oneNote);
        o.querySelector('[data-bb-note]').textContent = notes.join(' · ');
        var label = bi.title + ', ' + fmt(amt) + (save > 0.005 ? ', save ' + short(save) : '') + (deal.textContent ? ', ' + deal.textContent : '');
        o.setAttribute('aria-label', label);
      });
      if (single) ['subscribe', 'once'].forEach(function (pl) {
        var a = price[pl][q], w = unit * q;
        var pe = box.querySelector('[data-bb-pprice="' + pl + '"]'), we = box.querySelector('[data-bb-pwas="' + pl + '"]');
        if (pe) pe.textContent = fmt(a);
        if (we) { we.textContent = w - a > 0.005 ? fmt(w) : ''; we.hidden = !(w - a > 0.005); }
      });
      var amount = price[p][q], was = unit * q, save = was - amount;
      var href = checkoutUrl(base, p, q);
      ctaPrice.textContent = fmt(amount);
      cta.href = href;
      var terms = box.querySelector('[data-bb-terms]');
      if (terms) { terms.textContent = p === 'subscribe' ? 'Renews every ' + b.period + ' at ' + fmt(amount) + '. Skip, pause or cancel anytime.' : ''; terms.hidden = p !== 'subscribe'; }
      if (saved) { saved.textContent = 'You save ' + short(save); saved.hidden = !(save > 0.005); }
      if (stickyCta) stickyCta.href = href;
      if (stickyMeta) stickyMeta.textContent = fmt(amount) + ' · ' + q + (q > 1 ? ' bottles' : ' bottle') + ' · ' + (p === 'subscribe' ? 'Every ' + b.period : 'One-time');
      if (heroPrices.length) {
        var big = '<b>' + esc(fmt(amount)) + '</b>' + (was > amount ? '<s>' + esc(fmt(was)) + '</s>' : '');
        var dt = dealText(b, p);
        var cap = single ? (p === 'subscribe' ? 'Subscribe &amp; Save ' + subPct + '% · ships every ' + esc(b.period) + ' · cancel anytime' : 'One-time purchase' + (oneNote ? ' · ' + esc(oneNote) : '')) :
          q + (q > 1 ? ' bottles' : ' bottle') + (dt ? ' · ' + esc(dt) : '') +
          (p === 'subscribe' ? ' · ships every ' + esc(b.period) : ' · one-time purchase') +
          (q > 1 ? ' · ' + esc(fmt(amount / q)) + ' per bottle' : '');
        var target = function (el) { return el.querySelector('.elParagraph') || el; };
        if (heroPrices.length > 1) { target(heroPrices[0]).innerHTML = big; target(heroPrices[1]).innerHTML = cap; }
        else target(heroPrices[0]).innerHTML = big + ' ' + cap;
      }
    }

    var choosePlan = planOpts.length ? radioGroup(planOpts, sync) : null;
    var chooseBundle = radioGroup(bundleOpts, function (opt, user) {
      sync();
      if (user) showImage(slides[parseInt(opt.getAttribute('data-qty'), 10)]);   // only when the shopper picks, not on load
    });
    // initial state without firing sync twice on half-set groups
    planOpts.forEach(function (o) { var on = o.getAttribute('data-plan') === defPlan; o.classList.toggle('is-selected', on); o.setAttribute('aria-checked', on ? 'true' : 'false'); o.tabIndex = on ? 0 : -1; });
    chooseBundle(bundleOpts.filter(function (o) { return o.getAttribute('data-qty') === String(defQty); })[0] || bundleOpts[0]);
    void choosePlan;
  }

  function init() {
    var slots = all('[data-ohs~="bundle-slot"]');
    if (!slots.length) return;
    addCss();
    slots.forEach(build);
  }
  if (d.readyState !== 'loading') init(); else d.addEventListener('DOMContentLoaded', init);
})();
