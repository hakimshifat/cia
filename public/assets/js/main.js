// ── Loading Screen ──
window.addEventListener('load',()=>{
  if(!sessionStorage.getItem('cia_visited')){
    setTimeout(()=>{
      document.getElementById('loading').classList.add('hide');
      sessionStorage.setItem('cia_visited','1');
    },800);
  }
});

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

// ── IntersectionObserver — reveals + skill bars ──
const revealEls=document.querySelectorAll('.reveal');
const revObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revObserver.unobserve(e.target)}});
},{threshold: 0, rootMargin: '0px 0px -50px 0px'});
revealEls.forEach(el=>revObserver.observe(el));

const bars=document.querySelectorAll('.skill-bar-fill');
const barObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.style.width=e.target.dataset.width+'%';
      barObserver.unobserve(e.target);
    }
  });
},{threshold:.3});
bars.forEach(b=>barObserver.observe(b));

// ── Ripple on avatar ──
const avatar=document.getElementById('contact-avatar');
if(avatar){
  avatar.addEventListener('click',e=>{
    const ripple=document.createElement('span');
    ripple.className='ripple';
    avatar.appendChild(ripple);
    setTimeout(()=>ripple.remove(),700);
  });
}

// ── Scroll Progress ──
const progressBar=document.getElementById('scroll-progress');
window.addEventListener('scroll',()=>{
  const scrolled=window.scrollY;
  const total=document.documentElement.scrollHeight-window.innerHeight;
  progressBar.style.width=(scrolled/total*100)+'%';
},{ passive:true });

// ── Hamburger ──
const ham=document.getElementById('hamburger');
const navLinks=document.getElementById('nav-links');
if(ham){
  ham.addEventListener('click',()=>navLinks.classList.toggle('open'));
}

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