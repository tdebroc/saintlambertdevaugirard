(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header, progress bar, back-to-top */
  const header = $('#header');
  const progress = $('.progress');
  const totop = $('#totop');
  const hero = $('[data-parallax]');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = doc.scrollHeight - innerHeight;
    header.classList.toggle('is-scrolled', y > 10);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    totop.classList.toggle('is-visible', y > 700);
    if (hero && !reduceMotion && y < innerHeight) hero.style.transform = `translateY(${-y * 0.06}px)`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  totop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* Mobile menu */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Current section in nav */
  const links = $$('.nav a[href^="#"]:not(.nav__cta)');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${en.target.id}`));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) sectionObserver.observe(s); });

  /* Reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));


  /* Photo slider */
  const slider = $('#slider');
  const slides = $$('.slide', slider);
  const dotsBox = $('#slider-dots');
  const playBtn = $('#slider-play');
  const INTERVAL = 6000;
  let current = 0;
  let timer = null;
  let userPaused = reduceMotion;
  let hovering = false;
  slider.style.setProperty('--dur', `${INTERVAL}ms`);
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Photo ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsBox.append(b);
    return b;
  });
  const go = (n) => {
    current = (n + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const on = i === current;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', !on);
      if (!on) { const img = $('img', s); img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
    });
    dots.forEach((d, i) => {
      d.classList.remove('is-active', 'is-done');
      d.setAttribute('aria-selected', i === current);
      if (i < current) d.classList.add('is-done');
    });
    void dotsBox.offsetWidth;
    dots[current].classList.add('is-active');
    $$('img', slider).forEach((im) => { im.loading = 'eager'; });
  };
  const stop = () => { clearTimeout(timer); timer = null; };
  const schedule = () => { stop(); if (!userPaused && !hovering && !document.hidden) timer = setTimeout(() => { go(current + 1); schedule(); }, INTERVAL); };
  const restart = () => { go(current); schedule(); };
  const setPaused = (p) => {
    userPaused = p;
    playBtn.textContent = p ? '▶' : '❚❚';
    playBtn.setAttribute('aria-pressed', p);
    playBtn.setAttribute('aria-label', p ? 'Reprendre le défilement' : 'Mettre en pause le défilement');
    slider.classList.toggle('is-static', p);
    if (p) stop(); else restart();
  };
  $('#slider-prev').addEventListener('click', () => { go(current - 1); schedule(); });
  $('#slider-next').addEventListener('click', () => { go(current + 1); schedule(); });
  playBtn.addEventListener('click', () => setPaused(!userPaused));
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(current - 1); schedule(); }
    if (e.key === 'ArrowRight') { go(current + 1); schedule(); }
  });
  slider.addEventListener('mouseenter', () => { hovering = true; slider.classList.add('is-paused'); stop(); });
  slider.addEventListener('mouseleave', () => { hovering = false; slider.classList.remove('is-paused'); restart(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : schedule()));
  let startX = null;
  slider.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) startX = e.clientX; });
  addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); schedule(); }
  });
  playBtn.textContent = userPaused ? '▶' : '❚❚';
  playBtn.setAttribute('aria-pressed', userPaused);
  slider.classList.toggle('is-static', userPaused);
  go(0);
  schedule();

  /* Tabs */
  const tabs = $$('[role="tab"]');
  const bar = $('.tabs__bar');
  const moveBar = () => {
    const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    bar.style.width = `${active.offsetWidth}px`;
    bar.style.transform = `translateX(${active.offsetLeft}px)`;
  };
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
    moveBar();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (dir) { e.preventDefault(); selectTab(tabs[(i + dir + tabs.length) % tabs.length], true); }
    });
  });
  moveBar();
  addEventListener('resize', moveBar);
  document.fonts?.ready.then(moveBar);

  /* Editorial expand */
  const more = $('#edito-more');
  const toggle = $('#edito-toggle');
  toggle.addEventListener('click', () => {
    const open = more.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    toggle.firstChild.textContent = open ? 'Réduire ' : 'Lire la suite ';
  });

  /* Next mass + today's highlight (Paris time) */
  const masses = {
    0: ['9h00', '10h45', '18h30'],
    1: ['19h'],
    2: ['8h30', '19h'],
    3: ['8h30', '19h'],
    4: ['8h30', '19h'],
    5: ['8h30', '19h'],
    6: ['8h30', '18h'],
  };
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const toMin = (t) => { const [h, m] = t.split('h'); return +h * 60 + (+m || 0); };
  const parisNow = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    return { day, min: (+parts.hour % 24) * 60 + +parts.minute };
  };
  const { day, min } = parisNow();
  $$('.times li[data-day]').forEach((li) => {
    if (li.dataset.day.split(',').includes(String(day))) li.classList.add('is-today');
  });
  let label = '';
  for (let i = 0; i < 8 && !label; i++) {
    const d = (day + i) % 7;
    const t = masses[d].find((x) => i > 0 || toMin(x) > min);
    if (t) label = i === 0 ? `Aujourd'hui à ${t}` : i === 1 ? `Demain à ${t}` : `${dayNames[d][0].toUpperCase() + dayNames[d].slice(1)} à ${t}`;
  }
  $('#next-mass-text').textContent = label;
})();
