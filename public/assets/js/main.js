// ── Loading Screen ──
window.addEventListener('load',()=>{
  if(!sessionStorage.getItem('cia_visited')){
    setTimeout(()=>{
      document.getElementById('loading').classList.add('hide');
      sessionStorage.setItem('cia_visited','1');
    },800);
  }
});

// ── Hamburger Menu Toggle ──
(function(){
  const btn=document.getElementById('hamburger');
  const menu=document.getElementById('mobile-menu');
  if(!btn||!menu)return;

  btn.addEventListener('click',()=>{
    const open=menu.classList.toggle('open');
    btn.classList.toggle('active');
    document.body.classList.toggle('menu-open',open);
  });

  menu.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click',()=>{
      menu.classList.remove('open');
      btn.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });
})();

// ── 3D card tilt ──
const card=document.getElementById('stats-card');
if(card){
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    const rx2=-(e.clientY-cy)/r.height*12;
    const ry2=(e.clientX-cx)/r.width*12;
    card.style.transform=`rotateX(${rx2}deg) rotateY(${ry2}deg)`;
  });
  card.addEventListener('mouseleave',()=>{card.style.transform='none'});
}

// ── IntersectionObserver — reveals ──
const revealEls=document.querySelectorAll('.reveal');
const revObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revObserver.unobserve(e.target)}});
},{threshold: 0, rootMargin: '0px 0px -50px 0px'});
revealEls.forEach(el=>revObserver.observe(el));

// ── CTFtime Live Stats ──
(async function(){
  const TEAM=408973;
  const YEAR=new Date().getFullYear();
  const CACHE=`cia_ctf_${YEAR}`;
  const TTL=6*3600*1000; // refresh every 6h

  function animNum(el,target,pre,suf){
    if(!el)return;
    const dur=1800,t0=performance.now();
    const step=now=>{
      const p=Math.min((now-t0)/dur,1);
      const e=1-Math.pow(1-p,3);
      el.textContent=pre+Math.floor(target*e)+suf;
      if(p<1)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function apply(data,fromCache){
    const yr=data.rating&&(data.rating[YEAR]||data.rating[YEAR-1])||{};
    const pts  = yr.rating_points!=null ? Math.floor(yr.rating_points) : null;
    const rank = yr.rating_place   || null;
    const ctfs = yr.ctfs_count     || null;
    const mem  = Array.isArray(data.members) ? data.members.length : null;
    const year = yr.rating_points!=null ? YEAR : YEAR-1;

    if(pts  !=null){animNum(document.getElementById('stat-pts'),pts,'','');
      const lbl=document.getElementById('stat-pts-label');
      if(lbl)lbl.textContent=year+' Pts';}
    if(rank !=null){animNum(document.getElementById('stat-global'),rank,'#','');
      const lbl=document.getElementById('stat-global-label');
      if(lbl)lbl.textContent='Global '+year;}
    if(ctfs !=null) animNum(document.getElementById('stat-ctfs'),ctfs,'','+');
    if(mem  !=null) animNum(document.getElementById('stat-members'),mem,'','');

    const upd=document.getElementById('stats-updated');
    if(upd){
      const d=new Date();
      upd.textContent='· '+d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    }
  }

  function goOffline(){
    const dot=document.querySelector('.live-dot');
    if(dot){dot.classList.add('offline');dot.title='Could not reach CTFtime';}
    const upd=document.getElementById('stats-updated');
    if(upd)upd.textContent='· cached data';
  }

  // Cache hit?
  try{
    const c=JSON.parse(localStorage.getItem(CACHE)||'null');
    if(c&&Date.now()-c.ts<TTL){apply(c.d,true);return;}
  }catch(e){}

  // Fetch with timeout
  async function get(url){
    const ctrl=new AbortController();
    const id=setTimeout(()=>ctrl.abort(),7000);
    const r=await fetch(url,{signal:ctrl.signal});
    clearTimeout(id);
    return r;
  }

  const api=`https://ctftime.org/api/v1/teams/${TEAM}/`;
  const proxies=[
    `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}`,
    `https://corsproxy.io/?${encodeURIComponent(api)}`,
  ];

  for(const p of proxies){
    try{
      const res=await get(p);
      if(!res.ok)continue;
      const data=await res.json();
      localStorage.setItem(CACHE,JSON.stringify({d:data,ts:Date.now()}));
      apply(data,false);
      return;
    }catch(e){continue;}
  }
  goOffline();
})();

// ── DevTools Trap (desktop only) ──
(function(){
  // Skip on mobile/touch devices
  if('ontouchstart' in window || navigator.maxTouchPoints>0 || window.innerWidth<1024) return;
  const rick='https://www.youtube.com/watch?v=-1oKO5NNSVI';

  const widthThreshold = 160;
  const heightThreshold = 180;
  let strikes = 0;
  let triggered = false;

  function redirect(){
    if(triggered)return;
    triggered = true;
    window.location.replace(rick);
  }

  window.addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    const devtoolsCombo =
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(key)) ||
      (e.ctrlKey && key === 'u');

    if(devtoolsCombo){
      e.preventDefault();
      redirect();
    }
  });

  setInterval(function(){
    if(triggered)return;

    // Method 1: Docked Check
    // If DevTools is docked, it takes up screen space, making inner dimensions noticeably smaller than outer.
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    const isDocked =
      window.outerWidth > 900 &&
      window.outerHeight > 600 &&
      (widthGap > widthThreshold || heightGap > heightThreshold);

    // Method 2: Timing Check
    // This catches undocked/detached DevTools.
    const before = performance.now();
    // The debugger statement pauses execution ONLY if DevTools is open.
    debugger; 
    const after = performance.now();
    
    // If the time diff is significantly large, DevTools was open and paused the thread.
    const isPaused = after - before > 120;

    if(isDocked || isPaused)strikes++;
    else strikes = Math.max(0,strikes-1);

    if(strikes >= 1)redirect();
  }, 1000);
})();
