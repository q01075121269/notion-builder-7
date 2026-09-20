// src/components/common/OmniChatBar.tsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  중앙 통합 옴니 챗바 (Omni Chat Bar)
//  - 화면 하단 중앙 플로팅 고정 배치
//  - 텍스트 입력 + 인라인 Web Speech API STT (탭 이동 버그 없음)
//  - /api/orchestrator 전송 → 실행 영수증(Action Receipt) 카드 노출
//  - 빌더/라이프/개발랩/에러 진단 결과 시각 피드백
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, X, Loader2, ChevronDown } from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  sendToOrchestrator,
  speakKoreanText,
  stopSpeech,
} from "../../services/orchestratorService";
import type { OrchestratorResponse } from "../../services/orchestratorService";
import { cleanDuplicateSpeech } from "../../services/quickCaptureLocalParser";

import { PRESET_TEMPLATES } from "../../services/presetTemplates";
import { saveArchivedTemplate } from "../../services/archiveStorage";

// ─────────────────────────────────────────────────────────────────────────────
// 실행 영수증 타입 (Action Receipt)
// ─────────────────────────────────────────────────────────────────────────────

interface ActionReceipt {
  id: string;
  intent: OrchestratorResponse["intent"];
  toolCalled: string;
  message: string;
  valueAdd?: string[];
  antigravityPrompt?: string | null;
  payload?: Record<string, any>;
  timestamp: string;
}

const INTENT_META: Record<
  string,
  { icon: string; label: string; color: string; borderColor: string; bgColor: string }
> = {
  BUILDER: {
    icon: "🏗️",
    label: "고품질 템플릿 스키마 캔버스 투영 완료",
    color: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800/60",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  LIFE: {
    icon: "📅",
    label: "라이프 허브 DB 업데이트 완료",
    color: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800/60",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  DEVLAB: {
    icon: "📄",
    label: "AI 오피스 문서 생성 완료",
    color: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800/60",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  ERROR_DIAGNOSIS: {
    icon: "🔍",
    label: "시스템 진단 완료 — 조치 프롬프트 생성됨",
    color: "text-rose-700 dark:text-rose-300",
    borderColor: "border-rose-200 dark:border-rose-800/60",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
  },
  CHAT: {
    icon: "💬",
    label: "AI 비서 응답 완료",
    color: "text-indigo-700 dark:text-indigo-300",
    borderColor: "border-indigo-200 dark:border-indigo-800/60",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export const OmniChatBar: React.FC = () => {
  const { apiKey, authUser, showToast, setCurrentView, setCurrentTemplate } = useApp();

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [receipts, setReceipts] = useState<ActionReceipt[]>([]);
  const [expandedReceipt, setExpandedReceipt] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const speechDispatchedRef = useRef(false);
  const lastSentRef = useRef({ text: "", time: 0 });

  // ───────── STT 초기화 (탭 이동 없이 인라인으로 처리) ─────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "ko-KR";

    recog.onresult = (event: any) => {
      if (speechDispatchedRef.current) return;
      const transcript = (event.results[event.results.length - 1]?.[0]?.transcript || "").trim();
      if (!transcript) return;

      speechDispatchedRef.current = true;
      setIsListening(false);
      try { recog.stop(); } catch {}

      const cleaned = cleanDuplicateSpeech(transcript);
      setText(cleaned);
      // 음성 완료 시 자동 전송
      if (cleaned) {
        setTimeout(() => handleSend(cleaned), 80);
      }
    };

    recog.onerror = () => {
      setIsListening(false);
      speechDispatchedRef.current = false;
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      stopSpeech();
      try { recognitionRef.current?.abort(); } catch {}
    };
  }, []);

  // ───────── 마이크 토글 (탭 전환 없음 — 완전 인라인) ─────────
  const toggleMic = () => {
    if (!recognitionRef.current) {
      showToast("이 브라우저는 음성 인식을 지원하지 않습니다.", "info");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechDispatchedRef.current = false;
      stopSpeech();
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setIsExpanded(true);
      } catch {}
    }
  };

  // ───────── 오케스트레이터 전송 ─────────
  const handleSend = useCallback(
    async (overrideText?: string) => {
      const raw = (overrideText ?? text).trim();
      const cleaned = cleanDuplicateSpeech(raw);
      if (!cleaned || isLoadingRef.current) return;

      const now = Date.now();
      if (lastSentRef.current.text === cleaned && now - lastSentRef.current.time < 3000) return;

      isLoadingRef.current = true;
      lastSentRef.current = { text: cleaned, time: now };
      setText("");
      setIsLoading(true);
      setIsExpanded(true);

      try {
        const res: OrchestratorResponse = await sendToOrchestrator(
          cleaned,
          [],
          apiKey,
          authUser?.email
        );

        const meta = INTENT_META[res.intent] ?? INTENT_META.CHAT;

        const receipt: ActionReceipt = {
          id: `receipt-${Date.now()}`,
          intent: res.intent,
          toolCalled: (res as any).tool_called ?? res.intent.toLowerCase(),
          message: res.reply_message,
          valueAdd: (res as any).value_add ?? undefined,
          antigravityPrompt: (res as any).antigravity_fix_prompt ?? null,
          payload: res.payload ?? undefined,
          timestamp: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setReceipts((prev) => [receipt, ...prev.slice(0, 4)]); // 최근 5개 보관

        // TTS 짧은 응답 낭독
        speakKoreanText(res.reply_message.slice(0, 120));

        // BUILDER 인텐트 시 템플릿 자동 투영 및 캔버스 자동 전환
        if (res.intent === "BUILDER") {
          const targetTemplate = ((res as any).payload?.preset_key && PRESET_TEMPLATES[(res as any).payload.preset_key])
            ? PRESET_TEMPLATES[(res as any).payload.preset_key]
            : (/자격증|수험생|시험|공부|오답노트/.test(cleaned) && PRESET_TEMPLATES.certification_exam)
            ? PRESET_TEMPLATES.certification_exam
            : null;

          if (targetTemplate) {
            setCurrentTemplate(targetTemplate);
            try {
              saveArchivedTemplate({
                id: `created-tpl-${Date.now()}`,
                title: targetTemplate.title,
                description: targetTemplate.description || '',
                icon: targetTemplate.icon || '🎯',
                cover_url: targetTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
                tags: ['#내가만든템플릿', '#커스텀생성', '#AI합격스케줄러'],
                templateData: targetTemplate,
                source: 'created',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            } catch (e) {
              console.warn('Failed to auto-archive created template:', e);
            }
          }
          setTimeout(() => {
            setCurrentView("builder");
            showToast("🎯 [자격증/수험생 올인원 합격 스케줄러] 템플릿이 캔버스에 즉시 투영되고 내 보관함에 저장되었습니다!", "success");
          }, 300);
        }

        // 토스트 피드백
        showToast(`${meta.icon} ${meta.label}`, "success");
      } catch (err) {
        console.error('[OmniChatBar] Error sending message:', err);
        showToast("요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.", "error" as any);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [text, apiKey, authUser, showToast]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = Boolean(text.trim()) && !isLoading;

  // ───────── 영수증 작업실 이동 ─────────
  const navigateFromReceipt = (intent: string) => {
    const map: Record<string, string> = {
      BUILDER: "builder",
      LIFE: "life",
      DEVLAB: "devlab",
    };
    const view = map[intent];
    if (view) setCurrentView(view as any);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 렌더
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-3 pointer-events-none"
      role="complementary"
      aria-label="중앙 통합 옴니 챗바"
    >
      <div className="pointer-events-auto space-y-2">

        {/* ── 실행 영수증 카드 목록 ── */}
        {isExpanded && receipts.length > 0 && (
          <div className="space-y-1.5 animate-fadeIn">
            {receipts.slice(0, 3).map((r) => {
              const meta = INTENT_META[r.intent] ?? INTENT_META.CHAT;
              const isOpen = expandedReceipt === r.id;

              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border ${meta.borderColor} ${meta.bgColor} shadow-sm overflow-hidden transition-all`}
                >
                  {/* 영수증 헤더 */}
                  <div
                    className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer"
                    onClick={() => setExpandedReceipt(isOpen ? null : r.id)}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-base shrink-0">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold ${meta.color} truncate`}>
                          {meta.label}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          {r.message.slice(0, 60)}{r.message.length > 60 ? "…" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-neutral-400">{r.timestamp}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* 영수증 상세 펼침 */}
                  {isOpen && (
                    <div className="px-3.5 pb-3 pt-0 space-y-2 border-t border-neutral-200/60 dark:border-neutral-700/40">
                      {/* 전체 메시지 */}
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap pt-2">
                        {r.message}
                      </p>

                      {/* ── 웹 크롤러 수급 실시간 액션 수신증 카드 (Step 3 요구사항) ─────────── */}
                      {r.payload?.is_crawler_pipeline && (
                        <div className="w-full mt-2 p-3 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 animate-fadeIn shadow-xs">
                          <div className="flex items-center justify-between text-xs font-black text-blue-900 dark:text-blue-300">
                            <span>🌐 웹 크롤링 수급 액션 수신증</span>
                            <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
                              50개 항목 수집
                            </span>
                          </div>
                          <div className="space-y-1">
                            {r.payload.crawler_steps?.map((step: string, sIdx: number) => (
                              <div key={sIdx} className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── 노션 DB 적재 완료 카드 (Step 5 요구사항) ────────────────── */}
                      {r.payload?.is_notion_sync_card && (
                        <div className="w-full mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white space-y-2 animate-fadeIn shadow-md">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span>⚡ 노션 마스터 DB 적재 완결</span>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
                              SYNCED
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-100 font-medium">
                            AI 오피스 라이브 문서 데이터가 노션 통합 허브 DB에 성공적으로 적재되었습니다.
                          </p>
                          {r.payload.notion_url && (
                            <a
                              href={r.payload.notion_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white text-indigo-700 text-[11px] font-extrabold hover:bg-slate-100 transition"
                            >
                              <span>[🔗 노션 페이지 바로가기]</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Value-Add 태그 (BUILDER 전용) */}
                      {r.valueAdd && r.valueAdd.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {r.valueAdd.map((v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            >
                              ✦ {v}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 안티그래비티 수정 프롬프트 (ERROR_DIAGNOSIS 전용) */}
                      {r.antigravityPrompt && (
                        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5">
                          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                            📋 안티그래비티 전용 조치 프롬프트
                          </p>
                          <pre className="text-[10px] text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-32">
                            {r.antigravityPrompt}
                          </pre>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(r.antigravityPrompt!);
                              showToast("📋 조치 프롬프트가 클립보드에 복사되었습니다.", "success");
                            }}
                            className="mt-1.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            복사하기
                          </button>
                        </div>
                      )}

                      {/* 작업실 이동 버튼 */}
                      {(r.intent === "BUILDER" || r.intent === "LIFE" || r.intent === "DEVLAB") && (
                        <button
                          onClick={() => navigateFromReceipt(r.intent)}
                          className="w-full py-1.5 rounded-xl text-[11px] font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 active:scale-95 transition"
                        >
                          {r.intent === "BUILDER"
                            ? "🏗️ 노션 빌더 작업실로 이동"
                            : r.intent === "LIFE"
                            ? "🌿 라이프 허브로 이동"
                            : "📄 오피스 스튜디오로 이동"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 닫기 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center space-x-1 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
              >
                <ChevronDown className="w-3 h-3 rotate-180" />
                <span>영수증 접기</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 메인 입력 바 ── */}
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/80 rounded-2xl shadow-sm px-3 py-2">

          {/* 상태 인디케이터 (대기 중: 녹색 닷 ●, 작업 중: 오렌지 스피너 + "요청 처리 중..." 뱃지) */}
          {isLoading ? (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">요청 처리 중...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-1 shrink-0" title="대기 중">
              <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            </div>
          )}

          {/* 마이크 버튼 (인라인 STT — 탭 전환 없음) */}
          <button
            type="button"
            id="omni-mic-btn"
            onClick={toggleMic}
            disabled={isLoading}
            title={isListening ? "음성 인식 중... 클릭하여 중지" : "음성 입력 (한국어)"}
            className={`w-9 h-9 min-w-[36px] flex items-center justify-center rounded-xl transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening
                ? "bg-rose-500 text-white animate-pulse ring-2 ring-rose-300 dark:ring-rose-700"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500"
            }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* 텍스트 입력창 */}
          <input
            ref={inputRef}
            id="omni-chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder={
              isLoading
                ? "🧠 Gemini가 요청을 분석하고 화면을 업데이트하고 있습니다..."
                : isListening
                ? "🎙️ 지금 말씀하세요..."
                : "비서에게 말하거나 타이핑하세요 (일정, 지출, 템플릿, 에러 등)"
            }
            disabled={isLoading}
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {/* 입력 지우기 버튼 */}
          {text && !isLoading && (
            <button
              type="button"
              onClick={() => setText("")}
              className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 전송 버튼 */}
          <button
            type="button"
            id="omni-send-btn"
            onClick={() => handleSend()}
            disabled={!canSend}
            className={`w-9 h-9 min-w-[36px] flex items-center justify-center rounded-xl transition shrink-0 ${
              canSend
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 active:scale-95"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
            }`}
            title="전송"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 듣는 중 상태 표시 */}
        {isListening && (
          <div className="flex items-center justify-center space-x-1.5 py-1 animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-bounce delay-150" />
            <span className="text-[10px] text-rose-500 font-medium">한국어 음성 인식 중...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OmniChatBar;