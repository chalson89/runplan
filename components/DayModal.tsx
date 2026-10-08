'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from './AppState';
import MoveArt from './MoveArt';
import { DOW, TYPE, addDays, afterToday, buildSchedule, ymd } from '@/lib/plans';
import { VIDEOS, dayDetail, type Move } from '@/lib/moves';

// 영상: 버튼 아래에 임베드, 한 번에 하나만 재생
function Video({ name }: { name: string }){
  const v = VIDEOS[name];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{ ref.current?.scrollIntoView({behavior:'smooth', block:'nearest'}); }, []);
  return <div ref={ref} className={'video' + (v.v ? ' vertical' : '')}>
    <div className="frame"><iframe src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`}
      title={`${name} 영상`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"></iframe></div>
    <div className="cap"><span>출처: {v.ch}</span><a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener">유튜브에서 열기 ↗</a></div>
  </div>;
}

function MoveList({ list, vid, setVid }: { list: Move[]; vid: string | null; setVid: (v: string | null) => void }){
  return <ul className="moves">{list.map((m,k)=>{
    const v = VIDEOS[m.name], open = vid===m.name;
    return <li key={k}>
      <MoveArt name={m.name}/>
      <div className="txt">
        {m.amt && <span className="amt">{m.amt}</span>}<b>{m.name}</b><span className="desc">{m.desc}</span>
        {v && <button type="button" className="vid" aria-expanded={open} onClick={()=>setVid(open?null:m.name)}>{open?'■ 영상 닫기':'▶ 영상으로 보기'}</button>}
      </div>
      {open && <Video name={m.name}/>}
    </li>;
  })}</ul>;
}

export default function DayModal(){
  const { modal, closeModal, routine, toggleDone } = useApp();
  const [vid, setVid] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const path = usePathname();

  useEffect(()=>{ closeModal(); }, [path, closeModal]);
  useEffect(()=>{ setVid(null); if(modal) closeRef.current?.focus(); }, [modal]);
  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{ if(e.key==='Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return ()=>document.removeEventListener('keydown', onKey);
  }, [closeModal]);

  let content = null;
  if(modal){
    const { plan:p, wn, i } = modal;
    const rt = modal.rt ? routine : null;
    const w = buildSchedule(p)[wn-1], day = w.days[i];
    const det = dayDetail(p, day);
    const steps: {cls: string; title: string; hint: string; body: Move[]}[] = [];
    if(det.warm) steps.push({cls:'', title:'준비운동', hint:'러닝 전 · 몸을 움직이며 푸는 동적 스트레칭', body:det.warm});
    steps.push({cls:'main', title:'본 훈련', hint: day.type==='rest' ? '' : '오늘의 핵심 훈련', body:det.main});
    if(det.fuel) steps.push({cls:'', title:'급수 · 보급', hint:'일반 가이드예요. 몸 상태 · 날씨에 따라 조절하고, 처음 먹는 젤은 훈련 때 먼저 시험해 보세요', body:det.fuel});
    if(det.cool) steps.push({cls:'', title:'정리운동', hint: det.coolHint || '러닝 후 · 자세를 유지하는 정적 스트레칭', body:det.cool});
    const key = `${w.n}-${i}`;
    const date = rt ? addDays(rt.start, (w.n-1)*7+i) : null;
    const done = rt && rt.done.has(key);
    content = <>
      <div className="modal-head">
        <div>
          <div className="sub">{w.n}주차 · {date?ymd(date):DOW[i]+'요일'}{rt?` · ${rt.form.time}`:''}</div>
          <h2 id="modalTitle">{TYPE[day.type].label}{day.km?` ${day.km}km`:''}</h2>
        </div>
        <button className="modal-close" aria-label="닫기" ref={closeRef} onClick={closeModal}>✕</button>
      </div>
      <div className="modal-body">
        {steps.map((s,k)=><div key={k} className={`step ${s.cls}`}>
          <div className="step-num">{steps.length>1?k+1:'•'}</div>
          <div><h3>{s.title}</h3>{s.hint && <div className="hint">{s.hint}</div>}<MoveList list={s.body} vid={vid} setVid={setVid}/></div>
        </div>)}
        {det.note && <div className="note">{det.note}</div>}
      </div>
      {rt && day.type!=='rest' && <div className="modal-foot">
        {afterToday(rt.start, w.n, i) && !done
          ? <span className="hint">그날이 되면 완료할 수 있어요.</span>
          : <button className={`btn ${done?'btn-done':'btn-primary'}`} onClick={()=>{ toggleDone(key); closeModal(); }}>
              {done?'완료함 ✓ (다시 누르면 취소)':'완료'}
            </button>}
      </div>}
    </>;
  }

  return <div className={`modal-bg ${modal?'open':''}`} role="dialog" aria-modal="true" aria-labelledby="modalTitle"
    onClick={e=>{ if(e.target===e.currentTarget) closeModal(); }}>
    <div className="modal">{content}</div>
  </div>;
}
