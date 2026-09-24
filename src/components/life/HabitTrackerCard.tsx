// src/components/life/HabitTrackerCard.tsx
// Sunsama 스타일 모닝 루틴 & 스마트 해빗 트래커 카드 (Formulas 2.0 게이지 & 연속 달성 스트릭 연동)

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  CheckCircle2, 
  Circle, 
  SunMedium, 
  Sparkles,
  Trophy,
  RotateCcw
} from 'lucide-react';

interface HabitItem {
  id: string;
  title: string;
  completed: boolean;
  timeSlot: string;
  icon?: string;
}

const DEFAULT_HABITS: HabitItem[] = [
  { id: 'h1', title: '기상 후 미온수 & 스트레칭', completed: true, timeSlot: '07:00 AM', icon: '💧' },
  { id: 'h2', title: '모닝 루틴 브리핑 확인', completed: true, timeSlot: '07:15 AM', icon: '🎧' },
  { id: 'h3', title: '경제 뉴스레터 정독', completed: true, timeSlot: '07:30 AM', icon: '📰' },
  { id: 'h4', title: '영양제 복용 및 마인드셋', completed: false, timeSlot: '08:00 AM', icon: '💊' }
];

const HABIT_STORAGE_KEY = 'antigravity_sunsama_habits_v1';
const STREAK_STORAGE_KEY = 'antigravity_sunsama_streak_v1';

export const HabitTrackerCard: React.FC = () => {
  const [habits, setHabits] = useState<HabitItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_HABITS;
    try {
      const saved = localStorage.getItem(HABIT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_HABITS;
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    if (typeof window === 'undefined') return 14;
    try {
      const saved = localStorage.getItem(STREAK_STORAGE_KEY);
      return saved ? parseInt(saved, 10) : 14;
    } catch {
      return 14;
    }
  });

  // 상태 변경 시 로컬 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(habits));
      localStorage.setItem(STREAK_STORAGE_KEY, String(streakDays));
    }
  }, [habits, streakDays]);

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const completionRate = Math.round((completedCount / totalCount) * 100);

  // Formulas 2.0 비주얼 달성률 게이지 바 (8칸 게이지)
  // 예: 3/4 완료 = 75% -> ■■■■■■□□ 75%
  const totalBlocks = 8;
  const filledBlocks = Math.round((completionRate / 100) * totalBlocks);
  const gaugeString = `${'■'.repeat(filledBlocks)}${'□'.repeat(totalBlocks - filledBlocks)} ${completionRate}%`;

  const toggleHabit = (id: string) => {
    setHabits(prev => {
      const next = prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
      const nextDone = next.filter(h => h.completed).length;
      if (nextDone === totalCount) {
        setStreakDays(s => s + 1);
      }
      return next;
    });
  };

  const handleReset = () => {
    setHabits(DEFAULT_HABITS.map(h => ({ ...h, completed: false })));
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-white/20">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <SunMedium className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              모닝 루틴 & 스마트 해빗
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* 연속 달성 스트릭 태그 */}
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
            <span>🔥 {streakDays}일 연속</span>
          </span>

          <button
            onClick={handleReset}
            title="오늘 루틴 초기화"
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 비주얼 달성률 게이지 바 (Formulas 2.0) */}
      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/60 mb-3">
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-zinc-600 dark:text-zinc-300">
          <span className="flex items-center space-x-1 text-zinc-500">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>일일 달성률 게이지</span>
          </span>
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-xs">
            {gaugeString}
          </span>
        </div>

        {/* 프로그레스 바 라인 */}
        <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completionRate === 100 
                ? 'bg-emerald-500' 
                : completionRate >= 50 
                  ? 'bg-amber-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* 습관 목록 체크박스 리스트 */}
      <div className="space-y-1.5">
        {habits.map((habit) => (
          <div
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
              habit.completed
                ? 'bg-zinc-50/60 dark:bg-zinc-950/30 border-zinc-200/50 dark:border-zinc-800/40 opacity-75'
                : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-amber-400/80 shadow-2xs'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                type="button"
                className="text-zinc-400 hover:text-amber-500 transition shrink-0"
              >
                {habit.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500" />
                )}
              </button>

              <div className="flex items-center space-x-1.5 truncate">
                <span className="text-xs">{habit.icon}</span>
                <span className={`text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate ${
                  habit.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                }`}>
                  {habit.title}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">
              {habit.timeSlot}
            </span>
          </div>
        ))}
      </div>

      {/* 올 클리어 축하 배너 */}
      {completionRate === 100 && (
        <div className="mt-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center space-x-1.5 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold animate-bounce-subtle">
          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
          <span>오늘의 모닝 루틴 100% 완수! 활기찬 하루 되세요! 🌟</span>
        </div>
      )}
    </div>
  );
};
