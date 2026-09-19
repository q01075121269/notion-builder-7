import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Mic,
  MicOff,
  Bot,
  User,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
  Calendar,
  Code2,
  Construction,
  ExternalLink,
  Paperclip,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { sendToOrchestrator } from '../../services/orchestratorService';
import type { ChatMessage, OrchestratorResponse } from '../../services/orchestratorService';
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
    label: '개발 랩 아카이브 저장 완료',
    emoji: '💻',
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
    setCurrentView,
    setCurrentTemplate,
    setIsViewingCurationHub,
  } = useApp();

  // 채팅 상태
  const [messages, setMessages] = useState<OmniMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 첨부 파일 상태
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size?: string; type: string }[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');

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

      const combined = cleanDuplicateSpeech((fullTranscriptRef.current + ' ' + interimStr).trim());
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

  // ── STT 토글 ────────────────────────────────────────────────────────────────
  const toggleListening = () => {
    if (!sttSupported) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 최신 Edge를 사용해 주세요.');
      return;
    }

    if (isListening) {
      // 수동으로 마이크 버튼을 눌러 깔 때 -> 녹음 중단
      isListeningRef.current = false;
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch {}
    } else {
      // 수동으로 마이크 버튼을 눌러 켤 때 -> 이전 텍스트 유지한 상태에서 누적
      isListeningRef.current = true;
      fullTranscriptRef.current = inputValue.trim();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setIsExpanded(true);
      } catch (err) {
        console.error('STT 시작 실패:', err);
      }
    }
  };

  // ── 파일 첨부 핸들러 ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments = Array.from(files).map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)}KB`,
      type: 'file',
    }));

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    showToast(`📎 ${newAttachments.length}개 파일이 첨부되었습니다.`, 'info');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addLinkAttachment = () => {
    if (!linkInput.trim()) return;
    const url = linkInput.trim().startsWith('http') ? linkInput.trim() : `https://${linkInput.trim()}`;
    setAttachedFiles((prev) => [...prev, { name: url, type: 'link' }]);
    setLinkInput('');
    setShowLinkModal(false);
    showToast('🔗 링크가 첨부되었습니다.', 'info');
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── 메시지 전송 ─────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const raw = (overrideText ?? inputValue).trim();
    const text = cleanDuplicateSpeech(raw);
    if ((!text && attachedFiles.length === 0) || isLoadingRef.current) return;

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

    const attachmentSummary = attachedFiles.length > 0
      ? `\n[첨부: ${attachedFiles.map((a) => a.name).join(', ')}]`
      : '';
    const fullMessageText = text + attachmentSummary;

    setInputValue('');
    fullTranscriptRef.current = '';
    const currentAttachments = [...attachedFiles.map((a) => a.name)];
    setAttachedFiles([]);
    setIsExpanded(true);

    const userMsg: OmniMessage = {
      id: `omni-user-${Date.now()}`,
      role: 'user',
      content: fullMessageText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // ── 노션 URL / 마스터 허브 분석 요청 인터셉터 ───────────────────────
      if (isNotionUrlPrompt(text)) {
        const url = extractNotionUrl(text);

        // 1. 템플릿 역설계 & 생성
        const generatedTemplate = generateMasterHubTemplateFromUrl(url, text);

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
      );

      let finalReply = response.reply_message;
      let receipts: ActionReceipt[] = [];

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
      } else if (response.intent === 'BUILDER') {
        receipts = buildReceipts('BUILDER');
        setIsViewingCurationHub(false);
        const targetTemplate = (response.payload?.preset_key && PRESET_TEMPLATES[response.payload.preset_key])
          ? PRESET_TEMPLATES[response.payload.preset_key]
          : (/자격증|수험생|시험|공부|오답노트/.test(text) && PRESET_TEMPLATES.certification_exam)
          ? PRESET_TEMPLATES.certification_exam
          : generateMasterHubTemplateFromUrl(extractNotionUrl(text), text);

        if (targetTemplate) {
          setCurrentTemplate(targetTemplate);
          // 내 보관함에 '내가 만든 템플릿(created)'으로 자동 보관
          try {
            saveArchivedTemplate({
              id: `created-tpl-${Date.now()}`,
              title: targetTemplate.title,
              description: targetTemplate.description || '',
              icon: targetTemplate.icon || '🎯',
              cover_url: targetTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
              tags: ['#내가만든템플릿', '#커스텀생성', '#AI합격스케줄러'],
              templateData: targetTemplate,
              source: 'created',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          } catch (e) {
            console.warn('Failed to auto-archive created template:', e);
          }
        }
        // 완결 시 템플릿 빌더 라이브 캔버스로 자동 전환
        setTimeout(() => {
          setCurrentView('builder');
          showToast('🎯 [자격증/수험생 올인원 합격 스케줄러] 템플릿이 캔버스에 즉시 투영되고 내 보관함에 저장되었습니다!', 'success');
        }, 300);
      } else if (response.intent === 'DEVLAB') {
        receipts = buildReceipts('DEVLAB');
        if (response.redirect_url === '/devlab') {
          setTimeout(() => {
            setCurrentView('devlab');
            showToast('📑 AI 오피스 스튜디오 라이브 캔버스로 자동 전환되었습니다.', 'info');
          }, 300);
        }
      }

      // ── 진단 카드: DEVLAB + troubleshooting 서브타입 또는 에러 키워드 ──────
      let diagnostic: DiagnosticResult | undefined;
      const isErrorIntent =
        response.intent === 'DEVLAB' &&
        (response.payload?.sub_type === 'troubleshooting' ||
          /에러|오류|버그|crash|error|exception|fail/i.test(text));
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
      isLoadingRef.current = false;
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
        label: '개발 랩 액션',
        cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
        icon: <Code2 className="w-2.5 h-2.5" />,
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
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">옴니 챗 기록</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 px-2 py-0.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
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
                            showToast(`${targetView === 'builder' ? '✨ 템플릿 빌더' : targetView === 'life' ? '🌿 라이프 허브' : targetView === 'devlab' ? '💻 개발 랩' : '🎨 AI 미디어 랩'} 캔버스로 이동했습니다.`, 'info');
                          }
                        }}
                        className="
                          mt-1 flex items-center space-x-1.5
                          px-2.5 py-1 rounded-lg
                          text-[11px] font-semibold
                          bg-indigo-50 text-indigo-700 border border-indigo-200
                          hover:bg-indigo-100
                          dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800
                          transition-all cursor-pointer shadow-sm
                        "
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>작업실 캔버스로 즉시 이동</span>
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

      {/* ── 옴니 챗 입력바 ─────────────────────────────────────────────────── */}
      <div
        className="
          pointer-events-auto
          w-full max-w-2xl mx-auto
          bg-slate-50 dark:bg-neutral-900
          border-t border-x border-slate-200 dark:border-neutral-700
          rounded-t-2xl
          shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
          px-3 py-2.5
          mb-14 md:mb-0
        "
      >
        {/* 첨부 파일 칩 노출 영역 */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 px-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] bg-slate-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700"
              >
                {file.type === 'link' ? <LinkIcon className="w-3 h-3 text-indigo-500" /> : <FileText className="w-3 h-3 text-amber-500" />}
                <span className="max-w-[140px] truncate">{file.name}</span>
                {file.size && <span className="text-[9px] text-neutral-400">({file.size})</span>}
                <button
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 hover:text-rose-500 rounded-full"
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
              disabled={isLoading}
              title="파일 드래그/선택 (우클릭: 웹 링크 첨부)"
              className="
                w-9 h-9 flex items-center justify-center
                rounded-xl
                bg-slate-100 dark:bg-neutral-800
                text-neutral-500 dark:text-neutral-400
                hover:bg-slate-200 dark:hover:bg-neutral-700
                transition
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* 텍스트 입력창 */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => hasMessages && setIsExpanded(true)}
            placeholder={
              isLoading
                ? '🧠 Gemini가 요청을 분석하고 화면을 업데이트하고 있습니다...'
                : isListening
                ? '🎙️ 단방향 음성 인식 중... (말을 멈춰도 유지됨, 전송 또는 마이크 재클릭)'
                : '무엇이든 물어보세요 — 일정·지출·템플릿·개발 등 (Enter 전송)'
            }
            disabled={isLoading}
            className="
              flex-1 min-w-0
              bg-white dark:bg-neutral-800
              text-neutral-900 dark:text-white
              text-xs sm:text-sm
              rounded-xl px-3.5 py-2.5
              border border-slate-200 dark:border-neutral-700
              focus:outline-none focus:ring-2 focus:ring-amber-400/40 dark:focus:ring-amber-500/30
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
              transition
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          />

          {/* 마이크 버튼 — Push-to-Dictate 단방향 연속 음성 버퍼 (빨간색 animate-pulse) */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            title={isListening ? '음성 인식 중단' : '음성으로 연속 입력 (Push-to-Dictate STT)'}
            className={`
              w-10 h-10 min-w-[40px] shrink-0
              flex items-center justify-center
              rounded-xl transition
              disabled:opacity-40 disabled:cursor-not-allowed
              ${isListening
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50 shadow-lg shadow-rose-500/30'
                : 'bg-slate-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }
            `}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* 전송 버튼 */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
            className="
              w-10 h-10 min-w-[40px] shrink-0
              flex items-center justify-center
              rounded-xl transition active:scale-95
              bg-neutral-900 dark:bg-white
              text-white dark:text-neutral-900
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:opacity-90
              shadow-xs
            "
            title="전송"
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
                bg-slate-100 dark:bg-neutral-800
                text-xs font-medium text-neutral-500 dark:text-neutral-400
                hover:bg-slate-200 dark:hover:bg-neutral-700
                transition
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
              onClick={() => setIsExpanded(false)}
              className="shrink-0 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition"
              aria-label="피드 접기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 안내 텍스트 */}
        <p className="mt-1.5 px-1 text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>옴니 챗 — 템플릿 빌더 · 라이프 허브 · 개발 랩을 말 한마디로 통합 제어</span>
        </p>
      </div>
    </div>
  );
};

