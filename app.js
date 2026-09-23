/*
 * 申论八股操练
 * 纯前端 / IndexedDB / Service Worker / 无框架
 */

const DB_NAME = 'shenlunEightfoldDB';
const DB_VERSION = 1;
const STORE_CORPUS = 'corpus';
const STORE_DAILY = 'daily';
const STORE_QUESTIONS = 'questions';
const STORE_META = 'meta';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const DEFAULT_CORPUS = {
  templates: [
    { id: 't1', category: 'templates', group: '核心结构', text: '以__为__，__（动词/效果）__', parts: ['以', '__', '为', '__', '，', '__'], enabled: true },
    { id: 't2', category: 'templates', group: '核心结构', text: '坚持__，__（动词/效果）__', parts: ['坚持', '__', '，', '__'], enabled: true },
    { id: 't3', category: 'templates', group: '核心结构', text: '__（动词）__，__（动词）__', parts: ['__', '，', '__'], enabled: true }
  ],
  metaphors: [
    ...['旗','旗帜','纲','纲领','魂','本','舵','灯塔','罗盘','北斗星','定盘星','压舱石'].map((text,i)=>({id:`m-root-${i}`,category:'metaphors',group:'根本',text})),
    ...['引擎','发动机','动力源','源头活水','点火器','助推器'].map((text,i)=>({id:`m-power-${i}`,category:'metaphors',group:'动力',text})),
    ...['总开关','牛鼻子','主抓手','金钥匙','突破口','杠杆','支点','牵引绳','先手棋','当头炮','敲门砖'].map((text,i)=>({id:`m-method-${i}`,category:'metaphors',group:'方法抓手',text})),
    ...['指挥棒','风向标','试金石','标尺','刻度尺','红绿灯','硬杠杠','生命线','警戒线','底线'].map((text,i)=>({id:`m-standard-${i}`,category:'metaphors',group:'尺度标准',text}))
  ],
  verbs: [
    ...['谱写','绘就','擘画','引领','开创','开辟','奏响','举起','扬起','把稳'].map((text,i)=>({id:`v-open-${i}`,category:'verbs',group:'开创类',text})),
    ...['驱动','推动','助推','促进','深化','推进','加快','加速','激发','激活','释放'].map((text,i)=>({id:`v-power-${i}`,category:'verbs',group:'动力类',text})),
    ...['构建','打造','建设','筑牢','夯实','巩固','织密','健全','完善','铺就'].map((text,i)=>({id:`v-build-${i}`,category:'verbs',group:'巩固类',text})),
    ...['提升','提高','迈向','走向','实现','夺取','赢得','增进','促进'].map((text,i)=>({id:`v-goal-${i}`,category:'verbs',group:'目标类',text})),
    ...['攻克','破解','破除','化解','打通','清除','祛除','啃下'].map((text,i)=>({id:`v-solve-${i}`,category:'verbs',group:'攻克类',text})),
    ...['凝聚','汇集','汇聚','团结','形成','绘就'].map((text,i)=>({id:`v-gather-${i}`,category:'verbs',group:'汇集类',text}))
  ],
  effects: [
    ...['新篇章','新画卷','新格局','新境界','新辉煌','新胜利','新纪元','新征程','伟大飞跃','时代华章','壮丽篇章'].map((text,i)=>({id:`e-grand-${i}`,category:'effects',group:'宏大叙事',text})),
    ...['四梁八柱','坚实屏障','牢固根基','钢铁长城','防护网','安全网','同心圆','共同体','新生态','新体系'].map((text,i)=>({id:`e-system-${i}`,category:'effects',group:'体系建构',text})),
    ...['新高度','新水平','高品质','高质量','幸福底色','温暖底色','靓丽名片','美好家园','宜居之城','碧水蓝天','青山绿水'].map((text,i)=>({id:`e-quality-${i}`,category:'effects',group:'品质提升',text})),
    ...['磅礴力量','澎湃动能','生机活力','新气象','新风貌','活力源泉','动力引擎'].map((text,i)=>({id:`e-energy-${i}`,category:'effects',group:'动能激发',text})),
    ...['顽瘴痼疾','瓶颈制约','风险挑战','最后一公里'].map((text,i)=>({id:`e-solve-${i}`,category:'effects',group:'难题破解',text}))
  ],
  topics: [
    ...['党建','思想','理论','信仰','初心','使命','政治建设','基层组织','从严治党','反腐败','作风建设','自我革命','斗争精神','担当作为','政治站位','大局意识','看齐意识','党建引领','组织建设','干部队伍'].map((text,i)=>({id:`p-politics-${i}`,category:'topics',group:'政治与党建',text})),
    ...['科技','创新','人才','数字经济','实体经济','高质量发展','产业升级','营商环境','乡村振兴','共同富裕','新质生产力','制造业','产业链','供应链','民营经济','营商环境','对外开放','区域协调','新型城镇化','粮食安全'].map((text,i)=>({id:`p-economy-${i}`,category:'topics',group:'经济与发展',text})),
    ...['文化','文化自信','精神文明','传统文化','核心价值观','民生','基层治理','社会治理','公共服务','教育','医疗','就业','社会保障','养老','托育','住房','食品安全','安全生产','防灾减灾','社区治理','网格化','志愿服务','慈善事业','网络空间','清朗行动','全民健身','健康中国','立德树人'].map((text,i)=>({id:`p-social-${i}`,category:'topics',group:'文化与社会',text})),
    ...['生态','绿色发展','环境保护','低碳生活','美丽中国','法治','制度','改革','机制','监督','生态文明','碳达峰碳中和','污染防治','生物多样性','法治政府','司法公正','依法行政','普法宣传','基层法治','社会治理现代化'].map((text,i)=>({id:`p-law-${i}`,category:'topics',group:'生态与法治',text})),
    ...['群众','青年','实干','担当','作风','纪律','底线思维','系统观念','问题导向','目标导向','结果导向','精准施策','协同发力','共建共治共享','全过程人民民主','国家安全','应急管理','数字政府','放管服','统一战线','民族团结','边疆治理'].map((text,i)=>({id:`p-general-${i}`,category:'topics',group:'其他通用',text}))
  ]
};

const CATEGORY_LABELS = {
  templates: '句式库',
  verbs: '动词库',
  metaphors: '比喻词库',
  effects: '效果库',
  topics: '主题词库'
};

const state = {
  page: 'today',
  corpusTab: 'templates',
  corpus: [],
  meta: { xp: 0, theme: 'light', session: null },
  daily: [],
  questions: [],
  practice: null,
  practiceTimer: null,
  dragging: null
};

function uid(prefix='id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
function sample(arr, n) {
  const copy = [...arr];
  for (let i=copy.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
function shuffle(arr) { return sample(arr, arr.length); }
function todayKey(date = new Date()) {
  const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,'0'); const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function formatDateTime(ts) { return new Date(ts).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
function escapeHTML(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function formatSeconds(s) { const n = Math.max(0, Math.round(s)); return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`; }
function rankForXP(xp) {
  if (xp >= 1600) return {name:'钻石', next:null};
  if (xp >= 800) return {name:'黄金', next:1600};
  if (xp >= 300) return {name:'白银', next:800};
  return {name:'青铜', next:300};
}

function openDB() {
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CORPUS)) db.createObjectStore(STORE_CORPUS, {keyPath:'id'});
      if (!db.objectStoreNames.contains(STORE_DAILY)) db.createObjectStore(STORE_DAILY, {keyPath:'date'});
      if (!db.objectStoreNames.contains(STORE_QUESTIONS)) db.createObjectStore(STORE_QUESTIONS, {keyPath:'id'});
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, {keyPath:'key'});
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readonly'); const req = tx.objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function idbGet(store,key) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{ const req=db.transaction(store,'readonly').objectStore(store).get(key); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); });
}
async function idbPut(store,value) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{ const req=db.transaction(store,'readwrite').objectStore(store).put(value); req.onsuccess=()=>resolve(); req.onerror=()=>reject(req.error); });
}
async function idbDelete(store,key) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{ const req=db.transaction(store,'readwrite').objectStore(store).delete(key); req.onsuccess=()=>resolve(); req.onerror=()=>reject(req.error); });
}
async function idbClear(store) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{ const req=db.transaction(store,'readwrite').objectStore(store).clear(); req.onsuccess=()=>resolve(); req.onerror=()=>reject(req.error); });
}
async function idbBulkPut(store, values) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite'); const os=tx.objectStore(store);
    values.forEach(v=>os.put(v));
    tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
  });
}

async function seedIfNeeded() {
  const existing = await idbGetAll(STORE_CORPUS);
  if (existing.length) return;
  const all = Object.values(DEFAULT_CORPUS).flat();
  await idbBulkPut(STORE_CORPUS, all);
}

async function loadAll() {
  state.corpus = await idbGetAll(STORE_CORPUS);
  state.daily = await idbGetAll(STORE_DAILY);
  state.questions = await idbGetAll(STORE_QUESTIONS);
  const meta = await idbGet(STORE_META,'app');
  if (meta) state.meta = {...state.meta, ...meta.value};
}
async function saveMeta() { await idbPut(STORE_META, {key:'app', value: state.meta}); }

function applyTheme() {
  document.documentElement.dataset.theme = state.meta.theme || 'light';
  $('meta[name="theme-color"]').setAttribute('content', state.meta.theme === 'dark' ? '#101116' : '#f6f7fb');
}

function corpus(category) { return state.corpus.filter(x=>x.category===category); }
function pickTemplate() { return sample(corpus('templates').filter(x=>x.enabled!==false), 1)[0]; }
function makePool(samples, topics) {
  const tokens = [];
  const push = (kind, arr) => arr.forEach(x => tokens.push({id: uid(kind), kind, text: x.text}));
  push('verb', samples.verbs);
  push('metaphor', samples.metaphors);
  push('effect', samples.effects);
  push('topic', topics);
  return shuffle(tokens);
}
function getSampleCounts(template) {
  if (template?.id === 't1') return {verbs:6, metaphors:8, effects:8};
  if (template?.id === 't2') return {verbs:8, metaphors:5, effects:8};
  return {verbs:10, metaphors:4, effects:8};
}
function createQuestion(prev = null, reroll = {}) {
  const templates = corpus('templates').filter(x=>x.enabled!==false);
  if (!templates.length) throw new Error('没有可用句式，请在语料库中恢复或新增句式。');
  const template = prev?.template || pickTemplate();
  const counts = getSampleCounts(template);
  const allVerbs = corpus('verbs'); const allMetas = corpus('metaphors'); const allEffects = corpus('effects'); const allTopics = corpus('topics');
  const topics = reroll.topics ? sample(allTopics,3) : (prev?.topics || sample(allTopics,3));
  const samples = {
    verbs: reroll.verbs ? sample(allVerbs, counts.verbs) : (prev?.samples?.verbs || sample(allVerbs, counts.verbs)),
    metaphors: reroll.metaphors ? sample(allMetas, counts.metaphors) : (prev?.samples?.metaphors || sample(allMetas, counts.metaphors)),
    effects: reroll.effects ? sample(allEffects, counts.effects) : (prev?.samples?.effects || sample(allEffects, counts.effects))
  };
  return {
    template,
    topics,
    samples,
    pool: makePool(samples, topics),
    placed: Array.from({length: template.parts.filter(p=>p==='__').length + 1}, ()=>[]),
    startedAt: Date.now(),
    common: []
  };
}

function requiredSlots(question) {
  return question.template.parts.filter(p=>p==='__').length;
}
function totalPlaced(q) { return q.placed.reduce((n,a)=>n+a.length,0); }
function allSlotsFilled(q) { return q.placed.every(a => Array.isArray(a) && a.length > 0); }
function totalSlots(q) { return requiredSlots(q); }
function nextBlank(q) {
  const n = totalSlots(q);
  for (let i=0;i<n;i++) if (!q.placed[i]?.length) return i;
  return null;
}
function usedTokenIds(q) { return new Set(q.placed.flat().map(x=>x.id)); }
function tokenFromPool(q,id) { return q.pool.find(x=>x.id===id); }
function removeFromArray(arr,id) { return arr.filter(x=>x.id!==id); }

function buildPracticeHTML() {
  const p = state.practice;
  if (!p) {
    return `<div class="page"><div class="hero-card card"><div class="page-title">开始操练</div><div class="page-subtitle">每题 60 秒。无正误判断，只练标题与分论点的句式肌肉。</div><div class="col" style="margin-top:12px"><div class="stat-grid"><div class="stat-card"><div class="stat-value">20</div><div class="stat-label">一局题数</div></div><div class="stat-card"><div class="stat-value">60s</div><div class="stat-label">每题限时</div></div><div class="stat-card"><div class="stat-value">3❤</div><div class="stat-label">一局生命</div></div><div class="stat-card"><div class="stat-value">∞</div><div class="stat-label">通用语块</div></div></div><button id="startPractice" class="btn primary btn-block">开始 20 题</button></div></div></div>`;
  }
  const q = p.question;
  const elapsed = Math.min(60, Math.floor((Date.now()-q.startedAt)/1000));
  const remaining = Math.max(0,60-elapsed);
  const percent = ((p.index + (remaining<60? (elapsed/60):0))/20)*100;
  return `<div class="page practice-page">
    <div class="practice-head card tight">
      <div class="row row-between"><span class="question-count">第 ${p.index+1} / 20 题</span><span class="template-badge">${escapeHTML(q.template.id)} · ${escapeHTML(q.template.text)}</span></div>
      <div class="timer-row"><div id="timer" class="timer ${remaining<=10?'danger':''}">${formatSeconds(remaining)}</div><div id="lifeRow" class="life-row" aria-label="生命值">${'❤'.repeat(p.hearts)}${'♡'.repeat(Math.max(0,3-p.hearts))}</div></div>
      <div class="progress-track"><div class="progress-fill" style="width:${Math.max(0,Math.min(100,percent))}%"></div></div>
      <div class="row row-between small"><span>连击：<strong>${p.combo}</strong></span><span>本局 XP：<strong>${p.roundXP}</strong></span></div>
    </div>

    <div class="sentence-list">
      ${q.template.parts.reduce((out,part,i)=>{
        if(i===0) out.push({type:'static',text:'',slotIndex:-1});
        return out;
      }, []) ? renderSentenceBuilders(q) : ''}
    </div>

    <div class="pool card">
      <div class="row row-between"><div><div class="section-title">语块池</div><div class="muted tiny">只包含本题抽中的 3 个主题词；点选语块填入空位。</div></div><span class="badge">${q.topics.map(t=>escapeHTML(t.text)).join(' · ')}</span></div>
      <div id="poolGrid" class="pool-grid">${renderPool(q)}</div>
      <div class="divider"></div>
      <div class="section-title">通用语块 NPC</div>
      <div class="muted tiny">临时语块不限量，只在当前题有效；可添加“的 / 和 / 更 / 彰显”等。</div>
      <div class="common-box"><input id="commonInput" class="input" placeholder="输入自定义语块" maxlength="30"><button id="addCommon" class="btn primary">添加</button></div>
    </div>

    <div class="action-bar">
      <button id="rerollBtn" class="btn ghost">重新出题</button>
      <button id="completeBtn" class="btn primary" ${!allSlotsFilled(q)?'disabled':''}>完成本句</button>
      <button id="abandonBtn" class="btn danger">放弃本题</button>
    </div>
  </div>`;
}

function renderSentenceBuilders(q) {
  const slots = q.template.parts.filter(p=>p==='__').length;
  let slotNo = 0;
  const content = q.template.parts.map(part=>{
    if(part!=='__') return `<span class="static-text">${escapeHTML(part)}</span>`;
    const idx = slotNo++;
    const chips = (q.placed[idx]||[]).map(tok=>`<span class="sentence-chip" draggable="true" data-place-id="${tok.id}" data-slot="${idx}">${escapeHTML(tok.text)}</span>`).join('');
    return `<div class="blank ${chips?'active':''}" data-slot="${idx}">${chips || `<span class="placeholder">点选语块</span>`}</div>`;
  }).join('');
  return `<div class="sentence-card"><div class="sentence-label">分论点 1</div><div class="sentence-builder" data-sentence="0">${content}</div></div>
  <div class="sentence-card"><div class="sentence-label">分论点 2</div><div class="sentence-builder" data-sentence="1">${content.replaceAll('data-slot="0"','data-slot="99"').replaceAll('data-slot="1"','data-slot="98"')}</div></div>
  <div class="sentence-card"><div class="sentence-label">分论点 3</div><div class="sentence-builder" data-sentence="2">${content.replaceAll('data-slot="0"','data-slot="97"').replaceAll('data-slot="1"','data-slot="96"')}</div></div>`;
}

/* 上面的模板展示需要 3 句话，每句话都用同一个句式。这里重做为独立 slot 数组：每题共 9 个槽，分别属于 3 个分论点。 */
function getSentenceSlotCount(q) { return q.template.parts.filter(p=>p==='__').length; }
function renderOneSentence(q, sentenceIndex) {
  const slotCount = getSentenceSlotCount(q);
  let slot = sentenceIndex*slotCount;
  return q.template.parts.map(part=>{
    if(part!=='__') return `<span class="static-text">${escapeHTML(part)}</span>`;
    const idx = slot++;
    const chips = (q.placed[idx]||[]).map(tok=>`<span class="sentence-chip" draggable="true" data-place-id="${tok.id}" data-slot="${idx}">${escapeHTML(tok.text)}</span>`).join('');
    return `<div class="blank ${chips?'active':''}" data-slot="${idx}">${chips || `<span class="placeholder">点选语块</span>`}</div>`;
  }).join('');
}
function renderSentenceBuildersFixed(q) {
  return [0,1,2].map(i=>`<div class="sentence-card"><div class="sentence-label">分论点 ${i+1}</div><div class="sentence-builder" data-sentence="${i}">${renderOneSentence(q,i)}</div></div>`).join('');
}

function renderPool(q) {
  const used = usedTokenIds(q);
  const all = q.pool.filter(x=>!used.has(x.id));
  if (!all.length) return `<div class="empty small">语块已全部使用</div>`;
  return all.map(tok=>`<button class="chip ${tok.kind}" data-pool-id="${tok.id}">${escapeHTML(tok.text)}</button>`).join('');
}

function renderPractice() {
  // buildPracticeHTML 的 sentence-list 使用固定三句版本
  const html = buildPracticeHTML().replace('${q.template.parts.reduce((out,part,i)=>{', '${q.template.parts.reduce((out,part,i)=>{');
  $('#main').innerHTML = state.practice ? buildPracticeHTML().replace(/<div class="sentence-list">[\s\S]*?<\/div>\n\n    <div class="pool card">/, `<div class="sentence-list">${renderSentenceBuildersFixed(state.practice.question)}</div>\n\n    <div class="pool card">`) : buildPracticeHTML();
  $('#topStats').hidden = !state.practice;
  updateTopStats();
  bindPractice();
}

function updateTopStats(){
  const p=state.practice;
  if(!p){ $('#topStats').hidden=true; return; }
  $('#heartPill').textContent = `❤ ${p.hearts}`;
  $('#xpPill').textContent = `XP ${state.meta.xp}`;
  $('#comboPill').textContent = `🔥 ${p.combo}`;
}

function bindPractice(){
  $('#startPractice')?.addEventListener('click', startRound);
  $('#rerollBtn')?.addEventListener('click', openRerollModal);
  $('#completeBtn')?.addEventListener('click', completeQuestion);
  $('#abandonBtn')?.addEventListener('click', abandonQuestion);
  $('#addCommon')?.addEventListener('click', addCommonBlock);
  $('#commonInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter') addCommonBlock(); });

  $$('.pool .chip').forEach(btn=>btn.addEventListener('click',()=>usePoolToken(btn.dataset.poolId)));
  $$('.blank').forEach(b=>b.addEventListener('click',()=>{ $('.blank.active', b.parentElement)?.classList.remove('active'); b.classList.add('active'); state.practice.activeSlot = Number(b.dataset.slot); }));
  $$('.sentence-chip').forEach(bindDragChip);
  $$('.blank').forEach(bindDropZone);
}

function activeSlot(){
  const p=state.practice; if(!p) return null;
  if(Number.isInteger(p.activeSlot) && p.activeSlot < p.question.placed.length) return p.activeSlot;
  return nextBlank(p.question);
}
function usePoolToken(id){
  const p=state.practice; if(!p) return;
  const tok = tokenFromPool(p.question,id); if(!tok) return;
  let idx = activeSlot();
  if(idx===null){ showToast('空位已经填满，可拖动调整顺序或点击已填语块取消。'); return; }
  // 若点击的是一个非首空位之前，允许按当前激活位置放置。
  p.question.placed[idx].push(tok);
  p.activeSlot = nextBlank(p.question);
  persistSession();
  renderPractice();
}
function removePlacedToken(id){
  const p=state.practice; if(!p) return;
  for(let i=0;i<p.question.placed.length;i++){
    const pos=p.question.placed[i].findIndex(x=>x.id===id);
    if(pos>=0){ p.question.placed[i].splice(pos,1); p.activeSlot=i; break; }
  }
  persistSession(); renderPractice();
}
function addCommonBlock(){
  const input=$('#commonInput'); if(!input) return;
  const text=input.value.trim(); if(!text) return;
  const tok={id:uid('common'),kind:'common',text};
  const p=state.practice;
  p.question.pool.push(tok);
  p.question.common.push(tok);
  input.value='';
  persistSession(); renderPractice();
}

function bindDragChip(chip){
  chip.addEventListener('click',()=>{ if(!state.dragging?.moved) removePlacedToken(chip.dataset.placeId); });
  chip.addEventListener('pointerdown', e=>startPointerDrag(e,chip));
  chip.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', chip.dataset.placeId); });
}
function bindDropZone(zone){
  zone.addEventListener('dragover', e=>e.preventDefault());
  zone.addEventListener('drop', e=>{ e.preventDefault(); const id=e.dataTransfer.getData('text/plain'); if(id) reorderPlaced(id, Number(zone.dataset.slot)); });
}
function startPointerDrag(e,chip){
  if(e.pointerType==='mouse' && e.button!==0) return;
  const id=chip.dataset.placeId;
  let moved=false, timer=null, active=false;
  const startX=e.clientX,startY=e.clientY;
  const cleanup=()=>{
    clearTimeout(timer); window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); state.dragging=null; chip.classList.remove('dragging');
  };
  const move=(ev)=>{
    if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>8) moved=true;
    if(!active) return;
    ev.preventDefault();
    const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.blank');
    if(target) target.classList.add('active');
  };
  const up=(ev)=>{
    if(active){ const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.blank'); if(target) reorderPlaced(id,Number(target.dataset.slot)); }
    else if(!moved) removePlacedToken(id);
    cleanup();
  };
  timer=setTimeout(()=>{active=true; state.dragging={moved:false}; chip.classList.add('dragging');},260);
  window.addEventListener('pointermove',move,{passive:false}); window.addEventListener('pointerup',up,{once:false});
}
function reorderPlaced(id,targetSlot){
  const p=state.practice; if(!p) return;
  let token=null, from=-1, pos=-1;
  for(let i=0;i<p.question.placed.length;i++){ const ix=p.question.placed[i].findIndex(x=>x.id===id); if(ix>=0){token=p.question.placed[i][ix]; from=i; pos=ix; break;} }
  if(!token) return;
  p.question.placed[from].splice(pos,1);
  targetSlot=Math.max(0,Math.min(targetSlot,p.question.placed.length-1));
  p.question.placed[targetSlot].push(token);
  p.activeSlot=targetSlot;
  persistSession(); renderPractice();
}

function startRound({makeupTarget=null}={}){
  if(corpus('topics').length<3 || corpus('verbs').length===0 || corpus('effects').length===0 || corpus('metaphors').length===0 || corpus('templates').length===0){
    showToast('语料库不完整：至少需要 3 个主题词，以及句式、动词、比喻、效果各 1 个。'); return;
  }
  state.practice={roundId:uid('round'),index:0,hearts:3,combo:0,roundXP:0,startedRoundAt:Date.now(),makeupTarget,answers:[],question:createQuestion(),activeSlot:0};
  persistSession(); renderPractice(); startTimer();
}
function persistSession(){
  if(!state.practice){ state.meta.session=null; saveMeta(); return; }
  state.meta.session=structuredClone(state.practice); saveMeta();
}
async function restoreSession(){
  if(!state.meta.session) return;
  state.practice=state.meta.session;
  // 防止序列化后出现旧题计时异常；startedAt 保持真实持续计时
  const elapsed=(Date.now()-state.practice.question.startedAt)/1000;
  if(elapsed>=60){ await handleTimeout(true); }
  else { renderPractice(); startTimer(); }
}
function startTimer(){
  clearInterval(state.practiceTimer);
  state.practiceTimer=setInterval(()=>{
    if(!state.practice){ clearInterval(state.practiceTimer); return; }
    const q=state.practice.question; const remaining=Math.max(0,60-Math.floor((Date.now()-q.startedAt)/1000));
    const timer=$('#timer'); if(timer){timer.textContent=formatSeconds(remaining); timer.classList.toggle('danger',remaining<=10);}
    if(remaining<=0) handleTimeout();
  },250);
}

async function completeQuestion(){
  const p=state.practice; if(!p) return;
  if(totalPlaced(p.question)!==totalSlots(p.question)){ showToast('先把三个分论点的空位填满。'); return; }
  const elapsed=Math.min(60,Math.floor((Date.now()-p.question.startedAt)/1000));
  const remaining=Math.max(0,60-elapsed);
  const speedBonus=Math.floor(remaining/10)*5;
  const baseXP=20; const gained=baseXP+speedBonus;
  if(remaining>0) p.combo+=1; else p.combo=0;
  p.roundXP+=gained; state.meta.xp+=gained;
  const record={
    id:uid('q'), date:todayKey(), ts:Date.now(), roundId:p.roundId, questionIndex:p.index+1,
    status:'completed', elapsed, xp:gained, combo:p.combo,
    template:p.question.template, topics:p.question.topics, sentences:buildPlainSentences(p.question)
  };
  state.questions.push(record); await idbPut(STORE_QUESTIONS,record);
  p.answers.push(record);
  if(p.index===19){ await finishRound(); return; }
  p.index+=1; p.question=createQuestion(); p.activeSlot=0;
  await saveMeta(); persistSession(); renderPractice(); startTimer();
}
function buildPlainSentences(q){
  const slotCount=getSentenceSlotCount(q);
  return [0,1,2].map(i=>{
    let s=''; let slot=i*slotCount;
    q.template.parts.forEach(part=>{ if(part==='__') s += (q.placed[slot++]||[]).map(t=>t.text).join(''); else s += part; });
    return s;
  });
}

async function handleTimeout(restoring=false){
  const p=state.practice; if(!p) return;
  clearInterval(state.practiceTimer);
  const q=p.question;
  const elapsed=60;
  const record={id:uid('q'),date:todayKey(),ts:Date.now(),roundId:p.roundId,questionIndex:p.index+1,status:'timeout',elapsed,xp:0,combo:0,template:q.template,topics:q.topics,sentences:buildPlainSentences(q)};
  p.answers.push(record); state.questions.push(record); await idbPut(STORE_QUESTIONS,record);
  p.combo=0; p.hearts-=1;
  if(p.hearts<=0){ state.practice=null; state.meta.session=null; await saveMeta(); renderPractice(); showGameOver(); return; }
  p.index=Math.min(19,p.index+1); p.question=createQuestion(); p.activeSlot=0; persistSession(); renderPractice(); startTimer();
  if(!restoring) showToast(`超时：生命 -1，连击清零，还剩 ${p.hearts} 颗心。`);
}

async function abandonQuestion(){
  const p=state.practice; if(!p) return;
  const yes=confirm('确定放弃本题吗？连击会清零并进入下一题。');
  if(!yes) return;
  clearInterval(state.practiceTimer);
  const elapsed=Math.min(60,Math.floor((Date.now()-p.question.startedAt)/1000));
  const q=p.question;
  const record={id:uid('q'),date:todayKey(),ts:Date.now(),roundId:p.roundId,questionIndex:p.index+1,status:'abandoned',elapsed,xp:0,combo:0,template:q.template,topics:q.topics,sentences:buildPlainSentences(q)};
  p.answers.push(record); state.questions.push(record); await idbPut(STORE_QUESTIONS,record);
  p.combo=0;
  if(p.index===19){ p.index=0; p.question=createQuestion(); } else { p.index+=1; p.question=createQuestion(); }
  p.activeSlot=0; persistSession(); renderPractice(); startTimer(); showToast('本题已放弃，连击清零。');
}

async function finishRound(){
  clearInterval(state.practiceTimer);
  const p=state.practice;
  const actualTarget=p.makeupTarget || todayKey();
  const existing=await idbGet(STORE_DAILY,actualTarget);
  const dailyRecord={
    date:actualTarget,
    checkIn:true,
    completedAt:Date.now(),
    actualPracticeDate:todayKey(),
    answers:p.answers,
    xp:p.roundXP,
    roundId:p.roundId
  };
  await idbPut(STORE_DAILY,dailyRecord);
  state.daily=state.daily.filter(d=>d.date!==actualTarget); state.daily.push(dailyRecord);
  state.practice=null; state.meta.session=null; await saveMeta();
  renderPractice(); renderPage('today');
  openResultModal(p.roundXP, p.answers, actualTarget, Boolean(p.makeupTarget));
}

function showGameOver(){
  openModal(`<div class="modal"><h3>生命耗尽</h3><p class="page-subtitle">这一局从头开始。已有答题记录会保存在本地。</p><div class="stat-grid"><div class="stat-card"><div class="stat-value">${state.meta.xp}</div><div class="stat-label">累计 XP</div></div><div class="stat-card"><div class="stat-value">${rankForXP(state.meta.xp).name}</div><div class="stat-label">当前段位</div></div></div><div class="modal-actions"><button class="btn ghost" data-close-modal>回到练习</button><button class="btn primary" id="restartRound">重新开始</button></div></div>`);
  $('#restartRound')?.addEventListener('click',()=>{closeModal();startRound();});
}

function openResultModal(xp,answers,date,isMakeup){
  const completed=answers.filter(a=>a.status==='completed').length;
  const avg=answers.length?Math.round(answers.reduce((s,a)=>s+a.elapsed,0)/answers.length):0;
  openModal(`<div class="modal"><h3>${isMakeup?'补签完成':'今日打卡完成'} 🎉</h3><p class="page-subtitle">${date} · ${isMakeup?'额外练习 1 局，已补签':'已完成 20 题并自动打卡'}</p><div class="stat-grid"><div class="stat-card"><div class="stat-value">+${xp}</div><div class="stat-label">本局 XP</div></div><div class="stat-card"><div class="stat-value">${completed}</div><div class="stat-label">完成题数</div></div><div class="stat-card"><div class="stat-value">${avg}s</div><div class="stat-label">平均单题</div></div><div class="stat-card"><div class="stat-value">${rankForXP(state.meta.xp).name}</div><div class="stat-label">当前段位</div></div></div><div class="modal-actions"><button class="btn primary" data-close-modal>查看今日</button><button class="btn ghost" id="goStats">去统计</button></div></div>`);
  $('#goStats')?.addEventListener('click',()=>{closeModal();renderPage('stats');});
}

function openRerollModal(){
  openModal(`<div class="modal"><h3>重新出题</h3><p class="page-subtitle">默认全部重新抽取。未勾选的模块沿用当前题。</p>${[['topics','主题词'],['verbs','动词库'],['metaphors','比喻词库'],['effects','效果库']].map(([k,l])=>`<label class="check-row"><span>${l}</span><input type="checkbox" data-reroll="${k}" checked></label>`).join('')}<div class="modal-actions"><button class="btn ghost" data-close-modal>取消</button><button class="btn primary" id="confirmReroll">确认，计时重置</button></div></div>`);
  $('#confirmReroll')?.addEventListener('click',async()=>{
    const keys=$$('[data-reroll]', $('#modalRoot')).filter(x=>x.checked).map(x=>x.dataset.reroll);
    const reroll={}; keys.forEach(k=>reroll[k]=true);
    const p=state.practice; p.question=createQuestion(p.question,reroll); p.activeSlot=0;
    closeModal(); persistSession(); renderPractice(); startTimer(); showToast('已重新出题，计时重置为 60 秒。');
  });
}

function renderToday(){
  const today=todayKey(); const rec=state.daily.find(x=>x.date===today); const streak=getStreaks();
  const rank=rankForXP(state.meta.xp);
  $('#main').innerHTML=`<div class="page">
    <div class="hero-card card">
      <div class="row row-between"><div><div class="page-title">${rec?'今日已打卡':'今天还没打卡'}</div><div class="page-subtitle">${rec?'20题完成。今天写过的三句分论点，也在这里留着。':'完成一局 20 题即可自动打卡。'}</div></div><div class="check-icon">${rec?'✅':'☀️'}</div></div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="todayPractice">${rec?'再练一局':'开始今天的练习'}</button>${getMakeupCandidates().length?'<button class="btn ghost" id="makeupBtn">补签</button>':''}</div>
    </div>
    <div class="stat-grid"><div class="stat-card"><div class="stat-value">${streak.current}</div><div class="stat-label">当前连续天数</div></div><div class="stat-card"><div class="stat-value">${streak.longest}</div><div class="stat-label">最长连续天数</div></div><div class="stat-card"><div class="stat-value">${state.meta.xp}</div><div class="stat-label">累计经验</div></div><div class="stat-card"><div class="stat-value">${rank.name}</div><div class="stat-label">当前段位</div></div></div>
    ${rec?renderDailyReview(rec):''}
    ${renderMonthHeatmap()}
  </div>`;
  $('#todayPractice').addEventListener('click',()=>startRound());
  $('#makeupBtn')?.addEventListener('click',openMakeupModal);
}
function renderDailyReview(rec){
  const answers=rec.answers||[];
  return `<div class="card"><div class="row row-between"><div class="section-title">${rec.date} · 今日写作回看</div><span class="badge">${answers.length} 题</span></div><div class="review-list" style="margin-top:9px">${answers.filter(a=>a.status==='completed').map((a,i)=>`<div class="review-item"><div class="review-meta">第 ${a.questionIndex} 题 · ${a.elapsed}s · +${a.xp} XP · ${a.template.text}</div><div class="review-meta">主题词：${a.topics.map(t=>escapeHTML(t.text)).join(' / ')}</div>${a.sentences.map((s,j)=>`<div class="review-line">${j+1}. ${escapeHTML(s)}</div>`).join('')}</div>`).join('') || '<div class="empty">这一天还没有完成题目的文本记录。</div>'}</div></div>`;
}
function getStreaks(){
  const done=new Set(state.daily.filter(d=>d.checkIn).map(d=>d.date)); const today=new Date(); let cur=0; let cursor=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  while(done.has(todayKey(cursor))){cur++;cursor.setDate(cursor.getDate()-1);} 
  let longest=0,run=0,last=null;
  [...done].sort().forEach(date=>{ if(!last){run=1;} else {const d1=new Date(last),d2=new Date(date); const diff=Math.round((d2-d1)/86400000); run=diff===1?run+1:1;} longest=Math.max(longest,run); last=date; });
  return {current:cur,longest};
}
function renderMonthHeatmap(){
  const now=new Date(); const y=now.getFullYear(),m=now.getMonth(); const first=new Date(y,m,1); const days=new Date(y,m+1,0).getDate(); const byDay={};
  state.questions.forEach(q=>{ if(q.date?.startsWith(`${y}-${String(m+1).padStart(2,'0')}-`)) byDay[q.date]=(byDay[q.date]||0)+1; });
  let html='<div class="card"><div class="row row-between"><div class="section-title">本月练习热力图</div><span class="badge">题数</span></div><div class="heatmap" style="margin-top:10px">';
  ['一','二','三','四','五','六','日'].forEach(w=>html+=`<div class="heat-head">${w}</div>`);
  const mondayIndex=(first.getDay()+6)%7; for(let i=0;i<mondayIndex;i++) html+='<div class="heat-cell empty"></div>';
  for(let d=1;d<=days;d++){ const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const n=byDay[key]||0; const lv=n===0?'':n<5?'lv1':n<10?'lv2':n<20?'lv3':'lv4'; html+=`<div class="heat-cell ${lv}" title="${key}：${n} 题">${d}</div>`; }
  html+='</div></div>'; return html;
}

function renderStats(){
  const completed=state.questions.filter(q=>q.status==='completed'); const avg=completed.length?Math.round(completed.reduce((s,q)=>s+q.elapsed,0)/completed.length):0; const fastest=completed.length?Math.min(...completed.map(q=>q.elapsed)):0; const rank=rankForXP(state.meta.xp); const streak=getStreaks();
  $('#main').innerHTML=`<div class="page"><div class="hero-card card"><div class="page-title">统计</div><div class="page-subtitle">本地累计数据，随时可以在设置里导出。</div></div><div class="stat-grid"><div class="stat-card"><div class="stat-value">${avg||'—'}${avg?'s':''}</div><div class="stat-label">平均单题用时</div></div><div class="stat-card"><div class="stat-value">${fastest?fastest+'s':'—'}</div><div class="stat-label">最快记录</div></div><div class="stat-card"><div class="stat-value">${state.meta.xp}</div><div class="stat-label">总经验值</div></div><div class="stat-card"><div class="stat-value">${rank.name}</div><div class="stat-label">段位 · 连续 ${streak.current} 天</div></div></div>${rank.next?`<div class="card"><div class="row row-between"><strong>${rank.name} → 下一段位</strong><span>${state.meta.xp} / ${rank.next} XP</span></div><div class="progress-track" style="margin-top:9px"><div class="progress-fill" style="width:${Math.min(100,state.meta.xp/rank.next*100)}%"></div></div></div>`:'<div class="card"><strong>钻石段位已达成 ✨</strong><div class="muted small" style="margin-top:5px">继续刷新最快记录和连续打卡。</div></div>'}<div class="card"><div class="row row-between"><div class="section-title">打卡记录</div><span class="badge">${state.daily.length} 天</span></div><div class="review-list" style="margin-top:9px">${[...state.daily].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20).map(d=>`<div class="review-item"><div class="row row-between"><strong>${d.date}</strong><span class="badge">+${d.xp||0} XP</span></div><div class="muted small" style="margin-top:5px">${d.answers?.filter(a=>a.status==='completed').length||0} 题完成 · ${d.actualPracticeDate&&d.actualPracticeDate!==d.date?'补签于 '+d.actualPracticeDate:'正常打卡'}</div></div>`).join('')||'<div class="empty">还没有打卡记录。</div>'}</div></div></div>`;
}

function getMakeupCandidates(){
  const existing=new Set(state.daily.map(d=>d.date)); const out=[]; const today=new Date();
  for(let i=1;i<=14;i++){ const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i); const key=todayKey(d); if(!existing.has(key)) out.push(key); }
  return out;
}
function openMakeupModal(){
  const c=getMakeupCandidates();
  openModal(`<div class="modal"><h3>补签</h3><p class="page-subtitle">先额外完成一整局 20 题，再把这一局记到选中的缺失日期。</p><div class="col">${c.map((d,i)=>`<label class="check-row"><span>${d}${i===0?' · 最近一天':''}</span><input type="radio" name="makeup" value="${d}" ${i===0?'checked':''}></label>`).join('')}</div><div class="modal-actions"><button class="btn ghost" data-close-modal>取消</button><button class="btn primary" id="confirmMakeup">开始额外一局</button></div></div>`);
  $('#confirmMakeup')?.addEventListener('click',()=>{ const target=$('[name="makeup"]:checked')?.value; if(!target) return; closeModal(); startRound({makeupTarget:target}); });
}

function renderCorpus(){
  const items=corpus(state.corpusTab); const groups=[...new Set(items.map(x=>x.group||'未分类'))];
  $('#main').innerHTML=`<div class="page"><div class="hero-card card"><div class="row row-between"><div><div class="page-title">语料库</div><div class="page-subtitle">用户新增会立即参与下一题抽取。</div></div><button class="btn primary sm" id="addCorpus">＋ 新增</button></div></div><div class="tabs">${Object.entries(CATEGORY_LABELS).map(([k,v])=>`<button class="tab ${state.corpusTab===k?'active':''}" data-corpus-tab="${k}">${v}</button>`).join('')}</div><div class="card tight"><div class="row row-between"><span class="muted small">${CATEGORY_LABELS[state.corpusTab]} · ${items.length} 条</span><div class="row"><button class="btn sm ghost" id="resetCategory">重置本类</button><button class="btn sm danger" id="clearCategory">清空本类</button></div></div></div><div class="corpus-list">${groups.map(g=>`<div class="card tight"><div class="section-title">${escapeHTML(g)}</div><div class="corpus-list" style="margin-top:9px">${items.filter(x=>(x.group||'未分类')===g).map(x=>`<div class="corpus-item"><div class="corpus-text">${escapeHTML(x.text)}</div><div class="row row-between"><span class="corpus-meta">${escapeHTML(x.id)}</span><div class="row"><button class="btn sm ghost" data-edit-id="${x.id}">编辑</button><button class="btn sm danger" data-delete-id="${x.id}">删除</button></div></div></div>`).join('')}</div></div>`).join('') || '<div class="card empty">本类为空。可以新增，也可以重置为内置数据。</div>'}</div></div>`;
  $$('[data-corpus-tab]').forEach(b=>b.addEventListener('click',()=>{state.corpusTab=b.dataset.corpusTab;renderCorpus();}));
  $('#addCorpus').addEventListener('click',()=>openCorpusEditor());
  $$('[data-edit-id]').forEach(b=>b.addEventListener('click',()=>openCorpusEditor(state.corpus.find(x=>x.id===b.dataset.editId))));
  $$('[data-delete-id]').forEach(b=>b.addEventListener('click',async()=>{ if(!confirm('删除这条语料？'))return; await idbDelete(STORE_CORPUS,b.dataset.deleteId); state.corpus=state.corpus.filter(x=>x.id!==b.dataset.deleteId);renderCorpus();showToast('已删除。'); }));
  $('#resetCategory').addEventListener('click',resetCurrentCategory);
  $('#clearCategory').addEventListener('click',clearCurrentCategory);
}
function openCorpusEditor(item=null){
  const isTemplate=state.corpusTab==='templates';
  openModal(`<div class="modal"><h3>${item?'编辑':'新增'}${CATEGORY_LABELS[state.corpusTab]}</h3><div class="col" style="margin-top:12px"><label class="small muted">分组</label><input id="corpusGroup" class="input" value="${escapeHTML(item?.group||'自定义')}"><label class="small muted">文本</label><textarea id="corpusText" class="textarea" ${isTemplate?'placeholder="例如：坚持__，__（动词/效果）__"':''}>${escapeHTML(item?.text||'')}</textarea>${isTemplate?'<div class="muted tiny">句式练习按下划线“__”识别空位。建议保持与内置三种结构相同；用户新增句式也可以使用任意数量“__”。</div>':''}<label class="small muted">启用</label><div class="row"><div id="corpusEnabled" class="switch ${item?.enabled!==false?'on':''}"></div><span class="small muted">练习时参与抽取</span></div></div><div class="modal-actions"><button class="btn ghost" data-close-modal>取消</button><button class="btn primary" id="saveCorpus">保存</button></div></div>`);
  $('#saveCorpus').addEventListener('click',async()=>{
    const text=$('#corpusText').value.trim(); const group=$('#corpusGroup').value.trim()||'自定义'; if(!text){showToast('请输入文本。');return;}
    const record={id:item?.id||uid(state.corpusTab.slice(0,2)),category:state.corpusTab,group,text,enabled:$('#corpusEnabled').classList.contains('on')};
    if(state.corpusTab==='templates'){
      const raw=text.split('__'); record.parts=[]; raw.forEach((part,i)=>{ record.parts.push(part); if(i<raw.length-1) record.parts.push('__'); });
      if(!text.includes('__')){ showToast('句式至少要包含一个“__”空位。'); return; }
    }
    await idbPut(STORE_CORPUS,record); state.corpus=state.corpus.filter(x=>x.id!==record.id);state.corpus.push(record);closeModal();renderCorpus();showToast('已保存，下一题即可抽取。');
  });
  $('#corpusEnabled').addEventListener('click',e=>e.currentTarget.classList.toggle('on'));
}
async function resetCurrentCategory(){
  if(!confirm(`将“${CATEGORY_LABELS[state.corpusTab]}”恢复为内置默认数据？本类用户修改会被覆盖。`)) return;
  const defaults=DEFAULT_CORPUS[state.corpusTab]||[]; const old=corpus(state.corpusTab); for(const x of old) await idbDelete(STORE_CORPUS,x.id); await idbBulkPut(STORE_CORPUS,defaults); await loadAll(); renderCorpus(); showToast('已恢复内置数据。');
}
async function clearCurrentCategory(){
  if(!confirm(`确定清空“${CATEGORY_LABELS[state.corpusTab]}”？`)) return; const old=corpus(state.corpusTab); for(const x of old) await idbDelete(STORE_CORPUS,x.id); state.corpus=state.corpus.filter(x=>x.category!==state.corpusTab); renderCorpus(); showToast('本类已清空。');
}

function renderSettings(){
  const dark=state.meta.theme==='dark';
  $('#main').innerHTML=`<div class="page"><div class="hero-card card"><div class="page-title">设置</div><div class="page-subtitle">数据默认留在本机。iPhone 上建议定期导出 JSON 到“文件 / iCloud Drive”。</div></div><div class="card"><div class="setting-row"><div><strong>深色模式</strong><div class="muted small">跟随你的使用习惯</div></div><div id="themeSwitch" class="switch ${dark?'on':''}"></div></div><div class="setting-row"><div><strong>导出全部数据</strong><div class="muted small">语料库、打卡、答题记录、XP 与当前进度</div></div><button class="btn sm primary" id="exportBtn">导出 JSON</button></div><div class="setting-row"><div><strong>导入 JSON</strong><div class="muted small">会覆盖当前本地数据，导入前建议先导出一份备份</div></div><button class="btn sm ghost" id="importBtn">选择文件</button></div></div><div class="card"><div class="section-title">风险提示</div><p class="muted small" style="line-height:1.6">Safari 或系统清理网站数据可能让 PWA 的本地数据消失。定期将 JSON 导出到 iCloud Drive，是这套本地优先设计里的重要备份习惯。</p><div class="divider"></div><div class="row" style="margin-top:10px"><span class="badge">IndexedDB</span><span class="badge">离线可用</span><span class="badge">无账号服务器</span></div></div><div class="card"><div class="row row-between"><div><strong>恢复全部内置语料</strong><div class="muted small">覆盖当前五类语料库</div></div><button class="btn danger sm" id="resetAll">恢复默认</button></div></div></div>`;
  $('#themeSwitch').addEventListener('click',async()=>{state.meta.theme=dark?'light':'dark';applyTheme();await saveMeta();renderSettings();});
  $('#exportBtn').addEventListener('click',exportJSON); $('#importBtn').addEventListener('click',()=>$('#importFile').click()); $('#resetAll').addEventListener('click',resetAllData);
}
async function resetAllData(){
  if(!confirm('恢复全部默认数据会清空当前语料库、打卡与答题记录，并重新初始化内置语料。继续？')) return;
  await idbClear(STORE_CORPUS); await idbClear(STORE_DAILY); await idbClear(STORE_QUESTIONS); await idbClear(STORE_META); await seedIfNeeded(); state.meta={xp:0,theme:'light',session:null}; state.practice=null; await loadAll(); applyTheme(); renderPage('today'); showToast('已恢复全部默认数据。');
}

async function exportJSON(){
  const data={version:1,exportedAt:new Date().toISOString(),corpus:state.corpus,daily:state.daily,questions:state.questions,meta:state.meta};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`八股操练备份-${todayKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('JSON 已生成，请保存到 iCloud Drive。');
}
$('#importFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(!data || !Array.isArray(data.corpus) || !Array.isArray(data.daily) || !Array.isArray(data.questions) || !data.meta) throw new Error('文件结构不正确');
    if(!confirm('导入会覆盖当前本地数据。确定继续？')) return;
    await idbClear(STORE_CORPUS);await idbClear(STORE_DAILY);await idbClear(STORE_QUESTIONS);await idbClear(STORE_META);
    await idbBulkPut(STORE_CORPUS,data.corpus);await idbBulkPut(STORE_DAILY,data.daily);await idbBulkPut(STORE_QUESTIONS,data.questions);await idbPut(STORE_META,{key:'app',value:data.meta});
    await loadAll();state.practice=null;applyTheme();renderPage('today');showToast('导入完成。');
  }catch(err){ console.error(err); showToast('导入失败：JSON 文件格式不正确。'); }
  finally{e.target.value='';}
});

function renderPage(page){
  state.page=page; $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  if(page!=='practice' && state.practice){ /* 离开练习页不暂停计时，回到练习可继续。 */ }
  if(page==='today') renderToday();
  else if(page==='practice') renderPractice();
  else if(page==='corpus') renderCorpus();
  else if(page==='stats') renderStats();
  else if(page==='settings') renderSettings();
}
$$('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>renderPage(btn.dataset.page)));

function openModal(html){ const root=$('#modalRoot'); root.innerHTML=html; root.hidden=false; root.addEventListener('click',e=>{if(e.target===root) closeModal();},{once:true}); $$('[data-close-modal]',root).forEach(b=>b.addEventListener('click',closeModal)); }
function closeModal(){ $('#modalRoot').hidden=true; $('#modalRoot').innerHTML=''; }
function showToast(text){ let el=$('.toast'); if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el);} el.textContent=text;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),1800); }

async function boot(){
  try{
    await openDB(); await seedIfNeeded(); await loadAll(); applyTheme(); await restoreSession();
    if(!state.practice) renderPage('today'); else renderPage('practice');
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('SW registration failed',err)); }
  }catch(err){ console.error(err); document.querySelector('#main').innerHTML='<div class="card"><h2>启动失败</h2><p class="muted">浏览器未能打开 IndexedDB。请确认使用 Safari/Chrome 的正常网页模式后再试。</p></div>'; }
}

// 修正 renderPractice 的 3 句句式渲染
const _renderPractice = renderPractice;
renderPractice = function(){
  if(!state.practice){ _renderPractice(); return; }
  const p=state.practice,q=p.question; const elapsed=Math.min(60,Math.floor((Date.now()-q.startedAt)/1000)); const remaining=Math.max(0,60-elapsed);
  const percent=(p.index/20)*100 + ((elapsed/60)/20)*100;
  $('#main').innerHTML=`<div class="page practice-page">
  <div class="practice-head card tight"><div class="row row-between"><span class="question-count">第 ${p.index+1} / 20 题</span><span class="template-badge">${escapeHTML(q.template.text)}</span></div><div class="timer-row"><div id="timer" class="timer ${remaining<=10?'danger':''}">${formatSeconds(remaining)}</div><div id="lifeRow" class="life-row">${'❤'.repeat(p.hearts)}${'♡'.repeat(3-p.hearts)}</div></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,percent)}%"></div></div><div class="row row-between small"><span>连击：<strong>${p.combo}</strong></span><span>本局 XP：<strong>${p.roundXP}</strong></span></div></div>
  <div class="sentence-list">${renderSentenceBuildersFixed(q)}</div>
  <div class="pool card"><div class="row row-between"><div><div class="section-title">语块池</div><div class="muted tiny">仅包含本题抽中的 3 个主题词，没有其他主题词干扰项。</div></div><span class="badge">${q.topics.map(t=>escapeHTML(t.text)).join(' · ')}</span></div><div id="poolGrid" class="pool-grid">${renderPool(q)}</div><div class="divider"></div><div class="section-title">通用语块 NPC</div><div class="muted tiny">不限量、无历史记录，仅在当前题有效。</div><div class="common-box"><input id="commonInput" class="input" placeholder="例如：的 / 和 / 更 / 彰显"><button id="addCommon" class="btn primary">添加</button></div></div>
  <div class="action-bar"><button id="rerollBtn" class="btn ghost">重新出题</button><button id="completeBtn" class="btn primary" ${!allSlotsFilled(q)?'disabled':''}>完成本句</button><button id="abandonBtn" class="btn danger">放弃本题</button></div></div>`;
  $('#topStats').hidden=false; updateTopStats(); bindPractice();
};

boot();
