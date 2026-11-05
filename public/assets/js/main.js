const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

// Keep menu state, focus, and background interaction in sync.
(function(){
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  const background = document.querySelectorAll('main, footer, .pill-nav, .nav-join, .nav-logo');
  function setOpen(open, restoreFocus = true) {
    menu.classList.toggle('open', open);
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    background.forEach(el => { el.inert = open; });
    if (open) menu.querySelector('a')?.focus();
    else if (restoreFocus) btn.focus();
  }
  btn.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (!menu.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    if (e.key === 'Tab') {
      const controls = [btn, ...menu.querySelectorAll('a[href]')];
      const index = controls.indexOf(document.activeElement);
      e.preventDefault();
      controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', e => {
    if (e.matches && menu.classList.contains('open')) setOpen(false, false);
  });
})();

// ── 3D card tilt ──
const card=document.getElementById('stats-card');
if(card){
  card.addEventListener('mousemove',e=>{
    if (motionPreference.matches) return;
    const r=card.getBoundingClientRect();
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const rx2=-(e.clientY-cy)/r.height*12;
    const ry2=(e.clientX-cx)/r.width*12;
    card.style.transform=`rotateX(${rx2}deg) rotateY(${ry2}deg)`;
  });
  card.addEventListener('mouseleave',()=>{card.style.transform='none'});
  motionPreference.addEventListener('change', () => { card.style.transform = 'none'; });
}

// Make horizontally scrolling examples usable from the keyboard.
document.querySelectorAll('.resource-prose pre').forEach((block, index) => {
  block.tabIndex = 0;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', `Code example ${index + 1}`);
});

// Cached values appear immediately; refreshes only animate changed numbers.
(async function(){
  if (!document.getElementById('stats-card')) return;
  const TEAM = 408973;
  const YEAR = new Date().getFullYear();
  const CACHE = `cia_ctf_${YEAR}`;
  const TTL = 6 * 3600 * 1000;
  const label = document.querySelector('.live-text');
  const updated = document.getElementById('stats-updated');
  let cached = null;

  function setNumber(id, target, prefix = '', suffix = '', animate = false) {
    const el = document.getElementById(id);
    if (!el || !Number.isFinite(target)) return;
    const start = Number(el.textContent.replace(/[^0-9.-]/g, ''));
    const render = value => { el.textContent = prefix + value + suffix; };
    if (!animate || motionPreference.matches || !Number.isFinite(start) || start === target) {
      render(target);
      return;
    }
    const began = performance.now();
    function step(now) {
      const progress = motionPreference.matches ? 1 : Math.min((now - began) / 400, 1);
      render(Math.round(start + (target - start) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function apply(data, animate = false) {
    const year = data.rating?.[YEAR] ? YEAR : YEAR - 1;
    const rating = data.rating?.[year] || {};
    if (rating.rating_points != null) setNumber('stat-pts', Math.floor(rating.rating_points), '', '', animate);
    if (rating.rating_place != null) setNumber('stat-global', Number(rating.rating_place), '#', '', animate);
    if (rating.ctfs_count != null) setNumber('stat-ctfs', Number(rating.ctfs_count), '', '+', animate);
    if (Array.isArray(data.members)) setNumber('stat-members', data.members.length, '', '', animate);
    if (rating.rating_points != null) {
      document.getElementById('stat-pts-label').textContent = year + ' Pts';
      document.getElementById('stat-global-label').textContent = 'Global ' + year;
    }
  }

  function setStatus(text, timestamp) {
    if (label) label.textContent = text + ' · CTFtime';
    if (updated) updated.textContent = timestamp
      ? '· ' + new Date(timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '· last published values';
  }

  try {
    const value = JSON.parse(localStorage.getItem(CACHE) || 'null');
    if (value?.d && Number.isFinite(value.ts)) cached = value;
  } catch {}
  if (cached) {
    apply(cached.d);
    setStatus('CACHED', cached.ts);
    if (Date.now() - cached.ts < TTL) return;
  }
  setStatus('UPDATING', cached?.ts);

  const api = `https://ctftime.org/api/v1/teams/${TEAM}/`;
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}`,
    `https://corsproxy.io/?${encodeURIComponent(api)}`
  ];
  for (const url of proxies) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) continue;
      const data = await response.json();
      if (!data || typeof data !== 'object' || (!data.rating && !Array.isArray(data.members))) continue;
      const timestamp = Date.now();
      apply(data, true);
      setStatus('LIVE', timestamp);
      try { localStorage.setItem(CACHE, JSON.stringify({ d: data, ts: timestamp })); } catch {}
      return;
    } catch {
      // Continue to the fallback source while keeping existing values visible.
    } finally {
      clearTimeout(timeout);
    }
  }
  document.querySelector('.live-dot')?.classList.add('offline');
  setStatus(cached ? 'CACHED' : 'OFFLINE', cached?.ts);
})();
