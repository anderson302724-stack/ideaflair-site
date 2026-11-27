/* Ideaflair motion — vanilla JS, transform/opacity only */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width:900px)');

  // Desktop: plan details open; mobile: tap to expand
  if (!mobile.matches) document.querySelectorAll('.plan details').forEach(d => d.open = true);

  // Scroll reveals with a small stagger between siblings
  const els = [...document.querySelectorAll('.reveal, .reveal-wash, .steps')];
  els.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', (Math.min(i, 5) * 0.09) + 's');
  });
  const showAll = () => els.forEach(e => e.classList.add('in'));
  if (reduce.matches || !('IntersectionObserver' in window)) showAll();
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }
  window.__showAll = showAll; // used by the screenshot script

  // Sticky nav shrink, progress bar, layered hero parallax (one rAF per frame)
  const header = document.querySelector('header');
  const bar = document.querySelector('.progress i');
  const layers = [...document.querySelectorAll('.hero-art .layer')];
  let mx = 0, my = 0, ticking = false;
  function frame() {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    const max = root.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (reduce.matches) return;
    const k = mobile.matches ? 0.55 : 1, yy = Math.min(y, 1000);
    for (const l of layers) {
      const sp = +l.dataset.speed || 0, m = +l.dataset.mx || 0;
      l.style.transform = `translate3d(${(mx * m).toFixed(2)}px, ${(yy * sp * k + my * m * 0.6).toFixed(2)}px, 0)`;
    }
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  const hero = document.querySelector('.hero');
  if (hero && matchMedia('(hover:hover)').matches) {
    hero.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; req(); });
    hero.addEventListener('pointerleave', () => { mx = my = 0; req(); });
  }
  reduce.addEventListener?.('change', () => { if (reduce.matches) { layers.forEach(l => l.style.transform = ''); showAll(); } req(); });
  frame();

  // Tab bar: highlight the section in view; hide pinned CTA at the closing section
  const tabs = [...document.querySelectorAll('.tabbar a')];
  const secs = tabs.map(t => document.getElementById(t.dataset.sec)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) tabs.forEach(t => {
        const on = t.dataset.sec === e.target.id;
        t.classList.toggle('on', on);
        on ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current');
      });
    }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io2.observe(s));
    const cta = document.querySelector('.sticky-cta'), close = document.getElementById('close');
    // Hide the pinned button while the hero buttons or the closing section are on screen (no duplicates)
    const heroCta = document.querySelector('.hero .cta-row');
    const vis = new Map();
    if (cta) { const o = new IntersectionObserver(es => { es.forEach(e => vis.set(e.target, e.isIntersecting)); cta.classList.toggle('hide', [...vis.values()].some(Boolean)); }, { threshold: 0.05 }); [heroCta, close].forEach(t => t && o.observe(t)); }
  }

  // Background variant + logo concept (also ?bg=a|b|c&logo=1|2|3)
  const sync = () => {
    document.querySelectorAll('[data-set-bg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setBg === root.dataset.bg)));
    document.querySelectorAll('[data-set-logo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLogo === root.dataset.logo)));
    const q = new URLSearchParams(location.search); q.delete('bg'); q.delete('logo');
    history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-set-bg],[data-set-logo]'); if (!b) return;
    if (b.dataset.setBg) root.dataset.bg = b.dataset.setBg; else root.dataset.logo = b.dataset.setLogo;
    sync();
  });
  sync();

  // Swipe carousels: page dots
  document.querySelectorAll('.carousel').forEach(c => {
    const dots = document.getElementById(c.dataset.dots);
    if (!dots) return;
    const items = [...c.children];
    dots.innerHTML = items.map(() => '<i></i>').join('');
    const ds = [...dots.children];
    const upd = () => {
      const w = items[0].getBoundingClientRect().width + 14;
      let i = Math.round(c.scrollLeft / w);
      if (c.scrollLeft + c.clientWidth >= c.scrollWidth - 4) i = items.length - 1;
      ds.forEach((d, j) => d.classList.toggle('on', j === i));
    };
    c.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    upd();
  });

  // PWA: tiny pass-through service worker (only when served over http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

// ===== Feature modules (nothing is sent anywhere) =====
(() => {
  const plans = {
    web:  { name: 'Care', price: '$179', why: 'We keep your website current, fast and fixed, so you never have to log in.' },
    posts:{ name: 'Growth', price: '$299', why: 'Monthly posts and site updates so customers keep finding you.' },
    sys:  { name: 'Business systems', price: '$449', why: 'Forms, handbooks and the behind-the-scenes paperwork, set up and kept tidy.' }
  };
  document.querySelectorAll('.quiz').forEach(q => {
    let a = 'posts';
    const steps = q.querySelectorAll('.q-steps i');
    const go = n => { q.dataset.step = n; steps.forEach((s, i) => s.classList.toggle('on', i < n)); };
    q.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a) { a = b.dataset.a; go(2); }
      else if (b.dataset.b) {
        const p = plans[a];
        q.querySelector('.r-name').textContent = p.name;
        q.querySelector('.r-price em').textContent = p.price;
        q.querySelector('.r-why').textContent = p.why + (b.dataset.b === 'off' ? ' You hand it off; we handle it.' : ' You can still make quick edits yourself.');
        go(3);
      } else if (b.classList.contains('q-reset')) go(1);
    });
  });
  document.querySelectorAll('.ba').forEach(ba => {
    const r = ba.querySelector('.ba-range');
    r.addEventListener('input', () => ba.style.setProperty('--p', r.value + '%'));
  });
  document.querySelectorAll('.book').forEach(f => {
    f.addEventListener('click', e => {
      const b = e.target.closest('.chips button');
      if (b) { b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); return; }
      if (e.target.closest('.bk-send')) { f.querySelector('.bk-done').hidden = false; f.querySelector('.bk-txt').hidden = true; }
      if (e.target.closest('[data-demo-text]')) { e.preventDefault(); f.querySelector('.bk-txt').hidden = false; f.querySelector('.bk-done').hidden = true; }
    });
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.soc').forEach(s => {
    const t = s.querySelector('.soc-track'), items = [...t.children], dots = [...s.querySelectorAll('.soc-dots i')];
    const cur = () => Math.round(t.scrollLeft / (items[0].offsetWidth + 16));
    const upd = () => dots.forEach((d, i) => d.classList.toggle('on', i === Math.min(cur(), items.length - 1)));
    t.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    if (!reduce) {
      let paused = false;
      s.addEventListener('pointerenter', () => paused = true); s.addEventListener('pointerleave', () => paused = false);
      setInterval(() => { if (paused || document.hidden || window.__noAuto) return; const n = (cur() + 1) % items.length; t.scrollTo({ left: n * (items[0].offsetWidth + 16), behavior: 'smooth' }); }, 3800);
    }
  });
})();
