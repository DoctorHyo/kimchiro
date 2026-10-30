const game = document.querySelector('#game');
const badge = document.querySelector('#stage-badge');
const counter = document.querySelector('#stage-count');
const steps = [...document.querySelectorAll('[data-step]')];
const flavours = {mild:{name:'순한맛',title:'다정한 김장왕',description:'부드러운 맛으로 온 동네를 사로잡는 김치!'},balanced:{name:'딱 좋은 맛',title:'황금손 김장왕',description:'알맞게 버무린 나만의 밥도둑 김치!'},hot:{name:'매운맛',title:'화끈한 김장왕',description:'매콤한 양념으로 입맛을 깨우는 김치!'}};
let stage = 'intro', progress = 0, flavour = 'balanced';
let drag = null, suppressClickUntil = 0;
const image = (name, alt) => `<img class="game-illustration" src="assets/kimjang-${name}.webp" alt="${alt}">`;
function header(active, label, count) {
  badge.textContent = label; counter.textContent = count;
  steps.forEach((step, i) => { step.classList.toggle('active', i === active); step.classList.toggle('done', i < active); });
}
function intro() {
  stage='intro'; progress=0; flavour='balanced'; header(-1,'KIMJANG TIME','준비 완료?');
  game.innerHTML=`<div class="intro-screen"><div class="art intro-art">${image('cabbage','싱싱한 배추')}</div><div class="copy"><span class="small-label">한 포기 도전!</span><h2 id="game-title">우리 같이<br><em>김장해볼까요?</em></h2><p>배추를 절이고, 헹구고,<br>좋아하는 양념으로 정성껏 버무려요.</p><button class="primary" data-action="start">김장 시작하기 <span>↗</span></button><small>약 1분 · 누구나 쉽게</small></div></div>`;
}
function task(kind) {
  stage=kind; progress=0;
  const config = kind==='salt' ? {active:0,badge:'STEP 01',title:'배추를 절여요!',description:'배추 위를 문질러 소금을 골고루 뿌려주세요.',img:'cabbage',alt:'배추에 소금을 뿌리는 중',goal:6,button:'소금 뿌리기'} : kind==='rinse' ? {active:1,badge:'STEP 02',title:'깨끗하게 헹궈요!',description:'절인 배추 위를 문질러 깨끗하게 헹궈주세요.',img:'cabbage',alt:'절인 배추를 헹구는 중',goal:3,button:'배추 헹구기'} : {active:2,badge:'STEP 03',title:'양념을 버무려요!',description:`${flavours[flavour].name} 양념을 배추에 골고루 발라주세요.`,img:'cabbage',alt:'양념을 바를 배추',goal:10,button:'양념 버무리기'};
  header(config.active,config.badge,'0 / '+config.goal);
  const finished = kind==='mix' ? '<span class="seasoned-layer" aria-hidden="true"></span>' : '';
  game.innerHTML=`<div class="play-screen"><div class="play-copy"><h2 id="game-title">${config.title}</h2><p>${config.description}</p></div><div class="stage-wrap"><span class="stage-tool" aria-hidden="true">${kind==='salt'?'🧂':kind==='rinse'?'💧':'🥣'}</span><button class="art art-button stage-${kind}" data-action="tap" aria-label="${config.button}">${image(config.img,config.alt)}${finished}<span class="effects" aria-hidden="true"></span><span class="tap-hint">쓱쓱! ✦</span></button></div><div class="meter"><div class="meter-line"><strong>${config.button}</strong><span id="meter-count">0 / ${config.goal}</span></div><div class="track" role="progressbar" aria-label="${config.button} 진행" aria-valuemin="0" aria-valuemax="${config.goal}" aria-valuenow="0"><span id="meter-fill"></span></div></div><button class="primary action" data-action="tap">${config.button} <span>↗</span></button><p class="tip">배추 위를 문지르거나 톡톡 눌러주세요</p></div>`;
}
function choose() {
  stage='choose'; header(2,'STEP 03','양념 선택');
  game.innerHTML=`<div class="choose-screen"><div class="art choose-art">${image('seasoning','김치 양념 그릇')}</div><h2 id="game-title">어떤 맛으로 만들까요?</h2><p>오늘의 기분에 맞게 양념을 골라주세요.</p><div class="flavour-options" aria-label="김치 맛 선택"><button data-flavour="mild"><b>🌱 순한맛</b><small>부드럽게</small></button><button data-flavour="balanced"><b>🥬 딱 좋은 맛</b><small>적당하게</small></button><button data-flavour="hot"><b>🌶️ 매운맛</b><small>화끈하게</small></button></div></div>`;
}
function result() {
  stage='result'; const result=flavours[flavour]; header(3,'KIMJANG COMPLETE','완성!');
  game.innerHTML=`<div class="result-screen"><span class="small-label">정성 한가득 · ${result.name}</span><h2 id="game-title">축하해요!<br><em>${result.title}</em> 탄생 🎉</h2><p>${result.description}</p><div class="art result-art">${image('finished','완성된 배추김치')}</div><div class="result-actions"><button class="primary" data-action="share">친구에게 게임 공유하기 ↗</button><button class="secondary" data-action="restart">한 번 더 김장하기 ↻</button></div><p class="share-status" role="status"></p><a class="map-link" href="/">국산 김치 식당이 궁금하다면? 김치로 지도 보러 가기 ↗</a></div>`;
}
function addEffects(art, x, y) {
  const layer=art.querySelector('.effects');
  const symbols=stage==='salt'?['✦','·','✧']:stage==='rinse'?['💧','⋆','✦']:['✦','●','✧'];
  for(let i=0;i<5;i++) {
    const particle=document.createElement('span'); particle.className=`particle particle-${stage}`;
    particle.textContent=symbols[i%symbols.length]; particle.style.left=`${x}%`; particle.style.top=`${y}%`;
    particle.style.setProperty('--dx',`${Math.round((Math.random()-.5)*85)}px`);
    particle.style.setProperty('--dy',`${Math.round(-25-Math.random()*65)}px`);
    layer.appendChild(particle); setTimeout(()=>particle.remove(),800);
  }
}
function advance(x=50,y=50) {
  if(!['salt','rinse','mix'].includes(stage)) return;
  const goal=stage==='salt'?6:stage==='rinse'?3:10;
  const art=game.querySelector('.art-button');
  progress=Math.min(progress+1,goal); counter.textContent=`${progress} / ${goal}`;
  game.querySelector('#meter-count').textContent=`${progress} / ${goal}`;
  game.querySelector('#meter-fill').style.width=`${progress / goal * 100}%`;
  game.querySelector('[role=progressbar]').setAttribute('aria-valuenow',progress);
  const seasoned=art.querySelector('.seasoned-layer'); if(seasoned) seasoned.style.opacity=String(progress / goal * .62);
  addEffects(art,x,y); art.classList.remove('bounce'); void art.offsetWidth; art.classList.add('bounce');
  if(progress===goal) { if(stage==='salt') task('rinse'); else if(stage==='rinse') choose(); else result(); }
}
game.addEventListener('pointerdown',e=>{
  const art=e.target.closest('.art-button'); if(!art || e.button!==0) return;
  drag={id:e.pointerId,art,x:e.clientX,y:e.clientY,distance:0,moved:false,stage};
  art.setPointerCapture(e.pointerId);
});
game.addEventListener('pointermove',e=>{
  if(!drag || drag.id!==e.pointerId || drag.stage!==stage) return;
  drag.distance+=Math.hypot(e.clientX-drag.x,e.clientY-drag.y); drag.x=e.clientX; drag.y=e.clientY;
  if(drag.distance<32) return;
  drag.moved=true; drag.distance=0; suppressClickUntil=performance.now()+500;
  const rect=drag.art.getBoundingClientRect();
  const x=Math.max(8,Math.min(92,(e.clientX-rect.left)/rect.width*100));
  const y=Math.max(8,Math.min(92,(e.clientY-rect.top)/rect.height*100));
  advance(x,y);
});
game.addEventListener('pointerup',e=>{ if(drag?.id===e.pointerId) { if(drag.moved) suppressClickUntil=performance.now()+500; drag=null; } });
game.addEventListener('pointercancel',e=>{ if(drag?.id===e.pointerId) drag=null; });
game.addEventListener('click', async e => {
  const selected=e.target.closest('[data-flavour]');
  if (selected) { flavour=selected.dataset.flavour; task('mix'); return; }
  const target=e.target.closest('[data-action]'); if (!target) return;
  const action=target.dataset.action;
  if(action==='start') { task('salt'); return; }
  if(action==='restart') { intro(); return; }
  if(action==='share') {
    const url=new URL('/kimjang.html', location.origin).href;
    const status=game.querySelector('.share-status');
    if (navigator.share) { try { await navigator.share({title:'오늘은 내가 김장왕!',text:'나랑 같이 김장왕 도전해볼래?',url}); return; } catch(e) { if(e.name==='AbortError') return; } }
    try { await navigator.clipboard.writeText(url); status.textContent='게임 주소를 복사했어요!'; } catch { status.textContent=`이 주소를 복사해 공유해 주세요: ${url}`; } return;
  }
  if(action!=='tap') return;
  if(target.classList.contains('art-button') && e.detail!==0 && performance.now()<suppressClickUntil) return;
  advance();
});
intro();

