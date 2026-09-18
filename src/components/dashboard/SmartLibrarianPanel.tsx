import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import type { SmartLibrarianAnswer } from '../../types/librarian';
import { askSmartLibrarian } from '../../services/librarianService';

interface SmartLibrarianPanelProps {
  onOpenSettlement?: () => void;
}

const PRESET_QUESTIONS = [
  '📊 현재 등록된 할 일 목록과 진행 상태 요약해 줘',
  '💰 최근 지출 내역 중 가장 큰 항목과 총액은?',
  '📚 지난번에 적어둔 독서 목록이나 스터디 메모 찾아줘',
  '✈️ 가족 여행 계획과 예산 정보 찾아줘',
  '💡 최근 캡처하거나 메모한 핵심 아이디어 정리해 줘'
];

export const SmartLibrarianPanel: React.FC<SmartLibrarianPanelProps> = ({ onOpenSettlement }) => {
  const { 
    apiKey, 
    notionApiKey, 
    currentTemplate, 
    createdNotionResource,
    setIsNotionSettingsModalOpen,
    showToast
  } = useApp();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<SmartLibrarianAnswer | null>(null);
  const [history, setHistory] = useState<SmartLibrarianAnswer[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery || question).trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep('🔍 질문 분석 및 노션 워크스페이스 검색 중...');

    try {
      const answer = await askSmartLibrarian(
        q,
        apiKey,
        notionApiKey,
        currentTemplate,
        createdNotionResource,
        (step: string) => setLoadingStep(step)
      );

      setCurrentAnswer(answer);
      setHistory(prev => [answer, ...prev.slice(0, 9)]);
      if (!targetQuery) setQuestion('');
      showToast('사서 Q&A 답변이 도착했습니다!', 'success');
    } catch (err: any) {
      console.error('Librarian search error:', err);
      const msg = err.message || '질문 답변 생성 중 오류가 발생했습니다.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-neutral-900 to-purple-950 text-white shadow-md relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                노션 워크스페이스 지능형 사서 (Smart Librarian Q&A)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                RAG 전수 검색
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
              노션에 흩어진 일정, 가계부, 회의록, 아이디어 메모를 자연어로 검색하세요. 
              Gemini가 실제 노션 블록 텍스트만을 엄격히 분석하여 사실에 기반한 명확한 답변과 원본 문서 링크를 찾아드립니다.
            </p>
          </div>

          {onOpenSettlement && (
            <button
              onClick={onOpenSettlement}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-orange-500/20 transition shrink-0"
            >
              <TrendingUp className="w-4 h-4" />
              <span>AI 결산 브리핑 보기</span>
            </button>
          )}
        </div>

        {/* API Status Tip */}
        <div className="mt-4 pt-4 border-t border-indigo-800/40 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-300/90">
          <div className="flex items-center space-x-2">
            {notionApiKey ? (
              <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Notion 워크스페이스 API 연동 활성</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-amber-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Notion API 미연동 (현재 템플릿 & 퀵 캡처 데이터 기반 분석 모드로 동작)</span>
              </span>
            )}
          </div>
          {!notionApiKey && (
            <button
              onClick={() => setIsNotionSettingsModalOpen(true)}
              className="underline hover:text-white transition"
            >
              API 키 설정하러 가기 &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-notion-dark-card p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-notion-dark-border shadow-xs space-y-3">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-indigo-500 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="노션 워크스페이스에 대해 무엇이든 물어보세요 (예: 지난주 지출 얼마였지?, 추천 책 목록 찾아줘)"
            disabled={isLoading}
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:bg-white dark:focus:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 transition"
          />
          <button
            onClick={() => handleSearch()}
            disabled={isLoading || !question.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? '검색 중' : '질문하기'}</span>
          </button>
        </div>

        {/* Preset Question Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-indigo-500" />
            <span>추천 실무 질문 클릭하여 바로 묻기:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUESTIONS.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(pq);
                  handleSearch(pq);
                }}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition text-left"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Step Loading Progress Indicator */}
      {isLoading && (
        <div className="p-6 rounded-2xl bg-white dark:bg-notion-dark-card border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                스마트 사서가 답변을 준비하고 있습니다
              </h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {loadingStep || '노션 데이터베이스 및 블록을 전수 조사하는 중입니다...'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">1단계: 노션 전수 검색</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">2단계: 블록 본문 텍스트 추출</span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-medium text-neutral-700 dark:text-neutral-300">3단계: Gemini 팩트 요약</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Answer Result Box */}
      {currentAnswer && !isLoading && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border shadow-sm space-y-4">
            {/* Question Title & Meta */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  질문 내역
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                  <span>Q. {currentAnswer.question}</span>
                </h3>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  currentAnswer.confidence === 'high' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  신뢰도 {currentAnswer.confidence === 'high' ? '높음' : '보통'}
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>방금 전</span>
                </span>
              </div>
            </div>

            {/* Answer Content */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>사서의 팩트 요약 브리핑:</span>
              </div>
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800/80 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">
                {currentAnswer.answer}
              </div>
            </div>

            {/* Source Documents Reference Cards */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>참조된 노션 원본 문서 ({currentAnswer.sources.length}건):</span>
                </div>
              </div>

              {currentAnswer.sources.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">참조된 외부 문서가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentAnswer.sources.map((src) => (
                    <div
                      key={src.id}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{src.icon || '📄'}</span>
                          {src.url ? (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                            >
                              <span>노션에서 열기</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-neutral-400">로컬 스니펫</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                          {src.title}
                        </h4>
                        {src.snippet && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                            {src.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 1 && (
        <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-notion-dark-border">
          <h4 className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>이전 질문 기록 ({history.length - 1}건)</span>
          </h4>
          <div className="space-y-2">
            {history.slice(1).map((item, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentAnswer(item)}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
                    <Database className="w-3 h-3 text-indigo-500" />
                    <span>Q. {item.question}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1">
                    {item.answer.replace(/[\n\r]+/g, ' ')}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
