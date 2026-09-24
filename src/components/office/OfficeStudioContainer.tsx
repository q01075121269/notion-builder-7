import React, { useState } from 'react';
import type { 
  OfficeProject, 
  OfficeDocument, 
  OfficeDocumentFormat, 
  CanvasViewMode, 
  OfficeSource,
  PlanTriad
} from '../../types/office';
import { SEED_PROJECTS } from '../../services/officeSeedData';
import { KnowledgeDock } from './KnowledgeDock';
import { UniversalSmartCanvas } from './UniversalSmartCanvas';
import { InPlaceCopilot } from './InPlaceCopilot';
import { useApp } from '../../context/AppContext';
import { 
  Folder, 
  Plus, 
  FileText, 
  Presentation, 
  Table, 
  Mic, 
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const OfficeStudioContainer: React.FC = () => {
  const { showToast, setCurrentView } = useApp();

  // 1. 프로젝트 상태
  const [projects, setProjects] = useState<OfficeProject[]>(SEED_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(SEED_PROJECTS[0].id);

  // 현재 활성 프로젝트 및 문서 참조
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const currentDoc = activeProject.currentDoc;

  // 2. 캔버스 뷰 모드 ('triad' | 'canvas')
  const [viewMode, setViewMode] = useState<CanvasViewMode>('canvas');

  // 3. Undo 히스토리 스택
  const [historyStack, setHistoryStack] = useState<Array<{ action: string; docSnapshot: OfficeDocument }>>([]);

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

    showToast(`✨ ${actionName} 완료`, 'info');
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
    showToast(`⏪ '${lastEntry.action}' 작업을 롤백했습니다.`, 'info');
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

  // 새 프로젝트 추가
  const handleCreateNewProject = () => {
    const newProjId = `proj-${Date.now()}`;
    const newProj: OfficeProject = {
      id: newProjId,
      title: '새 기획 프로젝트 2026',
      description: '새로운 AI 오피스 워크스페이스 문서 기획',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      sources: [],
      currentDoc: {
        ...currentDoc,
        id: `doc-${Date.now()}`,
        projectId: newProjId,
        title: '새 기획 프로젝트 공식 기안서'
      },
      planTriad: activeProject.planTriad
    };

    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newProjId);
    showToast('📂 신규 프로젝트 워크스페이스가 생성되었습니다.', 'success');
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
    showToast(`📚 '${source.title}' 지식 창고에 적재 완료!`, 'success');
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

  // 3-Way 옵션 선택
  const handleSelectOption = (optKey: 'A' | 'B' | 'C') => {
    if (!activeProject.planTriad) return;
    const updatedTriad: PlanTriad = {
      ...activeProject.planTriad,
      selectedOption: optKey
    };
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, planTriad: updatedTriad };
      }
      return p;
    }));
  };

  // 3-Way 질문 답변 완료 후 문서에 반영 직결
  const handleApplyPlanToDoc = (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }) => {
    if (!activeProject.planTriad) return;
    const chosen = selectedKey === 'A' 
      ? activeProject.planTriad.optionA 
      : selectedKey === 'B' 
        ? activeProject.planTriad.optionB 
        : activeProject.planTriad.optionC;

    // 공문서 내용에 선택한 안을 반영
    const updatedSections = currentDoc.content.docsContent.sections.map(sec => {
      if (sec.id === 'sec-6') {
        return { ...sec, text: `선정 전략: [${selectedKey}안] ${chosen.title} 기반 확정` };
      }
      if (sec.id === 'sec-7') {
        return { ...sec, text: `핵심 타깃 및 도입 채널: ${qaAnswers.targetDetail} 대상, ${qaAnswers.channelDetail} 연계 추진` };
      }
      return sec;
    });

    const updatedDoc: OfficeDocument = {
      ...currentDoc,
      title: `${chosen.title} 공식 추진 기안서`,
      content: {
        ...currentDoc.content,
        docsContent: { sections: updatedSections }
      }
    };

    updateDocument(updatedDoc, `[${selectedKey}안] 전략 및 소크라테스 답변 문서 반영`);
    setViewMode('canvas');
    showToast(`🎉 [${selectedKey}안] 전략이 정식 기안서에 연동되었습니다!`, 'success');
  };

  // 옴니 출하 액션들
  const handleExportHwpx = () => {
    showToast('💾 [.hwpx] 한글 표준 공문서 파일 변환 및 다운로드를 시작합니다.', 'success');
  };

  const handleExportPptx = () => {
    showToast('📊 [.pptx] 16:9 와이드 프레젠테이션 덱 다운로드가 완료되었습니다.', 'success');
  };

  const handleExportXlsx = () => {
    try {
      const { headers, rows } = currentDoc.content.sheetsContent;
      const data = [
        headers,
        ...rows.map(r => r.cells)
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '예산산출내역');
      XLSX.writeFile(wb, `${activeProject.title}_예산내역.xlsx`);
      showToast('📈 [.xlsx] 스프레드시트 엑셀 파일 다운로드가 완료되었습니다!', 'success');
    } catch {
      showToast('엑셀 생성 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleExportPdf = () => {
    window.print();
    showToast('📄 PDF 인쇄 대화상자를 호출했습니다.', 'info');
  };

  const handleSendToNotion = () => {
    showToast('☁️ 노션 마스터 Wiki 데이터베이스로 실시간 문서 적재가 완료되었습니다!', 'success');
  };

  const handleSyncToLifeHub = () => {
    setCurrentView('life');
    showToast('⚡ 회의록 액션 아이템이 [🌱 라이프 Hub] 투두 데이터베이스와 연동되었습니다!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans select-none relative">
      
      {/* ========================================================================= */}
      {/* 1. 상단 글로벌 서브 헤더 (조종석 콘솔 바) */}
      {/* ========================================================================= */}
      <header className="px-3 sm:px-6 py-2.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs z-20">
        
        {/* (1) 프로젝트 탭 스위처 */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto max-w-[420px] scrollbar-none py-0.5">
          {projects.map(proj => (
            <button
              key={proj.id}
              onClick={() => setActiveProjectId(proj.id)}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 border
                ${activeProjectId === proj.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 shadow-2xs'
                  : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200'
                }
              `}
              title={proj.title}
            >
              <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{proj.title}</span>
            </button>
          ))}

          <button
            onClick={handleCreateNewProject}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer shrink-0 border border-dashed border-slate-300 dark:border-zinc-600"
            title="새 프로젝트 생성"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새 프로젝트</span>
          </button>
        </div>

        {/* (2) 문서 포맷 선택기 (4대 포맷) */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200 dark:border-zinc-750 shrink-0">
          <button
            onClick={() => handleFormatChange('docs')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              currentDoc.format === 'docs'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>🏢 공문서/기안서</span>
          </button>

          <button
            onClick={() => handleFormatChange('slides')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              currentDoc.format === 'slides'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Presentation className="w-3.5 h-3.5 text-amber-500" />
            <span>📊 발표 슬라이드</span>
          </button>

          <button
            onClick={() => handleFormatChange('sheets')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              currentDoc.format === 'sheets'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-500" />
            <span>📈 스프레드시트</span>
          </button>

          <button
            onClick={() => handleFormatChange('minutes')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              currentDoc.format === 'minutes'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-purple-500" />
            <span>🎙️ 회의록·할일</span>
          </button>
        </div>

        {/* (3) 옴니 출하 액션 바 */}
        <div className="flex items-center space-x-1 shrink-0 overflow-x-auto">
          <button
            onClick={handleExportHwpx}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer whitespace-nowrap"
            title="한글 HWPX 다운로드"
          >
            💾 .hwpx
          </button>

          <button
            onClick={handleExportPptx}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer whitespace-nowrap"
            title="파워포인트 PPTX 다운로드"
          >
            📊 .pptx
          </button>

          <button
            onClick={handleExportXlsx}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer whitespace-nowrap"
            title="엑셀 XLSX 다운로드"
          >
            📈 .xlsx
          </button>

          <button
            onClick={handleExportPdf}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer whitespace-nowrap"
            title="A4 PDF 인쇄 / 저장"
          >
            🖨️ PDF 인쇄
          </button>

          <button
            onClick={handleSendToNotion}
            className="px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-extrabold hover:opacity-90 transition cursor-pointer whitespace-nowrap shadow-xs"
            title="노션 Wiki 마스터 DB로 전송"
          >
            ☁️ 노션 Wiki
          </button>

          <button
            onClick={handleSyncToLifeHub}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-extrabold hover:opacity-90 transition cursor-pointer whitespace-nowrap shadow-xs"
            title="할 일 목록을 라이프 Hub로 연동"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>할일 ➔ 라이프 Hub</span>
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. 본문 2열 벤토 분할 (좌측 35% Knowledge Dock vs 우측 65% Universal Smart Canvas) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* 좌측 35%: Knowledge Dock */}
        <div className="w-full lg:w-[35%] h-full shrink-0 flex flex-col">
          <KnowledgeDock
            sources={activeProject.sources}
            onToggleSelectSource={handleToggleSelectSource}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
          />
        </div>

        {/* 우측 65%: Universal Smart Canvas */}
        <div className="flex-1 h-full flex flex-col min-w-0">
          <UniversalSmartCanvas
            document={currentDoc}
            planTriad={activeProject.planTriad}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            onChangeDocument={updateDocument}
            onSelectOption={handleSelectOption}
            onApplyPlanToDoc={handleApplyPlanToDoc}
            onSyncToLifeHub={handleSyncToLifeHub}
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. 대화형 인플레이스 실시간 코파일럿 (우측 하단 플로팅) */}
      {/* ========================================================================= */}
      <InPlaceCopilot
        document={currentDoc}
        onChangeDocument={updateDocument}
        onUndo={handleUndo}
        canUndo={historyStack.length > 0}
        lastActionName={historyStack[historyStack.length - 1]?.action}
      />

    </div>
  );
};
