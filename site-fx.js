/* ============================================================
   Vellum Studio — site-wide motion layer (JS)
   - Splits text into letters for the blur/rise animation
   - Reveals blocks + text on scroll via IntersectionObserver
   - Replays the same letter animation on hover/focus for
     every button and link
   ============================================================ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Zones we never touch: they run their own animations/logic
  // and re-splitting their text would fight with that JS.
  var EXCLUDE_SELECTOR = '.logo-marquee, #splash-container, .mobile-menu, .hamburger';

  function isExcluded(el) {
    return !!el.closest(EXCLUDE_SELECTOR);
  }

  /* ---------- split text into <span class="fx-word"><span class="fx-char">l</span></span> ---------- */
  function splitIntoChars(el) {
    if (el.dataset.fxSplit) return;
    if (!el.textContent || !el.textContent.trim().length) return;
    el.dataset.fxSplit = '1';
    el.setAttribute('data-fx-split', '');

    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.length) textNodes.push(n);
    }

    var i = 0;
    textNodes.forEach(function (textNode) {
      var parts = textNode.nodeValue.split(/(\s+)/); // keep whitespace tokens
      var frag = document.createDocumentFragment();

      parts.forEach(function (part) {
        if (!part.length) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        var wordSpan = document.createElement('span');
        wordSpan.className = 'fx-word';
        Array.prototype.forEach.call(part, function (ch) {
          var charSpan = document.createElement('span');
          charSpan.className = 'fx-char';
          charSpan.style.setProperty('--fx-i', i++);
          charSpan.textContent = ch;
          wordSpan.appendChild(charSpan);
        });
        frag.appendChild(wordSpan);
      });

      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fx-in');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );

  function observeReveal(el) {
    el.classList.add('fx-reveal');
    revealObserver.observe(el);
  }

  /* ---------- hover / focus replay for links & buttons ---------- */
  function bindHoverReplay(el) {
    if (el.dataset.fxHoverBound) return;
    el.dataset.fxHoverBound = '1';

    function replay() {
      if (!el.dataset.fxSplit) return;
      el.classList.remove('fx-in');
      // force reflow so the transition restarts from the blurred state
      void el.offsetWidth;
      requestAnimationFrame(function () {
        el.classList.add('fx-in');
      });
    }

    el.addEventListener('mouseenter', replay);
    el.addEventListener('focus', replay);
  }

  /* ---------- init ---------- */
  ready(function () {
    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything, no motion.
      document.querySelectorAll('h1,h2,h3,p,a,button').forEach(function (el) {
        el.style.opacity = '1';
      });
      return;
    }

    // 1) Headings & paragraphs — letter reveal on scroll only
    var textSelector = 'h1, h2, h3, .eyebrow, .stat-number, .stat-label, .price-amount, .price-name, .price-desc, p';
    document.querySelectorAll(textSelector).forEach(function (el) {
      if (isExcluded(el)) return;
      if (el.closest('a, button')) return; // handled below with hover
      splitIntoChars(el);
      observeReveal(el);
    });

    // 2) Buttons & links — letter reveal on scroll AND replay on hover/focus
    document.querySelectorAll('a, button').forEach(function (el) {
      if (isExcluded(el)) return;
      if (!el.textContent || !el.textContent.trim().length) return;
      splitIntoChars(el);
      observeReveal(el);
      bindHoverReplay(el);
    });

    // 3) Cards / blocks — fade + rise + blur on scroll (no letter split)
    var blockSelector = [
      '.hero-left', '.hero-right', '.stat',
      '.price-card', '.service-row', '.approach-card',
      '.blog-card', '.project-card', '.testimonial-inner',
      '.faq-item', '.footer-top', '.page-header',
      'section.block', '.logo-strip-label'
    ].join(', ');

    document.querySelectorAll(blockSelector).forEach(function (el) {
      if (isExcluded(el)) return;
      observeReveal(el);
    });

    // Simple stagger for card grids so items don't pop in unison
    document.querySelectorAll('.approach-grid, .pricing-grid, .services-grid, .projects-grid, .blog-grid').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, idx) {
        var d = Math.min(idx + 1, 8);
        child.classList.add('fx-d' + d);
      });
    });
  });
})();
