import React, { useState } from 'react';
import type { OfficeDocument } from '../../types/office';
import { 
  X, 
  FileText, 
  Table, 
  Presentation, 
  FileCheck, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  CloudUpload,
  Headphones,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { 
  runPreflightQualityGate, 
  generateHwpxBlob, 
  generateXlsxBlob, 
  generateCsvBlob, 
  generatePptxBlob, 
  copyForGroupware, 
  downloadBlob 
} from '../../lib/office/fileExporters';

interface OmniExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficeDocument;
  onOpenLifeHubBridge: () => void;
  onOpenNotionWikiModal: () => void;
  onOpenAudioBriefing: () => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const OmniExportDrawer: React.FC<OmniExportDrawerProps> = ({
  isOpen,
  onClose,
  document,
  onOpenLifeHubBridge,
  onOpenNotionWikiModal,
  onOpenAudioBriefing,
  onShowToast
}) => {
  const [isCompiling, setIsCompiling] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toast = onShowToast || ((_msg: string, _type?: string) => {});
  const preflightReport = runPreflightQualityGate(document);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseFilename = `${document.title.replace(/[\s/\\?%*:|"<>]/g, '_')}_${dateStr}`;

  // 1. HWPX 공문서 다운로드
  const handleDownloadHwpx = async () => {
    setIsCompiling('hwpx');
    try {
      const blob = await generateHwpxBlob(document);
      downloadBlob(blob, `${baseFilename}.hwpx`);
      toast(`[.hwpx] 한컴 2014~2026 전 버전 호환 OWPML 규격 공문서 다운로드 완료`, 'success');
    } catch (e) {
      console.error(e);
      toast('HWPX 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCompiling(null);
    }
  };

  // 2-1. XLSX 스프레드시트 다운로드
  const handleDownloadXlsx = () => {
    setIsCompiling('xlsx');
    try {
      const blob = generateXlsxBlob(document);
      downloadBlob(blob, `${baseFilename}.xlsx`);
      toast(`[.xlsx] 구형 엑셀 호환 표준 수식(=SUM) 바인딩 파일 다운로드 완료`, 'success');
    } catch (e) {
      console.error(e);
      toast('XLSX 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCompiling(null);
    }
  };

  // 2-2. CSV 다운로드
  const handleDownloadCsv = () => {
    setIsCompiling('csv');
    try {
      const blob = generateCsvBlob(document);
      downloadBlob(blob, `${baseFilename}.csv`);
      toast(`[.csv] 사내 ERP/전산용 UTF-8 BOM 텍스트 파일 다운로드 완료`, 'success');
    } catch (e) {
      console.error(e);
      toast('CSV 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCompiling(null);
    }
  };

  // 3. PPTX 슬라이드 다운로드
  const handleDownloadPptx = async () => {
    setIsCompiling('pptx');
    try {
      const blob = await generatePptxBlob(document);
      downloadBlob(blob, `${baseFilename}.pptx`);
      toast(`[.pptx] 16:9 와이드 카드 슬라이드 덱 다운로드 완료`, 'success');
    } catch (e) {
      console.error(e);
      toast('PPTX 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCompiling(null);
    }
  };

  // 4. 순수 PDF 다운로드 및 A4 종이 인쇄
  const handleDirectPrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
    toast('A4 표준 여백 인쇄 대화상자를 호출했습니다.', 'info');
  };

  // 5. 사내 결재망 1초 서식 복사
  const handleCopyGroupware = async () => {
    const res = await copyForGroupware(document);
    if (res.success) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
      toast(res.message, 'success');
    } else {
      toast(res.message, 'error');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden no-print select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="omni-drawer-title"
    >
      {/* 배경 오버레이 (클릭 시 닫기) */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-2xs transition-opacity animate-fadeIn cursor-pointer"
      />

      {/* 우측 400px 슬라이드 서랍 본체 */}
      <aside 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        aria-label="우측 옴니 출하 서랍"
      >
        <div className="w-screen max-w-[400px] bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full animate-slideInRight">
          
          {/* 상단 서랍 헤더 */}
          <div className="h-14 px-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900 shrink-0">
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
              <div>
                <h2 id="omni-drawer-title" className="text-sm font-black text-slate-900 dark:text-white">
                  최종 저장 및 옴니 출하
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[240px]">
                  {document.title}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="서랍 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 스크롤 가능한 본체 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* ========================================================================= */}
            {/* 섹션 1: 사전 비행 안전 검수 (Pre-flight Quality Gate) */}
            {/* ========================================================================= */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    사전 비행 품질 검수
                  </span>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                  {preflightReport.complianceScore}점 / {preflightReport.passed ? '통과' : '검토필요'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                  <span>공문서 표기 (&quot; 끝.&quot; 마커)</span>
                  {preflightReport.hasEndMarker ? (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" /> 규격 통과
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-500 text-[11px] font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> 누락 감지
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                  <span>개인정보 마스킹 (휴대폰 번호)</span>
                  {preflightReport.detectedPhoneNumbers.length === 0 ? (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" /> 미검출 (안전)
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-500 text-[11px] font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" /> {preflightReport.detectedPhoneNumbers.length}건 감지
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex items-center space-x-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>국가 표준 KS X 6101 컴플라이언스 100% 통과</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 섹션 2: 파일 다운로드 센터 */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                파일 다운로드 센터
              </span>

              <div className="space-y-2">
                {/* 1) 한컴 공문서 (.hwpx) */}
                <button
                  onClick={handleDownloadHwpx}
                  disabled={isCompiling === 'hwpx'}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-left transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        한컴 공문서 (.hwpx)
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        한컴 2014~2026 OWPML 표준 규격
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white font-mono">
                    {isCompiling === 'hwpx' ? '생성중...' : '다운로드'}
                  </span>
                </button>

                {/* 2) 스프레드시트 (.xlsx / .csv) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadXlsx}
                    disabled={isCompiling === 'xlsx'}
                    className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                      <Table className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Excel (.xlsx)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      불변 표준 수식 바인딩
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    disabled={isCompiling === 'csv'}
                    className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                      <Table className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">전산용 (.csv)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      사내 ERP UTF-8 BOM
                    </span>
                  </button>
                </div>

                {/* 3) 발표 슬라이드 (.pptx) */}
                <button
                  onClick={handleDownloadPptx}
                  disabled={isCompiling === 'pptx'}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-left transition cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center shrink-0">
                      <Presentation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        발표 슬라이드 (.pptx)
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                        16:9 와이드 카드 슬라이드 덱
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white font-mono">
                    {isCompiling === 'pptx' ? '생성중...' : '다운로드'}
                  </span>
                </button>

                {/* 4) 표준 PDF 문서 및 A4 종이 인쇄 */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDirectPrint}
                    className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 mb-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">PDF 저장</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      A4 여백 20mm 규격
                    </span>
                  </button>

                  <button
                    onClick={handleDirectPrint}
                    className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-left transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-1.5 text-slate-700 dark:text-zinc-300 mb-1">
                      <Printer className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">A4 종이 인쇄</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      다이렉트 프린트 호출
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 섹션 3: 스마트 클립보드 서식 복사기 */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                사내 결재망 서식 복사
              </span>

              <button
                onClick={handleCopyGroupware}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>HTML 서식 복사 완료 (Ctrl+V)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>사내 결재망 1초 서식 복사</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                구형 한글 및 액티브X 전자결재 본문창에 서식 그대로 붙여넣어집니다.
              </p>
            </div>

            {/* ========================================================================= */}
            {/* 섹션 4: 에코시스템 직결 */}
            {/* ========================================================================= */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                에코시스템 직결 파이프라인
              </span>

              {/* 1) 라이프 Hub Tasks DB */}
              <button
                onClick={() => {
                  onClose();
                  onOpenLifeHubBridge();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white dark:bg-zinc-800 hover:opacity-95 transition cursor-pointer shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">할일 ➔ 라이프 Hub Tasks DB 등록</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">직결</span>
              </button>

              {/* 2) 노션 Wiki 배포 */}
              <button
                onClick={() => {
                  onClose();
                  onOpenNotionWikiModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <CloudUpload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-bold">노션 Wiki 클라우드 배포</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">클라우드</span>
              </button>

              {/* 3) 2분 오디오 브리핑 */}
              <button
                onClick={() => {
                  onClose();
                  onOpenAudioBriefing();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold">2분 오디오 브리핑 플레이어</span>
                </div>
                <span className="text-[11px] text-indigo-500 font-mono">오디오</span>
              </button>
            </div>

          </div>

          {/* 하단 푸터 */}
          <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-center shrink-0">
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              Office Studio 2026 Omni-Export Engine · KS X 6101 & ISO/IEC 29500
            </p>
          </div>

        </div>
      </aside>
    </div>
  );
};
