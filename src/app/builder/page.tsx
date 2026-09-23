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
      {/* 제1챕터 상단 서브 헤더 바 & 서브 스위처 */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/80 backdrop-blur-xs text-xs select-none shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer font-medium"
            title="메인 홈으로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">홈으로</span>
          </button>
          
          <span className="text-neutral-300 dark:text-neutral-700">|</span>

          {/* 제1챕터 서브 스위처: [🔨 템플릿 빌더 | 🗂️ 템플릿 보관함] */}
          <div className="flex items-center bg-neutral-200/60 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-300/50 dark:border-neutral-700/50">
            <button
              onClick={() => setSubTab('builder')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                subTab === 'builder'
                  ? 'bg-white dark:bg-notion-dark-card text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5 text-amber-500" />
              <span>🔨 템플릿 빌더</span>
            </button>
            <button
              onClick={() => setSubTab('vault')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                subTab === 'vault'
                  ? 'bg-white dark:bg-notion-dark-card text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-500" />
              <span>🗂️ 템플릿 보관함</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
            <Sparkles className="w-3 h-3 text-amber-500" />
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
