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
