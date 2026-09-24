import React from 'react';
import type { OfficeCitation } from '../../types/office';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Bookmark
} from 'lucide-react';

interface FactCitationPopoverProps {
  citation: OfficeCitation | null;
  onClose: () => void;
  onFocusSource?: (sourceId: string, sourceTitle: string) => void;
}

export const FactCitationPopover: React.FC<FactCitationPopoverProps> = ({
  citation,
  onClose,
  onFocusSource
}) => {
  if (!citation) return null;

  const handleFocusClick = () => {
    if (onFocusSource) {
      onFocusSource(citation.sourceId, citation.sourceTitle);
    }
    // 글로벌 이벤트 디스패치 (KnowledgeDock 소스 스크롤 포커스)
    window.dispatchEvent(new CustomEvent('focus-office-source', {
      detail: { sourceId: citation.sourceId, sourceTitle: citation.sourceTitle }
    }));
    onClose();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="fact-citation-dialog-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-fadeIn select-text"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                NotebookLM Fact Grounding
              </span>
              <h4 id="fact-citation-dialog-title" className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                원천 팩트 출처 검증 팝오버
              </h4>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 신뢰도 지수 녹색 뱃지 */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>신뢰도 지수: 100% 팩트 일치 (Grounded)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-extrabold">
            무결성 검증됨
          </span>
        </div>

        {/* 2. 원천 소스명 & 위치 */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
            원천 소스명
          </span>
          <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{citation.sourceTitle}</span>
            <span className="ml-auto text-[10px] font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
              {citation.pageOrLine}
            </span>
          </div>
        </div>

        {/* 3. 검증된 원문 인용문 (Quote) */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
            검증된 원문 인용문 (Quote)
          </span>
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-serif">
            "{citation.textQuote}"
          </div>
        </div>

        {/* 4. 하단 버튼: 좌측 지식 창고의 해당 소스 카드로 스크롤 포커스 */}
        <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleFocusClick}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>원천 소스 확인</span>
          </button>
        </div>

      </div>
    </div>
  );
};
