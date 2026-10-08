import type { CSSProperties } from 'react';
import { DOW, TYPE, addDays, beforeFrom, kindTagInfo, md, sameDay, type Routine, type Week } from '@/lib/plans';

export function KindTag({ w }: { w: Week }){
  const t = kindTagInfo(w);
  return t ? <span className={`tag ${t[0]}`}>{t[1]}</span> : null;
}

// 주차 블록: routine이 있으면 실제 날짜 · 오늘 · 완료 표시
export default function WeekBlock({ w, rt, onDay }: { w: Week; rt?: Routine; onDay: (wn: number, i: number) => void }){
  const today = new Date();
  let cur = false;
  const cells = w.days.map((day,i)=>{
    let dow = DOW[i], cls = day.type==='rest' ? 'rest' : '', done = false;
    if(rt){
      const date = addDays(rt.start, (w.n-1)*7+i);
      dow = `${DOW[i]} ${md(date)}`;
      if(sameDay(date,today)){ cls += ' today'; cur = true; }
      if(rt.done.has(`${w.n}-${i}`)){ cls += ' done'; done = true; }
      // 루틴을 만들기 전 날: 날짜만 흐리게, 눌러도 안 열림
      if(beforeFrom(rt, w.n, i)) return <button key={i} className="day before" disabled><span className="dow">{dow}</span></button>;
    }
    return <button key={i} className={`day ${cls}`} style={{'--c':TYPE[day.type].color} as CSSProperties} onClick={()=>onDay(w.n, i)}>
      {done && <span className="ck" aria-label="완료">✓</span>}
      <span className="dow">{dow}</span><span className="type">{TYPE[day.type].label}</span>
      {day.km ? <span className="dist">{day.km}km</span> : day.type==='cross' ? <span className="dist">30~45분</span> : null}
    </button>;
  });
  return <div className={`week ${cur?'current':''}`}>
    <div className="week-head"><b>{w.n}주차</b>{cur && <span className="tag now">이번 주</span>}<KindTag w={w}/><span className="km">달리기 {w.total}km</span></div>
    <div className="days">{cells}</div>
  </div>;
}
