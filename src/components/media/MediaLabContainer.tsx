// src/components/media/MediaLabContainer.tsx
// 제4챕터 AI 미디어 랩(AI Media Lab 2026) 1단계 백지 신축 - 제로 메뉴 캔버스 & 노아 총괄 PD 인터랙션 조종석

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  RotateCcw, 
  Bot, 
  User,
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
import { saveMediaItem, getRecentMediaItems, deleteMediaItem } from '../../lib/mediaStorage';
import type { MediaItem } from '../../lib/mediaStorage';

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

  // 대화 스트림: 사용자 원문 & 노아 피드백 메시지 (박스 없이 시원한 텍스트 형태)
  const [userPromptText, setUserPromptText] = useState<string>('');
  const [noaResponseText, setNoaResponseText] = useState<string>('');

  // 숏폼 비디오 전용 상태
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(45);

  // 오디오 전용 상태
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(80);
  const [audioTime, setAudioTime] = useState<number>(14);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  // 비주얼 전용 상태 (비율 전환 16:9 / 9:16 / 1:1)
  const [visualRatio, setVisualRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // 호버 알약 액션 바 표시 상태
  const [isHoveredArtifact, setIsHoveredArtifact] = useState<boolean>(false);

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

  // 세션 초기화 및 새 세션 시작
  const handleStartNewSession = () => {
    setSessionCount((prev) => prev + 1);
    setFsmState('IDLE');
    setCurrentDomain('video');
    setCurrentStepIndex(0);
    setArtifact(null);
    setHistory([]);
    setUserPromptText('');
    setNoaResponseText('');
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
        setWaveformBars(generateWaveformData(48));
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

  // 아티팩트 생성 엔진 트리거
  const triggerArtifactGeneration = (domain: MediaDomain, promptSummary: string) => {
    setFsmState('GENERATING');
    setUserPromptText(promptSummary);
    setNoaResponseText('인물 락 및 시네마틱 카메라 리그를 연산하며 고해상도 초안을 렌더링 중입니다...');
    showToast('노아 PD가 캔버스에 고해상도 아티팩트를 렌더링 중입니다...', 'info');

    setTimeout(() => {
      const initialArt = createInitialArtifact(domain, promptSummary, visualRatio);
      setArtifact(initialArt);
      setWaveformBars(initialArt.waveformData || generateWaveformData(48));
      setHistory([createCheckpoint(initialArt)]);
      setFsmState('REFINING');
      setNoaResponseText('요청하신 인물 락 및 시네마틱 카메라 리그를 적용한 초안입니다.');
      showToast('초안 렌더링이 완료되었습니다. 조종석에서 피드백을 지시해 주세요.', 'success');
      loadCachedAssets();
    }, 1200);
  };

  // 듀얼 트랙 대화형 오케스트레이터 입력 핸들러
  const handleDockSubmit = (rawInput: string, attachedFile?: { name: string; url: string; type: string }) => {
    const trimmed = rawInput.trim();
    if (!trimmed && !attachedFile) return;

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

    // 3. REFINING 또는 COMPLETED 상태에서의 피드백 적용
    if (fsmState === 'REFINING' || fsmState === 'COMPLETED') {
      setUserPromptText(trimmed);
      if (trimmed === '최종 완성 확정' || trimmed.includes('완성')) {
        setFsmState('COMPLETED');
        if (artifact) {
          setArtifact({
            ...artifact,
            progressPercent: 100,
            currentStepText: '최종 마스터링 완료'
          });
        }
        setNoaResponseText('축하합니다! 미디어 아티팩트의 최종 완성이 확정되었습니다.');
        showToast('축하합니다! 미디어 아티팩트 최종 완성이 확정되었습니다.', 'success');
        return;
      }

      if (artifact) {
        const updatedPromptHistory = [
          ...artifact.promptHistory,
          {
            userRaw: trimmed,
            optimizedVPO: `[Refined Directive]: ${trimmed} with cinematic camera rig update`
          }
        ];

        const updated: MediaArtifact = {
          ...artifact,
          title: `${artifact.title} (수정본)`,
          promptHistory: updatedPromptHistory,
          progressPercent: 95,
          currentStepText: `피드백 반영: "${trimmed}"`
        };

        setArtifact(updated);
        setHistory((prev) => [...prev, createCheckpoint(updated)]);
        setNoaResponseText(`피드백 "${trimmed}"을(를) 정밀 반영하여 라이브 캔버스를 갱신했습니다.`);
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

      setUserPromptText(trimmed);

      const mode = determineSessionMode(trimmed);
      if (mode === 'interview') {
        setFsmState('INTERVIEWING');
        setCurrentStepIndex(0);
        setNoaResponseText(`노아 총괄 PD의 ${detectedDomain.toUpperCase()} 큐레이션 질문입니다.`);
        showToast(`노아 총괄 PD와의 ${detectedDomain.toUpperCase()} 디렉팅 인터뷰를 시작합니다.`, 'info');
      } else {
        triggerArtifactGeneration(detectedDomain, trimmed);
      }
      return;
    }

    // 5. INTERVIEWING 상태에서 질문 응답
    if (fsmState === 'INTERVIEWING') {
      setUserPromptText(trimmed);
      const steps = DOMAIN_INTERVIEW_STEPS[currentDomain] || DOMAIN_INTERVIEW_STEPS.video;
      if (currentStepIndex + 1 < steps.length) {
        setCurrentStepIndex((prev) => prev + 1);
        setNoaResponseText(`"${trimmed}" 세부 설정을 적용했습니다. 다음 단계 질문입니다.`);
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
      setShowSafeZone(!showSafeZone);
      showToast(`쇼츠 UI 세이프존을 [${!showSafeZone ? 'ON' : 'OFF'}] 했습니다.`, 'info');
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

  // 컨텍스트 액션: 이메일 전송
  const handleActionSendEmail = () => {
    const subject = encodeURIComponent(`[AI Media Lab] ${artifact?.title || '미디어 아티팩트'}`);
    const body = encodeURIComponent(`AI 미디어 랩에서 생성된 아티팩트 안내:\n\n제목: ${artifact?.title}\n도메인: ${artifact?.domain}\nC2PA 서명 인증 완료.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    showToast('이메일 클라이언트가 열립니다.', 'info');
  };

  // 컨텍스트 액션: 라이프 Hub 연동
  const handleActionLifeSync = () => {
    showToast('라이프 Hub 데일리 모닝 루틴 & 브리핑 카드 에셋으로 등록되었습니다.', 'success');
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
            {/* 서랍 내부 서브 탭 */}
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

            {/* 탭 1: 에셋 보관함 (IndexedDB 캐시) */}
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

            {/* 탭 2: C2PA 및 SynthID 서명 정보 */}
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
                    <span className="text-zinc-500">라이선스</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">CC-BY-4.0 AI Master</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">위변조 방지 락</span>
                    <span className="font-semibold text-emerald-500">활성화됨</span>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 3: 세션 파라미터 */}
            {drawerTab === 'settings' && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-500 text-[11px] font-semibold">화면 비율 프리셋</label>
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

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 space-y-1">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>쇼츠 UI 세이프존</span>
                    <button
                      onClick={() => setShowSafeZone(!showSafeZone)}
                      className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline"
                    >
                      {showSafeZone ? '켜짐' : '꺼짐'}
                    </button>
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
        
        {/* ======================================================================= */}
        {/* [상단 초슬림 인디케이터]: 🎨 AI 미디어 랩 | 세션 #1        [ 🔄 새 세션 ] */}
        {/* ======================================================================= */}
        <header className="h-11 px-4 sm:px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 z-20">
          {/* 좌측: 타이틀 | 세션 번호 */}
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

          {/* 우측: 되돌리기 & [ 🔄 새 세션 ] */}
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

        {/* ======================================================================= */}
        {/* [광활한 전폭 캔버스 : 최대 1400px 이상 시원하게 확장] */}
        {/* ======================================================================= */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center">
          <div className="w-full max-w-[1400px] flex-1 flex flex-col space-y-6">
            
            {/* [대화 스트림: 사용자 원문 텍스트 - 박스 없이 시원한 텍스트] */}
            {userPromptText && (
              <div className="space-y-1 animate-fadeIn">
                <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <User className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                  <span>사용자</span>
                </div>
                <p className="text-base sm:text-lg font-medium text-zinc-800 dark:text-zinc-100 pl-5.5 leading-relaxed">
                  "{userPromptText}"
                </p>
              </div>
            )}

            {/* [대화 스트림: 노아(NOA) 총괄 PD 피드백 - 박스 없이 시원한 텍스트] */}
            {noaResponseText && (
              <div className="space-y-1 animate-fadeIn">
                <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                  <Bot className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
                  <span>노아(NOA)</span>
                </div>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 pl-5.5 leading-relaxed">
                  "{noaResponseText}"
                </p>
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

            {/* GENERATING 상태 로딩 */}
            {fsmState === 'GENERATING' && (
              <div className="w-full flex flex-col items-center justify-center py-16 space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-md animate-pulse">
                  <Film className="w-7 h-7 text-zinc-700 dark:text-zinc-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  인물 락 및 시네마틱 카메라 리그 연산 중...
                </p>
              </div>
            )}

            {/* =================================================================== */}
            {/* 🎬 [대형 라이브 비디오/이미지 캔버스 (화면을 꽉 채우는 쾌적한 뷰어)] */}
            {/*    (마우스 호버 시에만 [💾 무손실 저장] [☁️ 노션 적재] 플로팅 알약 노출) */}
            {/* =================================================================== */}
            {(fsmState === 'REFINING' || fsmState === 'COMPLETED') && artifact && (
              <div 
                className="w-full flex-1 flex flex-col items-center justify-center relative group min-h-[460px] pb-4 animate-fadeIn"
                onMouseEnter={() => setIsHoveredArtifact(true)}
                onMouseLeave={() => setIsHoveredArtifact(false)}
              >
                {/* --------------------------------------------------------------- */}
                {/* 마우스 호버 시에만 [💾 무손실 저장] [☁️ 노션 적재] 플로팅 알약 노출 */}
                {/* --------------------------------------------------------------- */}
                <div 
                  className={`absolute top-4 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-700/90 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                    isHoveredArtifact ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <button
                    onClick={handleActionSave4K}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="4K 무손실 저장"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>무손실 저장</span>
                  </button>

                  <button
                    onClick={handleActionNotionSync}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="노션 DB 적재"
                  >
                    <Cloud className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>노션 적재</span>
                  </button>

                  <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

                  <button
                    onClick={handleActionCopyLink}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="링크 복사"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span className="hidden sm:inline">링크 복사</span>
                  </button>

                  <button
                    onClick={handleActionSendEmail}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="이메일 전송"
                  >
                    <Mail className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span className="hidden sm:inline">이메일</span>
                  </button>

                  <button
                    onClick={handleActionLifeSync}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="라이프 Hub 연동"
                  >
                    <Zap className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span className="hidden sm:inline">라이프 Hub</span>
                  </button>
                </div>

                {/* 1. 비디오/숏폼 대형 라이브 캔버스 (화면을 꽉 채우는 쾌적한 와이드 뷰어) */}
                {artifact.domain === 'video' && (
                  <div className="w-full flex flex-col items-center space-y-3">
                    {/* 와이드 대형 시네마틱 뷰어 프레임 (최대 1400px 대응) */}
                    <div className="w-full max-w-5xl aspect-video bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      {/* 배경 시네마틱 시뮬레이션 렌더링 뷰 */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center">
                        <div className="text-center p-8 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Film className="w-8 h-8 text-white/90" strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                              {artifact.title}
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono">
                              ALPS GLACIER CINEMATIC 4K 60FPS • NOA CAMERA RIG v2.6
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 쇼츠 UI 세이프존 마스크 오버레이 (가이드선) */}
                      {showSafeZone && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/30 m-6 rounded-2xl flex flex-col justify-between p-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                              상단 UI 세이프존
                            </span>
                            <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                              검색/공유
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                              하단 자막 세이프존
                            </span>
                            <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                              오디오 트랙
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 하단 재생 컨트롤 & 자막 */}
                      <div className="relative z-20 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent space-y-3">
                        <p className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                          "{artifact.captions?.[0]?.text || '도전하지 않으면 아무것도 변하지 않습니다.'}"
                        </p>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                          >
                            {isPlayingVideo ? (
                              <Pause className="w-4 h-4" strokeWidth={1.5} />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" strokeWidth={1.5} />
                            )}
                          </button>

                          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-200" 
                              style={{ width: `${videoProgress}%` }} 
                            />
                          </div>

                          <span className="text-xs font-mono text-zinc-300">
                            00:{Math.floor((videoProgress / 100) * 15).toString().padStart(2, '0')} / 00:15
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. 비주얼/이미지 대형 캔버스 */}
                {artifact.domain === 'visual' && (
                  <div className="w-full max-w-5xl aspect-video bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex items-center justify-center p-8">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center backdrop-blur-md">
                        <ImageIcon className="w-8 h-8 text-white/90" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {artifact.title}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto line-clamp-2">
                        {artifact.promptHistory[0]?.optimizedVPO}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. 오디오/음악 대형 캔버스 */}
                {artifact.domain === 'audio' && (
                  <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
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

                      <span className="text-xs font-mono text-zinc-500">
                        00:{audioTime.toString().padStart(2, '0')} / 00:30
                      </span>
                    </div>

                    {/* 오디오 파형 비주얼라이저 */}
                    <div className="h-28 bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 flex items-center justify-center gap-1 border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden">
                      {(waveformBars.length > 0 ? waveformBars : generateWaveformData(48)).map((val, idx) => {
                        const isPassed = (idx / 48) * 30 <= audioTime;
                        return (
                          <div
                            key={idx}
                            className={`w-1.5 rounded-full transition-all duration-300 ${
                              isPassed ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                            style={{ height: `${Math.max(14, val * 84)}px` }}
                          />
                        );
                      })}
                    </div>

                    {/* 재생 컨트롤 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-4 h-4" strokeWidth={1.5} />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
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
                  </div>
                )}

              </div>
            )}

          </div>
        </main>

        {/* ======================================================================= */}
        {/* [하단 중앙 와이드 플로팅 Noa 독 (Gemini 순정 알약형 바)] */}
        {/* ======================================================================= */}
        <footer className="shrink-0 z-30">
          <NoaMediaDock
            onSubmit={handleDockSubmit}
            isProcessing={fsmState === 'GENERATING'}
            onToolSelect={handleToolSelect}
            placeholder="편하게 말씀하시거나 사진/음악을 올려주세요..."
          />
        </footer>

      </div>

    </div>
  );
};
