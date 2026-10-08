'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '../AppState';
import PlanCard from '../PlanCard';
import { DIST, QUESTIONS, recommend, type QuizAnswers, type QuizOpt } from '@/lib/plans';

function Result({ ans, onRetry }: { ans: QuizAnswers; onRetry: () => void }){
  const r = recommend(ans);
  const best = r.list[0], alts = r.list.slice(1,3);
  const d = DIST[best.p.dist];
  return <div className="wrap"><div className="quiz">
    <Link className="back" href="/">← 플랜 목록</Link>
    <div className="q-progress"><div style={{width:'100%'}}></div></div>
    <h1 className="q-title">추천 플랜이 나왔어요</h1>
    {r.warning && <div className="warn">⚠️ {r.warning}</div>}
    <div className="result-hero">
      <div className={`card-top ${d.cls}`}><span className="dist">{d.label} · {best.p.level}</span><div className="weeks">{best.p.weeks}<small>주</small></div></div>
      <div className="inner">
        <h2>{best.p.title}</h2>
        <p style={{color:'var(--text-2)', margin:'0 0 14px'}}>{best.p.summary}</p>
        <ul className="checks">{best.why.slice(0,4).map(w=><li key={w}>{w}</li>)}</ul>
        <div style={{display:'flex', gap:10, flexWrap:'wrap', marginTop:18}}>
          <Link className="btn btn-primary" href={`/start/${best.p.id}`}>이 플랜으로 루틴 만들기 →</Link>
          <Link className="btn btn-ghost" href={`/plan/${best.p.id}`}>자세히 보기</Link>
          <button className="btn btn-ghost" onClick={onRetry}>퀴즈 다시 하기</button>
        </div>
      </div>
    </div>
    {alts.length>0 && <><h2 className="alt-title">이런 플랜도 맞을 수 있어요</h2><div className="grid">{alts.map(x=><PlanCard key={x.p.id} p={x.p}/>)}</div></>}
  </div></div>;
}

export default function Quiz(){
  const { quiz, setQuiz } = useApp();
  const [ready, setReady] = useState(false);
  // 결과까지 본 뒤 다시 들어오면 처음부터
  useEffect(()=>{ setQuiz(q=> q.step>=QUESTIONS.length ? {step:0, ans:{}} : q); setReady(true); }, [setQuiz]);
  if(!ready) return null;

  if(quiz.step >= QUESTIONS.length) return <Result ans={quiz.ans as QuizAnswers} onRetry={()=>setQuiz({step:0, ans:{}})}/>;
  const q = QUESTIONS[quiz.step];
  const cur = quiz.ans[q.key];
  const go = (n: number) => setQuiz(s=>({...s, step:s.step+n}));
  const pick = (o: QuizOpt)=>{
    setQuiz(s=>({...s, ans:{...s.ans, [q.key]:o.v}}));
    setTimeout(()=>{ go(1); scrollTo(0,0); }, 180);
  };

  return <div className="wrap"><div className="quiz">
    <Link className="back" href="/">← 플랜 목록</Link>
    <div className="q-progress"><div style={{width:`${quiz.step/QUESTIONS.length*100}%`}}></div></div>
    <div className="q-step">{quiz.step+1} / {QUESTIONS.length}</div>
    <h1 className="q-title">{q.title}</h1>
    <p className="q-sub">{q.sub}</p>
    <div className="options">{q.opts.map((o,i)=>
      <button key={i} className={`opt ${cur===o.v?'sel':''}`} onClick={()=>pick(o)}><span className="ico">{o.ico}</span><b>{o.b}</b>{o.s && <span>{o.s}</span>}</button>)}
    </div>
    <div className="q-nav">
      <button className="btn btn-ghost" disabled={quiz.step===0} onClick={()=>go(-1)}>← 이전</button>
      <button className="btn btn-primary" disabled={cur===undefined} onClick={()=>go(1)}>{quiz.step===QUESTIONS.length-1?'결과 보기':'다음 →'}</button>
    </div>
  </div></div>;
}
