/* ============================================================
   Areeba's Birthday Surprise — script.js
   ============================================================ */

/* ---------------- Performance tier ---------------- */
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
const lowEnd = isMobile && (navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : true);
const PERF = lowEnd ? 0.55 : 1;

/* ============================================================
   PAGE NAVIGATION
   ============================================================ */
const pages = document.querySelectorAll('.page');
let currentPage = document.getElementById('page-open');

function goToPage(id){
  const next = document.getElementById(id);
  if(!next || next === currentPage) return;
  const prev = currentPage;
  prev.classList.add('page-transition-out');
  setTimeout(()=>{
    prev.classList.remove('active','page-transition-out');
    next.classList.add('active');
    const inner = next.querySelector('.content-center');
    if(inner){ inner.classList.remove('reveal'); void inner.offsetWidth; inner.classList.add('reveal'); }
    currentPage = next;
    window.scrollTo({top:0, behavior:'instant'});
    onPageEnter(id);
  }, 480);
  tryStartMusic();
}

document.body.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-next]');
  if(btn){ goToPage(btn.getAttribute('data-next')); }
});

/* ---------------- YES actions ---------------- */
document.body.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');

  if(action === 'yes-q1'){ heartBurst(); miniFirework(); goToPage('page-s1'); }
  if(action === 'yes-q2'){ heartBurst(); petalBurst(); goToPage('page-s2'); }
  if(action === 'yes-q3'){ heartBurst(); goToPage('page-s3'); }
  if(action === 'yes-q4'){ heartBurst(); goToPage('page-s4'); }
  if(action === 'yes-q5'){ dramaticFinale(); }
});

function dramaticFinale(){
  document.body.classList.add('dim-flash');
  heartBurst();
  heartBurst();
  setTimeout(()=>{ goToPage('page-loveyou'); }, 350);
}

/* ---------------- NO button escape ---------------- */
document.querySelectorAll('[data-action="no-escape"]').forEach(btn=>{
  const messages = JSON.parse(btn.getAttribute('data-messages') || '[]');
  let escaping = false;

  const escape = (evt)=>{
    evt.preventDefault();
    const row = btn.closest('.btn-row');
    const teaseEl = row.parentElement.querySelector('.teasing-msg');
    if(messages.length && teaseEl){
      teaseEl.textContent = messages[Math.floor(Math.random()*messages.length)];
    }
    if(!escaping){
      escaping = true;
      btn.classList.add('escaping');
    }
    const btnRect = btn.getBoundingClientRect();
    const w = btnRect.width || 130;
    const h = btnRect.height || 56;
    const pad = 16;
    const maxX = window.innerWidth - w - pad;
    const maxY = window.innerHeight - h - pad;
    const x = Math.max(pad, Math.random() * maxX);
    const y = Math.max(pad, Math.random() * maxY);
    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
  };

  // desktop: move away before click registers
  btn.addEventListener('mouseenter', escape);
  // mobile: pointerdown fires before click, so it escapes on tap attempt
  btn.addEventListener('touchstart', escape, {passive:false});
  btn.addEventListener('pointerdown', (e)=>{
    if(e.pointerType === 'touch') escape(e);
  });
});

/* ---------------- On page enter hooks ---------------- */
function onPageEnter(id){
  if(id === 'page-s3'){ startGentleFireworks(); }
  if(id === 'page-final'){
    startFinaleSequence();
  }
  if(id === 'page-loveyou'){
    smallFireworksBurst(3);
  }
}

/* ============================================================
   CANVAS SETUP
   ============================================================ */
const bgCanvas = document.getElementById('bg-canvas');
const petalCanvas = document.getElementById('petal-canvas');
const fxCanvas = document.getElementById('fx-canvas');
const bgCtx = bgCanvas.getContext('2d');
const petalCtx = petalCanvas.getContext('2d');
const fxCtx = fxCanvas.getContext('2d');

// Cap pixel ratio hard — phones report DPR up to 3, which triples/9x's
// the pixels every canvas has to fill each frame. This was the main
// cause of the slowdown. 1.5 on mobile / 2 on desktop looks fine.
const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

function resizeCanvases(){
  [bgCanvas, petalCanvas, fxCanvas].forEach(c=>{
    c.width = window.innerWidth * DPR;
    c.height = window.innerHeight * DPR;
  });
  [bgCtx, petalCtx, fxCtx].forEach(ctx=> ctx.setTransform(DPR,0,0,DPR,0,0));
}
resizeCanvases();
window.addEventListener('resize', resizeCanvases);

function vw(){ return window.innerWidth; }
function vh(){ return window.innerHeight; }

/* ============================================================
   BACKGROUND: stars / sparkles / bokeh with subtle parallax
   ============================================================ */
let stars = [];
function initStars(){
  stars = [];
  // Radial-gradient "bokeh" stars are much pricier to draw than plain
  // dots, so mobile gets a noticeably smaller field.
  const count = Math.floor((vw()*vh()/(isMobile ? 16000 : 9000)) * PERF);
  for(let i=0;i<count;i++){
    stars.push({
      x: Math.random()*vw(),
      y: Math.random()*vh(),
      r: Math.random()*1.6+0.4,
      baseAlpha: Math.random()*0.6+0.2,
      twinkleSpeed: Math.random()*0.02+0.005,
      phase: Math.random()*Math.PI*2,
      layer: (!isMobile && Math.random() < 0.3) ? 'bokeh' : 'star',
      hue: Math.random() < 0.5 ? '255,255,255' : '243,211,138'
    });
  }
}
initStars();
window.addEventListener('resize', initStars);

let mouseX = vw()/2, mouseY = vh()/2;
window.addEventListener('mousemove', (e)=>{ mouseX = e.clientX; mouseY = e.clientY; });

let t = 0;
function drawBackground(){
  bgCtx.clearRect(0,0,vw(),vh());
  const parallaxX = isMobile ? 0 : (mouseX - vw()/2) * 0.01;
  const parallaxY = isMobile ? 0 : (mouseY - vh()/2) * 0.01;

  stars.forEach(s=>{
    const alpha = s.baseAlpha + Math.sin(t*s.twinkleSpeed*10 + s.phase)*0.25;
    bgCtx.beginPath();
    if(s.layer === 'bokeh'){
      const grad = bgCtx.createRadialGradient(
        s.x+parallaxX, s.y+parallaxY, 0, s.x+parallaxX, s.y+parallaxY, s.r*8
      );
      grad.addColorStop(0, `rgba(${s.hue},${Math.max(alpha,0.05)*0.5})`);
      grad.addColorStop(1, `rgba(${s.hue},0)`);
      bgCtx.fillStyle = grad;
      bgCtx.arc(s.x+parallaxX, s.y+parallaxY, s.r*8, 0, Math.PI*2);
    } else {
      bgCtx.fillStyle = `rgba(${s.hue},${Math.max(alpha,0.05)})`;
      bgCtx.arc(s.x+parallaxX, s.y+parallaxY, s.r, 0, Math.PI*2);
    }
    bgCtx.fill();
  });
  t++;
}

/* ============================================================
   PETALS / FLOWERS — layered realistic falling animation
   ============================================================ */
const PETAL_COLORS = ['#ff4fa3','#d81b5c','#f3d38a','#c22a86','#ffb6d5','#fff0f5'];

function makePetal(layer){
  const sizeBase = layer === 'fg' ? [22,34] : layer === 'mid' ? [13,22] : [6,12];
  const speedBase = layer === 'fg' ? [1.6,2.6] : layer === 'mid' ? [0.9,1.6] : [0.4,0.9];
  const alpha = layer === 'fg' ? 0.9 : layer === 'mid' ? 0.65 : 0.35;
  return {
    layer,
    x: Math.random()*vw(),
    y: Math.random()*vh() - vh(),
    size: rand(sizeBase[0], sizeBase[1]),
    speedY: rand(speedBase[0], speedBase[1]),
    swing: rand(0.5,1.8),
    swingSpeed: rand(0.005,0.02),
    phase: Math.random()*Math.PI*2,
    rotation: Math.random()*Math.PI*2,
    rotSpeed: rand(-0.02,0.02),
    color: PETAL_COLORS[Math.floor(Math.random()*PETAL_COLORS.length)],
    blur, alpha,
    windDrift: rand(-0.3,0.3),
    shape: Math.random() < 0.75 ? 'petal' : (Math.random() < 0.5 ? 'heart' : 'flower')
  };
}

let petals = [];
function initPetals(){
  petals = [];
  // Lower total petal count — plenty of visual density without the
  // per-frame draw cost of dozens of shapes on a slow phone.
  const baseCount = Math.floor((isMobile ? 26 : 46) * PERF);
  const layers = [
    {name:'bg', n: Math.floor(baseCount*0.4)},
    {name:'mid', n: Math.floor(baseCount*0.4)},
    {name:'fg', n: Math.floor(baseCount*0.2)},
  ];
  layers.forEach(l=>{
    for(let i=0;i<l.n;i++) petals.push(makePetal(l.name));
  });
}
initPetals();
window.addEventListener('resize', initPetals);

let globalWind = 0, windTarget = 0;
setInterval(()=>{ windTarget = rand(-0.6, 0.6); }, 4000);

function drawPetalShape(ctx, p){
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  // Fake the "depth blur" cheaply via opacity instead of ctx.filter —
  // canvas blur filters are very slow on mobile GPUs and were the main
  // cause of the site hanging. Lower layers are just dimmer/smaller,
  // which reads as "further away" without the perf cost.
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;

  if(p.shape === 'heart'){
    const s = p.size*0.5;
    ctx.beginPath();
    ctx.moveTo(0, s*0.3);
    ctx.bezierCurveTo(-s, -s*0.6, -s*1.4, s*0.6, 0, s*1.4);
    ctx.bezierCurveTo(s*1.4, s*0.6, s, -s*0.6, 0, s*0.3);
    ctx.fill();
  } else if(p.shape === 'flower'){
    const petalsN = 5;
    for(let i=0;i<petalsN;i++){
      ctx.save();
      ctx.rotate((Math.PI*2/petalsN)*i);
      ctx.beginPath();
      ctx.ellipse(0, -p.size*0.35, p.size*0.28, p.size*0.42, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.arc(0,0,p.size*0.14,0,Math.PI*2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size*0.55, p.size*0.32, 0, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function updateDrawPetals(){
  globalWind += (windTarget - globalWind) * 0.01;
  petalCtx.clearRect(0,0,vw(),vh());
  petals.forEach(p=>{
    p.phase += p.swingSpeed;
    p.y += p.speedY;
    p.x += Math.sin(p.phase)*p.swing*0.4 + globalWind + p.windDrift;
    p.rotation += p.rotSpeed;

    if(p.y > vh()+40){
      p.y = -40; p.x = Math.random()*vw();
    }
    if(p.x > vw()+40) p.x = -40;
    if(p.x < -40) p.x = vw()+40;

    drawPetalShape(petalCtx, p);
  });
}

function petalBurst(){
  for(let i=0;i<20*PERF;i++){
    const p = makePetal('fg');
    p.x = vw()/2 + rand(-100,100);
    p.y = vh()/2 + rand(-60,60);
    p.speedY = rand(2.5,4.5);
    petals.push(p);
  }
  setTimeout(()=>{ petals.splice(0, Math.max(0, petals.length - 60)); }, 4000);
}

/* ============================================================
   FIREWORKS — canvas particle system
   ============================================================ */
const FW_COLORS = ['#ff4fa3','#c22a86','#f3d38a','#ffffff','#d81b5c','#7f9dff'];
let fireworks = [];
let fwParticles = [];
let heartParticles = [];
let fireworksActive = false;
let fireworksInterval = null;

function rand(a,b){ return a + Math.random()*(b-a); }

function launchFirework(opts={}){
  const startX = opts.x ?? rand(vw()*0.15, vw()*0.85);
  const endY = opts.y ?? rand(vh()*0.15, vh()*0.55);
  const color = opts.color ?? FW_COLORS[Math.floor(Math.random()*FW_COLORS.length)];
  const size = opts.size ?? rand(0.6,1.4);
  fireworks.push({
    x: startX, y: vh()+10,
    targetY: endY,
    vy: rand(-9.5,-7.5)*size,
    color, size,
    trail: []
  });
}

const MAX_FW_PARTICLES = isMobile ? 220 : 500;

function explode(x,y,color,size=1){
  const count = Math.floor(rand(isMobile ? 18 : 40, isMobile ? 34 : 80) * size * PERF);
  // Safety valve: if particles are backing up (slow device dropping
  // frames), skip adding more instead of letting the array balloon.
  if(fwParticles.length > MAX_FW_PARTICLES) return;
  for(let i=0;i<count;i++){
    const angle = (Math.PI*2/count)*i + Math.random()*0.2;
    const speed = rand(1.5,5.5) * size;
    fwParticles.push({
      x, y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      alpha: 1,
      color,
      size: rand(1.4,3),
      decay: rand(0.008,0.02)
    });
  }
}

function updateDrawFireworks(){
  fxCtx.clearRect(0,0,vw(),vh());
  fxCtx.globalCompositeOperation = 'lighter';

  fireworks = fireworks.filter(f=>{
    f.vy += 0.12;
    f.y += f.vy;
    f.trail.push({x:f.x, y:f.y});
    if(f.trail.length > 8) f.trail.shift();

    fxCtx.beginPath();
    fxCtx.strokeStyle = f.color;
    fxCtx.lineWidth = 2;
    fxCtx.globalAlpha = 0.6;
    f.trail.forEach((pt,i)=>{
      if(i===0) fxCtx.moveTo(pt.x, pt.y); else fxCtx.lineTo(pt.x, pt.y);
    });
    fxCtx.stroke();

    fxCtx.beginPath();
    fxCtx.fillStyle = '#fff';
    fxCtx.globalAlpha = 1;
    fxCtx.arc(f.x, f.y, 2.4, 0, Math.PI*2);
    fxCtx.fill();

    if(f.vy >= 0 || f.y <= f.targetY){
      explode(f.x, f.y, f.color, f.size);
      return false;
    }
    return true;
  });

  fwParticles = fwParticles.filter(p=>{
    p.vy += 0.045;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    if(p.alpha <= 0) return false;

    fxCtx.beginPath();
    fxCtx.globalAlpha = Math.max(p.alpha,0);
    fxCtx.fillStyle = p.color;
    // shadowBlur is expensive per-particle on mobile — skip it there
    // and rely on the "lighter" composite mode for the glow look instead.
    if(!isMobile){
      fxCtx.shadowColor = p.color;
      fxCtx.shadowBlur = 8;
    }
    fxCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    fxCtx.fill();
    fxCtx.shadowBlur = 0;
    return true;
  });

  heartParticles = heartParticles.filter(h=>{
    h.y += h.vy;
    h.x += Math.sin(h.phase)*0.6;
    h.phase += 0.05;
    h.alpha -= 0.006;
    h.rotation += h.rotSpeed;
    if(h.alpha <= 0) return false;
    fxCtx.save();
    fxCtx.globalAlpha = Math.max(h.alpha,0);
    fxCtx.translate(h.x, h.y);
    fxCtx.rotate(h.rotation);
    fxCtx.font = `${h.size}px serif`;
    fxCtx.textAlign = 'center';
    if(!isMobile){
      fxCtx.shadowColor = '#ff4fa3';
      fxCtx.shadowBlur = 10;
    }
    fxCtx.fillText(h.emoji, 0, 0);
    fxCtx.restore();
    return true;
  });

  fxCtx.globalCompositeOperation = 'source-over';
  fxCtx.globalAlpha = 1;
}

function miniFirework(){
  launchFirework({size:0.7});
}
function smallFireworksBurst(n){
  for(let i=0;i<n;i++){
    setTimeout(()=>launchFirework({size:rand(0.6,1)}), i*260);
  }
}
function startGentleFireworks(){
  // very subtle, occasional, for the dua page
  let count = 0;
  const iv = setInterval(()=>{
    if(!document.getElementById('page-s3').classList.contains('active') || count>3){
      clearInterval(iv); return;
    }
    launchFirework({size:0.45, color: '#f3d38a'});
    count++;
  }, 2200);
}

function startContinuousFireworks(){
  if(fireworksActive) return;
  fireworksActive = true;
  fireworksInterval = setInterval(()=>{
    if(!document.getElementById('page-final').classList.contains('active')){
      clearInterval(fireworksInterval);
      fireworksActive = false;
      return;
    }
    const n = isMobile ? 1 : (Math.random()<0.4 ? 2 : 1);
    for(let i=0;i<n;i++){
      launchFirework({size: rand(0.5, isMobile ? 1.1 : 1.5)});
    }
  }, isMobile ? 1600 : 900);
}

function heartBurst(){
  const emojis = ['❤️','💗','💕','💖'];
  const cx = vw()/2, cy = vh()*0.6;
  const count = Math.floor(18*PERF);
  for(let i=0;i<count;i++){
    heartParticles.push({
      x: cx + rand(-80,80),
      y: cy + rand(-40,40),
      vy: rand(-2.6,-1.2),
      phase: Math.random()*Math.PI*2,
      alpha: 1,
      size: rand(16,30),
      rotation: rand(-0.3,0.3),
      rotSpeed: rand(-0.01,0.01),
      emoji: emojis[Math.floor(Math.random()*emojis.length)]
    });
  }
}

function kissBurst(){
  const emojis = ['😘','💋','❤️'];
  const cx = vw()/2, cy = vh()*0.75;
  const count = Math.floor(22*PERF);
  for(let i=0;i<count;i++){
    heartParticles.push({
      x: cx + rand(-100,100),
      y: cy + rand(-30,30),
      vy: rand(-3.2,-1.6),
      phase: Math.random()*Math.PI*2,
      alpha: 1,
      size: rand(18,30),
      rotation: rand(-0.3,0.3),
      rotSpeed: rand(-0.01,0.01),
      emoji: emojis[Math.floor(Math.random()*emojis.length)]
    });
  }
}

function hugBurst(){
  const frame = document.querySelector('.photo-frame');
  if(!frame) { heartBurst(); return; }
  const rect = frame.getBoundingClientRect();
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  const count = Math.floor(24*PERF);
  for(let i=0;i<count;i++){
    const angle = (Math.PI*2/count)*i;
    const radius = Math.max(rect.width, rect.height)/1.6;
    heartParticles.push({
      x: cx + Math.cos(angle)*radius,
      y: cy + Math.sin(angle)*radius,
      vy: rand(-1.2,-0.4),
      phase: Math.random()*Math.PI*2,
      alpha: 1,
      size: rand(14,24),
      rotation: 0,
      rotSpeed: rand(-0.01,0.01),
      emoji: '💗'
    });
  }
}

/* ============================================================
   MASTER RENDER LOOP
   ============================================================ */
function loop(){
  drawBackground();
  updateDrawPetals();
  updateDrawFireworks();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ============================================================
   FINAL PAGE — dramatic sequence + content build
   ============================================================ */
const WISHES = [
  "Happy Birthday meri jaan ❤️",
  "Aaj ka din mere liye bhi bahut special hai, kyunki isi din meri favourite person duniya mein aayi thi. 🥹❤️",
  "Sweetheart, tum meri life ka woh beautiful part ho jiske bina meri story incomplete lagti hai.",
  "Meri Motki 😂❤️, tum mujhe jitna tang karti ho na, utna hi zyada tumse pyaar bhi karta hoon.",
  "Tum meri wife ho, meri best friend ho, meri partner ho aur meri favourite headache bhi ho. 😂❤️",
  "Tumhare saath har chhoti si baat bhi special lagti hai.",
  "Tumhari smile hamesha aise hi bani rahe, aur Allah tumhari har khwahish poori kare. 🤲❤️",
  "Meri dua hai ki tumhari zindagi hamesha happiness, peace, love aur success se bhari rahe.",
  "May Allah always keep you under His protection and fill your heart with peace.",
  "Aur haan sweetheart, birthday tumhara hai... lekin gift mujhe mila hai — TUM. ❤️",
  "I love you more than I can ever explain in words.",
  "Happy Birthday meri jaan, meri wife, meri Motki, meri Areeba. ❤️🎂"
];

const SHAYARI_RECAP = [
  {mark:'❝', text:"Tere chehre ki wo khoobsurat tasweer kahan se lau,<br>Har lamha tere saath guzrey aisi takdeer kahan se lau,<br>Main maangta hoon har safar mein saath tera,<br>Tu hi bata mere haathon mein wo lakeer kahan se lau. ❤️"},
  {mark:'🌹', text:"Tere pyaar ka kya hisaab du,<br>Teri mohabbat ko kya khitaab du...<br>Koi acha sa phool hota toh tumhen zarur pesh karte,<br>Magar jo khud hi gulaab ho,<br>Usey kya gulaab du... 🌹❤️"},
  {mark:'🤲', text:"I pray wherever you are, you're okay and you're very happy.<br><br>I pray you're always close to Allah and your heart's at peace.<br><br>I pray you're never out of Allah's protection, not even for a blink. 🤲❤️"},
  {mark:'✦', text:"وإن أحبوك ألفاً، فلن يحبوك إلا قطرة من بحري<br><br><span style='font-family:Cormorant Garamond, serif; font-style:italic; font-size:0.85em; color:#ffd6ec;'>And if a thousand others love you, they will only love you a drop compared to my ocean of love for you. ❤️</span>"}
];

let finalBuilt = false;
function startFinaleSequence(){
  document.body.classList.remove('dim-flash');
  smallFireworksBurst(4);
  startContinuousFireworks();

  if(finalBuilt) return;
  finalBuilt = true;

  const wishesWrap = document.getElementById('wishes-wrap');
  WISHES.forEach((w,i)=>{
    const div = document.createElement('div');
    div.className = 'wish-card';
    div.textContent = w;
    wishesWrap.appendChild(div);
    setTimeout(()=> div.classList.add('shown'), 400 + i*260);
  });

  const recapWrap = document.getElementById('shayari-recap');
  SHAYARI_RECAP.forEach((s,i)=>{
    const div = document.createElement('div');
    div.className = 'glass-card shayari-card';
    div.innerHTML = `<span class="card-mark">${s.mark}</span><p class="shayari-text">${s.text}</p>`;
    recapWrap.appendChild(div);
  });

  // reveal recap cards on scroll
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) entry.target.classList.add('shown');
    });
  }, {threshold:0.2});
  recapWrap.querySelectorAll('.glass-card').forEach(c=>obs.observe(c));
}

/* ---------------- Final page action buttons ---------------- */
document.getElementById('btn-kiss')?.addEventListener('click', ()=>{
  kissBurst();
  showTease('tease-final', "Kiss received, sweetheart 😘❤️");
});
document.getElementById('btn-love')?.addEventListener('click', ()=>{
  heartBurst();
  const msgs = [
    "You are my favourite person ❤️",
    "I choose you. Always. ❤️",
    "You make my world beautiful 🥹",
    "My home is wherever you are ❤️",
    "Forever sounds perfect with you ❤️",
    "Meri Motki, I love you 😂❤️"
  ];
  showTease('tease-final', msgs[Math.floor(Math.random()*msgs.length)]);
});
document.getElementById('btn-hug')?.addEventListener('click', ()=>{
  hugBurst();
  showTease('tease-final', "Sending you the warmest hug 🤗❤️");
});
document.getElementById('btn-replay')?.addEventListener('click', ()=>{
  goToPage('page-open');
});

function showTease(id, msg){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = msg;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'fadeUp .5s ease both';
}

/* ============================================================
   MUSIC
   ============================================================ */
const music = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
let musicPlaying = false;
let userInteracted = false;

function tryStartMusic(){
  if(userInteracted) return;
  userInteracted = true;
  music.volume = 0.55;
  music.play().then(()=>{
    musicPlaying = true;
    musicBtn.classList.add('playing');
  }).catch(()=>{ /* autoplay blocked, wait for explicit toggle */ });
}

musicBtn.addEventListener('click', ()=>{
  if(musicPlaying){
    music.pause();
    musicPlaying = false;
    musicBtn.classList.remove('playing');
  } else {
    music.volume = 0.55;
    music.play().then(()=>{
      musicPlaying = true;
      musicBtn.classList.add('playing');
    }).catch(()=>{});
  }
  userInteracted = true;
});

/* dim flash utility class for finale transition */
const style = document.createElement('style');
style.textContent = `
.dim-flash::before{
  content:'';
  position:fixed; inset:0; z-index:40;
  background:#000;
  opacity:0.85;
  animation:dimOut 1s ease forwards;
  pointer-events:none;
}
@keyframes dimOut{ to{ opacity:0; } }
.music-btn.playing .music-icon{ animation:pulse 1s ease-in-out infinite; }
`;
document.head.appendChild(style);
