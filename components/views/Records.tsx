'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DIST, addDays, completedRuns, md, mondayOf, routineFromApi, sumKm, ymd, type ApiRoutineSummary } from '@/lib/plans';

const STATUS = {active:'진행 중', done:'완료', stopped:'중단'};

/* 내 기록: 달린 거리 통계 + 내 루틴 목록 */
export default function Records(){
  const [list, setList] = useState<ApiRoutineSummary[] | null>(null);   // null = 불러오는 중
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(()=>{
    fetch('/api/routines').then(async res=>{
      if(res.status===401){ setNeedLogin(true); return; }
      setList(await res.json());
    });
  }, []);

  if(needLogin) return <div className="wrap"><div className="form-wrap"><h1>내 기록</h1>
    <div className="empty" style={{marginTop:16}}>로그인하면 기록을 볼 수 있어요.<br/><br/>
      <Link className="btn btn-primary" href="/login">로그인</Link></div></div></div>;
  if(!list) return <div className="wrap"><div className="form-wrap"><h1>내 기록</h1><p>불러오는 중…</p></div></div>;

  // 모든 루틴의 완료한 날을 모아 통계
  const runs = list.flatMap(r=>completedRuns(routineFromApi(r)));
  const longest = runs.reduce((a,r)=>Math.max(a, r.km), 0);
  const thisMon = mondayOf(new Date());
  const weeks = Array.from({length:8}, (_,k)=>{
    const from = addDays(thisMon, (k-7)*7), to = addDays(from, 7);
    return {from, km: sumKm(runs.filter(r=>r.date>=from && r.date<to))};
  });
  const maxWeek = Math.max(1, ...weeks.map(w=>w.km));

  return <div className="wrap">
    <div className="r-head"><div><h1>내 기록</h1></div></div>
    <section className="panel">
      <h2>달린 거리</h2>
      <div className="stats">
        <div><b>{sumKm(runs)}km</b><span>누적 거리</span></div>
        <div><b>{runs.length}회</b><span>완료한 훈련</span></div>
        <div><b>{longest}km</b><span>가장 긴 달리기</span></div>
      </div>
      <h3>최근 8주 주간 거리</h3>
      <div className="week-bars">
        {weeks.map((w,k)=><div key={k} className="wb">
          <span className="wb-km">{w.km ? w.km : ''}</span>
          <div className="wb-bar" style={{height:`${w.km/maxWeek*100}%`}}></div>
          <span className="wb-lbl">{md(w.from)}</span>
        </div>)}
      </div>
    </section>
    <section className="panel">
      <h2>내 루틴 목록</h2>
      {list.length===0 ? <div className="empty">아직 만든 루틴이 없어요. <Link href="/start">루틴 만들기</Link></div>
        : <ul className="rt-list">{list.map(r=>{
          const rt = routineFromApi(r);
          return <li key={r.id}>
            <div><b>{DIST[rt.plan.dist].label} · {rt.plan.title}</b> <span className={`tag st-${r.status}`}>{STATUS[r.status]}</span></div>
            <div className="sub">{ymd(new Date(`${r.from}T00:00:00`))} ~ {ymd(new Date(`${r.end}T00:00:00`))} · {r.progress.done}/{r.progress.total} ({r.progress.pct}%) · {r.km}km</div>
          </li>;
        })}</ul>}
    </section>
  </div>;
}
