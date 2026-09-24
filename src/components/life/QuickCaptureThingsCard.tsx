// src/components/life/QuickCaptureThingsCard.tsx
// Things 3 스타일 1초 퀵 인박스 카드 (노아 AI 멀티모달 자동 분류, 클립보드, 음성, 낙관적 업데이트)

import React, { useState } from 'react';
import { 
  Zap, 
  Clipboard, 
  Mic, 
  Paperclip, 
  ArrowUpRight, 
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import type { ResourceType } from '../../types/lifeHub';
import { 
  triageQuickCaptureLocally, 
  triageQuickCaptureWithAI,
  type TriageResult 
} from '../../services/lifeHubAutoTriageRouter';

interface QuickCaptureThingsCardProps {
  onCapture?: (item: {
    title: string;
    type: ResourceType;
    summary: string;
    sourceUrl?: string;
  }) => void;
  onTriageCapture?: (result: TriageResult) => void;
  apiKey?: string;
}

const SEED_INBOX_CHIPS = [
  { text: '🎙️ 내일 2시 세무사 미팅 서류 준비 [과제]', hint: 'Tasks로 자동 분류' },
  { text: '🍜 점심 12,000원 김치찌개 식사 [지출]', hint: 'Life Log로 자동 분류' },
  { text: '💡 2026 AI 에이전트 프롬프트 팁 [지식]', hint: 'Resources로 자동 분류' }
];

export const QuickCaptureThingsCard: React.FC<QuickCaptureThingsCardProps> = ({ 
  onCapture,
  onTriageCapture,
  apiKey
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);

  // 통합 자동 분류 처리기 (낙관적 업데이트)
  const processTriage = async (textToProcess: string) => {
    const trimmed = textToProcess.trim();
    if (!trimmed) return;

    // 1. 낙관적 업데이트 (Optimistic Instant Update): 로컬 지능형 Fast-Path
    const localResult = triageQuickCaptureLocally(trimmed);
    
    if (onTriageCapture) {
      onTriageCapture(localResult);
    } else if (onCapture) {
      // 레거시 호환
      onCapture({
        title: localResult.itemTitle,
        type: localResult.resourceData?.type || '빠른메모',
        summary: localResult.explanation,
        sourceUrl: localResult.resourceData?.sourceUrl
      });
    }

    setInputText('');

    // 2. 비동기 AI 정밀 분류 (API 키 존재 시 백그라운드 고도화)
    if (apiKey) {
      setIsTriaging(true);
      try {
        const aiResult = await triageQuickCaptureWithAI(trimmed, apiKey);
        // AI 판정 결과가 로컬 결과와 다르거나 더 정밀한 경우 추가 콜백
        if (aiResult.destination !== localResult.destination && onTriageCapture) {
          onTriageCapture(aiResult);
        }
      } catch (err) {
        console.warn('[QuickCapture] AI refinement skipped:', err);
      } finally {
        setIsTriaging(false);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    processTriage(inputText);
  };

  // 클립보드 붙여넣기 핸들러
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setInputText(text);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 1500);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // 음성 녹음 핸들러 (Web Speech API 또는 폴백 샘플)
  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      // 브라우저 Web Speech API 지원 확인
      const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition || 
                                (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'ko-KR';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            const speechText = event.results[0][0].transcript;
            if (speechText) {
              setInputText(speechText);
            }
            setIsRecording(false);
          };

          recognition.onerror = () => {
            // 마이크 에러 시 지능형 샘플 텍스트 폴백
            setInputText('내일 2시 세무사 미팅 서류 준비');
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognition.start();
        } catch {
          setTimeout(() => {
            setIsRecording(false);
            setInputText('내일 2시 세무사 미팅 서류 준비');
          }, 1200);
        }
      } else {
        // Speech API 미지원 브라우저 폴백
        setTimeout(() => {
          setIsRecording(false);
          setInputText('내일 2시 세무사 미팅 서류 준비');
        }, 1200);
      }
    } else {
      setIsRecording(false);
    }
  };

  // 첨부 파일 핸들러 (모의)
  const handleAttachFile = () => {
    setInputText('https://notion.so/formulas-v2-guide 노션 공식 수식 문서 스크랩');
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-white/20">
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Zap className="w-3.5 h-3.5 fill-blue-500" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            1초 퀵 인박스 (Quick Inbox)
          </h3>
        </div>

        {isTriaging && (
          <span className="flex items-center space-x-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span>노아 AI 정밀 분류 중</span>
          </span>
        )}
      </div>

      {/* 인풋 영역 */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            id="quick-inbox-input"
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="할일, 지출, 북마크, 프로젝트를 1초 만에 털어놓으세요 (AI 자동분류)"
            className="w-full resize-none rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500/30 font-medium leading-relaxed"
          />
        </div>

        {/* 퀵 액션 툴바 */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePasteClipboard}
              title="클립보드 내용 붙여넣기 (Ctrl+V)"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              {copiedSuccess ? <Check className="w-3 h-3 text-emerald-500" /> : <Clipboard className="w-3 h-3" />}
              <span>붙여넣기</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoice}
              title="음성 메모 녹음"
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                isRecording
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Mic className={`w-3 h-3 ${isRecording ? 'text-rose-500' : ''}`} />
              <span>{isRecording ? '듣는 중...' : '음성'}</span>
            </button>

            <button
              type="button"
              onClick={handleAttachFile}
              title="URL/자료 자동 첨부 샘플"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <Paperclip className="w-3 h-3" />
              <span>첨부</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-xs cursor-pointer"
          >
            <span>인박스 캡처</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* 시드 인박스 칩 목록 (최대 2건으로 압축) */}
      <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-blue-500" />
            <span>최근 캡처 큐</span>
          </span>
          <span>{SEED_INBOX_CHIPS.slice(0, 2).length}건</span>
        </div>

        <div className="space-y-1">
          {SEED_INBOX_CHIPS.slice(0, 2).map((chip, idx) => (
            <div
              key={idx}
              onClick={() => {
                processTriage(chip.text.replace(/^[🎙️🍜💡]\s*/, ''));
              }}
              className="group flex items-center justify-between p-1.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-zinc-100 dark:border-zinc-800/60 transition cursor-pointer text-[11px]"
              title={chip.hint}
            >
              <span className="text-zinc-700 dark:text-zinc-300 truncate font-medium">
                {chip.text}
              </span>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0 ml-1">
                +분류
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
