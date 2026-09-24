import React from 'react';
import type { 
  OfficeDocument, 
  CanvasViewMode, 
  PlanTriad, 
  PlanOption,
  OfficeCitation 
} from '../../types/office';
import { TriOptionIdeator } from './TriOptionIdeator';
import { GovDocsCanvas } from './canvas/GovDocsCanvas';
import { SlidesCanvas } from './canvas/SlidesCanvas';
import { SheetsCanvas } from './canvas/SheetsCanvas';
import { MinutesCanvas } from './canvas/MinutesCanvas';
import { Sparkles, FileText } from 'lucide-react';

interface UniversalSmartCanvasProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  viewMode: CanvasViewMode;
  onChangeViewMode: (mode: CanvasViewMode) => void;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onUpdatePlanTriad: (newTriad: PlanTriad) => void;
  onApplyPlanToDoc: (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }, chosenOption?: PlanOption) => void;
  onSelectCitation?: (citation: OfficeCitation) => void;
  onSyncToLifeHub?: () => void;
}

export const UniversalSmartCanvas: React.FC<UniversalSmartCanvasProps> = ({
  document,
  planTriad,
  viewMode,
  onChangeViewMode,
  onChangeDocument,
  onUpdatePlanTriad,
  onApplyPlanToDoc,
  onSelectCitation,
  onSyncToLifeHub
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-100/70 dark:bg-zinc-950 overflow-hidden select-none relative">
      
      {/* 1. 상단 모드 전환 탭 바 (3-Way 기획 vs 실시간 캔버스) */}
      <div className="px-4 sm:px-6 py-2 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
          <button
            onClick={() => onChangeViewMode('triad')}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap
              ${viewMode === 'triad'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-200 dark:border-indigo-900'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>💡 3-Way 기획 인큐베이터</span>
          </button>

          <button
            onClick={() => onChangeViewMode('canvas')}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap
              ${viewMode === 'canvas'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-200 dark:border-indigo-900'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>📄 실시간 인플레이스 캔버스</span>
          </button>
        </div>

        {/* 현재 활성 포맷 상태 뱃지 */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
            현재 문서 양식:
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 uppercase font-mono">
            {document.format.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. 본문 뷰 렌더러 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'triad' && planTriad ? (
          <TriOptionIdeator
            planTriad={planTriad}
            onUpdatePlanTriad={onUpdatePlanTriad}
            onApplyPlanToDoc={onApplyPlanToDoc}
          />
        ) : (
          <div className="w-full min-h-full">
            {document.format === 'docs' && (
              <GovDocsCanvas
                document={document}
                onChangeDocument={onChangeDocument}
                onSelectCitation={onSelectCitation}
              />
            )}

            {document.format === 'slides' && (
              <SlidesCanvas
                document={document}
                onChangeDocument={onChangeDocument}
              />
            )}

            {document.format === 'sheets' && (
              <SheetsCanvas
                document={document}
                onChangeDocument={onChangeDocument}
              />
            )}

            {document.format === 'minutes' && (
              <MinutesCanvas
                document={document}
                onChangeDocument={onChangeDocument}
                onSyncToLifeHub={onSyncToLifeHub}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
};
