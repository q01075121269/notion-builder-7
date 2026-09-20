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
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { SmartDocsRenderer } from '../../components/office/SmartDocsRenderer';
import { SmartSheetsRenderer } from '../../components/office/SmartSheetsRenderer';
import { SmartSlidesRenderer } from '../../components/office/SmartSlidesRenderer';
import { NotebookLMDrawer } from '../../components/office/NotebookLMDrawer';
import { syncOfficeStudioToNotion } from '../../services/notionOfficeSyncService';
import type { OfficeSyncResult } from '../../services/notionOfficeSyncService';

export type OfficeTab = 'docs' | 'sheets' | 'slides';
export type FormMode = 'free' | 'template';

export const DevLabPage: React.FC = () => {
  const { showToast, notionApiKey, notionParentPageId } = useApp();

  const [activeTab, setActiveTab] = useState<OfficeTab>('docs');
  const [formMode, setFormMode] = useState<FormMode>('free');
  const [isNotebookLMOpen, setIsNotebookLMOpen] = useState(false);
  const [activeCitationId, setActiveCitationId] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // 노션 동기화 프로그래스 모달 상태
  const [isSyncingModalOpen, setIsSyncingModalOpen] = useState(false);
  const [syncStep, setSyncStep] = useState<1 | 2 | 3>(1);
  const [syncStepMessage, setSyncStepMessage] = useState('');
  const [syncResult, setSyncResult] = useState<OfficeSyncResult | null>(null);

  const handleSelectCitation = (id: number) => {
    setActiveCitationId(id);
    setIsNotebookLMOpen(true);
    showToast(`📚 [각주 인용 ${id}] NotebookLM 원천 소스 지점으로 이동했습니다.`, 'info');
  };

  // ⚡ [노션 마스터 DB로 원클릭 내보내기]
  const handleExportToNotion = async () => {
    setIsSyncingModalOpen(true);
    setSyncStep(1);
    setSyncStepMessage('[1/3] 노션 DB 스키마 및 API 키 검증 중...');
    setSyncResult(null);

    const docTitle = formMode === 'free'
      ? `2026년 4분기 신규 사업 기획 보고서 (${activeTab.toUpperCase()})`
      : `표준 지출결의서 및 기안 품의서 (${activeTab.toUpperCase()})`;

    const result = await syncOfficeStudioToNotion(
      {
        tab: activeTab,
        title: docTitle,
        formMode,
        notionApiKey: notionApiKey || undefined,
        parentPageId: notionParentPageId || undefined,
      },
      (step, msg) => {
        setSyncStep(step);
        setSyncStepMessage(msg);
      }
    );

    setSyncResult(result);
    showToast('⚡ AI 오피스 라이브 문서가 노션 마스터 DB에 성공적으로 적재되었습니다!', 'success');
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
    showToast(`📋 [${activeTab.toUpperCase()}] 라이브 캔버스 데이터가 클립보드에 복사되었습니다.`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white select-none relative">
      
      {/* 0. 노트북LM형 지식 소스 서랍 & 모달 */}
      <NotebookLMDrawer
        isOpen={isNotebookLMOpen}
        onClose={() => setIsNotebookLMOpen(false)}
        activeCitationId={activeCitationId}
        onClearCitation={() => setActiveCitationId(null)}
      />

      {/* 1. 상단 글로벌 헤더 & 세그먼트 스위처 */}
      <div className="px-4 sm:px-6 py-3 bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* 타이틀 & NotebookLM 서랍 토글 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNotebookLMOpen(!isNotebookLMOpen)}
            className={`
              flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer shadow-xs active:scale-95
              ${isNotebookLMOpen
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100'
              }
            `}
            title="NotebookLM 참고 소스 서랍 열기/닫기"
          >
            <BookOpen className="w-4 h-4 text-purple-500 dark:text-purple-300" />
            <span className="whitespace-nowrap">📚 참고 소스 (NotebookLM)</span>
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />

          <div className="flex items-center space-x-2">
            <span className="text-xl">📑</span>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-800 dark:text-white whitespace-nowrap">
                AI 오피스 스튜디오
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                Docs • Sheets • Slides 전문 인터랙티브 라이브 캔버스
              </p>
            </div>
          </div>
        </div>

        {/* 3대 모드 스위처 바 & 자유/표준양식 듀얼 토글 */}
        <div className="flex items-center space-x-3">
          
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-xs transition cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ 노션 마스터 DB로 내보내기</span>
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

      {/* 본문 레이아웃: 탭 전환 시 데이터 휘발 방지 마운트 유지 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 dark:bg-neutral-900/60 flex justify-center">
        <div className={`w-full ${activeTab === 'docs' ? 'block' : 'hidden'}`}>
          <SmartDocsRenderer
            formMode={formMode}
            onSelectCitation={handleSelectCitation}
          />
        </div>

        <div className={`w-full ${activeTab === 'sheets' ? 'block' : 'hidden'}`}>
          <SmartSheetsRenderer formMode={formMode} />
        </div>

        <div className={`w-full ${activeTab === 'slides' ? 'block' : 'hidden'}`}>
          <SmartSlidesRenderer formMode={formMode} />
        </div>
      </div>

      {/* ⚡ 노션 마스터 DB 실시간 동기화 프로그래스 모달 */}
      {isSyncingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  노션 마스터 DB 원클릭 동기화
                </h3>
              </div>
              <button onClick={() => setIsSyncingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 단계별 프로그래스 진행 표시 */}
            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center space-x-3 text-xs font-bold text-slate-800 dark:text-neutral-200">
                {syncStep < 3 ? (
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <span>{syncStepMessage}</span>
              </div>

              {/* 3단계 프로세스 아이콘 표시 */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className={`p-2 rounded-xl border ${syncStep >= 1 ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                  1. DB 검증
                </div>
                <div className={`p-2 rounded-xl border ${syncStep >= 2 ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                  2. 블록 매핑
                </div>
                <div className={`p-2 rounded-xl border ${syncStep >= 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  3. 적재 완결
                </div>
              </div>
            </div>

            {/* 동기화 완료 후 [🔗 노션 페이지로 이동] 바로가기 버튼 */}
            {syncResult?.notionPageUrl && (
              <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 space-y-2">
                <a
                  href={syncResult.notionPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center space-x-2 transition cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>[🔗 노션 워크스페이스 페이지로 이동]</span>
                </a>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default DevLabPage;
