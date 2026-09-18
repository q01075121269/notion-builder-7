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
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { SmartDocsRenderer } from '../../components/office/SmartDocsRenderer';
import { SmartSheetsRenderer } from '../../components/office/SmartSheetsRenderer';
import { SmartSlidesRenderer } from '../../components/office/SmartSlidesRenderer';

export type OfficeTab = 'docs' | 'sheets' | 'slides';
export type FormMode = 'free' | 'template'; // 자유 기획 모드 vs 표준 회사 양식 모드

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
    showToast('⚡ AI 오피스 전문 라이브 문서가 노션 워크스페이스에 즉시 내보내졌습니다!', 'success');
  };

  const handleDownload = () => {
    if (activeTab === 'sheets') {
      showToast('⬇️ [스마트 시트] CSV 데이터 파일 다운로드가 완료되었습니다.', 'success');
    } else if (activeTab === 'docs') {
      showToast('⬇️ [스마트 독스] A4 PDF 보고서 다운로드가 완료되었습니다.', 'success');
    } else {
      showToast('⬇️ [스마트 슬라이드] 16:9 프레젠테이션 PDF 다운로드가 완료되었습니다.', 'success');
    }
  };

  const handleCopyClipboard = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast(`📋 [${activeTab.toUpperCase()}] 라이브 캔버스 내용이 클립보드에 복사되었습니다.`, 'info');
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
                Docs • Sheets • Slides 전문 렌더러 라이브 캔버스
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

      {/* 본문 레이아웃: NotebookLM 소스 서랍 + 중앙 전문 렌더러 라이브 캔버스 */}
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

        {/* 2. 중앙 전문 렌더러 라이브 캔버스 (Slate-50 배경) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-neutral-900/60 flex justify-center">
          {activeTab === 'docs' ? (
            <SmartDocsRenderer formMode={formMode} />
          ) : activeTab === 'sheets' ? (
            <SmartSheetsRenderer formMode={formMode} />
          ) : (
            <SmartSlidesRenderer formMode={formMode} />
          )}
        </div>

      </div>

    </div>
  );
};

export default DevLabPage;
