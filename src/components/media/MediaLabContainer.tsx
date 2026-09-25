// src/components/media/MediaLabContainer.tsx
// 제4챕터 AI 미디어 랩(AI Media Lab 2026) 1단계 백지 신축 - 제로 메뉴 캔버스 & 노아 총괄 PD 인터랙션 조종석

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  RotateCcw, 
  Bot, 
  Mic, 
  Music, 
  Image as ImageIcon, 
  Download, 
  Link as LinkIcon, 
  Mail, 
  Cloud, 
  Zap, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles,
  History
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoaMediaDock } from './NoaMediaDock';
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
  determineSessionMode, 
  createInitialArtifact, 
  createCheckpoint,
  generateWaveformData
} from '../../services/noaOrchestrator';
import { saveMediaItem } from '../../lib/mediaStorage';

export const MediaLabContainer: React.FC = () => {
  const { showToast, notionApiKey } = useApp();

  // 세션 & FSM 상태
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [fsmState, setFsmState] = useState<FSMState>('IDLE');
  const [currentDomain, setCurrentDomain] = useState<MediaDomain>('visual');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [artifact, setArtifact] = useState<MediaArtifact | null>(null);
  const [history, setHistory] = useState<MediaCheckpoint[]>([]);
  const [noaFeedbackPrompt, setNoaFeedbackPrompt] = useState<string>('');

  // 숏폼 비디오 전용 상태
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(35);

  // 오디오 전용 상태
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(80);
  const [audioTime, setAudioTime] = useState<number>(12); // 초 단위
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  // 비주얼 전용 상태 (비율 전환 16:9 / 9:16 / 1:1)
  const [visualRatio, setVisualRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // 호버 알약 액션 바 표시 상태
  const [isHoveredArtifact, setIsHoveredArtifact] = useState<boolean>(false);

  // 세션 진행률 계산 (0% -> 25% -> 50% -> 75% -> 100%)
  const calculateProgressPercent = (): number => {
    switch (fsmState) {
      case 'IDLE':
        return 0;
      case 'INTERVIEWING':
        return Math.min(50, 20 + currentStepIndex * 15);
      case 'GENERATING':
        return 75;
      case 'REFINING':
        return 90;
      case 'COMPLETED':
        return 100;
      default:
        return 0;
    }
  };

  // 초기화 및 새 세션 시작
  const handleStartNewSession = () => {
    setSessionCount((prev) => prev + 1);
    setFsmState('IDLE');
    setCurrentDomain('visual');
    setCurrentStepIndex(0);
    setArtifact(null);
    setHistory([]);
    setNoaFeedbackPrompt('');
    setIsPlayingAudio(false);
    setIsPlayingVideo(true);
    showToast('새로운 미디어 세션을 백지 캔버스에서 시작합니다.', 'info');
  };

  // 오디오 파형 재생 애니메이션 시뮬레이션
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioTime((prev) => (prev >= 30 ? 0 : prev + 1));
        setWaveformBars(generateWaveformData(42));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // 비디오 재생 프로그레스 시뮬레이션
  useEffect(() => {
    let videoInterval: NodeJS.Timeout;
    if (isPlayingVideo && artifact?.domain === 'video') {
      videoInterval = setInterval(() => {
        setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 200);
    }
    return () => clearInterval(videoInterval);
  }, [isPlayingVideo, artifact?.domain]);

  // 현재 노아 추천 칩 목록 계산
  const getDockChips = (): string[] => {
    if (fsmState === 'IDLE') {
      return ['쇼츠 BGM 만들기', '세로 숏폼 영상', '3D/실사 썸네일'];
    }

    if (fsmState === 'INTERVIEWING') {
      const steps = DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.visual;
      const currentStep = steps[currentStepIndex];
      return currentStep ? currentStep.chips : ['생성 진행', '이대로 렌더링'];
    }

    if (fsmState === 'REFINING' || fsmState === 'COMPLETED') {
      if (currentDomain === 'video') {
        return ['배경 채도 높이기', '카메라 줌인 효과 추가', '자막 폰트 볼드화', '4K 업스케일링', '최종 완성 확정'];
      }
      if (currentDomain === 'audio') {
        return ['드럼 비트 강조', '템포 5BPM 가속', '베이스 부스트', '마스터링 리미터 적용', '최종 완성 확정'];
      }
      return ['스튜디오 조명 강조', '배경 심도(아웃포커스) 강화', '텍스트 헤드라인 삽입', '4K 무손실 업스케일', '최종 완성 확정'];
    }

    return ['다음 단계', '세부 피드백'];
  };

  // 인터뷰 단계 스킵 처리
  const handleSkipStep = () => {
    const steps = DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.visual;
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
      showToast(`${steps[currentStepIndex].stepName} 단계를 건너뛰고 다음 질문으로 진행합니다.`, 'info');
    } else {
      // 마지막 단계 건너뛰면 즉시 생성 단계로 전이
      triggerArtifactGeneration(currentDomain, `${currentDomain} 맞춤형 프리셋 생성`);
    }
  };

  // 아티팩트 생성 엔진 트리거 (숙련자 및 인터뷰 완료 공통)
  const triggerArtifactGeneration = (domain: MediaDomain, promptSummary: string) => {
    setFsmState('GENERATING');
    showToast('노아 PD가 캔버스에 고해상도 아티팩트를 렌더링 중입니다...', 'info');

    setTimeout(() => {
      const initialArt = createInitialArtifact(domain, promptSummary, visualRatio);
      setArtifact(initialArt);
      setWaveformBars(initialArt.waveformData || generateWaveformData(42));
      setHistory([createCheckpoint(initialArt)]);
      setFsmState('REFINING');
      setNoaFeedbackPrompt('초안을 캔버스에 렌더링했습니다. 배경이나 인물, BGM 중 수정하고 싶은 부분이 있으신가요?');
      showToast('초안 렌더링이 완료되었습니다. 조종석에서 피드백을 지시해 주세요.', 'success');
    }, 1300);
  };

  // 듀얼 트랙 대화형 오케스트레이터 입력 핸들러
  const handleDockSubmit = (rawInput: string, attachedFile?: { name: string; url: string; type: string }) => {
    const trimmed = rawInput.trim();
    if (!trimmed && !attachedFile) return;

    // 1. 중간 점검/현재 상태 확인 요청
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

    // 3. REFINING 또는 COMPLETED 상태에서의 피드백 적용
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
        showToast('축하합니다! 미디어 아티팩트 최종 완성이 확정되었습니다.', 'success');
        return;
      }

      // 피드백 반영 아티팩트 업데이트
      if (artifact) {
        const updatedPromptHistory = [
          ...artifact.promptHistory,
          {
            userRaw: trimmed,
            optimizedVPO: `[Refined Directive]: ${trimmed} applied with precision color-grade`
          }
        ];

        const updated: MediaArtifact = {
          ...artifact,
          title: `${artifact.title} (리파인)`,
          promptHistory: updatedPromptHistory,
          progressPercent: 95,
          currentStepText: `피드백 반영: "${trimmed}"`
        };

        setArtifact(updated);
        setHistory((prev) => [...prev, createCheckpoint(updated)]);
        showToast(`피드백 "${trimmed}"을(를) 반영하여 캔버스를 갱신했습니다.`, 'success');
      }
      return;
    }

    // 4. IDLE 상태에서의 분기 (초보자 vs 숙련자 패턴)
    if (fsmState === 'IDLE') {
      const detectedDomain = detectDomainFromPrompt(trimmed);
      setCurrentDomain(detectedDomain);
      if (detectedDomain === 'video') setVisualRatio('9:16');
      if (detectedDomain === 'visual') setVisualRatio('16:9');

      const mode = determineSessionMode(trimmed);

      if (mode === 'interview') {
        // 초보자 패턴: INTERVIEWING 단계로 전환
        setFsmState('INTERVIEWING');
        setCurrentStepIndex(0);
        showToast(`노아 총괄 PD와의 ${detectedDomain.toUpperCase()} 디렉팅 인터뷰를 시작합니다.`, 'info');
      } else {
        // 숙련자 패턴: 복합 프롬프트를 즉시 분해하여 GENERATING -> 초안 생성
        triggerArtifactGeneration(detectedDomain, trimmed);
      }
      return;
    }

    // 5. INTERVIEWING 상태에서 질문에 대한 응답 수신
    if (fsmState === 'INTERVIEWING') {
      const steps = DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.visual;
      if (currentStepIndex + 1 < steps.length) {
        setCurrentStepIndex((prev) => prev + 1);
        showToast(`"${trimmed}" 설정이 적용되었습니다. 다음 단계로 이동합니다.`, 'info');
      } else {
        // 모든 단계 완료 -> 생성 시작
        triggerArtifactGeneration(currentDomain, `${currentDomain} 인터뷰 기반 통합 아티팩트`);
      }
    }
  };

  // 퀵 영감 칩 선택 핸들러
  const handleSelectChip = (chipText: string) => {
    if (fsmState === 'IDLE') {
      if (chipText.includes('BGM')) {
        setCurrentDomain('audio');
        setFsmState('INTERVIEWING');
        setCurrentStepIndex(0);
        showToast('쇼츠 BGM 제작 디렉팅을 시작합니다.', 'info');
      } else if (chipText.includes('영상') || chipText.includes('숏폼')) {
        setCurrentDomain('video');
        setVisualRatio('9:16');
        setFsmState('INTERVIEWING');
        setCurrentStepIndex(0);
        showToast('세로 숏폼 영상 제작 디렉팅을 시작합니다.', 'info');
      } else {
        setCurrentDomain('visual');
        setVisualRatio('16:9');
        setFsmState('INTERVIEWING');
        setCurrentStepIndex(0);
        showToast('썸네일/비주얼 제작 디렉팅을 시작합니다.', 'info');
      }
      return;
    }

    handleDockSubmit(chipText);
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
    } catch (err) {
      console.error(err);
      showToast('저장 중 문제가 발생했습니다.', 'error');
    }
  };

  // 컨텍스트 액션: 링크 복사
  const handleActionCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('미디어 아티팩트 딥링크가 클립보드에 복사되었습니다.', 'success');
  };

  // 컨텍스트 액션: 이메일 전송
  const handleActionSendEmail = () => {
    const subject = encodeURIComponent(`[AI Media Lab] ${artifact?.title || '미디어 아티팩트'}`);
    const body = encodeURIComponent(`AI 미디어 랩에서 생성된 아티팩트 안내:\n\n제목: ${artifact?.title}\n도메인: ${artifact?.domain}\nC2PA 서명 인증 완료.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    showToast('이메일 클라이언트가 열립니다.', 'info');
  };

  // 컨텍스트 액션: 노션 DB 적재
  const handleActionNotionSync = () => {
    if (!notionApiKey) {
      showToast('노션 API 키 설정이 필요합니다. 우측 상단 설정 서랍에서 연동해 주세요.', 'info');
      return;
    }
    showToast(`노션 [DB 6: 미디어 에셋]으로 "${artifact?.title}" 원격 적재를 요청했습니다.`, 'success');
  };

  // 컨텍스트 액션: 라이프 Hub 연동
  const handleActionLifeSync = () => {
    showToast('라이프 Hub 데일리 모닝 루틴 & 브리핑 카드 에셋으로 등록되었습니다.', 'success');
  };

  // Undo: 이전 체크포인트 스냅샷으로 롤백
  const handleUndoCheckpoint = () => {
    if (history.length <= 1) {
      showToast('더 이상 되돌릴 이전 스냅샷이 없습니다.', 'info');
      return;
    }
    const nextHistory = [...history];
    nextHistory.pop(); // 현재 상태 제거
    const prevSnapshot = nextHistory[nextHistory.length - 1];
    setHistory(nextHistory);
    setArtifact(JSON.parse(JSON.stringify(prevSnapshot.snapshot)));
    showToast(`이전 체크포인트 (${prevSnapshot.timestamp}) 상태로 복원했습니다.`, 'info');
  };

  const progressPercent = calculateProgressPercent();
  const currentInterviewStep: InterviewStep | undefined = 
    fsmState === 'INTERVIEWING' 
      ? (DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.visual)[currentStepIndex]
      : undefined;

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors select-none relative">
      
      {/* ========================================================================= */}
      {/* 1. 상단 1단 미니멀 상태 헤더 */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 z-20">
        
        {/* 좌측: 타이틀 및 세션명 */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
            <Film className="w-4 h-4 text-white dark:text-zinc-900" strokeWidth={1.5} />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
              AI 미디어 랩
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80">
              미디어 세션 #{sessionCount}
            </span>
            {history.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                <History className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                <span>v{history.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* 중앙: 얇고 단정한 진행률 게이지 바 (0% -> 25% -> 50% -> 75% -> 100%) */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 max-w-xs mx-auto">
          <div className="w-full flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
            <span>진행률</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 우측: [ 🔄 새 세션 시작 ], 되돌리기 및 노아 모드 표시 배지 */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* 되돌리기 버튼 (Undo) */}
          {history.length > 1 && (
            <button
              onClick={handleUndoCheckpoint}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition shadow-2xs cursor-pointer active:scale-95"
              title="이전 체크포인트로 되돌리기"
            >
              <RotateCcw className="w-3 h-3 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span className="hidden sm:inline">되돌리기</span>
            </button>
          )}

          {/* 노아 상태 배지 */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 shadow-2xs">
            {fsmState === 'IDLE' ? (
              <>
                <Bot className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span className="text-zinc-600 dark:text-zinc-400">노아 PD: 대기중</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" strokeWidth={1.5} />
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">디렉팅 진행중</span>
              </>
            )}
          </div>

          {/* 새 세션 시작 버튼 */}
          <button
            onClick={handleStartNewSession}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition shadow-2xs cursor-pointer active:scale-95"
            title="새 세션 시작"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
            <span className="hidden sm:inline">새 세션 시작</span>
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. 중앙 광활한 아티팩트 스테이지 (Live Interactive Canvas) */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto relative z-10">
        
        {/* [평소 IDLE 상태: 메뉴판 없는 정갈한 안내 & 3대 영감 퀵 칩] */}
        {fsmState === 'IDLE' && (
          <div className="max-w-xl text-center space-y-8 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                무엇을 만들고 싶으신가요?
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                노아에게 편하게 말씀해 주세요. 초보자는 대화형 인터뷰로, 숙련자는 직행 프롬프트로 완성합니다.
              </p>
            </div>

            {/* 3대 영감 퀵 칩 */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleSelectChip('쇼츠 BGM 만들기')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm text-xs font-semibold transition cursor-pointer active:scale-98"
              >
                <Music className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>쇼츠 BGM 만들기</span>
              </button>

              <button
                onClick={() => handleSelectChip('세로 숏폼 영상')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm text-xs font-semibold transition cursor-pointer active:scale-98"
              >
                <Film className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>세로 숏폼 영상</span>
              </button>

              <button
                onClick={() => handleSelectChip('3D/실사 썸네일')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm text-xs font-semibold transition cursor-pointer active:scale-98"
              >
                <ImageIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>3D/실사 썸네일</span>
              </button>
            </div>
          </div>
        )}

        {/* [INTERVIEWING 상태: 노아 총괄 PD의 질문 카드] */}
        {fsmState === 'INTERVIEWING' && currentInterviewStep && (
          <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                디렉팅 가이드 [Step {currentInterviewStep.id}/3]
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                {currentInterviewStep.stepName}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {currentInterviewStep.question}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              하단 추천 칩을 누르거나 조종석에 자유롭게 답변을 입력해 주세요. 원치 않으시면 건너뛰실 수 있습니다.
            </p>
          </div>
        )}

        {/* [GENERATING 상태: 고해상도 렌더링 스켈레톤 인디케이터] */}
        {fsmState === 'GENERATING' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-md animate-pulse">
              <Sparkles className="w-8 h-8 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                캔버스에 고해상도 아티팩트 렌더링 중...
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                VPO 최적화 프롬프트 및 SynthID 메타데이터 합성 중입니다.
              </p>
            </div>
          </div>
        )}

        {/* [아티팩트 활성화 상태 (Active Stage): 비주얼 / 비디오 / 오디오 라이브 캔버스] */}
        {(fsmState === 'REFINING' || fsmState === 'COMPLETED') && artifact && (
          <div 
            className="w-full max-w-4xl flex flex-col items-center justify-center relative group"
            onMouseEnter={() => setIsHoveredArtifact(true)}
            onMouseLeave={() => setIsHoveredArtifact(false)}
          >
            {/* ----------------------------------------------------------------- */}
            {/* [마우스 호버 컨텍스트 액션 (Hover-to-Act)]: 반투명 플로팅 알약 UI */}
            {/* ----------------------------------------------------------------- */}
            <div 
              className={`absolute top-3 z-30 flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-700/80 shadow-xl backdrop-blur-md transition-all duration-300 ${
                isHoveredArtifact ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <button
                onClick={handleActionSave4K}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="4K 무손실 저장"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>4K 무손실 저장</span>
              </button>

              <button
                onClick={handleActionCopyLink}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="링크 복사"
              >
                <LinkIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>링크 복사</span>
              </button>

              <button
                onClick={handleActionSendEmail}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="이메일 전송"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>이메일 전송</span>
              </button>

              <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

              <button
                onClick={handleActionNotionSync}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="노션 DB 적재"
              >
                <Cloud className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>노션 DB 적재</span>
              </button>

              <button
                onClick={handleActionLifeSync}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="라이프 Hub 연동"
              >
                <Zap className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span>라이프 Hub 연동</span>
              </button>
            </div>

            {/* 도메인 1: 숏폼 영상 (video) 9:16 모바일 뷰어 + 쇼츠 UI 세이프존 마스크 */}
            {artifact.domain === 'video' && (
              <div className="flex flex-col items-center space-y-3">
                {/* 세이프존 토글 버튼 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSafeZone(!showSafeZone)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                      showSafeZone 
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' 
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    {showSafeZone ? (
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    <span>쇼츠 UI 세이프존 {showSafeZone ? 'ON' : 'OFF'}</span>
                  </button>

                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 px-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
                    <span>C2PA 인증 완료</span>
                  </div>
                </div>

                {/* 9:16 스마트 모바일 뷰어 프레임 */}
                <div className="w-[300px] h-[533px] bg-black rounded-3xl border-4 border-zinc-800 dark:border-zinc-700 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  {/* 동영상 배경 비주얼 렌더 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
                    <div className="text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center backdrop-blur-xs">
                        <Film className="w-6 h-6 text-white/80" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs font-semibold text-white/90">
                        {artifact.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        9:16 VERTICAL 4K 60FPS
                      </p>
                    </div>
                  </div>

                  {/* 쇼츠 UI 세이프존 마스크 오버레이 */}
                  {showSafeZone && (
                    <div className="absolute inset-0 pointer-events-none border border-dashed border-amber-400/40 m-4 rounded-xl flex flex-col justify-between p-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">
                          상단 타이틀 영역
                        </span>
                        <span className="text-[9px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">
                          검색/채널
                        </span>
                      </div>
                      <div className="self-end flex flex-col gap-2 items-center mr-1">
                        <span className="text-[8px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">좋아요</span>
                        <span className="text-[8px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">댓글</span>
                        <span className="text-[8px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">공유</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[9px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">
                          자막 세이프존 (하단 20%)
                        </span>
                        <span className="text-[9px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">
                          음원 디스크
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 하단 캡션 자막 */}
                  <div className="relative z-10 p-4 space-y-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="text-xs font-bold text-white drop-shadow-md">
                      @Noa_MediaLab • 세로 숏폼
                    </p>
                    <p className="text-xs text-white/90 drop-shadow-sm line-clamp-2">
                      {artifact.captions?.[0]?.text || '도전하지 않으면 아무것도 변하지 않습니다.'}
                    </p>

                    {/* 재생/일시정지 & 프로그레스 */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                        className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                      >
                        {isPlayingVideo ? (
                          <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
                        ) : (
                          <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-200" 
                          style={{ width: `${videoProgress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 도메인 2: 음악/사운드 (audio) 동적 오디오 파형 비주얼라이저 카드 & 스템 제어 */}
            {artifact.domain === 'audio' && (
              <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Music className="w-5 h-5 text-zinc-600 dark:text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {artifact.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Mastered WAV 24-bit 48kHz • SynthID 워터마크 서명
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    00:{audioTime.toString().padStart(2, '0')} / 00:30
                  </span>
                </div>

                {/* 동적 오디오 파형 (Waveform) 비주얼라이저 */}
                <div className="h-24 bg-slate-50 dark:bg-zinc-950/80 rounded-2xl p-4 flex items-center justify-center gap-1 border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden">
                  {(waveformBars.length > 0 ? waveformBars : generateWaveformData(42)).map((val, idx) => {
                    const isPassed = (idx / 42) * 30 <= audioTime;
                    return (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full transition-all duration-300 ${
                          isPassed 
                            ? 'bg-zinc-900 dark:bg-zinc-100' 
                            : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        style={{ height: `${Math.max(12, val * 72)}px` }}
                      />
                    );
                  })}
                </div>

                {/* 재생/정지 컨트롤러 및 볼륨 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" strokeWidth={1.5} />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setAudioTime(0);
                        setIsPlayingAudio(true);
                      }}
                      className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
                      title="처음부터 재생"
                    >
                      <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAudioVolume(audioVolume > 0 ? 0 : 80)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                    >
                      {audioVolume === 0 ? (
                        <VolumeX className="w-4 h-4" strokeWidth={1.5} />
                      ) : (
                        <Volume2 className="w-4 h-4" strokeWidth={1.5} />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioVolume}
                      onChange={(e) => setAudioVolume(Number(e.target.value))}
                      className="w-24 accent-zinc-900 dark:accent-zinc-100"
                    />
                  </div>
                </div>

                {/* 4대 스템 트랙 제어 (Stems) */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>개별 오디오 스템 (Stems Separation)</span>
                    </span>
                    <span className="text-[11px] font-normal text-zinc-500">4 트랙 활성화</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {artifact.stems?.map((stem, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 text-[11px] space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-medium text-zinc-800 dark:text-zinc-200">
                          <span className="truncate">{stem.name}</span>
                          <span className="font-mono text-[10px] text-zinc-400">{stem.volume}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full" style={{ width: `${stem.volume}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 도메인 3: 비주얼/썸네일 (visual) 고해상도 캔버스 프리뷰 (비율 전환 16:9 / 9:16 / 1:1) */}
            {artifact.domain === 'visual' && (
              <div className="w-full max-w-2xl flex flex-col items-center space-y-3">
                {/* 비율 전환 컨트롤 칩 바 */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                  <button
                    onClick={() => setVisualRatio('16:9')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      visualRatio === '16:9'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    16:9 와이드 (유튜브)
                  </button>

                  <button
                    onClick={() => setVisualRatio('9:16')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      visualRatio === '9:16'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    9:16 세로 (쇼츠)
                  </button>

                  <button
                    onClick={() => setVisualRatio('1:1')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      visualRatio === '1:1'
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    1:1 정방형 (피드)
                  </button>
                </div>

                {/* 반응형 캔버스 프레임 */}
                <div 
                  className={`w-full bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
                    visualRatio === '16:9' 
                      ? 'aspect-video max-w-2xl' 
                      : visualRatio === '9:16' 
                        ? 'w-[280px] h-[498px]' 
                        : 'aspect-square max-w-md'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center">
                    <div className="space-y-3 p-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 mx-auto flex items-center justify-center backdrop-blur-xs">
                        <ImageIcon className="w-7 h-7 text-white/90" strokeWidth={1.5} />
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {artifact.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 max-w-xs mx-auto line-clamp-2">
                        {artifact.promptHistory[0]?.optimizedVPO}
                      </p>
                    </div>
                  </div>

                  {/* 메타데이터 뱃지 오버레이 */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/60 text-zinc-300 backdrop-blur-xs border border-white/10">
                      {visualRatio} 4K
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-emerald-400 backdrop-blur-xs border border-white/10 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                      <span>C2PA SynthID</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 노아의 피드백 제안 안내 바 */}
            <div className="mt-4 px-4 py-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 shadow-2xs backdrop-blur-xs text-center max-w-md">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">노아 PD: </span>
              <span>{noaFeedbackPrompt || '초안을 캔버스에 렌더링했습니다. 배경이나 인물, BGM 중 수정하고 싶은 부분이 있으신가요?'}</span>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 3. 만능 Noa Command Dock (하단 조종석) */}
      {/* ========================================================================= */}
      <footer className="shrink-0 z-30">
        <NoaMediaDock
          chips={getDockChips()}
          onSelectChip={handleSelectChip}
          onSubmit={handleDockSubmit}
          isProcessing={fsmState === 'GENERATING'}
          canSkip={fsmState === 'INTERVIEWING'}
          onSkip={handleSkipStep}
          placeholder={
            fsmState === 'IDLE' 
              ? '원하시는 미디어를 말씀하시거나 파일을 올려주세요...'
              : fsmState === 'INTERVIEWING'
                ? '질문에 답변하시거나 이 단계를 건너뛰실 수 있습니다...'
                : '초안에 대한 수정 요청이나 추가 지시를 말씀해 주세요...'
          }
        />
      </footer>

    </div>
  );
};
