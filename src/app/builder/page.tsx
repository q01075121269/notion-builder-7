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
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative bg-white dark:bg-notion-dark-bg">
      {/* 제1챕터 상단 서브 헤더 바 & 서브 스위처 (메탈릭 실버 & 모노톤) */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800 backdrop-blur-xs text-xs select-none shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer font-medium"
            title="메인 홈으로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">홈으로</span>
          </button>
          
          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          {/* 제1챕터 서브 스위처: [🔨 템플릿 빌더 | 🗂️ 템플릿 보관함] */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700">
            <button
              onClick={() => setSubTab('builder')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                subTab === 'builder'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              <span>🔨 템플릿 빌더</span>
            </button>
            <button
              onClick={() => setSubTab('vault')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                subTab === 'vault'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              <span>🗂️ 템플릿 보관함</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
            <Sparkles className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
            <span>제1챕터 템플릿 마스터</span>
          </span>
        </div>
      </div>

      {/* 탭 전환 렌더링: [🔨 템플릿 빌더] vs [🗂️ 템플릿 보관함] */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {subTab === 'builder' ? <SplitLayout /> : <DashboardView />}
      </div>
    </div>
  );
};

export default BuilderPage;
