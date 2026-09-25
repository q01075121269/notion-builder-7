import React, { useState } from 'react';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { DashboardView } from '../../components/dashboard/DashboardView';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Sparkles, FolderArchive, Hammer } from 'lucide-react';

/**
 * [v2.0 아키텍처 개편: 제1챕터 템플릿 마스터]
 * 서브 스위처 [🔨 템플릿 빌더 | 🗂️ 템플릿 보관함]를 탑재하여
 * 빌더 작업실과 템플릿 보관함을 한곳에서 오고갑니다.
 */
export const BuilderPage: React.FC = () => {
  const { setCurrentView, currentView } = useApp();
  const [subTab, setSubTab] = useState<'builder' | 'vault'>(
    currentView === 'dashboard' ? 'vault' : 'builder'
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* 제1챕터 상단 서브 헤더 바 & 서브 스위처 (모노톤 & 글로벌 토큰) */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md text-xs select-none shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition cursor-pointer font-medium"
            title="메인 홈으로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">홈으로</span>
          </button>
          
          <span className="text-slate-300 dark:text-zinc-700">|</span>

          {/* 제1챕터 서브 스위처: [템플릿 빌더 | 템플릿 보관함] */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setSubTab('builder')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                subTab === 'builder'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs border border-slate-200 dark:border-zinc-700'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>템플릿 빌더</span>
            </button>
            <button
              onClick={() => setSubTab('vault')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                subTab === 'vault'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs border border-slate-200 dark:border-zinc-700'
                  : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>템플릿 보관함</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800">
            <Sparkles className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
            <span>제1챕터 템플릿 마스터</span>
          </span>
        </div>
      </div>

      {/* 탭 전환 렌더링: [템플릿 빌더] vs [템플릿 보관함] */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--bg-base)]">
        {subTab === 'builder' ? <SplitLayout /> : <DashboardView />}
      </div>
    </div>
  );
};

export default BuilderPage;
