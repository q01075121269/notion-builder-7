// src/components/media/NoaMediaDock.tsx
// 하단 중앙 와이드 플로팅 Noa 독 (Gemini 순정 알약형 바)

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Paperclip, 
  Mic, 
  ArrowUp, 
  X,
  FileText,
  SlidersHorizontal,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface AttachedFile {
  name: string;
  url: string;
  type: string;
}

interface NoaMediaDockProps {
  onSubmit: (prompt: string, attachedFile?: AttachedFile) => void;
  isProcessing: boolean;
  canSkip?: boolean;
  onSkip?: () => void;
  placeholder?: string;
  onToolSelect?: (toolId: string) => void;
  // 호환용 옵셔널 props
  chips?: string[];
  onSelectChip?: (chipText: string) => void;
}

export const NoaMediaDock: React.FC<NoaMediaDockProps> = ({
  onSubmit,
  isProcessing,
  placeholder = '편하게 말씀하시거나 사진/음악을 올려주세요...',
  onToolSelect
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>('');

  // 외부 클릭 시 도구 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 음성 인식 (Web Speech API 무중단 지속 녹음 연동)
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // 사용자가 마이크를 다시 누르기 전까지 끊지 않음
      recognition.interimResults = true; // 말하는 중간 과정도 감지
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinal += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (newFinal) {
          finalTranscriptRef.current = finalTranscriptRef.current 
            ? `${finalTranscriptRef.current} ${newFinal.trim()}`
            : newFinal.trim();
        }

        const combined = [finalTranscriptRef.current, interimTranscript.trim()]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (combined) {
          setInputVal(combined);
        }
      };

      recognition.onend = () => {
        // 사용자가 수동으로 마이크를 끄지 않았다면(isListeningRef.current === true), 
        // 침묵이 발생해도 자동으로 즉시 다시 감청(start)을 유지하도록 루프 형성
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // 이미 실행 중이거나 일시적 오류 시 무시
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' && isListeningRef.current) {
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const handleToggleMic = () => {
    if (isRecording) {
      isListeningRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    isListeningRef.current = true;
    setIsRecording(true);
    finalTranscriptRef.current = inputVal.trim();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start failed, using fallback:', err);
      }
    } else {
      fallbackSimulationMic();
    }
  };

  const fallbackSimulationMic = () => {
    setIsRecording(true);
    setTimeout(() => {
      setInputVal('여섯살짜리 금발머리에 귀여운 여자 아이 를 실사 캐릭터로 만들어 줘');
      setIsRecording(false);
      isListeningRef.current = false;
    }, 1500);
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

    // 전송 시 마이크도 깔끔하게 중지 및 리셋
    isListeningRef.current = false;
    setIsRecording(false);
    finalTranscriptRef.current = '';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }

    onSubmit(trimmed, attachedFile || undefined);
    setInputVal('');
    setAttachedFile(null);
    setIsToolsOpen(false);
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
        
        {/* 첨부 파일 인디케이터 (첨부 시에만 노출) */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 w-fit text-xs text-zinc-700 dark:text-zinc-300 animate-fadeIn ml-2">
            <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
            <span className="max-w-[200px] truncate">{attachedFile.name}</span>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* 메인 순정 알약형 바 (Gemini Pure Pill Style) */}
        <div className="relative" ref={toolsMenuRef}>
          
          {/* [➕ 도구] 팝오버 메뉴 */}
          {isToolsOpen && (
            <div className="absolute bottom-full left-2 mb-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsToolsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
              >
                <Paperclip className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <span>참조 미디어 파일 첨부</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToolSelect?.('ratio');
                  setIsToolsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <span>화면 비율 전환 (16:9 / 9:16 / 1:1)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToolSelect?.('safezone');
                  setIsToolsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
              >
                <Layers className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                <span>쇼츠 UI 세이프존 토글</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToolSelect?.('c2pa');
                  setIsToolsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                <span>C2PA SynthID 서명 검증</span>
              </button>
            </div>
          )}

          {/* 숨겨진 파일 인풋 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <form
            onSubmit={handleFormSubmit}
            className="flex items-center gap-2.5 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-full pl-3.5 pr-2.5 py-2 shadow-xl backdrop-blur-xl transition-all focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-600/20"
          >
            {/* 좌측: [➕ 도구] 버튼 */}
            <button
              type="button"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                isToolsOpen
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              title="도구 메뉴"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>도구</span>
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

            {/* 우측 도구: 음성 마이크 [🎙️] 및 전송 버튼 [전송] */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2 rounded-full transition-all cursor-pointer shrink-0 relative ${
                  isRecording
                    ? 'bg-rose-500/15 text-rose-500 dark:bg-rose-500/25 ring-2 ring-rose-500/40 animate-pulse'
                    : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title={isRecording ? '음성 녹음 중지 (클릭하여 끄기)' : '음성으로 지속 지시하기'}
                aria-label="음성 마이크"
              >
                {isRecording ? (
                  <>
                    <Mic className="w-4 h-4 text-rose-500" strokeWidth={2} />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  </>
                ) : (
                  <Mic className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                )}
              </button>

              <button
                type="submit"
                disabled={isProcessing || (!inputVal.trim() && !attachedFile)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                  inputVal.trim() || attachedFile
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md hover:scale-105 active:scale-95'
                    : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                }`}
                title="전송"
                aria-label="전송"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
