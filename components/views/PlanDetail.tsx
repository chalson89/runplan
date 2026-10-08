'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../AppState';
import WeekBlock from '../WeekBlock';
import { DIST, PLANS, VARIANT, buildSchedule, findPlan } from '@/lib/plans';

export default function PlanDetail({ id }: { id: string }){
  const { openDay } = useApp();
  const [showAll, setShowAll] = useState(false);
  const p = findPlan(id);
  if(!p) return <div className="wrap"><Link className="back" href="/">← 플랜 목록</Link><div className="empty" style={{margin:'20px 0 60px'}}>플랜을 찾을 수 없습니다.</div></div>;

  const d = DIST[p.dist];
  const sched = buildSchedule(p);
  const maxKm = Math.max(...sched.map(w=>w.total));
  const recCount = sched.filter(w=>w.kind==='recovery').length;
  const visible = showAll ? sched : sched.slice(0,4);
  const related = PLANS.filter(x=>x.id!==p.id && (x.dist===p.dist || x.level===p.level)).slice(0,3);

  return <div className="wrap">
    <Link className="back" href="/">← 플랜 목록</Link>
    <section className={`d-hero ${d.cls}`}>
      <div>
        <span className="dist">{d.label} · {p.level}</span>
        <h1>{p.title}</h1>
        <p>{p.summary}</p>
      </div>
      <div className="d-cta">
        <Link className="btn btn-primary" href={`/start/${p.id}`}>이 플랜으로 시작하기</Link>
        <small>{p.coach}</small>
      </div>
    </section>
    <div className="d-layout">
      <div>
        <section className="panel">
          <h2>한눈에 보기</h2>
          <div className="stats">
            <div className="stat"><b>{p.weeks}주</b><span>기간</span></div>
            <div className="stat"><b>주 {p.runDays}일</b><span>달리는 날</span></div>
            <div className="stat"><b>{p.hours[0]}~{p.hours[1]}시간</b><span>주당 훈련 시간</span></div>
            <div className="stat"><b>{p.longPeak}km</b><span>최장 롱런</span></div>
            <div className="stat"><b>{maxKm}km</b><span>최대 주간 거리</span></div>
          </div>
        </section>
        <section className="panel">
          <h2>주차별 달리기 거리</h2>
          <div className="legend">
            <span><i style={{background:'var(--accent)'}}></i>늘리는 주</span>
            <span><i style={{background:'var(--recovery)'}}></i>회복 주 ({recCount}회)</span>
            <span><i style={{background:'var(--taper)'}}></i>테이퍼 주</span>
            <span><i style={{background:'var(--race)'}}></i>대회 · 모의 레이스</span>
          </div>
          <div className="chart" role="img" aria-label="주차별 달리기 거리 막대그래프">
            {sched.map(w=><div key={w.n} className={`bar ${w.kind==='sim'?'race':w.kind}`} style={{height:`${Math.max(4,w.total/maxKm*100)}%`}} title={`${w.n}주차 · ${w.total}km`}></div>)}
          </div>
          <div className="chart-x">{sched.map(w=><span key={w.n}>{w.n}</span>)}</div>
        </section>
        <section className="panel">
          <h2>주차별 · 요일별 일정</h2>
          <p>요일 칸을 누르면 그날의 준비운동 · 본 훈련 · 정리운동을 볼 수 있어요.</p>
          {visible.map(w=><WeekBlock key={w.n} w={w} onDay={(wn,i)=>openDay(p, wn, i)}/>)}
          {sched.length>4 && <button className="btn btn-ghost more-weeks" onClick={()=>setShowAll(s=>!s)}>{showAll?'접기':`전체 ${p.weeks}주 보기`}</button>}
        </section>
      </div>
      <aside>
        <div className="side-sticky">
          <section className="panel">
            <h2>이런 분께 추천해요</h2>
            <ul className="checks">{p.forWho.map(x=><li key={x}>{x}</li>)}</ul>
          </section>
          <section className="panel">
            <h2>플랜 특징</h2>
            <ul className="checks">{p.features.map(x=><li key={x}>{x}</li>)}</ul>
            <p style={{marginTop:12, fontSize:13}}>시작 조건: {p.prereq?`쉬지 않고 ${p.prereq}km 이상 달릴 수 있어야 해요.`:'특별한 조건 없이 시작할 수 있어요.'}</p>
          </section>
          {related.length>0 && <section className="panel"><h2>{VARIANT==='v2'?'다른 거리 플랜':'비슷한 플랜'}</h2>
            <div style={{display:'grid', gap:8}}>{related.map(r=>
              <Link key={r.id} href={`/plan/${r.id}`} className="chip" style={{display:'flex', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, fontSize:13}}>
                <span>{r.title}</span><span>{r.weeks}주</span></Link>)}</div>
          </section>}
        </div>
      </aside>
    </div>
  </div>;
}
