// src/app/life/page.tsx
// 라이프 허브: 노션 DB 및 퀵 캡처 실시간 양방향 융합 렌더링 화면
// Step 0: 사용자 동선 최적화 (1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약) 및 Notion/Linear 모노톤 스타일 리팩토링

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Mail, 
  CreditCard, 
  CheckSquare, 
  ArrowLeft, 
  Plus, 
  Bot,
  RefreshCw, 
  Edit2, 
  Trash2, 
  X, 
  Check,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { 
  fetchNotionDatabaseRows, 
  deleteNotionPage, 
  updateNotionPage, 
  calculateDDay 
} from '../../services/notionLifeHubSync';
import type { 
  LifeScheduleItem, 
  LifeExpenseItem, 
  LifeTodoItem 
} from '../../services/notionLifeHubSync';
import { 
  parseNotionScheduleRows, 
  parseNotionExpenseRows, 
  extractQuickCaptureLifeItems 
} from '../../services/lifeHubDataParser';
import { 
  getDeletedLifeItemIds, 
  markLifeItemAsDeleted, 
  removeTaskFromQuickCapture 
} from '../../services/quickCaptureStorage';
import { ScheduleView } from '../../components/life/ScheduleView';

// 사용자 동선 우선순위 재배치: 1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약
type LifeHubTab = 'schedule' | 'todo' | 'expense' | 'email';
type ViewMode = 'tabs' | 'grid';

const INITIAL_DEMO_SCHEDULES: LifeScheduleItem[] = [
  { 
    id: 's1', 
    title: '치과 정기 검진 및 스케일링', 
    date: '2026-09-19 15:00', 
    start: '2026-09-19 15:00',
    end: '2026-09-19 16:00',
    dday: 'D-1', 
    category: '건강', 
    icon: '🦷',
    location: '강남 연세사랑치과의원 3층',
    attendees: [
      { name: '나 (본인)', email: 'me@notion.com', status: 'accepted' },
      { name: '김원장 (주치의)', email: 'dentist@clinic.com', status: 'accepted' }
    ],
    notes: '스케일링 및 어금니 레진 치료 경과 확인. 치과 보험 청구 서류 수령 필요.',
    status: '미완료'
  },
  { 
    id: 's2', 
    title: 'Q3 프로젝트 최종 릴리즈 회의', 
    date: '2026-09-22 10:30', 
    start: '2026-09-22 10:30',
    end: '2026-09-22 12:00',
    dday: 'D-4', 
    category: '업무', 
    icon: '💼',
    location: '본사 대회의실 A (온/오프라인 병행)',
    meetingUrl: 'https://meet.google.com/q3-release-final',
    attendees: [
      { name: '이팀장 (PM)', email: 'pm@company.com', status: 'accepted' },
      { name: '박개발 (Lead)', email: 'dev@company.com', status: 'accepted' },
      { name: '최디자인 (UI/UX)', email: 'design@company.com', status: 'accepted' },
      { name: '나 (아키텍트)', email: 'me@company.com', status: 'accepted' }
    ],
    notes: '1. Vercel 서버리스 프록시 성능 모니터링 결산\n2. Gemini 3.6 Flash 모델 지연시간 벤치마크 공유\n3. 프로덕션 DNS 컷오버 체크리스트 점검',
    status: '미완료'
  },
  { 
    id: 's3', 
    title: '부모님 생신 저녁 식사', 
    date: '2026-09-26 18:30', 
    start: '2026-09-26 18:30',
    end: '2026-09-26 21:00',
    dday: 'D-8', 
    category: '가족', 
    icon: '🎂',
    location: '경복궁 한정식 서초점 룸 5호',
    attendees: [
      { name: '아버지', status: 'accepted' },
      { name: '어머니', status: 'accepted' },
      { name: '동생', status: 'accepted' },
      { name: '나 (예약자)', status: 'accepted' }
    ],
    notes: '생신 케이크(수제 딸기 케이크) 픽업 17:30까지 완료할 것. 선물(스마트워치) 포장 완료.',
    status: '미완료'
  },
  {
    id: 's4',
    title: 'Notion AI 아키텍처 주간 싱크업',
    date: '2026-09-18 14:00',
    start: '2026-09-18 14:00',
    end: '2026-09-18 15:00',
    dday: 'D-Day',
    category: '업무',
    icon: '⚡',
    meetingUrl: 'https://meet.google.com/notion-arch-sync',
    location: 'Google Meet 화상회의',
    attendees: [
      { name: '나', email: 'me@company.com', status: 'accepted' },
      { name: '정엔지니어', email: 'jung@company.com', status: 'accepted' }
    ],
    notes: '1. 노션 캘린더 iCal 연동 규격 검토\n2. 슬라이드오버 드로어 인터페이스 테스트 및 피드백',
    status: '진행 중'
  }
];

const INITIAL_DEMO_TODOS: LifeTodoItem[] = [
  { id: 't1', title: 'v2.0 라우트 분리 작업 완료 및 배포', done: true, priority: '🔥 긴급' },
  { id: 't2', title: '주간 업무 결산 리포트 작성', done: false, priority: '⭐ 보통' },
  { id: 't3', title: '헬스장 하체 운동 40분', done: false, priority: '☕ 여유' },
  { id: 't4', title: '전기세 및 공과금 자동이체 확인', done: true, priority: '⭐ 보통' }
];

const INITIAL_DEMO_EXPENSES: LifeExpenseItem[] = [
  { id: 'ex1', title: '점심 식사 (구내식당)', amount: 9000, date: '2026-09-18', category: '식비', icon: '🍱' },
  { id: 'ex2', title: '지하철 정기권 충전', amount: 55000, date: '2026-09-17', category: '교통', icon: '🚇' },
  { id: 'ex3', title: '업무용 도서 구입 (클린 코드)', amount: 28000, date: '2026-09-16', category: '도서', icon: '📚' }
];

const INITIAL_DEMO_EMAILS = [
  { id: 'e1', sender: 'GitHub', subject: '[Security] New sign-in detected', summary: '새로운 브라우저에서 로그인 감지됨. 본인 확인 권장', time: '10분 전', important: true },
  { id: 'e2', sender: 'Google Cloud Billing', subject: '2026년 8월 결제 영수증 발행 안내', summary: '총 청구금액 12,400원 정상 결제 완료', time: '2시간 전', important: false },
  { id: 'e3', sender: 'Notion Team', subject: 'Notion 3.0 신규 업데이트 및 AI 기능 발표', summary: '새로운 수식 라이브러리와 스마트 사서 기능 공개', time: '어제', important: true }
];

export const LifePage: React.FC = () => {
  const { 
    setCurrentView, 
    notionApiKey, 
    createdNotionResource,
    selectedNotionDbId,
    selectedExpenseDbId,
    setIsNotionSettingsModalOpen
  } = useApp();

  // 뷰 모드: 탭 스위칭 vs 4분할 한눈에 보기
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [activeTab, setActiveTab] = useState<LifeHubTab>('schedule');

  const [scheduleItems, setScheduleItems] = useState<LifeScheduleItem[]>(() => {
    const deletedIds = getDeletedLifeItemIds();
    return INITIAL_DEMO_SCHEDULES.filter(s => !deletedIds.has(s.id) && !deletedIds.has(s.title.trim()));
  });

  const [todoItems, setTodoItems] = useState<LifeTodoItem[]>(() => {
    const deletedIds = getDeletedLifeItemIds();
    return INITIAL_DEMO_TODOS.filter(t => !deletedIds.has(t.id) && !deletedIds.has(t.title.trim()));
  });

  const [expenseItems, setExpenseItems] = useState<LifeExpenseItem[]>(() => {
    const deletedIds = getDeletedLifeItemIds();
    return INITIAL_DEMO_EXPENSES.filter(e => !deletedIds.has(e.id) && !deletedIds.has(e.title.trim()));
  });

  const [emailSummaries] = useState(INITIAL_DEMO_EMAILS);

  const [isLoadingNotion, setIsLoadingNotion] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 일정 수정 팝업 상태
  const [editingItem, setEditingItem] = useState<LifeScheduleItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('일정');
  const [editStatus, setEditStatus] = useState<string>('미완료');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const handleOpenEditModal = (item: LifeScheduleItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDate(item.date);
    setEditCategory(item.category || '일정');
    setEditStatus(item.status || '미완료');
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      if (notionApiKey && editingItem.notionPageId) {
        await updateNotionPage(notionApiKey, editingItem.notionPageId, {
          title: editTitle.trim(),
          date: editDate,
          category: editCategory,
          status: editStatus
        });
      }

      setScheduleItems(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            title: editTitle.trim(),
            date: editDate,
            dday: calculateDDay(editDate),
            category: editCategory,
            status: editStatus
          };
        }
        return item;
      }));

      setTodoItems(prev => prev.map(t => {
        if (t.title === editingItem.title) {
          return { ...t, title: editTitle.trim(), done: editStatus === '완료' };
        }
        return t;
      }));

      setEditingItem(null);
    } catch (e) {
      console.error('일정 수정 실패:', e);
      alert('일정 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 일정 영구 삭제 처리 (로컬 스토리지 + 퀵 캡처 저장소 + 노션 클라우드 동시 파기)
  const handleDeleteItem = async (item: LifeScheduleItem) => {
    if (!window.confirm(`'${item.title}' 일정을 삭제하시겠습니까?\n로컬 보관함과 노션 데이터베이스에서 안전하게 제거됩니다.`)) {
      return;
    }

    markLifeItemAsDeleted(item.id, item.title);
    removeTaskFromQuickCapture(item.id, item.title);

    setScheduleItems(prev => prev.filter(s => s.id !== item.id && s.title.trim() !== item.title.trim()));
    setTodoItems(prev => prev.filter(t => t.title.trim() !== item.title.trim()));

    try {
      if (notionApiKey && item.notionPageId) {
        await deleteNotionPage(notionApiKey, item.notionPageId);
      }
    } catch (e) {
      console.error('노션 원격 일정 삭제 중 경고:', e);
    }
  };

  // 지출 내역 삭제 처리
  const handleDeleteExpense = (item: LifeExpenseItem) => {
    if (!window.confirm(`'${item.title}' 지출 내역을 삭제하시겠습니까?`)) {
      return;
    }
    markLifeItemAsDeleted(item.id, item.title);
    removeTaskFromQuickCapture(item.id, item.title);
    setExpenseItems(prev => prev.filter(e => e.id !== item.id && e.title.trim() !== item.title.trim()));
  };

  // 할 일 항목 삭제 처리
  const handleDeleteTodo = (e: React.MouseEvent, item: LifeTodoItem) => {
    e.stopPropagation();
    markLifeItemAsDeleted(item.id, item.title);
    removeTaskFromQuickCapture(item.id, item.title);
    setTodoItems(prev => prev.filter(t => t.id !== item.id && t.title.trim() !== item.title.trim()));
    setScheduleItems(prev => prev.filter(s => s.title.trim() !== item.title.trim()));
  };

  // 라이프 허브 데이터 동기화 (로컬 퀵 캡처 최신 항목 + 노션 클라우드 실제 DB 행 병합)
  const syncLifeHubData = useCallback(async () => {
    setIsLoadingNotion(true);
    try {
      const deletedIds = getDeletedLifeItemIds();

      // 1. 로컬 퀵 캡처 데이터 즉시 로드 (삭제된 항목 자동 제외)
      const qcData = extractQuickCaptureLifeItems();

      // 2. 노션 DB에서 최신 저장된 행(row) 쿼리
      let notionSchedules: LifeScheduleItem[] = [];
      let notionExpenses: LifeExpenseItem[] = [];

      const masterLifeDbId = typeof window !== 'undefined' ? localStorage.getItem('master_life_hub_db_id') : null;
      const targetLifeDbId = selectedNotionDbId || masterLifeDbId || createdNotionResource?.databases?.find(d => d.name.includes('라이프'))?.id;

      const masterExpenseDbId = typeof window !== 'undefined' ? localStorage.getItem('master_expense_db_id') : null;
      const targetExpenseDbId = selectedExpenseDbId || masterExpenseDbId || createdNotionResource?.databases?.find(d => d.name.includes('가계부') || d.name.includes('지출'))?.id;

      if (notionApiKey && targetLifeDbId) {
        const lifeRows = await fetchNotionDatabaseRows(notionApiKey, targetLifeDbId, 25);
        if (lifeRows.length > 0) {
          notionSchedules = parseNotionScheduleRows(lifeRows);
        }
      }

      if (notionApiKey && targetExpenseDbId) {
        const expRows = await fetchNotionDatabaseRows(notionApiKey, targetExpenseDbId, 25);
        if (expRows.length > 0) {
          notionExpenses = parseNotionExpenseRows(expRows);
        }
      }

      // 3. 데이터 병합 및 중복/삭제 제거
      const mergedSchedules = [...qcData.schedules].filter(
        s => !deletedIds.has(s.id) && !deletedIds.has(s.title.trim()) && !deletedIds.has(s.title.replace(/^⚡\s*/, '').trim())
      );
      notionSchedules.forEach(ns => {
        const cleanTitle = ns.title.replace(/^⚡\s*/, '').trim();
        if (
          !deletedIds.has(ns.id) && 
          !deletedIds.has(ns.title.trim()) && 
          !deletedIds.has(cleanTitle) &&
          !mergedSchedules.some(s => s.title.replace(/^⚡\s*/, '').trim() === cleanTitle)
        ) {
          mergedSchedules.push(ns);
        }
      });
      setScheduleItems(mergedSchedules);

      // 가계부 병합
      const mergedExpenses = [...qcData.expenses].filter(
        e => !deletedIds.has(e.id) && !deletedIds.has(e.title.trim()) && !deletedIds.has(e.title.replace(/^⚡\s*/, '').trim())
      );
      notionExpenses.forEach(ne => {
        const cleanTitle = ne.title.replace(/^⚡\s*/, '').trim();
        if (
          !deletedIds.has(ne.id) && 
          !deletedIds.has(ne.title.trim()) && 
          !deletedIds.has(cleanTitle) &&
          !mergedExpenses.some(e => e.title.replace(/^⚡\s*/, '').trim() === cleanTitle)
        ) {
          mergedExpenses.push(ne);
        }
      });
      setExpenseItems(mergedExpenses);

      // 할 일 병합
      const mergedTodos = [...qcData.todos].filter(
        t => !deletedIds.has(t.id) && !deletedIds.has(t.title.trim())
      );
      mergedSchedules.forEach((ms, idx) => {
        if (!mergedTodos.some(t => t.title === ms.title)) {
          mergedTodos.push({
            id: `todo-${idx}-${ms.id}`,
            title: ms.title,
            done: ms.status === '완료',
            priority: ms.category === '할 일' ? '🔥 우선' : '⭐ 보통'
          });
        }
      });
      setTodoItems(mergedTodos);

      setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('라이프 허브 동기화 중 경고:', err);
    } finally {
      setIsLoadingNotion(false);
    }
  }, [notionApiKey, selectedNotionDbId, selectedExpenseDbId, createdNotionResource]);

  // 페이지 진입 시 실시간 동기화 실행
  useEffect(() => {
    syncLifeHubData();
  }, [syncLifeHubData]);

  const toggleTodo = (id: string) => {
    setTodoItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || selectedNotionDbId));
  const totalExpenseAmount = expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  // 1. 스마트 일정 모듈 렌더러 (구글/노션 캘린더급 3대 뷰 스위처 & 우측 상세 서랍)
  const renderScheduleModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="스마트 일정 모듈 로드 중 오류가 발생했습니다.">
      <ScheduleView
        schedules={scheduleItems}
        onOpenEditModal={handleOpenEditModal}
        onDeleteItem={handleDeleteItem}
        onQuickCapture={() => setCurrentView('quick_capture')}
        isCompact={isCompact}
      />
    </ErrorBoundary>
  );

  // 2. 스마트 할 일 모듈 렌더러
  const renderTodoModule = (isCompact = false) => {
    const doneCount = todoItems.filter(t => t.done).length;
    const progressRate = todoItems.length > 0 ? Math.round((doneCount / todoItems.length) * 100) : 0;

    return (
      <ErrorBoundary fallbackTitle="스마트 할 일 모듈 로드 중 오류가 발생했습니다.">
        <div className={`space-y-4 ${isCompact ? 'p-1' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-neutral-800">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2 text-slate-900 dark:text-white whitespace-nowrap">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">2. 🎯 스마트할일 (Task Manager)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold border border-amber-200/60 dark:border-amber-800/40 whitespace-nowrap">
                  {doneCount}/{todoItems.length} 완료
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
                노션 데이터베이스 및 퀵 캡처로 연동된 실시간 체크리스트
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs text-slate-600 dark:text-neutral-300 font-semibold whitespace-nowrap">
                <span>진행률</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{progressRate}%</span>
              </div>
              <button 
                onClick={() => setCurrentView('quick_capture')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">할 일 추가</span>
              </button>
            </div>
          </div>

          {/* Empty State vs 데이터 목록 */}
          {todoItems.length === 0 ? (
            <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/70 dark:bg-neutral-900/30">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-neutral-500 opacity-70" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                등록된 스마트 할 일이 없습니다.
              </h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                오늘 집중해서 완수할 우선순위 태스크를 퀵 캡처나 음성으로 빠르게 등록해 보세요.
              </p>
              <button
                onClick={() => setCurrentView('quick_capture')}
                className="mt-3.5 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shadow-xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 태스크 추가하기</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todoItems.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => toggleTodo(todo.id)}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer group shadow-xs ${
                    todo.done
                      ? 'bg-slate-100/60 dark:bg-neutral-900/30 border-slate-200/60 dark:border-neutral-800/50 opacity-60'
                      : 'bg-white dark:bg-neutral-900/70 border-slate-200 dark:border-neutral-800 hover:border-amber-400/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer border-slate-300 shrink-0"
                    />
                    <span className={`text-xs sm:text-sm font-medium truncate ${todo.done ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {todo.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-medium whitespace-nowrap border border-slate-200/60 dark:border-neutral-700/60">
                      {todo.priority}
                    </span>
                    <button
                      onClick={(e) => handleDeleteTodo(e, todo)}
                      title="할 일 삭제"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  };

  // 3. 가계부 & 지출 모듈 렌더러
  const renderExpenseModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="가계부 및 소비 분석 모듈 로드 중 오류가 발생했습니다.">
      <div className={`space-y-4 ${isCompact ? 'p-1' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-neutral-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2 text-slate-900 dark:text-white whitespace-nowrap">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">3. 💰 가계부 및 지출 분석</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800/40 whitespace-nowrap">
                {expenseItems.length}건
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
              영수증 카메라 OCR 및 1초 퀵 캡처로 등록된 실제 지출 내역
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right whitespace-nowrap">
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 block leading-tight">총 지출 합계</span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                {totalExpenseAmount.toLocaleString()}원
              </span>
            </div>
            <button 
              onClick={() => setCurrentView('quick_capture')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">지출 기록</span>
            </button>
          </div>
        </div>

        {/* Empty State vs 데이터 목록 */}
        {expenseItems.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/70 dark:bg-neutral-900/30">
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-neutral-500 opacity-70" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              지출 내역이 비어 있습니다.
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              영수증 사진을 촬영하거나 "점심 식비 12,000원 결제"라고 퀵 캡처에 입력해 보세요.
            </p>
            <button
              onClick={() => setCurrentView('quick_capture')}
              className="mt-3.5 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>영수증 / 식비 등록하기</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {expenseItems.map((ex) => (
              <div 
                key={ex.id} 
                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-emerald-300 dark:hover:border-emerald-700 flex items-center justify-between transition shadow-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-2xl shrink-0">{ex.icon || '🧾'}</span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ex.title}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-400 whitespace-nowrap">
                      {ex.date} · {ex.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5 shrink-0 ml-3">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    -{ex.amount.toLocaleString()}원
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(ex)}
                    title="지출 내역 삭제"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  // 4. 이메일 AI 요약 모듈 렌더러
  const renderEmailModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="이메일 요약 모듈 로드 중 오류가 발생했습니다.">
      <div className={`space-y-4 ${isCompact ? 'p-1' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80 dark:border-neutral-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2 text-slate-900 dark:text-white whitespace-nowrap">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="whitespace-nowrap">4. ✉️ 이메일 AI 요약 및 브리핑</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold border border-purple-200/60 dark:border-purple-800/40 whitespace-nowrap">
                {emailSummaries.length}건
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
              수신 메일 중 중요 요약과 즉시 처리할 핵심 액션을 Gemini가 자동 분석
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="inline-flex items-center space-x-1.5 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl font-medium border border-purple-200/60 dark:border-purple-800/40 whitespace-nowrap">
              <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="whitespace-nowrap">Gemini 3.6 Flash 분석 연동</span>
            </span>
          </div>
        </div>

        {/* Empty State vs 데이터 목록 */}
        {emailSummaries.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/70 dark:bg-neutral-900/30">
            <Mail className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-neutral-500 opacity-70" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              수신된 이메일 요약이 없습니다.
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              연동된 메일함에서 중요한 메일이 감지되면 요약 및 할 일 액션이 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {emailSummaries.map((mail) => (
              <div 
                key={mail.id} 
                className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-slate-50/80 dark:hover:bg-neutral-900/80 transition flex flex-col gap-2 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {mail.sender}
                    </span>
                    {mail.important && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 whitespace-nowrap">
                        중요
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-400 whitespace-nowrap shrink-0">
                    {mail.time}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {mail.subject}
                </h4>
                <p className="text-xs text-slate-600 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-neutral-800/60 leading-relaxed">
                  <span className="font-semibold text-purple-600 dark:text-purple-400 mr-1">⚡ AI 요약:</span>
                  {mail.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  // 탭 목록 정의 (1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약 순서 고정)
  const TABS: { 
    id: LifeHubTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    countText: string;
    activeBorderColor: string;
    badgeColor: string;
  }[] = [
    {
      id: 'schedule',
      label: '1. 📅 스마트일정',
      icon: Calendar,
      countText: `${scheduleItems.length}건`,
      activeBorderColor: 'border-blue-500',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
    },
    {
      id: 'todo',
      label: '2. 🎯 스마트할일',
      icon: CheckSquare,
      countText: `${todoItems.filter(t => t.done).length}/${todoItems.length}`,
      activeBorderColor: 'border-amber-500',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
    },
    {
      id: 'expense',
      label: '3. 💰 가계부',
      icon: CreditCard,
      countText: totalExpenseAmount > 0 ? `${Math.round(totalExpenseAmount / 10000)}만` : `${expenseItems.length}건`,
      activeBorderColor: 'border-emerald-500',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    },
    {
      id: 'email',
      label: '4. ✉️ 이메일 요약',
      icon: Mail,
      countText: `${emailSummaries.length}건`,
      activeBorderColor: 'border-purple-500',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-50 dark:bg-notion-dark-bg text-slate-900 dark:text-slate-100 selection:bg-slate-200 dark:selection:bg-neutral-700 font-sans">
      {/* 상단 서브 헤더 네비게이션 */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3.5 border-b border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">홈으로</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌿</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                라이프 허브 (Life Hub)
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 whitespace-nowrap hidden sm:block">
                사용자 동선 맞춤 4대 라이프 대시보드 (스마트일정 · 할일 · 가계부 · 이메일)
              </p>
            </div>
          </div>
        </div>

        {/* 뷰 모드 토글 및 노션 연동 상태 / 동기화 */}
        <div className="flex items-center space-x-2">
          {/* 탭 뷰 vs 4분할 그리드 뷰 토글 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 shadow-xs">
            <button
              onClick={() => setViewMode('tabs')}
              title="상단 탭 스위칭 보기"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'tabs'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">탭 보기</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="4분할 그리드로 한눈에 보기"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">4분할 한눈에</span>
            </button>
          </div>

          <button
            onClick={syncLifeHubData}
            disabled={isLoadingNotion}
            title="노션 및 퀵 캡처 최신 데이터 새로고침"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotion ? 'animate-spin text-blue-500' : ''}`} />
            <span className="whitespace-nowrap">{isLoadingNotion ? '동기화 중...' : '실시간 동기화'}</span>
            {lastSyncTime && <span className="text-[10px] text-slate-400 hidden sm:inline whitespace-nowrap">({lastSyncTime})</span>}
          </button>

          <button
            onClick={() => setIsNotionSettingsModalOpen(true)}
            title={isNotionConnected ? '노션 DB 연결됨 (설정 열기)' : '노션 연결 대기 (클릭하여 노션 키 설정)'}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition whitespace-nowrap shadow-xs ${
              isNotionConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 animate-pulse'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isNotionConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="whitespace-nowrap">{isNotionConnected ? '노션 DB 연결됨' : '노션 연결 대기'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 sm:p-7 space-y-6">
        {/* 상단 4대 메뉴 네비게이션 탭 (1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약 순서) */}
        <div className="bg-slate-100/90 dark:bg-neutral-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-700/60 shadow-xs overflow-x-auto scrollbar-none">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-w-[520px] sm:min-w-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && viewMode === 'tabs';

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setViewMode('tabs');
                  }}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-neutral-700'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border border-slate-200/60 dark:border-neutral-700/60 whitespace-nowrap ${tab.badgeColor}`}>
                    {tab.countText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 컨텐츠 렌더링 분기: [탭 보기] vs [4분할 한눈에 보기] */}
        {viewMode === 'tabs' ? (
          <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 sm:p-7 shadow-sm">
            {activeTab === 'schedule' && renderScheduleModule(false)}
            {activeTab === 'todo' && renderTodoModule(false)}
            {activeTab === 'expense' && renderExpenseModule(false)}
            {activeTab === 'email' && renderEmailModule(false)}
          </div>
        ) : (
          /* 4분할 그리드 뷰 (2x2 반응형으로 1 -> 2 -> 3 -> 4 모듈 순서 정렬) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
              {renderScheduleModule(true)}
            </div>
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
              {renderTodoModule(true)}
            </div>
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
              {renderExpenseModule(true)}
            </div>
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
              {renderEmailModule(true)}
            </div>
          </div>
        )}
      </div>

        {/* 일정 수정 모달 */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center space-x-2 text-slate-900 dark:text-white whitespace-nowrap">
                  <Edit2 className="w-4 h-4 text-amber-500" />
                  <span className="whitespace-nowrap">스마트 일정 수정</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    일정 제목
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="일정 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    날짜 및 시간
                  </label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="2026-09-21"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                      분류
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="일정">일정</option>
                      <option value="할 일">할 일</option>
                      <option value="업무">업무</option>
                      <option value="건강">건강</option>
                      <option value="가족">가족</option>
                      <option value="개인">개인</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                      상태
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="미완료">미완료</option>
                      <option value="진행 중">진행 중</option>
                      <option value="완료">완료</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{isSavingEdit ? '저장 중...' : '저장 완료'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default LifePage;
