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
