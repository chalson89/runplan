'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppState';

/* 로그인 화면: 가입(name = 이메일) · 로그인 · 로그아웃. 가입 · 로그인 성공이면 홈으로 */
export default function LoginPage(){
  const { toast, setRoutine } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const call = async (path: string, body: Record<string, string>, okMsg: string, goHome?: boolean)=>{
    const res = await fetch(`/api/auth/${path}`, {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)});
    const data = await res.json();
    toast(res.ok ? okMsg : data.message);
    if(res.ok) setRoutine(null); // 로그인 · 로그아웃이 바뀌면 화면의 루틴을 비움(다음에 서버에서 다시 불러옴)
    if(res.ok && goHome) router.push('/');
  };

  const google = async ()=>{
    const res = await fetch('/api/auth/sign-in/social', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({provider:'google', callbackURL:'/'})});
    const data = await res.json();
    if(res.ok) window.location.href = data.url;
    else toast(data.message);
  };

  return <div className="wrap"><div className="form-wrap">
    <h1>로그인</h1>
    <div className="panel">
      <div className="fld">
        <label htmlFor="email">이메일</label>
        <input className="field" id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
      </div>
      <div className="fld">
        <label htmlFor="password">비밀번호</label>
        <input className="field" id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
      </div>
      <button className="btn btn-primary" onClick={()=>call('sign-up/email', {name:email, email, password}, '가입하고 로그인했어요.', true)}>가입</button>{' '}
      <button className="btn btn-primary" onClick={()=>call('sign-in/email', {email, password}, '로그인했어요.', true)}>로그인</button>{' '}
      <button className="btn btn-ghost" onClick={()=>call('sign-out', {}, '로그아웃했어요.')}>로그아웃</button>{' '}
      <button className="btn btn-ghost" onClick={google}>Google로 로그인</button>
    </div>
  </div></div>;
}
