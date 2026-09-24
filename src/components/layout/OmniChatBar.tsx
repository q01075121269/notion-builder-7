import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Mic,
  Bot,
  User,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
  Calendar,
  Construction,
  ExternalLink,
  Paperclip,
  FileText,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
import { sendToOrchestrator } from '../../services/orchestratorService';
import type { ChatMessage, OrchestratorResponse, AttachedImageData } from '../../services/orchestratorService';

export interface AttachedImageItem {
  id: string;
  name: string;
  url: string;
  base64: string;
  mimeType: string;
}
import { dispatchRoutedTasksToNotion } from '../../services/quickCaptureService';
import { extractDateFromKoreanText, extractDateRangeFromKoreanText, cleanTaskTitle, cleanDuplicateSpeech, detectReschedulePattern } from '../../services/quickCaptureLocalParser';
import { saveQuickCaptureRecord, rescheduleTaskInQuickCapture, cleanupDuplicateRescheduleTasks } from '../../services/quickCaptureStorage';
import type { RoutedNotionTask, QuickCaptureRecord } from '../../types/quickCapture';
import { PRESET_TEMPLATES } from '../../services/presetTemplates';
import { saveArchivedTemplate } from '../../services/archiveStorage';
import { SelfDiagnosticCard, payloadToDiagnostic } from '../common/SelfDiagnosticCard';
import type { DiagnosticResult } from '../common/SelfDiagnosticCard';
import { saveTodayOverrideConfig } from '../../services/dailyRoutineStorage';
import { archiveAudioArtifact, archiveTextDiscussionArtifact } from '../../services/zeroRotArchiver';
import { isNotionUrlPrompt, extractNotionUrl, generateMasterHubTemplateFromUrl } from '../../services/notionLinkAnalyzer';
import { buildDynamicTemplateFromPayload, sanitizeTemplateTitle } from '../../services/notionDynamicBuilder';
import {
  parseUploadedFile,
  validateFileBeforeParsing,
  HWP_CONVERSION_GUIDE_MSG,
  UNSUPPORTED_FORMAT_MSG,
  MIN_TEXT_LENGTH_MSG
} from '../../services/fileParserService';
import { createNotionTemplateInWorkspace } from '../../services/notionApi';
import type { NotionTemplate } from '../../types/notion';
import type { FileContextItem } from '../../types/fileAttachment';
import { normalizeTemplatePayload } from '../../utils/schemaAdapter';

// ─── 실행 영수증 카드 타입 ──────────────────────────────────────────────────
type ReceiptType = 'builder' | 'life' | 'devlab';

interface ActionReceipt {
  id: string;
  type: ReceiptType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const RECEIPT_META: Record<ReceiptType, Omit<ActionReceipt, 'id' | 'type'>> = {
  builder: {
    label: '고품질 템플릿 스키마 캔버스 투영 완료',
    emoji: '🏗️',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
  },
  life: {
    label: '라이프 허브 DB 업데이트 완료',
    emoji: '📅',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
  },
  devlab: {
    label: 'AI 오피스 스튜디오 (PPT·슬라이드·문서) 캔버스 저장 완료',
    emoji: '📄',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
  },
};

// ─── 메시지에 실행 영수증 + 진단 카드 연결 ──────────────────────────────────
interface OmniMessage extends ChatMessage {
  receipts?: ActionReceipt[];
  /** DEVLAB troubleshooting 인텐트 시 SelfDiagnosticCard 데이터 */
  diagnostic?: DiagnosticResult;
  attachments?: string[];
  /** BUILDER 인텐트 시 AI가 생성/개선한 동적 NotionTemplate 데이터 */
  generatedTemplateData?: NotionTemplate;
}

function buildReceipts(intent: string): ActionReceipt[] {
  const map: Record<string, ReceiptType> = {
    BUILDER: 'builder',
    LIFE: 'life',
    DEVLAB: 'devlab',
  };
  const type = map[intent];
  if (!type) return [];
  return [{
    id: `receipt-${Date.now()}`,
    type,
    ...RECEIPT_META[type],
  }];
}


// ─── 옴니 챗 4대 모드 퀵 프리셋 칩 규격 ─────────────────────────────────────
export type ChapterModeKey = 'builder' | 'life' | 'devlab' | 'media_lab';

interface ChatModeConfig {
  key: ChapterModeKey;
  label: string;
  emoji: string;
  placeholder: string;
  activeClass: string;
}

const CHAT_MODES: ChatModeConfig[] = [
  {
    key: 'builder',
    label: '템플릿 마스터',
    emoji: '🏗️',
    placeholder: '노아(NOA)에게 어떤 업무를 도와드릴지 편하게 말씀해 주세요...',
    activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-800 dark:text-amber-200 font-bold shadow-xs',
  },
  {
    key: 'life',
    label: '라이프 비서',
    emoji: '👔',
    placeholder: '노아(NOA)에게 어떤 업무를 도와드릴지 편하게 말씀해 주세요...',
    activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs',
  },
  {
    key: 'devlab',
    label: '오피스 스튜디오',
    emoji: '📄',
    placeholder: '노아(NOA)에게 어떤 업무를 도와드릴지 편하게 말씀해 주세요...',
    activeClass: 'bg-blue-500/20 border-blue-500/50 text-blue-800 dark:text-blue-200 font-bold shadow-xs',
  },
  {
    key: 'media_lab',
    label: 'AI 미디어 랩',
    emoji: '🎨',
    placeholder: '노아(NOA)에게 어떤 업무를 도와드릴지 편하게 말씀해 주세요...',
    activeClass: 'bg-purple-500/20 border-purple-500/50 text-purple-800 dark:text-purple-200 font-bold shadow-xs',
  },
];


export interface OmniAttachment {
  id: string;
  name: string;
  sizeFormatted?: string;
  type: 'file' | 'link';
  parsedContent?: string;
  sheets?: any[];
  summaryBadge?: string;
  isParsing?: boolean;
  error?: string;
  warning?: string;
  isUnsupportedHwp?: boolean;
}

// ─── OmniChatBar 컴포넌트 ────────────────────────────────────────────────────
export const OmniChatBar: React.FC = () => {
  const {
    apiKey,
    authUser,
    notionApiKey,
    notionParentPageId,
    createdNotionResource,
    setIsNotionSettingsModalOpen,
    showToast,
    selectedModel,
    isThinkingEnabled,
    currentView,
    setCurrentView,
    currentTemplate,
    setCurrentTemplate,
    setIsGenerating,
    setIsViewingCurationHub,
  } = useApp();

  // 채팅 상태
  const [messages, setMessages] = useState<OmniMessage[]>([]);
  // 4대 챕터 모드 칩 상태
  const [activeMode, setActiveMode] = useState<ChapterModeKey>('builder');

  useEffect(() => {
    if (['builder', 'life', 'devlab', 'media_lab'].includes(currentView)) {
      setActiveMode(currentView as ChapterModeKey);
    }
  }, [currentView]);

  const handleModeClick = (modeKey: ChapterModeKey) => {
    setActiveMode(modeKey);
    setCurrentView(modeKey as any);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 첨부 파일 및 캡처 이미지 상태
  const [attachedFiles, setAttachedFiles] = useState<OmniAttachment[]>([]);
  const [attachedImages, setAttachedImages] = useState<AttachedImageItem[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [hwpAlertModal, setHwpAlertModal] = useState<{ open: boolean; fileName: string }>({ open: false, fileName: '' });
  const [isDragOver, setIsDragOver] = useState(false);

  // STT 상태 (Push-to-Dictate 단방향 누적 버퍼 모드)
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const isListeningRef = useRef(false);
  const lastSentRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const baseTextRef = useRef<string>('');
  const fullTranscriptRef = useRef<string>('');
  const handleSendMessageRef = useRef<(overrideText?: string) => Promise<void>>(() => Promise.resolve());

  // ── STT 초기화 (Push-to-Dictate 단방향 누적 버퍼) ──────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    setSttSupported(true);
    const recog = new SR();
    recog.lang = 'ko-KR';
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalStr += item[0].transcript;
        } else {
          interimStr += item[0].transcript;
        }
      }

      if (finalStr) {
        fullTranscriptRef.current = (fullTranscriptRef.current + ' ' + finalStr).trim();
      }

      const voicePart = cleanDuplicateSpeech((fullTranscriptRef.current + ' ' + interimStr).trim());
      const basePart = baseTextRef.current;

      const combined = basePart
        ? (voicePart ? `${basePart}\n\n[음성 요청]: ${voicePart}` : basePart)
        : voicePart;

      if (combined) {
        setInputValue(combined);
      }
      // 단방향 누적 버퍼 모드: 침묵 타이머 자동 전송을 실행하지 않음!
    };

    recog.onerror = (e: any) => {
      console.warn('STT 상태/오류:', e?.error);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recog.onend = () => {
      // 사용자가 수동으로 끄기 전까지는 자동으로 재시작하여 텀이 길어도 끊기지 않음
      if (isListeningRef.current) {
        try {
          recog.start();
        } catch {
          // 이미 실행 중이거나 에러 발생 시 처리
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recog;

    return () => {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch {}
    };
  }, []);

  // ── 채팅 자동 스크롤 ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── STT 토글 (불필요한 팝업 없이 버튼 Red Pulse 피드백) ─────────────────────
  const toggleListening = () => {
    if (!sttSupported) {
      console.warn('STT is not supported on this browser.');
      return;
    }

    if (isListening) {
      // 수동으로 마이크 버튼을 눌러 끌 때 -> 녹음 중단
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch {}
    } else {
      // 수동으로 마이크 버튼을 눌러 켤 때 -> 이전에 복사해서 붙여넣은 텍스트를 baseTextRef에 보존 후 누적
      isListeningRef.current = true;
      baseTextRef.current = inputValue.trim();
      fullTranscriptRef.current = '';
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setIsExpanded(true);
      } catch (err) {
        console.error('STT 시작 실패:', err);
      }
    }
  };

  // ── 캡처 이미지(Blob/Base64) 인라인 처리 (팝업 없이 미니 뱃지만 추가) ───────────
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif)$/i.test(file.name)) return;

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

      // 화면을 가리는 토스트 팝업 없이, 입력창 상단에 단정한 미니 썸네일 뱃지만 조용히 표시
      setAttachedImages((prev) => [...prev, newImg]);
    } catch (err) {
      console.error('Image encoding failed:', err);
    }
  };

  // ── 클립보드 붙여넣기(Ctrl + V) 이미지 감지 핸들러 ──────────────────────────
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
      // 텍스트 영역에 가짜 문자열이 붙는 것 방지
      e.preventDefault();
    }
  };

  // ── 다중 파일 및 이미지 일괄 분기 처리 ─────────────────────────────────────
  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    const imageFiles: File[] = [];
    const docFiles: File[] = [];

    for (const f of fileList) {
      if (f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)) {
        imageFiles.push(f);
      } else {
        docFiles.push(f);
      }
    }

    for (const img of imageFiles) {
      await processImageFile(img);
    }

    if (docFiles.length > 0) {
      await processSelectedFiles(docFiles);
    }
  };

  // ── 범용 다중 파일 첨부 (Universal File Ingestion) 파이프라인 ───────────────
  const processSelectedFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setIsParsingFiles(true);
    const newItems: OmniAttachment[] = [];

    for (const file of filesArray) {
      // 1. 사전 화이트리스트 및 .hwp 검증 (2차 검증)
      const validation = validateFileBeforeParsing(file);
      if (!validation.valid) {
        if (validation.reason === 'hwp') {
          setHwpAlertModal({ open: true, fileName: file.name });
          showToast(HWP_CONVERSION_GUIDE_MSG, 'warning');
        } else {
          showToast(`⚠️ [${file.name}] ${UNSUPPORTED_FORMAT_MSG}`, 'error');
        }
        continue; // 즉시 첨부 목록 추가 차단
      }

      // 2. 파싱 및 유효 본문 길이 검증 (10자 미만 취소)
      try {
        showToast(`⏳ [${file.name}] 파일 데이터를 정밀 분석 중...`, 'info');
        const parsed = await parseUploadedFile(file);

        if (parsed.error || parsed.isTooShort || parsed.isUnsupportedHwp) {
          if (parsed.isUnsupportedHwp) {
            setHwpAlertModal({ open: true, fileName: file.name });
            showToast(HWP_CONVERSION_GUIDE_MSG, 'warning');
          } else {
            showToast(`⚠️ [${file.name}] ${parsed.error || MIN_TEXT_LENGTH_MSG}`, 'error');
          }
          continue; // 파란 배지 표시 안 하고 첨부 취소
        }

        const textLen = (parsed.parsedContent || '').replace(/[#\-\|\*\s`]/g, '').length;
        if (textLen < 10 && (!parsed.sheets || parsed.sheets.length === 0)) {
          showToast(`⚠️ [${file.name}] ${MIN_TEXT_LENGTH_MSG}`, 'error');
          continue;
        }

        newItems.push({
          id: parsed.id,
          name: parsed.name,
          sizeFormatted: parsed.sizeFormatted,
          type: 'file',
          parsedContent: parsed.parsedContent,
          sheets: parsed.sheets,
          summaryBadge: parsed.summaryBadge || '파싱 완료',
          isParsing: false,
        });

        showToast(`📊 [${file.name}] 데이터 분석 완료 (${parsed.summaryBadge || '추출 성공'})`, 'success');
      } catch (err: any) {
        showToast(`⚠️ [${file.name}] 파싱 처리 실패: ${err.message}`, 'error');
      }
    }

    if (newItems.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newItems]);
    }
    setIsParsingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const addLinkAttachment = () => {
    if (!linkInput.trim()) return;
    const url = linkInput.trim().startsWith('http') ? linkInput.trim() : `https://${linkInput.trim()}`;
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: `link_${Date.now()}`,
        name: url,
        type: 'link',
        parsedContent: `🔗 [웹 링크 분석 데이터]: ${url}`,
      },
    ]);
    setLinkInput('');
    setShowLinkModal(false);
    showToast('🔗 링크가 첨부되었습니다.', 'info');
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // ── 입력창 및 첨부파일 명시적 Clear 핸들러 ────────────────────────────────
  const handleClearInput = () => {
    setInputValue('');
    setAttachedFiles([]);
    setAttachedImages([]);
    if (inputRef.current) inputRef.current.value = '';
    baseTextRef.current = '';
    fullTranscriptRef.current = '';
  };

  // ── 대화 기록 및 템플릿 캔버스 완전 초기화 (Clean Wipe) ──────────────────────
  const handleResetSessionAndCanvas = () => {
    setMessages([]);
    handleClearInput();
    setCurrentTemplate(null);
    try {
      localStorage.removeItem('notion_template_cache');
      localStorage.removeItem('notion_template_vault_draft');
      localStorage.removeItem('notion_architect_draft_template');
      localStorage.removeItem('notion_builder_draft');
      localStorage.removeItem('notion_chat_messages');
      sessionStorage.clear();
    } catch {}
    window.dispatchEvent(new CustomEvent('canvas:reset'));
    showToast('🧹 옴니 챗 대화 기록과 템플릿 캔버스가 깨끗이 초기화되었습니다.', 'info');
  };

  // ── 메시지 전송 ─────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const raw = (overrideText ?? inputValue).trim();
    const text = cleanDuplicateSpeech(raw);
    const hasMedia = attachedFiles.length > 0 || attachedImages.length > 0;
    if ((!text && !hasMedia) || isLoadingRef.current) return;

    // 만약 음성 입력 중이었다면 마이크 중단
    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch {}
    }

    // 3초 이내 동일 텍스트 중복 방지
    const now = Date.now();
    if (lastSentRef.current.text === text && now - lastSentRef.current.time < 3000) return;

    isLoadingRef.current = true;
    lastSentRef.current = { text, time: now };

    // [전송 시작 시 기존 캔버스 상태(previewTemplate) 즉시 언마운트 및 캐시 완전 파기]
    setIsGenerating(true);
    setCurrentTemplate(null);
    try {
      localStorage.removeItem('notion_template_cache');
      localStorage.removeItem('notion_template_vault_draft');
    } catch {}

    const currentFiles = [...attachedFiles];
    const currentImages = [...attachedImages];

    // API 호출 전 핸들러 최상단 1라인에서 즉시 입력창 및 첨부 초기화
    setInputValue('');
    if (!overrideText) {
      setAttachedFiles([]);
      setAttachedImages([]);
    }

    // [빈 껍데기 파일 파싱 실패 전송 방어 및 명확한 에러 경고]
    const invalidFile = currentFiles.find((a) => a.error || a.isUnsupportedHwp || (!a.parsedContent && (!a.sheets || a.sheets.length === 0)));
    if (invalidFile && !text && currentImages.length === 0) {
      isLoadingRef.current = false;
      setIsGenerating(false);
      setCurrentTemplate(null);
      const warnMsg = invalidFile.warning || invalidFile.error || '구형 HWP 파일은 보안 바이너리 포맷입니다. 정확한 데이터 분석을 위해 PDF 또는 Word(DOCX)로 변환해 첨부해주세요.';
      showToast(warnMsg, 'warning');
      return;
    }

    const hasValidContent = currentFiles.some((a) => (a.parsedContent || (a.sheets && a.sheets.length > 0)) && !a.error) || currentImages.length > 0;
    if (!text && !hasValidContent) {
      isLoadingRef.current = false;
      setIsGenerating(false);
      setCurrentTemplate(null);
      showToast('구형 HWP 파일은 보안 바이너리 포맷입니다. 정확한 데이터 분석을 위해 PDF 또는 Word(DOCX)로 변환해 첨부해주세요.', 'warning');
      return;
    }

    const fileContextList: FileContextItem[] = currentFiles
      .filter((a) => !a.error && (a.parsedContent || (a.sheets && a.sheets.length > 0)))
      .map((a) => ({
        fileName: a.name,
        extension: a.name.split('.').pop()?.toLowerCase() || '',
        category: a.sheets && a.sheets.length > 0 ? 'spreadsheet' : 'document',
        parsedContent: a.parsedContent,
        textContent: a.parsedContent,
        sheets: a.sheets,
        summaryBadge: a.summaryBadge
      }));

    const imagesPayload: AttachedImageData[] = currentImages.map((img) => ({
      mimeType: img.mimeType,
      data: img.base64,
      name: img.name,
    }));

    const pureText = text;
    const attachedDataBlocks = currentFiles
      .filter((a) => a.parsedContent)
      .map((a) => {
        let block = `[ATTACHED_DOCUMENT_DATA]\n파일명: ${a.name}`;
        if (a.sheets && a.sheets.length > 0) {
          const firstSheet = a.sheets[0];
          if (firstSheet.headers && firstSheet.headers.length > 0) {
            block += `\n추출 컬럼 목록: [${firstSheet.headers.join(', ')}]`;
          }
          if (firstSheet.rows && firstSheet.rows.length > 0) {
            block += `\n상위 샘플 데이터(JSON): ${JSON.stringify(firstSheet.rows.slice(0, 5))}`;
          }
        }
        block += `\n\n${a.parsedContent}\n[/ATTACHED_DOCUMENT_DATA]`;
        return block;
      })
      .join('\n\n');

    const promptGuidance = attachedDataBlocks
      ? `\n\n[지침: 사용자가 첨부한 표/문서의 실제 시트명, 컬럼 헤더, 샘플 행 데이터를 1:1로 노션 DB 속성(Properties) 및 샘플 행에 반드시 반영하여 설계하십시오.]\n\n${attachedDataBlocks}`
      : '';

    const fullMessageText = pureText + promptGuidance;
    const allAttachments = [
      ...currentFiles.map((a) => a.name),
      ...currentImages.map((img) => `[이미지: ${img.name}]`),
    ];
    const displayContent = pureText + (allAttachments.length > 0 ? `\n[첨부: ${allAttachments.join(', ')}]` : '');

    setInputValue('');
    if (inputRef.current) inputRef.current.value = '';
    fullTranscriptRef.current = '';
    baseTextRef.current = '';
    try { inputRef.current?.blur(); setTimeout(() => inputRef.current?.focus(), 50); } catch {}
    setIsExpanded(true);

    const userMsg: OmniMessage = {
      id: `omni-user-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      attachments: allAttachments,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // ── 노션 URL / 마스터 허브 분석 요청 인터셉터 ───────────────────────
      if (isNotionUrlPrompt(text)) {
        const url = extractNotionUrl(text);

        // 1. 템플릿 역설계 & 생성
        const generatedTemplate = normalizeTemplatePayload(generateMasterHubTemplateFromUrl(url, text))!;

        // 2. 전역 템플릿 주입 & 큐레이션 허브 닫기 (즉시 미리보기 렌더링 활성화)
        setCurrentTemplate(generatedTemplate);
        setIsViewingCurationHub(false);

        // 3. 내 보관함에 즉시 저장
        try {
          saveArchivedTemplate({
            id: `master-hub-${Date.now()}`,
            title: generatedTemplate.title,
            description: generatedTemplate.description || '',
            icon: generatedTemplate.icon || '🏰',
            cover_url: generatedTemplate.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
            tags: ['#노션마스터허브', '#URL역설계', '#Formula2.0', '#개편보완판'],
            templateData: generatedTemplate,
            source: 'created',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn('Failed to archive master hub template:', e);
        }

        const replyMsg = `🏰 [Notion Architect AI 마스터 허브 템플릿 분석 & 보완 완결]\n\n제출하신 노션 주소(${url})의 내용과 데이터 구조를 깊이 있게 분석하고, 현재 Notion Architect v2.0 4대 챕터 및 6대 노션 DB 시스템에 100% 최적화되도록 최고급 세련된 디자인으로 개편 완결했습니다!\n\n✨ 주요 보완 사항:\n1. 🏰 24시간 데일리 스케줄러 (Formula 2.0 진행률 수식 & D-Day 수식 연동)\n2. ⚡ 프로젝트 & 데일리 할 일 마스터 트래커 (우선순위 & 4대 챕터 자동 태깅)\n3. 💰 스마트 가계부 & 지출 분석 DB (이상 소비 AI 감지 연동)\n4. 📄 AI 오피스 스튜디오 라이브 문서함 (Docs, Sheets, Slides 연동)\n5. 🎨 AI 미디어 랩 에셋 보관함 (이미지/영상/음원 통합 아카이브)\n\n🎯 [템플릿 빌더 작업실] 라이브 캔버스에 결과물이 즉시 투영되었으며, 템플릿 보관함에도 정상 보관되었습니다!`;

        showToast('🎉 노션 URL 분석 완결: 최고급 마스터 허브 템플릿이 캔버스에 투영되었습니다!', 'success');

        const aiMsg: OmniMessage = {
          id: `omni-ai-${Date.now()}`,
          role: 'assistant',
          content: replyMsg,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          intent: 'BUILDER',
          redirect_url: '/builder',
          receipts: buildReceipts('BUILDER')
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        isLoadingRef.current = false;

        // 4. 즉시 템플릿 빌더 작업실 캔버스로 자동 전환
        setTimeout(() => {
          setCurrentView('builder');
        }, 400);

        return;
      }

      // ── 데일리 루틴 옴니 챗 명령어 인터셉터 (Zero-Rot 적재 & 1일 오버라이드) ─────
      if (/(출근|퇴근|루틴).*(늦춰|미뤄|변경|연기|조정)/.test(text) || /출근\s*시각?\s*\d{1,2}시/.test(text)) {
        let targetTime = '08:30';
        if (/9시\s*30분|09:30/.test(text)) targetTime = '09:30';
        else if (/9시|09:00/.test(text)) targetTime = '09:00';
        else if (/10시|10:00/.test(text)) targetTime = '10:00';

        saveTodayOverrideConfig({ overrideMorningTime: targetTime });
        const replyMsg = `⚡ [오늘 1일 설정 오버라이드 반영 완료]\n오늘 출근 오디오 브리핑 시각이 ${targetTime}로 조정되었습니다! (자정 00:00 마스터 룰 자동 복구)`;
        showToast(`⚡ 오늘 출근 브리핑 시각이 ${targetTime}로 변경되었습니다!`, 'info');

        const aiMsg: OmniMessage = {
          id: `omni-ai-${Date.now()}`,
          role: 'assistant',
          content: replyMsg,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          intent: 'LIFE',
          receipts: buildReceipts('LIFE')
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }

      if (/(아침|출근).*(브리핑|브리프).*(들려|재생|지금)/.test(text) || /출근길 오디오/.test(text)) {
        const targetResource = createdNotionResource || (notionParentPageId ? {
          pageId: notionParentPageId,
          pageUrl: `https://notion.so/${notionParentPageId.replace(/-/g, '')}`,
          pageTitle: '노션 부모 페이지',
          databases: [],
          createdAt: new Date().toISOString()
        } : null);

        const archiveRes = await archiveAudioArtifact({
          title: '☀️ 출근길 오디오 브리프',
          prompt: '출근길 이메일 요약 및 테크 뉴스 음원 스트리밍',
          notionApiKey,
          targetResource
        });

        const replyMsg = `☀️ [출근길 오디오 브리프 스트리밍 & Zero-Rot 자동 적재 완료]\n${archiveRes.message}\n\n📢 "오늘 주요 이메일 요약과 최신 테크 트렌드가 오디오로 스트리밍됩니다."`;
        showToast(archiveRes.message, 'success');

        const aiMsg: OmniMessage = {
          id: `omni-ai-${Date.now()}`,
          role: 'assistant',
          content: replyMsg,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          intent: 'BUILDER',
          redirect_url: '/media',
          receipts: buildReceipts('BUILDER')
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }

      if (/(취침|밤|팟캐스트|뉴스 요약|테크 뉴스).*(들려|정리|대본|작성)/.test(text)) {
        const targetResource = createdNotionResource || (notionParentPageId ? {
          pageId: notionParentPageId,
          pageUrl: `https://notion.so/${notionParentPageId.replace(/-/g, '')}`,
          pageTitle: '노션 부모 페이지',
          databases: [],
          createdAt: new Date().toISOString()
        } : null);

        const archiveRes = await archiveTextDiscussionArtifact({
          title: '🌙 취침 전 듀얼 AI 팟캐스트 토론 대본',
          content: `[호스트 A]: 최신 AI 모델 동향과 노션 워크스페이스 자동화 기법 요약입니다.\n[딥다이브 B]: 지식 소스 서랍 적재로 문서 생성이 한결 수월해졌네요.`,
          excerpt: '취침 전 듀얼 AI 팟캐스트 및 테크 뉴스 요약 대본',
          notionApiKey,
          targetResource
        });

        const replyMsg = `🌙 [취침 팟캐스트 대본 & Zero-Rot 보관 완료]\n${archiveRes.message}`;
        showToast(archiveRes.message, 'success');

        const aiMsg: OmniMessage = {
          id: `omni-ai-${Date.now()}`,
          role: 'assistant',
          content: replyMsg,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          intent: 'DEVLAB',
          redirect_url: '/devlab',
          receipts: buildReceipts('DEVLAB')
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }

      const response: OrchestratorResponse = await sendToOrchestrator(
        fullMessageText,
        [...messages, userMsg],
        apiKey,
        authUser?.email,
        selectedModel,
        activeMode,
        fileContextList,
        isThinkingEnabled,
        imagesPayload,
        currentTemplate
      );

      // [🚨 핵심 방어: 템플릿 마스터 우선주의 및 오피스 스튜디오 오라우팅 원천 차단]
      const isBuilderChipActive = activeMode === 'builder';
      const hasMediaAttachment = currentFiles.length > 0 || currentImages.length > 0;
      const isTemplateRelated = /템플릿|노션|db|데이터베이스|대시보드|체크리스트|스케줄러|트래커|관리|워크스페이스/i.test(pureText);

      let effectiveIntent = response.intent;
      if ((isBuilderChipActive || hasMediaAttachment || isTemplateRelated) && response.intent === 'DEVLAB') {
        console.warn('[OmniChatBar] Overriding DEVLAB intent to BUILDER because template mode/media attachment is active.');
        effectiveIntent = 'BUILDER';
      }

      let finalReply = response.reply_message;
      let receipts: ActionReceipt[] = [];
      let generatedTemplateForMsg: NotionTemplate | undefined;

      // ── LIFE 인텐트: 노션 & 로컬 즉시 전송 및 일정 이동(RESCHEDULE) 처리 ───────
      if (response.intent === 'LIFE') {
        const rescheduleMatch = detectReschedulePattern(text);
        const isRescheduleCmd = Boolean(rescheduleMatch) ||
          response.payload?.action === 'RESCHEDULE' ||
          (/(연기|미뤄|변경|이동|옮겨)/.test(text) && /연가|휴가|일정/.test(text));

        if (isRescheduleCmd) {
          const srcD = response.payload?.source_date || rescheduleMatch?.sourceDateQuery || '2026-09-21';
          const tgtD = response.payload?.target_date || rescheduleMatch?.targetDateStr || '2026-09-28';
          const kw = response.payload?.target_keyword || rescheduleMatch?.keyword || '연가';

          rescheduleTaskInQuickCapture(srcD, tgtD, kw);
          cleanupDuplicateRescheduleTasks(tgtD, kw);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('life_hub_update'));
          }

          finalReply = `${response.reply_message}\n\n✅ ${srcD} ${kw} 일정이 ${tgtD}로 성공적으로 이동/연기되었습니다! (기존 일정 업데이트 완료)`;
          showToast(`✅ ${kw} 일정이 ${tgtD}로 이동되었습니다!`, 'success');
          receipts = buildReceipts('LIFE');
        } else {
          const dateRangeInfo = extractDateRangeFromKoreanText(text);
          const naturalDate = extractDateFromKoreanText(text);
          const isExpense = response.payload?.sub_type === 'expense' || /원|식비|결제|지출/.test(text);
          const isTodo = response.payload?.sub_type === 'todo' || /할 일|투두/.test(text);
          const isVacation = /연가|휴가|반차|월차|휴무/.test(text);

          const cleanedTitle = dateRangeInfo.isRange ? dateRangeInfo.cleanTitle : cleanTaskTitle(text);
          const taskTitle = (response.payload?.title && response.payload.title !== text)
            ? response.payload.title
            : cleanedTitle;
          const taskIntent = isExpense ? 'expense' : isTodo ? 'todo' : 'schedule';
          const suggestedIcon = isVacation ? '🌴'
            : /치과|병원|진료|검진/.test(text) ? '🏥'
            : isExpense ? '💰'
            : isTodo ? '⚡'
            : '📅';

          // 기간 일정이면 포함된 모든 날짜 리스트, 단일 일정이면 추출된 날짜 사용
          const targetDates = dateRangeInfo.isRange && dateRangeInfo.dateList.length > 0
            ? dateRangeInfo.dateList
            : [naturalDate.isExplicitDate ? naturalDate.dateStr : (response.payload?.date || naturalDate.dateStr)];

          const routedTasks: RoutedNotionTask[] = targetDates.map((dStr, idx) => ({
            id: `task-${Date.now()}-${idx}`,
            title: taskTitle,
            intent: taskIntent,
            targetDbHint: isExpense ? '가계부/지출 DB' : isTodo ? '할 일/체크리스트 DB' : '일정/캘린더 DB',
            summary: text,
            suggestedIcon,
            properties: {
              '일정': dStr,
              '날짜': dStr,
              '분류': isExpense ? '지출' : isTodo ? '할 일' : '일정',
              '상태': '미완료',
              ...(isExpense && response.payload?.amount ? { '금액': response.payload.amount } : {}),
            },
          }));

          const targetResource = createdNotionResource || (notionParentPageId ? {
            pageId: notionParentPageId,
            pageUrl: `https://notion.so/${notionParentPageId.replace(/-/g, '')}`,
            pageTitle: '노션 부모 페이지',
            databases: [],
            createdAt: new Date().toISOString(),
          } : null);

          let dispatchResult = { successCount: 0, pageUrls: [] as string[], errors: [] as string[] };
          if (notionApiKey) {
            dispatchResult = await dispatchRoutedTasksToNotion(routedTasks, notionApiKey, targetResource);
          }

          const record: QuickCaptureRecord = {
            id: `qc-${Date.now()}`,
            timestamp: Date.now(),
            mode: 'voice',
            rawContent: text,
            correctedSummary: text,
            tasks: routedTasks,
            status: notionApiKey && dispatchResult.successCount > 0 ? 'sent' : 'local_saved',
            notionPageUrls: dispatchResult.pageUrls,
          };
          saveQuickCaptureRecord(record);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('life_hub_update'));
          }

          if (notionApiKey && dispatchResult.successCount > 0) {
            finalReply = `${response.reply_message}\n\n✅ 노션 클라우드 & 라이프 허브 연동 완료`;
            showToast('✅ 노션과 라이프 허브에 등록되었습니다!', 'success');
          }

          receipts = buildReceipts('LIFE');
        }
      } else if (effectiveIntent === 'BUILDER' || response.payload?.db_schema || isBuilderChipActive || hasMediaAttachment) {
        receipts = buildReceipts('BUILDER');
        setIsViewingCurationHub(false);

        // [다중 첨부 엑셀 데이터 100% 직행 추출] 각 파일별 시트명, 컬럼, 샘플 행 파싱
        const extractedAttachedSchemas: any[] = [];
        currentFiles.forEach((file) => {
          if (file.parsedContent) {
            const tableHeaderMatch = file.parsedContent.match(/\|\s*([^\n\r]+)\s*\|\s*\n\s*\|\s*[-|\s]+\|/);
            if (tableHeaderMatch) {
              const headerLine = tableHeaderMatch[1];
              const rawCols = headerLine
                .split('|')
                .map((c) => c.trim())
                .filter((c) => c && !c.startsWith('__EMPTY') && !/^열_\d+$/i.test(c));
              if (rawCols.length > 0) {
                const properties = rawCols.map((colName, idx) => {
                  let type: any = 'text';
                  if (idx === 0) type = 'title';
                  else if (/일자|날짜|일시|시간|시각|기한|마감/i.test(colName)) type = 'date';
                  else if (/상태|진행|결과|통신|현황/i.test(colName)) type = 'status';
                  else if (/전기|수도|가스|온수|난방|지침|사용량|금액|비용|가격|단가|수량|점수|율/i.test(colName)) type = 'number';
                  else if (/담당|책임|관리자|작성자|조치자|민원인/i.test(colName)) type = 'person';
                  else if (/동|호|구분|분류|타입|종류|유형|위치|차수|원인/i.test(colName)) type = 'select';
                  return { name: colName, type };
                });

                const sampleRows: Record<string, any>[] = [];
                const linesAfter = file.parsedContent.split(/\|\s*[-|\s]+\|/)[1] || '';
                const rowLines = linesAfter.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|') && !l.includes('생략'));
                rowLines.slice(0, 15).forEach((rl) => {
                  const cells = rl.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
                  if (cells.length > 0) {
                    const rowObj: Record<string, any> = {};
                    rawCols.forEach((col, cIdx) => {
                      rowObj[col] = cells[cIdx] || '';
                    });
                    sampleRows.push(rowObj);
                  }
                });

                const baseName = file.name.replace(/\.[^.]+$/, '').trim();
                const cleanDbName = `📋 ${baseName || '데이터'} 마스터 DB`;

                extractedAttachedSchemas.push({
                  name: cleanDbName,
                  db_name: cleanDbName,
                  properties,
                  sample_rows: sampleRows.length > 0 ? sampleRows : undefined,
                });
              }
            }
          }
        });

        // 중복 방지 병합
        const mergedDbSchemas: any[] = [...extractedAttachedSchemas];
        const apiSchemas = (response.payload?.db_schema as any[]) || [];
        apiSchemas.forEach((apiS) => {
          const sName = apiS.name || apiS.db_name;
          if (!mergedDbSchemas.some((m) => (m.name || m.db_name) === sName)) {
            mergedDbSchemas.push(apiS);
          }
        });

        receipts = buildReceipts('BUILDER');
        setIsViewingCurationHub(false);

        let targetTemplate: NotionTemplate;
        if (response.payload?.preset_key && PRESET_TEMPLATES[response.payload.preset_key]) {
          targetTemplate = normalizeTemplatePayload(PRESET_TEMPLATES[response.payload.preset_key])!;
        } else {
          // AI 오케스트레이터 payload 기반 동적 템플릿 즉석 빌드
          const allAttachedNames = currentFiles.map((a) => a.name).join(' ');
          const fallbackTopic = pureText || (allAttachedNames ? allAttachedNames.replace(/\.[^.]+$/, '') : '') || '새 맞춤형 워크스페이스';
          const rawTopic = (response.payload?.template_topic as string) || fallbackTopic;
          const rawTitle = (response.payload?.suggested_title as string) || `${fallbackTopic} AI 템플릿`;
          const sanitizedTopic = sanitizeTemplateTitle(rawTopic, fallbackTopic);
          const sanitizedTitle = sanitizeTemplateTitle(rawTitle, fallbackTopic);

          const built = buildDynamicTemplateFromPayload({
            topic: sanitizedTopic,
            title: sanitizedTitle,
            initialPrompt: text,
            dbSchemas: mergedDbSchemas.length > 0 ? mergedDbSchemas : undefined,
            formulas: response.payload?.formulas as any[],
            valueAdd: response.payload?.value_add as string[],
            complexity: response.payload?.complexity as string
          });
          targetTemplate = normalizeTemplatePayload(built)!;
        }

        if (targetTemplate) {
          generatedTemplateForMsg = targetTemplate;
          setCurrentTemplate(targetTemplate);

          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const draftPayload = {
            template: targetTemplate,
            savedAt: Date.now(),
            timeString: timeStr,
          };
          try {
            localStorage.setItem('notion_architect_draft_template', JSON.stringify(draftPayload));
            localStorage.setItem('notion_template_vault_draft', JSON.stringify(targetTemplate));
            localStorage.setItem('notion_builder_draft', JSON.stringify(targetTemplate));
          } catch (e) {
            console.warn('Failed to save template draft:', e);
          }

          try {
            saveArchivedTemplate({
              id: `created-tpl-${Date.now()}`,
              title: targetTemplate.title,
              description: targetTemplate.description || '',
              icon: targetTemplate.icon || '✨',
              cover_url: targetTemplate.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
              tags: ['#AI맞춤생성', '#채팅요청', '#NotionArchitect'],
              templateData: targetTemplate,
              source: 'created',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          } catch (e) {
            console.warn('Failed to auto-archive created template:', e);
          }
        }

        finalReply = `${response.reply_message}\n\n✨ [Notion Architect AI 동적 템플릿 제작 완결]\n요청하신 "${targetTemplate.title}" 템플릿의 스키마와 수식이 성공적으로 설계되었습니다.`;
        showToast(`✨ [${targetTemplate.title}] 템플릿이 캔버스에 즉시 투영되었습니다!`, 'success');
        
        // 템플릿 빌더 라이브 캔버스로 화면 즉각 전환 (딜레이 없이 자동 라우팅)
        setCurrentView('builder');
      } else if (effectiveIntent === 'DEVLAB') {
        receipts = buildReceipts('DEVLAB');
        if (response.payload?.sheetsData) {
          try {
            localStorage.setItem('office_sheets_data', JSON.stringify(response.payload.sheetsData));
          } catch {}
        }
        if (response.redirect_url === '/devlab' && !isBuilderChipActive && !hasMediaAttachment && !isTemplateRelated) {
          setTimeout(() => {
            setCurrentView('devlab');
            showToast('📊 스마트 시트 라이브 캔버스로 자동 전환되었습니다.', 'info');
          }, 300);
        }
      }

      // ── 진단 카드: 실제 에러/오류 문의 키워드가 명시적으로 포함된 경우에만 발동 ──────
      let diagnostic: DiagnosticResult | undefined;
      const isExplicitErrorPrompt = /에러|오류|버그|crash|error|exception|fail|고장|디버그/i.test(text);
      const isErrorIntent =
        response.intent === 'DEVLAB' &&
        response.payload?.sub_type === 'troubleshooting' &&
        isExplicitErrorPrompt;

      if (isErrorIntent && response.payload) {
        diagnostic = payloadToDiagnostic(response.payload, text.slice(0, 40));
      }

      const aiMsg: OmniMessage = {
        id: `omni-ai-${Date.now()}`,
        role: 'assistant',
        content: finalReply,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        redirect_url: response.redirect_url,
        receipts,
        diagnostic,
        generatedTemplateData: generatedTemplateForMsg,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('[OmniChatBar] Error sending message:', err);
      showToast('요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
      setMessages(prev => [...prev, {
        id: `omni-err-${Date.now()}`,
        role: 'assistant',
        content: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: 'CHAT',
      }]);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      isLoadingRef.current = false;
      setInputValue('');
      baseTextRef.current = '';
      if (inputRef.current) inputRef.current.value = '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, attachedFiles, messages, apiKey, authUser, notionApiKey, notionParentPageId, createdNotionResource, showToast]);

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentPlaceholder = CHAT_MODES.find(m => m.key === activeMode)?.placeholder || '무엇이든 물어보세요 — 일정·지출·템플릿·개발 등 (Enter 전송)';
  const hasMessages = messages.length > 0;

  // ── 의도 배지 색상 ────────────────────────────────────────────────────────
  const intentBadge = (intent?: string) => {
    if (!intent || intent === 'CHAT') return null;
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
      BUILDER: {
        label: '빌더 액션',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        icon: <Sparkles className="w-2.5 h-2.5" />,
      },
      LIFE: {
        label: '라이프 허브 액션',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        icon: <Calendar className="w-2.5 h-2.5" />,
      },
      DEVLAB: {
        label: '오피스 스튜디오 액션',
        cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
        icon: <FileText className="w-2.5 h-2.5" />,
      },
    };
    const meta = map[intent];
    if (!meta) return null;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.cls}`}>
        {meta.icon}
        <span>{meta.label}</span>
      </span>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      {/* 숨겨진 파일 선택 Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* ── 링크 입력 모달 ─────────────────────────────────────────────────── */}
      {showLinkModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-xl border border-slate-200 dark:border-neutral-700">
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>웹 링크 / 참고 URL 첨부</span>
            </h4>
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://example.com/notion-page"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-700"
              >
                취소
              </button>
              <button
                onClick={addLinkAttachment}
                className="px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                첨부
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 채팅 피드 팝업 (메시지가 있을 때 + 확장 상태) ──────────────────── */}
      {isExpanded && hasMessages && (
        <div
          className="
            pointer-events-auto
            w-full max-w-2xl mx-auto mb-1
            bg-slate-50/95 dark:bg-neutral-900/95
            border border-slate-200 dark:border-neutral-700
            rounded-t-2xl shadow-2xl
            backdrop-blur-md
            flex flex-col
            overflow-hidden
            max-h-[55vh]
          "
        >
          {/* 피드 헤더 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/80 dark:border-neutral-700/80 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">노아(NOA) 챗 기록</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSessionAndCanvas}
                  className="text-[10px] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-medium cursor-pointer"
                  title="대화 기록 및 템플릿 캔버스 완전 초기화 (Clean Wipe)"
                >
                  초기화
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                aria-label="채팅 접기"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 메시지 피드 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* 아바타 */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 text-white'
                  }`}>
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                    {/* 말풍선 */}
                    <div className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-tr-sm'
                        : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-700 rounded-tl-sm shadow-xs'
                    }`}>
                      {msg.content}
                    </div>

                    {/* 인텐트 배지 */}
                    {!isUser && intentBadge(msg.intent)}

                    {/* ── 진단 카드 (DEVLAB 에러 인텐트 시 표시) ───────────── */}
                    {!isUser && msg.diagnostic && (
                      <div className="w-full mt-1 max-w-[340px] sm:max-w-[480px]">
                        <SelfDiagnosticCard
                          diagnostic={msg.diagnostic}
                          timestamp={msg.timestamp}
                        />
                      </div>
                    )}

                    {/* ── 웹 크롤러 수급 실시간 액션 수신증 카드 (Step 3 요구사항) ─────────── */}
                    {!isUser && msg.payload?.is_crawler_pipeline && (
                      <div className="w-full mt-2 p-3 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 animate-fadeIn shadow-xs">
                        <div className="flex items-center justify-between text-xs font-black text-blue-900 dark:text-blue-300">
                          <span className="flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                            <span>🌐 웹 크롤링 수급 액션 수신증</span>
                          </span>
                          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
                            50개 항목 수집
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {msg.payload.crawler_steps?.map((step: string, sIdx: number) => (
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
                    {!isUser && msg.payload?.is_notion_sync_card && (
                      <div className="w-full mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white space-y-2.5 animate-fadeIn shadow-md">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            <span>⚡ 노션 마스터 DB 적재 완결</span>
                          </span>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
                            SYNCED
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-100 font-medium">
                          AI 오피스 라이브 문서 데이터가 노션 통합 허브 DB에 성공적으로 적재되었습니다.
                        </p>
                        {msg.payload.notion_url && (
                          <a
                            href={msg.payload.notion_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-slate-100 text-xs font-extrabold transition cursor-pointer shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>[🔗 노션 페이지 바로가기]</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* ── 실행 영수증 카드 ─────────────────────────────────── */}
                    {!isUser && msg.receipts && msg.receipts.length > 0 && (
                      <div className="space-y-1 w-full">
                        {msg.receipts.map((receipt) => (
                          <div
                            key={receipt.id}
                            className={`
                              flex items-center space-x-2
                              px-3 py-1.5 rounded-xl
                              border text-[11px] font-semibold
                              ${receipt.bgColor} ${receipt.borderColor} ${receipt.color}
                              animate-fadeIn
                            `}
                          >
                            <Construction className="w-3 h-3 shrink-0 opacity-70" />
                            <span>{receipt.emoji} {receipt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── AI 맞춤 동적 템플릿 결과물 카드 & 노션 즉시 생성 ────── */}
                    {!isUser && msg.generatedTemplateData && (
                      <div className="w-full mt-2 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-pink-50/50 dark:from-neutral-800 dark:via-neutral-850 dark:to-neutral-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-xl sm:text-2xl">{msg.generatedTemplateData.icon || '✨'}</span>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                {msg.generatedTemplateData.title}
                              </h4>
                              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                AI 동적 설계 완료 • DB {msg.generatedTemplateData.databases?.length || 1}개 연동
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                            생성 완결
                          </span>
                        </div>

                        {/* 주요 태그 */}
                        <div className="flex flex-wrap gap-1">
                          {msg.generatedTemplateData.tags?.map((tag: string, tIdx: number) => (
                            <span key={tIdx} className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 노션 원클릭 퍼블리시 & 캔버스 편집 버튼 */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!notionApiKey || !notionParentPageId) {
                                showToast('노션 연동 토큰과 부모 페이지 ID 등록이 필요합니다.', 'info');
                                setIsNotionSettingsModalOpen(true);
                                return;
                              }
                              try {
                                showToast('🚀 노션 워크스페이스에 페이지/DB를 생성합니다...', 'info');
                                const targetToDeploy = currentTemplate || msg.generatedTemplateData!;
                                const res = await createNotionTemplateInWorkspace(
                                  targetToDeploy,
                                  notionApiKey,
                                  notionParentPageId,
                                  (step, pct) => showToast(`[${pct}%] ${step}`, 'info')
                                );
                                showToast(`🎉 [${res.pageTitle}] 노션 생성이 완료되었습니다!`, 'success');
                                if (res.pageUrl) window.open(res.pageUrl, '_blank');
                              } catch (e: any) {
                                showToast(`노션 생성 실패: ${e.message}`, 'error');
                              }
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>🚀 노션 계정에 원클릭 자동 생성</span>
                          </button>

                          <button
                            onClick={() => {
                              setCurrentTemplate(msg.generatedTemplateData!);
                              setCurrentView('builder');
                              showToast('🎨 템플릿 빌더 캔버스로 이동했습니다.', 'info');
                            }}
                            className="py-1.5 px-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>캔버스 보기</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── 작업실 캔버스 이동 버튼 ──────────────────────────── */}
                    {!isUser && msg.redirect_url && (
                      <button
                        onClick={() => {
                          const urlKey = msg.redirect_url;
                          if (!urlKey) return;
                          const viewMap: Record<string, any> = {
                            '/builder': 'builder',
                            '/life': 'life',
                            '/devlab': 'devlab',
                            '/medialab': 'media_lab',
                            '/media_lab': 'media_lab',
                          };
                          const targetView = viewMap[urlKey];
                          if (targetView) {
                            setCurrentView(targetView);
                            showToast(`${targetView === 'builder' ? '✨ 템플릿 마스터' : targetView === 'life' ? '👔 라이프 비서' : targetView === 'devlab' ? '📄 AI 오피스 스튜디오 (PPT/슬라이드)' : '🎨 AI 미디어 랩'} 캔버스로 이동했습니다.`, 'info');
                          }
                        }}
                        className="
                          mt-1 flex items-center space-x-1.5
                          px-3 py-1.5 rounded-xl
                          text-xs font-bold
                          bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                          hover:from-blue-700 hover:to-indigo-700
                          transition-all cursor-pointer shadow-xs active:scale-95
                        "
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>
                          {msg.redirect_url === '/devlab' 
                            ? '📄 AI 오피스 스튜디오 (PPT/슬라이드) 캔버스 열기' 
                            : '✨ 해당 작업실 캔버스로 즉시 이동'}
                        </span>
                      </button>
                    )}

                    <span className="text-[10px] text-neutral-400 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl px-3.5 py-2 border border-slate-200 dark:border-neutral-700 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-150" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 pl-1">의도 분석 및 라우팅 중...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── 옴니 챗 입력바 ── Google AI Studio 감성 프로스트 글래스 & 1px 헤어라인 보더 ─────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          pointer-events-auto
          w-full max-w-2xl mx-auto
          bg-white/70 dark:bg-[#111214]/70
          backdrop-blur-md
          border border-zinc-200/80 dark:border-white/10
          rounded-2xl
          shadow-lg shadow-black/5 dark:shadow-none
          px-3.5 py-3
          mb-14 md:mb-0
          transition-all duration-200
          ${isDragOver ? 'ring-2 ring-amber-400/60 bg-amber-50/70 dark:bg-amber-950/40 border-amber-400' : ''}
        `}
      >
        {/* 숨겨진 1차 accept 필터링 파일 탐색기 input 태그 (이미지 및 문서 화이트리스트 확장) */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          multiple
          accept=".png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.docx,.pdf,.hwpx,.txt,.md"
          className="hidden"
        />

        {/* ── 구형 한글(.hwp) 변환 가이드 호박색(Amber) 경고 모달 ────────────────── */}
        {hwpAlertModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-amber-50 dark:bg-neutral-900 border-2 border-amber-500 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-amber-700 dark:text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-amber-900 dark:text-amber-300">
                    구형 한글(.hwp) 변환 가이드
                  </h3>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    {hwpAlertModal.fileName ? `[${hwpAlertModal.fileName}] 파일 감지됨` : '파일 첨부 제한'}
                  </p>
                </div>
              </div>

              <div className="bg-amber-100/70 dark:bg-amber-950/50 p-3.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed border border-amber-300 dark:border-amber-800/60">
                ⚠️ 구형 한글(.hwp) 파일은 보안 바이너리 규격으로 웹에서 직접 분석할 수 없습니다. 한글 프로그램에서 <span className="underline font-bold text-amber-900 dark:text-amber-100">[파일 -&gt; PDF로 저장하기]</span> 또는 <span className="underline font-bold text-amber-900 dark:text-amber-100">[다른 이름으로 저장 -&gt; Word(DOCX)]</span>로 변환하여 첨부해 주세요.
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setHwpAlertModal({ open: false, fileName: '' })}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md cursor-pointer active:scale-95"
                >
                  확인 (첨부 취소)
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* ── 4대 모드 퀵 프리셋 칩 (Pill Chips) ── */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar py-0.5">
          {CHAT_MODES.map((mode) => {
            const isActive = activeMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => handleModeClick(mode.key)}
                className={`
                  shrink-0 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer
                  border
                  ${isActive
                    ? mode.activeClass
                    : 'bg-white/70 dark:bg-neutral-800/70 border-slate-200/90 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }
                `}
              >
                <span className="text-xs">{mode.emoji}</span>
                <span className="font-medium text-[11px]">{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 캡처 이미지 미니 썸네일 뱃지 목록 [ 🖼️ 캡처이미지.png ✕ ] (토스트 팝업 없이 조용히 표시) ── */}
        {attachedImages.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1">
            {attachedImages.map((img) => (
              <div
                key={img.id}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 shadow-2xs backdrop-blur-xs transition group"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-4 h-4 rounded object-cover border border-zinc-300 dark:border-zinc-700"
                />
                <span className="truncate max-w-[140px] text-[11px] font-medium">{img.name}</span>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="ml-0.5 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                  title="이미지 삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 첨부 파일 칩 노출 영역 */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 px-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={file.id || idx}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] border transition ${
                  file.error
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    : file.parsedContent
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium'
                    : 'bg-slate-200 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {file.type === 'link' ? (
                  <LinkIcon className="w-3 h-3 text-indigo-500" />
                ) : file.isParsing ? (
                  <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 text-emerald-500" />
                )}
                <span className="max-w-[140px] truncate">{file.name}</span>
                {file.sizeFormatted && <span className="text-[9px] opacity-70">({file.sizeFormatted})</span>}
                {file.parsedContent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline mr-1" />
                    <span>{file.summaryBadge || '파싱 완료'}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 hover:text-rose-500 rounded-full ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* 상태 인디케이터 (대기 중: 녹색 닷 ●, 작업 중: 오렌지 스피너 + "요청 처리 중..." 뱃지) */}
          {isLoading ? (
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">요청 처리 중...</span>
            </div>
          ) : (
            <button
              onClick={() => setIsNotionSettingsModalOpen(true)}
              title={notionApiKey ? '노션 연동됨' : '노션 미연동 — 클릭하여 설정'}
              className="shrink-0 flex items-center"
            >
              <span className={`block w-2.5 h-2.5 rounded-full ${notionApiKey ? 'bg-emerald-500 shadow-xs' : 'bg-amber-400 animate-pulse'}`} />
            </button>
          )}

          {/* 클립(📎) 파일/링크 첨부 버튼 */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowLinkModal(true);
              }}
              disabled={isLoading || isParsingFiles}
              title="파일/이미지 첨부 (화이트리스트: 이미지, 엑셀, 워드, PDF, 텍스트)"
              className="
                w-9 h-9 flex items-center justify-center
                rounded-xl
                bg-zinc-100 dark:bg-zinc-800
                text-zinc-500 dark:text-zinc-400
                hover:bg-zinc-200 dark:hover:bg-zinc-700
                hover:text-zinc-900 dark:hover:text-zinc-100
                transition cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* 텍스트 입력창 (Ctrl + V 클립보드 이미지 캡처 감지) */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => hasMessages && setIsExpanded(true)}
            placeholder={
              isParsingFiles
                ? '⏳ 첨부 파일 데이터를 정밀 분석하고 있습니다... 잠시만 기다려주세요.'
                : isLoading
                ? '🧠 Gemini가 요청을 분석하고 화면을 업데이트하고 있습니다...'
                : isListening
                ? '🎙️ 실시간 음성 인식 중... (말씀을 멈춰도 유지됩니다)'
                : attachedImages.length > 0
                ? '📸 캡처 이미지 분석 요청: 변경할 스키마 지시를 입력하세요...'
                : currentPlaceholder
            }
            disabled={isLoading}
            className="
              flex-1 min-w-0
              bg-zinc-100/80 dark:bg-zinc-800/80
              text-zinc-900 dark:text-zinc-100
              text-xs sm:text-sm
              rounded-xl px-3.5 py-2.5
              border border-zinc-200/60 dark:border-white/10
              focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500
              placeholder:text-zinc-400 dark:placeholder:text-zinc-500
              transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          />

          {/* 마이크 버튼 — Push-to-Dictate 단방향 연속 음성 버퍼 (빨간색 Red Pulse 깜빡임 피드백) */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            title={isListening ? '음성 인식 중단' : '음성으로 연속 입력 (Push-to-Dictate STT)'}
            className={`
              w-10 h-10 min-w-[40px] shrink-0
              flex items-center justify-center
              rounded-xl transition-all duration-150 cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              ${isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-950/50 shadow-md shadow-rose-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }
            `}
          >
            {isListening ? (
              <Mic className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* 입력창 및 첨부파일 완전 초기화 'X' 버튼 */}
          {(inputValue.trim() || attachedFiles.length > 0 || attachedImages.length > 0) && (
            <button
              type="button"
              onClick={handleClearInput}
              className="
                w-10 h-10 min-w-[40px] shrink-0
                flex items-center justify-center
                rounded-xl transition
                bg-zinc-100 dark:bg-zinc-800
                text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400
                hover:bg-rose-50 dark:hover:bg-rose-950/40
                cursor-pointer
              "
              title="입력 내용 및 첨부파일 지우기"
              aria-label="입력 초기화"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* 전송 버튼 — 호버 및 액티브 인터랙션 고급화 */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputValue.trim() && attachedFiles.length === 0 && attachedImages.length === 0) || isLoading || isParsingFiles}
            className="
              w-10 h-10 min-w-[40px] shrink-0
              flex items-center justify-center
              rounded-xl transition-all duration-150 active:scale-95 cursor-pointer
              bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900
              hover:bg-zinc-800 dark:hover:bg-white
              hover:shadow-md active:shadow-xs
              disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
              shadow-xs font-bold
            "
            title="전송 (Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>

          {/* 채팅 기록 토글 버튼 (메시지 있을 때만 표시) */}
          {hasMessages && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="
                shrink-0 flex items-center space-x-1
                px-2.5 py-1.5 rounded-xl
                bg-zinc-100 dark:bg-zinc-800
                text-xs font-medium text-zinc-500 dark:text-zinc-400
                hover:bg-zinc-200 dark:hover:bg-zinc-700
                transition cursor-pointer
              "
              title="채팅 기록 보기"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="text-[11px]">{messages.length}</span>
            </button>
          )}

          {/* 닫기 버튼 (확장 상태) */}
          {isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="shrink-0 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="피드 접기"
              title="피드 접기"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NoaChatBar = OmniChatBar;
export default OmniChatBar;

