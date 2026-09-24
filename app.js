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
    { id: 't1', category: 'templates', group: '核心结构', text: '以__为__，__', parts: ['以', '__', '为', '__', '，', '__'], slotDefaults: [true, true, false], slotHints: ['', '', ''], enabled: true },
    { id: 't2', category: 'templates', group: '核心结构', text: '坚持__ __，__', parts: ['坚持', '__', ' ', '__', '，', '__'], slotDefaults: [true, true, false], slotHints: ['', '', ''], enabled: true },
    { id: 't3', category: 'templates', group: '核心结构', text: '__ __，__', parts: ['__', ' ', '__', '，', '__'], slotDefaults: [true, true, false], slotHints: ['动词', '', ''], enabled: true }
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
  dragging: null,
  activeSentence: 0,
  activeZone: 0,
  lastPlacedId: null,
  startMode: 'countup'
};

function uid(prefix='id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
function cloneData(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
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

let dbConnection = null;
let dbOpening = null;

function openDB() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not available in this browsing context.'));
  }
  if (dbConnection) return Promise.resolve(dbConnection);
  if (dbOpening) return dbOpening;

  dbOpening = new Promise((resolve, reject) => {
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      dbOpening = null;
      reject(err);
      return;
    }

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CORPUS)) db.createObjectStore(STORE_CORPUS, {keyPath:'id'});
      if (!db.objectStoreNames.contains(STORE_DAILY)) db.createObjectStore(STORE_DAILY, {keyPath:'date'});
      if (!db.objectStoreNames.contains(STORE_QUESTIONS)) db.createObjectStore(STORE_QUESTIONS, {keyPath:'id'});
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, {keyPath:'key'});
    };
    req.onblocked = () => {
      reject(new Error('IndexedDB upgrade is blocked by another open connection.'));
    };
    req.onsuccess = () => {
      dbConnection = req.result;
      dbConnection.onversionchange = () => {
        try { dbConnection.close(); } catch (_) {}
        dbConnection = null;
      };
      dbConnection.onclose = () => { dbConnection = null; };
      dbOpening = null;
      resolve(dbConnection);
    };
    req.onerror = () => {
      dbOpening = null;
      reject(req.error || new Error('Unable to open IndexedDB.'));
    };
  });

  return dbOpening;
}

async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
    tx.onerror=()=>reject(tx.error);
  });
}
async function idbGet(store,key) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(store,'readonly').objectStore(store).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function idbPut(store,value) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}
async function idbDelete(store,key) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}
async function idbClear(store) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}
async function idbBulkPut(store, values) {
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    const os=tx.objectStore(store);
    values.forEach(v=>os.put(v));
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error || new Error('IndexedDB transaction aborted.'));
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
function inferSlotDefaults(parts) {
  const defaults = [];
  let afterComma = false;
  for (const part of parts) {
    if (part === '，' || part === ',') afterComma = true;
    if (part === '__') defaults.push(!afterComma);
  }
  return defaults;
}

function normalizeTemplate(template) {
  const t = cloneData(template || {});
  if (!Array.isArray(t.parts) || !t.parts.length) t.parts = parseTemplateParts(String(t.text || ''));
  const slotCount = t.parts.filter(p => p === '__').length;
  if (!Array.isArray(t.slotDefaults) || t.slotDefaults.length !== slotCount) {
    t.slotDefaults = inferSlotDefaults(t.parts);
  }
  if (!Array.isArray(t.slotHints) || t.slotHints.length !== slotCount) {
    t.slotHints = Array.from({length: slotCount}, () => '');
  }
  return t;
}

function parseTemplateParts(text) {
  const raw = String(text || '').split('__');
  const parts = [];
  raw.forEach((part, i) => {
    parts.push(part);
    if (i < raw.length - 1) parts.push('__');
  });
  return parts;
}

// 句式中的 __ 本身就是“语块槽位”。仅用于排版的空白不再单独渲染，
// 避免出现“句式空格 + 语块空格”两个空白同时存在的感觉。
function isTemplateWhitespace(part) {
  return typeof part === 'string' && /^[\s\u00a0]*$/.test(part);
}

function topicGroupSample(allTopics, n = 3) {
  const groups = [...new Set(allTopics.map(x => x.group || '未分类'))];
  const eligible = groups.filter(g => allTopics.filter(x => (x.group || '未分类') === g).length >= n);
  if (!eligible.length) return sample(allTopics, n);
  const group = sample(eligible, 1)[0];
  return sample(allTopics.filter(x => (x.group || '未分类') === group), n);
}

function makePool(samples, topics) {
  const make = (kind, arr) => arr.map(x => ({id: x.tokenId || uid(kind), kind, text: x.text}));
  return [
    ...make('topic', topics),
    ...make('verb', samples.verbs),
    ...make('metaphor', samples.metaphors),
    ...make('effect', samples.effects)
  ];
}

function getSampleCounts() {
  // 保留“有干扰语块”的玩法，但控制数量，避免 60 秒被语块池本身拖死。
  return {verbs: 6, metaphors: 6, effects: 6};
}

function createQuestion(prev = null, reroll = {}) {
  const templates = corpus('templates').filter(x => x.enabled !== false);
  if (!templates.length) throw new Error('没有可用句式，请在语料库中恢复或新增句式。');
  const template = normalizeTemplate(prev?.template || pickTemplate());
  const counts = getSampleCounts(template);
  const allVerbs = corpus('verbs');
  const allMetas = corpus('metaphors');
  const allEffects = corpus('effects');
  const allTopics = corpus('topics');
  if (allTopics.length < 3) throw new Error('至少需要 3 个主题词。');

  const rawTopics = reroll.topics
    ? topicGroupSample(allTopics, 3)
    : (prev?.topics?.length === 3 ? prev.topics : topicGroupSample(allTopics, 3));
  const topics = rawTopics.map(t => ({...t, tokenId: t.tokenId || uid('topic')}));

  const samples = {
    verbs: reroll.verbs ? sample(allVerbs, counts.verbs) : (prev?.samples?.verbs || sample(allVerbs, counts.verbs)),
    metaphors: reroll.metaphors ? sample(allMetas, counts.metaphors) : (prev?.samples?.metaphors || sample(allMetas, counts.metaphors)),
    effects: reroll.effects ? sample(allEffects, counts.effects) : (prev?.samples?.effects || sample(allEffects, counts.effects))
  };
  const slotCount = template.parts.filter(p => p === '__').length;
  return {
    template,
    topics,
    samples,
    pool: makePool(samples, topics),
    placed: Array.from({length: slotCount * 3}, () => []),
    startedAt: Date.now(),
    common: [],
    activeSentence: 0,
    activeZone: 0,
    reviewing: false,
    completedRecord: null
  };
}

function getSentenceSlotCount(q) {
  return normalizeTemplate(q.template).parts.filter(p => p === '__').length;
}

function slotDefaultOne(q, localSlot) {
  const t = normalizeTemplate(q.template);
  return t.slotDefaults?.[localSlot] !== false;
}

function defaultZoneIndex(template, placedZones) {
  const t = normalizeTemplate(template);
  const slotCount = t.parts.filter(p => p === '__').length;
  for (let i = 0; i < slotCount; i++) {
    if (t.slotDefaults?.[i] && !(placedZones[i] || []).length) return i;
  }
  for (let i = 0; i < slotCount; i++) {
    if (!(placedZones[i] || []).length) return i;
  }
  return Math.max(0, slotCount - 1);
}

function migratePracticeShape() {
  const p = state.practice;
  if (!p?.question) return;
  p.question.template = normalizeTemplate(p.question.template);
  const slotCount = getSentenceSlotCount(p.question);
  const wanted = slotCount * 3;
  if (!Array.isArray(p.question.placed) || p.question.placed.length !== wanted) {
    p.question.placed = Array.from({length: wanted}, () => []);
  }
  if (!Array.isArray(p.question.common)) p.question.common = [];
  if (!Array.isArray(p.question.pool)) p.question.pool = [];
  p.question.topics = (p.question.topics || []).map(t => ({...t, tokenId: t.tokenId || uid('topic')}));
  const topicTexts = new Set(p.question.topics.map(t => t.text));
  for (const t of p.question.topics) {
    if (!p.question.pool.some(x => x.kind === 'topic' && x.text === t.text)) {
      p.question.pool.push({id:t.tokenId, kind:'topic', text:t.text});
    }
  }
  p.question.pool.forEach(x => {
    if (x.kind === 'topic') {
      const match = p.question.topics.find(t => t.text === x.text);
      if (match) match.tokenId = x.id;
    }
  });
  p.mode = p.mode || 'countdown';
  p.activeSentence = Number.isInteger(p.activeSentence) ? Math.max(0, Math.min(2, p.activeSentence)) : 0;
  p.activeZone = Number.isInteger(p.activeZone) ? Math.max(0, Math.min(slotCount - 1, p.activeZone)) : 0;
  p.completedCurrent = Boolean(p.completedCurrent || p.question.reviewing);
}

function getTopicToken(q, topic) {
  return q.pool.find(x => x.kind === 'topic' && x.id === topic.tokenId) || q.pool.find(x => x.kind === 'topic' && x.text === topic.text);
}

function getQuestionElapsed(q) {
  return Math.max(0, Math.floor((Date.now() - q.startedAt) / 1000));
}

function questionRemaining(q) {
  return Math.max(0, 60 - getQuestionElapsed(q));
}

function sentenceRange(q, sentenceIndex) {
  const slotCount = getSentenceSlotCount(q);
  return {start: sentenceIndex * slotCount, end: sentenceIndex * slotCount + slotCount};
}

function sentenceFilled(q, sentenceIndex) {
  const {start, end} = sentenceRange(q, sentenceIndex);
  return q.placed.slice(start, end).every(arr => Array.isArray(arr) && arr.length > 0);
}

function allSentencesFilled(q) {
  return [0,1,2].every(i => sentenceFilled(q, i));
}

function totalPlaced(q) { return q.placed.reduce((n, a) => n + a.length, 0); }
function usedTokenIds(q) { return new Set(q.placed.flat().map(x => x.id)); }
function tokenFromPool(q, id) { return q.pool.find(x => x.id === id); }

function currentZoneIndex() {
  const p = state.practice;
  if (!p?.question) return null;
  const slotCount = getSentenceSlotCount(p.question);
  return p.activeSentence * slotCount + p.activeZone;
}

function setActiveZone(sentenceIndex, localSlot) {
  const p = state.practice;
  if (!p || p.question.reviewing) return;
  const slotCount = getSentenceSlotCount(p.question);
  p.activeSentence = Math.max(0, Math.min(2, Number(sentenceIndex)));
  p.activeZone = Math.max(0, Math.min(slotCount - 1, Number(localSlot)));
  persistSession();
  renderPractice();
}

function nextSentenceOrFinish() {
  const p = state.practice;
  if (!p || p.question.reviewing) return;
  if (!sentenceFilled(p.question, p.activeSentence)) {
    showToast('这一句还没排完。');
    return;
  }
  if (p.activeSentence < 2) {
    p.activeSentence += 1;
    p.activeZone = defaultZoneIndex(p.question.template, p.question.placed.slice(
      p.activeSentence * getSentenceSlotCount(p.question),
      (p.activeSentence + 1) * getSentenceSlotCount(p.question)
    ));
    persistSession();
    renderPractice();
    return;
  }
  completeQuestion();
}

function currentSentence(q) {
  return Math.max(0, Math.min(2, state.practice?.activeSentence || 0));
}

function buildPracticeStartHTML() {
  return `<div class="practice-start">
    <div class="eyebrow">20 题 / 局</div>
    <h1>八股操练</h1>
    <div class="mode-switch" role="group" aria-label="计时模式">
      <button class="mode-option ${state.startMode === 'countup' ? 'active' : ''}" data-start-mode="countup"><strong>正计时</strong><small>不设时间上限</small></button>
      <button class="mode-option ${state.startMode === 'countdown' ? 'active' : ''}" data-start-mode="countdown"><strong>倒计时挑战</strong><small>60 秒 / 题</small></button>
    </div>
    <button id="startPractice" class="btn primary btn-block btn-lg">开始${state.startMode === 'countup' ? '正计时' : '挑战'}</button>
  </div>`;
}

function buildPracticeHTML() {
  const p = state.practice;
  if (!p) return buildPracticeStartHTML();
  const q = p.question;
  const isReview = Boolean(q.reviewing);
  const elapsed = getQuestionElapsed(q);
  const remaining = questionRemaining(q);
  const displaySeconds = p.mode === 'countdown' ? remaining : elapsed;
  const percent = Math.min(100, (p.index / 20) * 100);
  const timerLabel = p.mode === 'countdown' ? '倒计时' : '正计时';
  const nextLabel = p.index === 19 ? '完成本局' : '下一题';

  if (isReview) {
    return `<div class="page practice-page review-stage">
      <section class="practice-top">
        <div class="practice-meta">
          <div class="practice-left"><div class="round-label">第 ${p.index + 1} / 20</div><span class="mode-badge">${timerLabel}</span></div>
          <button id="exitPractice" class="exit-btn">退出</button>
        </div>
        <div class="timer-review">${formatSeconds(p.completedCurrentElapsed || elapsed)}</div>
      </section>
      <section class="review-heading"><span class="review-dot">✓</span><div><strong>本题完成</strong><span>${p.completedCurrentXP > 0 ? '+' + p.completedCurrentXP + ' XP' : ''}</span></div></section>
      <section class="final-sentences">${[0,1,2].map(i => renderReviewSentence(q, i)).join('')}</section>
      <button id="nextQuestionBtn" class="next-sentence bottom-action ${p.index === 19 ? 'last' : ''}">${nextLabel}</button>
    </div>`;
  }

  const i = currentSentence(q);
  return `<div class="page practice-page">
    <section class="practice-top">
      <div class="practice-meta">
        <div class="practice-left"><div class="round-label">第 ${p.index + 1} / 20</div><span class="mode-badge">${timerLabel}</span></div>
        <div class="timer-wrap"><span id="timer" class="timer ${p.mode === 'countdown' && remaining <= 10 ? 'danger' : ''}">${formatSeconds(displaySeconds)}</span>${p.mode === 'countdown' ? `<span id="lifeRow" class="life-row">${'♥'.repeat(p.hearts)}${'♡'.repeat(Math.max(0, 3-p.hearts))}</span>` : ''}<button id="exitPractice" class="exit-btn">退出</button></div>
      </div>
      <div class="progress-track slim"><div class="progress-fill" style="width:${percent}%"></div></div>
      <div class="practice-submeta"><span>🔥 ${p.combo}</span><span>⚡ ${p.roundXP} XP</span><div class="head-actions"><button id="rerollBtn" class="head-btn" aria-label="重新出题">↻</button><button id="abandonBtn" class="head-btn">放弃本题</button></div></div>
    </section>

    <section class="topic-card compact-topic">
      <div class="topic-title">本期主题词 <span>${escapeHTML(q.topics[0]?.group || '')}</span></div>
      <div class="topic-row">${q.topics.map(t => {
        const tok = getTopicToken(q, t);
        const used = usedTokenIds(q).has(tok?.id);
        return `<button class="topic-pill ${used ? 'used' : ''}" data-topic-id="${tok?.id || ''}" ${used ? 'disabled' : ''}>${escapeHTML(t.text)}</button>`;
      }).join('')}</div>
    </section>

    <section class="sentence-focus" id="sentence-${i}">
      ${renderSentenceCard(q, i, true)}
    </section>

    <section class="pool-card">
      ${renderPoolCategory(q, 'verb', '动词', '点击填入当前光标', false)}
      ${renderPoolCategory(q, 'metaphor', '比喻', '点击填入当前光标', false)}
      ${renderPoolCategory(q, 'effect', '效果', '点击填入当前光标', false)}
      <button id="addCommon" class="common-add"><span>＋</span> 通用语块</button>
    </section>

    <button id="nextSentenceBtn" class="next-sentence bottom-action" ${!sentenceFilled(q, i) ? 'disabled' : ''}>${i < 2 ? '下一句 →' : '完成'}</button>
  </div>`;
}

function renderSentenceCard(q, sentenceIndex, active) {
  const t = normalizeTemplate(q.template);
  const slotCount = t.parts.filter(p => p === '__').length;
  const content = t.parts.map((part, i) => {
    if (isTemplateWhitespace(part)) return '';
    if (part !== '__') return `<span class="static-text">${escapeHTML(part)}</span>`;
    const localSlot = t.parts.slice(0, i).filter(x => x === '__').length;
    const idx = sentenceIndex * slotCount + localSlot;
    const chips = (q.placed[idx] || []).map(tok => renderPlacedChip(tok, idx)).join('');
    const hint = t.slotHints?.[localSlot] || (t.slotDefaults?.[localSlot] ? '语块' : '可继续');
    const selected = active && state.practice?.activeZone === localSlot;
    // 用 div 作为槽位容器，避免 button 嵌套 button 导致 iOS Safari 点击/拖动行为异常。
    return `<div class="token-zone ${chips ? 'has-token' : ''} ${selected ? 'selected' : ''}" data-slot="${idx}" data-sentence="${sentenceIndex}" data-local-slot="${localSlot}">
      ${chips || `<span class="zone-placeholder">${escapeHTML(hint)}</span>`}
    </div>`;
  }).join('');
  return `<article class="sentence-card ${active ? 'active' : ''}">
    <div class="sentence-head"><span class="sentence-number">${sentenceIndex + 1}</span><span>分论点 ${sentenceIndex + 1}</span><span class="sentence-status">${sentenceFilled(q, sentenceIndex) ? '✓' : ''}</span></div>
    <div class="sentence-builder" data-sentence="${sentenceIndex}">${content}</div>
  </article>`;
}

function renderReviewSentence(q, sentenceIndex) {
  const t = normalizeTemplate(q.template);
  const slotCount = t.parts.filter(p => p === '__').length;
  let slotIndex = 0;
  const html = t.parts.map(part => {
    if (isTemplateWhitespace(part)) return '';
    if (part !== '__') return `<span class="static-text">${escapeHTML(part)}</span>`;
    const chips = (q.placed[sentenceIndex * slotCount + slotIndex++] || []).map(tok => `<span class="review-chip ${tok.kind}">${escapeHTML(tok.text)}</span>`).join('');
    return `<span class="review-slot">${chips}</span>`;
  }).join('');
  return `<div class="final-line"><span class="final-num">${sentenceIndex + 1}</span><div>${html}</div></div>`;
}

function renderPoolCategory(q, kind, title, sub, compact = false) {
  const used = usedTokenIds(q);
  const items = q.pool.filter(x => x.kind === kind && !used.has(x.id));
  return `<div class="pool-section ${kind} ${compact ? 'compact' : ''}">
    <div class="pool-section-head"><strong>${title}</strong><span>${items.length} 个</span></div>
    <div class="pool-grid">${items.length ? items.map(tok => `<button class="pool-chip ${tok.kind}" data-pool-id="${tok.id}">${escapeHTML(tok.text)}</button>`).join('') : '<span class="pool-empty">已用完</span>'}</div>
  </div>`;
}

function renderPractice(options = {}) {
  migratePracticeShape();
  $('#main').innerHTML = buildPracticeHTML();
  $('#topStats').hidden = !state.practice;
  document.body.classList.toggle('practice-active', Boolean(state.practice));
  updateTopStats();
  bindPractice();
  if (options.scrollToSentence !== undefined) {
    requestAnimationFrame(() => $('#sentence-' + options.scrollToSentence)?.scrollIntoView({behavior:'smooth', block:'nearest'}));
  }
  if (state.lastPlacedId) {
    const last = document.querySelector(`[data-place-id="${CSS.escape(state.lastPlacedId)}"]`);
    setTimeout(() => { last?.classList.remove('just-added'); state.lastPlacedId = null; }, 240);
  }
}

function updateTopStats() {
  const p = state.practice;
  if (!p) { $('#topStats').hidden = true; return; }
  $('#heartPill').textContent = `❤ ${p.hearts}`;
  $('#xpPill').textContent = `XP ${state.meta.xp}`;
  $('#comboPill').textContent = `🔥 ${p.combo}`;
}

function bindPractice() {
  $('#startPractice')?.addEventListener('click', () => startRound({mode:state.startMode}));
  $$('[data-start-mode]').forEach(btn => btn.addEventListener('click', () => { state.startMode = btn.dataset.startMode; renderPractice(); }));
  $('#rerollBtn')?.addEventListener('click', openRerollModal);
  $('#nextSentenceBtn')?.addEventListener('click', nextSentenceOrFinish);
  $('#nextQuestionBtn')?.addEventListener('click', nextQuestion);
  $('#addCommon')?.addEventListener('click', addCommonBlock);
  $('#exitPractice')?.addEventListener('click', exitPractice);
  $('#abandonBtn')?.addEventListener('click', abandonQuestion);

  $$('[data-pool-id]').forEach(btn => btn.addEventListener('click', () => usePoolToken(btn.dataset.poolId)));
  $$('[data-topic-id]').forEach(btn => btn.addEventListener('click', () => usePoolToken(btn.dataset.topicId)));
  $$('.token-zone').forEach(zone => {
    zone.addEventListener('click', e => {
      if (e.target.closest('.token-chip')) return;
      setActiveZone(Number(zone.dataset.sentence), Number(zone.dataset.localSlot));
    });
    bindDropZone(zone);
  });
  $$('.token-chip').forEach(bindDragChip);
}

function renderPlacedChip(tok, slotIndex) {
  const isCommon = tok.kind === 'common';
  return `<button class="token-chip filled ${tok.kind} ${state.lastPlacedId === tok.id ? 'just-added' : ''}" data-place-id="${tok.id}" data-slot="${slotIndex}" title="${isCommon ? '点击编辑' : '点击退回语块池'}">${escapeHTML(tok.text)}${isCommon ? '<span class="edit-dot">✎</span>' : ''}</button>`;
}

function usePoolToken(id) {
  const p = state.practice; if (!p || p.question.reviewing) return;
  const tok = tokenFromPool(p.question, id); if (!tok) return;
  const zone = currentZoneIndex(); if (zone === null) return;
  if (usedTokenIds(p.question).has(tok.id)) return;
  p.question.placed[zone].push(tok);
  p.lastPlacedId = tok.id;
  state.lastPlacedId = tok.id;
  const localSlot = p.activeZone;
  if (slotDefaultOne(p.question, localSlot) && p.question.placed[zone].length >= 1) {
    const slotCount = getSentenceSlotCount(p.question);
    const sentenceStart = p.activeSentence * slotCount;
    const next = defaultZoneIndex(p.question.template, p.question.placed.slice(sentenceStart, sentenceStart + slotCount));
    p.activeZone = next;
  }
  persistSession();
  renderPractice();
}

function addCommonBlock() {
  const p = state.practice; if (!p) return;
  const zone = currentZoneIndex(); if (zone === null) return;
  const tok = {id: uid('common'), kind:'common', text:'通用'};
  p.question.pool.push(tok);
  p.question.common.push(tok);
  p.question.placed[zone].push(tok);
  p.lastPlacedId = tok.id;
  state.lastPlacedId = tok.id;
  persistSession();
  renderPractice();
}

function editCommonToken(id) {
  const p = state.practice; if (!p) return;
  const tok = p.question.pool.find(x => x.id === id);
  if (!tok || tok.kind !== 'common') return;
  openModal(`<div class="modal"><div class="modal-handle"></div><h3>编辑通用语块</h3><p class="page-subtitle">它只存在于这一题。可以改字，也可以删除。</p><input id="commonEditInput" class="input" maxlength="30" value="${escapeHTML(tok.text)}" autofocus><div class="modal-actions three"><button class="btn danger" id="deleteCommon">删除</button><button class="btn ghost" data-close-modal>取消</button><button class="btn primary" id="saveCommon">保存</button></div></div>`);
  $('#saveCommon')?.addEventListener('click', () => {
    const text = $('#commonEditInput')?.value.trim();
    if (!text) { showToast('通用语块不能为空。'); return; }
    tok.text = text;
    const placed = p.question.placed.flat().find(x => x.id === id);
    if (placed) placed.text = text;
    closeModal();
    persistSession();
    renderPractice();
  });
  $('#deleteCommon')?.addEventListener('click', () => {
    p.question.pool = p.question.pool.filter(x => x.id !== id);
    p.question.common = p.question.common.filter(x => x.id !== id);
    p.question.placed = p.question.placed.map(arr => arr.filter(x => x.id !== id));
    closeModal();
    persistSession();
    renderPractice();
  });
}

function bindDragChip(chip) {
  chip.addEventListener('click', () => {
    if (chip.dataset.pointerHandled === '1') { chip.dataset.pointerHandled = '0'; return; }
    if (chip.dataset.dragged === '1') { chip.dataset.dragged = '0'; return; }
    const id = chip.dataset.placeId;
    const p = state.practice;
    const tok = p?.question.pool.find(x => x.id === id);
    if (tok?.kind === 'common') editCommonToken(id);
    else removePlacedToken(id);
  });
  chip.addEventListener('pointerdown', e => startPointerDrag(e, chip));
}

function bindDropZone(zone) {
  zone.addEventListener('dragover', e => e.preventDefault());
  zone.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const index = insertionIndexFromPoint(zone, e.clientX, e.clientY, id);
    reorderPlaced(id, Number(zone.dataset.slot), index);
  });
}

function insertionIndexFromPoint(zone, x, y, movingId) {
  const chips = $$('.token-chip', zone).filter(el => el.dataset.placeId !== movingId && !el.classList.contains('drag-ghost'));
  if (!chips.length) return 0;

  // 多邻国式“插入线”：在芯片左侧就插到它前面，否则插到它后面。
  for (let i = 0; i < chips.length; i++) {
    const r = chips[i].getBoundingClientRect();
    const sameRow = y >= r.top - 8 && y <= r.bottom + 8;
    if (sameRow && x < r.left + r.width / 2) return i;
  }
  return chips.length;
}

function showDropPlaceholder(zone, index) {
  const drag = state.dragging;
  if (!drag?.placeholder) return;
  const placeholder = drag.placeholder;
  const chips = $$('.token-chip', zone).filter(el => el !== drag.source && !el.classList.contains('drag-ghost'));
  const safeIndex = Math.max(0, Math.min(index, chips.length));
  const ref = chips[safeIndex];
  if (ref) zone.insertBefore(placeholder, ref);
  else zone.appendChild(placeholder);
}

function startPointerDrag(e, chip) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const id = chip.dataset.placeId;
  const startX = e.clientX, startY = e.clientY;
  let holdTimer = null;
  let active = false;
  let moved = false;

  const cleanup = () => {
    clearTimeout(holdTimer);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    if (state.dragging?.raf) cancelAnimationFrame(state.dragging.raf);
    document.body.classList.remove('drag-mode');
    $$('.token-zone.drag-target').forEach(z => z.classList.remove('drag-target'));
    $$('.token-zone .drop-placeholder').forEach(el => el.remove());

    if (state.dragging?.ghost) state.dragging.ghost.remove();
    if (state.dragging?.source) {
      state.dragging.source.style.visibility = '';
      state.dragging.source.classList.remove('drag-source');
      state.dragging.source.style.pointerEvents = '';
    }
    state.dragging = null;
  };

  const move = ev => {
    const distance = Math.hypot(ev.clientX - startX, ev.clientY - startY);
    if (distance > 8) moved = true;

    // 手指尚未长按激活时，允许页面保持自然滚动。
    if (!active) return;
    ev.preventDefault();

    const drag = state.dragging;
    if (!drag) return;
    drag.dx = ev.clientX - drag.startX;
    drag.dy = ev.clientY - drag.startY;
    if (!drag.raf) {
      drag.raf = requestAnimationFrame(() => {
        drag.ghost.style.transform = `translate3d(${drag.dx}px, ${drag.dy}px, 0) scale(1.06) rotate(-1.5deg)`;
        drag.raf = 0;
      });
    }

    const pointTarget = document.elementFromPoint(ev.clientX, ev.clientY);
    const target = pointTarget?.closest('.token-zone');

    if (target) {
      const targetSlot = Number(target.dataset.slot);
      const index = insertionIndexFromPoint(target, ev.clientX, ev.clientY, id);
      if (drag.lastTargetSlot !== targetSlot || drag.lastTargetIndex !== index) {
        $$('.token-zone.drag-target').forEach(z => z.classList.remove('drag-target'));
        target.classList.add('drag-target');
        showDropPlaceholder(target, index);
        drag.targetSlot = targetSlot;
        drag.targetIndex = index;
        drag.lastTargetSlot = targetSlot;
        drag.lastTargetIndex = index;
      }
    }
  };

  const up = ev => {
    if (active) {
      const drag = state.dragging;
      const targetSlot = drag?.targetSlot;
      const targetIndex = drag?.targetIndex;
      if (Number.isInteger(targetSlot)) {
        chip.dataset.dragged = '1';
        cleanup();
        reorderPlaced(id, targetSlot, targetIndex);
        return;
      }
      cleanup();
      return;
    }

    if (!moved) {
      chip.dataset.pointerHandled = '1';
      chip.dataset.dragged = '0';
      const p = state.practice;
      const tok = p?.question.pool.find(x => x.id === id);
      cleanup();
      if (tok?.kind === 'common') editCommonToken(id); else removePlacedToken(id);
      return;
    }
    cleanup();
  };

  const cancel = () => cleanup();

  holdTimer = setTimeout(() => {
    const rect = chip.getBoundingClientRect();
    active = true;
    state.dragging = {
      id, source: chip, startX: e.clientX, startY: e.clientY,
      targetSlot: Number(chip.dataset.slot), targetIndex: 0, lastTargetSlot: null, lastTargetIndex: null,
      dx: 0, dy: 0, raf: 0, ghost: null, placeholder: null
    };

    const ghost = chip.cloneNode(true);
    ghost.classList.remove('just-added');
    ghost.classList.add('drag-ghost');
    Object.assign(ghost.style, {
      position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`,
      height: `${rect.height}px`, margin: '0', zIndex: '9999', pointerEvents: 'none',
      transition: 'none',
      transform: 'scale(1.06) rotate(-1.5deg)'
    });
    document.body.appendChild(ghost);

    const placeholder = document.createElement('span');
    placeholder.className = 'drop-placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;

    chip.classList.add('drag-source');
    chip.style.visibility = 'hidden';
    chip.style.pointerEvents = 'none';

    state.dragging.ghost = ghost;
    state.dragging.placeholder = placeholder;
    document.body.classList.add('drag-mode');

    const zone = chip.closest('.token-zone');
    if (zone) {
      zone.classList.add('drag-target');
      showDropPlaceholder(zone, Number([...zone.querySelectorAll('.token-chip')].indexOf(chip)));
      state.dragging.targetSlot = Number(zone.dataset.slot);
      state.dragging.targetIndex = insertionIndexFromPoint(zone, e.clientX, e.clientY, id);
    }
  }, 190);

  window.addEventListener('pointermove', move, {passive:false});
  window.addEventListener('pointerup', up, {once:true});
  window.addEventListener('pointercancel', cancel, {once:true});
}

function removePlacedToken(id) {
  const p = state.practice; if (!p) return;
  for (let i = 0; i < p.question.placed.length; i++) {
    const pos = p.question.placed[i].findIndex(x => x.id === id);
    if (pos >= 0) {
      p.question.placed[i].splice(pos, 1);
      const slotCount = getSentenceSlotCount(p.question);
      p.activeSentence = Math.floor(i / slotCount);
      p.activeZone = i % slotCount;
      break;
    }
  }
  persistSession();
  renderPractice({scrollToSentence: p.activeSentence});
}

function reorderPlaced(id, targetSlot, targetIndex = 0) {
  const p = state.practice; if (!p) return;
  let token = null, fromSlot = -1, fromIndex = -1;
  for (let i = 0; i < p.question.placed.length; i++) {
    const ix = p.question.placed[i].findIndex(x => x.id === id);
    if (ix >= 0) { token = p.question.placed[i][ix]; fromSlot = i; fromIndex = ix; break; }
  }
  if (!token) return;
  p.question.placed[fromSlot].splice(fromIndex, 1);
  if (fromSlot === targetSlot && fromIndex < targetIndex) targetIndex -= 1;
  targetIndex = Math.max(0, Math.min(targetIndex, p.question.placed[targetSlot].length));
  p.question.placed[targetSlot].splice(targetIndex, 0, token);
  const slotCount = getSentenceSlotCount(p.question);
  p.activeSentence = Math.floor(targetSlot / slotCount);
  p.activeZone = targetSlot % slotCount;
  persistSession();
  renderPractice({scrollToSentence: p.activeSentence});
}

function startRound({makeupTarget = null, mode = null} = {}) {
  if (corpus('topics').length < 3 || corpus('verbs').length === 0 || corpus('effects').length === 0 || corpus('metaphors').length === 0 || corpus('templates').length === 0) {
    showToast('语料库还不完整。'); return;
  }
  clearInterval(state.practiceTimer);
  const selectedMode = mode || state.startMode || 'countup';
  state.practice = {
    roundId: uid('round'), index:0, hearts:3, combo:0, roundXP:0, startedRoundAt:Date.now(),
    makeupTarget, mode:selectedMode, answers:[], question:createQuestion(), activeSentence:0, activeZone:0,
    completedCurrent:false, completedCurrentElapsed:0, completedCurrentXP:0
  };
  persistSession();
  renderPractice();
  startTimer();
}

function persistSession() {
  if (!state.practice) { state.meta.session = null; saveMeta(); return; }
  state.meta.session = cloneData(state.practice);
  saveMeta();
}

async function restoreSession() {
  if (!state.meta.session) return;
  state.practice = state.meta.session;
  migratePracticeShape();
  document.body.classList.add('practice-active');
  if (state.practice.question.reviewing || state.practice.completedCurrent) {
    renderPractice();
    return;
  }
  const elapsed = getQuestionElapsed(state.practice.question);
  if (state.practice.mode === 'countdown' && elapsed >= 60) await handleTimeout(true);
  else { renderPractice(); startTimer(); }
}

function startTimer() {
  clearInterval(state.practiceTimer);
  state.practiceTimer = setInterval(() => {
    if (!state.practice || state.practice.question.reviewing) { clearInterval(state.practiceTimer); return; }
    const q = state.practice.question;
    const elapsed = getQuestionElapsed(q);
    const remaining = questionRemaining(q);
    const timer = $('#timer');
    if (timer) {
      timer.textContent = formatSeconds(state.practice.mode === 'countdown' ? remaining : elapsed);
      timer.classList.toggle('danger', state.practice.mode === 'countdown' && remaining <= 10);
    }
    if (state.practice.mode === 'countdown' && remaining <= 0) handleTimeout();
  }, 250);
}

async function completeQuestion() {
  const p = state.practice; if (!p || p.question.reviewing) return;
  if (!allSentencesFilled(p.question)) { showToast('三句都要排完。'); return; }
  clearInterval(state.practiceTimer);
  const elapsed = getQuestionElapsed(p.question);
  const remaining = p.mode === 'countdown' ? Math.max(0, 60 - elapsed) : 0;
  const speedBonus = p.mode === 'countdown' ? Math.floor(remaining / 10) * 5 : 0;
  const gained = 20 + speedBonus;
  if (p.mode === 'countdown' ? remaining > 0 : true) p.combo += 1; else p.combo = 0;
  p.roundXP += gained; state.meta.xp += gained;
  const record = {
    id: uid('q'), date: todayKey(), ts: Date.now(), roundId: p.roundId, questionIndex: p.index + 1,
    mode:p.mode, status:'completed', elapsed, xp:gained, combo:p.combo,
    template: normalizeTemplate(p.question.template), topics:p.question.topics, sentences:buildPlainSentences(p.question)
  };
  state.questions.push(record); await idbPut(STORE_QUESTIONS, record);
  p.answers.push(record);
  p.question.reviewing = true;
  p.question.completedRecord = record;
  p.completedCurrent = true;
  p.completedCurrentElapsed = elapsed;
  p.completedCurrentXP = gained;
  await saveMeta();
  persistSession();
  renderPractice();
}

async function nextQuestion() {
  const p = state.practice; if (!p || !p.question.reviewing) return;
  if (p.index === 19) { await finishRound(); return; }
  p.index += 1;
  p.question = createQuestion();
  p.activeSentence = 0; p.activeZone = 0;
  p.completedCurrent = false; p.completedCurrentElapsed = 0; p.completedCurrentXP = 0;
  persistSession();
  renderPractice();
  startTimer();
}

function abandonQuestion() {
  const p = state.practice; if (!p || p.question.reviewing) return;
  if (!confirm('放弃本题？本题记为放弃，连击清零。')) return;
  clearInterval(state.practiceTimer);
  const elapsed = getQuestionElapsed(p.question);
  const q = p.question;
  const record = {id:uid('q'), date:todayKey(), ts:Date.now(), roundId:p.roundId, questionIndex:p.index+1, mode:p.mode, status:'abandoned', elapsed, xp:0, combo:0, template:normalizeTemplate(q.template), topics:q.topics, sentences:buildPlainSentences(q)};
  p.answers.push(record); state.questions.push(record); idbPut(STORE_QUESTIONS, record);
  p.combo = 0;
  p.index = p.index === 19 ? 0 : p.index + 1;
  p.question = createQuestion(); p.activeSentence = 0; p.activeZone = 0;
  p.completedCurrent = false;
  persistSession(); renderPractice(); startTimer();
}

async function exitPractice() {
  const p = state.practice; if (!p) return;
  if (!confirm('退出本局练习？本局未完成题目不会继续计时，已完成题目会保留。')) return;
  clearInterval(state.practiceTimer);
  state.practice = null;
  state.meta.session = null;
  document.body.classList.remove('practice-active');
  await saveMeta();
  renderPage('today');
}

function buildPlainSentences(q) {
  const t = normalizeTemplate(q.template);
  const slotCount = t.parts.filter(p => p === '__').length;
  return [0,1,2].map(i => {
    let s = ''; let localSlot = 0;
    t.parts.forEach(part => {
      if (part === '__') {
        const global = i * slotCount + localSlot++;
        s += (q.placed[global] || []).map(tk => tk.text).join('');
      } else s += part;
    });
    return s;
  });
}

async function handleTimeout(restoring = false) {
  const p = state.practice; if (!p || p.question.reviewing || p.mode !== 'countdown') return;
  clearInterval(state.practiceTimer);
  const q = p.question;
  const record = {id:uid('q'), date:todayKey(), ts:Date.now(), roundId:p.roundId, questionIndex:p.index+1, mode:p.mode, status:'timeout', elapsed:60, xp:0, combo:0, template:normalizeTemplate(q.template), topics:q.topics, sentences:buildPlainSentences(q)};
  p.answers.push(record); state.questions.push(record); await idbPut(STORE_QUESTIONS, record);
  p.combo = 0; p.hearts -= 1;
  if (p.hearts <= 0) { state.practice=null; state.meta.session=null; document.body.classList.remove('practice-active'); await saveMeta(); renderPage('practice'); showGameOver(); return; }
  p.index = Math.min(19, p.index + 1); p.question = createQuestion(); p.activeSentence = 0; p.activeZone = 0; persistSession(); renderPractice(); startTimer();
  if (!restoring) showToast(`超时 · 剩 ${p.hearts} ❤`);
}

async function finishRound() {
  clearInterval(state.practiceTimer);
  const p = state.practice;
  const actualTarget = p.makeupTarget || todayKey();
  const dailyRecord = {date:actualTarget, checkIn:true, completedAt:Date.now(), actualPracticeDate:todayKey(), answers:p.answers, xp:p.roundXP, roundId:p.roundId};
  await idbPut(STORE_DAILY, dailyRecord);
  state.daily = state.daily.filter(d => d.date !== actualTarget); state.daily.push(dailyRecord);
  state.practice = null; state.meta.session = null; document.body.classList.remove('practice-active'); await saveMeta();
  renderPage('today');
  openResultModal(p.roundXP, p.answers, actualTarget, Boolean(p.makeupTarget));
}

function showGameOver() {
  openModal(`<div class="modal"><div class="modal-handle"></div><h3>生命用完了</h3><p class="page-subtitle">这一局从头开始。已经写过的内容会留在本地记录里。</p><div class="stat-grid"><div class="stat-card"><div class="stat-value">${state.meta.xp}</div><div class="stat-label">累计 XP</div></div><div class="stat-card"><div class="stat-value">${rankForXP(state.meta.xp).name}</div><div class="stat-label">当前段位</div></div></div><div class="modal-actions"><button class="btn ghost" data-close-modal>回到练习</button><button class="btn primary" id="restartRound">重新开始</button></div></div>`);
  $('#restartRound')?.addEventListener('click', () => {closeModal(); startRound();});
}

function openResultModal(xp, answers, date, isMakeup) {
  const completed = answers.filter(a => a.status === 'completed').length;
  const avg = answers.length ? Math.round(answers.reduce((s,a) => s+a.elapsed, 0) / answers.length) : 0;
  openModal(`<div class="modal"><div class="modal-handle"></div><h3>${isMakeup ? '补签完成' : '今日打卡完成'} 🎉</h3><p class="page-subtitle">${date} · ${isMakeup ? '额外一局已完成' : '20 题完成，自动打卡'}</p><div class="stat-grid"><div class="stat-card"><div class="stat-value">+${xp}</div><div class="stat-label">本局 XP</div></div><div class="stat-card"><div class="stat-value">${completed}</div><div class="stat-label">完成题数</div></div><div class="stat-card"><div class="stat-value">${avg}s</div><div class="stat-label">平均单题</div></div><div class="stat-card"><div class="stat-value">${rankForXP(state.meta.xp).name}</div><div class="stat-label">当前段位</div></div></div><div class="modal-actions"><button class="btn primary" data-close-modal>查看今日</button><button class="btn ghost" id="goStats">去统计</button></div></div>`);
  $('#goStats')?.addEventListener('click', () => {closeModal(); renderPage('stats');});
}

function openRerollModal() {
  openModal(`<div class="modal"><div class="modal-handle"></div><h3>重新出题</h3><p class="page-subtitle">只换你勾选的语料。</p>${[['topics','主题词'],['verbs','动词'],['metaphors','比喻词'],['effects','效果']].map(([k,l])=>`<label class="check-row"><span>${l}</span><input type="checkbox" data-reroll="${k}" checked></label>`).join('')}<div class="reroll-note">通用语块属于当前题临时内容，重新出题会一起清空。</div><div class="modal-actions"><button class="btn ghost" data-close-modal>取消</button><button class="btn primary" id="confirmReroll">重新抽取</button></div></div>`);
  $('#confirmReroll')?.addEventListener('click', () => {
    const keys = $$('[data-reroll]', $('#modalRoot')).filter(x => x.checked).map(x => x.dataset.reroll);
    const reroll = {}; keys.forEach(k => reroll[k] = true);
    const p = state.practice;
    p.question = createQuestion(p.question, reroll);
    p.activeSentence = 0; p.activeZone = 0;
    closeModal(); persistSession(); renderPractice(); startTimer();
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

function templateSlotEditorHTML(template, text) {
  const parts = parseTemplateParts(text);
  const count = parts.filter(x => x === '__').length;
  if (!count) return '<div class="slot-editor-empty">用 __ 表示语块槽位。</div>';
  const inferred = inferSlotDefaults(parts);
  const current = Array.isArray(template?.slotDefaults) && template.slotDefaults.length === count ? template.slotDefaults : inferred;
  return `<div class="slot-rule-list">${Array.from({length: count}, (_, i) => `<label class="slot-rule"><span><b>空 ${i + 1}</b><small>${current[i] !== false ? '默认 1 个语块' : '默认可放多个'}</small></span><input type="checkbox" data-slot-default="${i}" ${current[i] !== false ? 'checked' : ''}></label>`).join('')}</div>`;
}

function renderCorpus() {
  const items = corpus(state.corpusTab);
  const groups = [...new Set(items.map(x => x.group || '未分类'))];
  $('#main').innerHTML = `<div class="page corpus-page">
    <section class="page-head"><div><div class="eyebrow">管理</div><h1>语料库</h1></div><button class="btn primary sm" id="addCorpus">＋ 新增</button></section>
    <div class="tabs">${Object.entries(CATEGORY_LABELS).map(([k,v]) => `<button class="tab ${state.corpusTab===k?'active':''}" data-corpus-tab="${k}">${v}</button>`).join('')}</div>
    <div class="corpus-toolbar"><span>${CATEGORY_LABELS[state.corpusTab]} · ${items.length} 条</span><div><button class="btn sm ghost" id="resetCategory">重置本类</button><button class="btn sm danger" id="clearCategory">清空</button></div></div>
    ${groups.map(g => `<section class="corpus-group"><div class="corpus-group-title">${escapeHTML(g)}</div>${items.filter(x => (x.group||'未分类')===g).map(x => `<article class="corpus-item"><div class="corpus-text">${escapeHTML(x.text)}</div><div class="corpus-actions"><span class="corpus-meta">${x.enabled === false ? '停用' : '启用'}</span><div><button class="btn sm ghost" data-edit-id="${x.id}">编辑</button><button class="btn sm danger" data-delete-id="${x.id}">删除</button></div></div></article>`).join('')}</section>`).join('') || '<div class="empty card">本类为空。可以新增，也可以恢复内置数据。</div>'}
  </div>`;
  $$('[data-corpus-tab]').forEach(b => b.addEventListener('click', () => {state.corpusTab=b.dataset.corpusTab; renderCorpus();}));
  $('#addCorpus').addEventListener('click', () => openCorpusEditor());
  $$('[data-edit-id]').forEach(b => b.addEventListener('click', () => openCorpusEditor(state.corpus.find(x => x.id === b.dataset.editId))));
  $$('[data-delete-id]').forEach(b => b.addEventListener('click', async () => { if (!confirm('删除这条语料？')) return; await idbDelete(STORE_CORPUS, b.dataset.deleteId); state.corpus=state.corpus.filter(x=>x.id!==b.dataset.deleteId); renderCorpus(); showToast('已删除。'); }));
  $('#resetCategory').addEventListener('click', resetCurrentCategory);
  $('#clearCategory').addEventListener('click', clearCurrentCategory);
}

function openCorpusEditor(item = null) {
  const isTemplate = state.corpusTab === 'templates';
  const initialTemplate = item ? normalizeTemplate(item) : null;
  openModal(`<div class="modal"><div class="modal-handle"></div><h3>${item ? '编辑' : '新增'}${CATEGORY_LABELS[state.corpusTab]}</h3>
    <div class="col modal-form">
      <label class="small muted">分组</label><input id="corpusGroup" class="input" value="${escapeHTML(item?.group||'自定义')}">
      <label class="small muted">文本</label><textarea id="corpusText" class="textarea" ${isTemplate?'placeholder="例如：坚持__ __，__"':''}>${escapeHTML(item?.text||'')}</textarea>
      ${isTemplate ? `<div class="template-help">逗号前默认 1 个语块；逗号后默认不限。下面可单独调整。</div><div id="slotRules">${templateSlotEditorHTML(initialTemplate, item?.text||'')}</div>` : ''}
      <label class="small muted">启用</label><div class="row"><div id="corpusEnabled" class="switch ${item?.enabled!==false?'on':''}"></div><span class="small muted">练习时参与抽取</span></div>
    </div>
    <div class="modal-actions"><button class="btn ghost" data-close-modal>取消</button><button class="btn primary" id="saveCorpus">保存</button></div>
  </div>`);

  if (isTemplate) {
    $('#corpusText').addEventListener('input', () => { $('#slotRules').innerHTML = templateSlotEditorHTML(initialTemplate, $('#corpusText').value.trim()); });
  }
  $('#saveCorpus').addEventListener('click', async () => {
    const text = $('#corpusText').value.trim();
    const group = $('#corpusGroup').value.trim() || '自定义';
    if (!text) {showToast('请输入文本。'); return;}
    const record = {id:item?.id || uid('template'), category:state.corpusTab, group, text, enabled:$('#corpusEnabled').classList.contains('on')};
    if (isTemplate) {
      if (!text.includes('__')) {showToast('句式至少要包含一个“__”空位。'); return;}
      record.parts = parseTemplateParts(text);
      record.slotDefaults = record.parts.filter(x=>x==='__').map((_, i) => {
        const box = $(`[data-slot-default="${i}"]`, $('#modalRoot'));
        return box ? box.checked : true;
      });
    }
    await idbPut(STORE_CORPUS, record);
    state.corpus = state.corpus.filter(x => x.id !== record.id); state.corpus.push(record);
    closeModal(); renderCorpus(); showToast('已保存，下一题即可抽取。');
  });
  $('#corpusEnabled').addEventListener('click', e => e.currentTarget.classList.toggle('on'));
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
  if (state.practice && page !== 'practice') return;
  state.page=page; $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
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

async function migrateBuiltinTemplateCorpus() {
  const legacy = {
    t1: ['以__为__，__（动词/效果）__'],
    t2: ['坚持__，__（动词/效果）__', '坚持__，__'],
    t3: ['__（动词）__，__（动词）__', '__，__']
  };
  let changed = false;
  for (const item of corpus('templates')) {
    if (!legacy[item.id]) continue;
    if (legacy[item.id].includes(item.text)) {
      const next = DEFAULT_CORPUS.templates.find(x => x.id === item.id);
      if (next) { await idbPut(STORE_CORPUS, cloneData(next)); changed = true; }
    }
  }
  if (changed) await loadAll();
}

async function boot(){
  try{
    await openDB(); await seedIfNeeded(); await loadAll(); await migrateBuiltinTemplateCorpus(); applyTheme(); await restoreSession();
    if(!state.practice) renderPage('today'); else renderPage('practice');
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js?v=5', {updateViaCache:'none'}).catch(err=>console.warn('SW registration failed',err)); }
  }catch(err){
    console.error('Startup failed:', err);
    const reason = err?.name === 'SecurityError'
      ? '当前浏览环境禁止本地存储。'
      : (err?.message || '应用启动失败。');
    document.querySelector('#main').innerHTML=`<div class="card startup-error"><h2>启动失败</h2><p class="muted">${escapeHTML(reason)}</p><p class="muted small">请确认使用 https:// 网页打开，而不是 file:// 本地文件。如果这是刚更新的版本，可以点击重试。</p><button class="btn primary btn-block" id="retryBoot">重试</button></div>`;
    $('#retryBoot')?.addEventListener('click',()=>location.reload());
  }
}


boot();
