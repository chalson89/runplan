'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VARIANT } from '@/lib/plans';
import { useApp } from '@/components/AppState';

export default function Header(){
  const path = usePathname();
  const sec = path.startsWith('/quiz') ? 'quiz' : (path.startsWith('/routine') || path.startsWith('/start')) ? 'routine' : path.startsWith('/records') ? 'records' : 'list';
  const { toast, setRoutine } = useApp();
  const [user, setUser] = useState<{ email: string } | null>(null);

  /* 화면 주소가 바뀔 때마다 로그인 상태를 다시 봄 (null이면 로그인 안 함) */
  useEffect(()=>{
    fetch('/api/auth/get-session').then(res=>res.json()).then(data=>setUser(data ? data.user : null));
  }, [path]);

  const signOut = async ()=>{
    await fetch('/api/auth/sign-out', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
    setUser(null);
    setRoutine(null);
    toast('로그아웃했어요.');
  };

  const toggleTheme = ()=>{
    const el = document.documentElement;
    const dark = el.dataset.theme ? el.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    el.dataset.theme = next;
    try{ localStorage.setItem('theme', next); }catch(e){}
  };

  return <>
    <div className="topbar">입문부터 중급까지, 거리 · 기간 · 주당 일수가 다른 플랜 10개 중에 골라 보세요</div>
    <header className="site">
      <div className="wrap">
        <Link className="logo" href="/"><span className="logo-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4a1.5 1.5 0 1 0 0-.01"/><path d="M7 21l3-6 3 2v4"/><path d="M6 12l3-4 4 1 3 4 3 1"/></svg>
        </span>런플랜</Link>
        <span className="variant">{VARIANT==='v2' ? '시안 2 · SPEC 기준' : '시안 1 · 여러 플랜'}</span>
        <nav className="main">
          <Link href="/" className={sec==='list'?'on':''}>훈련 플랜</Link>
          <Link href="/quiz" className={sec==='quiz'?'on':''}>추천 퀴즈</Link>
          <Link href="/routine" className={sec==='routine'?'on':''}>내 루틴</Link>
          <Link href="/records" className={sec==='records'?'on':''}>내 기록</Link>
          {user
            ? <><span>{user.email}</span> <button className="btn btn-ghost" onClick={signOut}>로그아웃</button></>
            : <Link href="/login">로그인</Link>}
        </nav>
        <button className="theme-btn" onClick={toggleTheme} aria-label="화면 테마 바꾸기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </button>
      </div>
    </header>
  </>;
}
