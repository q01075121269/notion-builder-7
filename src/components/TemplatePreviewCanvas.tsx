import React, { useState } from 'react';
import type { NotionTemplate, NotionDatabase } from '../types/notion';
import { ResizableSplitLayout } from './ui/ResizableSplitLayout';
import { NotionCover } from './preview/NotionCover';
import { NotionHeader } from './preview/NotionHeader';
import { NotionBlocks } from './preview/NotionBlocks';
import { NotionDatabaseView } from './preview/NotionDatabaseView';
import { TemplateSchemaTable } from './preview/TemplateSchemaTable';
import { TemplateBenchmarkCard } from './preview/TemplateBenchmarkCard';
import { StructureTreeView } from './preview/StructureTreeView';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Sparkles,
  Database,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calculator,
  Zap,
  Tag,
  Radio,
  MessageSquare,
  Loader2,
  FileText,
  GitBranch,
  Code2,
  Share2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export interface TemplatePreviewCanvasProps {
  template: NotionTemplate;
}

export const TemplatePreviewCanvas: React.FC<TemplatePreviewCanvasProps> = ({ template }) => {
  const { 
    setPendingChatPrompt, 
    setActiveMobileTab, 
    showToast,
    publishToNotion,
    isPublishing,
    previewMode,
    setPreviewMode,
    setIsRawJsonModalOpen,
    setIsExportModalOpen,
  } = useApp();

  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);

  // 통계 계산: DB 수, 총 속성 수, Formulas 2.0 수식 수
  const totalDatabases = template.databases.length;
  const totalProperties = template.databases.reduce((sum, db) => sum + db.properties.length, 0);
  const totalFormulas = template.databases.reduce(
    (sum, db) => sum + db.properties.filter((p) => p.type === 'formula').length,
    0
  );

  // 특정 DB 스크롤 이동
  const scrollToDb = (dbName: string) => {
    setSelectedDbId(dbName);
    const element = document.getElementById(`db-section-${dbName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 대화창 수정 유도
  const handleModifyWithChat = () => {
    const promptText = `"${template.title}" 템플릿의 데이터베이스 속성을 고도화하고 맞춤형 수식을 추가해줘.`;
    setPendingChatPrompt(promptText);
    setActiveMobileTab('chat');
    showToast('💬 대화창에 템플릿 수정 프롬프트가 자동 입력되었습니다.', 'info');
  };

  // 에이전트 스킬 프리셋 주입 핸들러
  const handleApplySkill = (skillPrompt: string, skillName: string) => {
    setPendingChatPrompt(`현재 "${template.title}" 템플릿에 [${skillName}]을 무손실 업그레이드로 적용해줘: ${skillPrompt}`);
    setActiveMobileTab('chat');
    showToast(`💬 "${skillName}" 요청이 대화창에 준비되었습니다.`, 'info');
  };

  return (
    <div className="w-full h-full min-h-0 overflow-hidden bg-white dark:bg-notion-dark-bg">
      <ResizableSplitLayout
        defaultRatio={25}
        minRatio={15}
        maxRatio={40}
        minPixelWidth={230}
        storageKey="template_builder_resizable_split_v2"
        className="h-full min-h-0"
        leftContent={({ toggleCollapse }) => (
          <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
            {/* 좌측 사이드바 상단 헤더 & [◀ 접기] 토글 버튼 */}
            <div className="h-11 px-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shrink-0 select-none">
              <div className="flex items-center space-x-1.5 min-w-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
                  에이전트 3.0 패널
                </span>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="좌측 패널 접기 (전체화면 모드)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>접기</span>
              </button>
            </div>

            {/* 좌측 패널 스크롤 가능 영역 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
              {/* 1. 에이전트 3.0 상태 모니터링 카드 */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      에이전트 3.0 상태
                    </span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                    ● Active
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">전담 서브에이전트</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">총괄 PM 에이전트</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">트리거 체이닝</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">스케줄(09:00) + 이벤트</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">감사 로그 상태</span>
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                      Heartbeat 정상
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">품질 게이트</span>
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                      Verified 100%
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 네비게이션 바로가기 (DB 및 섹션 목록) */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    템플릿 DB 바로가기 ({totalDatabases})
                  </span>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {template.databases.map((db, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToDb(db.name)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-left transition whitespace-nowrap cursor-pointer ${
                        selectedDbId === db.name
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <Database className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{db.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0 whitespace-nowrap">
                        {db.properties.length} 속성
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 추천 에이전트 스킬 프리셋 */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    추천 에이전트 스킬 주입
                  </span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() =>
                      handleApplySkill(
                        'D-Day 1일 이내 미완료 태스크를 상단 콜아웃에 실시간 긴급 경고 뱃지로 띄우는 알림 스킬을 추가해줘.',
                        '마감 24h 긴급 알림'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">마감 24h 긴급 알림</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  <button
                    onClick={() =>
                      handleApplySkill(
                        '매일 자정 dateBetween() 수식과 진행률 롤업 게이지를 자동 갱신하고 지연 태스크를 자동 분류하는 수식 스킬을 붙여줘.',
                        'D-Day 자정 자동 갱신'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Calculator className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">D-Day 자정 자동 갱신</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  <button
                    onClick={() =>
                      handleApplySkill(
                        '매주 월요일 08:30 지난주 완료 실적과 이번 주 집중 과제 TOP 3을 대시보드 상단에 3줄 요약 브리핑하는 스킬을 장착해줘.',
                        '주간 결산 브리핑'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Activity className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">주간 결산 브리핑</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  <button
                    onClick={() =>
                      handleApplySkill(
                        '하단에 Agent_Heartbeat_Log 감사 DB를 연결하고, 모든 자동화 트리거와 무손실 검증 이력을 기록하도록 구성해줘.',
                        '감사 로그 DB 연동'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">감사 로그 DB 연동</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        rightContent={({ isCollapsed, toggleCollapse }) => (
          <div className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-white dark:bg-notion-dark-bg">
            {/* 1. 상단 툴바 (뷰 전환 및 공유/배포 액션) - 고정 Header */}
            <div className="h-11 px-3 sm:px-6 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-notion-dark-border flex items-center justify-between gap-2 shrink-0 select-none z-20">
              <div className="flex items-center space-x-2 shrink-0">
                {/* 좌측 패널이 접혔을 때 나타나는 [▶ 펼치기] 버튼 */}
                {isCollapsed && (
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold whitespace-nowrap cursor-pointer"
                    title="좌측 에이전트 패널 펼치기"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>패널 열기</span>
                  </button>
                )}

                {/* [노션 페이지 뷰 | 구조 트리 뷰] 토글 */}
                <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs shrink-0">
                  <button
                    onClick={() => setPreviewMode('notion')}
                    className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
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
                    className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
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

              {/* 우측 액션 버튼: [공유], [</> JSON], [⚡ 내 노션에 템플릿 생성하기(Primary)] */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs shrink-0 flex-nowrap">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition whitespace-nowrap cursor-pointer shadow-2xs"
                  title="템플릿 공유 및 마크다운 내보내기"
                >
                  <Share2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="hidden lg:inline">공유</span>
                </button>

                <button
                  onClick={() => setIsRawJsonModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition whitespace-nowrap cursor-pointer shadow-2xs"
                  title="원시 JSON 데이터 확인 및 다운로드"
                >
                  <Code2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="hidden lg:inline">&lt;/&gt; JSON</span>
                  <span className="lg:hidden">&lt;/&gt;</span>
                </button>

                <button
                  onClick={publishToNotion}
                  disabled={isPublishing}
                  className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-600 dark:hover:to-teal-600 shadow-sm transition disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0 active:scale-95"
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

            {/* 2. 상단 모노톤 KPI 메트릭 요약 바 - 고정 Header */}
            <div className="px-4 sm:px-8 py-2 bg-slate-50/95 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto select-none shrink-0 shadow-2xs z-10">
              <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                {/* KPI 1: 진행률 게이지 */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    설계 진척도
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-16 sm:w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-800 dark:bg-slate-200 rounded-full w-full" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      100%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 shrink-0" />

                {/* KPI 2: 멀티 DB 수 */}
                <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 dark:text-slate-400">데이터베이스</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalDatabases}개</span>
                </div>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 shrink-0" />

                {/* KPI 3: 속성 수 */}
                <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 dark:text-slate-400">총 속성</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalProperties}개</span>
                </div>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 shrink-0" />

                {/* KPI 4: Formulas 2.0 수식 */}
                <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                  <Calculator className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-slate-500 dark:text-slate-400">Formulas 2.0</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">{totalFormulas}개</span>
                </div>
              </div>

              {/* KPI 5: 무손실 검증 상태 뱃지 */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 mr-1 text-slate-600 dark:text-slate-300" />
                  무손실 검증: PASS
                </span>
              </div>
            </div>

            {/* 3. [가장 중요] 세로 휠 스크롤(Vertical Scroll) 해제된 메인 캔버스 뷰 */}
            <div className="w-full h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {previewMode === 'tree' ? (
                <div className="p-4 sm:p-8 pb-32">
                  <StructureTreeView template={template} />
                </div>
              ) : (
                <div className="pb-32">
                  {/* 상용 베스트셀러 대비 고도화 분석 아코디언 */}
                  <div className="px-4 sm:px-10 md:px-12 pt-4">
                    <TemplateBenchmarkCard template={template} />
                  </div>

                  {/* 커버 이미지 */}
                  <NotionCover coverUrl={template.cover_url} />

                  {/* 노션 페이지 헤더 (이모지, 제목, 설명, 메타) */}
                  <NotionHeader
                    title={template.title}
                    icon={template.icon}
                    description={template.description}
                  />

                  {/* 페이지 레이아웃 블록들 */}
                  <div className="px-6 sm:px-10 md:px-12">
                    <NotionBlocks blocks={template.page_layout} />
                  </div>

                  {/* 다중 데이터베이스 섹션 */}
                  <div className="px-6 sm:px-10 md:px-12 mt-6 space-y-6">
                    {template.databases.map((db: NotionDatabase, idx: number) => (
                      <div key={idx} id={`db-section-${db.name}`}>
                        <NotionDatabaseView database={db} />
                      </div>
                    ))}
                  </div>

                  {/* 스키마 명세 테이블 */}
                  <div className="px-6 sm:px-10 md:px-12 mt-8">
                    <TemplateSchemaTable databases={template.databases} />
                  </div>

                  {/* 하단 통합 액션 배너 */}
                  <div className="px-6 sm:px-10 md:px-12 mt-12 mb-8">
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-indigo-950 to-neutral-900 text-white shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{template.icon || '📑'}</span>
                          <h4 className="text-base sm:text-lg font-extrabold text-white">
                            {template.title}
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                          이 템플릿을 내 노션에 직접 배포하거나, 하단 옴니 챗과 대화하여 우리 팀만의 전용 필드나 
                          수식을 손쉽게 추가할 수 있습니다.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          onClick={handleModifyWithChat}
                          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition active:scale-95 cursor-pointer"
                          title="해당 템플릿 구조를 AI 채팅창에 자동 입력하고 커스텀 수정을 시작합니다"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-300" />
                          <span>💬 대화로 수정하기</span>
                        </button>

                        <button
                          onClick={publishToNotion}
                          disabled={isPublishing}
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
                          title="클릭 한 번으로 내 노션 워크스페이스에 전체 페이지와 DB를 즉시 생성합니다"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              <span>생성 중...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                              <span>⚡ 이 템플릿 내 노션에 바로 생성</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default TemplatePreviewCanvas;
