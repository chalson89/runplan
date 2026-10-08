export const VARIANT = 'v1' as 'v1' | 'v2'; // 'v1' = 여러 플랜(확장안), 'v2' = SPEC 기준(거리별 1개)

/* ---------- 타입 ---------- */
export type DistKey = '10k' | 'half' | 'full';
export type Dist = { label: string; km: number; cls: string; topic: string };
export type Level = '입문' | '초급' | '중급';
export type Plan = {
  id: string; dist: DistKey; level: Level; goal: '완주' | '기록'; weeks: number; runDays: number; hours: [number, number];
  longStart: number; longPeak: number; prereq: number; walkRun?: boolean; tempo?: boolean; halfRace?: boolean;
  title: string; coach: string; summary: string; forWho: string[]; features: string[];
};
export type DayType = 'rest' | 'easy' | 'mid' | 'tempo' | 'long' | 'cross' | 'shake' | 'sim' | 'race';
export type Day = { type: DayType; km?: number | null };
export type WeekKind = 'build' | 'recovery' | 'taper' | 'race' | 'sim';
export type Week = { n: number; kind: WeekKind; days: Day[]; total: number };
export type FilterKey = 'dist' | 'level' | 'len' | 'days';
export type SortKey = 'rec' | 'short' | 'long' | 'easy';
// 목록 화면 상태 (필터 · 검색어 · 정렬)
export type ListState = { filters: Record<FilterKey, string[]>; q: string; sort: SortKey };
export type FilterDef = { key: FilterKey; title: string; opts: [string, string][]; test: (p: Plan, v: string) => boolean };
export type Progress = { total: number; done: number; pct: number };
// API 루틴 응답 (서버 Routine · RoutineSummary 스키마와 같은 모양)
export type RoutineForm = { planId: string; ability: number; age: number; height: number; weight: number; time: string };
export type ApiRoutine = { id: string; planId: string; start: string; from: string; form: RoutineForm; done: string[]; progress: Progress };
export type ApiRoutineSummary = ApiRoutine & { end: string; status: 'active' | 'done' | 'stopped'; km: number };
// 화면 루틴 상태 (skip = 1주차에서 루틴을 만들기 전 일수)
export type Routine = { id: string; plan: Plan; start: Date; skip: number; form: RoutineForm; done: Set<string> };
export type Run = { date: Date; type: DayType; km: number };
export type QuizKey = 'dist' | 'ability' | 'days' | 'exp' | 'goal' | 'len';
export type QuizOpt = { v: string | number; ico: string; b: string; s: string };
export type Question = { key: QuizKey; v1?: boolean; title: string; sub: string; opts: QuizOpt[] };
export type QuizAnswers = { dist: DistKey | 'unsure'; ability: number; days?: number; exp: string; goal?: string; len?: string };
export type Recommendation = { target: DistKey; warning: string; list: { p: Plan; s: number; why: string[] }[] };

/* ---------- 데이터 ---------- */
export const DIST: Record<DistKey, Dist> = {
  '10k': {label:'10K', km:10, cls:'bg-10k', topic:'10K는'},
  'half':{label:'하프', km:21.1, cls:'bg-half', topic:'하프는'},
  'full':{label:'풀코스', km:42.2, cls:'bg-full', topic:'풀코스는'}
};
export const LEVELS: Level[] = ['입문','초급','중급'];

const PLANS_V1: Plan[] = [
  {id:'10k-walkrun', dist:'10k', level:'입문', goal:'완주', weeks:10, runDays:3, hours:[2,3], longStart:3, longPeak:8, prereq:0, walkRun:true,
   title:'10K 첫 완주 · 걷기와 달리기 섞어 시작', coach:'런플랜 코치팀',
   summary:'아직 쉬지 않고 오래 달리기 어려운 분을 위한 플랜입니다. 달리기와 걷기를 번갈아 하며 시작해, 10주 뒤 10K를 끝까지 달리는 것이 목표입니다.',
   forWho:['운동을 오랜만에 다시 시작하는 분','쉬지 않고 3km를 달리기 어려운 분','주 3일 정도만 시간을 낼 수 있는 분'],
   features:['초반 4주는 달리기 1분 · 걷기 1분 반복','주차가 지날수록 달리기 시간을 늘림','3주마다 거리를 줄이는 회복 주']},
  {id:'10k-novice', dist:'10k', level:'입문', goal:'완주', weeks:8, runDays:4, hours:[3,4], longStart:4, longPeak:9, prereq:3,
   title:'10K 첫 완주', coach:'런플랜 코치팀',
   summary:'연속 3km 정도를 달릴 수 있다면 8주 만에 첫 10K를 완주할 수 있도록 짠 기본 플랜입니다.',
   forWho:['첫 10K 대회를 준비하는 분','연속 3km 이상 달릴 수 있는 분'],
   features:['주 4일 달리기 + 1일 크로스트레이닝','토요일 롱런을 4km에서 9km까지 늘림','마지막 2주는 테이퍼']},
  {id:'10k-improve', dist:'10k', level:'초급', goal:'기록', weeks:8, runDays:4, hours:[4,5], longStart:6, longPeak:12, prereq:5, tempo:true,
   title:'10K 기록 단축', coach:'런플랜 코치팀',
   summary:'10K 완주 경험이 있는 분이 기록을 줄이도록 주 1회 페이스런을 넣은 플랜입니다.',
   forWho:['10K를 완주해 본 분','기록을 줄여 보고 싶은 분'],
   features:['수요일 페이스런 (약간 힘든 속도)','롱런 최대 12km','마지막 2주는 테이퍼']},
  {id:'half-novice', dist:'half', level:'입문', goal:'완주', weeks:12, runDays:4, hours:[3,5], longStart:6, longPeak:19, prereq:5,
   title:'하프 첫 완주', coach:'런플랜 코치팀',
   summary:'연속 5km를 달릴 수 있다면 12주 동안 하프 마라톤 완주를 준비하는 기본 플랜입니다.',
   forWho:['첫 하프 대회를 준비하는 분','연속 5km 이상 달릴 수 있는 분'],
   features:['주 4일 달리기 + 1일 크로스트레이닝','롱런 6km → 19km','3주마다 회복 주, 마지막 3주 테이퍼']},
  {id:'half-relaxed', dist:'half', level:'입문', goal:'완주', weeks:16, runDays:3, hours:[3,4], longStart:5, longPeak:19, prereq:5,
   title:'하프 첫 완주 · 여유형', coach:'런플랜 코치팀',
   summary:'주 3일만 달리면서 16주에 걸쳐 천천히 거리를 늘리는 하프 플랜입니다.',
   forWho:['평일에 시간이 부족한 분','부상이 걱정돼 천천히 늘리고 싶은 분'],
   features:['주 3일 달리기 + 1일 크로스트레이닝','거리 증가 폭이 작음','3주마다 회복 주']},
  {id:'half-improve', dist:'half', level:'중급', goal:'기록', weeks:12, runDays:5, hours:[5,7], longStart:10, longPeak:21, prereq:10, tempo:true,
   title:'하프 기록 단축', coach:'런플랜 코치팀',
   summary:'하프 완주 경험이 있는 분이 기록을 줄이도록 페이스런과 긴 롱런을 넣은 플랜입니다.',
   forWho:['하프를 완주해 본 분','주 5일 달릴 수 있는 분'],
   features:['수요일 페이스런','롱런 최대 21km','마지막 3주 테이퍼']},
  {id:'full-novice', dist:'full', level:'입문', goal:'완주', weeks:18, runDays:4, hours:[4,7], longStart:10, longPeak:32, prereq:10, halfRace:true,
   title:'풀코스 첫 완주', coach:'런플랜 코치팀 · Hal Higdon Novice 1 구조 참고',
   summary:'주 4일 달리기와 토요일 롱런을 중심으로 18주 동안 첫 풀코스 완주를 준비합니다. 롱런은 꼭 지키고, 나머지 훈련은 컨디션에 따라 가끔 빠져도 괜찮습니다.',
   forWho:['첫 풀코스에 도전하는 분','연속 10km 이상 달릴 수 있는 분','주 4일, 주말 오전 2 ~ 4시간을 낼 수 있는 분'],
   features:['월 · 금 휴식, 일요일 크로스트레이닝','롱런 10km → 32km, 3주마다 회복 주','8주차에 하프 거리 모의 레이스','마지막 3주 테이퍼']},
  {id:'full-relaxed', dist:'full', level:'입문', goal:'완주', weeks:20, runDays:4, hours:[4,7], longStart:8, longPeak:32, prereq:10, halfRace:true,
   title:'풀코스 첫 완주 · 여유형', coach:'런플랜 코치팀',
   summary:'첫 풀코스를 20주에 걸쳐 조금 더 천천히 준비하는 플랜입니다.',
   forWho:['첫 풀코스를 여유 있게 준비하고 싶은 분','부상 경험이 있는 분'],
   features:['롱런 8km에서 시작','주간 거리 증가 폭이 작음','중간에 하프 거리 모의 레이스']},
  {id:'full-steady', dist:'full', level:'초급', goal:'완주', weeks:18, runDays:5, hours:[5,8], longStart:13, longPeak:32, prereq:13, halfRace:true,
   title:'풀코스 완주 · 탄탄하게', coach:'런플랜 코치팀',
   summary:'하프를 완주해 봤다면 주 5일 달리기로 풀코스를 좀 더 여유 있게 완주하도록 준비합니다.',
   forWho:['하프 완주 경험이 있는 분','주 5일 달릴 수 있는 분'],
   features:['주 5일 달리기 + 1일 크로스트레이닝','롱런 13km → 32km','중간에 하프 모의 레이스']},
  {id:'full-improve', dist:'full', level:'중급', goal:'기록', weeks:18, runDays:5, hours:[6,9], longStart:16, longPeak:35, prereq:16, tempo:true,
   title:'풀코스 기록 단축', coach:'런플랜 코치팀',
   summary:'풀코스 완주 경험이 있는 분이 기록을 줄이도록 페이스런과 최대 35km 롱런을 넣은 플랜입니다.',
   forWho:['풀코스를 완주해 본 분','주 5일 이상 달릴 수 있는 분'],
   features:['수요일 페이스런','롱런 최대 35km','마지막 3주 테이퍼']}
];

// SPEC 기준: 거리별 1개, 모두 같은 주간 배치(주 4일 달리기 + 크로스 1일), 마지막 3주 테이퍼, 속도 훈련 없음
const PLANS_V2: Plan[] = [
  {id:'10k', dist:'10k', level:'입문', goal:'완주', weeks:8, runDays:4, hours:[3,4], longStart:4, longPeak:9, prereq:0,
   title:'10K 첫 완주', coach:'런플랜 코치팀',
   summary:'8주 동안 첫 10K 완주를 준비합니다. 아직 오래 달리기 어렵다면 걷기를 섞어도 괜찮습니다.',
   forWho:['첫 10K 대회를 준비하는 분','운동을 새로 시작하는 분'],
   features:['월 · 금 휴식, 일요일 크로스트레이닝','롱런 4km → 9km, 3주마다 회복 주','마지막 3주 테이퍼']},
  {id:'half', dist:'half', level:'입문', goal:'완주', weeks:12, runDays:4, hours:[3,5], longStart:6, longPeak:19, prereq:5,
   title:'하프 첫 완주', coach:'런플랜 코치팀',
   summary:'연속 5km를 달릴 수 있다면 12주 동안 하프 마라톤 완주를 준비합니다.',
   forWho:['첫 하프 대회를 준비하는 분','연속 5km 이상 달릴 수 있는 분'],
   features:['월 · 금 휴식, 일요일 크로스트레이닝','롱런 6km → 19km, 3주마다 회복 주','마지막 3주 테이퍼']},
  {id:'full', dist:'full', level:'입문', goal:'완주', weeks:18, runDays:4, hours:[4,7], longStart:10, longPeak:32, prereq:10, halfRace:true,
   title:'풀코스 첫 완주', coach:'런플랜 코치팀 · Hal Higdon Novice 1 구조 참고',
   summary:'주 4일 달리기와 토요일 롱런을 중심으로 18주 동안 첫 풀코스 완주를 준비합니다. 롱런은 꼭 지키고, 나머지 훈련은 컨디션에 따라 가끔 빠져도 괜찮습니다.',
   forWho:['첫 풀코스에 도전하는 분','연속 10km 이상 달릴 수 있는 분'],
   features:['월 · 금 휴식, 일요일 크로스트레이닝','롱런 10km → 32km, 3주마다 회복 주','8주차에 하프 거리 모의 레이스','마지막 3주 테이퍼']}
];
export const PLANS = VARIANT==='v2' ? PLANS_V2 : PLANS_V1;
export const findPlan = (id: string) => PLANS.find(x=>x.id===id);

export const TYPE: Record<DayType, {label: string; color: string; guide: string}> = {
  rest:  {label:'휴식', color:'var(--text-3)', guide:'쉬는 것도 훈련이에요. 원하면 가볍게 산책하세요.'},
  easy:  {label:'이지런', color:'var(--d10k)', guide:'대화할 수 있을 만큼 편한 속도로'},
  mid:   {label:'미드런', color:'var(--dhalf)', guide:'대화할 수 있을 만큼 편한 속도로'},
  tempo: {label:'페이스런', color:'var(--dfull)', guide:'중간 구간만 약간 힘든 속도로'},
  long:  {label:'롱런', color:'var(--accent)', guide:'편한 속도로, 힘들면 걸어도 괜찮아요 · 롱런은 꼭 지키기'},
  cross: {label:'크로스', color:'var(--recovery)', guide:'수영 · 자전거 · 걷기 중 하나, 숨이 차지 않는 강도로'},
  shake: {label:'가벼운 조깅', color:'var(--d10k)', guide:'대회 전날, 몸만 가볍게 풀어요'},
  sim:   {label:'모의 레이스', color:'var(--race)', guide:'하프 거리를 끝까지 일정한 속도로'},
  race:  {label:'대회', color:'var(--race)', guide:'초반엔 일부러 천천히 출발하세요'}
};
export const DOW = ['월','화','수','목','금','토','일'];

/* ---------- 플랜 일정 생성 ---------- */
const r5 = (x: number) => Math.max(1, Math.round(x*2)/2);
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a,x));

function template(p: Plan): DayType[]{
  const mid: DayType = p.tempo ? 'tempo' : 'mid';
  if(p.runDays===3) return ['rest','easy','rest',mid,'rest','long','cross'];
  if(p.runDays===5) return ['rest','easy',mid,'easy','easy','long','cross'];
  return ['rest','easy',mid,'easy','rest','long','cross'];
}

const schedCache = new Map<string, Week[]>();
export function buildSchedule(p: Plan): Week[]{
  if(schedCache.has(p.id)) return schedCache.get(p.id)!;
  const taper = (VARIANT==='v1' && p.dist==='10k') ? 2 : 3;
  const build = p.weeks - taper;
  const tpl = template(p);
  const simWeek = p.halfRace ? Math.round(p.weeks*0.45) : -1;
  const weeks: Week[] = [];
  for(let w=1; w<=p.weeks; w++){
    let kind: WeekKind = 'build', long: number;
    if(w<=build){
      long = p.longStart + (p.longPeak-p.longStart)*(w-1)/Math.max(1,build-1);
      if(w%3===0 && w<build){ kind='recovery'; long *= 0.75; }
    } else if(w<p.weeks){
      kind='taper';
      const t = w-build;
      long = p.longPeak * (taper===3 ? (t===1?0.7:0.5) : 0.6);
    } else { kind='race'; long = p.longPeak*0.3; }
    long = r5(long);
    const easy = r5(clamp(long*0.4, 3, 10));
    const midKm = r5(clamp(long*0.55, 3, 16));
    let days = tpl.map((t,i)=>{
      const d: Day = {type:t, km:null};
      if(t==='easy') d.km = (p.runDays===5 && i===4) ? r5(easy*0.7) : easy;
      if(t==='mid'||t==='tempo') d.km = midKm;
      if(t==='long') d.km = long;
      return d;
    });
    if(w===simWeek && kind==='build'){ days[5] = {type:'sim', km:21.1}; kind='sim'; }
    if(kind==='race'){
      days = [
        {type:'rest'}, {type:'easy',km:r5(easy*0.8)}, {type: p.tempo?'tempo':'mid', km:r5(easy)},
        {type:'easy',km:r5(easy*0.6)}, {type:'rest'}, {type:'shake',km:2}, {type:'race',km:DIST[p.dist].km}
      ];
    }
    const total = days.reduce((s,d)=> s + ((d.km && d.type!=='cross') ? d.km : 0), 0);
    weeks.push({n:w, kind, days, total:Math.round(total*10)/10});
  }
  schedCache.set(p.id, weeks);
  return weeks;
}

/* ---------- 목록 필터 ---------- */
export const LEN: Record<string, {label: string; test: (w: number) => boolean}> = {short:{label:'8주 이하', test:w=>w<=8}, mid:{label:'9 ~ 12주', test:w=>w>=9&&w<=12}, long:{label:'13주 이상', test:w=>w>=13}};
const FILTER_ALL: FilterDef[] = [
  {key:'dist', title:'목표 거리', opts:Object.entries(DIST).map(([k,v])=>[k,v.label]), test:(p,v)=>p.dist===v},
  {key:'level', title:'수준', opts:LEVELS.map(l=>[l,l]), test:(p,v)=>p.level===v},
  {key:'len', title:'기간', opts:Object.entries(LEN).map(([k,v])=>[k,v.label]), test:(p,v)=>LEN[v].test(p.weeks)},
  {key:'days', title:'주당 달리는 날', opts:[['3','주 3일'],['4','주 4일'],['5','주 5일']], test:(p,v)=>String(p.runDays)===v}
];
export const FILTER_DEF = VARIANT==='v2' ? FILTER_ALL.filter(f=>f.key==='dist') : FILTER_ALL;

export function applyFilters(state: Pick<ListState, 'filters' | 'q'>, exceptKey?: FilterKey){
  const q = state.q.trim().toLowerCase();
  return PLANS.filter(p=>{
    for(const f of FILTER_DEF){
      if(f.key===exceptKey) continue;
      const sel = state.filters[f.key];
      if(sel.length && !sel.some(v=>f.test(p,v))) return false;
    }
    if(q && !(p.title+p.summary+DIST[p.dist].label+p.level).toLowerCase().includes(q)) return false;
    return true;
  });
}

export const kindTagInfo = (w: Week) => w.kind==='recovery' ? ['recovery','회복 주']
  : w.kind==='taper' ? ['taper','테이퍼 주']
  : w.kind==='race' ? ['race','대회 주']
  : w.kind==='sim' ? ['race','모의 레이스'] : null;

/* ---------- 입력 폼 ---------- */
export const TIMES: [string, string][] = [['새벽','5~7시'],['아침','7~9시'],['점심','12~14시'],['저녁','18~21시'],['밤','21시 이후']];
export const ABILITY: [number, string][] = [[0,'3km 미만'],[3,'3km'],[5,'5km'],[10,'10km 이상']];

// 수준 부족 시 (AC-05): 같은 거리의 쉬운 플랜 → 없으면 더 짧은 거리
export function checkPrereq(p: Plan, ability: number){
  if(p.prereq <= ability) return null;
  const sameDist = PLANS.filter(x=>x.dist===p.dist && x.prereq<=ability);
  if(VARIANT==='v1' && sameDist.length){
    return {msg:`'${p.title}' 플랜은 연속 ${p.prereq}km 이상 달릴 수 있어야 함 — '${sameDist[0].title}' 플랜을 권장함`, recId:sameDist[0].id};
  }
  const order = ['10k','half','full'];
  let rec: Plan | null | undefined = null;
  for(let i=order.indexOf(p.dist)-1; i>=0 && !rec; i--){ rec = PLANS.find(x=>x.dist===order[i] && x.prereq<=ability); }
  if(!rec) rec = PLANS.find(x=>x.dist==='10k')!;
  return {msg:`${DIST[p.dist].topic} 연속 ${Math.min(...PLANS.filter(x=>x.dist===p.dist).map(x=>x.prereq))}km 이상 달릴 수 있어야 함 — ${DIST[rec.dist].label}를 권장함`, recId:rec.id};
}

/* ---------- 내 루틴 ---------- */
// skip = 1주차 월요일부터 루틴을 만든 날 전까지의 일수. 그 날들은 플랜에 없음
export const beforeFrom = (routine: {skip?: number}, wn: number, i: number) => wn===1 && i < (routine.skip || 0);
// 오늘보다 뒤인 날은 아직 완료 체크할 수 없음 (start = 1주차 월요일 Date)
export const afterToday = (start: Date, wn: number, i: number) => { const t = new Date(); t.setHours(0,0,0,0); return addDays(start, (wn-1)*7+i) > t; };
export const skipOf =(start: string, from: string) => Math.round((new Date(`${from}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime())/86400000);

// 완료한 날들 [{date, type, km}] (크로스트레이닝 등 거리 없는 날은 km 0)
export function completedRuns(routine: {plan: Plan; start: Date; done: Iterable<string>}): Run[]{
  const sched = buildSchedule(routine.plan);
  return [...routine.done].map(k=>{
    const [wn, i] = k.split('-').map(Number), day = sched[wn-1]?.days[i];
    return day && {date:addDays(routine.start, (wn-1)*7+i), type:day.type, km:day.km || 0};
  }).filter(r=>r!==undefined);
}
export const sumKm = (runs: Run[]) => Math.round(runs.reduce((a,r)=>a+r.km, 0)*10)/10;

// API 루틴 응답 → 화면 루틴 상태
export const routineFromApi = (d: ApiRoutine): Routine => ({id:d.id, plan:findPlan(d.planId)!, start:new Date(`${d.start}T00:00:00`),
  skip:skipOf(d.start, d.from), form:d.form, done:new Set(d.done)});

export function routineStats(routine: {plan: Plan; done: Set<string>; skip?: number}): Progress{
  const sched = buildSchedule(routine.plan);
  let total = 0;
  sched.forEach(w=>w.days.forEach((d,i)=>{ if(d.type!=='rest' && !beforeFrom(routine, w.n, i)) total++; }));
  const done = routine.done.size;
  return {total, done, pct: total ? Math.round(done/total*100) : 0};
}

/* ---------- 퀴즈 ---------- */
const QUESTIONS_ALL: Question[] = [
  {key:'dist', title:'어떤 거리를 목표로 하나요?', sub:'아직 정하지 못했다면 마지막 항목을 고르세요.', opts:[
    {v:'10k', ico:'🏃', b:'10K', s:'첫 대회로 많이 도전해요'},
    {v:'half', ico:'🏅', b:'하프 (21.1km)', s:'한 단계 더 도전'},
    {v:'full', ico:'🏆', b:'풀코스 (42.2km)', s:'마라톤 완주'},
    {v:'unsure', ico:'🤔', b:'아직 모르겠어요', s:'내 수준에 맞게 추천받기'}]},
  {key:'ability', title:'지금 쉬지 않고 얼마나 달릴 수 있나요?', sub:'걷지 않고 계속 달릴 수 있는 거리를 골라 주세요.', opts:[
    {v:0, ico:'🚶', b:'3km 미만', s:'1~2km도 힘들어요'},
    {v:3, ico:'👟', b:'3km 정도', s:'20분쯤 달릴 수 있어요'},
    {v:5, ico:'💪', b:'5km 정도', s:'30분 넘게 달릴 수 있어요'},
    {v:10, ico:'🔥', b:'10km 이상', s:'1시간 가까이 달릴 수 있어요'}]},
  {key:'days', v1:true, title:'일주일에 며칠 달릴 수 있나요?', sub:'크로스트레이닝(수영 · 자전거 · 걷기) 하루는 따로예요.', opts:[
    {v:3, ico:'3', b:'주 3일', s:'바쁜 일정'},
    {v:4, ico:'4', b:'주 4일', s:'가장 많이 선택해요'},
    {v:5, ico:'5', b:'주 5일 이상', s:'시간 여유가 있어요'}]},
  {key:'exp', title:'대회에 나가 본 적이 있나요?', sub:'', opts:[
    {v:'none', ico:'🌱', b:'처음이에요', s:''},
    {v:'10k', ico:'🥉', b:'10K까지 완주', s:''},
    {v:'half', ico:'🥈', b:'하프 이상 완주', s:''},
    {v:'full', ico:'🥇', b:'풀코스 완주', s:''}]},
  {key:'goal', v1:true, title:'이번 목표는 무엇인가요?', sub:'', opts:[
    {v:'완주', ico:'🎯', b:'끝까지 완주하기', s:'다치지 않고 결승선 통과'},
    {v:'기록', ico:'⏱️', b:'기록 줄이기', s:'지난 기록보다 빠르게'}]},
  {key:'len', v1:true, title:'준비 기간은 어느 정도가 좋나요?', sub:'', opts:[
    {v:'short', ico:'⚡', b:'짧고 집중적으로', s:''},
    {v:'normal', ico:'📅', b:'보통', s:''},
    {v:'long', ico:'🐢', b:'여유 있게', s:'천천히 늘리고 싶어요'}]}
];
export const QUESTIONS = VARIANT==='v2' ? QUESTIONS_ALL.filter(q=>!q.v1) : QUESTIONS_ALL;

export function recommend(a: QuizAnswers): Recommendation{
  const order: DistKey[] = ['10k','half','full'];
  let target = a.dist, warning = '';
  if(target==='unsure') target = a.ability>=10 && (a.exp==='half'||a.exp==='full') ? 'full' : a.ability>=5 ? 'half' : '10k';
  // 수준 부족 시 더 짧은 거리 권장 (SPEC AC-05)
  const minPrereq = (d: DistKey) => Math.min(...PLANS.filter(p=>p.dist===d).map(p=>p.prereq));
  const asked = target;
  while(target!=='10k' && minPrereq(target) > a.ability){
    target = order[order.indexOf(target)-1];
    warning = `${DIST[asked].topic} 쉬지 않고 ${minPrereq(asked)}km 이상 달릴 수 있어야 시작할 수 있어요. 지금은 ${DIST[target].label}부터 준비하는 걸 권장해요.`;
  }
  const userLevel = a.exp==='none' ? '입문' : a.exp==='10k' ? (a.ability>=5?'초급':'입문') : a.exp==='half' ? '초급' : '중급';
  const scored = PLANS.filter(p=>p.prereq<=a.ability).map(p=>{
    let s = 0; const why: string[] = [];
    if(p.dist===target){ s+=60; why.push(`목표 거리 ${DIST[p.dist].label}에 맞는 플랜이에요.`); }
    if(a.days!==undefined){
      if(p.runDays===a.days){ s+=25; why.push(`주 ${a.days}일 달리는 일정과 딱 맞아요.`); }
      else if(Math.abs(p.runDays-a.days)===1){ s+=10; }
      if(p.runDays>a.days) s-=15;
    }
    if(a.goal!==undefined && p.goal===a.goal){ s+=20; why.push(a.goal==='완주'?'무리 없이 완주하는 데 초점을 둬요.':'기록을 줄이는 페이스런이 들어 있어요.'); }
    if(VARIANT==='v1'){
      const ld = Math.abs(LEVELS.indexOf(p.level)-LEVELS.indexOf(userLevel));
      s += ld===0 ? 20 : ld===1 ? 5 : -10;
      if(ld===0) why.push(`지금 경험에 맞는 ${p.level} 수준이에요.`);
    } else {
      why.push('주 4일 달리기 + 크로스트레이닝 1일로 무리 없이 거리를 늘려요.');
    }
    if(a.len!==undefined){
      const sameDist = PLANS.filter(x=>x.dist===p.dist).map(x=>x.weeks);
      const minW = Math.min(...sameDist), maxW = Math.max(...sameDist);
      if(a.len==='short' && p.weeks===minW) { s+=10; why.push('같은 거리 플랜 중 기간이 가장 짧아요.'); }
      if(a.len==='long' && p.weeks===maxW) { s+=10; why.push('같은 거리 플랜 중 가장 여유 있게 늘려요.'); }
      if(a.len==='normal' && p.weeks!==minW && p.weeks!==maxW) s+=5;
    }
    if(p.prereq) why.push(`시작 조건(연속 ${p.prereq}km)을 이미 충족해요.`);
    return {p, s, why};
  }).sort((x,y)=>y.s-x.s);
  return {target, warning, list:scored};
}

/* ---------- 날짜 유틸 ---------- */
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
export const mondayOf = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };
export const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
export const md = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`;
export const ymd = (d: Date) => `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} (${DOW[(d.getDay()+6)%7]})`;
