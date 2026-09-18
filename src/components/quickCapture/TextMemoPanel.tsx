import React, { useState } from 'react';
import { Sparkles, Send, Edit3, Lightbulb } from 'lucide-react';

interface TextMemoPanelProps {
  onSendMemo: (memo: string) => void;
  isProcessing: boolean;
}

const SAMPLE_MEMOS = [
  '내일 15시 거래처 미팅 잡고, 이동 택시비 18,500원 결제',
  '이번 주말까지 2학기 수강신청 확인 및 전공 교재 구매하기 (예산 65,000원)',
  '새로운 프로젝트 아이디어: 노션과 텔레그램 연동 봇 개발하기 #아이디어 #개발',
  '김철수 수석 / 에이아이랩 / 010-9876-5432 / cskim@ailab.io'
];

export const TextMemoPanel: React.FC<TextMemoPanelProps> = ({
  onSendMemo,
  isProcessing
}) => {
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memo.trim() || isProcessing) return;
    onSendMemo(memo.trim());
    setMemo('');
  };

  const handleSelectSample = (sample: string) => {
    setMemo(sample);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center p-4 space-y-5">
      <div className="w-full max-w-lg space-y-3">
        {/* Text Area */}
        <div className="relative rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 transition overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/80">
            <span className="flex items-center space-x-1 font-semibold text-neutral-500 dark:text-neutral-400">
              <Edit3 className="w-3.5 h-3.5" />
              <span>자연어 퀵 메모 입력</span>
            </span>
            <span>{memo.length}자</span>
          </div>

          <textarea
            rows={4}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="두서없이 편하게 적어보세요. (예: '내일 오후 3시 치과 가고, 점심 식비 12,000원 썼어')"
            className="w-full p-4 text-xs sm:text-sm bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none resize-none leading-relaxed"
          />

          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 hidden sm:inline">
              Enter 또는 [전송] 클릭 시 AI가 맞춤법을 교정하고 다중 작업으로 분할합니다.
            </span>
            <button
              type="submit"
              disabled={!memo.trim() || isProcessing}
              className="ml-auto flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'AI 자동 교정 & 전송 중...' : '즉시 다듬어 노션 전송'}</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Sample Chips */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-neutral-400">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>터치하여 바로 입력할 수 있는 실무 예시:</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_MEMOS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="text-left text-[11px] p-2 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 border border-neutral-200/50 dark:border-neutral-700/50 transition truncate"
              >
                ✏️ {sample}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};
