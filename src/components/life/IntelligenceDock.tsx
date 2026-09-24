// src/components/life/IntelligenceDock.tsx
// 2026 자율 AI 에이전트 브리핑 바 (Intelligence Dock)

import React, { useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Sun, 
  ChevronUp, 
  ChevronDown
} from 'lucide-react';


interface IntelligenceDockProps {
  inboxCount?: number;
  statusMessage?: string | null;
}

export const IntelligenceDock: React.FC<IntelligenceDockProps> = ({ 
  inboxCount = 3,
  statusMessage = null
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="sticky bottom-2 z-30 max-w-7xl mx-auto w-full px-4 sm:px-7 pointer-events-none">
      <div className="pointer-events-auto rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-md py-1.5 px-3 sm:px-4 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-2 min-h-[36px]">
          {/* 좌측 에이전트 브랜딩 */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="p-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1">
              <span>Agent 3.0</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-mono font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                LIVE
              </span>
            </span>
          </div>

          {/* 중앙 3대 핵심 브리핑 칩 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* 1. 인박스 자동 분류 */}
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-colors ${
              statusMessage
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
            }`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{statusMessage || `인박스: ${inboxCount}건 분류 완료`}</span>
            </div>

            {/* 2. 일정 감시자 경고 */}
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>일정 감시: '독서 모임' D-4 저조 경고</span>
            </div>

            {/* 3. 생체 에너지/집중도 권장 */}
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-[10px] font-semibold hidden md:flex">
              <Sun className="w-3 h-3 text-blue-600 shrink-0" />
              <span>에너지: 고집중 4시간 권장</span>
            </div>
          </div>

          {/* 우측 펼치기 토글 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
            title="에이전트 권고 상세 보기"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* 상세 확장 패널 */}
        {isExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 text-[11px]">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">📥 인박스 분류 인사이트</span>
              <p className="text-zinc-500 dark:text-zinc-400">
                세무 상담 서류 및 Q3 지표 엑셀이 감지되었습니다. 2클릭으로 Projects 하위 문서로 아카이빙할 수 있습니다.
              </p>
            </div>

            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 text-[11px]">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">⚠️ 마일스톤 리스크</span>
              <p className="text-zinc-500 dark:text-zinc-400">
                10월 2일 발제 예정인 '독서 모임 준비' 슬라이드 미완료 상태입니다. 오늘 오후 슬롯(15:00) 배치를 권장합니다.
              </p>
            </div>

            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 text-[11px]">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">⚡ 최적 생산성 리듬</span>
              <p className="text-zinc-500 dark:text-zinc-400">
                어제 수면 7.5시간(점수 88점)으로 인지 능력이 최고 수준입니다. P0 플래그십 발표자료 검수를 최우선 착수하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
