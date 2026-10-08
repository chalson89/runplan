'use client';
import { useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useApp } from '../AppState';
import PlanCard from '../PlanCard';
import { DIST, FILTER_DEF, LEVELS, QUESTIONS, VARIANT, applyFilters, type FilterKey, type ListState, type SortKey } from '@/lib/plans';

const EMPTY: ListState['filters'] = {dist:[], level:[], len:[], days:[]};

export default function PlanList(){
  const { list:state, setList } = useApp();
  const [open, setOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<ListState>) => setList(s=>({...s, ...patch}));
  const toggle = (key: FilterKey, v: string, on: boolean) => setList(s=>({...s, filters:{...s.filters,
    [key]: on ? [...s.filters[key], v] : s.filters[key].filter(x=>x!==v)}}));

  const total = Object.values(state.filters).reduce((s,x)=>s+x.length,0);
  let list = applyFilters(state);
  const order = {'10k':0,'half':1,'full':2};
  if(state.sort==='short') list.sort((a,b)=>a.weeks-b.weeks);
  else if(state.sort==='long') list.sort((a,b)=>b.weeks-a.weeks);
  else if(state.sort==='easy') list.sort((a,b)=>LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level) || order[a.dist]-order[b.dist]);

  const quick = (e: MouseEvent<HTMLAnchorElement>, dist: string)=>{
    e.preventDefault();
    setList(s=>({...s, filters:{...s.filters, dist:[dist]}}));
    gridRef.current?.scrollIntoView({behavior:'smooth', block:'start'});
  };

  return <>
    <section className="hero"><div className="wrap">
      <div className="crumb"><Link href="/">훈련 플랜</Link> › 러닝 › 마라톤</div>
      <h1>마라톤 훈련 플랜</h1>
      <p>10K부터 풀코스까지, 수준 · 기간 · 주당 일수가 다른 플랜 중에서 고를 수 있어요. 카드를 눌러 하루하루 훈련 내용을 확인하고 내 루틴을 만들어 보세요.</p>
      <div className="hero-chips">
        {Object.entries(DIST).map(([k,v])=><a key={k} href="/" onClick={e=>quick(e,k)}>{v.label}</a>)}
        <Link href="/quiz">잘 모르겠어요 → 퀴즈</Link>
      </div>
    </div></section>
    <div className="wrap">
      <div className="list-layout">
        <aside className={`filters ${open?'open':''}`}>
          <div className="filter-head"><h2>필터</h2>{total>0 && <button className="link-btn" onClick={()=>set({filters:EMPTY})}>모두 지우기</button>}</div>
          {FILTER_DEF.map(f=>{
            const base = applyFilters(state, f.key);
            return <div key={f.key} className="fgroup"><h3>{f.title}</h3>{f.opts.map(([v,l])=>
              <label key={v}><input type="checkbox" checked={state.filters[f.key].includes(v)} onChange={e=>toggle(f.key, v, e.target.checked)}/>{l}
                <span className="cnt">{base.filter(p=>f.test(p,v)).length}</span></label>)}</div>;
          })}
        </aside>
        <section>
          <div className="toolbar">
            <button className="btn btn-ghost filter-toggle" onClick={()=>setOpen(o=>!o)}>필터</button>
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input type="search" placeholder="플랜 검색 (예: 하프)" value={state.q} onChange={e=>set({q:e.target.value})} aria-label="플랜 검색"/>
            </div>
            <select value={state.sort} onChange={e=>set({sort:e.target.value as SortKey})} aria-label="정렬">
              <option value="rec">추천순</option><option value="short">기간 짧은순</option><option value="long">기간 긴순</option>
              {VARIANT==='v1' && <option value="easy">쉬운 순</option>}
            </select>
          </div>
          <p className="result-count">플랜 {list.length}개</p>
          <div className="grid" ref={gridRef}>
            {list.length ? list.map(p=><PlanCard key={p.id} p={p}/>)
              : <div className="empty" style={{gridColumn:'1/-1'}}>조건에 맞는 플랜이 없습니다.<br/>
                  <button className="link-btn" onClick={()=>set({filters:EMPTY, q:''})}>필터 초기화</button></div>}
          </div>
        </section>
      </div>
      <section className="quiz-banner">
        <div className="txt">
          <span className="badge">{VARIANT==='v2'?'1분':'2분'} 퀴즈</span>
          <h2>어떤 플랜이 맞을지 모르겠나요?</h2>
          <p>질문 {QUESTIONS.length}개에 답하면 지금 내 수준{VARIANT==='v1'?'과 일정':''}에 맞는 플랜을 추천해 드려요.</p>
        </div>
        <Link className="btn btn-primary" href="/quiz">퀴즈 시작하기 →</Link>
      </section>
    </div>
  </>;
}
