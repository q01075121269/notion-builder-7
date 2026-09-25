// src/components/office/charts/TimelineConnector.tsx
// 단계별 수평 파이프라인 마일스톤 커넥터

import React from 'react';
import { CheckCircle2, Clock, CircleDot, ArrowRight } from 'lucide-react';

export interface TimelineStepItem {
  phase: string;
  title: string;
  desc: string;
  status: 'completed' | 'in_progress' | 'pending';
  date?: string;
}

interface TimelineConnectorProps {
  steps?: TimelineStepItem[];
  title?: string;
  className?: string;
}

const DEFAULT_STEPS: TimelineStepItem[] = [
  { phase: 'Phase 1', title: '사내 규정 검증 & 보안 감사', desc: '제45조 보안 게이트웨이 승인', status: 'completed', date: '3월 완료' },
  { phase: 'Phase 2', title: '파일럿 부서 30인 실증', desc: '기안서/예산안 수기 공수 70% 절감', status: 'in_progress', date: '4월 진행중' },
  { phase: 'Phase 3', title: '전사 ERP/그룹웨어 결재선 연동', desc: '4단 결재 자동 파이핑', status: 'pending', date: '5월 예정' },
  { phase: 'Phase 4', title: '대표이사 재가 및 전사 확산', desc: '100% 디지털 워크플로우 안착', status: 'pending', date: '6월 완료' }
];

export const TimelineConnector: React.FC<TimelineConnectorProps> = ({
  steps = DEFAULT_STEPS,
  title = '2026 단계별 추진 로드맵 & 마일스톤',
  className = ''
}) => {
  return (
    <div className={`w-full p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-sm ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
        <h4 className="text-xs font-bold text-zinc-200">{title}</h4>
        <span className="text-[11px] font-mono text-zinc-400">Total {steps.length} Milestones</span>
      </div>

      {/* 타임라인 가로 파이프라인 */}
      <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isInProgress = step.status === 'in_progress';

          return (
            <div key={idx} className="relative flex flex-col justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 group hover:border-zinc-700 transition-all">
              {/* 상단 노드 뱃지 및 상태 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {step.phase}
                </span>

                {isCompleted && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    완료
                  </span>
                )}
                {isInProgress && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 animate-pulse">
                    <CircleDot className="w-3.5 h-3.5" />
                    진행중
                  </span>
                )}
                {!isCompleted && !isInProgress && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    대기
                  </span>
                )}
              </div>

              {/* 제목 및 설명 */}
              <div>
                <h5 className="text-xs font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {step.title}
                </h5>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* 하단 날짜 표시 */}
              {step.date && (
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>일정</span>
                  <span className={isInProgress ? 'text-blue-400 font-bold' : ''}>{step.date}</span>
                </div>
              )}

              {/* 단계간 화살표 (마지막 제외) */}
              {idx < steps.length - 1 && (
                <div className="hidden sm:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 items-center justify-center text-zinc-400 shadow-md">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
