import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  OfficeProject, 
  OfficeDocument, 
  OfficeDocumentFormat, 
  CanvasViewMode, 
  OfficeSource,
  PlanTriad,
  PlanOption
} from '../../types/office';
import { SEED_PROJECTS, createCleanBlankDocument } from '../../services/officeSeedData';
import { KnowledgeDock } from './KnowledgeDock';
import { UniversalSmartCanvas } from './UniversalSmartCanvas';
import { NotebookStudioPanel } from './NotebookStudioPanel';
import { InfographicStudioModal } from './InfographicStudioModal';
import { OmniExportDrawer } from './OmniExportDrawer';
import { CompanyTemplateInjector } from './CompanyTemplateInjector';
import { AudioOverviewPlayer } from './AudioOverviewPlayer';
import { VersionExportModal } from './VersionExportModal';
import { LifeHubTaskBridge } from './LifeHubTaskBridge';
import { NotionWikiDeployModal } from './NotionWikiDeployModal';
import { MultiSourceResearchModal } from './MultiSourceResearchModal';
import { SparkStudioHeader } from './SparkStudioHeader';
import { SparkThemeProvider, useSparkTheme } from '../../context/SparkThemeContext';
import { useApp } from '../../context/AppContext';
import { 
  Folder, 
  Plus,
  Undo2,
  CheckCircle2,
  Sparkles,
  Share2,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';

const STORAGE_KEY = 'anti_office_studio_projects_v1';

export const OfficeStudioContainer: React.FC = () => {
  return (
    <SparkThemeProvider>
      <OfficeStudioInner />
    </SparkThemeProvider>
  );
};

const OfficeStudioInner: React.FC = () => {
  const { themeConfig } = useSparkTheme();
  const { showToast, setCurrentView } = useApp();

  // 1. 프로젝트 상태 (localStorage 연동 영구 보존)
  const [projects, setProjects] = useState<OfficeProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
    return SEED_PROJECTS;
  });
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return SEED_PROJECTS[0].id;
  });

  // 프로젝트 변경 시 localStorage 자동 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const currentDoc = activeProject.currentDoc;

  // 2. 캔버스 뷰 모드 ('triad' | 'canvas')
  const [viewMode, setViewMode] = useState<CanvasViewMode>('canvas');

  // 3. Undo 히스토리 스택
  const [historyStack, setHistoryStack] = useState<Array<{ action: string; docSnapshot: OfficeDocument }>>([]);

  // 4. 사내 고유 양식 복제기 모달 상태
  const [isTemplateInjectorOpen, setIsTemplateInjectorOpen] = useState<boolean>(false);
  const [targetTemplateSource, setTargetTemplateSource] = useState<OfficeSource | undefined>(undefined);

  // 5. 2분 오디오 브리핑 플레이어 상태
  const [isAudioBriefingOpen, setIsAudioBriefingOpen] = useState<boolean>(false);

  // 6. 버전 호환 파일 컴파일러 & 사전 비행 검수 모달 상태
  const [isVersionExportModalOpen, setIsVersionExportModalOpen] = useState<boolean>(false);
  const [exportInitialTab] = useState<'hwpx' | 'xlsx' | 'pptx' | 'pdf'>('hwpx');

  // 7. 라이프 Hub [Tasks DB] 실행 과제 직결 브리지 모달 상태
  const [isLifeHubBridgeOpen, setIsLifeHubBridgeOpen] = useState<boolean>(false);

  // 8. 노션 워크스페이스 Wiki 배포 모달 상태
  const [isNotionDeployModalOpen, setIsNotionDeployModalOpen] = useState<boolean>(false);

  // 9. Gemini NotebookLM형 우측 [스튜디오(Studio)] 패널 상태 (상시 열림/접기)
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(true);

  // 10. 인포그래픽 스튜디오 모달 상태
  const [isInfographicModalOpen, setIsInfographicModalOpen] = useState<boolean>(false);

  // 11. 우측 옴니 출하 서랍 상태
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState<boolean>(false);

  // 12. 상단 옴니 리서치 모달 상태
  const [isOmniResearchModalOpen, setIsOmniResearchModalOpen] = useState<boolean>(false);
  const [omniResearchQuery, setOmniResearchQuery] = useState<string>('스마트 시설물 유지관리 및 AI 에이전트 행정 자동화');

  const handleStartResearch = (query: string) => {
    setOmniResearchQuery(query);
    setIsOmniResearchModalOpen(true);
  };

  // =========================================================================
  // 4. 반응형 사이드바 리사이저 & 접기/펼치기 상태
  // =========================================================================
  const DEFAULT_SIDEBAR_WIDTH = 380;
  const MIN_SIDEBAR_WIDTH = 260;
  const MAX_SIDEBAR_WIDTH = 600;

  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 마우스 드래그 리사이저 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;

    if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
      setSidebarWidth(newWidth);
      if (isCollapsed) setIsCollapsed(false);
    }
  }, [isResizing, isCollapsed]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // 더블클릭 시 기본 너비(380px)로 리셋
  const handleDividerDoubleClick = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    setIsCollapsed(false);
    showToast('사이드바 너비를 기본(380px)으로 리셋했습니다.', 'info');
  };

  // 상태 업데이트 헬퍼 (Undo 스냅샷 보존)
  const updateDocument = (updatedDoc: OfficeDocument, actionName: string) => {
    setHistoryStack(prev => [...prev, { action: actionName, docSnapshot: currentDoc }]);

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          currentDoc: updatedDoc
        };
      }
      return p;
    }));

    showToast(`${actionName} 완료`, 'info');
  };

  // Undo (되돌리기)
  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const lastEntry = historyStack[historyStack.length - 1];
    const newStack = historyStack.slice(0, -1);

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          currentDoc: lastEntry.docSnapshot
        };
      }
      return p;
    }));

    setHistoryStack(newStack);
    showToast(`'${lastEntry.action}' 작업을 되돌렸습니다.`, 'info');
  };

  // 문서 포맷 변경 ('docs' | 'slides' | 'sheets' | 'minutes')
  const handleFormatChange = (fmt: OfficeDocumentFormat) => {
    const updated: OfficeDocument = {
      ...currentDoc,
      format: fmt
    };
    updateDocument(updated, `문서 포맷을 [${fmt.toUpperCase()}]로 전환`);
    setViewMode('canvas');
  };

  // 새 프로젝트 추가 (이전 문서 잔상 없는 클린 백지 기안서 템플릿으로 초기화)
  const handleCreateNewProject = () => {
    const newProjId = `proj-${Date.now()}`;
    const cleanDoc = createCleanBlankDocument(newProjId, '새 기획 프로젝트 공식 기안서');
    const newProj: OfficeProject = {
      id: newProjId,
      title: '새 기획 프로젝트 2026',
      description: '새로운 AI 오피스 워크스페이스 문서 기획',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      sources: [],
      currentDoc: cleanDoc,
      planTriad: activeProject.planTriad
    };

    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newProjId);
    showToast('신규 프로젝트 워크스페이스가 생성되었습니다.', 'success');
  };

  // 소스 조작 헬퍼들
  const handleToggleSelectSource = (srcId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedSources = p.sources.map(s => s.id === srcId ? { ...s, isSelected: !s.isSelected } : s);
        return { ...p, sources: updatedSources };
      }
      return p;
    }));
  };

  const handleAddSource = (source: OfficeSource) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, sources: [source, ...p.sources] };
      }
      return p;
    }));
    showToast(`'${source.title}' 지식 창고에 적재 완료`, 'success');
  };

  const handleAddSources = (newSources: OfficeSource[]) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, sources: [...newSources, ...p.sources] };
      }
      return p;
    }));
    const totalTokens = newSources.reduce((acc, s) => acc + s.tokenCount, 0);
    showToast(`${newSources.length}개 소스가 지식 창고에 일괄 적재되었습니다. (${totalTokens.toLocaleString()} tokens)`, 'success');
  };

  const handleDeleteSource = (srcId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, sources: p.sources.filter(s => s.id !== srcId) };
      }
      return p;
    }));
    showToast('소스를 지식 창고에서 삭제했습니다.', 'info');
  };

  // 3-Way Triad 전체 업데이트
  const handleUpdatePlanTriad = (newTriad: PlanTriad) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, planTriad: newTriad };
      }
      return p;
    }));
    showToast('3-Way 기획안 발산이 완료되었습니다.', 'success');
  };

  // 사내 서식 복제기 열기 핸들러
  const handleOpenTemplateInjector = (source?: OfficeSource) => {
    setTargetTemplateSource(source);
    setIsTemplateInjectorOpen(true);
  };

  // 사내 서식 적용 완료 핸들러
  const handleApplyCompanyTemplate = (updatedDoc: OfficeDocument, templateName: string) => {
    updateDocument(updatedDoc, `'${templateName}' 사내 서식 캔버스 복제 적용`);
    showToast(`'${templateName}' 서식이 캔버스에 1:1 복제 적용되었습니다.`, 'success');
  };

  // 3-Way 질문 답변 완료 후 문서·시트·슬라이드에 뼈대 완벽 자동 파이핑
  const handleApplyPlanToDoc = (
    selectedKey: 'A' | 'B' | 'C', 
    qaAnswers: { targetDetail: string; channelDetail: string },
    chosenOption?: PlanOption
  ) => {
    const chosen = chosenOption || (
      selectedKey === 'A' 
        ? activeProject.planTriad?.optionA 
        : selectedKey === 'B' 
          ? activeProject.planTriad?.optionB 
          : activeProject.planTriad?.optionC
    );

    if (!chosen) return;

    // 1. 공문서 섹션에 뼈대 주입
    const updatedSections = [
      { id: 'sec-1', level: 1 as const, marker: '1.', text: '추진 배경 및 목적' },
      { id: 'sec-2', level: 2 as const, marker: '□', text: `${chosen.title} 추진 배경 및 전사적 기대 효과` },
      { id: 'sec-3', level: 3 as const, marker: '○', text: `핵심 컨셉: ${chosen.concept}` },
      { id: 'sec-4', level: 1 as const, marker: '2.', text: '세부 실행 방안 및 타깃 채널' },
      { id: 'sec-5', level: 2 as const, marker: '□', text: `목표 타깃 & 과금: ${qaAnswers.targetDetail} (${chosen.pricing})` },
      { id: 'sec-6', level: 3 as const, marker: '○', text: `1단계 필수 검증 지표: ${qaAnswers.channelDetail}` },
      { id: 'sec-7', level: 4 as const, marker: '―', text: `주요 장점 및 고려 사항: ${chosen.pros} (주의: ${chosen.cons})` },
      { id: 'sec-8', level: 1 as const, marker: '3.', text: '단계별 실행 로드맵' },
      ...chosen.roadmap.map((step, idx) => ({
        id: `sec-road-${idx}`,
        level: 3 as const,
        marker: '○',
        text: step
      }))
    ];

    // 2. 슬라이드 덱에 뼈대 주입
    const updatedSlides = [
      {
        id: `slide-1`,
        title: chosen.title,
        subtitle: chosen.concept,
        bullets: [
          `핵심 타깃: ${qaAnswers.targetDetail}`,
          `1단계 지표: ${qaAnswers.channelDetail}`,
          `예산 및 모델: ${chosen.pricing}`
        ],
        badge: `${selectedKey}안 KEYNOTE`
      },
      {
        id: `slide-2`,
        title: '핵심 실행 로드맵',
        subtitle: '단계별 액션 플랜',
        bullets: chosen.roadmap,
        badge: 'ROADMAP'
      }
    ];

    // 3. 스프레드시트 예산 내역에 동적 파이핑 주입
    const updatedSheetRows = [
      { id: 'row-plan-1', cells: [1, `${chosen.title} 핵심 구축`, `${qaAnswers.targetDetail} 인프라 셋업`, 32000000, '초기 1회'] },
      { id: 'row-plan-2', cells: [2, '연간 라이선스 및 운영비', chosen.pricing, 18000000, '분기 정산'] },
      { id: 'row-plan-3', cells: [3, '지표 검증 및 파일럿', qaAnswers.channelDetail, 5000000, '성과 연동'] }
    ];

    const updatedDoc: OfficeDocument = {
      ...currentDoc,
      title: `${chosen.title} 추진 기안서`,
      content: {
        ...currentDoc.content,
        docsContent: { sections: updatedSections },
        slidesContent: { slides: updatedSlides },
        sheetsContent: {
          headers: ['번호', '예산 비목', '산출 내역', '소요 금액', '비고'],
          rows: updatedSheetRows,
          hasTotalRow: true,
          totalFormula: '=SUM(D2:D4)'
        }
      }
    };

    updateDocument(updatedDoc, `[${selectedKey}안] 기획 뼈대 문서 주입 완료`);
    setViewMode('canvas');
    showToast('선택하신 기획안 뼈대가 공문서/시트 캔버스에 주입되었습니다.', 'success');
  };

  const handleSyncToLifeHub = () => {
    setIsLifeHubBridgeOpen(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 flex flex-col h-full w-full overflow-hidden ${themeConfig.appBg} font-sans select-none relative transition-colors duration-200`}
    >
      {/* ========================================================================= */}
      {/* 0. 최상단 옴니 리서치 바 & 감마형 3대 비주얼 테마 스위처 헤더 */}
      {/* ========================================================================= */}
      <SparkStudioHeader
        onStartResearch={handleStartResearch}
        defaultQuery={currentDoc.title || '스마트 시설물 유지관리 및 AI 에이전트 행정 자동화'}
      />

      {/* ========================================================================= */}
      {/* 상단 1단 미니멀 바: 프로젝트 네비게이션 & [ 🚀 최종 저장 및 출하 ] */}
      {/* ========================================================================= */}
      <div className={`h-12 border-b ${themeConfig.headerBorder} ${themeConfig.headerBg} backdrop-blur px-3 sm:px-5 flex items-center justify-between shrink-0 z-20 gap-3 no-print shadow-2xs transition-colors duration-200`}>
        
        {/* 좌측: 사이드바 접기/펼치기 화살표 + 프로젝트 탭 목록 + 새 프로젝트 버튼 */}
        <div className="flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap scrollbar-none flex-1 min-w-0 py-0.5">
          {/* 사이드바 접기/펼치기 버튼 */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition cursor-pointer shrink-0 shadow-2xs"
            title={isCollapsed ? '지식 창고 펼치기' : '지식 창고 접기 (전폭 캔버스)'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <PanelLeftClose className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />}
          </button>

          {/* 프로젝트 탭 목록 */}
          {projects.map(proj => (
            <button
              key={proj.id}
              onClick={() => setActiveProjectId(proj.id)}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer shrink-0 border
                ${activeProjectId === proj.id
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-300 dark:border-zinc-600 shadow-2xs font-bold'
                  : 'bg-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 border-transparent hover:bg-slate-100/60 dark:hover:bg-zinc-800/60'
                }
              `}
              title={proj.title}
            >
              <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[280px]">{proj.title}</span>
            </button>
          ))}

          {/* 새 프로젝트 생성 버튼 */}
          <button
            onClick={handleCreateNewProject}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-medium transition cursor-pointer shrink-0 border border-dashed border-slate-300 dark:border-zinc-700"
            title="새 프로젝트 생성"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">새 프로젝트</span>
          </button>
        </div>

        {/* 우측: 자동 저장 상태 + 되돌리기 + 스튜디오 토글 + [ 🚀 최종 저장 및 출하 ] */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-slate-400 dark:text-zinc-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>자동 저장됨</span>
          </div>

          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-30 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition cursor-pointer shadow-2xs"
            title={historyStack.length > 0 ? `되돌리기: ${historyStack[historyStack.length - 1].action}` : '되돌릴 작업 없음'}
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">되돌리기</span>
          </button>

          {!isStudioOpen && (
            <button
              onClick={() => setIsStudioOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="스튜디오 패널 펼치기"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>스튜디오 열기</span>
            </button>
          )}

          {/* [ 🚀 최종 저장 및 출하 ] 버튼 */}
          <button
            onClick={() => setIsExportDrawerOpen(true)}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-900 text-xs font-extrabold transition cursor-pointer whitespace-nowrap shadow-md"
            title="우측 옴니 출하 서랍 열기"
          >
            <Share2 className="w-4 h-4 text-indigo-300 dark:text-indigo-600 shrink-0" />
            <span>🚀 최종 저장 및 출하</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. 본문 3단 레이아웃 (Knowledge Dock vs Universal Smart Canvas vs Studio Panel) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* (1) 좌측 패널: Knowledge Dock (접힘 토글 및 너비 드래그 적용) */}
        {!isCollapsed && (
          <div 
            style={{ width: `${sidebarWidth}px` }} 
            className="h-full shrink-0 flex flex-col transition-[width] duration-200 ease-in-out relative no-print overflow-hidden"
          >
            <KnowledgeDock
              sources={activeProject.sources}
              onToggleSelectSource={handleToggleSelectSource}
              onAddSource={handleAddSource}
              onAddSources={handleAddSources}
              onDeleteSource={handleDeleteSource}
              onOpenTemplateInjector={handleOpenTemplateInjector}
              onCollapse={() => setIsCollapsed(true)}
            />
          </div>
        )}

        {/* (2) 리사이저 경계선 (Divider) */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDividerDoubleClick}
            className={`
              w-1.5 hover:w-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-400 dark:hover:bg-zinc-600
              transition-all cursor-col-resize shrink-0 z-30 relative group flex items-center justify-center no-print
              ${isResizing ? 'bg-slate-400 dark:bg-zinc-600 w-2' : ''}
            `}
            title="드래그하여 너비 조절 (더블클릭 시 기본값 380px 리셋)"
          >
            <div className="w-0.5 h-8 bg-slate-400 dark:bg-zinc-600 rounded-full group-hover:bg-white" />
          </div>
        )}

        {/* (3) 중앙 메인 영역: Universal Smart Canvas (좌측 창 접힘 시 전폭 자동 확장) */}
        <div className="flex-1 h-full flex flex-col min-w-0 relative">
          {/* 지식창고가 접혀있을 때 좌측 상단 원클릭 복원 플로팅 탭 */}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute left-0 top-3 z-30 py-2 px-3 bg-white dark:bg-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-l-0 border-slate-300 dark:border-zinc-700 rounded-r-xl shadow-lg flex items-center space-x-1.5 cursor-pointer text-xs font-bold transition-all hover:pl-4 group animate-fadeIn"
              title="지식 창고 다시 펼치기"
            >
              <PanelLeftOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-800 dark:text-zinc-200 whitespace-nowrap">📚 지식 창고</span>
            </button>
          )}

          <UniversalSmartCanvas
            document={currentDoc}
            planTriad={activeProject.planTriad}
            sources={activeProject.sources}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            onChangeDocument={updateDocument}
            onUpdatePlanTriad={handleUpdatePlanTriad}
            onApplyPlanToDoc={handleApplyPlanToDoc}
            onSyncToLifeHub={handleSyncToLifeHub}
            onShowToast={showToast}
          />

          {/* 스튜디오가 닫혀있을 때 우측 플로팅 열기 탭 */}
          {!isStudioOpen && (
            <button
              onClick={() => setIsStudioOpen(true)}
              className="absolute right-0 top-16 z-30 py-3 px-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-l-xl shadow-lg flex flex-col items-center space-y-1.5 cursor-pointer text-[10px] font-bold tracking-tighter"
              title="스튜디오 펼치기"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="[writing-mode:vertical-lr]">스튜디오</span>
            </button>
          )}
        </div>

        {/* (4) 우측 독: Gemini NotebookLM형 스튜디오 패널 (NotebookStudioPanel) */}
        <NotebookStudioPanel
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          currentFormat={currentDoc.format}
          onChangeFormat={handleFormatChange}
          document={currentDoc}
          onChangeDocument={updateDocument}
          onOpenAudioBriefing={() => setIsAudioBriefingOpen(true)}
          onUndo={handleUndo}
          canUndo={historyStack.length > 0}
          lastActionName={historyStack[historyStack.length - 1]?.action}
          onShowToast={showToast}
          sources={activeProject.sources}
        />

      </div>

      {/* ========================================================================= */}
      {/* 4. 사내 고유 서식 복제기 모달 (CompanyTemplateInjector) */}
      {/* ========================================================================= */}
      <CompanyTemplateInjector
        isOpen={isTemplateInjectorOpen}
        onClose={() => setIsTemplateInjectorOpen(false)}
        currentDocument={currentDoc}
        onApplyTemplate={handleApplyCompanyTemplate}
        sourceFileName={targetTemplateSource?.title}
      />

      {/* ========================================================================= */}
      {/* 5. 2분 오디오 브리핑 플레이어 (AudioOverviewPlayer) */}
      {/* ========================================================================= */}
      <AudioOverviewPlayer
        isOpen={isAudioBriefingOpen}
        onClose={() => setIsAudioBriefingOpen(false)}
        documentTitle={currentDoc.title}
      />

      {/* ========================================================================= */}
      {/* 6. 버전 호환 스마트 파일 컴파일러 및 사전 비행 검수 모달 */}
      {/* ========================================================================= */}
      <VersionExportModal
        isOpen={isVersionExportModalOpen}
        onClose={() => setIsVersionExportModalOpen(false)}
        document={currentDoc}
        onShowToast={showToast}
        initialTab={exportInitialTab}
      />

      {/* ========================================================================= */}
      {/* 7. 라이프 Hub [Tasks DB] 실행 과제 직결 브리지 모달 */}
      {/* ========================================================================= */}
      <LifeHubTaskBridge
        isOpen={isLifeHubBridgeOpen}
        onClose={() => setIsLifeHubBridgeOpen(false)}
        document={currentDoc}
        onShowToast={showToast}
        onNavigateToLifeHub={() => setCurrentView('life')}
      />

      {/* ========================================================================= */}
      {/* 8. 노션 워크스페이스 클라우드 Wiki 배포 모달 */}
      {/* ========================================================================= */}
      <NotionWikiDeployModal
        isOpen={isNotionDeployModalOpen}
        onClose={() => setIsNotionDeployModalOpen(false)}
        document={currentDoc}
        onShowToast={showToast}
      />

      {/* ========================================================================= */}
      {/* 9. 우측 옴니 출하 서랍 (OmniExportDrawer) */}
      {/* ========================================================================= */}
      <OmniExportDrawer
        isOpen={isExportDrawerOpen}
        onClose={() => setIsExportDrawerOpen(false)}
        document={currentDoc}
        onOpenLifeHubBridge={() => setIsLifeHubBridgeOpen(true)}
        onOpenNotionWikiModal={() => setIsNotionDeployModalOpen(true)}
        onOpenAudioBriefing={() => setIsAudioBriefingOpen(true)}
        onShowToast={showToast}
      />

      {/* ========================================================================= */}
      {/* 10. 인포그래픽 스튜디오 모달 (InfographicStudioModal) */}
      {/* ========================================================================= */}
      <InfographicStudioModal
        isOpen={isInfographicModalOpen}
        onClose={() => setIsInfographicModalOpen(false)}
        document={currentDoc}
        planTriad={activeProject.planTriad}
        onShowToast={showToast}
      />

      {/* ========================================================================= */}
      {/* 11. 상단 옴니 자율 리서치 모달 (MultiSourceResearchModal) */}
      {/* ========================================================================= */}
      {isOmniResearchModalOpen && (
        <MultiSourceResearchModal
          isOpen={isOmniResearchModalOpen}
          onClose={() => setIsOmniResearchModalOpen(false)}
          query={omniResearchQuery}
          onImportSources={(newSources: OfficeSource[]) => {
            handleAddSources(newSources);
            showToast(`${newSources.length}개의 기술 출처가 지식 창고에 일괄 반영되었습니다.`, 'success');
          }}
        />
      )}

    </div>
  );
};
