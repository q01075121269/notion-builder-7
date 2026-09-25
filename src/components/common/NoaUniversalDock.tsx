// src/components/common/NoaUniversalDock.tsx
// [만능 Noa 커맨드 독(Universal Command Dock) - 2026년형 플로팅 독 & 멀티모달 배관]

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Mic, ArrowUp, X, FileText } from 'lucide-react';
import type { DockAttachment, DockPayload } from '../../types/dock';

interface NoaUniversalDockProps {
  onSubmit: (payload: DockPayload) => void;
  isProcessing?: boolean;
  placeholder?: string;
  onToolSelect?: (toolId: string) => void;
  className?: string;
}

export const NoaUniversalDock: React.FC<NoaUniversalDockProps> = ({
  onSubmit,
  isProcessing = false,
  placeholder = '노아(NOA)에게 편하게 말씀하시거나 파일/이미지를 올려주세요...',
  className = ''
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<DockAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>('');

  // 자동 높이 조절 (24px ~ 120px)
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 24), 120);
    el.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  // Web Speech API 인스턴스 정지
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('[WebSpeech] Stop error:', err);
      }
    }
    setIsListening(false);
    isListeningRef.current = false;
  }, []);

  // Web Speech API 인스턴스 실제 연결 및 시작
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('현재 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      baseTextRef.current = text ? `${text.trim()} ` : '';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          baseTextRef.current = `${baseTextRef.current}${finalTranscript.trim()} `;
        }

        const combined = `${baseTextRef.current}${interimTranscript.trim()}`.trim();
        if (combined) {
          setText(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[WebSpeech] Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('마이크 사용 권한이 차단되었습니다. 브라우저 주소창 좌측의 자물쇠/사이트 설정에서 마이크를 허용해 주세요.');
        }
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[WebSpeech] Failed to start:', err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [text]);

  // 마이크 토글
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // 언마운트 시 음성 인식 자원 안전 해제
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // 파일 파싱 및 DockAttachment 변환 유틸
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newAttachments: DockAttachment[] = fileArray.map((file) => {
      let fileType: DockAttachment['type'] = 'document';
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].includes(ext)) {
        fileType = 'audio';
      } else {
        fileType = 'document';
      }

      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: fileType,
        previewUrl: fileType === 'image' ? URL.createObjectURL(file) : undefined
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  // 첨부파일 삭제 및 ObjectURL 해제
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // 파일 선택 input 핸들러
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  // 클립보드 붙여넣기(Ctrl+V) 감지: 이미지 파일 붙여넣기 시 즉시 첨부파일 트레이로 직결
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    const pastedImageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) pastedImageFiles.push(file);
      }
    }

    if (pastedImageFiles.length > 0) {
      e.preventDefault();
      processFiles(pastedImageFiles);
    }
  }, [processFiles]);

  // 전역 및 로컬 드래그 앤 드롭 감지
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounterRef.current = 0;
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // 전송 처리
  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || isProcessing) {
      return;
    }

    // 전송 시 음성 인식이 켜져 있으면 자동 정지
    if (isListeningRef.current) {
      stopListening();
    }

    const payload: DockPayload = {
      text: trimmed,
      attachments: [...attachments],
      timestamp: Date.now()
    };

    // 전송 콜백 호출
    onSubmit(payload);

    // 즉시 입력창 텍스트 및 첨부 트레이 초기화
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
  }, [text, attachments, isProcessing, onSubmit, stopListening]);

  // 키보드 엔터 감지 (한글 조합 방어 및 Shift+Enter 개행)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = (text.trim().length > 0 || attachments.length > 0) && !isProcessing;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 pb-6 transition-all duration-200 ${className}`}>
      {/* 플로팅 알약형 독 컨테이너 */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`bg-zinc-900/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-3xl shadow-2xl p-2 transition-all duration-200 ${
          isDragging ? 'ring-2 ring-blue-500/50 border-blue-500/40 shadow-blue-500/10' : ''
        }`}
      >
        {/* 상단 첨부파일 트레이 (Attachment Tray) - 첨부파일이 있을 때만 노출 */}
        {attachments.length > 0 && (
          <div className="flex gap-2 flex-wrap pb-2 px-2 items-center border-b border-zinc-800/80 mb-1.5 animate-fadeIn">
            {attachments.map((att) => (
              <div key={att.id} className="relative group shrink-0">
                {att.type === 'image' && att.previewUrl ? (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-zinc-700/80 bg-zinc-950">
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full flex items-center justify-center transition cursor-pointer"
                      title="삭제"
                    >
                      <X className="w-2.5 h-2.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs text-zinc-300 max-w-xs truncate">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
                    <span className="truncate max-w-[140px] text-[11px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                      title="삭제"
                    >
                      <X className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 메인 인풋 라인 */}
        <div className="flex items-end gap-2 px-2 py-1">
          {/* 좌측: 미디어/파일 첨부 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-full transition cursor-pointer shrink-0"
            title="파일 첨부 (이미지, 문서, 오디오)"
          >
            <Paperclip className="w-4 h-4 text-zinc-400 hover:text-zinc-200" strokeWidth={1.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv,.xlsx,.mp3,.wav"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* 중앙: 자동 높이 조절 텍스트에어리어 */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none text-sm text-zinc-100 placeholder:text-zinc-500 resize-none min-h-[24px] max-h-[120px] py-1 leading-relaxed overflow-y-auto"
          />

          {/* 우측 액션 군 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 음성 마이크 버튼 (진짜 작동하는 Web Speech STT 마이크 배선 직결) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-full transition cursor-pointer relative ${
                isListening
                  ? 'text-rose-400 bg-rose-500/20 ring-2 ring-rose-500/50 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
              title={isListening ? '음성 입력 중지' : '음성으로 말씀하세요 (Web Speech STT)'}
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
              {isListening && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            {/* 전송 버튼: 텍스트나 첨부파일이 있을 때만 활성화 */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`p-2 rounded-full transition flex items-center justify-center ${
                canSubmit
                  ? 'bg-zinc-100 text-zinc-900 hover:bg-white cursor-pointer active:scale-95 shadow-sm'
                  : 'bg-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
              title="전송"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
