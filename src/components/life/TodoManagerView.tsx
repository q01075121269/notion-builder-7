// src/components/life/TodoManagerView.tsx
// 라이프 허브 스마트할일 (Todo Manager): 정밀 D-Day 엔진, 브라우저 푸시 알림, AI 서브태스크 분해기, 아이젠하워 4분면

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Sparkles, 
  Bell, 
  BellRing, 
  Clock, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Calendar, 
  Filter,
  Flame,
  Star,
  Zap,
  Coffee,
  ListTodo
} from 'lucide-react';
import type { 
  LifeTodoItem, 
  LifeSubTask, 
  ReminderType, 
  EisenhowerPriority 
} from '../../services/notionLifeHubSync';
import { 
  breakdownTaskWithAI, 
  requestNotificationPermission, 
  sendBrowserPushNotification 
} from '../../services/aiTaskBreakdown';
import { useApp } from '../../context/AppContext';

interface TodoManagerViewProps {
  todoItems: LifeTodoItem[];
  setTodoItems: React.Dispatch<React.SetStateAction<LifeTodoItem[]>>;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (e: React.MouseEvent, item: LifeTodoItem) => void;
  onQuickCapture: () => void;
  onScheduleTodo?: (todo: LifeTodoItem) => void;
  isCompact?: boolean;
}

export const TodoManagerView: React.FC<TodoManagerViewProps> = ({
  todoItems,
  setTodoItems,
  onToggleTodo,
  onDeleteTodo,
  onQuickCapture,
  onScheduleTodo,
  isCompact = false
}) => {

  const { notionApiKey, showToast } = useApp();

  // 아이젠하워 4분면 필터: 'ALL' | 'P1' | 'P2' | 'P3' | 'P4'
  const [filterPriority, setFilterPriority] = useState<'ALL' | EisenhowerPriority>('ALL');

  // 완료 상태 필터: 'ALL' | 'ACTIVE' | 'DONE'
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ALL');

  // 브라우저 푸시 알림 권한 상태
  const [notificationGranted, setNotificationGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // AI 서브태스크 분해 로딩 상태 (todo ID)
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);

  // 펼쳐진 서브태스크 목록 ID Set
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<Set<string>>(new Set());

  // 새 할 일 인라인 폼 상태
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('2026-09-18');
  const [newPriority, setNewPriority] = useState<EisenhowerPriority>('P1');
  const [newReminder, setNewReminder] = useState<ReminderType>('before_30m');

  // 1. 브라우저 푸시 알림 권한 요청 핸들러
  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationGranted(granted);
    if (granted) {
      showToast('🔔 브라우저 푸시 알림이 성공적으로 활성화되었습니다.', 'success');
      sendBrowserPushNotification('🎯 스마트할일 푸시 알림 활성화', {
        body: '마감 기한 및 주요 알림 설정 시 데스크톱 알림이 전송됩니다.'
      });
    } else {
      showToast('브라우저 설정에서 알림 권한이 차단되어 있습니다.', 'info');
    }
  };

  // 2. 푸시 알림 스케줄러 (30초 주기 검사)
  useEffect(() => {
    const checkReminders = () => {
      if (!notificationGranted) return;
      const now = new Date();
      const nowStr = now.toISOString().split('T')[0];

      todoItems.forEach((todo) => {
        if (todo.done || !todo.dueDate || !todo.reminder || todo.reminder === 'none') {
          return;
        }

        const notifyKey = `notified-todo-${todo.id}-${todo.dueDate}`;
        if (sessionStorage.getItem(notifyKey)) {
          return;
        }

        // 오늘 마감일인 경우 알림 검사
        if (todo.dueDate.startsWith(nowStr)) {
          let shouldNotify = false;
          if (todo.reminder === 'day_9am') {
            shouldNotify = true;
          } else if (todo.reminder === 'before_30m') {
            shouldNotify = true;
          }

          if (shouldNotify) {
            sessionStorage.setItem(notifyKey, 'true');
            sendBrowserPushNotification(`⏰ [마감 임박] ${todo.title}`, {
              body: `오늘 마감 예정 태스크입니다. 우선순위: ${todo.priority || todo.eisenhower || 'P1'}`
            });
            showToast(`⏰ [마감 임박 알림] ${todo.title}`, 'info');
          }
        }
      });
    };

    const timer = setInterval(checkReminders, 30000);
    checkReminders(); // 즉시 1회 검사

    return () => clearInterval(timer);
  }, [todoItems, notificationGranted, showToast]);

  // 3. 정밀 D-Day 엔진 뱃지 계산 헬퍼
  const getDDayBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    const rawPart = dueDate.split(' ')[0].trim();
    const parts = rawPart.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return null;

    const [y, m, d] = parts;
    const target = new Date(y, m - 1, d, 0, 0, 0, 0);
    const now = new Date(2026, 8, 18, 0, 0, 0, 0); // 기준: 2026-09-18

    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        text: 'D-Day',
        label: '오늘 마감',
        badgeClass: 'bg-rose-600 text-white font-bold animate-pulse shadow-xs border border-rose-700',
        isOverdue: false
      };
    } else if (diffDays > 0 && diffDays <= 3) {
      return {
        text: `D-${diffDays}`,
        label: `${diffDays}일 남음`,
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold',
        isOverdue: false
      };
    } else if (diffDays > 3) {
      return {
        text: `D-${diffDays}`,
        label: `${diffDays}일 남음`,
        badgeClass: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300 border border-slate-200 dark:border-neutral-700 font-medium',
        isOverdue: false
      };
    } else {
      return {
        text: `D+${Math.abs(diffDays)} (연체)`,
        label: '기한 경과',
        badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 line-through font-bold',
        isOverdue: true
      };
    }
  };

  // 4. [🪄 AI 서브태스크 분해] 핸들러
  const handleBreakdownTask = async (todo: LifeTodoItem) => {
    setBreakingDownId(todo.id);
    try {
      const subtaskTitles = await breakdownTaskWithAI(todo.title, notionApiKey);
      const newSubtasks: LifeSubTask[] = subtaskTitles.map((stTitle, idx) => ({
        id: `st-${todo.id}-${Date.now()}-${idx}`,
        title: stTitle,
        done: false
      }));

      setTodoItems(prev => prev.map(item => {
        if (item.id === todo.id) {
          return {
            ...item,
            subtasks: newSubtasks
          };
        }
        return item;
      }));

      // 서브태스크 리스트 자동 펼침
      setExpandedSubtaskIds(prev => new Set(prev).add(todo.id));
      showToast(`🪄 '${todo.title}'이(가) 3단계 실행 단위로 분해되었습니다!`, 'success');
    } catch (e: any) {
      showToast('서브태스크 분해 실패: ' + e.message, 'error');
    } finally {
      setBreakingDownId(null);
    }
  };

  // 서브태스크 완료 토글
  const handleToggleSubtask = (todoId: string, subtaskId: string) => {
    setTodoItems(prev => prev.map(todo => {
      if (todo.id !== todoId || !todo.subtasks) return todo;
      const updatedSubtasks = todo.subtasks.map(st => 
        st.id === subtaskId ? { ...st, done: !st.done } : st
      );
      return {
        ...todo,
        subtasks: updatedSubtasks
      };
    }));
  };

  // 서브태스크 펼침/접힘 토글
  const toggleExpandSubtasks = (todoId: string) => {
    setExpandedSubtaskIds(prev => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  // 새 할 일 수동 등록 핸들러
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTodo: LifeTodoItem = {
      id: `todo-custom-${Date.now()}`,
      title: newTitle.trim(),
      done: false,
      priority: newPriority === 'P1' ? '🔥 긴급/중요' : newPriority === 'P2' ? '⭐ 중요' : newPriority === 'P3' ? '⚡ 긴급' : '☕ 여유',
      eisenhower: newPriority,
      dueDate: newDueDate,
      reminder: newReminder
    };

    setTodoItems(prev => [newTodo, ...prev]);
    setNewTitle('');
    setIsAddFormOpen(false);
    showToast('새 스마트 할 일이 성공적으로 등록되었습니다.', 'success');
  };

  // 필터링된 할 일 목록 계산
  const filteredTodos = useMemo(() => {
    return todoItems.filter(todo => {
      // 1. 우선순위 필터
      if (filterPriority !== 'ALL') {
        const itemP = todo.eisenhower || (
          todo.priority.includes('긴급') && todo.priority.includes('중요') ? 'P1' :
          todo.priority.includes('중요') ? 'P2' :
          todo.priority.includes('긴급') ? 'P3' : 'P4'
        );
        if (itemP !== filterPriority) return false;
      }

      // 2. 완료 상태 필터
      if (filterStatus === 'ACTIVE' && todo.done) return false;
      if (filterStatus === 'DONE' && !todo.done) return false;

      return true;
    });
  }, [todoItems, filterPriority, filterStatus]);

  const doneCount = todoItems.filter(t => t.done).length;
  const progressRate = todoItems.length > 0 ? Math.round((doneCount / todoItems.length) * 100) : 0;

  return (
    <div className={isCompact ? 'space-y-2.5' : 'space-y-4'}>
      {/* 1. 상단 타이틀 및 메트릭스 헤더 */}
      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-neutral-800`}>
        <div className="min-w-0">
          <h2 className={`${isCompact ? 'text-sm' : 'text-base sm:text-lg'} font-bold flex items-center space-x-1.5 text-slate-900 dark:text-white whitespace-nowrap`}>
            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">2. 🎯 스마트할일</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold border border-amber-200/60 dark:border-amber-800/40 whitespace-nowrap">
              {doneCount}/{todoItems.length}
            </span>
          </h2>
          {!isCompact && (
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
              정밀 D-Day 엔진 · 브라우저 푸시 알림 · AI 3단계 서브태스크 분해
            </p>
          )}
        </div>

        {/* 우측 진행률 및 푸시 알림 버튼 */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={handleRequestNotification}
            title={notificationGranted ? '브라우저 푸시 알림 활성화됨' : '브라우저 푸시 알림 켜기'}
            className={`flex items-center space-x-1 ${isCompact ? 'p-1.5 rounded-lg' : 'px-3 py-1.5 rounded-xl'} text-xs font-semibold border transition cursor-pointer whitespace-nowrap shadow-xs ${
              notificationGranted
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-200'
            }`}
          >
            {notificationGranted ? <BellRing className="w-3.5 h-3.5 text-emerald-600" /> : <Bell className="w-3.5 h-3.5" />}
            {!isCompact && <span className="whitespace-nowrap">{notificationGranted ? '알림 켜짐' : '푸시 알림'}</span>}
          </button>

          <div className={`flex items-center space-x-1 ${isCompact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-semibold whitespace-nowrap border border-slate-200/60 dark:border-neutral-700/60`}>
            <span>달성</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{progressRate}%</span>
          </div>

          <button
            onClick={() => setIsAddFormOpen(prev => !prev)}
            className={`flex items-center space-x-1 ${isCompact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{isCompact ? '등록' : '할 일 등록'}</span>
          </button>
        </div>
      </div>

      {/* 2. 아이젠하워 4분면 우선순위 필터 바 */}
      <div className={`flex flex-wrap items-center justify-between gap-1.5 ${isCompact ? 'p-1.5 rounded-xl' : 'p-2 rounded-2xl'} bg-slate-100/90 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60 shadow-xs`}>
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 px-1.5 flex items-center space-x-1 whitespace-nowrap">
            <Filter className="w-3 h-3" />
            {!isCompact && <span>우선순위:</span>}
          </span>

          <button
            onClick={() => setFilterPriority('ALL')}
            className={`${isCompact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              filterPriority === 'ALL'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900'
            }`}
          >
            전체 ({todoItems.length})
          </button>

          <button
            onClick={() => setFilterPriority('P1')}
            className={`flex items-center space-x-1 ${isCompact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
              filterPriority === 'P1'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-900/50'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>P1</span>
          </button>

          <button
            onClick={() => setFilterPriority('P2')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterPriority === 'P2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-900/50'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>P2 중요/계획</span>
          </button>

          <button
            onClick={() => setFilterPriority('P3')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterPriority === 'P3'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-neutral-900/50'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>P3 긴급/위임</span>
          </button>

          <button
            onClick={() => setFilterPriority('P4')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterPriority === 'P4'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-200'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>P4 여유/보관</span>
          </button>
        </div>

        {/* 완료 여부 스위처 */}
        <div className="flex items-center space-x-1 bg-white dark:bg-neutral-900 p-0.5 rounded-xl border border-slate-200 dark:border-neutral-700">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'ACTIVE' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
            }`}
          >
            진행중
          </button>
          <button
            onClick={() => setFilterStatus('DONE')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
              filterStatus === 'DONE' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
            }`}
          >
            완료됨
          </button>
        </div>
      </div>

      {/* 3. 새 할 일 인라인 추가 폼 (등록 드롭다운 & 푸시 알림 선택) */}
      {isAddFormOpen && (
        <form 
          onSubmit={handleAddTodo}
          className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
              <ListTodo className="w-4 h-4 text-amber-600" />
              <span>새 스마트 할 일 및 알림 설정</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* 할 일 제목 */}
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: 2026 Q3 아키텍처 다이어그램 업데이트..."
              className="sm:col-span-5 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              autoFocus
            />

            {/* 마감 기한 */}
            <div className="sm:col-span-3 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none font-medium text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* 아이젠하워 우선순위 */}
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as EisenhowerPriority)}
              className="sm:col-span-2 px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-bold focus:ring-2 focus:ring-amber-500"
            >
              <option value="P1">🔥 P1 (긴급/중요)</option>
              <option value="P2">⭐ P2 (중요/계획)</option>
              <option value="P3">⚡ P3 (긴급/위임)</option>
              <option value="P4">☕ P4 (여유/보관)</option>
            </select>

            {/* 푸시 알림 선택 드롭다운 */}
            <select
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value as ReminderType)}
              className="sm:col-span-2 px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-medium focus:ring-2 focus:ring-amber-500"
            >
              <option value="before_30m">🔔 마감 30분 전</option>
              <option value="day_9am">☀️ 당일 오전 9시</option>
              <option value="none">🔕 미알림</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>등록 완료</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. 할 일 리스트 (HTML5 Drag & Drop 지원 + D-Day + AI 분해기) */}
      {filteredTodos.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/70 dark:bg-neutral-900/30">
          <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-neutral-500 opacity-70" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            해당 조건의 스마트 할 일이 없습니다.
          </h4>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            상단 '+ 할 일 등록' 또는 음성 퀵 캡처로 새로운 목표를 등록해 보세요.
          </p>
          <div className="mt-3.5 flex items-center justify-center space-x-2">
            <button
              onClick={() => setIsAddFormOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 태스크 추가하기</span>
            </button>
            <button
              onClick={onQuickCapture}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>1초 퀵 캡처로 등록</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => {
            const ddayInfo = getDDayBadge(todo.dueDate);
            const hasSubtasks = Boolean(todo.subtasks && todo.subtasks.length > 0);
            const isExpanded = expandedSubtaskIds.has(todo.id);
            const isBreakingDown = breakingDownId === todo.id;

            return (
              <div
                key={todo.id}
                draggable={!todo.done}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    id: todo.id,
                    title: todo.title,
                    dueDate: todo.dueDate,
                    priority: todo.priority,
                    eisenhower: todo.eisenhower,
                    type: 'todo_to_schedule'
                  }));
                  e.dataTransfer.effectAllowed = 'copyMove';
                }}
                className={`${
                  isCompact ? 'p-2.5 rounded-xl gap-2' : 'p-4 rounded-2xl gap-3'
                } border transition shadow-xs group ${
                  todo.done
                    ? 'bg-slate-100/60 dark:bg-neutral-900/30 border-slate-200/60 dark:border-neutral-800/50 opacity-60'
                    : 'bg-white dark:bg-neutral-900/70 border-slate-200 dark:border-neutral-800 hover:border-amber-400/80 hover:shadow-md cursor-grab active:cursor-grabbing'
                }`}
              >
                {/* 상단 메인 라인: 드래그 핸들 + 체크박스 + 제목 + D-Day 뱃지 + AI 버튼 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* 드래그 핸들 */}
                    <div 
                      title="캘린더 일정으로 드래그 연동 가능"
                      className="text-slate-300 dark:text-neutral-600 group-hover:text-slate-500 cursor-grab shrink-0"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* 완료 체크박스 */}
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => onToggleTodo(todo.id)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer border-slate-300 shrink-0"
                    />

                    {/* 할 일 제목 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                        <span 
                          onClick={() => onToggleTodo(todo.id)}
                          className={`text-xs sm:text-sm font-semibold cursor-pointer truncate ${
                            todo.done 
                              ? 'line-through text-slate-400 dark:text-neutral-500' 
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {todo.title}
                        </span>

                        {/* 정밀 D-Day 뱃지 */}
                        {ddayInfo && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap ${ddayInfo.badgeClass}`}>
                            {ddayInfo.text}
                          </span>
                        )}

                        {/* 알림 설정 뱃지 */}
                        {todo.reminder && todo.reminder !== 'none' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center space-x-1 whitespace-nowrap border border-blue-200/50">
                            <Bell className="w-2.5 h-2.5" />
                            <span>{todo.reminder === 'before_30m' ? '30분 전' : '당일 9시'}</span>
                          </span>
                        )}
                      </div>

                      {/* 기한 및 우선순위 라벨 */}
                      {todo.dueDate && (
                        <div className="text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5 flex items-center space-x-2">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{todo.dueDate}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 우측 액션: [📅 타임블록] + [🪄 AI 분해] + 우선순위 배지 + 삭제 */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* [📅 일정으로 타임블록] 원클릭 버튼 */}
                    {onScheduleTodo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleTodo(todo);
                        }}
                        title="스마트일정 주간 캘린더에 즉시 타임블록 배정"
                        className="flex items-center space-x-1 px-2 py-1 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/60 transition cursor-pointer active:scale-95 whitespace-nowrap shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="whitespace-nowrap hidden sm:inline">타임블록</span>
                      </button>
                    )}

                    {/* [🪄 AI 서브태스크 분해] 원클릭 버튼 */}
                    <button
                      onClick={() => handleBreakdownTask(todo)}
                      disabled={isBreakingDown}
                      title="Gemini AI로 3단계 하위 실행 단위 자동 분해"
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/60 transition cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-xs"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isBreakingDown ? 'animate-spin text-purple-600' : 'text-purple-500'}`} />
                      <span className="whitespace-nowrap">
                        {isBreakingDown ? 'AI 분해 중...' : hasSubtasks ? 'AI 재분해' : 'AI 분해'}
                      </span>
                    </button>

                    {/* 우선순위 뱃지 */}
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold whitespace-nowrap border border-slate-200/80 dark:border-neutral-700/60">
                      {todo.priority || todo.eisenhower || 'P1'}
                    </span>


                    {/* 서브태스크 접기/펼치기 버튼 */}
                    {hasSubtasks && (
                      <button
                        onClick={() => toggleExpandSubtasks(todo.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => onDeleteTodo(e, todo)}
                      title="할 일 삭제"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. AI 서브태스크 3단계 체크리스트 영역 */}
                {hasSubtasks && isExpanded && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-neutral-800/80 pl-7 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>AI 자동 분해 3단계 실행 체크리스트:</span>
                      </span>
                      <span>
                        {todo.subtasks?.filter(s => s.done).length}/{todo.subtasks?.length} 완료
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {todo.subtasks?.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleToggleSubtask(todo.id, st.id)}
                          className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-neutral-800/40 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={st.done}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer border-slate-300"
                          />
                          <span className={`text-xs font-medium ${
                            st.done ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
