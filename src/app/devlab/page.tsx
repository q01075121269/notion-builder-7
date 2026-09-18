import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Table, 
  Presentation, 
  BookOpen, 
  Zap, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Sparkles,
  Paperclip
} from 'lucide-react';

export type OfficeTab = 'docs' | 'sheets' | 'slides';
export type FormMode = 'free' | 'template'; // 자유 기획 모드 vs 표준 회사 양식 모드

interface SheetRow {
  id: string;
  item: string;
  qty: number;
  price: number;
}

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  bullets: [string, string, string];
  presenterNote: string;
}

export const DevLabPage: React.FC = () => {
  const { showToast } = useApp();

  // 1. 상태 관리
  const [activeTab, setActiveTab] = useState<OfficeTab>('docs');
  const [formMode, setFormMode] = useState<FormMode>('free');
  const [isNotebookLMOpen, setIsNotebookLMOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // NotebookLM 소스 문서 리스트
  const [sources, setSources] = useState<Array<{ id: string; name: string; type: string; size: string }>>([
    { id: 's1', name: '2026_Q3_사업계획서_최종.pdf', type: 'PDF', size: '2.4 MB' },
    { id: 's2', name: '시상식_예산_품의서_양식.docx', type: 'DOCX', size: '512 KB' },
  ]);
  const [newSourceName, setNewSourceName] = useState('');

  // Docs 내용 상태
  const [docTitle, setDocTitle] = useState('2026년 하반기 전략 AI 비즈니스 기획서');
  const [docSummary, setDocSummary] = useState('본 보고서는 AI 오피스 스튜디오 도입을 통한 업무 생산성 300% 향상 및 자동화 파이프라인 구축 방안을 제시합니다.');

  // Sheets 내용 상태
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([
    { id: '1', item: 'AI API 인프라 (Gemini 3.6 Flash)', qty: 10, price: 150000 },
    { id: '2', item: '노션 팀 워크스페이스 라이선스', qty: 5, price: 45000 },
    { id: '3', item: '고화질 미디어 렌더링 서버', qty: 2, price: 320000 },
    { id: '4', item: '클라우드 백업 및 오프라인 IDB 저장소', qty: 1, price: 120000 },
  ]);

  // Slides 내용 상태
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [slides] = useState<SlideItem[]>([
    {
      id: 1,
      title: '01. AI 오피스 혁신 핵심 전략',
      subtitle: '생산성 300% 향상을 위한 자동화 라이브 캔버스',
      bullets: [
        'Docs: AI 자동 요약 및 개조식 보고서 실시간 생성',
        'Sheets: 수식=SUM 자동 계산 및 예산 품의 대장 연동',
        'Slides: 감마(Gamma) 스타일 3단 카드리프 프레젠테이션'
      ],
      presenterNote: '발표 강조점: 노션 워크스페이스와의 원클릭 내보내기 양방향 시너지 강조'
    },
    {
      id: 2,
      title: '02. 비즈니스 양식 자동화 파이프라인',
      subtitle: '품의서 및 지출결의서 원클릭 자동 결재 지원',
      bullets: [
        '표준 회사 서식 클릭 한 번으로 자동 데이터 매핑',
        '합계 금액 자동 계산 수식 그리드 적용',
        'NotebookLM RAG 소스 기반 팩트 체크 및 근거 첨부'
      ],
      presenterNote: '발표 강조점: 문서 작성 시간 평균 45분 -> 3분 단축 데이터 제시'
    },
    {
      id: 3,
      title: '03. 향후 로드맵 및 통합 비전',
      subtitle: '4대 메인 챕터 완벽 통합 생태계 구축',
      bullets: [
        '1챕터 노션 빌더 커버 및 페이지 양방향 동기화',
        '2챕터 라이프 허브 마감 일정 자동 캘린더 등록',
        '4챕터 AI 미디어 랩 생성 자산 장표 즉시 삽입'
      ],
      presenterNote: '발표 강조점: 사용자 경험 단절 없는 원스톱 워크플로우 시연'
    }
  ]);

  // Sheets 수식 산출
  const calculateTotal = () => {
    return sheetRows.reduce((acc, row) => acc + row.qty * row.price, 0);
  };

  const handleAddSheetRow = () => {
    const newId = String(Date.now());
    setSheetRows((prev) => [...prev, { id: newId, item: '신규 품목/서비스', qty: 1, price: 50000 }]);
  };

  const handleDeleteSheetRow = (id: string) => {
    setSheetRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSheetChange = (id: string, field: keyof SheetRow, value: string | number) => {
    setSheetRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  // NotebookLM 소스 추가
  const handleAddSource = () => {
    if (!newSourceName.trim()) return;
    setSources((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, name: newSourceName.trim(), type: 'LINK', size: '웹 참조' }
    ]);
    setNewSourceName('');
    showToast('📚 NotebookLM 참조 소스가 성공적으로 추가되었습니다!', 'success');
  };

  // 내보내기 & 복사 동작
  const handleExportToNotion = () => {
    showToast('⚡ AI 오피스 라이브 캔버스 문서가 노션 워크스페이스에 즉시 내보내졌습니다!', 'success');
  };

  const handleDownload = () => {
    if (activeTab === 'sheets') {
      const csvHeader = '항목명,수량,단가,합계\n';
      const csvBody = sheetRows.map((r) => `"${r.item}",${r.qty},${r.price},${r.qty * r.price}`).join('\n');
      const totalRow = `\n총계,,,${calculateTotal()}`;
      const blob = new Blob([csvHeader + csvBody + totalRow], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `office-sheets-export-${Date.now()}.csv`;
      link.click();
      showToast('⬇️ CSV 데이터 파일 다운로드가 완료되었습니다.', 'success');
    } else {
      showToast(`⬇️ [${activeTab.toUpperCase()}] PDF 보고서 다운로드가 시작되었습니다.`, 'success');
    }
  };

  const handleCopyClipboard = () => {
    let copyContent = '';
    if (activeTab === 'docs') {
      copyContent = `# ${docTitle}\n\n${docSummary}\n\n## 1. 개요\n- 자유 기획 모드 및 회사 양식 지원\n- 노션 템플릿 빌더 연동 문서`;
    } else if (activeTab === 'sheets') {
      copyContent = sheetRows.map((r) => `${r.item}\t${r.qty}\t${r.price}\t${r.qty * r.price}`).join('\n') + `\n총합계:\t${calculateTotal()}원`;
    } else {
      copyContent = slides.map((s) => `[슬라이드 ${s.id}] ${s.title}\n${s.subtitle}\n- ${s.bullets.join('\n- ')}`).join('\n\n');
    }

    navigator.clipboard.writeText(copyContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast('📋 라이브 캔버스 내용이 클립보드에 복사되었습니다.', 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-neutral-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white select-none">
      
      {/* 1. 상단 글로벌 헤더 & 세그먼트 스위처 */}
      <div className="px-4 sm:px-6 py-3 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* 타이틀 & NotebookLM 서랍 토글 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNotebookLMOpen(!isNotebookLMOpen)}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer
              ${isNotebookLMOpen
                ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800'
                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 hover:bg-slate-200'
              }
            `}
            title="NotebookLM 참조 소스 서랍 열기/닫기"
          >
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="whitespace-nowrap">📚 NotebookLM 소스 ({sources.length})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />

          <div className="flex items-center space-x-2">
            <span className="text-xl">📑</span>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-800 dark:text-white whitespace-nowrap">
                AI 오피스 스튜디오
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                Docs • Sheets • Slides 3대 라이브 캔버스
              </p>
            </div>
          </div>
        </div>

        {/* 3대 모드 스위처 바 & 자유/표준양식 듀얼 토글 */}
        <div className="flex items-center space-x-3">
          
          {/* 📄 Docs / 📊 Sheets / 📑 Slides 세그먼트 버튼 */}
          <div className="flex items-center bg-slate-200/80 dark:bg-neutral-800 p-1 rounded-2xl border border-slate-300/60 dark:border-neutral-700/60">
            <button
              onClick={() => setActiveTab('docs')}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${activeTab === 'docs'
                  ? 'bg-white dark:bg-neutral-900 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>📄 스마트 독스 (Docs)</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${activeTab === 'sheets'
                  ? 'bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <Table className="w-3.5 h-3.5 text-emerald-500" />
              <span>📊 스마트 시트 (Sheets)</span>
            </button>

            <button
              onClick={() => setActiveTab('slides')}
              className={`
                flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${activeTab === 'slides'
                  ? 'bg-white dark:bg-neutral-900 text-amber-700 dark:text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <Presentation className="w-3.5 h-3.5 text-amber-500" />
              <span>📑 스마트 슬라이드 (Slides)</span>
            </button>
          </div>

          {/* 듀얼 양식 토글: [자유 기획 모드 ↔ 표준 회사 양식(지출결의서/품의서) 모드] */}
          <button
            onClick={() => setFormMode(formMode === 'free' ? 'template' : 'free')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-xs font-bold transition cursor-pointer whitespace-nowrap"
          >
            {formMode === 'free' ? (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 dark:text-neutral-300">자유 기획 모드</span>
              </>
            ) : (
              <>
                <ToggleRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-extrabold">📋 표준 회사 양식 모드</span>
              </>
            )}
          </button>
        </div>

        {/* 액션 바: 내보내기 / 다운로드 / 복사 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportToNotion}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ 노션 전송</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-300 transition cursor-pointer"
            title="다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">다운로드</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-300 transition cursor-pointer"
            title="클립보드 복사"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* 본문 레이아웃: NotebookLM 소스 서랍 + 중앙 라이브 캔버스 */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* NotebookLM 참고 문서/PDF 소스 접이식 패널 */}
        {isNotebookLMOpen && (
          <div className="w-80 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 flex flex-col p-4 space-y-4 shrink-0 overflow-y-auto animate-slideRight z-10">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">NotebookLM 참고 소스</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-extrabold">RAG 팩트 기반</span>
            </div>

            {/* 소스 추가 박스 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400">새 소스 추가 (PDF/웹 URL)</label>
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="문서명 또는 URL 입력..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddSource}
                  className="p-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 등록된 소스 목록 */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400">연동된 레퍼런스 소스 ({sources.length})</label>
              <div className="space-y-2">
                {sources.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-800/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {s.type === 'PDF' ? <Paperclip className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      <span className="text-xs font-medium text-slate-700 dark:text-neutral-300 truncate">{s.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">{s.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-1">
              <p className="text-[11px] font-bold text-purple-800 dark:text-purple-300 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>AI 인용 팩트 브리핑 작동 중</span>
              </p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 leading-tight">
                업로드된 소스 문서의 구절을 근거로 라이브 캔버스 내용이 자동 생성 및 검증됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 2. 중앙 라이브 캔버스 (Slate-50 배경, Slate-200 보더, shadow-sm) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-neutral-900/60 flex justify-center">
          
          <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            
            {/* 표준 회사 양식 배너 (양식 모드 활성화 시 표시) */}
            {formMode === 'template' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                    📋
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold">표준 회사 결재 양식 규격 적용 중</h4>
                    <p className="text-xs text-purple-100">기안자, 부서, 결재란 및 공식 합계 수식이 사전 매핑된 상태입니다.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black">공문서 서식</span>
              </div>
            )}

            {/* A. 📄 스마트 독스 (Docs) 뷰어 */}
            {activeTab === 'docs' && (
              <div className="space-y-6">
                
                {/* A4 서식 헤더 */}
                <div className="border-b border-slate-200 dark:border-neutral-800 pb-4 space-y-2">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full text-2xl sm:text-3xl font-black text-slate-900 dark:text-white bg-transparent focus:outline-none focus:border-b focus:border-blue-500"
                    placeholder="문서 제목 입력..."
                  />
                  {formMode === 'template' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800"><span className="text-slate-400">기안자:</span> <strong className="text-slate-700 dark:text-neutral-200">김노션 팀장</strong></div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800"><span className="text-slate-400">기안부서:</span> <strong className="text-slate-700 dark:text-neutral-200">AI 전략기획팀</strong></div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800"><span className="text-slate-400">기안일자:</span> <strong className="text-slate-700 dark:text-neutral-200">2026-09-19</strong></div>
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-neutral-800"><span className="text-slate-400">보존연한:</span> <strong className="text-slate-700 dark:text-neutral-200">5년 (영구)</strong></div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">작성일: 2026년 9월 19일 • 자유 기획 블록 분석 보고서</p>
                  )}
                </div>

                {/* 목차 (Table of Contents) 앵커 */}
                <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-neutral-300 flex items-center space-x-1.5">
                    <span>📌 문서 목차 (Table of Contents)</span>
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-neutral-400 space-y-1 list-disc list-inside">
                    <li>1. 개요 및 추진 배경</li>
                    <li>2. 핵심 실행 전략 3선 (개조식)</li>
                    <li>3. 파이프라인 시스템 아키텍처 다이어그램</li>
                  </ul>
                </div>

                {/* 개조식 본문 블록 */}
                <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>1. 개요 및 추진 배경</span>
                    </h3>
                    <textarea
                      value={docSummary}
                      onChange={(e) => setDocSummary(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm leading-relaxed"
                      rows={3}
                    />
                  </section>

                  <section className="space-y-2 pt-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>2. 핵심 실행 전략 (개조식 보고서)</span>
                    </h3>
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2 text-xs">
                      <p>• <strong>멀티 파이프라인 통합:</strong> Docs, Sheets, Slides 3대 라이브 캔버스 실시간 편집 체계 확보.</p>
                      <p>• <strong>노션 양방향 동기화:</strong> 기안 문서 클릭 한 번으로 워크스페이스 DB에 자동 적재.</p>
                      <p>• <strong>NotebookLM 팩트 인용:</strong> 참조 문서 PDF 소스 기반으로 환각 없는 정밀 보고서 작성.</p>
                    </div>
                  </section>

                  {/* 시스템 다이어그램 블록 */}
                  <section className="space-y-2 pt-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>3. 파이프라인 워크플로우 다이어그램</span>
                    </h3>
                    <div className="p-4 rounded-2xl bg-neutral-900 text-emerald-400 font-mono text-[11px] overflow-x-auto space-y-1">
                      <div>[사용자 입력/NotebookLM 소스] ➔ (Gemini 3.6 Flash 오케스트레이터)</div>
                      <div className="text-slate-500 pl-4">↓ 문맥 파싱 & 규격 변환</div>
                      <div>[Docs 개조식 보고서] | [Sheets 수식 그리드] | [Slides 카드 덱]</div>
                      <div className="text-slate-500 pl-4">↓ 원클릭 내보내기</div>
                      <div>[⚡ 노션 워크스페이스 최종 적재 완료]</div>
                    </div>
                  </section>
                </div>

              </div>
            )}

            {/* B. 📊 스마트 시트 (Sheets) 테이블 그리드 */}
            {activeTab === 'sheets' && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                      <span>{formMode === 'template' ? '📋 지출 결의 및 예산 집행 명세서' : '📊 스마트 시트 수식 그리드'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">수량 * 단가 자동 산출 및 `=SUM()` 합계 수식 연동 라이브 테이블</p>
                  </div>
                  <button
                    onClick={handleAddSheetRow}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>행 추가</span>
                  </button>
                </div>

                {/* 그리드 테이블 */}
                <div className="overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold border-b border-slate-200 dark:border-neutral-800">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">항목명 (A열)</th>
                        <th className="p-3 w-24 text-right">수량 (B열)</th>
                        <th className="p-3 w-32 text-right">단가 (C열)</th>
                        <th className="p-3 w-36 text-right">합계 금액 (D열 = B*C)</th>
                        <th className="p-3 w-12 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                      {sheetRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.item}
                              onChange={(e) => handleSheetChange(row.id, 'item', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium text-slate-800 dark:text-neutral-200"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={row.qty}
                              onChange={(e) => handleSheetChange(row.id, 'qty', Number(e.target.value))}
                              className="w-full px-2 py-1 text-right rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-slate-800 dark:text-neutral-200"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={row.price}
                              onChange={(e) => handleSheetChange(row.id, 'price', Number(e.target.value))}
                              className="w-full px-2 py-1 text-right rounded border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-slate-800 dark:text-neutral-200"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(row.qty * row.price).toLocaleString()} 원
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteSheetRow(row.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50 dark:bg-emerald-950/40 font-bold border-t-2 border-emerald-200 dark:border-emerald-800">
                      <tr>
                        <td colSpan={4} className="p-3.5 text-right text-emerald-800 dark:text-emerald-300 font-extrabold">
                          =SUM(D2:D{sheetRows.length + 1}) 총 집행 금액:
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm text-emerald-700 dark:text-emerald-300 font-black">
                          {calculateTotal().toLocaleString()} 원
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>
            )}

            {/* C. 📑 스마트 슬라이드 (Slides) 감마(Gamma) 스타일 프리뷰 */}
            {activeTab === 'slides' && (
              <div className="space-y-6">
                
                {/* 슬라이드 덱 네비게이터 */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Presentation className="w-5 h-5 text-amber-500" />
                      <span>📑 감마(Gamma) 스타일 프레젠테이션 카드 덱</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      총 {slides.length}개 장표 • 현재 슬라이드 {currentSlideIdx + 1} / {slides.length}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      disabled={currentSlideIdx === 0}
                      onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                      className="p-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-neutral-300">
                      {currentSlideIdx + 1} / {slides.length}
                    </span>
                    <button
                      disabled={currentSlideIdx === slides.length - 1}
                      onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                      className="p-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 현재 슬라이드 메인 카드 */}
                <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-slate-100 dark:to-neutral-900 border-2 border-amber-400/40 dark:border-amber-500/30 shadow-md space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Slide {slides[currentSlideIdx].id}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {slides[currentSlideIdx].title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 font-medium">
                      {slides[currentSlideIdx].subtitle}
                    </p>
                  </div>

                  {/* 3단 카드 세부 내용 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {slides[currentSlideIdx].bullets.map((bullet, bIdx) => (
                      <div
                        key={bIdx}
                        className="p-4 rounded-2xl bg-white/90 dark:bg-neutral-800/90 border border-slate-200/80 dark:border-neutral-700 shadow-xs space-y-2"
                      >
                        <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-extrabold text-xs">
                          0{bIdx + 1}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-relaxed">
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 발표자 노트 */}
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">🎙️ Presenter Note</span>
                    <p className="text-slate-300 italic">{slides[currentSlideIdx].presenterNote}</p>
                  </div>
                </div>

                {/* 슬라이드 썸네일 스트립 */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setCurrentSlideIdx(idx)}
                      className={`
                        p-3 rounded-2xl border text-left transition cursor-pointer space-y-1
                        ${idx === currentSlideIdx
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-400/40'
                          : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 opacity-70 hover:opacity-100'
                        }
                      `}
                    >
                      <span className="text-[10px] font-bold text-amber-600">Slide 0{s.id}</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{s.title}</p>
                    </button>
                  ))}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default DevLabPage;
