/* =====================================================================
   OHS · NANOBLUE THANK-YOU · thankyou.js  (ClickFunnels 2.0)
   Load in the Footer Code of BOTH the checkout and the thank-you page.

   Checkout:   remembers the shopper's first name while they type it
               (sessionStorage: this browser tab only, never sent anywhere).
   Thank-you:  1. Headline tagged "ty-name": "Thank you!" becomes
                  "Thank you, Sarah." (stays "Thank you!" if no name).
               2. Order number from ClickFunnels' Order Confirmation element
                  goes into the "ty-pills" chip and the card's title bar.
               3. "USD 72.00" in the order card becomes "$72.00".
   ClickFunnels page text doesn't render {{contact.first_name}}, and the
   thank-you page gets no contact data, hence the hand-off from checkout.
   ===================================================================== */
(function () {
  var KEY = 'ohs_first_name';
  var d = document;

  function save(v) {
    v = String(v || '').trim().split(/\s+/)[0].slice(0, 40);
    try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch (e) {}
  }
  function load() {
    try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }

  /* ---------- Checkout: remember the first name ---------- */
  function isFirst(el) { return el && el.name === 'first_name'; }
  d.addEventListener('input', function (e) { if (isFirst(e.target)) save(e.target.value); }, true);
  d.addEventListener('change', function (e) { if (isFirst(e.target)) save(e.target.value); }, true);

  function captureExisting() {
    // browser autofill or a returning contact can fill the field without an input event
    var f = d.querySelectorAll('input[name="first_name"]');
    for (var i = 0; i < f.length; i++) if (f[i].value) { save(f[i].value); return; }
  }

  /* ---------- Thank-you page ---------- */
  function nice(n) { return n.charAt(0).toUpperCase() + n.slice(1); }

  function fillName() {
    var name = load();
    if (!name) return;
    var h = d.querySelector('[data-ohs~="ty-name"]');
    if (!h) return;
    var walker = d.createTreeWalker(h, NodeFilter.SHOW_TEXT, null), node;
    while ((node = walker.nextNode())) {
      var i = node.nodeValue.indexOf('Thank you!');
      if (i === -1) continue;
      var after = node.splitText(i);              // "Thank you!…"
      after.nodeValue = after.nodeValue.slice('Thank you!'.length);
      var b = d.createElement('b');
      b.textContent = nice(name);                 // textContent: never parsed as HTML
      var frag = d.createDocumentFragment();
      frag.appendChild(d.createTextNode('Thank you, '));
      frag.appendChild(b);
      frag.appendChild(d.createTextNode('. '));
      after.parentNode.insertBefore(frag, after);
      if (/^\s/.test(after.nodeValue)) after.nodeValue = after.nodeValue.replace(/^\s+/, '');
      return;
    }
  }

  function fillOrder() {
    var oc = d.querySelector('[data-page-element^="OrderConfirmation"]');
    if (!oc) return;

    // "USD 72.00" -> "$72.00"
    var prices = oc.querySelectorAll('span');
    for (var i = 0; i < prices.length; i++) {
      var s = prices[i];
      if (!s.children.length && /^\s*USD\s?[\d.,]+\s*$/.test(s.textContent)) s.textContent = '$' + s.textContent.replace(/[^\d.,]/g, '');
    }

    var head = oc.querySelector('.elOrderConfirmationHeadTitle');
    var m = head && head.textContent.match(/#\s*([A-Za-z0-9-]+)/);
    var pills = d.querySelector('[data-ohs~="ty-pills"]');
    if (!m) { if (pills) pills.style.display = 'none'; return; }
    var num = '#' + m[1];

    // chip: put the number in the chip's bold text
    if (pills) {
      var bs = pills.querySelectorAll('b, strong'), target = null;
      for (var j = bs.length - 1; j >= 0; j--) if (!bs[j].querySelector('b, strong')) { target = bs[j]; break; }
      if (target) target.textContent = num;
      else pills.style.display = 'none';
    }

    // card title bar: "Your order            #1105"
    var col = oc.closest('[data-ohs~="ty-order"]');
    var title = col && col.querySelector('[data-ohs~="ty-order-title"] p');
    if (title && !title.querySelector('.ohs-ty-num')) {
      var span = d.createElement('span');
      span.className = 'ohs-ty-num';
      span.textContent = num;
      title.appendChild(span);
      col.setAttribute('data-ohs-num', '');        // CSS then hides ClickFunnels' own title line
    }
  }

  function tidySteps() {
    // The editor leaves a space (often &nbsp;) between the italic label and the bold title;
    // between two block-level parts it shows as an empty line, so drop it.
    var items = d.querySelectorAll('[data-ohs~="ty-steps"] li');
    for (var i = 0; i < items.length; i++) {
      var tags = items[i].querySelectorAll('em, i:not(.fa), b, strong');
      for (var j = 0; j < tags.length; j++) {
        var n = tags[j].nextSibling;
        if (n && n.nodeType === 3 && /^\s*$/.test(n.nodeValue)) n.parentNode.removeChild(n);
      }
    }
  }

  function init() {
    captureExisting();
    fillName();
    fillOrder();
    tidySteps();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
