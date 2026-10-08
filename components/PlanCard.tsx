import Link from 'next/link';
import { DIST, type Plan } from '@/lib/plans';

export default function PlanCard({ p }: { p: Plan }){
  const d = DIST[p.dist];
  return <Link className="card" href={`/plan/${p.id}`}>
    <div className={`card-top ${d.cls}`}><span className="dist">{d.label}</span><div className="weeks">{p.weeks}<small>주</small></div></div>
    <div className="card-body">
      <h3>{p.title}</h3>
      <div className="coach">{p.coach}</div>
      <div className="meta">
        <span className="chip level">{p.level}</span>
        <span className="chip">주 {p.runDays}일 달리기</span>
        <span className="chip">주 {p.hours[0]}~{p.hours[1]}시간</span>
      </div>
    </div>
    <div className="card-foot"><span>자세히 보기</span><span aria-hidden="true">→</span></div>
  </Link>;
}
