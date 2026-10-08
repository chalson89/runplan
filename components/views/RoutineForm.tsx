'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, type FormState } from '../AppState';
import { ABILITY, DIST, PLANS, TIMES, VARIANT, findPlan, routineFromApi } from '@/lib/plans';

const plansOf = (d: string) => PLANS.filter(p=>p.dist===d);

/* 입력 폼 (SPEC US-01 · AC-01 · AC-02 · AC-05) */
export default function RoutineForm({ planId }: { planId?: string }){
  const { form:saved, setForm:save, setRoutine, toast } = useApp();
  const router = useRouter();
  // /start/[id] 면 해당 플랜으로, /start 면 거리 · 플랜만 비우고 나머지 입력은 유지
  const [form, setForm] = useState<FormState>(()=>{
    const p = planId && findPlan(planId);
    return p ? {...saved, dist:p.dist, planId:p.id} : {...saved, dist:null, planId:null};
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [warn, setWarn] = useState<{msg: string; recId: string} | null>(null);
  const refs: Record<string, RefObject<HTMLDivElement | null>> = {'f-dist':useRef<HTMLDivElement>(null), 'f-ability':useRef<HTMLDivElement>(null), 'f-body':useRef<HTMLDivElement>(null), 'f-time':useRef<HTMLDivElement>(null)};

  useEffect(()=>{ save(form); }, [form, save]);
  const upd = (patch: Partial<FormState>) => setForm(f=>({...f, ...patch}));
  const clearErr = (k: string) => setErrs(e=>{ const n={...e}; delete n[k]; return n; });

  const submit = async ()=>{
    setWarn(null);
    const e: Record<string, string> = {};
    if(!form.dist) e['f-dist'] = '목표 거리를 선택하세요';
    if(form.ability==='') e['f-ability'] = '현재 수준을 선택하세요';
    if(!form.age || !form.height || !form.weight) e['f-body'] = '나이 · 키 · 몸무게를 모두 입력하세요';
    if(!form.time) e['f-time'] = '운동 시간대를 선택하세요';
    setErrs(e);
    const first = Object.keys(e)[0];
    if(first){ refs[first].current?.scrollIntoView({behavior:'smooth', block:'center'}); return; }

    const ability = +form.ability;
    const p = (VARIANT==='v1' ? findPlan(form.planId!) : PLANS.find(x=>x.dist===form.dist))!;
    const res = await fetch('/api/routines', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({planId:p.id, ability, age:+form.age, height:+form.height, weight:+form.weight, time:form.time})});
    const data = await res.json();
    if(res.status===201){
      setRoutine(routineFromApi(data));
      router.push('/routine');
    } else if(res.status===422 && data.code==='LEVEL_TOO_LOW') setWarn({msg:data.message, recId:data.recPlanId});
    else toast(data.message);
  };

  const Err = ({k}: {k: string}) => errs[k] ? <div className="err">{errs[k]}</div> : null;

  return <div className="wrap"><div className="form-wrap">
    <Link className="back" href={form.planId?`/plan/${form.planId}`:'/'}>← 돌아가기</Link>
    <h1>내 루틴 만들기</h1>
    <p>몇 가지만 알려 주시면 이번 주 월요일부터 시작하는 루틴을 만들어 드려요.</p>
    <div className="panel">
      <div className="fld" ref={refs['f-dist']}>
        <span className="lbl">목표 거리</span>
        <div className="radio-cards">{Object.entries(DIST).map(([k,v])=>
          <button key={k} type="button" className={`rc ${form.dist===k?'sel':''}`}
            onClick={()=>{ if(form.dist!==k) upd({dist:k, planId:plansOf(k)[0].id}); clearErr('f-dist'); }}>
            {v.label}<small>{v.km}km</small></button>)}
        </div>
        <Err k="f-dist"/>
      </div>
      {VARIANT==='v1' && <div className="fld">
        <label htmlFor="planSel">플랜</label>
        <select id="planSel" disabled={!form.dist} value={form.planId||''} onChange={e=>upd({planId:e.target.value})}>
          {form.dist ? plansOf(form.dist).map(p=><option key={p.id} value={p.id}>{p.title} · {p.weeks}주 · 주 {p.runDays}일</option>)
            : <option value="">목표 거리를 먼저 고르세요</option>}
        </select>
      </div>}
      <div className="fld" ref={refs['f-ability']}>
        <label htmlFor="abilitySel">현재 수준</label>
        <select id="abilitySel" value={String(form.ability)} onChange={e=>upd({ability:e.target.value})}>
          <option value="">선택하세요</option>
          {ABILITY.map(([v,l])=><option key={v} value={String(v)}>쉬지 않고 {l} 달릴 수 있어요</option>)}
        </select>
        <Err k="f-ability"/>
      </div>
      <div className="fld" ref={refs['f-body']}>
        <span className="lbl">신체 정보</span>
        <div className="body-row">
          <div><label htmlFor="age">나이</label><input className="field" id="age" type="number" inputMode="numeric" min="10" max="90" placeholder="예: 28" value={form.age} onChange={e=>upd({age:e.target.value})}/></div>
          <div><label htmlFor="height">키 (cm)</label><input className="field" id="height" type="number" inputMode="numeric" min="100" max="230" placeholder="예: 170" value={form.height} onChange={e=>upd({height:e.target.value})}/></div>
          <div><label htmlFor="weight">몸무게 (kg)</label><input className="field" id="weight" type="number" inputMode="numeric" min="30" max="200" placeholder="예: 65" value={form.weight} onChange={e=>upd({weight:e.target.value})}/></div>
        </div>
        <div className="help">강도 조절에 쓸 예정이에요 (규칙은 아직 미정).</div>
        <Err k="f-body"/>
      </div>
      <div className="fld" ref={refs['f-time']}>
        <span className="lbl">주로 운동하는 시간대</span>
        <div className="radio-cards five">{TIMES.map(([t,s])=>
          <button key={t} type="button" className={`rc ${form.time===t?'sel':''}`} onClick={()=>{ upd({time:t}); clearErr('f-time'); }}>{t}<small>{s}</small></button>)}
        </div>
        <Err k="f-time"/>
      </div>
      {warn && <div className="warn">⚠️ {warn.msg}<div style={{marginTop:10}}><Link className="btn btn-ghost btn-sm" href={`/plan/${warn.recId}`}>권장 플랜 보기</Link></div></div>}
      <button className="btn btn-primary" style={{width:'100%'}} onClick={submit}>루틴 만들기</button>
    </div>
  </div></div>;
}
