import { DIST, TYPE, type Day, type Plan } from './plans';

/* ---------- 타입 ---------- */
// 동작 한 줄 (이름 · 양 · 설명)
export type Move = { name: string; amt: string; desc: string };
// 하루 훈련 상세: 준비운동 · 본 훈련 · 급수 · 보급 · 정리운동
export type DayDetail = { warm?: Move[]; main: Move[]; fuel?: Move[]; cool?: Move[]; coolHint?: string; note?: string };
type Pt = [number, number];
export type Pose = Record<'h' | 's' | 'p' | 'fk' | 'ff' | 'bk' | 'bf' | 'fe' | 'fh' | 'be' | 'bh', Pt>;
export type Art = { frames: Pose[]; sp?: string; wall?: number };
export type Video = { id: string; ch: string; v?: boolean };

/* ---------- 하루 훈련 상세 (SPEC: 훈련 상세 구성) ---------- */
const WARM: Move[] = [
  {name:'빠르게 걷기', amt:'5분', desc:'팔을 크게 흔들며 몸을 데웁니다.'},
  {name:'레그 스윙', amt:'좌우 10회', desc:'벽을 잡고 다리를 앞뒤로 크게 흔듭니다.'},
  {name:'워킹 런지', amt:'10회', desc:'한 발을 크게 내딛고 무릎을 굽혔다 일어나며 걷습니다.'},
  {name:'하이니', amt:'20초', desc:'제자리에서 무릎을 허리 높이까지 올리며 가볍게 뜁니다.'},
  {name:'버트킥', amt:'20초', desc:'발뒤꿈치로 엉덩이를 차듯이 가볍게 뜁니다.'}
];
const COOL: Move[] = [
  {name:'천천히 걷기', amt:'5분', desc:'숨이 고르게 돌아올 때까지 걷습니다.'},
  {name:'종아리 스트레칭', amt:'좌우 30초', desc:'벽을 밀고 뒤쪽 다리 뒤꿈치를 바닥에 붙입니다.'},
  {name:'허벅지 앞 스트레칭', amt:'좌우 30초', desc:'한 발로 서서 발목을 잡고 뒤로 당깁니다.'},
  {name:'허벅지 뒤 스트레칭', amt:'좌우 30초', desc:'다리를 펴고 앉아 상체를 천천히 숙입니다.'},
  {name:'엉덩이 스트레칭', amt:'좌우 30초', desc:'누워서 한쪽 무릎을 두 손으로 감싸 가슴 쪽으로 당깁니다.'}
];
const COOL_LONG_EXTRA: Move[] = [
  {name:'고관절 앞 스트레칭', amt:'좌우 30초', desc:'런지 자세에서 골반을 앞으로 천천히 밉니다.'},
  {name:'허리 스트레칭', amt:'좌우 30초', desc:'누워서 두 무릎을 모아 좌우로 천천히 넘깁니다.'}
];

/* ---------- 동작 그림 (막대 인형, 오른쪽을 보는 옆모습) ----------
   h 머리 · s 어깨 · p 골반 · fk/ff 앞다리 무릎/발 · bk/bf 뒷다리 · fe/fh 앞팔 팔꿈치/손 · be/bh 뒷팔 */
const STAND: Pose = {h:[50,16], s:[50,27], p:[50,55], fk:[51,73], ff:[52,92], bk:[49,73], bf:[48,92], fe:[52,41], fh:[54,54], be:[48,41], bh:[46,54]};
const P = (o: Partial<Pose>): Pose => ({...STAND, ...o});
const swapLimbs = (o: Pose): Pose => ({...o, fk:o.bk, ff:o.bf, bk:o.fk, bf:o.ff, fe:o.be, fh:o.bh, be:o.fe, bh:o.fh});
const WALK = P({h:[52,16], s:[51,27], fk:[56,73], ff:[62,92], bk:[45,73], bf:[38,91], fe:[45,40], fh:[42,52], be:[57,40], bh:[61,50]});
const JOG = P({h:[55,17], s:[53,28], p:[50,54], fk:[60,66], ff:[56,82], bk:[44,72], bf:[36,88], fe:[46,41], fh:[52,46], be:[58,38], bh:[63,30]});
const HIPS: Partial<Pose> = {fe:[42,44], fh:[47,55], be:[58,44], bh:[53,55]};
const LYING: Pick<Pose, 'h' | 's' | 'p'> = {h:[14,80], s:[24,84], p:[48,86]};
export const ART: Record<string, Art> = {
  '빠르게 걷기':     {frames:[WALK, swapLimbs(WALK)], sp:'.8s'},
  '천천히 걷기':     {frames:[WALK, swapLimbs(WALK)], sp:'1.6s'},
  '가볍게 조깅':     {frames:[JOG, swapLimbs(JOG)], sp:'.7s'},
  '레그 스윙':       {wall:78, sp:'1.2s', frames:[
    P({fe:[64,34], fh:[76,36], be:[62,36], bh:[76,40], bk:[50,73], bf:[50,92], fk:[60,72], ff:[70,86]}),
    P({fe:[64,34], fh:[76,36], be:[62,36], bh:[76,40], bk:[50,73], bf:[50,92], fk:[44,73], ff:[34,86]})]},
  '워킹 런지':       {sp:'1.4s', frames:[P(HIPS),
    {h:[48,30], s:[48,41], p:[48,64], fk:[64,66], ff:[65,92], bk:[38,82], bf:[26,92], fe:[40,52], fh:[46,62], be:[56,52], bh:[51,62]}]},
  '하이니':          {sp:'.6s', frames:[
    P({fk:[64,56], ff:[64,74], bk:[50,73], bf:[50,92], fe:[45,40], fh:[52,44], be:[57,40], bh:[63,34]}),
    P({fk:[50,73], ff:[50,92], bk:[64,56], bf:[64,74], fe:[57,40], fh:[63,34], be:[45,40], bh:[52,44]})]},
  '버트킥':          {sp:'.6s', frames:[
    P({fk:[50,74], ff:[50,92], bk:[47,74], bf:[38,60], fe:[46,41], fh:[52,46], be:[58,38], bh:[63,30]}),
    P({fk:[47,74], ff:[38,60], bk:[50,74], bf:[50,92], fe:[58,38], fh:[63,30], be:[46,41], bh:[52,46]})]},
  '가볍게 몸 풀기':  {sp:'1.2s', frames:[P({fe:[53,18], fh:[55,6], be:[47,18], bh:[45,6]}), P({fe:[60,30], fh:[70,30], be:[40,30], bh:[30,30]})]},
  '종아리 스트레칭': {wall:82, frames:[{h:[70,22], s:[66,30], p:[50,56], fk:[62,72], ff:[66,92], bk:[38,74], bf:[28,92], fe:[74,32], fh:[81,30], be:[72,36], bh:[81,36]}]},
  '허벅지 앞 스트레칭': {frames:[P({fk:[50,73], ff:[50,92], bk:[49,75], bf:[41,61], be:[46,45], bh:[41,61], fe:[58,36], fh:[68,34]})]},
  '허벅지 뒤 스트레칭': {frames:[{h:[64,66], s:[55,72], p:[30,86], fk:[55,87], ff:[82,87], bk:[55,88], bf:[82,88], fe:[66,78], fh:[78,84], be:[67,79], bh:[79,85]}]},
  '엉덩이 스트레칭': {frames:[{...LYING, bk:[68,88], bf:[88,88], fk:[42,64], ff:[58,68], fe:[30,72], fh:[44,64], be:[31,73], bh:[45,66]}]},
  '고관절 앞 스트레칭': {frames:[{h:[48,28], s:[48,38], p:[48,66], fk:[66,68], ff:[68,92], bk:[36,92], bf:[20,90], fe:[56,52], fh:[64,64], be:[55,53], bh:[63,65]}]},
  '허리 스트레칭':   {sp:'2s', frames:[
    {...LYING, fk:[58,68], ff:[70,86], bk:[57,69], bf:[69,87], fe:[28,76], fh:[30,68], be:[27,77], bh:[29,69]},
    {...LYING, fk:[62,80], ff:[72,88], bk:[61,81], bf:[71,89], fe:[28,76], fh:[30,68], be:[27,77], bh:[29,69]}]}
};
// 동작 영상 (유튜브 임베드). 2026-10 기준 임베드 허용 확인. v: 세로(쇼츠) 영상
export const VIDEOS: Record<string, Video> = {
  '가볍게 몸 풀기':     {id:'ddJ9JUcIHvU', ch:'빅씨스 Bigsis'},
  '레그 스윙':          {id:'ogJE4XziR3o', ch:'인제대학교 백병원 스포츠의학연구소'},
  '워킹 런지':          {id:'35aawdSG91g', ch:'이고진 헬쇼'},
  '하이니':             {id:'g2YGgygSCn0', ch:'Strong Runner'},
  '버트킥':             {id:'sCqwutevC7o', ch:'Chari Hawkins (영어)', v:true},
  '종아리 스트레칭':    {id:'RUXG_CpwFL0', ch:'새나래병원'},
  '허벅지 앞 스트레칭': {id:'Aq0LY0i3ILg', ch:'삼성서울병원'},
  '허벅지 뒤 스트레칭': {id:'A50ClACVyFE', ch:'하이닥', v:true},
  '엉덩이 스트레칭':    {id:'PL6sgz6PPqU', ch:'본향TV', v:true},
  '고관절 앞 스트레칭': {id:'SnthXe0j9DU', ch:'헬스피디아', v:true},
  '허리 스트레칭':      {id:'xf4MdeX9ZMo', ch:'서울성모병원TV', v:true}
};

// 급수 · 보급: 거리(km)로 시점을 정함. 초보 페이스(1km 약 7분) 기준
export function fuelPlan(km: number){
  const list: Move[] = [
    {name:'출발 2~3시간 전', amt:'식사', desc:'밥 · 빵 · 바나나처럼 소화가 잘되는 탄수화물 위주로 먹고, 물 400~500ml를 나눠 마십니다.'},
    {name:'출발 15분 전', amt:'물 150~200ml', desc:'몇 모금 마셔 둡니다.'}];
  if(km >= 8) list.push({name:'달리는 중 물', amt:'3km마다 (약 20분)', desc:'한 번에 몇 모금(150~200ml)씩, 목마르기 전에 마십니다.'});
  if(km >= 15){
    const at: number[] = []; for(let k=7; k<=km-3; k+=6) at.push(k);
    list.push({name:'에너지젤', amt:at.join(' · ')+'km 지점', desc:'약 45분째에 첫 개, 그 뒤 40분마다 1개. 꼭 물과 함께 먹습니다.'});
  }
  if(km >= 20) list.push({name:'전해질', amt:'1시간마다', desc:'이온음료나 전해질 정제로 땀으로 빠진 염분을 채웁니다. 더운 날엔 더 자주.'});
  list.push({name:'끝난 뒤 30분 안', amt:'회복 식사', desc:'물 · 이온음료로 수분을 채우고, 탄수화물과 단백질(우유 · 바나나 · 삶은 달걀 등)을 함께 먹습니다.'});
  return list;
}

export function dayDetail(p: Plan, day: Day): DayDetail{
  const pace = '대화할 수 있을 만큼 편한 속도로 달립니다.';
  const walk = p.walkRun ? ' 처음 몇 주는 달리기 1분 · 걷기 1분을 반복하고, 주차가 지날수록 달리기 시간을 늘립니다.' : '';
  switch(day.type){
    case 'rest': return {main:[{name:'쉬기', amt:'', desc:'원하면 가벼운 산책이나 폼롤러로 몸을 풀어도 좋습니다.'}], note:'휴식도 훈련입니다. 쉬는 날 근육이 회복되며 강해집니다.'};
    case 'easy': case 'mid': return {warm:WARM, main:[{name:TYPE[day.type].label, amt:day.km+'km', desc:pace+walk}], cool:COOL};
    case 'shake': return {warm:WARM.slice(0,3), main:[{name:'가벼운 조깅', amt:day.km+'km', desc:'아주 편한 속도로 짧게 달리며 다리만 풉니다. 무리하지 마세요.'}], cool:COOL, note:'오늘은 일찍 자고, 대회 준비물(번호표 · 신발 · 물품)을 미리 챙겨 두세요.'};
    case 'tempo': {
      const fast = Math.max(1, day.km!-2);
      return {warm:[{name:'가볍게 조깅', amt:'10분', desc:'아주 천천히 달리며 몸을 데웁니다.'}, ...WARM.slice(1)],
        main:[{name:'편하게 시작', amt:'1km', desc:pace},{name:'페이스 구간', amt:fast+'km', desc:'짧은 문장 정도만 말할 수 있는, 약간 힘든 속도를 유지합니다.'},{name:'편하게 마무리', amt:'1km', desc:'속도를 다시 낮춥니다.'}],
        cool:COOL};
    }
    case 'long': return {warm:WARM,
      main:[{name:'롱런', amt:day.km+'km', desc:pace+' 힘들면 걸어도 괜찮습니다.'+walk}], fuel:fuelPlan(day.km!),
      cool:[{...COOL[0], amt:'5 ~ 10분'}, ...COOL.slice(1), ...COOL_LONG_EXTRA], note:'롱런은 이 플랜의 핵심입니다. 다른 훈련은 가끔 빠져도 롱런은 꼭 지켜 주세요.'};
    case 'cross': return {warm:[{name:'가볍게 몸 풀기', amt:'5분', desc:'목 · 어깨 · 손목 · 발목 관절을 천천히 돌립니다.'}],
      main:[{name:'수영 · 자전거 · 걷기 중 하나', amt:'30 ~ 45분', desc:'숨이 차지 않는 강도로, 달리기에 쓰지 않던 근육을 움직입니다.'}],
      cool:COOL.slice(1,4), coolHint:'정적 스트레칭 5분'};
    case 'sim': return {warm:[{name:'가볍게 조깅', amt:'5분', desc:'아주 천천히 달립니다.'}, ...WARM.slice(1)],
      main:[{name:'하프 거리 모의 레이스', amt:'21.1km', desc:'가까운 하프 대회에 나가거나 혼자 하프 거리를 달려 봅니다. 기록보다 끝까지 일정한 속도를 연습하세요.'}], fuel:fuelPlan(21.1),
      cool:[{...COOL[0], amt:'10분'}, ...COOL.slice(1), ...COOL_LONG_EXTRA]};
    case 'race': return {warm:[{name:'가볍게 조깅', amt:'5분', desc:'출발 30분 전쯤 아주 천천히 달립니다.'}, ...WARM.slice(1)],
      main:[{name:DIST[p.dist].label+' 완주', amt:day.km+'km', desc:'초반에는 일부러 천천히 출발하세요. 급수대에서는 걸으며 물을 마셔도 괜찮습니다.'}], fuel:fuelPlan(day.km!),
      cool:[{...COOL[0], amt:'10분'}, ...COOL.slice(1), ...COOL_LONG_EXTRA], note:'축하합니다! 대회 후 며칠은 가벼운 걷기만 하며 회복하세요.'};
  }
}
