// src/components/life/MorningBriefingModal.tsx
// Apple & Linear 감성의 2026 모닝 루틴 브리핑 카드 인터랙티브 모달

import React from 'react';
import { 
  Sun, 
  X, 
  Target, 
  AlertTriangle, 
  Flame, 
  Rocket, 
  Clock, 
  CheckCircle2
} from 'lucide-react';
import type { TaskHabitItem, ResolvedProjectItem } from '../../types/lifeHub';

interface MorningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskHabitItem[];
  projects: ResolvedProjectItem[];
  onStartDay: () => void;
}

export const MorningBriefingModal: React.FC<MorningBriefingModalProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  onStartDay
}) => {
  if (!isOpen) return null;

  // 1. 오늘 날짜 포맷 (한국어)
  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 2. 오늘의 Top 3 (미완료 실행과제 기준)
  const pendingTasks = tasks.filter(t => !t.completed && t.type === '할일');
  const top3Tasks = pendingTasks.slice(0, 3);

  // 총 예상 소요시간 계산
  let totalMinutes = 0;
  top3Tasks.forEach(t => {
    if (t.duration?.includes('h')) {
      const h = parseInt(t.duration, 10) || 1;
      totalMinutes += h * 60;
    } else if (t.duration?.includes('m')) {
      const m = parseInt(t.duration, 10) || 30;
      totalMinutes += m;
    } else {
      totalMinutes += 30;
    }
  });
  const durationSummary = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60 > 0 ? (totalMinutes % 60) + '분' : ''}`.trim()
    : `${totalMinutes}분`;

  // 3. 마감 임박 또는 지연 프로젝트
  const urgentProjects = projects.filter(p => {
    if (p.status === '완료') return false;
    const tag = p.ddayTag || '';
    return tag.includes('오늘') || tag.includes('D-0') || tag.includes('D-1') || tag.includes('D-2') || tag.includes('지연');
  });

  // 4. 모닝 해빗 스트릭 달성 현황
  const habitTasks = tasks.filter(t => t.type === '모닝루틴');
  const completedHabits = habitTasks.filter(t => t.completed).length;
  const maxStreak = Math.max(...habitTasks.map(t => t.streakCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 앰비언트 라이트 */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

        {/* 헤더 & 닫기 */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                <Sun className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
                {dateStr}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              좋은 아침입니다, 사용자님.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              오늘의 핵심 실행 과제와 활성 프로젝트 상태를 요약했습니다.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. 🎯 오늘의 핵심 Top 3 (Next Actions) 리스트 및 소요시간 요약 */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                오늘 반드시 끝낼 Top 3 (MITs)
              </h3>
            </div>
            <span className="flex items-center space-x-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>총 예상 {durationSummary}</span>
            </span>
          </div>

          {top3Tasks.length > 0 ? (
            <div className="space-y-2">
              {top3Tasks.map((t, idx) => (
                <div 
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-600 dark:text-zinc-300 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {t.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <span>오늘 예정된 미완료 과제가 모두 비어 있습니다. 여유로운 하루를 즐기세요!</span>
            </div>
          )}
        </div>

        {/* 2열 정보: [⚠️ 마감 임박 프로젝트] & [🔥 모닝 해빗 스트릭] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 마감 임박/지연 프로젝트 알림 */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>마감 임박 프로젝트</span>
            </div>
            {urgentProjects.length > 0 ? (
              <div className="space-y-1.5">
                {urgentProjects.slice(0, 2).map(p => (
                  <div key={p.id} className="text-xs p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {p.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                      <span>{p.area}</span>
                      <span className="font-bold text-rose-500">{p.ddayTag || '임박'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-1">
                현재 임박한 긴급 프로젝트가 없습니다.
              </p>
            )}
          </div>

          {/* 모닝 해빗 스트릭 달성 현황 */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>모닝 해빗 스트릭</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1">
              <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                <span>🔥 최대 {maxStreak || 14}일 연속 달성 중!</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                오늘 루틴 {completedHabits}/{habitTasks.length}건 완료됨.
              </p>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            나중에 보기
          </button>

          <button
            onClick={onStartDay}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 transition shadow-md cursor-pointer active:scale-95"
          >
            <Rocket className="w-4 h-4" />
            <span>오늘 하루 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
