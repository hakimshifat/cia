// ── Loading Screen ──
window.addEventListener('load',()=>{
  if(!sessionStorage.getItem('cia_visited')){
    setTimeout(()=>{
      document.getElementById('loading').classList.add('hide');
      sessionStorage.setItem('cia_visited','1');
    },800);
  }
});

// ── Custom Cursor ──
const cursor=document.getElementById('cursor');
const ring=document.getElementById('cursor-ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{
  mx=e.clientX;my=e.clientY;
  cursor.style.left=mx+'px';cursor.style.top=my+'px';
});
function animRing(){
  rx+=(mx-rx)*0.12;
  ry+=(my-ry)*0.12;
  ring.style.left=rx+'px';ring.style.top=ry+'px';
  requestAnimationFrame(animRing);
}animRing();

// ── Cyber Network ──
const canvas=document.getElementById('particle-canvas');
const ctx=canvas.getContext('2d');
let W,H,nodes=[],pkts=[],waves=[];

const NCOLS=[
  {r:6,g:182,b:212},{r:6,g:182,b:212},{r:6,g:182,b:212},
  {r:99,g:102,b:241},{r:99,g:102,b:241},
  {r:236,g:72,b:153},{r:245,g:158,b:11},
];
function rc(){return NCOLS[Math.floor(Math.random()*NCOLS.length)];}
function dst(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
const CONN=210;

function setup(){
  W=canvas.width=window.innerWidth;
  H=canvas.height=window.innerHeight;
  nodes=[];pkts=[];waves=[];
  const n=Math.min(72,Math.floor(W*H/14000));
  for(let i=0;i<n;i++){
    const c=rc();
    nodes.push({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2,
      r:Math.random()*2+1.2,
      c, ph:Math.random()*Math.PI*2,
      ps:Math.random()*.022+.007,
    });
  }
}
setup();
window.addEventListener('resize',setup);

function spawnPkt(){
  if(nodes.length<2)return;
  const ai=Math.floor(Math.random()*nodes.length);
  const a=nodes[ai];
  const near=nodes.map((n,i)=>({i,d:dst(a,n)}))
    .filter(({i,d})=>i!==ai&&d<CONN)
    .sort((x,y)=>x.d-y.d);
  if(!near.length)return;
  const {i:bi}=near[Math.floor(Math.random()*Math.min(4,near.length))];
  const c=rc();
  pkts.push({ax:a.x,ay:a.y,bx:nodes[bi].x,by:nodes[bi].y,
    t:0,spd:Math.random()*.014+.004,r:c.r,g:c.g,b:c.b,ni:bi});
}

function spawnWave(){
  if(!nodes.length)return;
  const n=nodes[Math.floor(Math.random()*nodes.length)];
  waves.push({x:n.x,y:n.y,r:0,a:.5,c:n.c});
}

let pktT=0,waveT=0;

function animCanvas(){
  ctx.clearRect(0,0,W,H);

  // ── Edges ──
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const d=dst(nodes[i],nodes[j]);
      if(d>CONN)continue;
      const md=Math.min(
        Math.hypot(mx-nodes[i].x,my-nodes[i].y),
        Math.hypot(mx-nodes[j].x,my-nodes[j].y)
      );
      const boost=Math.max(0,1-md/280)*.5;
      const alpha=(1-d/CONN)*.11+boost;
      const c=nodes[i].c;
      ctx.beginPath();
      ctx.moveTo(nodes[i].x,nodes[i].y);
      ctx.lineTo(nodes[j].x,nodes[j].y);
      ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},${alpha})`;
      ctx.lineWidth=.75;
      ctx.stroke();
    }
  }

  // ── Pulse waves ──
  for(let i=waves.length-1;i>=0;i--){
    const w=waves[i];
    w.r+=2.5; w.a-=.008;
    if(w.a<=0){waves.splice(i,1);continue;}
    ctx.beginPath();
    ctx.arc(w.x,w.y,w.r,0,Math.PI*2);
    ctx.strokeStyle=`rgba(${w.c.r},${w.c.g},${w.c.b},${w.a})`;
    ctx.lineWidth=1.2;
    ctx.stroke();
  }

  // ── Nodes ──
  for(const n of nodes){
    n.ph+=n.ps;
    const pulse=(Math.sin(n.ph)+1)/2;
    const md=Math.hypot(mx-n.x,my-n.y);
    const mg=Math.max(0,1-md/160);
    const r=n.r+pulse*2+mg*5;
    ctx.shadowBlur=6+pulse*12+mg*24;
    ctx.shadowColor=`rgb(${n.c.r},${n.c.g},${n.c.b})`;
    ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);
    ctx.fillStyle=`rgba(${n.c.r},${n.c.g},${n.c.b},${.4+pulse*.5})`;
    ctx.fill();
    // draw tiny bright core
    ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(n.x,n.y,n.r*.55,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${.55+pulse*.3})`;
    ctx.fill();
    n.x+=n.vx; n.y+=n.vy;
    if(n.x<0||n.x>W)n.vx*=-1;
    if(n.y<0||n.y>H)n.vy*=-1;
  }

  // ── Data packets ──
  for(let i=pkts.length-1;i>=0;i--){
    const p=pkts[i];
    p.t+=p.spd;
    if(p.t>=1){pkts.splice(i,1);continue;}
    const x=p.ax+(p.bx-p.ax)*p.t;
    const y=p.ay+(p.by-p.ay)*p.t;
    // trail
    for(let k=1;k<=4;k++){
      const tt=Math.max(0,p.t-k*.018);
      const tx=p.ax+(p.bx-p.ax)*tt;
      const ty=p.ay+(p.by-p.ay)*tt;
      ctx.beginPath();ctx.arc(tx,ty,1.2,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${.18-k*.04})`;
      ctx.fill();
    }
    ctx.shadowBlur=18;
    ctx.shadowColor=`rgb(${p.r},${p.g},${p.b})`;
    ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},.95)`;
    ctx.fill();
    // bright white core
    ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(x,y,1.2,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.9)';
    ctx.fill();
  }

  ctx.shadowBlur=0;
  pktT++; if(pktT>7){spawnPkt();pktT=0;}
  waveT++; if(waveT>95){spawnWave();waveT=0;}
  requestAnimationFrame(animCanvas);
}animCanvas();

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
},{threshold:.15});
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

// nav links are separate pages