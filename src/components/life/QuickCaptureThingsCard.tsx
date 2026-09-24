// src/components/life/QuickCaptureThingsCard.tsx
// Things 3 스타일 1초 퀵 인박스 카드 (클립보드 붙여넣기, 음성, 첨부, AI 자동분류)

import React, { useState } from 'react';
import { 
  Zap, 
  Clipboard, 
  Mic, 
  Paperclip, 
  ArrowUpRight, 
  Sparkles,
  Check
} from 'lucide-react';
import type { ResourceType } from '../../types/lifeHub';

interface QuickCaptureThingsCardProps {
  onCapture: (item: {
    title: string;
    type: ResourceType;
    summary: string;
    sourceUrl?: string;
  }) => void;
}

const SEED_INBOX_CHIPS = [
  { text: '🎙️ 세무 상담 서류 인박스 정리 [미분류]', type: '문서' as ResourceType, summary: '종합소득세 및 법인 증빙 PDF 영수증 취합' },
  { text: '📎 Q3 성과 지표 엑셀 원본 [미분류]', type: '문서' as ResourceType, summary: 'Vercel 서버리스 지연시간 및 전환율 원시 데이터' },
  { text: '💡 2026 AI 에이전트 프롬프트 팁 [지식]', type: '빠른메모' as ResourceType, summary: 'Fail-Fast 가드레일 및 JSON 스키마 강제 기법' }
];

export const QuickCaptureThingsCard: React.FC<QuickCaptureThingsCardProps> = ({ onCapture }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // AI 자동 분류 감지 (영수증 / 문서 / 북마크 / 빠른메모)
    let detectedType: ResourceType = '빠른메모';
    const lower = inputText.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      detectedType = '북마크';
    } else if (lower.includes('원') || lower.includes('영수증') || lower.includes('결제')) {
      detectedType = '영수증';
    } else if (lower.includes('문서') || lower.includes('pdf') || lower.includes('기안')) {
      detectedType = '문서';
    }

    onCapture({
      title: inputText.trim(),
      type: detectedType,
      summary: `1초 퀵 인박스 캡처 (${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})`,
      sourceUrl: detectedType === '북마크' ? inputText.trim() : undefined
    });

    setInputText('');
  };

  // 클립보드 붙여넣기 핸들러
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 1500);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // 모의 음성 녹음 핸들러
  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInputText('🎙️ 내일 오후 3시 팀 런칭 회의 준비 서류 취합');
      }, 1800);
    } else {
      setIsRecording(false);
    }
  };

  // 첨부 파일 핸들러 (모의)
  const handleAttachFile = () => {
    setInputText('📎 Q3_Release_Specification.pdf (자동 첨부)');
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-white/20">
      {/* 헤더 */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Zap className="w-3.5 h-3.5 fill-blue-500" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            1초 퀵 인박스 (Quick Inbox)
          </h3>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          Things 3 Style
        </span>
      </div>

      {/* 인풋 영역 */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative">
          <textarea
            id="quick-inbox-input"
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="떠오르는 생각, 영수증, 할 일을 1초 만에 털어놓으세요 (AI 자동분류)"
            className="w-full resize-none rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500/30 font-medium"
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
              title="파일/영수증 첨부"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              <Paperclip className="w-3 h-3" />
              <span>첨부</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-xs cursor-pointer"
          >
            <span>인박스 캡처</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* 시드 인박스 칩 목록 */}
      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-blue-500" />
            <span>최근 캡처 인박스 큐</span>
          </span>
          <span>{SEED_INBOX_CHIPS.length}건 대기</span>
        </div>

        <div className="space-y-1">
          {SEED_INBOX_CHIPS.map((chip, idx) => (
            <div
              key={idx}
              onClick={() => {
                onCapture({
                  title: chip.text.replace(/^[🎙️📎💡]\s*/, ''),
                  type: chip.type,
                  summary: chip.summary
                });
              }}
              className="group flex items-center justify-between p-1.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/40 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-zinc-100 dark:border-zinc-800/60 transition cursor-pointer text-[11px]"
              title="클릭하여 즉시 보관 처리"
            >
              <span className="text-zinc-700 dark:text-zinc-300 truncate font-medium">
                {chip.text}
              </span>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 dark:text-blue-400 font-bold shrink-0 ml-1">
                +보관
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
