'use client';
import { useApp } from './AppState';

export default function Toast(){
  const { toastMsg } = useApp();
  return <div className={`toast ${toastMsg.show?'show':''}`} role="status">{toastMsg.text}</div>;
}
