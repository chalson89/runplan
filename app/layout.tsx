import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppProvider } from '@/components/AppState';
import Header from '@/components/Header';
import DayModal from '@/components/DayModal';
import Toast from '@/components/Toast';
import { VARIANT } from '@/lib/plans';

export const metadata: Metadata = {
  title: `런플랜 · ${VARIANT==='v2' ? '시안 2 (SPEC 기준)' : '시안 1 (여러 플랜)'}`,
};

// 저장된 테마를 첫 페인트 전에 적용 (깜빡임 방지)
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }){
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: themeScript}}/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <AppProvider>
          <Header/>
          <main>{children}</main>
          <footer><div className="wrap">런플랜 · 캡스톤 프로젝트 화면 시안 ({VARIANT==='v2' ? '시안 2 · SPEC 기준' : '시안 1 · 여러 플랜'}) · 더미 데이터라 새로고침하면 초기화됨</div></footer>
          <DayModal/>
          <Toast/>
        </AppProvider>
      </body>
    </html>
  );
}
