// src/components/life/QuickCaptureThingsCard.tsx
// Things 3 스타일 1초 퀵 인박스 카드 (동적 사용자 입력 상태 양방향 바인딩, 실시간 큐 unshift, 하드코딩 완전 배제)

import React, { useState } from 'react';
import { 
  Zap, 
  Clipboard, 
  Mic, 
  Paperclip, 
  ArrowUpRight, 
  Sparkles, 
  Check, 
  Loader2,
  Clock
} from 'lucide-react';
import type { ResourceType } from '../../types/lifeHub';
import { 
  triageQuickCaptureLocally, 
  triageQuickCaptureWithAI,
  type TriageResult 
} from '../../services/lifeHubAutoTriageRouter';

interface RecentCaptureItem {
  id: string;
  text: string;
  hint: string;
  timestamp: string;
}

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

export const QuickCaptureThingsCard: React.FC<QuickCaptureThingsCardProps> = ({ 
  onCapture,
  onTriageCapture,
  apiKey
}) => {
  // ① 사용자 입력 양방향 바인딩 상태 (Zero-Hardcoding)
  const [inboxInput, setInboxInput] = useState<string>('');
  const [recentCaptures, setRecentCaptures] = useState<RecentCaptureItem[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);

  // ② 실제 사용자 텍스트 동적 분류 및 큐 unshift
  const processTriage = async (textToProcess: string) => {
    const trimmed = textToProcess.trim();
    if (!trimmed) return;

    // 1. 낙관적 업데이트 (Optimistic Instant Update): 실제 사용자 입력 텍스트로 로컬 Fast-Path 분기
    const localResult = triageQuickCaptureLocally(trimmed);
    
    // 최근 캡처 큐 최상단에 실제 입력된 텍스트 unshift
    const nowTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const newCaptureItem: RecentCaptureItem = {
      id: `cap-${Date.now()}`,
      text: trimmed,
      hint: `${localResult.destination.toUpperCase()} 분류`,
      timestamp: nowTime
    };

    setRecentCaptures(prev => [newCaptureItem, ...prev.filter(item => item.text !== trimmed).slice(0, 3)]);

    // 상위 컴포넌트로 전달하여 4대 마스터 DB 및 Top 3 맨 앞에 unshift
    if (onTriageCapture) {
      onTriageCapture(localResult);
    } else if (onCapture) {
      onCapture({
        title: localResult.itemTitle,
        type: localResult.resourceData?.type || '빠른메모',
        summary: localResult.explanation,
        sourceUrl: localResult.resourceData?.sourceUrl
      });
    }

    // 입력창 즉시 빈 문자열로 초기화
    setInboxInput('');

    // 2. 비동기 AI 백그라운드 정밀 분석
    if (apiKey) {
      setIsTriaging(true);
      try {
        const aiResult = await triageQuickCaptureWithAI(trimmed, apiKey);
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
    processTriage(inboxInput);
  };

  // 클립보드 붙여넣기 핸들러
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setInboxInput(text.trim());
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 1500);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // 음성 녹음 핸들러 (실제 Web Speech API 연동 - 하드코딩 더미 텍스트 배제)
  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
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
              setInboxInput(speechText);
            }
            setIsRecording(false);
          };

          recognition.onerror = () => {
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognition.start();
        } catch {
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

  // 첨부 파일 또는 빠른 URL 핸들러
  const handleAttachFile = () => {
    const entered = window.prompt('수집할 웹 URL 링크나 문서 제목을 입력하세요:');
    if (entered && entered.trim()) {
      setInboxInput(entered.trim());
    }
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

      {/* 인풋 영역 (양방향 바인딩 inboxInput) */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            id="quick-inbox-input"
            rows={1}
            value={inboxInput}
            onChange={(e) => setInboxInput(e.target.value)}
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
              title="URL/자료 직접 입력"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <Paperclip className="w-3 h-3" />
              <span>자료첨부</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!inboxInput.trim()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-xs cursor-pointer"
          >
            <span>인박스 캡처</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* 최근 캡처 큐: 사용자가 실제로 캡처한 항목들이 실시간으로 unshift되어 렌더링됨 */}
      <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-blue-500" />
            <span>최근 캡처 큐 (실시간 동적 반영)</span>
          </span>
          <span>{recentCaptures.length}건</span>
        </div>

        {recentCaptures.length > 0 ? (
          <div className="space-y-1">
            {recentCaptures.map((item) => (
              <div
                key={item.id}
                onClick={() => processTriage(item.text)}
                className="group flex items-center justify-between p-1.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-zinc-100 dark:border-zinc-800/60 transition cursor-pointer text-[11px]"
                title="클릭하여 재분류 실행"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <Clock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
                    {item.text}
                  </span>
                </div>
                <div className="flex items-center space-x-1 shrink-0 ml-1">
                  <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500">
                    {item.timestamp}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    재분류
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-[10px] text-zinc-400">
              💡 입력창에 할일이나 지출을 적고 엔터를 치면 실시간으로 큐에 쌓입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
