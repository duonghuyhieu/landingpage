/* HH Labs — landing page interactions */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  /* =========================================================
     i18n
     ========================================================= */
  const I18N = window.HH_I18N || { default: 'en', langs: { en: { short: 'EN' } }, dict: { en: {} } };
  const SUPPORTED = Object.keys(I18N.dict);
  const CJK_FONTS = {
    ja: 'Noto+Sans+JP:wght@400;500;700;800',
    ko: 'Noto+Sans+KR:wght@400;500;700;800',
    zh: 'Noto+Sans+SC:wght@400;500;700;800',
  };
  let lang = I18N.default;

  const t = (key, vars) => {
    let s = (I18N.dict[lang] && I18N.dict[lang][key]) ?? I18N.dict[I18N.default][key] ?? key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replace(`{${k}}`, vars[k]); });
    return s;
  };

  const loadCjkFont = l => {
    if (!CJK_FONTS[l] || document.getElementById(`font-${l}`)) return;
    const link = document.createElement('link');
    link.id = `font-${l}`;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${CJK_FONTS[l]}&display=swap`;
    document.head.appendChild(link);
  };

  const setMeta = (sel, val) => { const m = $(sel); if (m) m.setAttribute('content', val); };

  let afterLangChange = () => {};

  const applyLang = (next, persist) => {
    if (!SUPPORTED.includes(next)) next = I18N.default;
    lang = next;
    root.lang = next;
    loadCjkFont(next);

    $$('[data-i18n]').forEach(el => {
      const val = I18N.dict[next][el.dataset.i18n];
      if (val != null && el.innerHTML !== val) el.innerHTML = val;
    });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));

    document.title = t('meta.title');
    setMeta('meta[name="description"]', t('meta.desc'));
    setMeta('meta[property="og:locale"]', (I18N.langs[next] || {}).og || 'en_US');

    const cur = $('.lang__cur');
    if (cur) cur.textContent = (I18N.langs[next] || {}).short || next.toUpperCase();
    $$('.lang__menu [data-lang]').forEach(b => b.setAttribute('aria-current', String(b.dataset.lang === next)));

    if (persist) {
      store.set('hh-lang', next);
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) { url.searchParams.set('lang', next); history.replaceState(null, '', url); }
    }
    afterLangChange();
  };

  const initialLang = (() => {
    let q = null;
    try { q = new URLSearchParams(window.location.search).get('lang'); } catch { /* ignore */ }
    const saved = store.get('hh-lang');
    return [q, saved].find(l => l && SUPPORTED.includes(l)) || I18N.default;
  })();

  /* Language menu */
  const langWrap = $('#lang');
  if (langWrap) {
    const btn = $('.lang__btn', langWrap);
    const menu = $('.lang__menu', langWrap);
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      ($('[aria-current="true"]', menu) || $('button', menu)).focus();
    };
    btn.addEventListener('click', e => { e.stopPropagation(); menu.hidden ? open() : close(); });
    $$('[data-lang]', menu).forEach(b => b.addEventListener('click', () => {
      applyLang(b.dataset.lang, true);
      close(); btn.focus();
    }));
    menu.addEventListener('keydown', e => {
      const items = $$('button', menu);
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if (e.key === 'Escape') { close(); btn.focus(); }
    });
    document.addEventListener('click', e => { if (!langWrap.contains(e.target)) close(); });
  }

  /* =========================================================
     Theme (light / dark)
     ========================================================= */
  const themeBg = {
    light: { paper: '#FFF7EA', court: '#EEF0FF', night: '#0A0F22', blush: '#FFEFF5', pop: '#3D5AFE' },
    dark: { paper: '#121019', court: '#111130', night: '#060914', blush: '#200D19', pop: '#1A2380' },
  };
  const syncThemeColor = () => {
    const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    setMeta('meta[name="theme-color"]', themeBg[theme][body.dataset.scene] || themeBg[theme].paper);
  };
  const themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      store.set('hh-theme', next);
      syncThemeColor();
    });
  }
  // Follow OS changes until the visitor picks a theme explicitly
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onOsTheme = e => { if (!store.get('hh-theme')) { root.dataset.theme = e.matches ? 'dark' : 'light'; syncThemeColor(); } };
  if (mq.addEventListener) mq.addEventListener('change', onOsTheme);

  /* =========================================================
     Hero — playful parallax for shapes & stickers
     ========================================================= */
  const hero = $('.hero');
  const parallaxEls = $$('.shape[data-depth], .collage [data-depth]');
  if (hero && parallaxEls.length && finePointer && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0, visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    window.addEventListener('pointermove', e => {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });
    const animate = () => {
      if (visible) {
        cx += (tx - cx) * .07; cy += (ty - cy) * .07;
        const sy = Math.min(window.scrollY, window.innerHeight);
        parallaxEls.forEach(el => {
          const d = parseFloat(el.dataset.depth) || 1;
          el.style.transform = `translate3d(${cx * -16 * d}px, ${cy * -12 * d - sy * .08 * d}px, 0)`;
        });
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  /* =========================================================
     Scroll: progress bar, nav state
     ========================================================= */
  const nav = $('#nav');
  const bar = $('.progress span');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 30);
    const busy = body.classList.contains('menu-open') || ($('.lang__menu') && !$('.lang__menu').hidden);
    if (!busy && y > 500 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 500) nav.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* =========================================================
     Scenes — body background follows the section at mid-screen
     ========================================================= */
  const navLinks = $$('.nav__links a');
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.scene && body.dataset.scene !== el.dataset.scene) {
        body.dataset.scene = el.dataset.scene;
        syncThemeColor();
      }
      const id = el.id ? (el.id.startsWith('p-') ? 'products' : el.id) : '';
      navLinks.forEach(a => a.classList.toggle('is-active', !!id && id !== 'top' && a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  $$('main [data-scene], footer[data-scene]').forEach(s => sceneObserver.observe(s));

  /* =========================================================
     Reveal on scroll (with sibling stagger)
     ========================================================= */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  $$('.reveal').forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
    revealObserver.observe(el);
  });

  /* =========================================================
     Manifesto — words light up as you scroll
     (re-split whenever the language changes)
     ========================================================= */
  const manifesto = $('[data-words]');
  let words = [];
  const splitManifesto = () => {
    if (!manifesto) return;
    const perChar = lang === 'ja' || lang === 'zh';
    const wrap = text => {
      const frag = document.createDocumentFragment();
      const parts = perChar ? Array.from(text.replace(/\s+/g, ' ')) : text.split(/(\s+)/);
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = part;
        frag.appendChild(s);
      });
      return frag;
    };
    [...manifesto.childNodes].forEach(node => {
      if (node.nodeType === 3) manifesto.replaceChild(wrap(node.textContent), node);
      else if (node.nodeType === 1) { const txt = node.textContent; node.textContent = ''; node.appendChild(wrap(txt)); }
    });
    words = $$('.w', manifesto);
    updateManifesto();
  };
  const updateManifesto = () => {
    if (!manifesto || !words.length) return;
    if (reduceMotion) { words.forEach(w => w.classList.add('on')); return; }
    const r = manifesto.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  };
  if (manifesto) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateManifesto(); ticking = false; });
    }, { passive: true });
  }

  /* =========================================================
     Screen tabs (gentle autoplay while visible)
     ========================================================= */
  $$('.tabs[data-target]').forEach(tablist => {
    const screen = document.getElementById(tablist.dataset.target);
    if (!screen) return;
    const imgs = $$('img', screen);
    const tabs = $$('[role="tab"]', tablist);
    let current = 0, timer = 0, userTook = false;

    const show = i => {
      current = (i + imgs.length) % imgs.length;
      imgs.forEach((img, k) => img.classList.toggle('is-active', k === current));
      tabs.forEach((tab, k) => { tab.setAttribute('aria-selected', String(k === current)); tab.tabIndex = k === current ? 0 : -1; });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => { userTook = true; clearInterval(timer); show(i); });
      tab.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        userTook = true; clearInterval(timer);
        show(current + (e.key === 'ArrowRight' ? 1 : -1));
        tabs[current].focus();
      });
    });
    show(0);

    if (!reduceMotion) {
      new IntersectionObserver(([e]) => {
        clearInterval(timer);
        if (e.isIntersecting && !userTook) timer = setInterval(() => show(current + 1), 3600);
      }, { threshold: 0.4 }).observe(screen);
    }
  });

  /* =========================================================
     Tilt, magnetic buttons, custom cursor (desktop only)
     ========================================================= */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(1100px) rotateY(${x * 7}deg) rotateX(${y * -7}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * .15}px, ${y * .25}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    const cursor = $('.cursor');
    if (cursor) {
      const dot = $('.cursor__dot', cursor);
      const ring = $('.cursor__ring', cursor);
      let mx = -100, my = -100, rx = -100, ry = -100;
      window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
      document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
      const hoverSel = 'a, button, [data-zoom], label, input, textarea';
      document.addEventListener('pointerover', e => { if (e.target.closest(hoverSel)) cursor.classList.add('is-hover'); });
      document.addEventListener('pointerout', e => { if (e.target.closest(hoverSel)) cursor.classList.remove('is-hover'); });
      const tick = () => {
        rx += (mx - rx) * .2; ry += (my - ry) * .2;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(tick);
      };
      tick();
    }
  }

  /* =========================================================
     Mobile menu
     ========================================================= */
  const toggle = $('.nav__toggle');
  const menu = $('#mobile-menu');
  if (toggle && menu) {
    const setMenu = open => {
      toggle.setAttribute('aria-expanded', String(open));
      body.classList.toggle('menu-open', open);
      body.style.overflow = open ? 'hidden' : '';
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add('is-open'));
        nav.classList.remove('is-hidden');
      } else {
        menu.classList.remove('is-open');
        setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 600);
      }
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1100 && body.classList.contains('menu-open')) setMenu(false); });
  }

  /* =========================================================
     Toast + copy to clipboard
     ========================================================= */
  const toastEl = $('.toast');
  let toastT;
  const toast = msg => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
  };

  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch { /* ignore */ }
        ta.remove();
      }
      btn.classList.add('is-done');
      btn.textContent = t('js.copied');
      toast(t('js.toast', { t: text }));
      setTimeout(() => { btn.classList.remove('is-done'); btn.textContent = t('js.copy'); }, 1800);
    });
  });

  /* =========================================================
     Lightbox
     ========================================================= */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb);
    const lbCap = $('.lightbox__cap', lb);
    const closeBtn = $('.lightbox__close', lb);
    let lastFocus = null;

    const open = img => {
      lastFocus = document.activeElement;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lb.hidden = false;
      body.style.overflow = 'hidden';
      requestAnimationFrame(() => lb.classList.add('is-open'));
      closeBtn.focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      body.style.overflow = '';
      setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 350);
      if (lastFocus) lastFocus.focus();
    };

    $$('[data-zoom]').forEach(img => {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.addEventListener('click', () => open(img));
      img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
    });
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    });
  }

  /* =========================================================
     Contact form → opens the visitor's email client
     ========================================================= */
  const form = $('#contact-form');
  if (form) {
    const status = $('.form__status', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();
      const topics = $$('input[name="topic"]:checked', form).map(i => i.nextElementSibling.textContent.trim());

      let firstBad = null;
      [['name', name], ['email', email], ['message', message]].forEach(([key, val]) => {
        const input = form.elements[key];
        const bad = !val || (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
        input.closest('.field').classList.toggle('is-invalid', bad);
        if (bad && !firstBad) firstBad = input;
      });
      if (firstBad) { status.textContent = t('js.formErr'); firstBad.focus(); return; }

      const lines = [`${t('js.mailName')}: ${name}`, `Email: ${email}`];
      if (topics.length) lines.push(`${t('js.mailTopics')}: ${topics.join(', ')}`);
      lines.push('', message);
      const subject = `[HH Labs] ${t('js.mailSubject')} ${name}`;
      window.location.href =
        `mailto:contact@huyhieu.online?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.textContent = t('js.formOk');
    });
    $$('input, textarea', form).forEach(el => el.addEventListener('input', () => {
      const f = el.closest('.field'); if (f) f.classList.remove('is-invalid');
    }));
  }

  /* =========================================================
     Boot
     ========================================================= */
  afterLangChange = splitManifesto;
  applyLang(initialLang, false);
  root.classList.remove('lang-pending');
  syncThemeColor();

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const markLoaded = () => requestAnimationFrame(() => body.classList.add('is-loaded'));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1000))]).then(markLoaded);
  } else {
    markLoaded();
  }
})();
