const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const config = window.KIMCHIRO_CONFIG || {};
const db = window.supabase && config.url && config.anonKey ? window.supabase.createClient(config.url, config.anonKey) : null;
let isAdmin = false;
const selectedReports = new Set();
let reviewQueue = [], activeDetailId = null;
let state = { stores: [], pending: [], feedback: [] }, candidates = [], category = '전체', map, markers;

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let toastTimer; function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3300); }
const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const open = selector => { const dialog = $(selector); if (!dialog.open) dialog.showModal(); };
$$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
$$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
function showView(view) { $('#exploreView').hidden = view !== 'explore'; $('#aboutView').hidden = view !== 'about'; $('#labView').hidden = view !== 'lab'; $('#gameView').hidden = view !== 'game'; $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === (view === 'game' ? 'lab' : view))); window.scrollTo(0,0); if (map && view === 'explore') setTimeout(() => map.invalidateSize(), 50); }
const worldcupKimchi = [
  ['배추김치','밥상 위의 든든한 기본'], ['백김치','깔끔하고 시원한 맛'], ['깍두기','아삭하게 씹는 무김치'], ['총각김치','아삭한 알타리의 매력'],
  ['열무김치','여름에 생각나는 산뜻함'], ['열무물김치','시원한 국물 한입'], ['동치미','청량한 무와 국물'], ['나박김치','가볍고 시원한 물김치'],
  ['오이소박이','오이에 속을 꽉 채워'], ['파김치','알싸하고 진한 풍미'], ['갓김치','톡 쏘는 향과 맛'], ['부추김치','향긋하게 즐기는 한입'],
  ['겉절이','갓 버무려 생생하게'], ['묵은지','시간이 만든 깊은 맛'], ['보쌈김치','수육과 함께 떠오르는 맛'], ['석박지','큼직하고 시원한 무'],
  ['얼갈이김치','부드러운 배추의 매력'], ['봄동겉절이','봄동의 고소한 아삭함'], ['고들빼기김치','쌉싸름한 감칠맛'], ['깻잎김치','향긋한 깻잎의 변신'],
  ['고구마줄기김치','오독오독한 줄기 식감'], ['가지김치','부드러운 가지에 양념'], ['고추소박이','아삭하고 칼칼하게'], ['양배추김치','아삭하고 달큰하게'],
  ['대파김치','큼직한 대파의 풍미'], ['무청김치','무청의 구수한 맛'], ['순무김치','단단하고 알싸한 순무'], ['동치미무김치','시원하게 익힌 무'],
  ['돌나물물김치','상큼하고 산뜻한 국물'], ['미나리김치','미나리 향이 가득'], ['수박김치','달콤하고 아삭한 여름 별미'], ['콩나물김치','아삭한 콩나물의 색다른 맛']
];
const isDishGame = location.pathname === '/kimchi-dish-worldcup.html';
const isGamePage = isDishGame || location.pathname === '/worldcup.html';
const gamePath = isDishGame ? '/kimchi-dish-worldcup.html' : '/worldcup.html';
const gameLabel = isDishGame ? '김치요리' : '김치';
const dishWorldcup = [
 ['김치찌개','얼큰하고 깊은 기본의 맛'], ['참치김치찌개','참치가 더한 감칠맛'], ['돼지고기 김치찌개','돼지고기와 푹 끓인 찌개'], ['부대찌개','햄과 김치가 만난 얼큰함'],
 ['김치볶음밥','고슬고슬 볶아낸 한 그릇'], ['치즈김치볶음밥','고소한 치즈가 듬뿍'], ['김치볶음밥 오므라이스','달걀 이불을 덮은 볶음밥'], ['김치전','바삭하고 매콤한 한 장'],
 ['김치치즈전','김치전과 치즈의 조화'], ['김치만두','매콤한 속을 채운 만두'], ['김치만둣국','뜨끈한 국물과 김치만두'], ['김치수제비','쫄깃한 수제비와 얼큰한 국물'],
 ['김치칼국수','칼칼한 국물과 부드러운 면'], ['김치말이국수','시원하게 말아 먹는 국수'], ['김치비빔국수','새콤매콤한 비빔국수'], ['김치우동','우동에 김치를 더한 따뜻함'],
 ['김치라면','라면과 김치의 찰떡궁합'], ['김치라볶이','김치와 라면이 들어간 떡볶이'], ['김치떡볶이','쫄깃한 떡과 매콤한 김치'], ['김치찜','푹 익혀 진해진 김치'],
 ['등갈비 김치찜','등갈비와 묵은지의 만남'], ['김치두루치기','자작하게 볶아 먹는 밥도둑'], ['두부김치','담백한 두부와 볶은 김치'], ['김치제육볶음','매콤한 제육과 김치'],
 ['삼겹살 김치볶음','고소한 삼겹살과 볶은 김치'], ['김치찜닭','닭고기와 김치의 조화'], ['김치찜갈비','부드러운 갈비와 진한 김치'], ['김치볶음우동','탱글한 우동과 볶은 김치'],
 ['김치볶음면','매콤한 볶음면 한 접시'], ['김치주먹밥','한입에 쏙 들어가는 김치밥'], ['김치김밥','김치가 들어간 든든한 김밥'], ['김치치즈토스트','바삭한 빵과 김치, 치즈']
];
if (isDishGame) { $('.lab-heading .eyebrow', $('#gameView')).textContent='KIMCHIRO LAB · 김치요리 이상형 월드컵'; $('.lab-heading h1', $('#gameView')).innerHTML='김치요리 취향, <em>끝까지 골라봐!</em>'; $('.lab-heading p', $('#gameView')).textContent='다양한 김치요리를 두 가지씩 비교하며 나만의 1등을 찾아보세요.'; $('#rankingTitle').textContent='지금 인기 있는 김치요리 🏆'; }
let worldcupRound=[], worldcupWinners=[], worldcupIndex=0, worldcupGameId=null;
const worldcupSaving=new Set();
const cup=$('#worldcup');
function cupGameId() { if (globalThis.crypto?.randomUUID) return crypto.randomUUID(); const a=new Uint8Array(16); if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(a); else for(let i=0;i<16;i++) a[i]=Math.floor(Math.random()*256); a[6]=(a[6]&15)|64; a[8]=(a[8]&63)|128; const h=[...a].map(v=>v.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; }
async function loadCupRankings() {
  const target=$('#cupRanking'); if(!db) { target.textContent='순위를 불러올 수 없어요. 잠시 후 다시 시도해 주세요.'; return; }
  try { const {data,error}=await db.rpc(isDishGame ? 'kimchi_dish_rankings' : 'worldcup_rankings'); if(error) throw error; const total=data.reduce((sum,row)=>sum+Number(row.wins),0); target.innerHTML=total ? `<p class="ranking-total">총 ${total.toLocaleString('ko-KR')}회 우승</p><ol class="ranking-list">${data.slice(0,10).map((row,i)=>`<li><span class="ranking-number">${i+1}</span><strong>${esc(row.winner)}</strong><span>${Number(row.wins).toLocaleString('ko-KR')}회</span></li>`).join('')}</ol>` : '<p class="ranking-empty">아직 우승 결과가 없어요. 첫 번째 주인공을 골라주세요!</p>'; }
  catch (_) { target.textContent='순위를 불러오지 못했어요. 새로고침을 눌러 주세요.'; }
}
async function saveCupResult(gameId,winner) {
  if(worldcupSaving.has(gameId)) return; const status=$('#cupSaveStatus'); if(status) status.textContent='우승 결과를 저장하고 있어요…';
  if(!db) { if(status) status.innerHTML='결과를 저장하지 못했어요. <button type="button" id="cupRetry">다시 시도</button>'; return; }
  worldcupSaving.add(gameId);
  try { const {error}=await db.rpc(isDishGame ? 'submit_kimchi_dish_result' : 'submit_worldcup_result',{p_game_id:gameId,p_winner:winner}); if(error) throw error; if(worldcupGameId===gameId && $('#cupSaveStatus')) $('#cupSaveStatus').textContent='우승 결과가 인기 순위에 반영됐어요!'; await loadCupRankings(); }
  catch (_) { if(worldcupGameId===gameId && $('#cupSaveStatus')) $('#cupSaveStatus').innerHTML='결과를 저장하지 못했어요. <button type="button" id="cupRetry">다시 시도</button>'; }
  finally { worldcupSaving.delete(gameId); }
}
$('#refreshRankings').addEventListener('click',loadCupRankings);

function cupIntro() { cup.innerHTML=`<div class="cup-intro"><div class="cup-icon" aria-hidden="true">🏆</div><span class="cup-badge">김치로 실험실</span><h2>${gameLabel} 이상형 월드컵</h2><p>32가지 ${gameLabel} 중<br>당신의 최애를 골라주세요!</p><button type="button" class="cup-primary" id="cupStart">32강 시작하기 <span aria-hidden="true">↗</span></button></div>`; }
function cupStart() { worldcupGameId=cupGameId(); worldcupRound=[...(isDishGame ? dishWorldcup : worldcupKimchi)]; for(let i=worldcupRound.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [worldcupRound[i],worldcupRound[j]]=[worldcupRound[j],worldcupRound[i]]; } worldcupWinners=[];worldcupIndex=0;cupRender(); }
function cupRender() {
  if (worldcupRound.length===1) { const winner=worldcupRound[0]; cup.innerHTML=`<div class="cup-intro cup-result"><div class="cup-icon" aria-hidden="true">🏆</div><span class="cup-badge">당신의 최애 ${gameLabel}</span><h2>${esc(winner[0])}</h2><p>${esc(winner[1])}<br>32가지 후보 중 당신의 선택을 받았어요!</p><p class="cup-save-status" id="cupSaveStatus" role="status">우승 결과를 저장하고 있어요…</p><button type="button" class="cup-primary" id="cupRestart">다시 하기 ↻</button></div>`; saveCupResult(worldcupGameId,winner[0]); return; }
  const count=worldcupRound.length, match=worldcupIndex/2+1, total=count/2, label=count===2?'결승':`${count}강`;
  const choices=worldcupRound.slice(worldcupIndex,worldcupIndex+2);
  cup.innerHTML=`<div class="cup-status"><div><span class="cup-badge">${label}</span><strong>${match} / ${total}</strong></div><span>마음에 드는 쪽을 골라주세요</span></div><div class="cup-progress" role="progressbar" aria-label="현재 라운드 진행" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${match-1}"><span style="width:${(match-1)/total*100}%"></span></div><div class="cup-versus">${choices.map((item,i)=>`<button type="button" class="cup-choice" data-cup-choice="${i}" aria-label="${esc(item[0])} 선택"><span class="cup-choice-icon" aria-hidden="true">${i===0?'🥬':'🥢'}</span><strong>${esc(item[0])}</strong><small>${esc(item[1])}</small><span class="cup-select">이 ${gameLabel} 선택하기 ↗</span></button>`).join('<span class="cup-vs" aria-hidden="true">VS</span>')}</div><button type="button" class="cup-reset" id="cupRestart">처음부터 다시 하기</button>`;
}
cup.addEventListener('click', e=>{ const choice=e.target.closest('[data-cup-choice]'); if(choice) { worldcupWinners.push(worldcupRound[worldcupIndex+Number(choice.dataset.cupChoice)]);worldcupIndex+=2;if(worldcupIndex===worldcupRound.length){worldcupRound=worldcupWinners;worldcupWinners=[];worldcupIndex=0;}cupRender();return; } if(e.target.closest('#cupRetry') && worldcupRound.length===1) { saveCupResult(worldcupGameId,worldcupRound[0][0]); return; } if(e.target.closest('#cupStart')) cupStart(); if(e.target.closest('#cupRestart')) { if(worldcupRound.length>1 && !confirm('진행 중인 월드컵을 처음부터 다시 시작할까요?')) return; cupStart(); } });
cupIntro();
$$('[data-view]').forEach(b => b.addEventListener('click', () => { const view=b.dataset.view; if(isGamePage) { location.href=view==='lab' ? '/#lab' : view==='about' ? '/#about' : '/'; return; } history.pushState(null, '', view==='lab' ? '/#lab' : view==='about' ? '/#about' : '/'); showView(view); }));
$$('a.brand').forEach(link => link.addEventListener('click', e => { e.preventDefault(); if(isGamePage) { location.href='/'; return; } history.pushState(null, '', '/'); showView('explore'); }));
$$('#reportBtn,#introReport,#footerReport,#mapReport,#closingReport').forEach(b => b.addEventListener('click', () => { $('#reportForm').reset(); $('#reportForm [name=verifiedAt]').value = today(); open('#reportDialog'); }));
$$('.feedback-open').forEach(button => button.addEventListener('click', () => { $('#feedbackForm').reset(); open('#feedbackDialog'); }));
$('#feedbackForm').addEventListener('submit', async e => {
  e.preventDefault(); if (!db) return toast('온라인 저장소가 아직 설정되지 않았어요.');
  const form=e.currentTarget, body=form.elements.body.value.trim(), button=form.querySelector('.submit-button');
  if (!body) { form.elements.body.setCustomValidity('의견 내용을 입력해 주세요.'); form.elements.body.reportValidity(); form.elements.body.setCustomValidity(''); return; }
  button.disabled=true;
  try { const {error}=await db.from('site_feedback').insert({category:form.elements.category.value,body}); if (error) throw error; form.reset(); $('#feedbackDialog').close(); toast('의견을 보내주셔서 감사해요!'); }
  catch (_) { toast('의견을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'); } finally { button.disabled=false; }
});
function openAdmin() { if (!db) return toast('온라인 저장소가 아직 설정되지 않았어요.'); if (!isAdmin) return open('#loginDialog'); renderAdmin(); open('#manageDialog'); }
function routeView() { if(location.hash === '#admin') return; if(isGamePage) { showView('game'); loadCupRankings(); return; } showView(location.hash === '#lab' ? 'lab' : location.hash === '#about' ? 'about' : 'explore'); }
window.addEventListener('hashchange', () => { if(location.hash === '#admin') openAdmin(); else routeView(); });
window.addEventListener('popstate', routeView);
$('#shareGame').addEventListener('click', async () => { const url=new URL(gamePath,location.origin).href; try { await navigator.clipboard.writeText(url); $('#shareGameStatus').textContent='게임 주소를 복사했어요!'; } catch (_) { $('#shareGameStatus').textContent=`주소를 복사해 공유해 주세요: ${url}`; } });
routeView();
$$('.tab').forEach(b => b.addEventListener('click', () => { $$('.tab').forEach(x => x.classList.toggle('active', x === b)); $$('.tab-panel').forEach(x => x.hidden = x.id !== `${b.dataset.tab}Panel`); renderAdmin(); }));
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); showView('explore'); $('#search').focus(); } });
$('#filters').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (!b) return; category = b.dataset.category; $$('.filter').forEach(x => x.classList.toggle('selected', x === b)); render(); });
$('#search').addEventListener('input', render);
function filtered() { const q = $('#search').value.trim().toLowerCase(); return [...state.stores].reverse().filter(s => (category === '전체' || s.category === category) && `${s.name} ${s.address}`.toLowerCase().includes(q)); }
function validCoords(s) { return s.lat !== '' && s.lng !== '' && s.lat != null && s.lng != null && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)) && Number(s.lat) >= 33 && Number(s.lat) <= 39.5 && Number(s.lng) >= 124 && Number(s.lng) <= 132; }
function evidenceLabel(s) { return s.evidence === '기타' ? '원산지 재확인 필요' : s.evidence === '공식 메뉴·안내 확인' ? '공식 안내 기준' : '국산 김치 확인'; }
function render() {
  const items = filtered(); $('#count').textContent = items.length;
  $('#storeList').innerHTML = items.length ? items.map(s => `<article class="store-card" tabindex="0" role="button" data-store="${esc(s.id)}"><div class="store-card-top"><h3>${esc(s.name)}</h3><span class="pill">${esc(evidenceLabel(s))}</span></div><p>${esc(s.address)}</p><div class="store-meta"><span><img class="kimchi-icon" src="assets/kimchi-icon.webp" alt="" aria-hidden="true"> ${esc(s.evidence)}</span><span>${esc(s.category)}</span><span>${esc(s.verifiedAt)} 확인</span></div></article>`).join('') : `<div class="empty-list"><div class="empty-icon">⌖</div><b>${state.stores.length ? '검색 결과가 없어요' : '첫 번째 김치 가게를 기다려요'}</b>${state.stores.length ? '다른 검색어나 필터를 선택해 보세요.' : '확인한 가게를 등록하면<br>이곳에 차곡차곡 모여요.'}</div>`;
  if (markers) { markers.clearLayers(); items.filter(validCoords).forEach(s => { const marker = L.marker([Number(s.lat), Number(s.lng)], {icon:L.divIcon({className:'kimchi-marker',html:'<div style="background:#df4e39;color:white;border:3px solid white;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);width:31px;height:31px;box-shadow:0 2px 6px #0004"><span style="display:block;transform:rotate(45deg);text-align:center;font-size:17px"><img class="kimchi-icon" src="assets/kimchi-icon.webp" alt="" aria-hidden="true"></span></div>',iconSize:[31,31],iconAnchor:[4,31]}),title:s.name,alt:s.name}); marker.on('click', () => details(s.id)); marker.addTo(markers); }); }
  renderAdmin();
}
$('#storeList').addEventListener('click', e => { const card = e.target.closest('[data-store]'); if (card) details(card.dataset.store); });
$('#storeList').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const card = e.target.closest('[data-store]'); if (card) { e.preventDefault(); details(card.dataset.store); } } });
function safePhotoUrl(value) { try { const url=new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch (_) { return ''; } }
function reviewPhoto(value) { return typeof value === 'string' && value.length <= 100000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : ''; }
async function prepareReviewPhoto(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('사진은 JPG, PNG, WEBP 형식으로 올려주세요.');
  if (file.size > 8 * 1024 * 1024) throw new Error('사진은 8MB 이하로 올려주세요.');
  const objectUrl=URL.createObjectURL(file), image=new Image();
  try {
    await new Promise((resolve,reject) => { image.onload=resolve; image.onerror=()=>reject(new Error('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.')); image.src=objectUrl; });
    const width=image.naturalWidth, height=image.naturalHeight; if(!width || !height) throw new Error('사진을 읽지 못했어요.');
    let scale=Math.min(1, 960/Math.max(width,height)); const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
    if(!ctx) throw new Error('이 기기에서는 사진을 처리할 수 없어요.');
    for(let attempt=0;attempt<7;attempt++) { canvas.width=Math.max(1,Math.round(width*scale)); canvas.height=Math.max(1,Math.round(height*scale)); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,0,0,canvas.width,canvas.height); for(const quality of [.82,.68,.54,.4]) { const result=canvas.toDataURL('image/jpeg',quality); if(reviewPhoto(result)) return result; } scale*=.75; }
    throw new Error('사진을 줄이지 못했어요. 다른 사진을 선택해 주세요.');
  } finally { URL.revokeObjectURL(objectUrl); }
}
function renderStorePhoto(store, reviews=[]) {
  const target=$('#storePhoto'); if(!target) return;
  const review=reviews.find(r=>reviewPhoto(r.photo_data)), externalPhoto=safePhotoUrl(store.photoUrl), photo=externalPhoto || (review ? reviewPhoto(review.photo_data) : '');
  const search='https://search.naver.com/search.naver?where=image&query='+encodeURIComponent(`${store.name} ${store.address} 음식`);
  const source=safePhotoUrl(store.photoSource), license=safePhotoUrl(store.photoLicenseUrl);
  const credit=externalPhoto && source && license ? `사진: <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(store.photoAuthor || '원본 출처')}</a> · <a href="${esc(license)}" target="_blank" rel="noopener noreferrer">${esc(store.photoLicense || '이용 조건')}</a>` : review ? '이용자가 올린 리뷰 사진' : '가게 음식 사진';
  target.innerHTML=photo ? `<figure class="store-photo${externalPhoto ? ' store-photo-external' : ''}"><img src="${esc(photo)}" alt="${esc(store.name)} 음식 사진" loading="lazy" referrerpolicy="no-referrer"><figcaption>${credit}</figcaption></figure>` : `<div class="store-photo-empty">📷 <span>아직 리뷰 사진이 없어요.<br><a href="${esc(search)}" target="_blank" rel="noopener noreferrer">네이버에서 사진 찾아보기 ↗</a></span></div>`;
  const image=$('img',target); if(image) image.addEventListener('error',()=>{ target.innerHTML=`<div class="store-photo-empty">📷 <span>사진을 불러오지 못했어요.<br><a href="${esc(search)}" target="_blank" rel="noopener noreferrer">네이버에서 사진 찾아보기 ↗</a></span></div>`; },{once:true});
}
async function details(storeId) {
  const s = state.stores.find(x => x.id === storeId); if (!s) return;
  activeDetailId = storeId;
  $('#detailContent').innerHTML = `<div class="modal-head"><div><span class="eyebrow">KIMCHI SPOT</span><h2 class="detail-title">${esc(s.name)}</h2><p class="detail-address">${esc(s.address)}</p></div><button class="close" data-detail-close aria-label="닫기">×</button></div><div id="storePhoto"></div><span class="pill">${esc(evidenceLabel(s))}</span><div class="detail-box"><div><b>업종</b>${esc(s.category)}</div><div><b>확인 방법</b>${esc(s.evidence)}</div><div><b>확인일</b>${esc(s.verifiedAt)}</div></div><p class="detail-note">${esc(s.note)}</p><p class="form-help">원산지는 변경될 수 있으니 방문 전 가게에 확인해 주세요.</p><a class="source-link" target="_blank" rel="noopener" href="https://map.kakao.com/link/search/${encodeURIComponent(s.name + ' ' + s.address)}">카카오맵에서 찾아보기 ↗</a><section class="reviews"><h3>방문 리뷰</h3><div id="reviewList" aria-live="polite">리뷰를 불러오는 중이에요.</div><form id="reviewForm"><label>이름 또는 별명 <b>*</b><input name="nickname" maxlength="40" required></label><label>별점 <b>*</b><select name="rating" required><option value="">선택해 주세요</option><option value="5">★★★★★ 5점</option><option value="4">★★★★☆ 4점</option><option value="3">★★★☆☆ 3점</option><option value="2">★★☆☆☆ 2점</option><option value="1">★☆☆☆☆ 1점</option></select></label><label>리뷰 <b>*</b><textarea name="body" maxlength="1000" required placeholder="방문 경험을 알려주세요."></textarea></label><label>음식 사진 <small>(선택)</small><input type="file" id="reviewPhotoInput" accept="image/jpeg,image/png,image/webp"></label><p class="form-help">직접 찍었거나 올릴 권한이 있는 사진만 등록해 주세요. 사진은 리뷰와 함께 공개돼요. JPG·PNG·WEBP, 8MB 이하.</p><p class="form-help">리뷰는 누구나 볼 수 있어요. 개인정보는 적지 말아 주세요.</p><button class="submit-button">리뷰 작성하기 <span>↗</span></button></form></section>`;
  renderStorePhoto(s);
  $('[data-detail-close]').onclick = () => $('#detailDialog').close(); open('#detailDialog');
  $('#reviewForm').addEventListener('submit', async e => {
    e.preventDefault(); if (!db) return toast('온라인 저장소가 아직 설정되지 않았어요.');
    const form = e.currentTarget, button = $('.submit-button', form), data = Object.fromEntries(new FormData(form));
    const nickname = data.nickname.trim(), body = data.body.trim(), rating = Number(data.rating);
    if (!nickname || !body || !Number.isInteger(rating) || rating < 1 || rating > 5) return toast('별명, 별점과 리뷰 내용을 확인해 주세요.');
    button.disabled = true;
    try { const file=$('#reviewPhotoInput',form).files[0]; const photo_data=file ? await prepareReviewPhoto(file) : null; const {error} = await db.from('reviews').insert({store_id:storeId,nickname,body,rating,photo_data}); if (error) throw error; form.reset(); toast('리뷰를 등록했어요.'); await loadReviews(storeId); }
    catch (error) { toast(error instanceof Error && error.message ? error.message : '리뷰를 등록하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
    finally { button.disabled = false; }
  });
  await loadReviews(storeId);
}
async function loadReviews(storeId) {
  if (!db) { $('#reviewList').textContent = '리뷰를 불러올 수 없어요.'; return; }
  const {data, error} = await db.from('reviews').select('id,nickname,rating,body,created_at,photo_data').eq('store_id',storeId).order('created_at',{ascending:false}).limit(100);
  if (activeDetailId !== storeId || !$('#detailDialog').open) return;
  if (error) { $('#reviewList').textContent = '리뷰를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'; return; }
  const store=state.stores.find(x=>x.id===storeId); if(store) renderStorePhoto(store,data);
  $('#reviewList').innerHTML = data.length ? data.map(r => `<article class="review-item"><div><b>${esc(r.nickname)}</b> <span class="review-stars" aria-label="${r.rating}점">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span> <small>${esc(new Date(r.created_at).toLocaleDateString('ko-KR'))}</small></div><p>${esc(r.body)}</p>${reviewPhoto(r.photo_data) ? `<img class="review-photo" src="${esc(reviewPhoto(r.photo_data))}" alt="${esc(r.nickname)}님의 리뷰 사진" loading="lazy">` : ''}${isAdmin ? `<button type="button" class="outline-button" data-delete-review="${esc(r.id)}">리뷰 삭제</button>` : ''}</article>`).join('') : '<p class="form-help">아직 리뷰가 없어요. 첫 리뷰를 남겨 주세요.</p>';
}
$('#detailDialog').addEventListener('close', () => { activeDetailId = null; });
$('#detailContent').addEventListener('click', async e => {
  const reviewId = e.target.dataset.deleteReview; if (!reviewId || !isAdmin || !confirm('이 리뷰를 삭제할까요?')) return;
  const storeId = activeDetailId; const {error} = await db.from('reviews').delete().eq('id',reviewId);
  if (error) return toast('리뷰를 삭제하지 못했어요.'); toast('리뷰를 삭제했어요.'); await loadReviews(storeId);
});
$('#reportForm').addEventListener('submit', async e => { e.preventDefault(); if (!e.target.elements.namedItem('address').value.trim()) { toast('주소 찾기에서 가게 주소를 선택해 주세요.'); $('.address-search', e.target).focus(); return; } if (!db) return toast('온라인 저장소가 아직 설정되지 않았어요.'); const button=e.target.querySelector('button[type=submit], .submit-button'); button.disabled=true; try { const data=Object.fromEntries(new FormData(e.target)); const {error}=await db.from('reports').insert({data}); if(error) throw error; e.target.reset(); $('#reportDialog').close(); toast('제보를 보냈어요. 확인 후 지도에 반영됩니다.'); } catch(_) {toast('제보를 보내지 못했어요. 잠시 후 다시 시도해 주세요.');} finally {button.disabled=false;} });
function edit(data = {}) { const form = $('#editForm'); form.reset(); for (const [key,value] of Object.entries(data)) { const field = form.elements.namedItem(key); if (field) field.value = value ?? ''; } if (!form.elements.verifiedAt.value) form.elements.verifiedAt.value = today(); open('#editDialog'); }
$('#manualAdd').addEventListener('click', () => edit());
// Kakao's address finder works inside the form, including in mobile webviews.
for (const form of [$('#reportForm'), $('#editForm')]) {
  const input = form.elements.namedItem('address');
  const picker = $('.address-picker', form);
  const frame = $('.postcode-frame', picker);
  const search = $('.address-search', form);
  const closePicker = () => { picker.hidden = true; frame.replaceChildren(); search.setAttribute('aria-expanded', 'false'); };
  search.setAttribute('aria-expanded', 'false');
  if (form.id === 'reportForm') {
    input.addEventListener('click', () => { if (picker.hidden) search.click(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (picker.hidden) search.click(); } });
  }
  $('.address-close', picker).addEventListener('click', closePicker);
  search.addEventListener('click', () => {
    if (!picker.hidden) { closePicker(); return; }
    if (!window.kakao?.Postcode) { toast(form.id === 'reportForm' ? '주소 검색을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : '주소 검색을 불러오지 못했어요. 직접 입력해 주세요.'); input.focus(); return; }
    picker.hidden = false;
    search.setAttribute('aria-expanded', 'true');
    try {
      new window.kakao.Postcode({ width: '100%', height: '100%', maxSuggestItems: 5, oncomplete(data) {
        const address = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
        input.value = address || data.address || '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        closePicker();
        input.focus();
        if (form.id === 'editForm' && input.value) $('#geocode').click();
      }}).embed(frame, {q: input.value.trim()});
    } catch (_) { closePicker(); toast('주소 검색을 열지 못했어요. 직접 입력해 주세요.'); }
  });
  form.closest('dialog').addEventListener('close', closePicker);
}
$('#editDialog').addEventListener('cancel', () => { reviewQueue = []; });
$('#editDialog [data-close]').addEventListener('click', () => { reviewQueue = []; });
$('#editForm [name=address]').addEventListener('input', () => {
  $('#editForm [name=lat]').value = '';
  $('#editForm [name=lng]').value = '';
});
$('#editForm').addEventListener('submit', async e => { e.preventDefault(); if (!db || !isAdmin) return toast('운영자 로그인이 필요해요.'); const d=Object.fromEntries(new FormData(e.target)); if ((d.lat || d.lng) && !validCoords(d)) return toast('대한민국 범위의 위도와 경도를 모두 확인해 주세요.'); const button=e.target.querySelector('.submit-button'); button.disabled=true; try { const existing=d.id ? state.stores.find(s => s.id === d.id) : null; const entry={...(existing || {}),...d,lat:d.lat.trim(),lng:d.lng.trim()}; delete entry.id; delete entry.pendingId; let error; if(d.pendingId) ({error}=await db.rpc('approve_report',{report_id:d.pendingId,store_data:entry})); else if(d.id) ({error}=await db.from('stores').update({data:entry}).eq('id',d.id)); else ({error}=await db.from('stores').insert({data:entry})); if(error) throw error; await loadData(); selectedReports.delete(d.pendingId); $('#editDialog').close(); if (reviewQueue.length) { renderAdmin(); nextReview(); } else { renderAdmin(); toast('확인한 가게가 등록되었어요.'); } } catch(_) {toast('등록하지 못했어요. 로그인과 연결 상태를 확인해 주세요.');} finally {button.disabled=false;} });
$('#geocode').addEventListener('click', async e => { const address = $('#editForm [name=address]').value.trim(); if (!address) return toast('먼저 가게 주소를 입력해 주세요.'); e.target.disabled = true; e.target.textContent = '위치를 찾고 있어요…'; try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(address)}`); if (!response.ok) throw Error(); const [result] = await response.json(); if (address !== $('#editForm [name=address]').value.trim()) return; if (!result) { toast('위치를 찾지 못했어요. 좌표를 직접 입력해 주세요.'); return; } $('#editForm [name=lat]').value = result.lat; $('#editForm [name=lng]').value = result.lon; toast('좌표를 찾았어요. 실제 위치와 일치하는지 확인해 주세요.'); } catch (_) { toast('위치 검색을 사용할 수 없어요. 좌표를 직접 입력해 주세요.'); } finally { e.target.disabled = false; e.target.textContent = '주소로 위치 찾기 ◎'; } });
function renderAdmin() {
  const ids = new Set(state.pending.map(s => s.id));
  for (const selected of selectedReports) if (!ids.has(selected)) selectedReports.delete(selected);
  $('#pendingCount').textContent = state.pending.length || '';
  $('#pendingList').innerHTML = state.pending.length ? [...state.pending].reverse().map(s => `<div class="admin-item"><label class="report-check"><input type="checkbox" data-select-report="${esc(s.id)}" ${selectedReports.has(s.id) ? 'checked' : ''} aria-label="${esc(s.name)} 선택"></label><div><b>${esc(s.name)}</b><small>${esc(s.address)}<br>${esc(s.evidence)} · ${esc(s.verifiedAt)}<br>${esc(s.note)}</small></div><button data-review="${esc(s.id)}">검토·등록</button><button class="delete" data-reject="${esc(s.id)}">삭제</button></div>`).join('') : '<div class="empty-admin">아직 접수된 제보가 없어요.</div>';
  $('#selectedReports').textContent = `${selectedReports.size}개 선택`;
  $('#reviewSelected').disabled = $('#deleteSelected').disabled = !selectedReports.size;
  $('#selectAllReports').disabled = !state.pending.length;
  $('#clearReports').disabled = !selectedReports.size;
  $('#feedbackCount').textContent = state.feedback.filter(f => !f.reviewed).length || '';
  $('#feedbackList').innerHTML = state.feedback.length ? [...state.feedback].reverse().map(f => `<div class="admin-item feedback-item"><div><b>${esc(f.category)} · ${f.reviewed ? '검토 완료' : '미검토'}</b><small>${esc(new Date(f.created_at).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'}))}</small><p>${esc(f.body)}</p></div><button type="button" data-feedback-toggle="${esc(f.id)}">${f.reviewed ? '미검토로' : '검토 완료'}</button><button type="button" class="delete" data-feedback-delete="${esc(f.id)}">삭제</button></div>`).join('') : '<div class="empty-admin">아직 접수된 의견이 없어요.</div>';
  $('#savedList').innerHTML = state.stores.length ? [...state.stores].reverse().map(s => `<div class="admin-item"><div><b>${esc(s.name)}</b><small>${esc(s.address)} · ${esc(s.verifiedAt)} 확인</small></div><button data-edit="${esc(s.id)}">수정</button><button class="delete" data-delete="${esc(s.id)}">삭제</button></div>`).join('') : '<div class="empty-admin">아직 등록된 가게가 없어요.</div>';
  renderCandidates();
}
$('#pendingList').addEventListener('change', e => { const checkbox=e.target.closest('[data-select-report]'); if (!checkbox) return; if (checkbox.checked) selectedReports.add(checkbox.dataset.selectReport); else selectedReports.delete(checkbox.dataset.selectReport); renderAdmin(); });
$('#selectAllReports').addEventListener('click', () => { state.pending.forEach(s => selectedReports.add(s.id)); renderAdmin(); });
$('#clearReports').addEventListener('click', () => { selectedReports.clear(); renderAdmin(); });
function nextReview() { while (reviewQueue.length) { const reportId = reviewQueue.shift(), s = state.pending.find(x => x.id === reportId); if (s) { edit({...s,id:'',pendingId:s.id}); return; } } toast('선택한 제보 검토를 마쳤어요.'); }
$('#reviewSelected').addEventListener('click', () => { reviewQueue = [...state.pending].reverse().filter(s => selectedReports.has(s.id)).map(s => s.id); if (reviewQueue.length) nextReview(); });
$('#deleteSelected').addEventListener('click', async e => {
  const ids = [...selectedReports]; if (!ids.length || !confirm(`선택한 제보 ${ids.length}개를 삭제할까요?`)) return;
  e.currentTarget.disabled=true;
  try { const {error}=await db.from('reports').delete().in('id',ids); if(error) throw error; selectedReports.clear(); await loadData(); toast('선택한 제보를 삭제했어요.'); }
  catch (_) { toast('제보를 삭제하지 못했어요.'); } finally { renderAdmin(); }
});
$('#pendingList').addEventListener('click', async e => { const review=e.target.dataset.review, reject=e.target.dataset.reject; if(review) { reviewQueue=[]; const s=state.pending.find(x=>x.id===review); if(s) edit({...s,id:'',pendingId:s.id});} if(reject && confirm('이 제보를 삭제할까요?')) {const {error}=await db.from('reports').delete().eq('id',reject); if(error) return toast('삭제하지 못했어요.'); await loadData();} });
$('#feedbackList').addEventListener('click', async e => {
  const toggle=e.target.dataset.feedbackToggle, remove=e.target.dataset.feedbackDelete;
  if (!isAdmin || (!toggle && !remove)) return;
  if (remove && !confirm('이 의견을 삭제할까요?')) return;
  e.target.disabled=true;
  try {
    let result;
    if (toggle) { const item=state.feedback.find(f => f.id===toggle); if (!item) return; result=await db.from('site_feedback').update({reviewed:!item.reviewed}).eq('id',toggle); }
    else result=await db.from('site_feedback').delete().eq('id',remove);
    if (result.error) throw result.error;
    await loadData(); toast(remove ? '의견을 삭제했어요.' : '검토 상태를 변경했어요.');
  } catch (_) { toast('처리하지 못했어요. 잠시 후 다시 시도해 주세요.'); } finally { e.target.disabled=false; }
});
$('#savedList').addEventListener('click', async e => { const editId=e.target.dataset.edit, deleteId=e.target.dataset.delete; if(editId) {const s=state.stores.find(x=>x.id===editId); if(s) edit(s);} if(deleteId && confirm('이 가게를 삭제할까요?')) {const {error}=await db.from('stores').delete().eq('id',deleteId); if(error) return toast('삭제하지 못했어요.'); await loadData();} });
function parseCSV(text) { const rows=[]; let row=[], field='', quoted=false; for (let i=0;i<text.length;i++) { const c=text[i]; if (quoted) { if (c==='"' && text[i+1]==='"') { field+='"'; i++; } else if (c==='"') quoted=false; else field+=c; } else if(c==='"') quoted=true; else if(c===',') {row.push(field);field='';} else if(c==='\n'||c==='\r') {if(c==='\r'&&text[i+1]==='\n') i++;row.push(field);field='';if(row.some(v=>v.trim())) rows.push(row);row=[];} else field+=c; } if (field || row.length) {row.push(field);rows.push(row);} return rows; }
$('#csvFile').addEventListener('change', async e => { const file=e.target.files[0]; if (!file) return; try { const buf=await file.arrayBuffer(); let text=new TextDecoder('utf-8').decode(buf); if ((text.match(/�/g)||[]).length > 2) text=new TextDecoder('euc-kr').decode(buf); const rows=parseCSV(text); if (!rows.length) throw Error('빈 파일이에요.'); const headers=rows.shift().map(s=>s.replace(/^\ufeff/,'').trim().replace(/\s/g,'')); const find=(...names)=>headers.findIndex(h=>names.includes(h)); const ni=find('사업장명','업소명','상호명','가게명'), ai=find('도로명전체주소','도로명주소','소재지도로명주소'), ji=find('소재지전체주소','소재지주소','지번주소'), si=find('상세영업상태명','영업상태명','영업상태'); if (ni<0 || (ai<0 && ji<0)) throw Error('사업장명과 주소 열을 찾지 못했어요. 일반음식점 인허가 CSV를 확인해 주세요.'); candidates=rows.filter(r=>r[ni] && (r[ai] || r[ji]) && (si<0 || !r[si] || /영업|정상/.test(r[si]))).map(r=>({name:r[ni].trim(),address:(r[ai]||r[ji]).trim(),category:'한식'})); $('#candidateSearch').value=''; renderCandidates(); toast(`${candidates.length.toLocaleString()}개 가게를 불러왔어요. 이름이나 주소로 검색하세요.`); } catch(err) { toast(err.message || 'CSV 파일을 읽지 못했어요.'); } e.target.value=''; });
function renderCandidates() { const q=$('#candidateSearch').value.trim().toLowerCase(); if (!candidates.length) { $('#candidateList').innerHTML='<div class="empty-admin">파일을 가져오면 가게를 검색할 수 있어요.</div>'; return; } if (!q) { $('#candidateList').innerHTML=`<div class="empty-admin">${candidates.length.toLocaleString()}개 가게를 불러왔어요.<br>이름이나 주소를 입력해 검색하세요.</div>`; return; } const found=[]; for (let i=0;i<candidates.length;i++) {const s=candidates[i]; if(`${s.name} ${s.address}`.toLowerCase().includes(q)) {found.push({...s,index:i}); if(found.length===50) break;}} $('#candidateList').innerHTML=found.length ? found.map(s=>`<div class="admin-item"><div><b>${esc(s.name)}</b><small>${esc(s.address)}</small></div><button data-candidate="${s.index}">선택</button></div>`).join('')+'<p class="form-help">검색 결과는 최대 50개까지 표시됩니다.</p>' : '<div class="empty-admin">검색 결과가 없어요.</div>'; }
$('#candidateSearch').addEventListener('input', renderCandidates);
$('#candidateList').addEventListener('click', e => { if(e.target.dataset.candidate !== undefined) edit(candidates[Number(e.target.dataset.candidate)]); });
$('#exportBtn').addEventListener('click', () => { const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`kimchiro-backup-${today()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); });

if (window.L) { map=L.map('map',{zoomControl:false}).setView([37.5665,126.9780],11); L.control.zoom({position:'topright'}).addTo(map); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map); markers=L.layerGroup().addTo(map); } else $('#mapFallback').classList.add('show');
let mapTouched = false;
if (map) map.on('dragstart zoomstart', e => { if (e.originalEvent) mapTouched = true; });
if (map) ['pointerdown', 'wheel', 'keydown'].forEach(event => map.getContainer().addEventListener(event, () => { mapTouched = true; }, {passive:true}));
function locate(automatic = false) {
  if (!map || !navigator.geolocation) { if (!automatic) toast('현재 위치를 사용할 수 없어요.'); return; }
  if (!automatic) mapTouched = true;
  navigator.geolocation.getCurrentPosition(p => { if (!automatic || !mapTouched) map.setView([p.coords.latitude,p.coords.longitude],14); }, () => { if (!automatic) toast('위치 권한을 확인해 주세요.'); }, {timeout:10000, maximumAge:300000});
}
$('#locate').addEventListener('click', () => locate());
locate(true);
render();
async function loadData() {
  if (!db) { $('#connectionBanner').textContent='온라인 저장소가 아직 설정되지 않았어요.'; return; }
  try {
    const adminResult = await db.rpc('is_admin');
    isAdmin = !adminResult.error && adminResult.data === true;
    async function allRows(table, columns='id,data') { const rows=[]; for(let offset=0;;offset+=1000) { const result=await db.from(table).select(columns).order('created_at').order('id').range(offset,offset+999); if(result.error) throw result.error; rows.push(...result.data); if(result.data.length<1000) return rows; } }
    state.stores = (await allRows('stores')).map(row => ({...row.data,id:row.id}));
    state.pending = [];
    state.feedback = [];
    if (isAdmin) { state.pending = (await allRows('reports')).map(row => ({...row.data,id:row.id})); state.feedback = await allRows('site_feedback', 'id,category,body,reviewed,created_at'); }
    $('#connectionBanner').hidden = true;
    render();
  } catch (_) { $('#connectionBanner').hidden=false; $('#connectionBanner').textContent='가게 정보를 불러오지 못했어요. 연결 상태를 확인해 주세요.'; }
}
$('#loginForm').addEventListener('submit', async e => { e.preventDefault(); if(!db) return; const button=e.target.querySelector('.submit-button'); button.disabled=true; try { const data=Object.fromEntries(new FormData(e.target)); const {error}=await db.auth.signInWithPassword(data); if(error) { toast('이메일과 비밀번호를 확인해 주세요.'); return; } await loadData(); if(!isAdmin) { await db.auth.signOut(); toast('로그인했지만 운영자 권한이 연결되지 않았어요.'); return; } e.target.reset(); $('#loginDialog').close(); renderAdmin(); open('#manageDialog'); } catch(_) {toast('로그인하지 못했어요. 연결 상태를 확인해 주세요.');} finally {button.disabled=false;} });
$('#logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); isAdmin=false; state.pending=[]; state.feedback=[]; selectedReports.clear(); reviewQueue=[]; $('#manageDialog').close(); render(); toast('로그아웃했어요.'); });
loadData().then(() => { if (location.hash === '#admin') openAdmin(); });

