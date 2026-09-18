// src/components/life/ExpenseAnalyticsView.tsx
// 라이프 허브 가계부: 월간 페이싱 게이지, 카테고리별 다차원 분석 및 AI 누수 진단 대시보드
// 코파일럿 머니(Copilot Money) & 뱅크샐러드급 자산 분석 엔진

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CreditCard,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PieChart,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Check,
  Zap,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Tv,
  HeartPulse,
  HelpCircle,
  Camera
} from 'lucide-react';
import type { LifeExpenseItem, PaymentMethod, TransactionType } from '../../services/notionLifeHubSync';
import { createNotionExpensePage } from '../../services/notionLifeHubSync';
import { analyzeExpenseAnomalies, type ExpenseAnomalyInsight } from '../../services/aiExpenseAnomaly';


interface ExpenseAnalyticsViewProps {
  expenseItems: LifeExpenseItem[];
  setExpenseItems: React.Dispatch<React.SetStateAction<LifeExpenseItem[]>>;
  onDeleteExpense: (item: LifeExpenseItem) => void;
  onQuickCapture: () => void;
  isCompact?: boolean;
  notionApiKey?: string;
  expenseDbId?: string;
  geminiApiKey?: string;
}

// 카테고리 메타 정보 및 색상 팔레트
const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  '식비': { label: '식비', icon: Coffee, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/40' },
  '교통': { label: '교통', icon: Car, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500', border: 'border-sky-200 dark:border-sky-800/40' },
  '주거/구독': { label: '주거/구독', icon: Home, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800/40' },
  '문화/여가': { label: '문화/여가', icon: Tv, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800/40' },
  '쇼핑': { label: '쇼핑', icon: ShoppingBag, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500', border: 'border-pink-200 dark:border-pink-800/40' },
  '의료/건강': { label: '의료/건강', icon: HeartPulse, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/40' },
  '기타': { label: '기타/누수', icon: HelpCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700' },
  '미분류': { label: '미분류', icon: HelpCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-400', border: 'border-rose-200 dark:border-rose-800/40' }
};

export const ExpenseAnalyticsView: React.FC<ExpenseAnalyticsViewProps> = ({
  expenseItems,
  setExpenseItems,
  onDeleteExpense,
  onQuickCapture,
  isCompact = false,
  notionApiKey,
  expenseDbId,
  geminiApiKey
}) => {
  // 1. 월단위 기준 선택 (기본: 2026-09)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(2500000); // 월 목표 예산 250만원
  const [monthlyIncome] = useState<number>(3800000); // 월 총 수입 380만원
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);

  const [budgetInput, setBudgetInput] = useState<string>('2500000');

  // 카테고리 필터링
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // AI 누수 진단 상태
  const [aiInsight, setAiInsight] = useState<ExpenseAnomalyInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showLeakItemsOnly, setShowLeakItemsOnly] = useState<boolean>(false);

  // 신규 지출 등록 모달 상태 (노션 DB 롤업 매핑 폼)
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('2026-09-18');
  const [newCategory, setNewCategory] = useState<string>('식비');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('신용카드');
  const [newType, setNewType] = useState<TransactionType>('지출');
  const [newMemo, setNewMemo] = useState<string>('');
  const [isSavingToNotion, setIsSavingToNotion] = useState<boolean>(false);

  // 선택 가능한 월 목록
  const MONTH_OPTIONS = [
    { value: '2026-09', label: '2026년 9월 (현재)' },
    { value: '2026-08', label: '2026년 8월' },
    { value: '2026-07', label: '2026년 7월' },
    { value: '2026-06', label: '2026년 6월' }
  ];

  // 당월 지출 필터링
  const currentMonthExpenses = useMemo(() => {
    return expenseItems.filter((item) => item.date.startsWith(selectedMonth));
  }, [expenseItems, selectedMonth]);

  // 당월 총 지출 계산
  const totalExpense = useMemo(() => {
    return currentMonthExpenses
      .filter((item) => (item.type || '지출') === '지출')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [currentMonthExpenses]);

  // 당월 총 수입 계산 (등록된 수입 항목이 있으면 가산)
  const calculatedIncome = useMemo(() => {
    const extraIncome = currentMonthExpenses
      .filter((item) => item.type === '수입')
      .reduce((sum, item) => sum + item.amount, 0);
    return monthlyIncome + extraIncome;
  }, [currentMonthExpenses, monthlyIncome]);

  // 잔여 예산
  const remainingBudget = monthlyBudget - totalExpense;

  // 실제 소진율 (%)
  const burnRate = monthlyBudget > 0 ? Math.round((totalExpense / monthlyBudget) * 1000) / 10 : 0;

  // 월간 페이싱 연산 (Pacing Engine)
  const pacingMetrics = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 2026년 9월 기준 오늘 날짜는 18일, 과거 월은 100% 마감
    const isCurrentMonth = selectedMonth === '2026-09';
    const currentDay = isCurrentMonth ? 18 : daysInMonth;
    const elapsedDaysRatio = Math.min(100, Math.round((currentDay / daysInMonth) * 1000) / 10); // 예: 60.0%

    // 권장 예산 소진율
    const recommendedBurnRate = elapsedDaysRatio;

    // 페이싱 갭: (권장 소진율 - 실제 소진율)
    // 권장보다 실제가 적게 쓰면 안전(+)
    const pacingGap = Math.round((recommendedBurnRate - burnRate) * 10) / 10;
    const isSafe = pacingGap >= 0;
    const remainingDays = Math.max(1, daysInMonth - currentDay);
    const dailySafeSpend = remainingBudget > 0 ? Math.round(remainingBudget / remainingDays) : 0;

    return {
      daysInMonth,
      currentDay,
      recommendedBurnRate,
      pacingGap,
      isSafe,
      remainingDays,
      dailySafeSpend,
      isCurrentMonth
    };
  }, [selectedMonth, burnRate, remainingBudget]);

  // 카테고리별 다차원 지출 분석 데이터
  const categoryAnalytics = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};

    currentMonthExpenses
      .filter((item) => (item.type || '지출') === '지출')
      .forEach((item) => {
        let cat = item.category || '기타';
        if (cat === '미분류') cat = '기타';
        if (!map[cat]) map[cat] = { amount: 0, count: 0 };
        map[cat].amount += item.amount;
        map[cat].count += 1;
      });

    const entries = Object.entries(map).map(([category, data]) => {
      const percentage = totalExpense > 0 ? Math.round((data.amount / totalExpense) * 1000) / 10 : 0;
      return {
        category,
        amount: data.amount,
        count: data.count,
        percentage,
        meta: CATEGORY_META[category] || CATEGORY_META['기타']
      };
    });

    // 지출 금액 순 내림차순 정렬
    return entries.sort((a, b) => b.amount - a.amount);
  }, [currentMonthExpenses, totalExpense]);

  // AI 누수 진단 실행
  const runAnomalyAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzeExpenseAnomalies(currentMonthExpenses, totalExpense, geminiApiKey);
      setAiInsight(insight);
    } catch (err) {
      console.error('AI Anomaly 분석 실패:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentMonthExpenses, totalExpense, geminiApiKey]);

  // 월이 변경되거나 지출 데이터가 바뀔 때 AI 진단 자동 갱신
  useEffect(() => {
    runAnomalyAnalysis();
  }, [selectedMonth, currentMonthExpenses.length]);

  // 월 이동 핸들러
  const handlePrevMonth = () => {
    const currentIndex = MONTH_OPTIONS.findIndex((m) => m.value === selectedMonth);
    if (currentIndex < MONTH_OPTIONS.length - 1) {
      setSelectedMonth(MONTH_OPTIONS[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = MONTH_OPTIONS.findIndex((m) => m.value === selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(MONTH_OPTIONS[currentIndex - 1].value);
    }
  };

  // 신규 지출 등록 (노션 롤업 스키마 매핑)
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    const numAmt = Number(newAmount.replace(/[^0-9]/g, ''));
    if (numAmt <= 0) return;

    setIsSavingToNotion(true);

    const isMisc = newCategory === '기타' || newCategory === '미분류';
    const isLeakPattern = isMisc || /편의점|스타벅스|카페|배달팁|인앱/i.test(newTitle);

    const newItem: LifeExpenseItem = {
      id: `ex-local-${Date.now()}`,
      title: newTitle.trim(),
      amount: numAmt,
      date: newDate,
      category: newCategory,
      paymentMethod: newPaymentMethod,
      type: newType,
      merchant: newTitle.trim(),
      memo: newMemo.trim(),
      isLeak: isLeakPattern,
      icon: CATEGORY_META[newCategory]?.icon ? '💳' : '🧾'
    };

    // 노션 DB 연결 시 직접 생성 호출
    if (notionApiKey && expenseDbId) {
      const notionResult = await createNotionExpensePage(notionApiKey, expenseDbId, newItem);
      if (notionResult.success && notionResult.pageId) {
        newItem.notionPageId = notionResult.pageId;
      }
    }

    setExpenseItems((prev) => [newItem, ...prev]);

    // 입력 폼 초기화
    setNewTitle('');
    setNewAmount('');
    setNewMemo('');
    setIsSavingToNotion(false);
    setIsAddModalOpen(false);
  };

  // 표시할 지출 리스트 (카테고리 필터 및 누수 필터 적용)
  const displayedExpenses = useMemo(() => {
    return currentMonthExpenses.filter((item) => {
      if (showLeakItemsOnly && !item.isLeak && item.category !== '기타') return false;
      if (selectedCategoryFilter && item.category !== selectedCategoryFilter) return false;
      return true;
    });
  }, [currentMonthExpenses, showLeakItemsOnly, selectedCategoryFilter]);

  return (
    <div className={`space-y-5 ${isCompact ? 'p-1' : ''}`}>
      {/* 1. 상단 월 선택기 & 핵심 액션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
            <CreditCard className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">
                3. 💰 가계부 및 자산 분석
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800/40 whitespace-nowrap">
                {currentMonthExpenses.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
              코파일럿 머니/뱅크샐러드급 월간 페이싱 & AI 누수 이상 탐지
            </p>
          </div>
        </div>

        {/* 연/월 선택 드롭다운 및 신규 등록 버튼 */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-0.5 shadow-xs">
            <button
              onClick={handlePrevMonth}
              title="이전 달"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center space-x-1 px-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-neutral-200 focus:outline-none cursor-pointer py-1"
              >
                {MONTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="dark:bg-neutral-800">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={selectedMonth === '2026-09'}
              title="다음 달"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onQuickCapture}
            title="영수증 OCR 촬영 및 자연어 퀵 캡처"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-500" />
            <span className="whitespace-nowrap hidden sm:inline">영수증 OCR</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">지출 기록</span>
          </button>
        </div>
      </div>


      {/* 2. 코파일럿 머니/뱅크샐러드급 월간 페이싱 게이지 요약 카드 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50/70 dark:from-neutral-900 dark:to-neutral-900/60 border border-slate-200/90 dark:border-neutral-800 shadow-sm space-y-4">
        {/* 상단 4대 핵심 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/60">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block whitespace-nowrap">
              월간 총수입
            </span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
              {calculatedIncome.toLocaleString()}원
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 mt-0.5 whitespace-nowrap">
              <TrendingUp className="w-3 h-3" />
              <span>정기 급여 및 부수입</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/60">
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block whitespace-nowrap">
              당월 총지출
            </span>
            <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5 whitespace-nowrap">
              {totalExpense.toLocaleString()}원
            </div>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 block mt-0.5 whitespace-nowrap">
              총 {currentMonthExpenses.length}건 집계 완료
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                월 목표 예산
              </span>
              <button
                onClick={() => {
                  if (isEditingBudget) {
                    setMonthlyBudget(Number(budgetInput.replace(/[^0-9]/g, '')) || 2500000);
                    setIsEditingBudget(false);
                  } else {
                    setBudgetInput(String(monthlyBudget));
                    setIsEditingBudget(true);
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 underline cursor-pointer whitespace-nowrap"
              >
                {isEditingBudget ? '완료' : '수정'}
              </button>
            </div>
            {isEditingBudget ? (
              <input
                type="text"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full mt-1 px-1.5 py-0.5 text-xs font-bold bg-white dark:bg-neutral-900 border border-slate-300 rounded"
              />
            ) : (
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
                {monthlyBudget.toLocaleString()}원
              </div>
            )}
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 block mt-0.5 whitespace-nowrap">
              권장 일일 예산: {Math.round(monthlyBudget / pacingMetrics.daysInMonth).toLocaleString()}원
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            remainingBudget >= 0 
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40' 
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40'
          }`}>
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 block whitespace-nowrap">
              잔여 예산
            </span>
            <div className={`text-base sm:text-lg font-bold mt-0.5 whitespace-nowrap ${
              remainingBudget >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {remainingBudget >= 0 ? `${remainingBudget.toLocaleString()}원` : `-${Math.abs(remainingBudget).toLocaleString()}원 초과`}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 block mt-0.5 whitespace-nowrap">
              남은 {pacingMetrics.remainingDays}일간 하루 {pacingMetrics.dailySafeSpend.toLocaleString()}원 가능
            </span>
          </div>
        </div>

        {/* 예산 소진율(%) 게이지 프로그레스 바 & 페이싱 마커 */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                예산 소진율
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                burnRate <= 60 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                  : burnRate <= 85 
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' 
                    : burnRate <= 100 
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' 
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                {burnRate}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-400 whitespace-nowrap">
              권장 이상 소진율: <span className="font-semibold text-slate-700 dark:text-slate-300">{pacingMetrics.recommendedBurnRate}%</span> ({pacingMetrics.currentDay}일 / {pacingMetrics.daysInMonth}일 경과)
            </div>
          </div>

          {/* 게이지 바 컨테이너 및 권장 기준선 핀 */}
          <div className="relative w-full h-3.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-visible border border-slate-200/80 dark:border-neutral-700 shadow-inner">
            {/* 실제 소진율 채움 바 */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                burnRate <= 60 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : burnRate <= 85 
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500' 
                    : burnRate <= 100 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : 'bg-gradient-to-r from-rose-500 to-red-600'
              }`}
              style={{ width: `${Math.min(100, burnRate)}%` }}
            />

            {/* 권장 소진율 지점 마커 핀 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-700 dark:bg-white z-10"
              style={{ left: `${Math.min(100, Math.max(0, pacingMetrics.recommendedBurnRate))}%` }}
            >
              <div className="absolute -top-4 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[9px] font-bold text-slate-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 px-1 rounded shadow-xs border border-slate-200 dark:border-neutral-700 whitespace-nowrap">
                  권장 {pacingMetrics.recommendedBurnRate}%
                </span>
              </div>
            </div>
          </div>

          {/* 페이싱 지표 코파일럿 스타일 배너 */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
            pacingMetrics.isSafe 
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200' 
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center space-x-2">
              {pacingMetrics.isSafe ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <span className="font-semibold whitespace-nowrap">
                {pacingMetrics.isCurrentMonth ? (
                  pacingMetrics.isSafe
                    ? `현재 권장 예산 소진율 대비 ${Math.abs(pacingMetrics.pacingGap)}% 안전하게 지출 중입니다.`
                    : `현재 권장 예산 소진율 대비 ${Math.abs(pacingMetrics.pacingGap)}% 초과 지출 중입니다. 절약이 권장됩니다.`
                ) : (
                  `해당 월은 목표 예산 대비 ${burnRate}%로 최종 마감되었습니다.`
                )}
              </span>
            </div>
            <div className="text-[11px] opacity-80 whitespace-nowrap hidden sm:block">
              {pacingMetrics.isSafe ? '🟢 페이싱 양호' : '🟡 페이싱 주의'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. '기타/누수 지출' AI 심층 분석 칩 (Copilot Money / BankSalad 스타일) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80 dark:from-purple-950/20 dark:via-neutral-900 dark:to-indigo-950/20 border border-purple-200/80 dark:border-purple-900/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 whitespace-nowrap">
                <span>AI 누수 & 미분류 심층 진단</span>
                {aiInsight && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${
                    aiInsight.riskLevel === 'safe'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : aiInsight.riskLevel === 'warning'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {aiInsight.riskLevel === 'safe' ? '🟢 누수 안전' : aiInsight.riskLevel === 'warning' ? '🟡 누수 주의' : '🔴 누수 경고'}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {aiInsight && (
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 hidden sm:inline whitespace-nowrap">
                분석 {aiInsight.analyzedAt} ({aiInsight.engine === 'gemini' ? 'Gemini 3.6 Flash' : 'Smart Rule AI'})
              </span>
            )}
            <button
              onClick={runAnomalyAnalysis}
              disabled={isAnalyzing}
              title="AI 누수 재진단 실행"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">{isAnalyzing ? '분석 중...' : 'AI 재진단'}</span>
            </button>
          </div>
        </div>

        {/* AI 인사이트 본문 칩 */}
        {aiInsight && (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-white/90 dark:bg-neutral-900/80 border border-purple-100 dark:border-purple-900/30 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
              <p className="font-semibold text-purple-900 dark:text-purple-200">
                "{aiInsight.summary}"
              </p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{aiInsight.recommendation}</span>
              </p>
            </div>

            {/* 퀵 액션 토글 바 */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                onClick={() => setShowLeakItemsOnly(!showLeakItemsOnly)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer whitespace-nowrap ${
                  showLeakItemsOnly
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-50'
                }`}
              >
                {showLeakItemsOnly ? '✓ 누수 의심 결제만 표시 중' : `누수 의심 결제 모아보기 (${aiInsight.leakCount}건)`}
              </button>

              <div className="text-[11px] text-slate-400 dark:text-neutral-500 ml-auto whitespace-nowrap">
                기타/미분류 비중: <span className="font-bold text-slate-700 dark:text-slate-300">{aiInsight.leakRatio}%</span> · 소액 결제율: <span className="font-bold text-slate-700 dark:text-slate-300">{aiInsight.microSpendRatio}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. 카테고리별 다차원 지출 분석 바 차트 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900/70 border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-slate-700 dark:text-neutral-300" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
              카테고리별 다차원 지출 비중
            </h3>
          </div>
          {selectedCategoryFilter && (
            <button
              onClick={() => setSelectedCategoryFilter(null)}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 cursor-pointer whitespace-nowrap"
            >
              필터 초기화 (전체 보기)
            </button>
          )}
        </div>

        {categoryAnalytics.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            당월 지출 내역이 없어 카테고리 통계를 계산할 수 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoryAnalytics.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.category;
              return (
                <div
                  key={cat.category}
                  onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.category)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-neutral-800 border-slate-400 dark:border-neutral-600 shadow-xs'
                      : 'bg-white dark:bg-neutral-900 border-slate-100 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.meta.bg}`} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {cat.category}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                        ({cat.count}건)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {cat.amount.toLocaleString()}원
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 min-w-[36px] text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* 시각화 프로그레스 바 */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cat.meta.bg}`}
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. 결제 거래 내역 리스트 (Notion DB 롤업 매핑 규격) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 whitespace-nowrap">
              상세 거래 내역
            </span>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              ({displayedExpenses.length}개 항목)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">
            노션 DB 롤업/수식 규격 자동 매핑
          </div>
        </div>

        {displayedExpenses.length === 0 ? (
          <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/70 dark:bg-neutral-900/30">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-70" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              해당 조건의 지출 내역이 없습니다.
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
              상단의 "지출 기록" 버튼을 눌러 새로운 지출을 등록해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedExpenses.map((ex) => (
              <div
                key={ex.id}
                className={`p-3 rounded-xl border bg-white dark:bg-neutral-900/60 transition shadow-xs flex items-center justify-between ${
                  ex.isLeak
                    ? 'border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400'
                    : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xl shrink-0">{ex.icon || '🧾'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {ex.title}
                      </span>
                      {ex.isLeak && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 whitespace-nowrap">
                          누수 의심
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 dark:text-neutral-400 mt-0.5">
                      <span className="whitespace-nowrap">{ex.date}</span>
                      <span>·</span>
                      <span className="whitespace-nowrap font-medium text-slate-600 dark:text-neutral-300">
                        {ex.category}
                      </span>
                      {ex.paymentMethod && (
                        <>
                          <span>·</span>
                          <span className="whitespace-nowrap text-slate-500 dark:text-neutral-400">
                            {ex.paymentMethod}
                          </span>
                        </>
                      )}
                      {ex.memo && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[150px]">{ex.memo}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 ml-3">
                  <div className="text-right whitespace-nowrap">
                    <span className={`text-xs sm:text-sm font-bold ${
                      ex.type === '수입' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {ex.type === '수입' ? `+${ex.amount.toLocaleString()}원` : `-${ex.amount.toLocaleString()}원`}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteExpense(ex)}
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

      {/* 6. 신규 지출 등록 모달 (노션 DB 롤업 매핑 규격 폼) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    신규 지출 / 수입 등록
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                    노션 가계부 DB 롤업/수식 속성 정합성 규격
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              {/* 구분 선택 (지출 vs 수입) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewType('지출')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                    newType === '지출'
                      ? 'bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  - 지출 (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('수입')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                    newType === '수입'
                      ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400'
                  }`}
                >
                  + 수입 (Income)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                  항목명 (상호명 / 내역)
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: GS25 편의점 커피, 점심 구내식당"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    금액 (원)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="9000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    결제일자
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    카테고리 분류
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="식비">🍱 식비</option>
                    <option value="교통">🚇 교통</option>
                    <option value="주거/구독">🏠 주거/구독</option>
                    <option value="문화/여가">🎬 문화/여가</option>
                    <option value="쇼핑">🛍️ 쇼핑</option>
                    <option value="의료/건강">💊 의료/건강</option>
                    <option value="기타">❓ 기타/미분류</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    결제 수단
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="신용카드">💳 신용카드</option>
                    <option value="체크카드">💳 체크카드</option>
                    <option value="간편결제">📱 간편결제 (페이)</option>
                    <option value="현금">💵 현금 / 계좌이체</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                  메모 / 비고 (선택)
                </label>
                <input
                  type="text"
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  placeholder="예: 법인카드 미지원 영수증 청구 필요"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 노션 롤업 안내 */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-[11px] text-slate-500 dark:text-neutral-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-700 dark:text-neutral-200 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>노션 DB 롤업 매핑 규격 보장</span>
                </div>
                <p>
                  입력된 데이터는 노션 가계부 데이터베이스의 [월별 지출 합계 롤업], [결제수단별 지출 수식] 속성에 정확히 반영됩니다.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingToNotion || !newTitle.trim() || !newAmount}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{isSavingToNotion ? '노션 동기화 중...' : '저장 완료'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
