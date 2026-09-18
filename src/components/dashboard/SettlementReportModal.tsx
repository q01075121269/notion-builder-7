import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  CheckSquare, 
  DollarSign, 
  FileText, 
  Share2, 
  ExternalLink, 
  RefreshCw, 
  Award, 
  Target,
  AlertCircle
} from 'lucide-react';
import type { AggregatedPeriodStats, SettlementReport } from '../../types/librarian';
import { 
  aggregateWorkspaceData, 
  generateSettlementReportWithGemini, 
  publishSettlementPageToNotion 
} from '../../services/librarianService';

interface SettlementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettlementReportModal: React.FC<SettlementReportModalProps> = ({ isOpen, onClose }) => {
  const { 
    apiKey, 
    notionApiKey, 
    notionParentPageId, 
    currentTemplate, 
    createdNotionResource,
    setIsNotionSettingsModalOpen,
    showToast
  } = useApp();

  const [periodDays, setPeriodDays] = useState<7 | 30>(7);
  const [stats, setStats] = useState<AggregatedPeriodStats | null>(null);
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [isAggregating, setIsAggregating] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; pageUrl?: string; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 데이터 집계 및 AI 리포트 생성 로드
  const loadDataAndReport = async (days: 7 | 30) => {
    setIsAggregating(true);
    setErrorMsg(null);
    setPublishResult(null);

    try {
      // 1. 기간별 데이터 집계
      const aggregated = await aggregateWorkspaceData(
        days,
        notionApiKey,
        createdNotionResource,
        currentTemplate
      );
      setStats(aggregated);
      setIsAggregating(false);

      // 2. AI 결산 리포트 생성
      setIsGeneratingAi(true);
      const generated = await generateSettlementReportWithGemini(aggregated, apiKey);
      setReport(generated);
      showToast('AI 결산 브리핑 리포트 생성이 완료되었습니다!', 'success');
    } catch (err: any) {
      console.error('Failed to load settlement data:', err);
      const msg = err.message || '결산 데이터를 불러오는 데 실패했습니다.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsAggregating(false);
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDataAndReport(periodDays);
    }
  }, [isOpen, periodDays]);

  // 노션으로 발행 핸들러
  const handlePublishToNotion = async () => {
    if (!report) return;

    if (!notionApiKey || !notionParentPageId) {
      const msg = '노션 워크스페이스 연동 정보(API Key 및 부모 페이지 ID)가 설정되지 않았습니다.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    setIsPublishing(true);
    setErrorMsg(null);

    try {
      const result = await publishSettlementPageToNotion(
        report,
        notionApiKey,
        notionParentPageId
      );
      setPublishResult(result);
      if (result.success) {
        showToast('결산 리포트가 노션에 발행되었습니다!', 'success');
      } else {
        showToast(result.message || '노션 발행 실패', 'error');
      }
    } catch (err: any) {
      const msg = err.message || '노션 페이지 발행 중 오류가 발생했습니다.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-notion-dark-border flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/50">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                <span>AI 생산성 & 라이프 결산 브리핑</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                  확장 3단계
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                노션에 기록된 할 일, 지출, 메모를 분석해 비주얼 인사이트 리포트를 생성하고 노션에 자동 발행합니다
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Controls: Period Switcher & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center space-x-1.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl">
              <button
                onClick={() => setPeriodDays(7)}
                disabled={isAggregating || isGeneratingAi}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodDays === 7
                    ? 'bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                📅 주간 결산 (최근 7일)
              </button>
              <button
                onClick={() => setPeriodDays(30)}
                disabled={isAggregating || isGeneratingAi}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodDays === 30
                    ? 'bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                📆 월간 결산 (최근 30일)
              </button>
            </div>

            <button
              onClick={() => loadDataAndReport(periodDays)}
              disabled={isAggregating || isGeneratingAi}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAggregating || isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {(isAggregating || isGeneratingAi) && (
            <div className="p-8 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {isAggregating ? '노션 워크스페이스 데이터 집계 중...' : 'Gemini AI가 결산 브리핑 리포트를 작성 중입니다...'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                할 일 완료율 계산, 카테고리별 지출 비율 분석, 맞춤형 액션 플랜을 도출하고 있습니다.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Publish Banner */}
          {publishResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              publishResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{publishResult.message}</span>
                </span>
                {publishResult.pageUrl && (
                  <a
                    href={publishResult.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-1 transition shadow-xs"
                  >
                    <span>노션에서 결산 페이지 열기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Aggregated Raw Stats Summary Cards */}
          {stats && !isAggregating && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tasks Card */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center space-x-1 font-semibold">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>할 일 달성률</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {stats.tasks.completionRate}%
                  </span>
                </div>
                <div className="text-xl font-extrabold text-neutral-900 dark:text-white">
                  {stats.tasks.completed} / {stats.tasks.total}건
                </div>
                {/* Progress bar */}
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.tasks.completionRate)}%` }}
                  />
                </div>
                <div className="text-[10px] text-neutral-400 flex justify-between">
                  <span>진행중: {stats.tasks.inProgress}건</span>
                  <span>지연: {stats.tasks.delayed}건</span>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center space-x-1 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>총 지출액</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.expenses.transactionCount}건 기록
                  </span>
                </div>
                <div className="text-xl font-extrabold text-neutral-900 dark:text-white">
                  ₩{stats.expenses.totalAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {stats.expenses.categories.length > 0 
                    ? `최다 지출: ${stats.expenses.categories[0].category} (₩${stats.expenses.categories[0].amount.toLocaleString()})`
                    : '지출 기록 없음'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {stats.expenses.categories.slice(0, 2).map(c => `${c.category} ${c.percentage}%`).join(' | ')}
                </div>
              </div>

              {/* Habits / Memos Card */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center space-x-1 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>메모 & 습관</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    {stats.habitsAndMemos.totalRecords}건
                  </span>
                </div>
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 line-clamp-1">
                  {stats.habitsAndMemos.sentimentSummary}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {stats.habitsAndMemos.topKeywords.slice(0, 4).map((kw, i) => (
                    <span 
                      key={i} 
                      className="px-1.5 py-0.5 rounded-md text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-medium"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Generated Settlement Report Content */}
          {report && !isGeneratingAi && (
            <div className="space-y-6">
              {/* Report Title & 3 Highlights Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200 dark:border-orange-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span>{report.title}</span>
                  </h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {report.periodLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                    📌 3줄 핵심 하이라이트 요약
                  </div>
                  <div className="space-y-1.5">
                    {report.summaryHighlights.map((hl, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-neutral-800 dark:text-neutral-200">
                        <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">#{i + 1}</span>
                        <span className="leading-relaxed">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Text Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card space-y-2">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>과제 완수율 게이지</span>
                  </span>
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                    {report.charts.taskProgressBar}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card space-y-2">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>주요 지출 카테고리 비중</span>
                  </span>
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {report.charts.topExpenseBar}
                  </div>
                </div>
              </div>

              {/* Good Points & Action Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Good Points */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card space-y-2.5">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>🌟 이번 기간 잘한 점</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {report.goodPoints.map((gp, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-amber-500 shrink-0">✔</span>
                        <span>{gp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Action Plans */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card space-y-2.5">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <span>🚀 다음 기간 AI 추천 액션 플랜</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {report.actionPlans.map((ap, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-indigo-500 font-bold shrink-0">{i + 1}.</span>
                        <span>{ap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Notion Configuration Reminder */}
          {(!notionApiKey || !notionParentPageId) && (
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
              <span>내 노션 워크스페이스에 결산 리포트를 바로 등록하려면 API Key와 부모 페이지 ID 연동이 필요합니다.</span>
              <button
                onClick={() => setIsNotionSettingsModalOpen(true)}
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline shrink-0 ml-2"
              >
                연동 설정하기 &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-notion-dark-border bg-neutral-50/70 dark:bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {report ? `${report.periodLabel} 분석 완료` : '데이터 준비 중'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              닫기
            </button>

            <button
              onClick={handlePublishToNotion}
              disabled={!report || isPublishing || !notionApiKey || !notionParentPageId}
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 text-xs font-bold flex items-center space-x-2 shadow-sm transition"
            >
              {isPublishing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-orange-400" />
              )}
              <span>{isPublishing ? '노션 페이지 발행 중...' : '내 노션에 결산 페이지 등록'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
