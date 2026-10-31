<!-- OHS · HEADER CODE
     Paste into: page editor → Settings → Tracking Code → Header Code.
     Loads Red Hat Display (the site font) and turns on smooth scrolling for #buy links.
     The font is added by script on purpose: ClickFunnels strips Google Fonts <link> tags
     from Header Code. Nothing here hides content, so the page still works if a script fails. -->
<script>
  (function (d) {
    d.documentElement.classList.add('ohs-live');
    [['preconnect', 'https://fonts.googleapis.com'], ['preconnect', 'https://fonts.gstatic.com'],
     ['stylesheet', 'https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;600;700;800&display=swap']
    ].forEach(function (l) {
      var el = d.createElement('link');
      el.rel = l[0]; el.href = l[1];
      if (l[1].indexOf('gstatic') > -1) el.crossOrigin = 'anonymous';
      d.head.appendChild(el);
    });
  })(document);
</script>
