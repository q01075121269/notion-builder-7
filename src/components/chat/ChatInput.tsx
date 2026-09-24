import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Send, 
  Sparkles, 
  Loader2, 
  Paperclip, 
  UploadCloud,
  Mic,
  MicOff,
  Camera
} from 'lucide-react';
import type { AttachedFile } from '../../types/fileAttachment';
import { parseUploadedFile } from '../../services/fileParserService';
import { FileAttachmentZone } from './FileAttachmentZone';
import { cleanDuplicateSpeech } from '../../services/quickCaptureLocalParser';

export const ChatInput: React.FC<{ inputPrompt?: string; onClearPrompt?: () => void }> = ({
  inputPrompt,
  onClearPrompt
}) => {
  const { sendMessage, isGenerating, showToast, setCurrentTemplate } = useApp();
  const [text, setText] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── 인라인 STT 상태 (화면 탭 전환 없음) ──────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const sttDispatchedRef = useRef(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputPrompt) {
      setText(inputPrompt);
      if (onClearPrompt) onClearPrompt();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [inputPrompt, onClearPrompt]);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // ── 인라인 STT 초기화 (빌더 전용, quick_capture 탭 전환 없음) ───────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSttSupported(true);
    const recog = new SR();
    recog.lang = 'ko-KR';
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (event: any) => {
      if (sttDispatchedRef.current) return;
      const result = event.results[event.results.length - 1];
      const transcript = (result?.[0]?.transcript || '').trim();
      if (!transcript) return;
      sttDispatchedRef.current = true;
      const cleaned = cleanDuplicateSpeech(transcript);
      setText(cleaned);
      setIsListening(false);
      try { recog.stop(); } catch {}
    };
    recog.onerror = () => { setIsListening(false); sttDispatchedRef.current = false; };
    recog.onend = () => { setIsListening(false); };
    recognitionRef.current = recog;
    return () => { try { recognitionRef.current?.abort(); } catch {} };
  }, []);

  const toggleBuilderListening = () => {
    if (!sttSupported) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    } else {
      sttDispatchedRef.current = false;
      try { recognitionRef.current?.start(); setIsListening(true); } catch (err) { console.error(err); }
    }
  };

  // 다중 파일(Multiple Files) 동시 파싱 핸들러 (Promise.all 적용)
  const handleAddFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    
    // 임시 로딩 항목 먼저 생성
    const tempEntries: AttachedFile[] = filesArray.map(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return {
        id: `temp_${Date.now()}_${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        sizeFormatted: `${Math.round(file.size / 1024)} KB`,
        extension: ext,
        category: 'document',
        mimeType: file.type,
        isParsing: true
      };
    });

    setAttachedFiles(prev => [...prev, ...tempEntries]);

    // Promise.all로 모든 파일의 파싱 결과를 동시 처리
    const parsedResults = await Promise.all(
      filesArray.map(file => parseUploadedFile(file))
    );

    setAttachedFiles(prev =>
      prev.map(item => {
        const idx = tempEntries.findIndex(t => t.id === item.id);
        if (idx !== -1) {
          const parsed = parsedResults[idx];
          if (parsed.warning || parsed.error) {
            showToast(parsed.warning || parsed.error || '파일 파싱에 주의가 필요합니다.', 'warning');
          }
          return parsed;
        }
        return item;
      })
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(e.target.files);
    e.target.value = ''; // 재선택 가능하도록 초기화
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Drag and Drop 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 유효한 파싱 데이터가 있는 첨부파일만 선별
    const validFiles = attachedFiles.filter(f => !f.error && (f.parsedContent || f.sheets || f.previewUrl));
    const hasFailedFiles = attachedFiles.some(f => Boolean(f.error) || f.isUnsupportedHwp);

    if (hasFailedFiles && validFiles.length === 0 && !text.trim()) {
      showToast('구형 HWP 파일은 보안 바이너리 포맷입니다. 정확한 데이터 분석을 위해 PDF 또는 Word(DOCX)로 변환해 첨부해주세요.', 'warning');
      setCurrentTemplate(null);
      return;
    }

    const hasText = Boolean(text.trim());
    const hasFiles = validFiles.length > 0;
    if ((!hasText && !hasFiles) || isGenerating) return;

    // 첨부 파일이 있을 때 텍스트가 비어있으면 자동 기본 프롬프트 설정
    let finalPrompt = text.trim();
    if (!finalPrompt && hasFiles) {
      const isImage = validFiles.some(f => f.category === 'image');
      const isExcel = validFiles.some(f => f.category === 'spreadsheet');
      if (isExcel) {
        finalPrompt = '첨부된 엑셀 표 양식과 수식을 분석하여 동일한 구조의 노션 데이터베이스로 만들어줘';
      } else if (isImage) {
        finalPrompt = '첨부된 캡처본/스케치의 레이아웃과 디자인을 분석하여 노션 템플릿으로 역설계해줘';
      } else {
        finalPrompt = '첨부된 문서 내용을 분석하여 노션 템플릿 구조로 정리해줘';
      }
    }

    sendMessage(finalPrompt, validFiles);
    setText('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = (Boolean(text.trim()) || attachedFiles.length > 0) && !isGenerating;

  return (
    <form 
      onSubmit={handleSubmit} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/90 border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center space-y-2 backdrop-blur-xs transition pointer-events-none animate-fadeIn">
          <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-bounce" />
          <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100">
            문서(Excel, Word, PDF) 또는 이미지를 여기에 놓으세요
          </p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
            표 구조 파싱 및 비전 역설계 엔진이 즉시 작동합니다
          </span>
        </div>
      )}

      <div className="relative rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-300 dark:border-neutral-700 shadow-sm focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition overflow-hidden">
        
        {/* Attached Files Chips Zone */}
        <FileAttachmentZone 
          files={attachedFiles} 
          onRemoveFile={handleRemoveFile} 
        />

        {/* Input Text & Action Buttons (44px Touch Targets for Mobile) */}
        <div className="flex items-end p-1.5 sm:p-2 gap-1">
          
          {/* File Attachment Button (Clip) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shrink-0 active:scale-95"
            title="파일 첨부 (엑셀, 워드, PDF, 텍스트)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Camera Capture Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isGenerating}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shrink-0 active:scale-95"
            title="카메라 촬영 및 이미지 비전 역설계"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* 인라인 STT 마이크 버튼 (화면 탭 전환 없음 — 라우팅 버그 차단) */}
          <button
            type="button"
            onClick={toggleBuilderListening}
            disabled={isGenerating}
            title={isListening ? '음성 인식 중단' : '빌더 인라인 음성 입력 (한국어)'}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition shrink-0 active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50'
                : 'text-neutral-500 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.docx,.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.hwp,.hwpx"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedFiles.length > 0 
                ? "첨부된 파일에 대해 원하는 작업을 입력하세요... (미입력 시 자동 역설계 진행)" 
                : "원하는 노션 템플릿의 목적과 구성을 자유롭게 입력하세요... (Enter로 전송, 파일 드래그 지원)"
            }
            disabled={isGenerating}
            className="flex-1 max-h-36 min-h-[44px] py-2.5 px-2 bg-transparent text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none focus:outline-none leading-relaxed"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition shrink-0 active:scale-95 ${
              canSubmit
                ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-xs'
                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
            }`}
            title="프롬프트 전송"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-1.5 pb-safe text-[11px] text-neutral-400 dark:text-neutral-500">
        <span className="flex items-center space-x-1 truncate">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">엑셀 수식·워드 계층 자동 파싱 및 캡처 비전 역설계 지원</span>
        </span>
        <span className="hidden sm:inline shrink-0 ml-2">줄바꿈: Shift + Enter</span>
      </div>
    </form>
  );
};
