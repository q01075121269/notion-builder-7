// src/app/life/page.tsx
// 라이프 허브: 노션 DB 및 퀵 캡처 실시간 양방향 융합 렌더링 화면

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Mail, 
  CreditCard, 
  CheckSquare, 
  ArrowLeft, 
  Clock, 
  Plus, 
  Bot,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  Check
} from 'lucide-react';
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

type LifeHubTab = 'schedule' | 'email' | 'expense' | 'todo';

const INITIAL_DEMO_SCHEDULES: LifeScheduleItem[] = [
  { id: 's1', title: '치과 정기 검진', date: '2026-09-19 15:00', dday: 'D-1', category: '건강', icon: '🦷' },
  { id: 's2', title: 'Q3 프로젝트 최종 릴리즈 회의', date: '2026-09-22 10:30', dday: 'D-4', category: '업무', icon: '💼' },
  { id: 's3', title: '부모님 생신 저녁 식사', date: '2026-09-26 18:30', dday: 'D-8', category: '가족', icon: '🎂' }
];

const INITIAL_DEMO_EXPENSES: LifeExpenseItem[] = [
  { id: 'ex1', title: '점심 식사 (구내식당)', amount: 9000, date: '2026-09-18', category: '식비', icon: '🍱' },
  { id: 'ex2', title: '지하철 정기권 충전', amount: 55000, date: '2026-09-17', category: '교통', icon: '🚇' },
  { id: 'ex3', title: '업무용 도서 구입 (클린 코드)', amount: 28000, date: '2026-09-16', category: '도서', icon: '📚' }
];

const INITIAL_DEMO_TODOS: LifeTodoItem[] = [
  { id: 't1', title: 'v2.0 라우트 분리 작업 완료 및 배포', done: true, priority: '🔥 긴급' },
  { id: 't2', title: '주간 업무 결산 리포트 작성', done: false, priority: '⭐ 보통' },
  { id: 't3', title: '헬스장 하체 운동 40분', done: false, priority: '☕ 여유' },
  { id: 't4', title: '전기세 및 공과금 자동이체 확인', done: true, priority: '⭐ 보통' }
];

export const LifePage: React.FC = () => {
  const { 
    setCurrentView, 
    notionApiKey, 
    createdNotionResource,
    selectedNotionDbId,
    selectedExpenseDbId
  } = useApp();

  const [activeTab, setActiveTab] = useState<LifeHubTab>('schedule');
  const [scheduleItems, setScheduleItems] = useState<LifeScheduleItem[]>(INITIAL_DEMO_SCHEDULES);
  const [expenseItems, setExpenseItems] = useState<LifeExpenseItem[]>(INITIAL_DEMO_EXPENSES);
  const [todoItems, setTodoItems] = useState<LifeTodoItem[]>(INITIAL_DEMO_TODOS);
  const [isLoadingNotion, setIsLoadingNotion] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const [emailSummaries] = useState([
    { id: 'e1', sender: 'GitHub', subject: '[Security] New sign-in detected', summary: '새로운 브라우저에서 로그인 감지됨. 본인 확인 권장', time: '10분 전', important: true },
    { id: 'e2', sender: 'Google Cloud Billing', subject: '2026년 8월 결제 영수증 발행 안내', summary: '총 청구금액 12,400원 정상 결제 완료', time: '2시간 전', important: false },
    { id: 'e3', sender: 'Notion Team', subject: 'Notion 3.0 신규 업데이트 및 AI 기능 발표', summary: '새로운 수식 라이브러리와 스마트 사서 기능 공개', time: '어제', important: true }
  ]);

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

  const handleDeleteItem = async (item: LifeScheduleItem) => {
    if (!window.confirm(`'${item.title}' 일정을 삭제하시겠습니까?\n노션 데이터베이스에서도 휴지통으로 안전하게 이동됩니다.`)) {
      return;
    }

    try {
      if (notionApiKey && item.notionPageId) {
        await deleteNotionPage(notionApiKey, item.notionPageId);
      }
      setScheduleItems(prev => prev.filter(s => s.id !== item.id));
      setTodoItems(prev => prev.filter(t => t.title !== item.title));
    } catch (e) {
      console.error('일정 삭제 실패:', e);
      setScheduleItems(prev => prev.filter(s => s.id !== item.id));
    }
  };

  // 라이프 허브 데이터 동기화 (로컬 퀵 캡처 최신 항목 + 노션 클라우드 실제 DB 행 병합)
  const syncLifeHubData = useCallback(async () => {
    setIsLoadingNotion(true);
    try {
      // 1. 로컬 퀵 캡처 데이터 즉시 로드 (사용자가 퀵 캡처에서 방금 입력한 항목들)
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

      // 3. 데이터 병합 및 중복 제거 (제목 기준)
      // 일정 병합
      const mergedSchedules = [...qcData.schedules];
      notionSchedules.forEach(ns => {
        const cleanTitle = ns.title.replace(/^⚡\s*/, '').trim();
        if (!mergedSchedules.some(s => s.title.replace(/^⚡\s*/, '').trim() === cleanTitle)) {
          mergedSchedules.push(ns);
        }
      });
      if (mergedSchedules.length > 0) {
        setScheduleItems(mergedSchedules);
      }

      // 가계부 병합
      const mergedExpenses = [...qcData.expenses];
      notionExpenses.forEach(ne => {
        const cleanTitle = ne.title.replace(/^⚡\s*/, '').trim();
        if (!mergedExpenses.some(e => e.title.replace(/^⚡\s*/, '').trim() === cleanTitle)) {
          mergedExpenses.push(ne);
        }
      });
      if (mergedExpenses.length > 0) {
        setExpenseItems(mergedExpenses);
      }

      // 할 일 병합
      const mergedTodos = [...qcData.todos];
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
      if (mergedTodos.length > 0) {
        setTodoItems(mergedTodos);
      }

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

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white">
      {/* 상단 서브 헤더 네비게이션 */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-notion-dark-bg/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>홈으로</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌿</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">라이프 허브 (Life Hub)</h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                퀵 캡처 및 노션 DB와 실시간 양방향 연동되는 올인원 대시보드
              </p>
            </div>
          </div>
        </div>

        {/* 노션 연동 상태 및 실시간 새로고침 버튼 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={syncLifeHubData}
            disabled={isLoadingNotion}
            title="노션 및 퀵 캡처 최신 데이터 새로고침"
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotion ? 'animate-spin text-blue-500' : ''}`} />
            <span>{isLoadingNotion ? '노션 동기화 중...' : '실시간 동기화'}</span>
            {lastSyncTime && <span className="text-[10px] text-neutral-400 hidden sm:inline">({lastSyncTime})</span>}
          </button>

          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isNotionConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isNotionConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isNotionConnected ? '노션 DB 연결됨' : '노션 연결 대기'}</span>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* 4대 서브 섹션 탭 네비게이션 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-200/60 dark:bg-neutral-800/60 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>스마트 일정</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              {scheduleItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 text-purple-500" />
            <span>이메일 AI 요약</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">신규</span>
          </button>

          <button
            onClick={() => setActiveTab('expense')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>가계부 & 지출</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              {totalExpenseAmount > 0 ? `${Math.round(totalExpenseAmount / 10000)}만` : expenseItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('todo')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'todo'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-amber-500" />
            <span>스마트 할 일</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              {todoItems.filter(t => t.done).length}/{todoItems.length}
            </span>
          </button>
        </div>

        {/* 탭별 메인 컨텐츠 영역 */}
        <div className="bg-white dark:bg-notion-dark-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* 1. 스마트 일정 */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span>스마트 일정 관리</span>
                  </h2>
                  <p className="text-xs text-neutral-500">
                    노션 캘린더 DB 및 모바일 퀵 캡처에서 등록된 최신 일정 목록입니다.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentView('quick_capture')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>1초 퀵 캡처로 등록</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scheduleItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/50 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-2xl">{item.icon || '📅'}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          {item.dday}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {item.pageUrl && (
                          <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="노션에서 직접 열기"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="일정 내용 수정"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          title="일정 삭제"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.date}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-[10px] font-semibold">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. 이메일 AI 요약 */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-purple-500" />
                    <span>이메일 AI 브리핑 및 액션 추출</span>
                  </h2>
                  <p className="text-xs text-neutral-500">수신된 메일 중 핵심 요약과 즉시 처리할 태스크를 Gemini가 자동 분류합니다.</p>
                </div>
                <span className="inline-flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full font-semibold">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Gemini 3.6 Flash 분석 중</span>
                </span>
              </div>

              <div className="space-y-3">
                {emailSummaries.map((mail) => (
                  <div key={mail.id} className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/80 transition flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{mail.sender}</span>
                        {mail.important && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                            중요
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400">{mail.time}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{mail.subject}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-white/60 dark:bg-neutral-950/40 p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60">
                        ⚡ AI 요약: {mail.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 가계부 & 지출 */}
          {activeTab === 'expense' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <span>가계부 및 소비 분석</span>
                  </h2>
                  <p className="text-xs text-neutral-500">영수증 카메라 OCR 및 1초 퀵 캡처로 등록된 실제 지출 내역입니다.</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400">총 지출 합계</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalExpenseAmount.toLocaleString()}원
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {expenseItems.map((ex) => (
                  <div key={ex.id} className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/40 dark:bg-neutral-900/40 hover:border-emerald-300 transition">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{ex.icon || '🧾'}</span>
                      <div>
                        <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{ex.title}</div>
                        <div className="text-[11px] text-neutral-400">{ex.date} · {ex.category}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">
                      -{ex.amount.toLocaleString()}원
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. 스마트 할 일 */}
          {activeTab === 'todo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-amber-500" />
                    <span>스마트 할 일 (Task Manager)</span>
                  </h2>
                  <p className="text-xs text-neutral-500">노션 DB 및 퀵 캡처로 등록된 할 일 목록과 완료 체크</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-neutral-500">
                    진행률: {todoItems.filter(t => t.done).length} / {todoItems.length} ({todoItems.length > 0 ? Math.round((todoItems.filter(t => t.done).length / todoItems.length) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {todoItems.map((todo) => (
                  <div
                    key={todo.id}
                    onClick={() => toggleTodo(todo.id)}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      todo.done
                        ? 'bg-neutral-100/50 dark:bg-neutral-900/20 border-neutral-200/50 dark:border-neutral-800/40 opacity-70'
                        : 'bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={todo.done}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                      />
                      <span className={`text-xs font-medium ${todo.done ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {todo.title}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                      {todo.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 일정 수정 모달 */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <span>스마트 일정 수정</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  일정 제목
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  날짜 및 시간
                </label>
                <input
                  type="text"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="2026-09-21"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    분류
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    상태
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="미완료">미완료</option>
                    <option value="진행 중">진행 중</option>
                    <option value="완료">완료</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editTitle.trim()}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? '노션 저장 중...' : '저장 완료'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LifePage;
