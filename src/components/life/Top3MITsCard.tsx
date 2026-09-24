// src/components/life/Top3MITsCard.tsx
// 오늘의 Top 3 (Next Actions / Most Important Tasks) 카드

import React, { useState } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Zap, 
  Coffee
} from 'lucide-react';


import type { TaskHabitItem } from '../../types/lifeHub';

export interface MITItem {
  id: string;
  priority: '🔥 P0' | '⚡ P1' | '☕ P2';
  title: string;
  duration: string;
  completed: boolean;
  notes?: string;
}

interface Top3MITsCardProps {
  tasks?: TaskHabitItem[];
  onToggleTask?: (taskId: string) => void;
}

const DEFAULT_MITS: MITItem[] = [
  {
    id: 'mit-1',
    priority: '🔥 P0',
    title: '3분기 런칭 발표자료 최종 검수',
    duration: '45m',
    completed: false,
    notes: 'Vercel 서버리스 엣지 아키텍처 및 벤치마크 지표 슬라이드 점검'
  },
  {
    id: 'mit-2',
    priority: '⚡ P1',
    title: '세무 상담 필요 서류 PDF 인박스 정리',
    duration: '20m',
    completed: false,
    notes: '종합소득세 및 법인카드 지출 영수증 클라우드 업로드'
  },
  {
    id: 'mit-3',
    priority: '☕ P2',
    title: '헬스장 하체 루틴 및 단백질 섭취',
    duration: '60m',
    completed: true,
    notes: '스쿼트 5세트 + 레그프레스 & 운동 후 쉐이크 섭취 완료'
  }
];

export const Top3MITsCard: React.FC<Top3MITsCardProps> = ({ tasks, onToggleTask }) => {
  const [internalMits, setInternalMits] = useState<MITItem[]>(DEFAULT_MITS);

  // tasks가 전달된 경우 tasks 중 미완료/우선순위 상위 3건 매핑
  const mits: MITItem[] = tasks && tasks.length > 0 
    ? [...tasks]
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const prioOrder: Record<string, number> = { '🔥 P0': 0, '⚡ P1': 1, '☕ P2': 2 };
          return (prioOrder[a.priority] ?? 3) - (prioOrder[b.priority] ?? 3);
        })
        .slice(0, 3)
        .map(t => ({
          id: t.id,
          priority: t.priority,
          title: t.title,
          duration: t.duration || '30m',
          completed: t.completed,
          notes: t.notes || (t.dueDate ? `마감: ${t.dueDate}` : undefined)
        }))
    : internalMits;

  const handleToggle = (id: string) => {
    if (onToggleTask) {
      onToggleTask(id);
    } else {
      setInternalMits(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    }
  };

  const getPriorityBadge = (p: string) => {
    if (p.includes('P0')) {
      return (
        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
          <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          <span>P0 긴급</span>
        </span>
      );
    }
    if (p.includes('P1')) {
      return (
        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
          <Zap className="w-2.5 h-2.5 text-amber-500" />
          <span>P1 중요</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
        <Coffee className="w-2.5 h-2.5 text-blue-500" />
        <span>P2 여유</span>
      </span>
    );
  };

  const completedCount = mits.filter(m => m.completed).length;

  return (
    <div id="top3-action-card" className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-white/20">
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            오늘의 Top 3 (Next Actions / MITs)
          </h3>
        </div>

        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          {completedCount} / 3 완수
        </span>
      </div>

      {/* MITs 3개 카드 */}
      <div className="space-y-2">
        {mits.map((mit, index) => (
          <div
            key={mit.id}
            onClick={() => handleToggle(mit.id)}
            className={`group flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
              mit.completed
                ? 'bg-zinc-50/60 dark:bg-zinc-950/40 border-zinc-200/50 dark:border-zinc-800/40 opacity-70'
                : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-rose-400/70 shadow-2xs'
            }`}
          >
            {/* 체크박스 */}
            <button
              type="button"
              className="mt-0.5 text-zinc-400 hover:text-rose-500 transition shrink-0"
            >
              {mit.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-rose-500" />
              )}
            </button>

            {/* 본문 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 font-mono">
                    #{index + 1}
                  </span>
                  {getPriorityBadge(mit.priority)}
                </div>

                <span className="flex items-center space-x-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  <Clock className="w-2.5 h-2.5" />
                  <span>예상: {mit.duration}</span>
                </span>
              </div>

              <h4 className={`text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 ${
                mit.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
              }`}>
                {mit.title}
              </h4>

              {mit.notes && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {mit.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
