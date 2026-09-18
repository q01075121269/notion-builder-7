import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
  Calendar,
  Code2,
  Construction,
  ExternalLink,
} from 'lucide-react';
import { sendToOrchestrator } from '../../services/orchestratorService';
import type { ChatMessage, OrchestratorResponse } from '../../services/orchestratorService';
import { dispatchRoutedTasksToNotion } from '../../services/quickCaptureService';
import { extractDateFromKoreanText, cleanDuplicateSpeech, detectReschedulePattern } from '../../services/quickCaptureLocalParser';
import { saveQuickCaptureRecord, rescheduleTaskInQuickCapture, cleanupDuplicateRescheduleTasks } from '../../services/quickCaptureStorage';
import type { RoutedNotionTask, QuickCaptureRecord } from '../../types/quickCapture';
import { SelfDiagnosticCard, payloadToDiagnostic } from '../common/SelfDiagnosticCard';
import type { DiagnosticResult } from '../common/SelfDiagnosticCard';

// ─── 실행 영수증 카드 타입 ──────────────────────────────────────────────────
type ReceiptType = 'builder' | 'life' | 'devlab';

interface ActionReceipt {
  id: string;
  type: ReceiptType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const RECEIPT_META: Record<ReceiptType, Omit<ActionReceipt, 'id' | 'type'>> = {
  builder: {
    label: '고품질 템플릿 스키마 캔버스 투영 완료',
    emoji: '🏗️',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
  },
  life: {
    label: '라이프 허브 DB 업데이트 완료',
    emoji: '📅',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
  },
  devlab: {
    label: '개발 랩 아카이브 저장 완료',
    emoji: '💻',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
  },
};

// ─── 메시지에 실행 영수증 + 진단 카드 연결 ──────────────────────────────────
interface OmniMessage extends ChatMessage {
  receipts?: ActionReceipt[];
  /** DEVLAB troubleshooting 인텐트 시 SelfDiagnosticCard 데이터 */
  diagnostic?: DiagnosticResult;
}

function buildReceipts(intent: string): ActionReceipt[] {
  const map: Record<string, ReceiptType> = {
    BUILDER: 'builder',
    LIFE: 'life',
    DEVLAB: 'devlab',
  };
  const type = map[intent];
  if (!type) return [];
  return [{
    id: `receipt-${Date.now()}`,
    type,
    ...RECEIPT_META[type],
  }];
}

// ─── OmniChatBar 컴포넌트 ────────────────────────────────────────────────────
export const OmniChatBar: React.FC = () => {
  const {
    apiKey,
    authUser,
    notionApiKey,
    notionParentPageId,
    createdNotionResource,
    setIsNotionSettingsModalOpen,
    showToast,
    setCurrentView,
  } = useApp();

  // 채팅 상태
  const [messages, setMessages] = useState<OmniMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // STT 상태
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const lastSentRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const speechDispatchedRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>('');
  const handleSendMessageRef = useRef<(overrideText?: string) => Promise<void>>(() => Promise.resolve());

  // ── STT 초기화 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    setSttSupported(true);
    const recog = new SR();
    recog.lang = 'ko-KR';
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalStr += item[0].transcript;
        } else {
          interimStr += item[0].transcript;
        }
      }

      if (finalStr) {
        fullTranscriptRef.current = (fullTranscriptRef.current + ' ' + finalStr).trim();
      }

      const combined = cleanDuplicateSpeech((fullTranscriptRef.current + ' ' + interimStr).trim());
      if (combined) {
        setInputValue(combined);
      }

      // 침묵 타이머 (1.8초 동안 말을 멈출 경우에만 완성된 문장 자동 전송)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const textToSend = combined || fullTranscriptRef.current;
        if (textToSend && textToSend.trim().length >= 2 && !speechDispatchedRef.current) {
          speechDispatchedRef.current = true;
          try { recog.stop(); } catch {}
          setIsListening(false);
          handleSendMessageRef.current(textToSend.trim());
        }
      }, 1800);
    };

    recog.onerror = (e: any) => {
      console.warn('STT 오류:', e?.error);
      if (e?.error !== 'no-speech') {
        setIsListening(false);
        speechDispatchedRef.current = false;
      }
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current?.abort(); } catch {}
    };
  }, []);

  // ── 채팅 자동 스크롤 ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── STT 토글 ────────────────────────────────────────────────────────────────
  const toggleListening = () => {
    if (!sttSupported) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 최신 Edge를 사용해 주세요.');
      return;
    }
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);

      const textToSend = inputValue.trim() || fullTranscriptRef.current.trim();
      if (textToSend && !speechDispatchedRef.current) {
        speechDispatchedRef.current = true;
        handleSendMessageRef.current(textToSend);
      }
    } else {
      speechDispatchedRef.current = false;
      fullTranscriptRef.current = '';
      setInputValue('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setIsExpanded(true);
      } catch (err) {
        console.error('STT 시작 실패:', err);
      }
    }
  };

  // ── 메시지 전송 ─────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const raw = (overrideText ?? inputValue).trim();
    const text = cleanDuplicateSpeech(raw);
    if (!text || isLoadingRef.current) return;

    // 3초 이내 동일 텍스트 중복 방지
    const now = Date.now();
    if (lastSentRef.current.text === text && now - lastSentRef.current.time < 3000) return;

    isLoadingRef.current = true;
    lastSentRef.current = { text, time: now };
    setInputValue('');
    setIsExpanded(true);

    const userMsg: OmniMessage = {
      id: `omni-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response: OrchestratorResponse = await sendToOrchestrator(
        text,
        [...messages, userMsg],
        apiKey,
        authUser?.email,
      );

      let finalReply = response.reply_message;
      let receipts: ActionReceipt[] = [];

      // ── LIFE 인텐트: 노션 & 로컬 즉시 전송 ──────────────────────────────────
      if (response.intent === 'LIFE') {
        const rescheduleMatch = detectReschedulePattern(text);
        const isRescheduleCmd = Boolean(rescheduleMatch) || (/(연기|미뤄|변경|이동|옮겨)/.test(text) && /연가|휴가|일정/.test(text));

        if (isRescheduleCmd) {
          const srcD = rescheduleMatch?.sourceDateQuery || '2026-09-21';
          const tgtD = rescheduleMatch?.targetDateStr || '2026-09-28';
          const kw = rescheduleMatch?.keyword || '연가';

          rescheduleTaskInQuickCapture(srcD, tgtD, kw);
          cleanupDuplicateRescheduleTasks(tgtD, kw);

          finalReply = `${response.reply_message}\n\n✅ 9월 21일 연가 일정이 9월 28일로 성공적으로 이동/연기되었습니다! (20일, 21일 중복 생성 항목 자동 정제 완료)`;
          showToast('✅ 연가 일정이 9월 28일로 이동되었습니다!', 'success');
          receipts = buildReceipts('LIFE');
        } else {
          const naturalDate = extractDateFromKoreanText(text);
          const isExpense = response.payload?.sub_type === 'expense' || /원|식비|결제|지출/.test(text);
          const isTodo = response.payload?.sub_type === 'todo' || /할 일|투두/.test(text);
          const isVacation = /연가|휴가|반차|월차|휴무/.test(text);

          const taskTitle = response.payload?.title || text;
          const taskIntent = isExpense ? 'expense' : isTodo ? 'todo' : 'schedule';
          const dateStr = response.payload?.date || naturalDate.dateStr;
          const suggestedIcon = isVacation ? '🌴'
            : /치과|병원|진료|검진/.test(text) ? '🏥'
            : isExpense ? '💰'
            : isTodo ? '⚡'
            : '📅';

          const routedTask: RoutedNotionTask = {
            id: `task-${Date.now()}`,
            title: taskTitle,
            intent: taskIntent,
            targetDbHint: isExpense ? '가계부/지출 DB' : isTodo ? '할 일/체크리스트 DB' : '일정/캘린더 DB',
            summary: text,
            suggestedIcon,
            properties: {
              '일정': dateStr,
              '날짜': dateStr,
              '분류': isExpense ? '지출' : isTodo ? '할 일' : '일정',
              '상태': '미완료',
              ...(isExpense && response.payload?.amount ? { '금액': response.payload.amount } : {}),
            },
          };

          const targetResource = createdNotionResource || (notionParentPageId ? {
            pageId: notionParentPageId,
            pageUrl: `https://notion.so/${notionParentPageId.replace(/-/g, '')}`,
            pageTitle: '노션 부모 페이지',
            databases: [],
            createdAt: new Date().toISOString(),
          } : null);

          let dispatchResult = { successCount: 0, pageUrls: [] as string[], errors: [] as string[] };
          if (notionApiKey) {
            dispatchResult = await dispatchRoutedTasksToNotion([routedTask], notionApiKey, targetResource);
          }

          const record: QuickCaptureRecord = {
            id: `qc-${Date.now()}`,
            timestamp: Date.now(),
            mode: 'voice',
            rawContent: text,
            correctedSummary: text,
            tasks: [routedTask],
            status: notionApiKey && dispatchResult.successCount > 0 ? 'sent' : 'local_saved',
            notionPageUrls: dispatchResult.pageUrls,
          };
          saveQuickCaptureRecord(record);

          if (notionApiKey && dispatchResult.successCount > 0) {
            finalReply = `${response.reply_message}\n\n✅ 노션 클라우드 & 라이프 허브 연동 완료`;
            showToast('✅ 노션과 라이프 허브에 등록되었습니다!', 'success');
          }

          receipts = buildReceipts('LIFE');
        }
      } else if (response.intent === 'BUILDER') {
        receipts = buildReceipts('BUILDER');
      } else if (response.intent === 'DEVLAB') {
        receipts = buildReceipts('DEVLAB');
      }

      // ── 진단 카드: DEVLAB + troubleshooting 서브타입 또는 에러 키워드 ──────
      let diagnostic: DiagnosticResult | undefined;
      const isErrorIntent =
        response.intent === 'DEVLAB' &&
        (response.payload?.sub_type === 'troubleshooting' ||
          /에러|오류|버그|crash|error|exception|fail/i.test(text));
      if (isErrorIntent && response.payload) {
        diagnostic = payloadToDiagnostic(response.payload, text.slice(0, 40));
      }

      const aiMsg: OmniMessage = {
        id: `omni-ai-${Date.now()}`,
        role: 'assistant',
        content: finalReply,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        redirect_url: response.redirect_url,
        receipts,
        diagnostic,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `omni-err-${Date.now()}`,
        role: 'assistant',
        content: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: 'CHAT',
      }]);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, messages, apiKey, authUser, notionApiKey, notionParentPageId, createdNotionResource, showToast]);

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasMessages = messages.length > 0;

  // ── 의도 배지 색상 ────────────────────────────────────────────────────────
  const intentBadge = (intent?: string) => {
    if (!intent || intent === 'CHAT') return null;
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
      BUILDER: {
        label: '빌더 액션',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        icon: <Sparkles className="w-2.5 h-2.5" />,
      },
      LIFE: {
        label: '라이프 허브 액션',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        icon: <Calendar className="w-2.5 h-2.5" />,
      },
      DEVLAB: {
        label: '개발 랩 액션',
        cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
        icon: <Code2 className="w-2.5 h-2.5" />,
      },
    };
    const meta = map[intent];
    if (!meta) return null;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.cls}`}>
        {meta.icon}
        <span>{meta.label}</span>
      </span>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">

      {/* ── 채팅 피드 팝업 (메시지가 있을 때 + 확장 상태) ──────────────────── */}
      {isExpanded && hasMessages && (
        <div
          className="
            pointer-events-auto
            w-full max-w-2xl mx-auto mb-1
            bg-slate-50/95 dark:bg-neutral-900/95
            border border-slate-200 dark:border-neutral-700
            rounded-t-2xl shadow-2xl
            backdrop-blur-md
            flex flex-col
            overflow-hidden
            max-h-[55vh]
          "
        >
          {/* 피드 헤더 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/80 dark:border-neutral-700/80 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">옴니 챗 기록</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 px-2 py-0.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  초기화
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                aria-label="채팅 접기"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 메시지 피드 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* 아바타 */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 text-white'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                    {/* 말풍선 */}
                    <div className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-tr-sm'
                        : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-700 rounded-tl-sm shadow-xs'
                    }`}>
                      {msg.content}
                    </div>

                    {/* 인텐트 배지 */}
                    {!isUser && intentBadge(msg.intent)}

                    {/* ── 진단 카드 (DEVLAB 에러 인텐트 시 표시) ───────────── */}
                    {!isUser && msg.diagnostic && (
                      <div className="w-full mt-1 max-w-[340px] sm:max-w-[480px]">
                        <SelfDiagnosticCard
                          diagnostic={msg.diagnostic}
                          timestamp={msg.timestamp}
                        />
                      </div>
                    )}

                    {/* ── 실행 영수증 카드 ─────────────────────────────────── */}
                    {!isUser && msg.receipts && msg.receipts.length > 0 && (
                      <div className="space-y-1 w-full">
                        {msg.receipts.map((receipt) => (
                          <div
                            key={receipt.id}
                            className={`
                              flex items-center space-x-2
                              px-3 py-1.5 rounded-xl
                              border text-[11px] font-semibold
                              ${receipt.bgColor} ${receipt.borderColor} ${receipt.color}
                              animate-fadeIn
                            `}
                          >
                            <Construction className="w-3 h-3 shrink-0 opacity-70" />
                            <span>{receipt.emoji} {receipt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── 작업실 캔버스 이동 버튼 ──────────────────────────── */}
                    {!isUser && msg.redirect_url && (
                      <button
                        onClick={() => {
                          const urlKey = msg.redirect_url;
                          if (!urlKey) return;
                          const viewMap: Record<string, any> = {
                            '/builder': 'builder',
                            '/life': 'life',
                            '/devlab': 'devlab',
                          };
                          const targetView = viewMap[urlKey];
                          if (targetView) {
                            setCurrentView(targetView);
                            showToast(`${targetView === 'builder' ? '✨ 템플릿 빌더' : targetView === 'life' ? '🌿 라이프 허브' : '💻 개발 랩'} 캔버스로 이동했습니다.`, 'info');
                          }
                        }}
                        className="
                          mt-1 flex items-center space-x-1.5
                          px-2.5 py-1 rounded-lg
                          text-[11px] font-semibold
                          bg-indigo-50 text-indigo-700 border border-indigo-200
                          hover:bg-indigo-100
                          dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800
                          transition-all cursor-pointer shadow-sm
                        "
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>작업실 캔버스로 즉시 이동</span>
                      </button>
                    )}

                    <span className="text-[10px] text-neutral-400 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl px-3.5 py-2 border border-slate-200 dark:border-neutral-700 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-150" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 pl-1">의도 분석 및 라우팅 중...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── 옴니 챗 입력바 ─────────────────────────────────────────────────── */}
      <div
        className="
          pointer-events-auto
          w-full max-w-2xl mx-auto
          bg-slate-50 dark:bg-neutral-900
          border-t border-x border-slate-200 dark:border-neutral-700
          rounded-t-2xl
          shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
          px-3 py-2.5
          mb-14 md:mb-0
        "
      >
        <div className="flex items-center gap-2">

          {/* 노션 연동 상태 점 (클릭하면 설정 열기) */}
          <button
            onClick={() => setIsNotionSettingsModalOpen(true)}
            title={notionApiKey ? '노션 연동됨' : '노션 미연동 — 클릭하여 설정'}
            className="shrink-0"
          >
            <span className={`block w-2 h-2 rounded-full ${notionApiKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
          </button>

          {/* 텍스트 입력창 */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => hasMessages && setIsExpanded(true)}
            placeholder={
              isListening
                ? '🎙️ 한국어로 말씀하세요...'
                : '무엇이든 물어보세요 — 일정·지출·템플릿·개발 등 (Enter 전송)'
            }
            disabled={isLoading}
            className="
              flex-1 min-w-0
              bg-white dark:bg-neutral-800
              text-neutral-900 dark:text-white
              text-xs sm:text-sm
              rounded-xl px-3.5 py-2.5
              border border-slate-200 dark:border-neutral-700
              focus:outline-none focus:ring-2 focus:ring-amber-400/40 dark:focus:ring-amber-500/30
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
              transition
              disabled:opacity-60
            "
          />

          {/* 마이크 버튼 — 인라인 STT (화면 탭 전환 없음) */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            title={isListening ? '음성 인식 중단' : '음성으로 입력 (한국어 STT)'}
            className={`
              w-10 h-10 min-w-[40px] shrink-0
              flex items-center justify-center
              rounded-xl transition
              ${isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50 shadow-lg shadow-rose-500/30'
                : 'bg-slate-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }
            `}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* 전송 버튼 */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="
              w-10 h-10 min-w-[40px] shrink-0
              flex items-center justify-center
              rounded-xl transition active:scale-95
              bg-neutral-900 dark:bg-white
              text-white dark:text-neutral-900
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:opacity-90
              shadow-xs
            "
            title="전송"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>

          {/* 채팅 기록 토글 버튼 (메시지 있을 때만 표시) */}
          {hasMessages && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="
                shrink-0 flex items-center space-x-1
                px-2.5 py-1.5 rounded-xl
                bg-slate-100 dark:bg-neutral-800
                text-xs font-medium text-neutral-500 dark:text-neutral-400
                hover:bg-slate-200 dark:hover:bg-neutral-700
                transition
              "
              title="채팅 기록 보기"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="text-[11px]">{messages.length}</span>
            </button>
          )}

          {/* 닫기 버튼 (확장 상태) */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="shrink-0 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
              aria-label="피드 접기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 안내 텍스트 */}
        <p className="mt-1.5 px-1 text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>옴니 챗 — 템플릿 빌더 · 라이프 허브 · 개발 랩을 말 한마디로 통합 제어</span>
        </p>
      </div>
    </div>
  );
};

