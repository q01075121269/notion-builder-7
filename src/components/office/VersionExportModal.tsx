import React, { useState } from 'react';
import type { OfficeDocument } from '../../types/office';
import { 
  X, 
  FileText, 
  Table, 
  Presentation, 
  Printer, 
  Copy, 
  ShieldCheck, 
  Check, 
  FileDown, 
  Download,
  AlertCircle
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

interface VersionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficeDocument;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
  initialTab?: 'hwpx' | 'xlsx' | 'pptx' | 'pdf';
}

export const VersionExportModal: React.FC<VersionExportModalProps> = ({
  isOpen,
  onClose,
  document,
  onShowToast,
  initialTab: _initialTab = 'hwpx'
}) => {
  const [isCompiling, setIsCompiling] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toast = onShowToast || ((_msg: string, _type?: string) => {});
  const preflightReport = runPreflightQualityGate(document);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const baseFilename = `${document.title.replace(/[\s/\\?%*:|"<>]/g, '_')}_${dateStr}`;

  // 1. HWPX 다운로드
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

  // 2-1. XLSX 다운로드
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

  // 3. PPTX 다운로드
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

  // 4. A4 다이렉트 프린트
  const handleDirectPrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
    toast('A4 표준 여백 인쇄 대화상자를 호출했습니다.', 'info');
  };

  // 5. 사내 그룹웨어/결재망 양식 복사
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none no-print"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* 상단 타이틀 */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5 text-slate-200 dark:text-zinc-800" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                버전 호환 스마트 옴니 출하 컴파일러
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                한컴 2014~2026, 엑셀 1997~365, 파워포인트 전 버전 하위 호환성을 보증합니다.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 사전 비행 안전 검수기 (Pre-flight Quality Gate) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850/80 border border-slate-200 dark:border-zinc-750 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>사전 비행 컴플라이언스 & 안전 검수 결과</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
              preflightReport.passed 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}>
              {preflightReport.passed ? '보안 및 표준 컴플라이언스 100% 통과' : '경고 항목 발견'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-zinc-300 pt-1">
            {preflightReport.details.map((detail, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{detail}</span>
              </div>
            ))}
          </div>

          {preflightReport.detectedPhoneNumbers.length > 0 && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-200 flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>본문 내 휴대전화 번호 감지: 대외 발송 전 마스킹(010-****-XXXX) 여부를 검토하세요.</span>
            </div>
          )}
        </div>

        {/* 2. 사내 전자결재망 1초 서식 복사기 (Smart Clipboard Injector) */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-xs font-black text-indigo-950 dark:text-indigo-200">
              <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>사내 전자결재망 1초 서식 복사기 (Smart Clipboard)</span>
            </div>
            <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
              구형 한글 및 그룹웨어 인트라넷에 Ctrl+V 하면 결재선 표와 들여쓰기가 깨짐 없이 그대로 붙여넣어집니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyGroupware}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center space-x-1.5 shadow-xs ${
              copiedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>그룹웨어 양식 복사</span>
              </>
            )}
          </button>
        </div>

        {/* 3. 4대 버전 호환 파일 다운로드 그리드 */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            버전 호환 파일 포맷 선택:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* (1) HWPX 공문서 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">한컴 공문서 (.hwpx)</h4>
                    <span className="text-[10px] text-slate-400 font-mono">국가 표준 OWPML (KS X 6101)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  4단 결재란, 메타데이터 표, 개조식 들여쓰기, 최하단 '  끝.' 완벽 호환
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadHwpx}
                disabled={isCompiling === 'hwpx'}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isCompiling === 'hwpx' ? '컴파일 중...' : '.hwpx 다운로드'}</span>
              </button>
            </div>

            {/* (2) XLSX & CSV 스프레드시트 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">스프레드시트 (.xlsx / .csv)</h4>
                    <span className="text-[10px] text-slate-400 font-mono">1997년 이후 전 버전 호환 수식</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  불변 표준 수식(=SUM) 바인딩 및 구형 ERP용 UTF-8 BOM CSV 제공
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadXlsx}
                  disabled={isCompiling === 'xlsx'}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={isCompiling === 'csv'}
                  className="py-2 px-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-slate-700 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
                  title="구형 사내 전산/ERP용 CSV"
                >
                  .csv (ERP용)
                </button>
              </div>
            </div>

            {/* (3) PPTX 프레젠테이션 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                    <Presentation className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">발표 슬라이드 (.pptx)</h4>
                    <span className="text-[10px] text-slate-400 font-mono">16:9 와이드 비율 프레젠테이션</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  핵심 제목, 3단 비교 카드, 단계별 로드맵 블록 자동 컴파일
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPptx}
                disabled={isCompiling === 'pptx'}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isCompiling === 'pptx' ? '컴파일 중...' : '.pptx 다운로드'}</span>
              </button>
            </div>

            {/* (4) PDF / A4 다이렉트 프린트 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">A4 다이렉트 인쇄 / PDF</h4>
                    <span className="text-[10px] text-slate-400 font-mono">20mm 표준 여백 인쇄 전용 CSS</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  상단 헤더와 사이드바를 자동 마스킹하고 본문 캔버스만 정확히 출력
                </p>
              </div>

              <button
                type="button"
                onClick={handleDirectPrint}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF 저장 / A4 인쇄</span>
              </button>
            </div>
          </div>
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
