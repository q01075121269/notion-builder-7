import React from 'react';
import type { 
  OfficeDocument, 
  CanvasViewMode, 
  PlanTriad, 
  PlanOption,
  OfficeCitation,
  OfficeSource
} from '../../types/office';
import { TriOptionIdeator } from './TriOptionIdeator';
import { SparkpageCanvas } from './canvas/SparkpageCanvas';
import { SlidesCanvas } from './canvas/SlidesCanvas';
import { SheetsCanvas } from './canvas/SheetsCanvas';
import { MinutesCanvas } from './canvas/MinutesCanvas';
import { MindMapCanvas } from './canvas/MindMapCanvas';
import { InfographicCanvas } from './canvas/InfographicCanvas';
import { BriefingReportCanvas } from './canvas/BriefingReportCanvas';
import { Sparkles, LayoutDashboard } from 'lucide-react';
import { useSparkTheme } from '../../context/SparkThemeContext';
import type { SparkpagePayload } from '../../types/spark';

interface UniversalSmartCanvasProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  sources?: OfficeSource[];
  sparkpageData?: SparkpagePayload | null;
  isResearching?: boolean;
  researchStep?: number;
  researchMessage?: string;
  viewMode: CanvasViewMode;
  onChangeViewMode: (mode: CanvasViewMode) => void;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onUpdatePlanTriad: (newTriad: PlanTriad) => void;
  onApplyPlanToDoc: (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }, chosenOption?: PlanOption) => void;
  onSelectCitation?: (citation: OfficeCitation) => void;
  onSyncToLifeHub?: () => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const UniversalSmartCanvas: React.FC<UniversalSmartCanvasProps> = ({
  document,
  planTriad,
  sources = [],
  sparkpageData,
  isResearching = false,
  researchStep = 1,
  researchMessage = '',
  viewMode,
  onChangeViewMode,
  onChangeDocument,
  onUpdatePlanTriad,
  onApplyPlanToDoc,
  onSelectCitation,
  onSyncToLifeHub,
  onShowToast
}) => {
  const { themeConfig } = useSparkTheme();

  return (
    <div className={`w-full h-full flex flex-col ${themeConfig.appBg} overflow-hidden select-none relative transition-colors duration-200`}>
      
      {/* 1. 상단 모드 전환 탭 바 (3-Way 기획 vs Bento Grid 스파크 캔버스) */}
      <div className={`px-4 sm:px-6 py-2 border-b ${themeConfig.headerBorder} ${themeConfig.headerBg} flex items-center justify-between shrink-0 shadow-2xs transition-colors duration-200`}>
        <div className="flex items-center space-x-1 sm:space-x-2 bg-black/20 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => onChangeViewMode('canvas')}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap
              ${viewMode === 'canvas'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
              }
            `}
          >
            <LayoutDashboard className="w-4 h-4 mr-1 text-cyan-400 shrink-0" />
            <span>스파크 캔버스 (Bento Grid)</span>
          </button>

          <button
            onClick={() => onChangeViewMode('triad')}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap
              ${viewMode === 'triad'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
              }
            `}
          >
            <Sparkles className="w-4 h-4 mr-1 text-indigo-400 shrink-0" />
            <span>3-Way 전략 비교</span>
          </button>
        </div>

        {/* 현재 활성 포맷 상태 뱃지 */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
            뷰 포맷:
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase font-mono ${themeConfig.pillBg} ${themeConfig.pillBorder} ${themeConfig.pillText}`}>
            {document.format === 'docs' ? 'SPARKPAGE' : document.format.toUpperCase()}
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
          <div className="w-full h-full min-h-full">
            {document.format === 'docs' && (
              <SparkpageCanvas
                document={document}
                planTriad={planTriad}
                sources={sources}
                sparkpageData={sparkpageData}
                isResearching={isResearching}
                researchStep={researchStep}
                researchMessage={researchMessage}
                onChangeDocument={onChangeDocument}
                onApplyPlanToDoc={(key, qa) => onApplyPlanToDoc(key, qa)}
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

            {document.format === 'mindmap' && (
              <MindMapCanvas
                document={document}
                onChangeDocument={onChangeDocument}
                onShowToast={onShowToast}
              />
            )}

            {document.format === 'infographic' && (
              <InfographicCanvas
                document={document}
                planTriad={planTriad}
                onChangeDocument={onChangeDocument}
                onShowToast={onShowToast}
              />
            )}

            {document.format === 'briefing' && (
              <BriefingReportCanvas
                document={document}
                planTriad={planTriad}
                onShowToast={onShowToast}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
};
