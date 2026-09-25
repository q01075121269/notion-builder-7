// src/components/media/NoaMediaDock.tsx
// 만능 Noa Command Dock (하단 조종석: Linear / Gemini NotebookLM 스타일)

import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Mic, 
  MicOff, 
  Send, 
  FastForward, 
  Sparkles, 
  X,
  FileText
} from 'lucide-react';

interface AttachedFile {
  name: string;
  url: string;
  type: string;
}

interface NoaMediaDockProps {
  chips: string[];
  onSelectChip: (chipText: string) => void;
  onSubmit: (prompt: string, attachedFile?: AttachedFile) => void;
  isProcessing: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
  placeholder?: string;
}

export const NoaMediaDock: React.FC<NoaMediaDockProps> = ({
  chips,
  onSelectChip,
  onSubmit,
  isProcessing,
  canSkip = false,
  onSkip,
  placeholder = '원하시는 미디어를 말씀하시거나 파일을 올려주세요...'
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // 음성 인식 (Web Speech API 연동 시뮬레이션 및 실제 지원)
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleMic = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
        fallbackSimulationMic();
      }
    } else {
      fallbackSimulationMic();
    }
  };

  const fallbackSimulationMic = () => {
    setIsRecording(true);
    setTimeout(() => {
      setInputVal((prev) => (prev ? `${prev} 시네마틱 4K 숏폼 연출` : '시네마틱 4K 숏폼 연출'));
      setIsRecording(false);
    }, 1800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setAttachedFile({
      name: file.name,
      url: objectUrl,
      type: file.type
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    if (attachedFile?.url) {
      URL.revokeObjectURL(attachedFile.url);
    }
    setAttachedFile(null);
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed && !attachedFile) return;
    if (isProcessing) return;

    onSubmit(trimmed, attachedFile || undefined);
    setInputVal('');
    setAttachedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 sm:pb-6 relative z-30">
      <div className="flex flex-col space-y-2">
        {/* 상단 라인: 노아의 동적 추천 칩 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {canSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer shrink-0 border border-zinc-300/80 dark:border-zinc-700/80 shadow-2xs"
            >
              <FastForward className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span>이 단계 건너뛰기</span>
            </button>
          )}

          {chips.map((chip, idx) => (
            <button
              key={`${chip}-${idx}`}
              type="button"
              onClick={() => onSelectChip(chip)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0 border border-slate-200 dark:border-zinc-800 shadow-2xs backdrop-blur-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* 첨부 파일 칩 (첨부 시 표시) */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 w-fit text-xs text-zinc-700 dark:text-zinc-300 animate-fadeIn">
            <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
            <span className="max-w-[220px] truncate">{attachedFile.name}</span>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="p-0.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* 메인 인풋 바 (Linear / Gemini NotebookLM 스타일) */}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 shadow-lg backdrop-blur-md transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-600/20"
        >
          {/* 숨겨진 파일 인풋 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 좌측: 파일/미디어 첨부 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
            title="미디어/참조 파일 첨부"
            aria-label="파일 첨부"
          >
            <Paperclip className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
          </button>

          {/* 중앙: 반응형 인풋창 */}
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 py-1"
          />

          {/* 우측 도구: 음성 마이크 및 전송 버튼 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
              title={isRecording ? '음성 녹음 중지' : '음성으로 지시하기'}
              aria-label="음성 마이크"
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Mic className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="submit"
              disabled={isProcessing || (!inputVal.trim() && !attachedFile)}
              className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                inputVal.trim() || attachedFile
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs hover:opacity-90 active:scale-95'
                  : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
              }`}
              title="전송"
              aria-label="전송"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
