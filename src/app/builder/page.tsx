import React from 'react';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * [v2.0 아키텍처 개편: v1 템플릿 빌더 격리 보존]
 * 기존 v1 핵심 컴포넌트(AI 대화창 + Notion 실시간 프리뷰 SplitLayout)를
 * 100% 온전하게 보존하여 독립적으로 구동하는 빌더 페이지입니다.
 */
export const BuilderPage: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-white dark:bg-notion-dark-bg">
      {/* v1 격리 보존 상단 서브 헤더 바 */}
      <div className="h-9 px-4 flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur-xs text-xs select-none shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer font-medium"
            title="메인 홈으로 돌아가기"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">홈으로</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <div className="flex items-center space-x-1.5 text-neutral-800 dark:text-neutral-200 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>✨ 노션 템플릿 빌더 (v1 격리 작업실)</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <ShieldCheck className="w-3 h-3" />
            <span>v1 무결성 보존됨</span>
          </span>
        </div>
      </div>

      {/* 기존 v1 템플릿 빌더 메인 레이아웃 (SplitLayout: AI Chat + Notion Preview) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <SplitLayout />
      </div>
    </div>
  );
};

export default BuilderPage;
