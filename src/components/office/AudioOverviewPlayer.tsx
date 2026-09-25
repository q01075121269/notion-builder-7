import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FileText, 
  X, 
  Headphones, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

export interface ScriptLine {
  speaker: 'hostA' | 'hostB';
  speakerName: string;
  role: string;
  text: string;
  timestamp: string;
}

export const BRIEFING_SCRIPT: ScriptLine[] = [
  {
    speaker: 'hostA',
    speakerName: '호스트 민우',
    role: '테크 리드',
    text: '안녕하세요, 청취자 여러분! 오늘은 2026년 하반기 전사 도입 예정인 "차세대 AI 오피스 스튜디오 도입 기안"의 핵심을 2분 만에 빠르게 짚어보겠습니다. 수진 님, 이번 기안의 가장 큰 골자가 무엇인가요?',
    timestamp: '00:03'
  },
  {
    speaker: 'hostB',
    speakerName: '호스트 수진',
    role: '전략 기획위원',
    text: '네, 민우 님. 핵심은 바로 "문서 작성의 단일 골든 패스"입니다. 기존에는 기안서 따로, 수식 엑셀 따로, 발표 장표를 따로 만들면서 데이터 불일치가 심각했는데요. 이번 오피스 스튜디오는 하나의 지식 소스에서 4대 문서가 실시간 연동됩니다.',
    timestamp: '00:28'
  },
  {
    speaker: 'hostA',
    speakerName: '호스트 민우',
    role: '테크 리드',
    text: '특히 인상적인 건 사내 규정 준수와 팩트 그라운딩(Fact Grounding)이군요. 사내 규정 제45조 보안 게이트웨이를 100% 만족하면서도 예산 집행 표가 =SUM 함수로 자동 검증된다는 점이 재무/보안팀 승인을 단번에 통과시킬 핵심 포인트로 보입니다.',
    timestamp: '00:58'
  },
  {
    speaker: 'hostB',
    speakerName: '호스트 수진',
    role: '전략 기획위원',
    text: '맞습니다. 3-Way 기획 엔진을 통해 안정형, 혁신형, MVP형 3가지 안 중 선택된 안이 캔버스에 0초 만에 주입되므로, 기안 작성 시간이 무려 70% 단축될 것으로 기대됩니다.',
    timestamp: '01:34'
  },
  {
    speaker: 'hostA',
    speakerName: '호스트 민우',
    role: '테크 리드',
    text: '대표이사 최종 재가까지 완벽하게 지원하는 2026 오피스 스튜디오, 이번 분기 가장 기대되는 혁신 프로젝트네요. 지금까지 2분 딥다이브 오디오 브리핑이었습니다!',
    timestamp: '02:05'
  }
];

interface AudioOverviewPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export const AudioOverviewPlayer: React.FC<AudioOverviewPlayerProps> = ({
  isOpen,
  onClose,
  documentTitle = '2026 차세대 AI 오피스 스튜디오 도입 기안'
}) => {
  const TOTAL_DURATION = 135; // 02:15 in seconds
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isScriptOpen, setIsScriptOpen] = useState<boolean>(false);
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 24, 18, 30, 20, 14, 28, 22, 16, 26, 19, 15]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // 최적의 한국어 자연어 보이스 탐색 헬퍼 (Natural/Neural 우선)
  const getOptimalKoreanVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1순위: 한국어 Natural / Neural 고음질 보이스 (SunHi, InJoon, Google 한국어 등)
    const naturalVoice = voices.find(v => {
      const isKorean = v.lang === 'ko-KR' || v.lang.startsWith('ko');
      if (!isKorean) return false;
      const lowerName = v.name.toLowerCase();
      return (
        lowerName.includes('natural') || 
        lowerName.includes('neural') || 
        lowerName.includes('online') ||
        lowerName.includes('sunhi') ||
        lowerName.includes('injoon') ||
        lowerName.includes('google 한국어')
      );
    });

    if (naturalVoice) return naturalVoice;

    // 2순위: 시스템 내장 'ko-KR' 고음질 보이스
    const standardKoVoice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
    if (standardKoVoice) return standardKoVoice;

    // 3순위: 한국어 포함 보이스 폴백
    return voices.find(v => v.name.includes('Korean') || v.name.includes('한국어')) || null;
  };

  // 브라우저 보이스 로드 시 자동 매핑
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoice = () => {
      const voice = getOptimalKoreanVoice();
      if (voice) setSelectedVoice(voice);
    };

    updateVoice();
    window.speechSynthesis.onvoiceschanged = updateVoice;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 자연스러운 팟캐스트 호흡을 위한 스크립트 포맷팅 (쉼표/마침표 구간 호흡 딜레이)
  const formatPodcastBreathing = (text: string) => {
    return text
      .replace(/([.!?])\s*/g, '$1 , ') // 마침표 뒤 자연스러운 호흡 텀
      .replace(/([,])\s*/g, '$1 ');    // 쉼표 호흡 유지
  };

  // 음성 텍스트 합성 헬퍼
  const getFullScriptText = () => {
    const rawScript = [
      `${documentTitle}. 2분 핵심 오디오 브리핑을 시작합니다.`,
      ...BRIEFING_SCRIPT.map(s => `${s.speakerName}. ${s.text}`)
    ].join(' ');

    return formatPodcastBreathing(rawScript);
  };

  // 실제 자연어 TTS 음성 재생 시작
  const startSpeech = (rate = playbackRate) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const textToSpeak = getFullScriptText();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ko-KR';
    
    // 자연스러운 인토네이션 및 말속도 튜닝
    utterance.pitch = 1.02; // 차분하면서도 명료한 팟캐스트 인토네이션
    utterance.rate = rate || 1.0; // 기계적인 느낌을 줄이고 자연스러운 말속도 유지

    // 1순위 최적 보이스 적용
    const voiceToUse = selectedVoice || getOptimalKoreanVoice();
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(TOTAL_DURATION);
    };

    utterance.onerror = (e) => {
      console.warn('[AudioOverview TTS] Error or cancelled:', e);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // 모달 닫기나 언마운트 시 TTS 안전 취소
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // isOpen이 false가 될 때 음성 중지
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, [isOpen]);

  // 재생 타이머 루프 및 파형 동기화
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });

        // 사운드웨이브 높이 실시간 시뮬레이션
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 24) + 8));
      }, 1000 / playbackRate);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackRate]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 재생 / 일시정지 토글
  const handleTogglePlay = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      startSpeech(playbackRate);
    }
  };

  // 처음부터 다시 재생
  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    startSpeech(playbackRate);
  };

  // 배속 순환 (1.0x -> 1.2x -> 1.5x)
  const handleRateCycle = () => {
    const rates = [1.0, 1.2, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);

    if (isPlaying) {
      startSpeech(nextRate);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    onClose();
  };

  const handleProgressSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  return (
    <>
      {/* 하단 고밀도 오디오 플레이어 바 (슬라이드업) */}
      <aside 
        aria-label="오디오 브리핑 플레이어"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 shadow-2xl px-4 sm:px-6 py-3 select-none animate-slideUp transition-all"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* 1. 좌측 메타데이터 & 타이틀 */}
          <div className="flex items-center space-x-3 w-full md:w-auto min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Headphones className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                  NotebookLM Style
                </span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                  2인 대화형 팟캐스트
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {documentTitle} - 2분 딥다이브 브리핑
              </h4>
            </div>
          </div>

          {/* 2. 중앙 컨트롤러 & 사운드웨이브 & 프로그레스 바 */}
          <div className="flex flex-col items-center w-full md:max-w-xl space-y-1.5">
            <div className="flex items-center space-x-4">
              {/* 되감기 버튼 */}
              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="처음부터 다시 재생"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* 재생 / 일시정지 메인 토글 */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center hover:scale-105 transition cursor-pointer shadow-md active:scale-95"
                title={isPlaying ? '일시정지' : '재생'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* 사운드웨이브 비주얼라이저 (애니메이션) */}
              <div className="flex items-center space-x-0.5 h-7 px-2">
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: isPlaying ? `${h}px` : '4px' }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isPlaying 
                        ? 'bg-indigo-600 dark:bg-indigo-400' 
                        : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>

              {/* 배속 토글 버튼 */}
              <button
                type="button"
                onClick={handleRateCycle}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer font-mono"
                title="재생 속도 조절"
              >
                {playbackRate.toFixed(1)}x
              </button>

              {/* 음소거 토글 */}
              <button
                type="button"
                onClick={() => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  if (nextMuted && typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setIsPlaying(false);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* 프로그레스 바 & 러닝타임 표시 */}
            <div className="w-full flex items-center space-x-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={TOTAL_DURATION}
                  value={currentTime}
                  onChange={handleProgressSeek}
                  className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <span>{formatTime(TOTAL_DURATION)}</span>
            </div>
          </div>

          {/* 3. 우측: 스크립트 보기 토글 & 닫기 */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsScriptOpen(!isScriptOpen)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isScriptOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              <span>스크립트 보기</span>
              {isScriptOpen ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronUp className="w-3 h-3 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="오디오 플레이어 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* 2인 대화형 팟캐스트 스크립트 팝업 모달/드로어 */}
      {isScriptOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 space-y-4 animate-fadeIn select-text max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                2인 대화형 팟캐스트 브리핑 스크립트
              </h4>
            </div>
            <button
              onClick={() => setIsScriptOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {BRIEFING_SCRIPT.map((line, idx) => {
              const isHostA = line.speaker === 'hostA';
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                    isHostA 
                      ? 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-750' 
                      : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-black ${isHostA ? 'text-slate-900 dark:text-white' : 'text-indigo-700 dark:text-indigo-300'}`}>
                        {line.speakerName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400">
                        {line.role}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {line.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-zinc-300">
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center space-x-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>원천 소스(PDF 및 회의록) 기반 사실 그라운딩 100% 검증 스크립트</span>
          </div>
        </div>
      )}
    </>
  );
};
