import React from 'react';
import type { OfficeDocument, PlanTriad } from '../../../types/office';
import { 
  FileCheck, 
  Printer, 
  Copy, 
  Sparkles, 
  CheckCircle2, 
  FileText
} from 'lucide-react';

interface BriefingReportCanvasProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const BriefingReportCanvas: React.FC<BriefingReportCanvasProps> = ({
  document,
  planTriad: _planTriad,
  onShowToast
}) => {
  const toast = onShowToast || ((_m: string) => {});

  const totalBudget = document.content.sheetsContent?.rows.reduce((acc, r) => {
    const val = typeof r.cells[3] === 'number' ? (r.cells[3] as number) : 0;
    return acc + val;
  }, 0) || 55000000;

  const sections = document.content.docsContent?.sections || [];

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `[경영진 브리핑 리포트] ${document.title}
1. 기안: ${document.metadata.department} ${document.metadata.author} (${document.metadata.date})
2. 총 예산: ₩${totalBudget.toLocaleString()}
3. 핵심 요약:
${sections.slice(0, 5).map(s => `• ${s.text}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    toast('브리핑 리포트 텍스트가 클립보드에 복사되었습니다.', 'success');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-y-auto select-none">
      
      {/* 1. 상단 브리핑 툴바 */}
      <div className="h-12 px-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">경영진 1-Page 브리핑 리포트</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Executive Brief
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">의사결정을 위한 핵심 지표 및 실행 과제를 1페이지로 집약한 정규 요약본입니다.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-zinc-700"
            title="텍스트 복사"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>요약 복사</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            title="인쇄 및 PDF 저장"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>보고서 인쇄</span>
          </button>
        </div>
      </div>

      {/* 2. A4 스타일 브리핑 리포트 본문 용지 */}
      <div className="flex-1 p-6 sm:p-10 flex justify-center">
        <div className="w-full max-w-[840px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
          
          {/* 리포트 헤더 */}
          <div className="border-b-2 border-teal-600 dark:border-teal-500 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-600 dark:text-teal-400 mb-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="uppercase tracking-widest">Executive Briefing Summary</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {document.title}
              </h1>
            </div>

            <div className="text-xs text-slate-500 dark:text-zinc-400 text-right space-y-1">
              <div>기안일자: <strong className="text-slate-800 dark:text-zinc-200">{document.metadata.date}</strong></div>
              <div>소속: <strong className="text-slate-800 dark:text-zinc-200">{document.metadata.department} ({document.metadata.author})</strong></div>
              <div>문서번호: <span className="font-mono text-teal-600 dark:text-teal-400">{document.metadata.docNumber}</span></div>
            </div>
          </div>

          {/* 1. 핵심 요약 (Executive Summary) */}
          <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50">
            <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200 mb-2 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>핵심 의사결정 요약 (Executive Summary)</span>
            </h3>
            <p className="text-xs sm:text-sm text-teal-800 dark:text-teal-300 leading-relaxed font-medium">
              본 프로젝트는 행정안전부 공문서 OWPML 규격 및 수식 연동 스프레드시트를 AI 스튜디오 단일 환경에서 처리하여 
              기존 수작업 대비 전사 문서 생산성을 320% 향상시키고, 결재 검증 오류율 0%를 달성하기 위한 전사 전략 사업입니다.
            </p>
          </div>

          {/* 2. 주요 정량적 지표 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">총 소요 예산</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                ₩{totalBudget.toLocaleString()}
              </div>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">=SUM 수식 정산 완료</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">예상 생산성 제고</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                +320%
              </div>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">수기 입력 공수 절감</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80">
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">컴플라이언스</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                OWPML 적합
              </div>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">한컴 2014~2026 호환</div>
            </div>
          </div>

          {/* 3. 본문 세부 브리핑 항목 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 border-b pb-2 border-slate-200 dark:border-zinc-800">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>주요 보고 사항 (개조식)</span>
            </h3>

            <div className="space-y-2.5">
              {sections.slice(0, 8).map((sec, idx) => (
                <div 
                  key={sec.id || idx}
                  className={`text-xs sm:text-sm text-slate-700 dark:text-zinc-300 ${
                    sec.level === 1 
                      ? 'font-bold text-slate-900 dark:text-white pt-2' 
                      : sec.level === 2 
                        ? 'pl-3 font-semibold' 
                        : 'pl-6 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="font-mono text-teal-600 dark:text-teal-400 mr-2">{sec.marker}</span>
                  <span>{sec.text.replace(/^[0-9]+\.\s*|^□\s*|^○\s*|^―\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 결재 및 검토 요청 */}
          <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <div>
              위와 같이 보고서를 제출하오니 재가하여 주시기 바랍니다.
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">결재 상태:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                최종 심의 대기
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
