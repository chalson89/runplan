'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

const HELLO = '안녕하세요! 러닝 훈련 · 플랜에 대해 궁금한 걸 물어보세요.';

// 우측 하단 챗봇: 버튼을 누르면 대화 창이 열림. 대화는 화면에만 보관(새로고침하면 처음부터)
export default function ChatBox(){
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);   // [{role:'user'|'assistant', content}]
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({block:'end'}); }, [msgs, busy, open]);

  const send = async (e: FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const q = text.trim();
    if(!q || busy) return;
    const next: Msg[] = [...msgs, {role:'user', content:q}];
    setMsgs(next); setText(''); setErr(''); setBusy(true);
    const res = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:next})});
    const data = await res.json();
    if(res.ok) setMsgs([...next, {role:'assistant', content:data.reply}]);
    else { setMsgs(msgs); setText(q); setErr(data.message); } // 실패면 보낸 말을 입력칸으로 되돌림
    setBusy(false);
  };

  return <div className="chat">
    {open && <div className="chat-panel" role="dialog" aria-label="러닝 도우미">
      <div className="chat-head">
        <b>러닝 도우미</b>
        <div>
          {msgs.length > 0 && <button type="button" className="chat-x" onClick={()=>{ setMsgs([]); setErr(''); }}>새 대화</button>}
          <button type="button" className="chat-x" aria-label="닫기" onClick={()=>setOpen(false)}>✕</button>
        </div>
      </div>
      <div className="chat-body">
        <div className="chat-msg assistant">{HELLO}</div>
        {msgs.map((m,k)=><div key={k} className={`chat-msg ${m.role}`}>{m.content}</div>)}
        {busy && <div className="chat-msg assistant typing">답을 쓰는 중…</div>}
        {err && <div className="chat-err">{err}</div>}
        <div ref={endRef}></div>
      </div>
      <form className="chat-form" onSubmit={send}>
        <input className="field" value={text} onChange={e=>setText(e.target.value)} placeholder="메시지를 입력하세요" maxLength={2000} disabled={busy}/>
        <button className="btn btn-primary" disabled={busy || !text.trim()}>보내기</button>
      </form>
    </div>}
    <button type="button" className="chat-fab" aria-label={open ? '챗봇 닫기' : '챗봇 열기'} aria-expanded={open} onClick={()=>setOpen(!open)}>
      {open ? '✕' : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>}
    </button>
  </div>;
}
