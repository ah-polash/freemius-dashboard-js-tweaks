/*!
 * bPlugins - Customer Portal promo header
 * ------------------------------------------------------------
 * Loaded by the Freemius Customer Portal through
 *   Developer Dashboard > Store > Settings > Customer Portal >
 *   Customization > "Customer Portal JavaScript".
 *
 * Freemius appends this file as a <script> inside the portal page
 * (also inside the iframe when the portal is embedded on bplugins.com),
 * so everything below runs in the portal document itself.
 *
 * To change the promo: edit CONFIG, commit, push. GitHub Pages serves the
 * new file within about 10 minutes (its cache is 10 minutes).
 */
(function () {
  'use strict';

  /* ===================== EDIT ME ===================== */
  var CONFIG = {
    // Change this for every new campaign. A visitor who dismissed the old
    // campaign will see the new one.
    campaignId: 'birthday-2026',

    badge: 'Up to 35% OFF',
    title: 'bPlugins Birthday Flash Sale!',
    subtitle: 'Get everything premium with a special discount.',

    couponCode: 'BIRTHDAY2026',

    ctaText: 'Grab Now →',
    ctaUrl: 'https://bplugins.com/coupons/?utm_source=customer_portal&utm_medium=promo_header&utm_campaign=birthday2026',
    ctaTarget: '_blank', // '_blank' opens a new tab, '_top' replaces the page

    // Dates. Written without a timezone they are interpreted in the visitor's
    // local time, which is how the countdown on bplugins.com behaves.
    // Append an offset to pin them, e.g. '2026-10-10T23:59:59+06:00'.
    startsAt: '',                    // '' = already running
    endsAt: '2026-10-10T23:59:59',   // countdown target; banner hides after this

    showCountdown: true,
    hideWhenExpired: true,

    dismissible: true,
    rememberDismissDays: 1           // 0 = remember forever (until campaignId changes)
  };
  /* =================== END EDIT ME =================== */

  // Optional overrides, e.g. for the preview page:
  //   window.BPL_PORTAL_PROMO_CONFIG = { endsAt: '2026-12-31T23:59:59' };
  if (window.BPL_PORTAL_PROMO_CONFIG && typeof window.BPL_PORTAL_PROMO_CONFIG === 'object') {
    for (var k in window.BPL_PORTAL_PROMO_CONFIG) {
      if (Object.prototype.hasOwnProperty.call(window.BPL_PORTAL_PROMO_CONFIG, k)) {
        CONFIG[k] = window.BPL_PORTAL_PROMO_CONFIG[k];
      }
    }
  }

  if (window.__bplPortalPromoLoaded) { return; }
  window.__bplPortalPromoLoaded = true;

  var ID = 'bpl-portal-promo';
  var STYLE_ID = ID + '-style';
  var CONTAINER_ID = 'app_container'; // the portal's root layout element
  var STORAGE_KEY = 'bpl_portal_promo_dismissed_' + CONFIG.campaignId;

  var startsAt = parseDate(CONFIG.startsAt);
  var endsAt = parseDate(CONFIG.endsAt);

  var container = null;
  var banner = null;
  var timerEls = null;
  var resizeObserver = null;
  var tickHandle = null;
  var lastPadding = null;
  var dismissed = readDismissed();

  /* ---------- helpers ---------- */

  function parseDate(value) {
    if (!value) { return null; }
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value);
    var d;
    if (m) {
      // No timezone given: visitor's local time.
      d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    } else {
      d = new Date(value);
    }
    return isNaN(d.getTime()) ? null : d;
  }

  function readDismissed() {
    if (!CONFIG.dismissible) { return false; }
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) { return false; }
      if (!CONFIG.rememberDismissDays) { return true; }
      var at = parseInt(raw, 10);
      return !isNaN(at) && (Date.now() - at) < CONFIG.rememberDismissDays * 86400000;
    } catch (e) {
      return false;
    }
  }

  function shouldShow(now) {
    if (dismissed) { return false; }
    if (startsAt && now < startsAt) { return false; }
    if (endsAt && CONFIG.hideWhenExpired && now > endsAt) { return false; }
    return true;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text != null) { node.textContent = text; }
    return node;
  }

  function svg(paths) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS(ns, paths[i][0]);
      for (var attr in paths[i][1]) {
        if (Object.prototype.hasOwnProperty.call(paths[i][1], attr)) {
          p.setAttribute(attr, paths[i][1][attr]);
        }
      }
      s.appendChild(p);
    }
    return s;
  }

  var ICON_TAG = [
    ['path', { d: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z' }],
    ['circle', { cx: '7.5', cy: '7.5', r: '1.5' }]
  ];
  var ICON_COPY = [
    ['rect', { x: '9', y: '9', width: '12', height: '12', rx: '2' }],
    ['path', { d: 'M5 15V5a2 2 0 0 1 2-2h10' }]
  ];
  var ICON_CHECK = [
    ['path', { d: 'M5 12.5l4.5 4.5L19 7' }]
  ];
  var ICON_CLOSE = [
    ['path', { d: 'M6 6l12 12M18 6L6 18' }]
  ];

  /* ---------- styles ---------- */

  var CSS = [
    '#' + ID + '{position:absolute;top:0;left:0;right:0;z-index:10;box-sizing:border-box;width:100%;overflow:hidden;',
    'font-family:var(--fs-ds-typography-font-family,"Open Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif);',
    'color:#fff;line-height:1.2;text-align:left;-webkit-font-smoothing:antialiased;',
    'background:#0b0a2e;background-image:linear-gradient(90deg,#0b0a2e 0%,#151046 48%,#2b0f44 100%)}',
    '#' + ID + ' *{box-sizing:border-box;margin:0;padding:0}',
    '#' + ID + ' .bpp-confetti{position:absolute;top:0;right:0;bottom:0;left:0;pointer-events:none;opacity:.95;',
    'background-image:radial-gradient(circle,#ff7a00 0 1.7px,transparent 2.4px),radial-gradient(circle,#146ef5 0 1.7px,transparent 2.4px),',
    'radial-gradient(circle,#20b759 0 1.4px,transparent 2.1px),radial-gradient(circle,#f96c96 0 1.4px,transparent 2.1px),',
    'radial-gradient(circle,#fcb900 0 1.3px,transparent 2px),radial-gradient(circle,#9791fb 0 1.5px,transparent 2.2px),',
    'radial-gradient(700px 160px at 100% 50%,rgba(255,122,0,.16),transparent 70%);',
    'background-size:270px 92px,330px 112px,290px 98px,350px 124px,240px 84px,310px 104px,100% 100%;',
    'background-position:14px 12px,120px 52px,210px 22px,60px 72px,170px 38px,250px 64px,0 0;background-repeat:repeat,repeat,repeat,repeat,repeat,repeat,no-repeat}',
    '#' + ID + ' .bpp-inner{position:relative;display:flex;align-items:center;gap:14px;min-height:62px;padding:9px 46px 9px 16px}',
    '#' + ID + ' .bpp-lead{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 auto}',
    '#' + ID + ' .bpp-badge{flex:0 0 auto;display:inline-block;transform:rotate(-8deg);background:rgba(255,123,0,.92);color:#fff;',
    'font-size:11px;font-weight:800;letter-spacing:.3px;line-height:1;padding:6px 10px;border-radius:30px;white-space:nowrap;',
    'box-shadow:0 4px 14px rgba(255,123,0,.35);animation:bpp-bounce 5s ease-in-out infinite}',
    '#' + ID + ' .bpp-text{min-width:0}',
    '#' + ID + ' .bpp-title{font-size:17px;font-weight:800;letter-spacing:-.2px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#' + ID + ' .bpp-sub{margin-top:4px;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#ff9a3c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#' + ID + ' .bpp-coupon{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 5px 0 12px;border-radius:10px;',
    'background:#f7f9fd;border:1px dashed #b9cdf5;color:#070127}',
    '#' + ID + ' .bpp-coupon svg{width:15px;height:15px;fill:none;stroke:#146ef5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '#' + ID + ' .bpp-code{font-family:inherit;font-size:13px;font-weight:800;letter-spacing:1.8px;color:#070127;background:none;-webkit-user-select:all;user-select:all}',
    '#' + ID + ' .bpp-copy{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:0;border-radius:7px;',
    'background:#146ef5;color:#fff;cursor:pointer;-webkit-appearance:none;appearance:none;transition:background .15s,transform .15s}',
    '#' + ID + ' .bpp-copy svg{width:14px;height:14px;stroke:#fff}',
    '#' + ID + ' .bpp-copy:hover{background:#0f5fd8}',
    '#' + ID + ' .bpp-copy:active{transform:scale(.94)}',
    '#' + ID + ' .bpp-copy:focus-visible,#' + ID + ' .bpp-cta:focus-visible,#' + ID + ' .bpp-close:focus-visible{outline:2px solid #ff9a3c;outline-offset:2px}',
    '#' + ID + ' .bpp-copy.is-done{background:#20b759}',
    '#' + ID + ' .bpp-copy .bpp-ic-done,#' + ID + ' .bpp-copy.is-done .bpp-ic-copy{display:none}',
    '#' + ID + ' .bpp-copy.is-done .bpp-ic-done{display:block}',
    '#' + ID + ' .bpp-toast{position:absolute;left:50%;top:100%;transform:translate(-50%,6px);margin-top:0;padding:4px 8px;border-radius:6px;',
    'background:#070127;color:#fff;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s}',
    '#' + ID + ' .bpp-coupon{position:relative}',
    '#' + ID + ' .bpp-coupon.is-done .bpp-toast{opacity:1}',
    '#' + ID + ' .bpp-timer{flex:0 0 auto;display:flex;gap:6px;list-style:none}',
    '#' + ID + ' .bpp-timer li{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:42px;height:42px;padding:0 7px;',
    'border-radius:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.13)}',
    '#' + ID + ' .bpp-timer b{display:block;font-size:16px;font-weight:900;line-height:1.1;color:#fff;font-variant-numeric:tabular-nums}',
    '#' + ID + ' .bpp-timer span{display:block;margin-top:1px;font-size:9px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:rgba(255,255,255,.64)}',
    '#' + ID + ' .bpp-cta{flex:0 0 auto;display:inline-flex;align-items:center;height:38px;padding:0 20px;border-radius:11px;border:1px solid #e7edf8;',
    'background:#fff;color:#070127;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;cursor:pointer;transition:transform .15s,box-shadow .15s}',
    '#' + ID + ' .bpp-cta:hover{color:#070127;text-decoration:none;transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.28)}',
    '#' + ID + ' .bpp-close{position:absolute;top:50%;right:10px;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;',
    'width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;-webkit-appearance:none;appearance:none;transition:background .15s}',
    '#' + ID + ' .bpp-close svg{width:14px;height:14px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round}',
    '#' + ID + ' .bpp-close:hover{background:rgba(255,255,255,.26)}',
    '#' + ID + ' .bpp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '@keyframes bpp-bounce{0%,100%{transform:rotate(-8deg) translateY(0)}50%{transform:rotate(-8deg) translateY(-3px)}}',
    '@media (prefers-reduced-motion:reduce){#' + ID + ' .bpp-badge{animation:none}}',
    '@media (max-width:1099px){#' + ID + ' .bpp-sub{display:none}}',
    '@media (max-width:959px){#' + ID + ' .bpp-inner{flex-wrap:wrap;gap:10px 12px;padding:10px 46px 10px 14px}',
    '#' + ID + ' .bpp-lead{flex:1 1 100%}#' + ID + ' .bpp-sub{display:block}}',
    '@media (max-width:599px){#' + ID + ' .bpp-inner{padding:10px 44px 10px 12px;gap:8px 8px}#' + ID + ' .bpp-badge{display:none}',
    '#' + ID + ' .bpp-title{font-size:15px;white-space:normal}#' + ID + ' .bpp-sub{letter-spacing:1.4px;white-space:normal}',
    '#' + ID + ' .bpp-timer li{min-width:36px;height:38px;padding:0 5px}#' + ID + ' .bpp-timer b{font-size:14px}',
    '#' + ID + ' .bpp-coupon{height:36px}#' + ID + ' .bpp-cta{height:36px;padding:0 14px;font-size:13px}}'
  ].join('');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var style = el('style');
    style.id = STYLE_ID;
    style.type = 'text/css';
    style.appendChild(document.createTextNode(CSS));
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---------- build ---------- */

  function build() {
    var root = el('div');
    root.id = ID;
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', CONFIG.title);

    root.appendChild(el('div', 'bpp-confetti'));

    var inner = el('div', 'bpp-inner');
    root.appendChild(inner);

    // Headline block
    var lead = el('div', 'bpp-lead');
    if (CONFIG.badge) { lead.appendChild(el('span', 'bpp-badge', CONFIG.badge)); }
    var text = el('div', 'bpp-text');
    text.appendChild(el('div', 'bpp-title', CONFIG.title));
    if (CONFIG.subtitle) { text.appendChild(el('div', 'bpp-sub', CONFIG.subtitle)); }
    lead.appendChild(text);
    inner.appendChild(lead);

    // Coupon chip
    if (CONFIG.couponCode) {
      var coupon = el('div', 'bpp-coupon');
      coupon.appendChild(svg(ICON_TAG));
      var code = el('code', 'bpp-code', CONFIG.couponCode);
      coupon.appendChild(code);
      var copyBtn = el('button', 'bpp-copy');
      copyBtn.type = 'button';
      copyBtn.setAttribute('aria-label', 'Copy coupon code ' + CONFIG.couponCode);
      var icCopy = svg(ICON_COPY); icCopy.setAttribute('class', 'bpp-ic-copy');
      var icDone = svg(ICON_CHECK); icDone.setAttribute('class', 'bpp-ic-done');
      copyBtn.appendChild(icCopy);
      copyBtn.appendChild(icDone);
      coupon.appendChild(copyBtn);
      var toast = el('span', 'bpp-toast', 'Copied!');
      toast.setAttribute('aria-live', 'polite');
      coupon.appendChild(toast);
      copyBtn.addEventListener('click', function () { copyCode(CONFIG.couponCode, coupon, copyBtn, code, toast); });
      inner.appendChild(coupon);
    }

    // Countdown
    timerEls = null;
    if (CONFIG.showCountdown && endsAt) {
      var timer = el('ul', 'bpp-timer');
      timer.setAttribute('aria-hidden', 'true');
      timerEls = {};
      var units = [['d', 'Days'], ['h', 'Hrs'], ['m', 'Min'], ['s', 'Sec']];
      for (var i = 0; i < units.length; i++) {
        var li = el('li');
        var b = el('b', null, '00');
        li.appendChild(b);
        li.appendChild(el('span', null, units[i][1]));
        timer.appendChild(li);
        timerEls[units[i][0]] = b;
      }
      inner.appendChild(timer);
      var sr = el('span', 'bpp-sr', 'Sale ends ' + endsAt.toLocaleString());
      inner.appendChild(sr);
    }

    // CTA
    if (CONFIG.ctaText && CONFIG.ctaUrl) {
      var cta = el('a', 'bpp-cta', CONFIG.ctaText);
      cta.href = CONFIG.ctaUrl;
      cta.target = CONFIG.ctaTarget || '_blank';
      if (cta.target === '_blank') { cta.rel = 'noopener'; }
      inner.appendChild(cta);
    }

    // Close
    if (CONFIG.dismissible) {
      var close = el('button', 'bpp-close');
      close.type = 'button';
      close.setAttribute('aria-label', 'Dismiss promotion');
      close.appendChild(svg(ICON_CLOSE));
      close.addEventListener('click', dismiss);
      inner.appendChild(close);
    }

    return root;
  }

  /* ---------- behaviour ---------- */

  function copyCode(textToCopy, coupon, btn, codeEl, toast) {
    function finish(ok) {
      if (ok) {
        toast.textContent = 'Copied!';
      } else {
        // Nothing worked: at least select the code so the visitor can copy it.
        try {
          var sel = window.getSelection();
          var range = document.createRange();
          range.selectNodeContents(codeEl);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {}
        toast.textContent = 'Press Ctrl/Cmd+C to copy';
      }
      coupon.classList.add('is-done');
      btn.classList.add('is-done');
      window.setTimeout(function () {
        coupon.classList.remove('is-done');
        btn.classList.remove('is-done');
      }, 2200);
    }

    function legacyCopy() {
      var ok = false;
      try {
        var ta = el('textarea');
        ta.value = textToCopy;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, textToCopy.length);
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) { ok = false; }
      finish(ok);
    }

    // The async Clipboard API is blocked inside cross-origin iframes unless the
    // parent grants clipboard-write, so always keep the legacy path as fallback.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(function () { finish(true); }, legacyCopy);
    } else {
      legacyCopy();
    }
  }

  function updateCountdown(now) {
    if (!timerEls || !endsAt) { return; }
    var diff = Math.max(0, endsAt.getTime() - now.getTime());
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    setText(timerEls.d, pad2(d));
    setText(timerEls.h, pad2(h));
    setText(timerEls.m, pad2(m));
    setText(timerEls.s, pad2(s));
  }

  function setText(node, value) {
    if (node && node.textContent !== value) { node.textContent = value; }
  }

  // Keep the portal content below the banner. Mirrors how the portal handles
  // its own seasonal header: the banner is absolutely positioned at the top of
  // #app_container and the container gets a matching padding-top.
  function sync() {
    if (!banner || !container) { return; }
    var offset = 0;
    var fsHeader = container.querySelector('.bfcm-header.bfcm-header-visible');
    if (fsHeader) { offset = fsHeader.offsetHeight || 0; }
    var top = offset + 'px';
    if (banner.style.top !== top) { banner.style.top = top; }
    var padding = offset + (banner.offsetHeight || 0);
    if (padding !== lastPadding) {
      container.style.paddingTop = padding + 'px';
      lastPadding = padding;
    }
  }

  function mount() {
    container = document.getElementById(CONTAINER_ID);
    if (!container) { return false; }
    if (!banner) { banner = build(); }
    if (banner.parentNode !== container) {
      container.insertBefore(banner, container.firstChild);
    }
    document.documentElement.classList.add('bpl-portal-promo-active');
    if (!resizeObserver && window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver(function () { sync(); });
      resizeObserver.observe(banner);
    }
    sync();
    return true;
  }

  function teardown() {
    if (banner && banner.parentNode) { banner.parentNode.removeChild(banner); }
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    if (container) { container.style.paddingTop = ''; }
    document.documentElement.classList.remove('bpl-portal-promo-active');
    lastPadding = null;
    banner = null;
    timerEls = null;
  }

  function dismiss() {
    dismissed = true;
    try { window.localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) {}
    teardown();
  }

  function tick() {
    var now = new Date();
    if (!shouldShow(now)) {
      if (banner) { teardown(); }
      return;
    }
    // (Re)mount if the portal re-rendered its root.
    if (!banner || !document.body.contains(banner)) {
      if (!mount()) { return; }
    }
    updateCountdown(now);
    sync();
  }

  function start() {
    injectStyle();
    tick();
    if (!tickHandle) { tickHandle = window.setInterval(tick, 1000); }
    window.addEventListener('resize', sync);
    window.addEventListener('load', sync);
  }

  // The script is injected asynchronously by the portal, usually after the
  // layout exists. Wait for #app_container if it is not there yet.
  function whenContainerReady(fn) {
    if (document.getElementById(CONTAINER_ID)) { fn(); return; }
    var done = false;
    var finish = function () {
      if (done) { return; }
      done = true;
      if (observer) { observer.disconnect(); }
      window.clearInterval(poll);
      fn();
    };
    var observer = null;
    if (window.MutationObserver) {
      observer = new window.MutationObserver(function () {
        if (document.getElementById(CONTAINER_ID)) { finish(); }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    var poll = window.setInterval(function () {
      if (document.getElementById(CONTAINER_ID)) { finish(); }
    }, 250);
  }

  // Small debugging API: bplPortalPromo.reset() in the console brings a
  // dismissed banner back.
  window.bplPortalPromo = {
    config: CONFIG,
    hide: teardown,
    show: function () { dismissed = false; tick(); },
    reset: function () {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      dismissed = false;
      tick();
    }
  };

  whenContainerReady(start);
})();
