// src/components/media/AudioStudioView.tsx
// 제4챕터 3단계: 스마트 오디오 스튜디오 및 최종 비디오 믹서 컴포넌트

import React, { useState } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Mic, 
  Presentation, 
  Headphones, 
  Film, 
  Zap, 
  Check, 
  RefreshCw, 
  FileText,
  Sliders
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { saveMediaItem } from '../../lib/mediaStorage';

export type AudioPreset = 'VOCAL' | 'SLIDE' | 'FOCUS' | 'SOUNDTRACK';

interface AudioStudioViewProps {
  targetVideo?: { title: string; duration: number } | null;
  onMasteringComplete?: () => void;
}

export const AudioStudioView: React.FC<AudioStudioViewProps> = ({
  targetVideo,
  onMasteringComplete,
}) => {
  const { showToast } = useApp();

  // 1. 목적별 4대 오디오 프리셋 셀렉터
  const [selectedPreset, setSelectedPreset] = useState<AudioPreset>(
    targetVideo ? 'SOUNDTRACK' : 'FOCUS'
  );

  // 프롬프트 및 가사 상태
  const [promptText, setPromptText] = useState('차분하고 세련된 Lo-Fi 칠홉 비트와 비 내리는 밤의 잔잔한 피아노 선율');
  const [lyricsText, setLyricsText] = useState('여기는 미래의 생각들이 이어지는 공간\n네온빛 속에서 펼쳐지는 우리들의 서사...');
  
  // 플레이어 제어
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMastering, setIsMastering] = useState(false);

  // 4대 오디오 프리셋 정보
  const audioPresets: { id: AudioPreset; label: string; icon: any; desc: string; defaultPrompt: string }[] = [
    {
      id: 'VOCAL',
      label: '취미/보컬',
      icon: Mic,
      desc: '자연어 가사 자동 작사 및 완곡(2~3분) 모드',
      defaultPrompt: '감성적인 K-POP 팝 발라드 무드의 보컬 곡',
    },
    {
      id: 'SLIDE',
      label: '슬라이드/발표',
      icon: Presentation,
      desc: '말소리를 방해하지 않는 차분한 인스트루멘탈 연주곡',
      defaultPrompt: '슬라이드 발표용 신뢰감을 주는 차분한 앰비언트 피아노 연주',
    },
    {
      id: 'FOCUS',
      label: '워크/포커스',
      icon: Headphones,
      desc: '업무 집중용 무한 루프 Lo-Fi 비트 및 백색소음',
      defaultPrompt: '집중력을 향상시키는 무한 루프 Lo-Fi 힙합 & 비 소리 백색소음',
    },
    {
      id: 'SOUNDTRACK',
      label: '영상 사운드트랙',
      icon: Film,
      desc: '15~30초 영상 무드와 싱크되는 템포 BGM 및 효과음(SFX)',
      defaultPrompt: '시네마틱 영상의 긴장감 넘치는 에픽 비트 & SFX 서스펜스 BGM',
    },
  ];

  // 프리셋 선택 변경
  const handlePresetSelect = (preset: AudioPreset) => {
    setSelectedPreset(preset);
    const target = audioPresets.find((p) => p.id === preset);
    if (target) {
      setPromptText(target.defaultPrompt);
    }
  };

  // 음원 생성 시뮬레이션
  const handleGenerateAudio = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      await new Promise((res) => setTimeout(res, 1200));

      // IndexedDB 미디어 저장소에 오디오 등록
      await saveMediaItem({
        type: 'AUDIO',
        dataUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        prompt: `[${selectedPreset}] ${promptText}`,
      });

      showToast('🎵 AI 오디오 사운드트랙 작곡이 완료되었습니다!', 'success');
      setIsPlaying(true);
    } catch (err) {
      console.error('오디오 생성 실패:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. 영상+음악 합쳐서 최종 렌더링 (Final Mastering)
  const handleFinalMastering = async () => {
    if (isMastering) return;
    setIsMastering(true);

    try {
      await new Promise((res) => setTimeout(res, 1800));

      // 결합본 최종 1계층 캐시에 적재
      await saveMediaItem({
        type: 'VIDEO',
        dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        prompt: `[최종 마스터링 결합본] 1단계 그래픽 ➔ 2단계 영상 ➔ 3단계 ${selectedPreset} BGM 사운드트랙 통합 렌더링`,
      });

      showToast('⚡ [1단계 이미지 ➔ 2단계 영상 ➔ 3단계 BGM] 최종 마스터링 영상이 미디어 보관함에 적재되었습니다!', 'success');
      if (onMasteringComplete) onMasteringComplete();
    } catch (err) {
      console.error('마스터링 실패:', err);
    } finally {
      setIsMastering(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-5">
      
      {/* 1. 목적별 4대 오디오 프리셋 셀렉터 */}
      <div className="bg-white dark:bg-neutral-800/90 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700 shadow-2xs space-y-3">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-700 pb-2.5">
          <label className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-pink-500" />
            <span>🎵 목적별 4대 오디오 프리셋 셀렉터 (Audio Purpose Presets)</span>
          </label>
          <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60 px-2 py-0.5 rounded-full border border-pink-200 dark:border-pink-800">
            사운드 엔진 연동
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {audioPresets.map((opt) => {
            const Icon = opt.icon;
            const isActive = selectedPreset === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handlePresetSelect(opt.id)}
                className={`
                  p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer active:scale-95
                  ${isActive
                    ? 'bg-gradient-to-br from-pink-600 to-purple-600 text-white border-pink-500 shadow-md ring-2 ring-pink-300 dark:ring-pink-900'
                    : 'bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-100'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-pink-500'}`} />
                  {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <span className="text-xs font-bold block whitespace-nowrap">{opt.label}</span>
                  <span className={`text-[10px] line-clamp-2 mt-0.5 leading-snug ${isActive ? 'text-pink-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* 프롬프트 & 가사 입력을 위한 바 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-2xs">
          <Sparkles className="w-4 h-4 text-pink-500 shrink-0 ml-1" />
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="음악 무드 및 분위기를 자유롭게 입력하세요..."
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAudio()}
          />
          <button
            onClick={handleGenerateAudio}
            disabled={isGenerating}
            className="
              px-4 py-2 rounded-xl text-xs font-bold
              bg-pink-600 hover:bg-pink-700 text-white
              disabled:opacity-40 transition active:scale-95
              whitespace-nowrap shrink-0 shadow-xs flex items-center space-x-1.5 cursor-pointer
            "
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>작곡 중...</span>
              </>
            ) : (
              <>
                <Music className="w-3.5 h-3.5" />
                <span>음악 작곡</span>
              </>
            )}
          </button>
        </div>

        {/* 보컬 프리셋 선택 시 가사 작사 창 노출 */}
        {selectedPreset === 'VOCAL' && (
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-pink-500" />
              <span>🎙️ 자연어 가사 자동 작사 편집기</span>
            </label>
            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 focus:outline-none"
              placeholder="가사를 입력하거나 AI 자동 작사에 대입하세요..."
            />
          </div>
        )}
      </div>

      {/* 2. 오디오 파형 캔버스 (Audio Waveform Visualizer) */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4 text-white">
        
        {/* 파형 플레이어 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-pink-500 animate-pulse' : 'bg-slate-600'}`} />
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>🎧 오디오 파형 비주얼라이저 (Audio Waveform)</span>
            </h3>
          </div>
          <span className="text-xs font-bold text-pink-400 bg-pink-950/80 px-2.5 py-1 rounded-lg border border-pink-800">
            {selectedPreset} 모드
          </span>
        </div>

        {/* 오디오 파형 애니메이션 바 (Visualizer Bars) */}
        <div className="py-6 px-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center space-x-1.5 h-28 overflow-hidden">
          {[
            35, 60, 45, 80, 95, 70, 40, 65, 90, 100, 75, 50, 85, 95, 60, 40,
            75, 90, 55, 35, 70, 85, 95, 60, 45, 80, 100, 70, 50, 65, 40, 85,
          ].map((heightPct, idx) => {
            const dynamicHeight = isPlaying 
              ? `${Math.max(15, (heightPct * (0.4 + (idx % 5) * 0.15)) % 100)}%` 
              : '20%';
            return (
              <div
                key={idx}
                style={{ height: dynamicHeight }}
                className={`
                  w-1.5 sm:w-2 rounded-full transition-all duration-300
                  ${isPlaying
                    ? 'bg-gradient-to-t from-pink-500 via-purple-500 to-indigo-400 shadow-lg shadow-pink-500/20'
                    : 'bg-slate-700'
                  }
                `}
              />
            );
          })}
        </div>

        {/* 오디오 서브 플레이어 제어 바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          
          {/* 재생/일시정지 & 루프 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-xl bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
              title={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            {/* 무한 루프 재생 버튼 */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                isLooping
                  ? 'bg-pink-950 text-pink-300 border border-pink-700'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="무한 루프 재생"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">무한 루프 {isLooping ? 'On' : 'Off'}</span>
            </button>
          </div>

          {/* 볼륨 슬라이더 */}
          <div className="flex items-center space-x-2.5 w-full sm:w-48">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-pink-400" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[10px] text-slate-400 font-bold w-6">{isMuted ? 0 : volume}%</span>
          </div>

        </div>

      </div>

      {/* 3. 영상 동기화 사운드트랙 믹서 (Final Mastering) */}
      <div className="bg-slate-100 dark:bg-neutral-800/80 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700 shadow-2xs space-y-3">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-700 pb-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-white">
            <Film className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>🎬 영상 동기화 사운드트랙 믹서 (Final Mastering)</span>
          </div>
          {targetVideo && (
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              2단계 모션 영상 연결됨
            </span>
          )}
        </div>

        {targetVideo ? (
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                🎬
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">
                  {targetVideo.title || '2단계 시네마틱 모션 영상 클립'}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  총 영상 길이: {targetVideo.duration}초 • 현재 {selectedPreset} BGM 싱크 결합 대기
                </span>
              </div>
            </div>
            
            <button
              onClick={handleFinalMastering}
              disabled={isMastering}
              className="
                w-full sm:w-auto
                flex items-center justify-center space-x-1.5
                px-5 py-2.5 rounded-xl text-xs font-bold
                bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90
                text-white transition shadow-md active:scale-95
                whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50
              "
            >
              {isMastering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>최종 마스터링 렌더링 중...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>⚡ 영상+음악 합쳐서 최종 렌더링</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 dark:text-neutral-400">
              <span className="font-bold text-slate-800 dark:text-white block">독립 오디오 마스터링 모드</span>
              <span className="text-[11px] text-slate-500">
                2단계 영상 스튜디오에서 전달된 영상이 없어도 오디오 단독 마스터링이 가능합니다.
              </span>
            </div>
            <button
              onClick={handleFinalMastering}
              disabled={isMastering}
              className="
                px-4 py-2 rounded-xl text-xs font-bold
                bg-purple-600 hover:bg-purple-700 text-white
                disabled:opacity-50 transition active:scale-95
                whitespace-nowrap cursor-pointer shrink-0 shadow-xs flex items-center space-x-1
              "
            >
              {isMastering ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>⚡ 오디오 최종 마스터링 저장</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
