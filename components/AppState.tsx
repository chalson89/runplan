'use client';
import { createContext, useCallback, useContext, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { ListState, Plan, Progress, QuizAnswers, Routine } from '@/lib/plans';

// 입력 폼 상태 (입력칸 값이라 숫자도 글자로 보관)
export type FormState = { dist: string | null; planId: string | null; ability: string; age: string; height: string; weight: string; time: string | null };
export type QuizState = { step: number; ans: Partial<QuizAnswers> };
export type Modal = { plan: Plan; wn: number; i: number; rt: boolean };
export type ToastMsg = { text: string; show: boolean };
type Setter<T> = Dispatch<SetStateAction<T>>;
// 컨텍스트 값
export type AppValue = {
  list: ListState; setList: Setter<ListState>;
  form: FormState; setForm: Setter<FormState>;
  routine: Routine | null; setRoutine: Setter<Routine | null>;
  quiz: QuizState; setQuiz: Setter<QuizState>;
  modal: Modal | null;
  openDay: (plan: Plan, wn: number, i: number, rt?: boolean) => void;
  closeModal: () => void;
  toggleDone: (key: string) => Promise<void>;
  toast: (text: string) => void;
  toastMsg: ToastMsg;
};

// 원본과 같이 메모리에만 보관 → 새로고침하면 초기화됨
const Ctx = createContext<AppValue | null>(null);
export const useApp = () => useContext(Ctx)!;

export function AppProvider({ children }: { children: ReactNode }){
  const [list, setList] = useState<ListState>({ filters:{dist:[], level:[], len:[], days:[]}, q:'', sort:'rec' });
  const [form, setForm] = useState<FormState>({dist:null, planId:null, ability:'', age:'', height:'', weight:'', time:null});
  const [routine, setRoutine] = useState<Routine | null>(null); // {id, plan, start, skip, form, done:Set} (skip = 1주차에서 루틴을 만들기 전 일수)
  const [quiz, setQuiz] = useState<QuizState>({step:0, ans:{}});
  const [modal, setModal] = useState<Modal | null>(null);     // {plan, wn, i, rt}
  const [toastMsg, setToastMsg] = useState<ToastMsg>({text:'', show:false});
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((text: string)=>{
    setToastMsg({text, show:true});
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToastMsg(t=>({...t, show:false})), 2400);
  }, []);

  const toggleDone = async (key: string)=>{
    if(!routine) return;
    const was = routine.done.has(key);
    const url = `/api/routines/${routine.id}/completions`;
    const res = was ? await fetch(`${url}/${key}`, {method:'DELETE'})
      : await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key})});
    const s: Progress & {message: string} = await res.json();
    if(!res.ok){ toast(s.message); return; }
    const done = new Set(routine.done);
    was ? done.delete(key) : done.add(key);
    setRoutine({...routine, done});
    toast(was ? '완료를 취소했어요.' : `완료! 진행률 ${s.done}/${s.total} (${s.pct}%)`);
  };

  const openDay = (plan: Plan, wn: number, i: number, rt=false)=> setModal({plan, wn, i, rt});
  const closeModal = useCallback(()=> setModal(null), []);

  return <Ctx.Provider value={{list, setList, form, setForm, routine, setRoutine, quiz, setQuiz,
    modal, openDay, closeModal, toggleDone, toast, toastMsg}}>{children}</Ctx.Provider>;
}
