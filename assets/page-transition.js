(function() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  var STORAGE_KEY = 'smartmove-page-transition';
  var COVER_DURATION = 720;
  var REVEAL_DURATION = 720;
  var navigationStarted = false;
  var readyMarked = false;
  var script = document.currentScript;
  var logoSrc = script ? new URL('../smartmovefinancelogo.png', script.src).href : 'smartmovefinancelogo.png';
  var shouldReveal = false;
  try {
    shouldReveal = window.sessionStorage.getItem(STORAGE_KEY) === 'reveal';
    if (shouldReveal) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}

  var style = document.createElement('style');
  style.textContent = [
    'body {',
    '  opacity: 0;',
    '  transition: opacity .28s ease;',
    '}',
    'body.page-ready {',
    '  opacity: 1;',
    '}',
    '.page-transition-overlay {',
    '  position: fixed;',
    '  inset: 0;',
    '  background: linear-gradient(135deg, #1e7a70 0%, #157068 42%, #3aaea0 100%);',
    '  z-index: 99999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  pointer-events: none;',
    '  transform: scaleX(1);',
    '  transform-origin: right center;',
    '  transition: transform ' + REVEAL_DURATION + 'ms cubic-bezier(.23,1,.32,1);',
    '  will-change: transform;',
    '}',
    '.page-transition-overlay img {',
    '  width: min(360px, 38vw);',
    '  max-width: calc(100vw - 96px);',
    '  height: auto;',
    '  filter: brightness(0) invert(1);',
    '  opacity: 0.98;',
    '  user-select: none;',
    '}',
    '.page-transition-overlay.is-entering {',
    '  transform: scaleX(0);',
    '}',
    '.page-transition-overlay.is-leaving {',
    '  transform-origin: left center;',
    '  transform: scaleX(1);',
    '  transition-duration: ' + COVER_DURATION + 'ms;',
    '}'
  ].join('');
  document.head.appendChild(style);

  function ensureOverlay() {
    var overlay = document.querySelector('.page-transition-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    var logo = document.createElement('img');
    logo.src = logoSrc;
    logo.alt = 'Smartmove Finance';
    overlay.appendChild(logo);
    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function revealOverlay(force) {
    var overlay = ensureOverlay();
    overlay.classList.remove('is-leaving');
    if (force) {
      overlay.classList.remove('is-entering');
      void overlay.offsetWidth;
    }
    overlay.classList.add('is-entering');
  }

  var initialOverlay = ensureOverlay();
  if (!shouldReveal) {
    initialOverlay.classList.add('is-entering');
  }

  function markReady() {
    if (readyMarked || !document.body) return;
    readyMarked = true;
    if (!document.body) return;
    var overlay = ensureOverlay();
    window.requestAnimationFrame(function() {
      window.requestAnimationFrame(function() {
        document.body.classList.add('page-ready');
        if (shouldReveal) {
          revealOverlay(true);
        }
      });
    });
  }

  function isPageLink(link) {
    if (!link || !link.href) return false;
    if (link.target && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    if (link.getAttribute('href').charAt(0) === '#') return false;
    if (link.href.indexOf('mailto:') === 0 || link.href.indexOf('tel:') === 0) return false;

    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;

    var current = window.location.pathname + window.location.search;
    var next = url.pathname + url.search;
    return current !== next;
  }

  document.addEventListener('click', function(event) {
    var link = event.target.closest('a');
    if (!isPageLink(link)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button && event.button !== 0) return;
    if (navigationStarted) return;

    event.preventDefault();
    navigationStarted = true;
    var overlay = ensureOverlay();
    overlay.classList.remove('is-entering');
    overlay.classList.remove('is-leaving');
    void overlay.offsetWidth;
    overlay.classList.add('is-leaving');

    function navigate() {
      if (!navigationStarted) return;
      navigationStarted = false;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, 'reveal');
      } catch (e) {}
      window.location.href = link.href;
    }

    overlay.addEventListener('transitionend', function handleTransitionEnd(transitionEvent) {
      if (transitionEvent.propertyName !== 'transform') return;
      overlay.removeEventListener('transitionend', handleTransitionEnd);
      navigate();
    });

    window.setTimeout(navigate, COVER_DURATION + 120);
  });

  if (shouldReveal) {
    if (document.readyState === 'complete') {
      markReady();
    } else {
      window.addEventListener('load', markReady, { once: true });
      window.setTimeout(markReady, 1800);
    }
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', markReady, { once: true });
    } else {
      markReady();
    }
  }
  window.addEventListener('pageshow', function(event) {
    navigationStarted = false;
    markReady();

    var navEntry = null;
    try {
      navEntry = window.performance && window.performance.getEntriesByType
        ? window.performance.getEntriesByType('navigation')[0]
        : null;
    } catch (e) {}

    var isHistoryRestore = !!(event && event.persisted) || !!(navEntry && navEntry.type === 'back_forward');
    if (isHistoryRestore) {
      revealOverlay(true);
    }
  });
})();
