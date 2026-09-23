import React from 'react';
import { useApp } from '../../context/AppContext';
import { StructureTreeView } from './StructureTreeView';
import { CuratedTop10Hub } from './CuratedTop10Hub';
import { TemplatePreviewCanvas } from '../TemplatePreviewCanvas';
import { FileText, GitBranch, Code2, Share2, Sparkles, Loader2, Zap, ArrowLeft, Compass } from 'lucide-react';

export const NotionMockup: React.FC = () => {
  const { 
    currentTemplate, 
    previewMode, 
    setPreviewMode, 
    setIsRawJsonModalOpen, 
    setIsExportModalOpen,
    publishToNotion,
    isPublishing,
    isViewingCurationHub,
    setIsViewingCurationHub,
    loadCuratedTemplate,
    setPendingChatPrompt,
    setActiveMobileTab,
    showToast
  } = useApp();

  // 1. 월간 TOP 10 큐레이션 보드 (기본 화면)
  if (isViewingCurationHub) {
    return (
      <CuratedTop10Hub
        onSelectTemplate={(item) => {
          loadCuratedTemplate(item.id);
        }}
        onModifyWithChat={(item) => {
          loadCuratedTemplate(item.id);
          setPendingChatPrompt(item.recommendedPrompt);
          setActiveMobileTab('chat');
          showToast('💬 대화창에 템플릿 수정 프롬프트가 자동 입력되었습니다.', 'info');
        }}
      />
    );
  }

  // 템플릿이 없을 때 Fallback
  if (!currentTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-neutral-400">
        <Sparkles className="w-12 h-12 mb-3 text-amber-500 animate-pulse" />
        <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-200">
          선택되거나 생성된 템플릿이 없습니다
        </h3>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">
          9월 TOP 10 큐레이션 허브에서 추천 템플릿을 선택하거나 좌측 대화창에서 원하는 템플릿을 요청해 보세요.
        </p>
        <button
          onClick={() => setIsViewingCurationHub(true)}
          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>🍁 9월 TOP 10 큐레이션 둘러보기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-notion-dark-bg overflow-y-auto">
      
      {/* Notion Preview Top Toolbar (상단 액션 툴바) */}
      <div className="sticky top-0 z-20 h-12 flex items-center justify-between gap-2 px-3 sm:px-6 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-notion-dark-border flex-nowrap shrink-0 select-none">
        
        <div className="flex items-center space-x-2 shrink-0">
          {/* [⬅️ 9월 TOP 10 둘러보기] 복귀 버튼 */}
          <button
            onClick={() => setIsViewingCurationHub(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition whitespace-nowrap cursor-pointer text-xs font-bold"
            title="9월 시즌 인기 템플릿 TOP 10 큐레이션 허브로 돌아갑니다"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TOP 10 둘러보기</span>
            <span className="sm:hidden">TOP 10</span>
          </button>

          {/* [노션 페이지 뷰 | 구조 트리 뷰] 토글 */}
          <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs shrink-0">
            <button
              onClick={() => setPreviewMode('notion')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                previewMode === 'notion'
                  ? 'bg-white dark:bg-notion-dark-card text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">노션 페이지 뷰</span>
              <span className="md:hidden">페이지</span>
            </button>
            <button
              onClick={() => setPreviewMode('tree')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                previewMode === 'tree'
                  ? 'bg-white dark:bg-notion-dark-card text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">구조 트리 뷰</span>
              <span className="md:hidden">트리</span>
            </button>
          </div>
        </div>

        {/* 액션 버튼: [공유], [</> JSON], [⚡ 내 노션에 템플릿 생성하기(Primary)] */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs shrink-0 flex-nowrap">
          {/* 1. 공유 */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition whitespace-nowrap cursor-pointer shadow-2xs"
            title="템플릿 공유 및 마크다운 내보내기"
          >
            <Share2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="hidden lg:inline">공유</span>
          </button>

          {/* 2. </> JSON */}
          <button
            onClick={() => setIsRawJsonModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition whitespace-nowrap cursor-pointer shadow-2xs"
            title="원시 JSON 데이터 확인 및 다운로드"
          >
            <Code2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="hidden lg:inline">&lt;/&gt; JSON</span>
            <span className="lg:hidden">&lt;/&gt;</span>
          </button>

          {/* 3. Primary: [⚡ 내 노션에 템플릿 생성하기] */}
          <button
            onClick={publishToNotion}
            disabled={isPublishing}
            className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600 shadow-sm transition disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0 active:scale-95"
            title="현재 설계된 템플릿을 내 노션 워크스페이스에 실제로 생성합니다"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>노션에 생성 중...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0 fill-amber-300" />
                <span className="hidden sm:inline">내 노션에 템플릿 생성하기</span>
                <span className="sm:hidden">노션 생성</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Rendering based on previewMode */}
      {previewMode === 'tree' ? (
        <StructureTreeView template={currentTemplate} />
      ) : (
        <TemplatePreviewCanvas template={currentTemplate} />
      )}
    </div>
  );
};
