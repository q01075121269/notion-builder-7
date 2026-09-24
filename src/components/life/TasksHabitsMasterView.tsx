// src/components/life/TasksHabitsMasterView.tsx
// ② Tasks & Habits DB: 일일 실행 과제 & 모닝 루틴 트래커 뷰 (루틴 스트릭 수식 & 소속 프로젝트 관계형)

import React, { useState } from 'react';
import {
  CheckSquare,
  Flame,
  Clock,
  Calendar,
  Plus,
  Trash2,
  FolderGit2,
  CheckCircle2,
  Circle,
  Sun
} from 'lucide-react';
import type { TaskHabitItem, TaskType, TaskPriority, ProjectItem } from '../../types/lifeHub';

interface TasksHabitsMasterViewProps {
  tasks: TaskHabitItem[];
  projects: ProjectItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: {
    title: string;
    type: TaskType;
    dueDate: string;
    priority: TaskPriority;
    duration: string;
    projectId?: string;
    streakCount?: number;
    notes?: string;
  }) => void;
  onDeleteTask: (taskId: string) => void;
  isCompact?: boolean;
}

export const TasksHabitsMasterView: React.FC<TasksHabitsMasterViewProps> = ({
  tasks,
  projects,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  isCompact = false
}) => {
  const [filterType, setFilterType] = useState<'ALL' | '할일' | '모닝루틴'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNCOMPLETED' | 'COMPLETED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 모달 상태
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('할일');
  const [newDueDate, setNewDueDate] = useState('2026-09-25 15:00');
  const [newPriority, setNewPriority] = useState<TaskPriority>('⚡ P1');
  const [newDuration, setNewDuration] = useState('30m');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newStreak, setNewStreak] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterStatus === 'UNCOMPLETED' && t.completed) return false;
    if (filterStatus === 'COMPLETED' && !t.completed) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      type: newType,
      dueDate: newDueDate,
      priority: newPriority,
      duration: newDuration.trim() || '30m',
      projectId: newProjectId ? newProjectId : undefined,
      streakCount: newType === '모닝루틴' ? newStreak : undefined,
      notes: newNotes.trim() || undefined
    });
    setNewTitle('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case '🔥 P0':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">🔥 P0 긴급</span>;
      case '⚡ P1':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">⚡ P1 중요</span>;
      case '☕ P2':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">☕ P2 일반</span>;
    }
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const found = projects.find(p => p.id === projectId);
    return found ? found.title : null;
  };

  return (
    <div className={`flex flex-col h-full ${isCompact ? 'space-y-3' : 'space-y-4'}`}>
      {/* 헤더 및 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Tasks & Habits DB (실행 과제 & 루틴)
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {tasks.filter(t => t.completed).length}/{tasks.length} 완료
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              일일 과제 P0/P1 우선순위 · 모닝 루틴 연속 달성 스트릭(Formulas 2.0)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 타입 필터 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/60 text-xs">
            {(['ALL', '할일', '모닝루틴'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterType === type
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type === 'ALL' ? '전체' : type}
              </button>
            ))}
          </div>

          {/* 완료 상태 필터 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/60 text-xs">
            {(['ALL', 'UNCOMPLETED', 'COMPLETED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-1.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'ALL' ? '모두' : st === 'UNCOMPLETED' ? '미완료' : '완료'}
              </button>
            ))}
          </div>


          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 과제/루틴</span>
          </button>
        </div>
      </div>

      {/* 과제 / 루틴 목록 */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 text-slate-400">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">등록된 과제 및 루틴이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(task => {
            const projectName = getProjectName(task.projectId);

            return (
              <div
                key={task.id}
                className={`group flex items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                  task.completed
                    ? 'bg-slate-50/70 dark:bg-neutral-900/40 border-slate-200/60 dark:border-neutral-800/60 opacity-80'
                    : 'bg-white dark:bg-neutral-900/90 border-slate-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-neutral-700 shadow-xs'
                }`}
              >
                <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0 mr-3">
                  {/* 체크박스 토글 */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 sm:mt-0 p-1 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                    title={task.completed ? '완료 취소' : '과제 완료'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-neutral-600 hover:text-amber-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {/* 구분 (할일 vs 모닝루틴) */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        task.type === '모닝루틴'
                          ? 'bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60 flex items-center space-x-0.5'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                      }`}>
                        {task.type === '모닝루틴' && <Sun className="w-2.5 h-2.5 inline mr-0.5" />}
                        {task.type}
                      </span>

                      {/* 우선순위 */}
                      {getPriorityBadge(task.priority)}

                      {/* 루틴 특화 Formulas 2.0 스트릭 태그 */}
                      {task.type === '모닝루틴' && task.streakTag && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                          <span>{task.streakTag}</span>
                        </span>
                      )}

                      {/* 소요시간 */}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{task.duration}</span>
                      </span>
                    </div>

                    {/* 타이틀 및 비고 */}
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs sm:text-sm font-semibold text-slate-900 dark:text-white ${
                        task.completed ? 'line-through text-slate-400 dark:text-neutral-500' : ''
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {task.notes}
                      </p>
                    )}

                    {/* 관계형: 소속 Projects DB 링크 칩 */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-neutral-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{task.dueDate}</span>
                      </span>

                      {projectName && (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40 font-medium text-[10px]">
                          <FolderGit2 className="w-2.5 h-2.5" />
                          <span>소속 프로젝트: {projectName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => {
                    if (window.confirm(`'${task.title}' 항목을 삭제하시겠습니까?`)) {
                      onDeleteTask(task.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 신규 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <span>신규 과제 / 모닝 루틴 등록</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  과제/습관명 (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 제품 시안 확정 또는 아침 조깅 5km"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    구분 (Type)
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="할일">할일</option>
                    <option value="모닝루틴">모닝루틴</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    우선순위 (Priority)
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="🔥 P0">🔥 P0 (긴급/최우선)</option>
                    <option value="⚡ P1">⚡ P1 (중요/핵심)</option>
                    <option value="☕ P2">☕ P2 (일반/여유)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    마감일시 (Due Date)
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    소요시간 (Duration)
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="예: 30m, 1h"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 관계형: 소속 프로젝트 선택 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  소속 프로젝트 (Projects DB 관계형 연결)
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- 소속 프로젝트 선택 (선택 안 함) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.area})</option>
                  ))}
                </select>
              </div>

              {newType === '모닝루틴' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    현재 연속 달성 일수 (Streak)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStreak}
                    onChange={(e) => setNewStreak(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  메모 / 세부 사항
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="실행 가이드 또는 체크포인트를 입력하세요."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-xs cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
