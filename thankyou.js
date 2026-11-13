/* =====================================================================
   OHS · NANOBLUE THANK-YOU · thankyou.js  (ClickFunnels 2.0)
   Load in the Footer Code of BOTH the checkout and the thank-you page.

   Checkout:   remembers the shopper's first name while they type it
               (sessionStorage: this browser tab only, never sent anywhere).
   Thank-you:  1. Headline tagged "ty-name" (or "ty-tick"): "Thank you!" becomes
                  "Thank you, Sarah." A {{…first_name}} tag typed in the headline
                  is replaced the same way. No name: "Thank you!".
               2. Order number from ClickFunnels' Order Confirmation element
                  goes into the "ty-pills" chip and the card's title bar.
               3. "USD 72.00" in the order card becomes "$72.00".
               4. Tags the Order Confirmation's column "ty-order" if it isn't.
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

  function textNodes(el) {
    var out = [], w = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) out.push(n);
    return out;
  }

  // Headline written with a merge tag, e.g. "Thank you, {{contact.first_name}}. Your…":
  // ClickFunnels shows the tag as plain text, so swap it for the name (or drop it).
  function fillPlaceholder(h, name) {
    var nodes = textNodes(h), TAG = /\{\{[^}]*\}\}/;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i], m = node.nodeValue.match(TAG);
      if (!m) continue;
      var rest = node.nodeValue.slice(m.index + m[0].length);
      if (name) {
        // add a full stop unless the headline already has punctuation right after the tag
        var dot = /^\s*[.,!?]/.test(rest) ? '' : '.';
        node.nodeValue = node.nodeValue.slice(0, m.index) + nice(name) + dot + rest;
      } else {
        node.nodeValue = node.nodeValue.slice(0, m.index) + rest.replace(/^\s*[.,]/, '');
        var all = textNodes(h);                      // "Thank you, " -> "Thank you!"
        for (var j = 0; j < all.length; j++) {
          if (/Thank you,\s*$/.test(all[j].nodeValue)) { all[j].nodeValue = all[j].nodeValue.replace(/Thank you,\s*$/, 'Thank you! '); break; }
        }
      }
      return true;
    }
    return false;
  }

  function fillName() {
    var name = load();
    // the tagged headline; falls back to the check-mark headline if ty-name was left off
    var h = d.querySelector('[data-ohs~="ty-name"]') || d.querySelector('[data-ohs~="ty-tick"]');
    if (!h) return;
    if (fillPlaceholder(h, name) || !name) return;
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

    // the card styling hangs on the column's "ty-order" tag: add it if it was left off
    if (!oc.closest('[data-ohs~="ty-order"]')) {
      var c = oc.closest('[data-page-element^="ColContainer"]');
      if (c) c.setAttribute('data-ohs', ((c.getAttribute('data-ohs') || '') + ' ty-order').trim());
    }

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

    // chip: the bold part becomes "#1105". Uses the outermost bold that holds the "#"
    // (the editor often nests empty bolds), and drops any "#" typed outside it.
    if (pills) {
      var li = pills.querySelector('li') || pills;
      var bs = li.querySelectorAll('b, strong'), target = null;
      for (var j = 0; j < bs.length; j++) {
        if (bs[j].parentNode.closest && bs[j].parentNode.closest('b, strong')) continue;   // nested: skip
        if (bs[j].textContent.indexOf('#') !== -1) { target = bs[j]; break; }
        if (!target && bs[j].textContent.trim()) target = bs[j];
      }
      if (!target) {                                 // no bold with text: bold the number ourselves
        target = d.createElement('b');
        (li.querySelector('.elBulletListTextWrapper') || li).appendChild(target);
      }
      target.textContent = num;
      var t = textNodes(li);
      for (var k = 0; k < t.length; k++) {
        if (target.contains(t[k])) continue;
        if (t[k].nodeValue.indexOf('#') !== -1) t[k].nodeValue = t[k].nodeValue.replace(/\s*#+\s*$/, ' ').replace(/#/g, '');
      }
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
