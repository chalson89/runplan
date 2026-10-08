'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../AppState';
import WeekBlock, { KindTag } from '../WeekBlock';
import { DIST, TYPE, addDays, buildSchedule, routineFromApi, routineStats, ymd } from '@/lib/plans';

/* 내 루틴 (SPEC US-02 · US-03 · AC-03 · AC-04 · AC-06) */
export default function Routine(){
  const { routine, setRoutine, openDay, toggleDone } = useApp();
  // 화면에 루틴이 없으면(새로고침 등) 서버에서 가장 최근 루틴을 불러옴
  const [loaded, setLoaded] = useState(!!routine);
  useEffect(()=>{
    if(routine) return;
    fetch('/api/routines/me').then(async res=>{
      if(res.ok) setRoutine(routineFromApi(await res.json()));
      setLoaded(true);
    });
  }, [routine, setRoutine]);
  if(!routine && !loaded) return <div className="wrap"><div className="form-wrap"><h1>내 루틴</h1><p>불러오는 중…</p></div></div>;
  if(!routine){
    return <div className="wrap"><div className="form-wrap">
      <h1>내 루틴</h1>
      <div className="empty" style={{marginTop:16}}>아직 만든 루틴이 없어요.<br/><br/>
        <Link className="btn btn-primary" href="/start">루틴 만들기</Link>
        <Link className="btn btn-ghost" href="/quiz" style={{marginLeft:6}}>퀴즈로 플랜 고르기</Link>
      </div></div></div>;
  }
  const p = routine.plan, sched = buildSchedule(p), d = DIST[p.dist];
  const end = addDays(routine.start, p.weeks*7-1);
  const today = new Date(); today.setHours(0,0,0,0);
  const idx = Math.floor((today.getTime() - routine.start.getTime())/86400000);
  const s = routineStats(routine);

  let todayCard;
  if(idx >= 0 && idx < p.weeks*7){
    const w = sched[Math.floor(idx/7)], i = idx%7, day = w.days[i], key = `${w.n}-${i}`, done = routine.done.has(key);
    todayCard = <div className={`today-card ${done?'is-done':''}`}>
      <span className="lbl">오늘의 훈련 · {ymd(today)} · {w.n}주차</span>
      <h2>{TYPE[day.type].label}{day.km?` ${day.km}km`: day.type==='cross'?' 30~45분':''}</h2>
      <div className="info"><span className="chip">🕒 {routine.form.time}</span><KindTag w={w}/></div>
      <div className="guide">{TYPE[day.type].guide}</div>
      <div className="acts">
        <button className="btn btn-ghost btn-sm" onClick={()=>openDay(p, w.n, i, true)}>준비운동 · 정리운동 보기</button>
        {day.type!=='rest' && <button className={`btn btn-sm ${done?'btn-done':'btn-primary'}`} onClick={()=>toggleDone(key)}>{done?'완료함 ✓':'완료'}</button>}
      </div>
    </div>;
  } else {
    todayCard = <div className="today-card"><span className="lbl">오늘의 훈련</span><h2>루틴 기간이 끝났어요 🎉</h2><div className="guide">새 루틴을 만들어 다음 목표에 도전해 보세요.</div></div>;
  }

  return <div className="wrap">
    <div className="r-head">
      <div><div className="sub">{d.label} · {p.title}</div><h1>내 루틴</h1></div>
      <div className="actions"><Link className="btn btn-ghost btn-sm" href={`/plan/${p.id}`}>플랜 정보</Link><Link className="btn btn-ghost btn-sm" href="/start">다시 만들기</Link></div>
    </div>
    <div className="r-grid">
      {todayCard}
      <section className="panel" style={{margin:0}}>
        <h2>진행률</h2>
        <div className="prog-num">{s.done}/{s.total}<small>{s.pct}%</small></div>
        <div className="prog-bar" role="progressbar" aria-valuenow={s.pct} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${s.pct}%`}}></div></div>
        <dl className="kv">
          <dt>기간</dt><dd>{ymd(routine.start)} ~ {ymd(end)} ({p.weeks}주)</dd>
          <dt>시간대</dt><dd>{routine.form.time}</dd>
          <dt>신체 정보</dt><dd>{routine.form.age}세 · {routine.form.height}cm · {routine.form.weight}kg</dd>
        </dl>
      </section>
    </div>
    <section className="panel">
      <h2>주차별 · 요일별 루틴</h2>
      <p>요일 칸을 누르면 그날의 준비운동 · 본 훈련 · 정리운동을 보고 완료 체크할 수 있어요. 휴식일은 진행률에 들어가지 않아요.</p>
      {sched.map(w=><WeekBlock key={w.n} w={w} rt={routine} onDay={(wn,i)=>openDay(p, wn, i, true)}/>)}
    </section>
  </div>;
}
