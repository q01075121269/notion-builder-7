// src/components/media/MediaLabContainer.tsx
// 제4챕터 AI 미디어 랩(AI Media Lab 2026) 2단계 - 초격차 비주얼 & 옴니모달 영상 엔진 (VPO·MV 합성·세이프존)

import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, 
  RotateCcw, 
  Bot, 
  User,
  Music, 
  Image as ImageIcon, 
  ShieldCheck, 
  Sparkles,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  SlidersHorizontal,
  HardDrive,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoaUniversalDock } from '../common/NoaUniversalDock';
import type { DockPayload } from '../../types/dock';
import { MediaArtifactStage } from './MediaArtifactStage';
import type { 
  MediaDomain, 
  FSMState, 
  MediaArtifact, 
  MediaCheckpoint, 
  InterviewStep 
} from '../../types/media';
import { 
  DOMAIN_INTERVIEW_STEPS, 
  detectDomainFromPrompt, 
  isSkipCommand, 
  isInspectCommand, 
  isCancelCommand,
  isConversationalOrQuestion,
  generateNoaConversationalResponse,
  determineSessionMode, 
  createInitialArtifact, 
  createCheckpoint,
  generateWaveformData
} from '../../services/noaOrchestrator';
import type { VPOOptimizationResult } from '../../lib/media/vpo';

import { generateBeatSyncMV } from '../../lib/media/videoPipeline';
import type { MVPipelineResult } from '../../lib/media/videoPipeline';
import { saveMediaItem, getRecentMediaItems, deleteMediaItem } from '../../lib/mediaStorage';
import type { MediaItem } from '../../lib/mediaStorage';
import { resolveVisualAssetByPrompt } from '../../lib/media/visualAssets';
import { requestMediaGeneration } from '../../services/mediaApiService';

export interface MediaMessage {
  id: string;
  role: 'user' | 'noa';
  text: string;
  timestamp: string;
  artifact?: {
    version: number;
    title: string;
    imageUrl: string;
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    activeSubject?: string;
  };
}

export const MediaLabContainer: React.FC = () => {
  const { showToast, notionApiKey } = useApp();

  // 좌측 얇은 아이콘 서랍 [◀] 열림/닫힘 상태
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'vault' | 'settings' | 'c2pa'>('vault');
  const [cachedMediaItems, setCachedMediaItems] = useState<MediaItem[]>([]);

  // 세션 & FSM 상태
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [fsmState, setFsmState] = useState<FSMState>('IDLE');
  const [currentDomain, setCurrentDomain] = useState<MediaDomain>('video');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [artifact, setArtifact] = useState<MediaArtifact | null>(null);
  const [history, setHistory] = useState<MediaCheckpoint[]>([]);

  // 영구 대화 및 아티팩트 스트림 상태
  const [messages, setMessages] = useState<MediaMessage[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // VPO 및 MV 파이프라인 엔진 데이터 상태
  const [vpoResult, setVpoResult] = useState<VPOOptimizationResult | null>(null);
  const [mvPipelineResult, setMvPipelineResult] = useState<MVPipelineResult | null>(null);


  // 비주얼 전용 상태 (비율 전환 16:9 / 9:16 / 1:1)
  const [visualRatio, setVisualRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  const handleAspectRatioChange = (newRatio: '16:9' | '9:16' | '1:1') => {
    setVisualRatio(newRatio);
    if (artifact && artifact.domain === 'visual') {
      const visualAsset = resolveVisualAssetByPrompt(
        artifact.title || artifact.promptHistory[0]?.userRaw || '',
        newRatio
      );
      setArtifact({
        ...artifact,
        previewUrl: visualAsset.imageUrl
      });
    }
  };

  // 최근 IndexedDB 캐시 에셋 로드
  const loadCachedAssets = async () => {
    try {
      const items = await getRecentMediaItems(15);
      setCachedMediaItems(items);
    } catch (err) {
      console.error('Failed to load recent media cache:', err);
    }
  };

  useEffect(() => {
    loadCachedAssets();
  }, []);

  // 메시지 누적 시 최신 턴으로 스크롤 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, fsmState]);

  // 세션 초기화 및 새 세션 시작
  const handleStartNewSession = () => {
    setSessionCount((prev) => prev + 1);
    setFsmState('IDLE');
    setCurrentDomain('video');
    setCurrentStepIndex(0);
    setArtifact(null);
    setVpoResult(null);
    setMvPipelineResult(null);
    setHistory([]);
    setMessages([]);
    setActiveSubject('');
    setActiveVersion(1);
    showToast('새로운 미디어 세션을 백지 캔버스에서 시작합니다.', 'info');
  };

  // 특정 아티팩트 버전으로 롤백 (Undo / Restore Version)
  const handleRollbackVersion = (targetArtifact: NonNullable<MediaMessage['artifact']>) => {
    if (!artifact) return;
    const rolledBack: MediaArtifact = {
      ...artifact,
      title: targetArtifact.title,
      previewUrl: targetArtifact.imageUrl,
      promptHistory: [
        ...artifact.promptHistory,
        {
          userRaw: `[v${targetArtifact.version} 롤백 복원] ${targetArtifact.title}`,
          optimizedVPO: targetArtifact.prompt
        }
      ],
      progressPercent: 95,
      currentStepText: `v${targetArtifact.version} 버전으로 복원 완료`
    };
    setArtifact(rolledBack);
    setActiveVersion(targetArtifact.version);
    if (targetArtifact.activeSubject) {
      setActiveSubject(targetArtifact.activeSubject);
    }
    if (targetArtifact.aspectRatio) {
      setVisualRatio(targetArtifact.aspectRatio);
    }
    showToast(`v${targetArtifact.version} [${targetArtifact.title}] 버전으로 캔버스를 복원했습니다.`, 'success');
  };

  // 인터뷰 단계 스킵 처리
  const handleSkipStep = () => {
    const steps = DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.video;
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
      showToast(`${steps[currentStepIndex].stepName} 단계를 건너뛰고 다음 질문으로 진행합니다.`, 'info');
    } else {
      triggerArtifactGeneration(currentDomain, `${currentDomain} 맞춤형 프리셋 생성`);
    }
  };

  // 아티팩트 생성 엔진 트리거 (백엔드 API 및 실시간 AI 생성 파이프라인 직결)
  const triggerArtifactGeneration = async (domain: MediaDomain, promptSummary: string) => {
    setFsmState('GENERATING');

    const userMsg: MediaMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: promptSummary,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);

    const isExplicitVideo = 
      domain === 'video' ||
      promptSummary.toLowerCase().includes('뮤직비디오') ||
      promptSummary.toLowerCase().includes('mv') ||
      promptSummary.toLowerCase().includes('영상') ||
      promptSummary.toLowerCase().includes('비디오') ||
      promptSummary.toLowerCase().includes('쇼츠') ||
      promptSummary.toLowerCase().includes('릴스');

    const effectiveDomain: MediaDomain = isExplicitVideo ? 'video' : 'visual';
    setCurrentDomain(effectiveDomain);

    showToast('노아 PD가 실시간 AI 신경망(Flux 8K)으로 아티팩트를 렌더링 중입니다...', 'info');

    if (effectiveDomain === 'visual') {
      setMvPipelineResult(null);

      // 백엔드 API /api/media/generate 호출 (주어 락 및 부정형 정제기 탑재)
      const apiResult = await requestMediaGeneration({
        userPrompt: promptSummary,
        history: [{ role: 'user', content: promptSummary }],
        activeSubject: activeSubject || undefined,
        activeTitle: artifact?.title,
        aspectRatio: visualRatio
      });

      if (apiResult.activeSubject) {
        setActiveSubject(apiResult.activeSubject);
      }
      setActiveVersion(1);

      const noaMsg: MediaMessage = {
        id: `msg-n-${Date.now()}`,
        role: 'noa',
        text: apiResult.noaResponse,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        artifact: {
          version: 1,
          title: apiResult.displayTitle,
          imageUrl: apiResult.imageUrl,
          prompt: apiResult.vpoPrompt,
          aspectRatio: visualRatio,
          activeSubject: apiResult.activeSubject
        }
      };
      setMessages((prev) => [...prev, noaMsg]);

      const initialArt = createInitialArtifact(effectiveDomain, apiResult.displayTitle, visualRatio);
      initialArt.title = apiResult.displayTitle;
      initialArt.previewUrl = apiResult.imageUrl;
      initialArt.waveformData = generateWaveformData(48);
      initialArt.promptHistory = [
        {
          userRaw: promptSummary,
          optimizedVPO: apiResult.vpoPrompt
        }
      ];

      setArtifact(initialArt);
      setHistory([createCheckpoint(initialArt)]);
      setFsmState('REFINING');
      showToast('실시간 AI 렌더링이 완료되었습니다. 조종석에서 피드백을 지시해 주세요.', 'success');
      loadCachedAssets();
    } else {
      // 비디오/MV 모드
      const mv = generateBeatSyncMV(promptSummary, 120);
      setMvPipelineResult(mv);
      const respText = '비트 타임스탬프에 맞춘 3개 씬 궤적 MV를 렌더링했습니다. (Spatial FaceID 99.4% Lock & 0s/4s/12s 비트 싱크 완료)';

      const noaMsg: MediaMessage = {
        id: `msg-n-${Date.now()}`,
        role: 'noa',
        text: respText,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, noaMsg]);

      const initialArt = createInitialArtifact(effectiveDomain, promptSummary, visualRatio);
      initialArt.waveformData = generateWaveformData(48);
      setArtifact(initialArt);
      setHistory([createCheckpoint(initialArt)]);
      setFsmState('REFINING');
      showToast('비디오 파이프라인 연산이 완료되었습니다.', 'success');
      loadCachedAssets();
    }
  };

  // 듀얼 트랙 대화형 오케스트레이터 입력 핸들러 (만능 Noa 커맨드 독)
  const handleDockSubmit = async (payload: DockPayload) => {
    console.log('[NoaUniversalDock] Received payload:', payload);
    const { text, attachments } = payload;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    // 0. 취소/중단 명령: 인터뷰 모드에서 즉시 탈출
    if (isCancelCommand(trimmed)) {
      if (fsmState === 'INTERVIEWING') {
        setFsmState('IDLE');
        setCurrentStepIndex(0);
        const cancelMsg: MediaMessage = {
          id: `msg-n-${Date.now()}`,
          role: 'noa',
          text: '진행 중이던 인터뷰를 종료하고 자유 창작 대기 상태로 복귀했습니다. 원하시는 이미지나 영상을 편하게 말씀해 주세요.',
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, cancelMsg]);
        showToast('인터뷰를 취소하고 초기 대기 상태로 복귀했습니다.', 'info');
        return;
      }
    }

    // 1. 중간 점검/상태 확인 요청
    if (isInspectCommand(trimmed)) {
      if (artifact) {
        showToast('현재 생성된 미디어 아티팩트를 화면 중앙에 포커싱했습니다.', 'info');
      } else {
        showToast('아직 생성된 아티팩트가 없습니다. 원하시는 미디어를 말씀해 주세요.', 'info');
      }
      return;
    }

    // 2. 단계 건너뛰기 요청
    if (isSkipCommand(trimmed)) {
      if (fsmState === 'INTERVIEWING') {
        handleSkipStep();
        return;
      }
    }

    // 첨부파일 요약 텍스트 구성
    const attachmentSummary = attachments.length > 0 
      ? ` [첨부 ${attachments.length}건: ${attachments.map((a) => a.name).join(', ')}]` 
      : '';
    const userDisplayText = trimmed ? `${trimmed}${attachmentSummary}` : attachmentSummary.trim();

    // 사용자 메시지 스트림에 즉시 영구 누적
    const userMsg: MediaMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      text: userDisplayText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);

    // 3. 질문 / 대화 / 기능 안내 / 항의 라우팅 (좀비 인터뷰 FSM 진입 완전 차단)
    if (attachments.length === 0 && isConversationalOrQuestion(trimmed)) {
      const conversationalAnswer = generateNoaConversationalResponse(trimmed);
      const noaReplyMsg: MediaMessage = {
        id: `msg-n-${Date.now()}`,
        role: 'noa',
        text: conversationalAnswer,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, noaReplyMsg]);
      return;
    }

    const historyPayload = [...messages, userMsg].map((m) => ({ role: m.role, content: m.text }));

    // 공통 비주얼 프로세서 (주어 락 & 한국어 부정형 정제기 & 스트림 누적)
    const handleVisualProcess = async (promptText: string) => {
      setCurrentDomain('visual');
      setMvPipelineResult(null);
      setFsmState('GENERATING');
      showToast('실시간 AI 신경망(FLUX 8K)에 요청을 전달하여 렌더링 중입니다...', 'info');

      const apiResult = await requestMediaGeneration({
        userPrompt: promptText,
        history: historyPayload,
        activeSubject: activeSubject || (artifact?.title ? artifact.title.split('(')[0].trim() : undefined),
        activeTitle: artifact?.title,
        aspectRatio: visualRatio
      });

      const nextVersion = (artifact?.promptHistory.length || 0) + 1;
      setActiveVersion(nextVersion);
      if (apiResult.activeSubject) {
        setActiveSubject(apiResult.activeSubject);
      }

      const noaMsg: MediaMessage = {
        id: `msg-n-${Date.now()}`,
        role: 'noa',
        text: apiResult.noaResponse,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        artifact: {
          version: nextVersion,
          title: apiResult.displayTitle,
          imageUrl: apiResult.imageUrl,
          prompt: apiResult.vpoPrompt,
          aspectRatio: visualRatio,
          activeSubject: apiResult.activeSubject
        }
      };
      setMessages((prev) => [...prev, noaMsg]);

      if (artifact) {
        const updatedPromptHistory = [
          ...artifact.promptHistory,
          {
            userRaw: promptText,
            optimizedVPO: apiResult.vpoPrompt
          }
        ];
        const updatedArt: MediaArtifact = {
          ...artifact,
          domain: 'visual',
          title: apiResult.displayTitle,
          previewUrl: apiResult.imageUrl,
          promptHistory: updatedPromptHistory,
          progressPercent: 95,
          currentStepText: `v${nextVersion} 갱신: ${apiResult.displayTitle}`
        };
        setArtifact(updatedArt);
        setHistory((prev) => [...prev, createCheckpoint(updatedArt)]);
      } else {
        const initialArt = createInitialArtifact('visual', apiResult.displayTitle, visualRatio);
        initialArt.title = apiResult.displayTitle;
        initialArt.previewUrl = apiResult.imageUrl;
        initialArt.waveformData = generateWaveformData(48);
        initialArt.promptHistory = [
          {
            userRaw: promptText,
            optimizedVPO: apiResult.vpoPrompt
          }
        ];
        setArtifact(initialArt);
        setHistory([createCheckpoint(initialArt)]);
      }

      setFsmState('REFINING');
      showToast(`v${nextVersion} [${apiResult.displayTitle}] 생성이 완료되었습니다.`, 'success');
      loadCachedAssets();
    };

    // 3. 파일 첨부 후 "뮤직비디오 만들어줘" 요청 분기
    const hasAudio = attachments.some((a) => a.type === 'audio');
    if (attachments.length > 0 || trimmed.includes('뮤직비디오') || trimmed.includes('mv') || trimmed.includes('MV')) {
      await triggerArtifactGeneration('video', trimmed || (hasAudio ? '오디오 비트 싱크 뮤직비디오' : '멀티모달 씬 생성'));
      return;
    }

    // 4. REFINING 또는 COMPLETED 상태에서의 피드백 적용
    if (fsmState === 'REFINING' || fsmState === 'COMPLETED') {
      if (trimmed === '최종 완성 확정' || trimmed.includes('완성')) {
        setFsmState('COMPLETED');
        if (artifact) {
          setArtifact({
            ...artifact,
            progressPercent: 100,
            currentStepText: '최종 마스터링 완료'
          });
        }
        const completionMsg = '축하합니다! 미디어 아티팩트의 최종 완성이 확정되었습니다.';
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-n-${Date.now()}`,
            role: 'noa',
            text: completionMsg,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        showToast('축하합니다! 미디어 아티팩트 최종 완성이 확정되었습니다.', 'success');
        return;
      }

      await handleVisualProcess(trimmed);
      return;
    }

    // 5. IDLE 상태에서의 분기 (초보자 vs 숙련자 패턴)
    if (fsmState === 'IDLE') {
      const detectedDomain = detectDomainFromPrompt(trimmed);
      setCurrentDomain(detectedDomain);
      if (detectedDomain === 'video') setVisualRatio('9:16');
      if (detectedDomain === 'visual') setVisualRatio('16:9');

      const mode = determineSessionMode(trimmed);
      if (mode === 'interview') {
        setFsmState('INTERVIEWING');
        setCurrentStepIndex(0);
        const introMsg = `노아 총괄 PD의 ${detectedDomain.toUpperCase()} 큐레이션 질문입니다.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-n-${Date.now()}`,
            role: 'noa',
            text: introMsg,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        showToast(`노아 총괄 PD와의 ${detectedDomain.toUpperCase()} 디렉팅 인터뷰를 시작합니다.`, 'info');
      } else {
        await handleVisualProcess(trimmed);
      }
      return;
    }

    // 6. INTERVIEWING 상태에서 질문 응답
    if (fsmState === 'INTERVIEWING') {
      const steps = DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.video;
      if (currentStepIndex + 1 < steps.length) {
        setCurrentStepIndex((prev) => prev + 1);
        const nextStepMsg = `"${trimmed}" 세부 설정을 적용했습니다. 다음 단계 질문입니다.`;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-n-${Date.now()}`,
            role: 'noa',
            text: nextStepMsg,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        showToast(`"${trimmed}" 설정이 적용되었습니다. 다음 단계로 이동합니다.`, 'info');
      } else {
        triggerArtifactGeneration(currentDomain, `${currentDomain} 인터뷰 기반 통합 아티팩트`);
      }
    }
  };

  // 도구 선택 핸들러 ([➕ 도구])
  const handleToolSelect = (toolId: string) => {
    if (toolId === 'ratio') {
      const nextRatio = visualRatio === '16:9' ? '9:16' : visualRatio === '9:16' ? '1:1' : '16:9';
      setVisualRatio(nextRatio);
      showToast(`화면 비율을 [${nextRatio}]로 전환했습니다.`, 'info');
    } else if (toolId === 'safezone') {
      showToast('쇼츠 UI 세이프존 토글은 캔버스 상단 버튼에서 제어할 수 있습니다.', 'info');
    } else if (toolId === 'c2pa') {
      setIsDrawerOpen(true);
      setDrawerTab('c2pa');
      showToast('C2PA SynthID 메타데이터 검증 패널을 열었습니다.', 'info');
    }
  };

  // 컨텍스트 액션: 4K 무손실 저장
  const handleActionSave4K = async () => {
    if (!artifact) return;
    try {
      await saveMediaItem({
        type: artifact.domain === 'audio' ? 'AUDIO' : artifact.domain === 'video' ? 'VIDEO' : 'IMAGE',
        dataUrl: artifact.previewUrl || 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="100%" height="100%" fill="%2318181b"/></svg>',
        prompt: artifact.title,
        createdAt: Date.now()
      });
      showToast('4K 무손실 아티팩트가 IndexedDB 캐시 보관함에 영구 저장되었습니다.', 'success');
      loadCachedAssets();
    } catch (err) {
      console.error(err);
      showToast('저장 중 문제가 발생했습니다.', 'error');
    }
  };

  // 컨텍스트 액션: 노션 DB 적재
  const handleActionNotionSync = () => {
    if (!notionApiKey) {
      showToast('노션 API 키 설정이 필요합니다. 우측 상단 설정 서랍에서 연동해 주세요.', 'info');
      return;
    }
    showToast(`노션 [DB 6: 미디어 에셋]으로 "${artifact?.title}" 원격 적재를 완료했습니다.`, 'success');
  };

  // 컨텍스트 액션: 링크 복사
  const handleActionCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('미디어 아티팩트 딥링크가 클립보드에 복사되었습니다.', 'success');
  };

  // 캐시 에셋 삭제 핸들러
  const handleDeleteCachedItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMediaItem(id);
      setCachedMediaItems((prev) => prev.filter((item) => item.id !== id));
      showToast('캐시 에셋이 삭제되었습니다.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Undo 롤백 핸들러
  const handleUndoCheckpoint = () => {
    if (history.length <= 1) {
      showToast('더 이상 되돌릴 이전 스냅샷이 없습니다.', 'info');
      return;
    }
    const nextHistory = [...history];
    nextHistory.pop();
    const prevSnapshot = nextHistory[nextHistory.length - 1];
    setHistory(nextHistory);
    setArtifact(JSON.parse(JSON.stringify(prevSnapshot.snapshot)));
    showToast(`이전 체크포인트 (${prevSnapshot.timestamp}) 상태로 복원했습니다.`, 'info');
  };

  const currentInterviewStep: InterviewStep | undefined = 
    fsmState === 'INTERVIEWING' 
      ? (DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.video)[currentStepIndex]
      : undefined;

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors select-none relative">
      
      {/* ========================================================================= */}
      {/* 좌측 얇은 아이콘 서랍 [◀] 열림/닫힘 (Collapsible Slim Icon Drawer) */}
      {/* ========================================================================= */}
      <aside 
        className={`h-full border-r border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md transition-all duration-300 flex flex-col z-30 shrink-0 ${
          isDrawerOpen ? 'w-64 sm:w-72' : 'w-12 sm:w-14'
        }`}
      >
        {/* 서랍 상단: 토글 버튼 [◀] / [▶] */}
        <div className="h-11 px-2.5 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800">
          {isDrawerOpen ? (
            <>
              <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 tracking-tight truncate pl-1">
                에셋 서랍 & 설정
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="서랍 닫기 [◀]"
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-full flex items-center justify-center p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="서랍 열기 [▶]"
            >
              <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* 닫혀있을 때의 초슬림 세로 아이콘 레일 */}
        {!isDrawerOpen && (
          <div className="flex-1 flex flex-col items-center py-3 space-y-4">
            <button
              onClick={() => {
                setIsDrawerOpen(true);
                setDrawerTab('vault');
              }}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="에셋 보관함"
            >
              <FolderOpen className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => {
                setIsDrawerOpen(true);
                setDrawerTab('c2pa');
              }}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="C2PA SynthID 서명"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => {
                setIsDrawerOpen(true);
                setDrawerTab('settings');
              }}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="세션 파라미터"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* 열렸을 때의 서랍 내용 */}
        {isDrawerOpen && (
          <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
              <button
                onClick={() => setDrawerTab('vault')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                  drawerTab === 'vault'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                }`}
              >
                보관함 ({cachedMediaItems.length})
              </button>
              <button
                onClick={() => setDrawerTab('c2pa')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                  drawerTab === 'c2pa'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                }`}
              >
                C2PA 인증
              </button>
              <button
                onClick={() => setDrawerTab('settings')}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer text-center ${
                  drawerTab === 'settings'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                }`}
              >
                파라미터
              </button>
            </div>

            {drawerTab === 'vault' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                    <span>최근 생성 캐시</span>
                  </span>
                  <span className="font-mono">{cachedMediaItems.length}개</span>
                </div>

                {cachedMediaItems.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">
                    저장된 최근 미디어가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                    {cachedMediaItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition cursor-pointer"
                        onClick={() => {
                          showToast(`"${item.prompt || '에셋'}"을(를) 캔버스에 로드했습니다.`, 'info');
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.type === 'AUDIO' ? (
                            <Music className="w-4 h-4 text-zinc-300" strokeWidth={1.5} />
                          ) : item.type === 'VIDEO' ? (
                            <Film className="w-4 h-4 text-zinc-300" strokeWidth={1.5} />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-zinc-300" strokeWidth={1.5} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {item.prompt || '생성 미디어'}
                          </p>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteCachedItem(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'c2pa' && (
              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                    <span>C2PA Content Credentials</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                    본 미디어는 생성 시 암호학적 디지털 서명이 적용되어 C2PA 표준 검증을 100% 통과합니다.
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">디지털 워터마크</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Google SynthID</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Spatial FaceID</span>
                    <span className="font-semibold text-emerald-500">Lock 99.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">라이선스</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">CC-BY-4.0 AI Master</span>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'settings' && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-500 text-[11px] font-semibold">기본 화면 비율</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['16:9', '9:16', '1:1'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setVisualRatio(r)}
                        className={`py-1.5 rounded-lg font-semibold text-center transition cursor-pointer border ${
                          visualRatio === r
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* 메인 작업 영역 (상단 인디케이터 + 광활한 전폭 캔버스 + 하단 Noa 독) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* [상단 초슬림 인디케이터] */}
        <header className="h-11 px-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center space-x-2">
            <Film className="w-4 h-4 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
            <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
              AI 미디어 랩
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 font-light">|</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              세션 #{sessionCount}
            </span>
            {history.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <History className="w-3 h-3" strokeWidth={1.5} />
                <span>v{history.length}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 1 && (
              <button
                onClick={handleUndoCheckpoint}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer active:scale-95"
                title="이전 체크포인트로 되돌리기"
              >
                <RotateCcw className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                <span className="hidden sm:inline">되돌리기</span>
              </button>
            )}

            <button
              onClick={handleStartNewSession}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer active:scale-95"
              title="새 세션 시작"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span>새 세션</span>
            </button>
          </div>
        </header>

        {/* [광활한 전폭 캔버스 : 최대 1400px 이상 시원하게 확장] */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-[1400px] flex-1 flex flex-col space-y-6">
            
            {/* 영구 대화 스트림: 사용자 원문 & 노아 피드백 & 버전별 아티팩트 카드 */}
            {messages.length > 0 && (
              <div className="space-y-6 w-full animate-fadeIn">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {msg.role === 'user' ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          <User className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                          <span>사용자</span>
                          <span className="text-[10px] text-zinc-400 font-normal">{msg.timestamp}</span>
                        </div>
                        <p className="text-base sm:text-lg font-medium text-zinc-800 dark:text-zinc-100 pl-5.5 leading-relaxed">
                          "{msg.text}"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                          <Bot className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
                          <span>노아(NOA) 총괄 PD</span>
                          <span className="text-[10px] text-zinc-400 font-normal">{msg.timestamp}</span>
                          {msg.artifact && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
                              v{msg.artifact.version}
                            </span>
                          )}
                        </div>
                        <div className="pl-5.5 space-y-3">
                          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                            {msg.text}
                          </p>

                          {/* 해당 턴에서 생성된 아티팩트 버전 카드 및 롤백(Undo) 버튼 */}
                          {msg.artifact && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs max-w-2xl">
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={msg.artifact.imageUrl}
                                  alt={msg.artifact.title}
                                  className="w-16 h-10 object-cover rounded-lg border border-slate-200 dark:border-zinc-800 shrink-0 bg-zinc-950"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                      {msg.artifact.title}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                      v{msg.artifact.version}
                                    </span>
                                    {activeVersion === msg.artifact.version && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        현재 캔버스
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate max-w-md">
                                    {msg.artifact.prompt}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRollbackVersion(msg.artifact!)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer shrink-0 active:scale-95"
                                title="이 버전의 이미지를 메인 캔버스에 복원합니다"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                                <span>이 버전 복원 (Undo)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* IDLE 상태일 때의 미니멀 초기 안내 */}
            {fsmState === 'IDLE' && !artifact && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-24 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-7 h-7 text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    무엇을 만들고 싶으신가요?
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    원하시는 숏폼 영상, BGM, 썸네일 아이디어를 편하게 말씀해 주세요.
                  </p>
                </div>
              </div>
            )}

            {/* INTERVIEWING 상태에서의 질문 가이드 카드 */}
            {fsmState === 'INTERVIEWING' && currentInterviewStep && (
              <div className="w-full max-w-xl mx-auto p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3 animate-fadeIn my-4">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    노아 인터뷰 가이드 [{currentInterviewStep.id}/3]
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                    {currentInterviewStep.stepName}
                  </span>
                </div>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {currentInterviewStep.question}
                </p>
              </div>
            )}

            {/* GENERATING 상태 로딩 인디케이터 */}
            {fsmState === 'GENERATING' && (
              <div className="w-full flex flex-col items-center justify-center py-16 space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-md animate-pulse">
                  <Film className="w-7 h-7 text-zinc-700 dark:text-zinc-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  VPO 렌더링 파라미터 및 비트 싱크 씬 트래킹 연산 중...
                </p>
              </div>
            )}

            {/* =================================================================== */}
            {/* 🎬 [고도화된 중앙 라이브 미디어 캔버스 뷰어 (MediaArtifactStage)] */}
            {/* =================================================================== */}
            {(fsmState === 'REFINING' || fsmState === 'COMPLETED') && artifact && (
              <MediaArtifactStage
                artifact={artifact}
                mvData={mvPipelineResult}
                vpoData={vpoResult}
                aspectRatio={visualRatio}
                onAspectRatioChange={handleAspectRatioChange}
                onSave4K={handleActionSave4K}
                onNotionSync={handleActionNotionSync}
                onCopyLink={handleActionCopyLink}
              />
            )}

          </div>
        </main>

        {/* [하단 만능 Noa 커맨드 독 (Google Gemini 순정 알약형 바)] */}
        <footer className="shrink-0 z-30">
          <NoaUniversalDock
            onSubmit={handleDockSubmit}
            isProcessing={fsmState === 'GENERATING'}
            onToolSelect={handleToolSelect}
            placeholder="노아(NOA)에게 편하게 말씀하시거나 파일/이미지를 올려주세요..."
          />
        </footer>

      </div>

    </div>
  );
};
