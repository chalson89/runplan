import type { CSSProperties } from 'react';
import { ART, type Pose } from '@/lib/moves';

function Limb({ pts }: { pts: [number, number][] }){
  return <polyline points={pts.map(p=>p.join(' ')).join(' ')} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>;
}

function Figure({ o }: { o: Pose }){
  return <>
    <g className="back"><Limb pts={[o.p,o.bk,o.bf]}/><Limb pts={[o.s,o.be,o.bh]}/></g>
    <line x1={o.s[0]} y1={o.s[1]} x2={o.p[0]} y2={o.p[1]} stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
    <Limb pts={[o.p,o.fk,o.ff]}/><Limb pts={[o.s,o.fe,o.fh]}/>
    <circle cx={o.h[0]} cy={o.h[1]} r="6.5" fill="currentColor"/>
  </>;
}

// 동작 그림 (막대 인형). 프레임이 2개면 번갈아 보여 줌
export default function MoveArt({ name }: { name: string }){
  const a = ART[name]; if(!a) return null;
  const two = a.frames.length > 1;
  return <svg className="art" viewBox="0 0 100 100" role="img" aria-label={`${name} 동작 그림`} style={{'--sp': a.sp||'1s'} as CSSProperties}>
    <line className="gnd" x1="6" y1="93" x2="94" y2="93"/>
    {a.wall && <line className="wall" x1={a.wall} y1="8" x2={a.wall} y2="93"/>}
    {a.frames.map((f,i)=><g key={i} className={two?'fr'+(i+1):undefined}><Figure o={f}/></g>)}
  </svg>;
}
