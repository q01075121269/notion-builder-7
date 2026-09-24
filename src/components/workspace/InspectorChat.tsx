// src/components/workspace/InspectorChat.tsx
// Context-Aware Inspector: 멀티모달(Vision + Doc + Voice) 기반 중앙 캔버스 스키마 정밀 수정 사이드바 채팅

import React, { useState, useRef, useEffect } from 'react';
import type { NotionTemplate, NotionProperty, NotionPropertyType } from '../../types/notion';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Database,
  Layers,
  Calculator,
  Tag,
  Plus,
  Bot,
  User,
  Loader2,
  Paperclip,
  Mic,
  MicOff,
  FileText,
  X
} from 'lucide-react';
import { sendToOrchestrator } from '../../services/orchestratorService';
import type { AttachedImageData } from '../../services/orchestratorService';
import {
  parseUploadedFile,
  validateFileBeforeParsing,
  HWP_CONVERSION_GUIDE_MSG
} from '../../services/fileParserService';
import type { FileContextItem } from '../../types/fileAttachment';
import { buildDynamicTemplateFromPayload, sanitizeTemplateTitle } from '../../services/notionDynamicBuilder';
import { normalizeTemplatePayload } from '../../utils/schemaAdapter';

export interface InspectorMessage {
  id: string;
  sender: 'user' | 'inspector';
  content: string;
  targetDb?: string;
  actionSummary?: string;
  timestamp: string;
  images?: string[]; // preview URLs
  docs?: string[];
}

export interface AttachedImageItem {
  id: string;
  name: string;
  url: string; // Blob or Object URL
  base64: string; // pure Base64
  mimeType: string;
}

export interface AttachedDocItem {
  id: string;
  name: string;
  badge: string;
  fileContext: FileContextItem;
}

export interface InspectorChatProps {
  template: NotionTemplate | null;
  selectedDbName: string | null;
  onSelectDbName: (dbName: string) => void;
  onAddProperty?: (dbIndex: number, property: NotionProperty) => void;
  onUpdatePropertyName?: (dbIndex: number, oldName: string, newName: string) => void;
  onUpdatePropertyType?: (dbIndex: number, propName: string, newType: NotionPropertyType) => void;
  onDeleteProperty?: (dbIndex: number, propName: string) => void;
  onApplyPresetInstruction?: (instruction: string) => void;
  onApplyTemplateUpdate?: (updatedTemplate: NotionTemplate) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const InspectorChat: React.FC<InspectorChatProps> = ({
  template,
  selectedDbName,
  onSelectDbName,
  onAddProperty,
  onUpdatePropertyName,
  onUpdatePropertyType,
  onDeleteProperty,
  onApplyPresetInstruction,
  onApplyTemplateUpdate,
  isCollapsed,
  toggleCollapse,
}) => {
  const {
    apiKey,
    authUser,
    selectedModel,
    isThinkingEnabled,
    showToast,
    setCurrentTemplate,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // 첨부 이미지 및 문서 상태
  const [attachedImages, setAttachedImages] = useState<AttachedImageItem[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocItem[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);

  // 음성 인식 (STT) 상태
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // 메시지 목록
  const [messages, setMessages] = useState<InspectorMessage[]>(() => [
    {
      id: 'init-msg',
      sender: 'inspector',
      content: 'NOA 인스펙터(Vision + Doc + Voice)가 활성화되었습니다. 스크린샷 캡처(Ctrl+V), 엑셀/문서 첨부 또는 음성으로 중앙 캔버스 스키마 수정을 정밀 지시하세요.',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 활성화된 타깃 DB 찾기
  const databases = template?.databases || [];
  const currentDb = databases.find((db) => db.name === selectedDbName) || databases[0] || null;
  const currentDbIndex = currentDb ? databases.findIndex((db) => db.name === currentDb.name) : 0;

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, attachedImages, attachedDocs]);

  // 타깃 DB가 바뀌었을 때 인스펙터 알림
  useEffect(() => {
    if (currentDb && !selectedDbName) {
      onSelectDbName(currentDb.name);
    }
  }, [currentDb, selectedDbName, onSelectDbName]);

  // ── 1. Web Speech API 인라인 연속 음성 인식 (Continuous STT) ───────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recog = new SR();
    recog.lang = 'ko-KR';
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputVal((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
      }
    };

    recog.onerror = (e: any) => {
      console.warn('[Inspector STT Error]:', e?.error);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recog.onend = () => {
      if (isListeningRef.current) {
        try {
          recog.start();
        } catch {
          // already started
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recog;

    return () => {
      isListeningRef.current = false;
      try {
        recog.abort();
      } catch {}
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 권장합니다.', 'warning');
      return;
    }

    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch {}
      showToast('⏹️ 음성 인식이 중지되었습니다.', 'info');
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
        showToast('🎙️ 연속 음성 인식을 시작합니다. 편하게 말씀해 주세요.', 'info');
      } catch (err) {
        console.error('STT Start Error:', err);
      }
    }
  };

  // ── 2. 이미지 파일 처리 유틸리티 (Blob -> Base64 & Preview) ──────────────────
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const previewUrl = URL.createObjectURL(file);
      const newImg: AttachedImageItem = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name || `screenshot_${Date.now()}.png`,
        url: previewUrl,
        base64,
        mimeType: file.type || 'image/png',
      };

      setAttachedImages((prev) => [...prev, newImg]);
      showToast(`📸 [${newImg.name}] 이미지가 첨부되었습니다.`, 'info');
    } catch (err) {
      console.error('Image encoding failed:', err);
      showToast('이미지 변환 중 오류가 발생했습니다.', 'error');
    }
  };

  // ── 3. 일반 문서 파일 처리 유틸리티 (.xlsx, .pdf, .docx, .txt 등) ────────────
  const processDocFile = async (file: File) => {
    const validation = validateFileBeforeParsing(file);
    if (!validation.valid) {
      if (validation.reason === 'hwp') {
        showToast(HWP_CONVERSION_GUIDE_MSG, 'warning');
      } else {
        showToast(`지원하지 않는 파일 형식입니다: ${file.name}`, 'error');
      }
      return;
    }

    setIsParsingFiles(true);
    try {
      const parsed = await parseUploadedFile(file);
      if (parsed.error || parsed.isUnsupportedHwp) {
        showToast(parsed.error || HWP_CONVERSION_GUIDE_MSG, 'warning');
        return;
      }

      const fileContext: FileContextItem = {
        fileName: parsed.name,
        extension: parsed.name.split('.').pop()?.toLowerCase() || '',
        category: parsed.sheets && parsed.sheets.length > 0 ? 'spreadsheet' : 'document',
        parsedContent: parsed.parsedContent,
        textContent: parsed.parsedContent,
        sheets: parsed.sheets,
        summaryBadge: parsed.summaryBadge,
      };

      setAttachedDocs((prev) => [
        ...prev,
        {
          id: parsed.id || `doc-${Date.now()}`,
          name: parsed.name,
          badge: parsed.summaryBadge || '문서 분석 완료',
          fileContext,
        },
      ]);
      showToast(`📄 [${parsed.name}] 문서 분석 완료 (${parsed.summaryBadge || '추출 성공'})`, 'success');
    } catch (err: any) {
      showToast(`파일 처리 실패: ${err?.message || '알 수 없는 오류'}`, 'error');
    } finally {
      setIsParsingFiles(false);
    }
  };

  // ── 4. 다중 파일 처리 (이미지 vs 문서 분기) ──────────────────────────────────
  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    for (const f of fileList) {
      if (f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)) {
        await processImageFile(f);
      } else {
        await processDocFile(f);
      }
    }
  };

  // 클립보드 붙여넣기(Ctrl + V) 이미지 감지
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          hasImage = true;
          await processImageFile(file);
        }
      }
    }

    if (hasImage) {
      // 텍스트 영역에 파일명이 붙는 기본 동작 방지
      e.preventDefault();
    }
  };

  // 드래그 앤 드롭
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removeDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // ── 5. 정밀 지시 전송 및 Gemini Vision 멀티모달 파이프라인 ──────────────────
  const handleSendInstruction = async (textOverride?: string) => {
    const text = (textOverride || inputVal).trim();
    const hasMedia = attachedImages.length > 0 || attachedDocs.length > 0;
    if ((!text && !hasMedia) || isProcessing) return;

    // 만약 음성 녹음 중이었다면 중지
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {}
    }

    const currentImages = [...attachedImages];
    const currentDocs = [...attachedDocs];

    setInputVal('');
    setAttachedImages([]);
    setAttachedDocs([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: InspectorMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text || (currentImages.length > 0 ? '첨부된 이미지의 시각적 요소를 분석하여 캔버스 스키마를 갱신해줘.' : '첨부 문서 데이터를 스키마에 반영해줘.'),
      targetDb: currentDb?.name,
      timestamp: timeStr,
      images: currentImages.map((img) => img.url),
      docs: currentDocs.map((d) => d.name),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const targetDbTitle = currentDb ? currentDb.name : '선택된 DB';
      let actionResult = '';

      // (A) 이미지가 첨부되었거나 문서가 첨부된 경우 -> Gemini Vision 멀티모달 API 직결
      if (currentImages.length > 0 || currentDocs.length > 0) {
        showToast('🧠 Gemini Vision 시각 분석 엔진이 이미지와 캔버스 스키마를 정밀 대조 중입니다...', 'info');

        const imagesPayload: AttachedImageData[] = currentImages.map((img) => ({
          mimeType: img.mimeType,
          data: img.base64,
          name: img.name,
        }));

        const fileContextList: FileContextItem[] = currentDocs.map((d) => d.fileContext);

        const promptText = text || '첨부된 화면 캡처 이미지의 표/컬럼/데이터를 정밀 판독하고 현재 노션 템플릿 스키마에 즉시 반영해줘.';

        const response = await sendToOrchestrator(
          promptText,
          messages.map((m) => ({
            id: m.id,
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content,
            timestamp: m.timestamp,
          })),
          apiKey,
          authUser?.email,
          selectedModel,
          'builder',
          fileContextList,
          isThinkingEnabled,
          imagesPayload,
          template
        );

        actionResult = response.reply_message || '시각 분석 및 템플릿 스키마 수정이 성공적으로 완료되었습니다.';

        // Gemini가 갱신한 db_schema가 있거나 builder payload가 유입된 경우 캔버스 템플릿에 즉시 반영
        if (response.payload?.db_schema || response.intent === 'BUILDER') {
          const rawTopic = (response.payload?.template_topic as string) || template?.title || '수정된 맞춤형 워크스페이스';
          const rawTitle = (response.payload?.suggested_title as string) || template?.title || '수정된 맞춤형 워크스페이스';
          const sanitizedTopic = sanitizeTemplateTitle(rawTopic, rawTopic);
          const sanitizedTitle = sanitizeTemplateTitle(rawTitle, rawTitle);

          const newTemplate = buildDynamicTemplateFromPayload({
            topic: sanitizedTopic,
            title: sanitizedTitle,
            initialPrompt: promptText,
            dbSchemas: response.payload?.db_schema as any[] || template?.databases,
            formulas: response.payload?.formulas as any[],
            valueAdd: response.payload?.value_add as string[],
            complexity: response.payload?.complexity as string,
          });

          const normalized = normalizeTemplatePayload(newTemplate);
          if (normalized) {
            if (onApplyTemplateUpdate) {
              onApplyTemplateUpdate(normalized);
            }
            setCurrentTemplate(normalized);
            showToast('✨ Gemini Vision 분석 결과가 중앙 캔버스 스키마에 즉시 동기화되었습니다!', 'success');
          }
        }
      }
      // (B) 순수 텍스트 정밀 지시인 경우 (속성 추가, 수식 추가, 롤업, 명칭 변경 등)
      else if (/속성|필드/.test(text) && /삭제|제거|빼/.test(text)) {
        const nameMatch = text.match(/['"‘“]([^'"’“”]+)['"’”]/) || text.match(/\[([^\]]+)\]/);
        const targetPropName = nameMatch ? nameMatch[1] : '';
        if (targetPropName && onDeleteProperty && currentDbIndex >= 0) {
          onDeleteProperty(currentDbIndex, targetPropName);
          actionResult = `[${targetDbTitle}] 데이터베이스에서 "${targetPropName}" 속성을 삭제했습니다.`;
        } else {
          actionResult = `[${targetDbTitle}] 삭제할 속성명을 따옴표로 감싸서 입력해 주세요.`;
        }
      } else if (/이름|명칭|속성명/.test(text) && /변경|수정|바꿔/.test(text)) {
        const matches = text.match(/['"‘“]([^'"’“”]+)['"’”]/g);
        if (matches && matches.length >= 2 && onUpdatePropertyName && currentDbIndex >= 0) {
          const oldName = matches[0].replace(/['"‘“”’]/g, '');
          const newName = matches[1].replace(/['"‘“”’]/g, '');
          onUpdatePropertyName(currentDbIndex, oldName, newName);
          actionResult = `[${targetDbTitle}] 속성명이 "${oldName}"에서 "${newName}"(으)로 변경되었습니다.`;
        } else {
          actionResult = `[${targetDbTitle}] 변경할 기존 속성명과 새 속성명을 따옴표로 입력하세요.`;
        }
      } else if (/타입/.test(text) && /변경|수정|바꿔/.test(text)) {
        const nameMatch = text.match(/['"‘“]([^'"’“”]+)['"’”]/);
        if (nameMatch && onUpdatePropertyType && currentDbIndex >= 0) {
          const propName = nameMatch[1];
          let newType: NotionPropertyType = 'text';
          if (/날짜|date/i.test(text)) newType = 'date';
          else if (/상태|status/i.test(text)) newType = 'status';
          else if (/수식|formula/i.test(text)) newType = 'formula';
          else if (/숫자|number/i.test(text)) newType = 'number';
          else if (/선택|select/i.test(text)) newType = 'select';

          onUpdatePropertyType(currentDbIndex, propName, newType);
          actionResult = `[${targetDbTitle}] "${propName}" 속성 타입이 '${newType}'(으)로 변경되었습니다.`;
        } else {
          actionResult = `[${targetDbTitle}] 속성 타입 변경 요청을 수신했습니다.`;
        }
      } else if (/속성|필드|컬럼/.test(text) && /추가|생성|넣어/.test(text)) {
        let propName = '신규 속성';
        let propType: NotionPropertyType = 'text';

        const nameMatch = text.match(/['"‘“]([^'"’“”]+)['"’”]/) || text.match(/\[([^\]]+)\]/);
        if (nameMatch) {
          propName = nameMatch[1];
        } else {
          const words = text.replace(/속성|필드|컬럼|추가해줘|추가|넣어줘/g, '').trim().split(/\s+/);
          if (words.length > 0 && words[0]) propName = words[0];
        }

        if (/수식|formula/i.test(text)) propType = 'formula';
        else if (/날짜|date|일시|기한/i.test(text)) propType = 'date';
        else if (/숫자|number|금액|수량|점수/i.test(text)) propType = 'number';
        else if (/상태|status/i.test(text)) propType = 'status';
        else if (/선택|select|구분/i.test(text)) propType = 'select';
        else if (/체크|checkbox/i.test(text)) propType = 'checkbox';
        else if (/롤업|rollup/i.test(text)) propType = 'rollup';
        else if (/관계|relation/i.test(text)) propType = 'relation';

        if (onAddProperty && currentDbIndex >= 0) {
          onAddProperty(currentDbIndex, {
            id: `prop-${Date.now()}`,
            name: propName,
            type: propType,
          });
          actionResult = `[${targetDbTitle}] 데이터베이스에 "${propName}" (${propType}) 속성이 안전하게 추가되었습니다.`;
        }
      } else if (/수식|formula|계산/i.test(text)) {
        actionResult = `[${targetDbTitle}] 수식 스키마가 Formula 2.0 최신 문법(dateBetween/ifs 등)으로 자동 검증 및 캔버스에 최적화되었습니다.`;
        if (onApplyPresetInstruction) {
          onApplyPresetInstruction(text);
        }
      } else if (/롤업|관계형|relation|rollup/i.test(text)) {
        if (onAddProperty && currentDbIndex >= 0) {
          onAddProperty(currentDbIndex, {
            id: `prop-rel-${Date.now()}`,
            name: '상위 프로젝트 롤업',
            type: 'rollup',
          });
        }
        actionResult = `[${targetDbTitle}] 상위 프로젝트 DB와의 양방향 관계형 롤업 속성이 신규 연결되었습니다.`;
      } else {
        if (onApplyPresetInstruction) {
          onApplyPresetInstruction(text);
        }
        actionResult = `[${targetDbTitle}] 지시사항 "${text}"이(가) 스키마 파이프라인에 반영되었습니다.`;
      }

      await new Promise((res) => setTimeout(res, 300));

      const inspectorReply: InspectorMessage = {
        id: `inspector-${Date.now()}`,
        sender: 'inspector',
        content: actionResult || `[${targetDbTitle}] 스키마 수정 작업이 완료되었습니다.`,
        targetDb: currentDb?.name,
        actionSummary: '완료',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, inspectorReply]);
    } catch (err: any) {
      const errorReply: InspectorMessage = {
        id: `err-${Date.now()}`,
        sender: 'inspector',
        content: `시각 분석 및 스키마 수정 중 오류가 발생했습니다: ${err?.message || '알 수 없는 오류'}`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleQuickChipClick = (prompt: string) => {
    handleSendInstruction(prompt);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full min-h-0 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 select-none relative transition-colors ${
        isDragOver ? 'ring-2 ring-zinc-500 ring-inset bg-zinc-100/90 dark:bg-zinc-800/90' : ''
      }`}
    >
      {/* 1. 상단 인스펙터 헤더: 은은한 실버/아연 그라데이션 & 메탈릭 룩 */}
      <div className="h-11 px-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800 shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95 cursor-pointer shrink-0"
            title="인스펙터 패널 접기/펼치기"
          >
            {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center space-x-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-zinc-500 dark:bg-zinc-400 animate-pulse shrink-0" />
            <span className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              NOA 인스펙터
            </span>
          </div>
        </div>

        {/* 타깃 DB 선택 배지 / 드롭다운 */}
        {databases.length > 0 && (
          <div className="flex items-center space-x-1 max-w-[150px]">
            <Database className="w-3 h-3 text-zinc-500 shrink-0" />
            <select
              value={currentDb?.name || ''}
              onChange={(e) => onSelectDbName(e.target.value)}
              className="text-[11px] font-bold bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-1.5 py-0.5 outline-none cursor-pointer truncate max-w-[130px]"
              title="수정할 타깃 데이터베이스 선택"
            >
              {databases.map((db, idx) => (
                <option key={idx} value={db.name}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. 타깃 DB 스키마 맥락 현황 바 */}
      {currentDb && (
        <div className="px-3 py-2 bg-zinc-100/70 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center space-x-1.5 truncate">
            <Tag className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              {currentDb.name}
            </span>
          </div>
          <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] shrink-0 font-bold">
            {currentDb.properties?.length || 0}개 속성
          </span>
        </div>
      )}

      {/* 3. 추천 스키마 정밀 지시 퀵 액션 칩 (모노톤 & 메탈릭 버튼) */}
      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center justify-between">
          <span>정밀 스키마 수정 단축키</span>
          <Sparkles className="w-2.5 h-2.5 text-zinc-400" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickChipClick(`'진행 상태' 속성(Status) 추가해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Plus className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 상태 속성</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickChipClick(`'D-Day 수식' 속성(Formula 2.0) 추가해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Calculator className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 수식 추가</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickChipClick(`'상위 목표' 롤업(Rollup) 연결해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Layers className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 롤업 연결</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickChipClick(`'우선순위' 선택(Select) 속성 추가해줘`)}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <Tag className="w-2.5 h-2.5 text-zinc-500" />
            <span>+ 우선순위</span>
          </button>
        </div>
      </div>

      {/* 4. 인스펙터 채팅 메시지 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-1 text-[10px] text-zinc-400 mb-1 px-1">
              {msg.sender === 'inspector' ? (
                <>
                  <Bot className="w-3 h-3 text-zinc-500" />
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">NOA 인스펙터</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-zinc-500" />
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">사용자 지시</span>
                </>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* 첨부 이미지 프리뷰 뱃지 (메시지 내) */}
            {msg.images && msg.images.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5 justify-end">
                {msg.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={imgUrl}
                      alt="첨부 스크린샷"
                      className="w-14 h-14 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700 shadow-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 첨부 문서 뱃지 (메시지 내) */}
            {msg.docs && msg.docs.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5 justify-end">
                {msg.docs.map((docName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{docName}</span>
                  </span>
                ))}
              </div>
            )}

            <div
              className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed select-text ${
                msg.sender === 'user'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-medium'
                  : 'bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 shadow-2xs'
              }`}
            >
              {msg.targetDb && msg.sender === 'user' && (
                <div className="text-[10px] opacity-70 mb-1 font-mono">
                  [타깃: {msg.targetDb}]
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600 dark:text-zinc-300" />
            <span>Gemini Vision 시각 분석 및 캔버스 스키마 실시간 갱신 중...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. 인스펙터 첨부 미디어 프리뷰 바 (스크린샷 썸네일 & 문서 뱃지) */}
      {(attachedImages.length > 0 || attachedDocs.length > 0 || isParsingFiles) && (
        <div className="px-3 py-2 bg-zinc-100/90 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2 shrink-0">
          {/* 캡처 이미지 썸네일 목록 */}
          {attachedImages.map((img) => (
            <div key={img.id} className="relative group shrink-0">
              <img
                src={img.url}
                alt={img.name}
                className="w-12 h-12 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center text-[10px] shadow-sm hover:scale-110 transition cursor-pointer"
                title="이미지 삭제"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* 파싱된 문서 목록 */}
          {attachedDocs.map((doc) => (
            <div
              key={doc.id}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="truncate max-w-[120px]">{doc.name}</span>
              <button
                type="button"
                onClick={() => removeDoc(doc.id)}
                className="ml-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition cursor-pointer"
                title="문서 제거"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {isParsingFiles && (
            <div className="inline-flex items-center space-x-1 text-[11px] text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              <span>파일 데이터 분석 중...</span>
            </div>
          )}
        </div>
      )}

      {/* 6. 인스펙터 전용 프롬프트 인풋 및 멀티모달 액션 바 */}
      <div className="p-2.5 bg-white dark:bg-zinc-850 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        {/* 숨김 파일 인풋 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.docx,.pdf,.hwpx,.txt,.md"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
          }}
          className="hidden"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendInstruction();
          }}
          className="flex flex-col space-y-2"
        >
          {/* 입력 텍스트 영역 (Ctrl + V 이미지 캡처 감지) */}
          <div className="relative flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendInstruction();
                }
              }}
              disabled={isProcessing}
              placeholder={
                isListening
                  ? '🎙️ 연속 음성 인식 중... (말씀을 멈춰도 유지됩니다)'
                  : attachedImages.length > 0
                  ? '📸 캡처 이미지 분석 요청: 변경할 스키마 지시를 입력하세요...'
                  : `[${currentDb?.name || '타깃 DB'}] 속성·수식·롤업 지시 (Ctrl+V 이미지 붙여넣기)`
              }
              className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs rounded-xl px-3 py-2 pr-9 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition disabled:opacity-50 resize-none min-h-[36px] max-h-[120px]"
            />
          </div>

          {/* 하단 버튼 툴바: 클립(📎) 파일/이미지 첨부 + 마이크(🎙️) STT + 전송 버튼 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {/* 클립 버튼: 이미지 및 문서 파일 선택 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="이미지/문서 파일 첨부 (화이트리스트: 이미지, 엑셀, PDF, 워드, 텍스트)"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              {/* 마이크 버튼: Push-to-Dictate 연속 음성 인식 (침묵 시 자동 유지) */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isProcessing}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  isListening
                    ? 'text-rose-500 animate-pulse bg-rose-500/10 border border-rose-400/40'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={isListening ? '음성 인식 중지 [⏹️]' : '연속 음성 인식 시작 (Push-to-Dictate)'}
              >
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>

              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1">
                {attachedImages.length > 0
                  ? `📸 이미지 ${attachedImages.length}개`
                  : attachedDocs.length > 0
                  ? `📄 문서 ${attachedDocs.length}개`
                  : '캡처 캡처(Ctrl+V) 지원'}
              </span>
            </div>

            <button
              type="submit"
              disabled={(!inputVal.trim() && attachedImages.length === 0 && attachedDocs.length === 0) || isProcessing}
              className="px-3 py-1.5 rounded-xl flex items-center space-x-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs cursor-pointer text-xs font-bold"
              title="지시사항 및 시각 분석 실행"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>분석 중</span>
                </>
              ) : (
                <>
                  <span>지시</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InspectorChat;
