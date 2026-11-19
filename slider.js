/* OHS · review slider (product-agnostic). Load in Footer Code, after footer.js:
     <script src="https://cdn.jsdelivr.net/gh/haikalarditamaa/ohs-funnel-design@<commit>/slider.js"></script>
   Needs pdp-extras.css (review-slider rules).

   Builds on native ClickFunnels rows:
     Row    data-ohs="wrap review-slider"   → the scrolling track; its "review" columns are the slides.
            More rows tagged review-slider in the same section are merged into the first one
            (ClickFunnels allows 6 columns per row).
     Para   data-ohs="slider-nav"  (optional, anywhere in the same section) → desktop arrows go here.
   Adds a progress bar under the track (plus arrows next to it on phones). Arrows step one card at a
   time; the track also scrolls by swipe, trackpad and the arrow keys. With nothing to scroll, the
   controls hide themselves. */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;

  function icon(dir) {
    var p = dir < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6';
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' + p + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function makeNav(trackId) {
    var nav = d.createElement('div');
    nav.className = 'ohs-slider__nav';
    nav.innerHTML =
      '<button type="button" class="ohs-slider__btn" data-dir="-1" aria-controls="' + trackId + '" aria-label="Previous reviews">' + icon(-1) + '</button>' +
      '<button type="button" class="ohs-slider__btn" data-dir="1" aria-controls="' + trackId + '" aria-label="Next reviews">' + icon(1) + '</button>';
    return nav;
  }

  function setup(track) {
    if (track.getAttribute('data-ohs-slider')) return;
    track.setAttribute('data-ohs-slider', '1');
    var sec = track.closest('[data-ohs~="sec"]') || track.parentNode;

    // merge further slider rows of this section into the first one
    [].slice.call(sec.querySelectorAll('[data-ohs~="review-slider"]')).forEach(function (row) {
      if (row === track) return;
      [].slice.call(row.children).forEach(function (col) {
        if (col.matches('[data-ohs~="review"]')) track.appendChild(col);
      });
      row.setAttribute('data-ohs-slider', 'merged');
      row.style.display = 'none';
    });

    var slides = [].slice.call(track.children).filter(function (c) { return c.matches('[data-ohs~="review"]'); });
    if (!slides.length) return;

    var id = track.id || ('ohs-slider-' + (++uid));
    track.id = id;
    track.setAttribute('tabindex', '0');
    track.setAttribute('role', 'region');
    track.setAttribute('aria-roledescription', 'carousel');
    track.setAttribute('aria-label', 'Customer reviews');
    slides.forEach(function (s, i) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      s.setAttribute('aria-label', (i + 1) + ' of ' + slides.length);
    });

    var navs = [];
    var slot = sec.querySelector('[data-ohs~="slider-nav"]');
    if (slot) { var top = makeNav(id); slot.appendChild(top); navs.push(top); }

    var foot = d.createElement('div');
    foot.className = 'ohs-slider__foot';
    foot.innerHTML = '<div class="ohs-slider__bar" aria-hidden="true"><span class="ohs-slider__fill"></span></div>';
    var bottom = makeNav(id);
    foot.appendChild(bottom);
    navs.push(bottom);
    track.parentNode.insertBefore(foot, track.nextSibling);
    var fill = foot.querySelector('.ohs-slider__fill');

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }
    function go(dir) {
      track.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var scrollable = max > 2;
      foot.hidden = !scrollable;
      navs.forEach(function (n) { n.hidden = !scrollable; });
      if (!scrollable) return;
      var x = Math.min(Math.max(track.scrollLeft, 0), max);
      fill.style.width = (track.clientWidth / track.scrollWidth * 100) + '%';
      fill.style.left = (x / track.scrollWidth * 100) + '%';
      navs.forEach(function (n) {
        n.children[0].disabled = x <= 2;
        n.children[1].disabled = x >= max - 2;
      });
    }

    navs.forEach(function (n) {
      n.addEventListener('click', function (e) {
        var b = e.target.closest('.ohs-slider__btn');
        if (b && !b.disabled) go(+b.getAttribute('data-dir'));
      });
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  }

  function init() {
    [].slice.call(d.querySelectorAll('[data-ohs~="review-slider"]')).forEach(function (row) {
      if (!row.getAttribute('data-ohs-slider')) setup(row);
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})();
