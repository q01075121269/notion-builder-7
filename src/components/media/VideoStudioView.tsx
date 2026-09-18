// src/components/media/VideoStudioView.tsx
// 제4챕터 2단계: 영상 스튜디오 및 모션 씬 시퀀서 컴포넌트

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Sparkles, 
  Video, 
  Maximize2, 
  Music, 
  Check, 
  RefreshCw, 
  RotateCw, 
  ArrowUpRight, 
  Layers, 
  Clapperboard,
  MoveHorizontal,
  MoveVertical,
  Compass,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { saveMediaItem } from '../../lib/mediaStorage';

export type CameraPreset = 'ZOOM' | 'PAN' | 'TILT' | 'ROTATE' | 'DRONE';
export type VideoMode = 'IMAGE_TO_VIDEO' | 'TEXT_TO_VIDEO';

export interface SceneItem {
  id: string;
  title: string;
  duration: number; // 초 단위 (기본 5초)
  prompt: string;
  camera: CameraPreset;
  previewUrl: string;
}

interface VideoStudioViewProps {
  firstFrame?: { url: string; prompt: string } | null;
  onTransferToAudio?: (videoData: { title: string; scenesCount: number; totalDuration: number }) => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  firstFrame,
  onTransferToAudio,
}) => {
  const { showToast } = useApp();

  // 1. 영상 모드: Image-to-Video vs Text-to-Video
  const [videoMode, setVideoMode] = useState<VideoMode>(
    firstFrame ? 'IMAGE_TO_VIDEO' : 'IMAGE_TO_VIDEO'
  );

  // 첫 프레임 앵커 로드 이미지
  const [firstFrameUrl] = useState<string>(
    firstFrame?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );

  // 2. 5대 카메라 무빙 프리셋 선택
  const [selectedCamera, setSelectedCamera] = useState<CameraPreset>('ZOOM');

  // 종횡비
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // 프롬프트
  const [promptText, setPromptText] = useState(
    firstFrame?.prompt || '카메라가 미래도시 전경을 줌인하며 네온 조명이 서서히 발광하는 시네마틱 5초 모션 씬'
  );

  // 3. 씬 타임라인 시퀀서 (최대 30초 / 6개 씬 조립 지원)
  const [scenes, setScenes] = useState<SceneItem[]>([
    {
      id: 'scene-1',
      title: '씬 1 (오프닝)',
      duration: 5,
      prompt: promptText,
      camera: 'ZOOM',
      previewUrl: firstFrameUrl,
    },
  ]);
  const [activeSceneId, setActiveSceneId] = useState<string>('scene-1');

  // 플레이어 제어
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 5대 카메라 무빙 옵션
  const cameraPresets: { id: CameraPreset; label: string; icon: any; desc: string }[] = [
    { id: 'ZOOM', label: '줌인/줌아웃', icon: Maximize2, desc: '피사체 중심으로 부드러운 줌 렌즈 접근' },
    { id: 'PAN', label: '좌우 패닝', icon: MoveHorizontal, desc: '수평으로 씬을 넓게 탐색하는 무빙' },
    { id: 'TILT', label: '상하 틸트', icon: MoveVertical, desc: '아래에서 위로 시선을 수직 이동' },
    { id: 'ROTATE', label: '360도 회전', icon: RotateCw, desc: '피사체 주위를 360도 공전 회전' },
    { id: 'DRONE', label: '드론 상승 샷', icon: Compass, desc: '공중으로 부양하며 광활한 전경 포착' },
  ];

  // 새 씬 추가 (최대 30초 / 6개 씬)
  const handleAddScene = () => {
    const totalSec = scenes.reduce((sum, s) => sum + s.duration, 0);
    if (totalSec >= 30 || scenes.length >= 6) {
      showToast('⚠️ 숏폼 최대 길이(30초 / 6개 씬)에 도달했습니다.', 'info');
      return;
    }

    const newIndex = scenes.length + 1;
    const newScene: SceneItem = {
      id: `scene-${Date.now()}`,
      title: `씬 ${newIndex} (클라이맥스)`,
      duration: 5,
      prompt: `씬 ${newIndex}: 차세대 AI 비주얼 서사 연속 모션`,
      camera: selectedCamera,
      previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=1000',
    };

    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newScene.id);
    showToast(`🎬 [씬 ${newIndex}] (5초)가 시퀀서에 추가되었습니다!`, 'success');
  };

  // 씬 삭제
  const handleDeleteScene = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (scenes.length <= 1) {
      showToast('최소 1개의 씬이 필요합니다.', 'info');
      return;
    }
    setScenes((prev) => prev.filter((s) => s.id !== id));
    if (activeSceneId === id) {
      setActiveSceneId(scenes[0].id);
    }
  };

  // 비디오 모션 영상 생성 시뮬레이션
  const handleGenerateVideo = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      await new Promise((res) => setTimeout(res, 1500));
      
      // IndexedDB 미디어 캐시에 비디오 에셋 등록
      await saveMediaItem({
        type: 'VIDEO',
        dataUrl: firstFrameUrl,
        prompt: `[${selectedCamera}/${aspectRatio}] ${promptText}`,
      });

      showToast('🎥 5초 시네마틱 모션 비디오 렌더링이 완료되었습니다!', 'success');
      setIsPlaying(true);
    } catch (err) {
      console.error('영상 생성 실패:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 체인 파이프라인: 3단계 BGM & 사운드 모듈로 이동
  const handleChainToAudio = () => {
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    if (onTransferToAudio) {
      onTransferToAudio({
        title: promptText.slice(0, 30),
        scenesCount: scenes.length,
        totalDuration,
      });
    } else {
      showToast(`🎵 총 ${totalDuration}초 완성 영상이 제3단계 BGM 음악 모듈로 전달되었습니다!`, 'info');
    }
  };

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex flex-col w-full space-y-5">
      
      {/* 1. 상단 컨트롤 패널: 키프레임 앵커 로드 (Image-to-Video / Text-to-Video) */}
      <div className="bg-white dark:bg-neutral-800/90 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700 shadow-2xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-neutral-700 pb-3">
          
          {/* 모드 스위처 */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">생성 방식:</span>
            <div className="flex items-center bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-700">
              <button
                onClick={() => setVideoMode('IMAGE_TO_VIDEO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  videoMode === 'IMAGE_TO_VIDEO'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🖼️ Image-to-Video (앵커 로드)
              </button>
              <button
                onClick={() => setVideoMode('TEXT_TO_VIDEO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  videoMode === 'TEXT_TO_VIDEO'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ✍️ Text-to-Video (순수 프롬프트)
              </button>
            </div>
          </div>

          {/* 종횡비 */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 shrink-0">화면 규격:</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  aspectRatio === '16:9'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-neutral-900'
                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                }`}
              >
                16:9 와이드
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  aspectRatio === '9:16'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-neutral-900'
                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                }`}
              >
                9:16 쇼츠
              </button>
            </div>
          </div>

        </div>

        {/* 앵커 이미지 표시 (Image-to-Video 선택 시) */}
        {videoMode === 'IMAGE_TO_VIDEO' && (
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
            <img
              src={firstFrameUrl}
              alt="First Frame Anchor"
              className="w-16 h-10 object-cover rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white">
                  First Frame Anchor
                </span>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                  {firstFrame?.prompt || '1단계 이미지 스튜디오에서 로드된 고화질 키프레임'}
                </span>
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                이 그래픽 이미지가 5초 모션 씬의 시작 시점(0.0초)으로 고정되어 카메라 무빙이 연속 전개됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 2. 원클릭 5대 카메라 무빙 프리셋 (Camera Presets) */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center space-x-1.5">
            <Clapperboard className="w-3.5 h-3.5 text-indigo-500" />
            <span>🎬 원클릭 5대 카메라 무빙 프리셋 (Camera Motion Presets)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {cameraPresets.map((opt) => {
              const Icon = opt.icon;
              const isActive = selectedCamera === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedCamera(opt.id)}
                  className={`
                    p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-1.5 cursor-pointer active:scale-95
                    ${isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-900'
                      : 'bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:bg-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                    {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block whitespace-nowrap">{opt.label}</span>
                    <span className={`text-[9px] line-clamp-1 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {opt.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 프롬프트 입력 & 생성 버튼 */}
      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-2xs">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 ml-1" />
        <input
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="카메라 모션 서사를 자유롭게 입력하세요..."
          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerateVideo()}
        />
        <button
          onClick={handleGenerateVideo}
          disabled={isGenerating}
          className="
            px-4 py-2 rounded-xl text-xs font-bold
            bg-indigo-600 hover:bg-indigo-700 text-white
            disabled:opacity-40 transition active:scale-95
            whitespace-nowrap shrink-0 shadow-xs flex items-center space-x-1.5 cursor-pointer
          "
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>영상 렌더링 중...</span>
            </>
          ) : (
            <>
              <Video className="w-3.5 h-3.5" />
              <span>5초 모션 영상 생성</span>
            </>
          )}
        </button>
      </div>

      {/* 3. 대형 비디오 캔버스 & 씬 타임라인 (Scene Sequencer) */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-5 text-white">
        
        {/* 비디오 메인 플레이어 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>📹 씬 플레이어 캔버스</span>
              <span className="text-xs text-slate-400 font-normal">({aspectRatio})</span>
            </h3>
          </div>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800">
            총 타임라인: {totalDuration}초 / 30초 (총 {scenes.length}개 씬)
          </span>
        </div>

        {/* 캔버스 플레이어 뷰어 */}
        <div className="relative w-full max-w-3xl mx-auto flex items-center justify-center">
          <div className={`
            relative w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-h-[480px]'}
            bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group
          `}>
            <img
              src={activeScene.previewUrl || firstFrameUrl}
              alt="비디오 플레이어 캔버스"
              className={`w-full h-full object-cover transition-transform duration-1000 ${isPlaying ? 'scale-110 rotate-1' : 'scale-100'}`}
            />

            {/* 재생 오버레이 버튼 */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="
                absolute inset-0 m-auto w-14 h-14 rounded-full
                bg-black/60 hover:bg-black/80 backdrop-blur text-white
                flex items-center justify-center transition active:scale-95 shadow-2xl cursor-pointer
                group-hover:opacity-100 opacity-80
              "
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>

            {/* 모션 상태 뱃지 */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span>무빙: {activeScene.camera}</span>
            </div>
            
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/10">
              {activeScene.duration}초 / {totalDuration}초
            </div>
          </div>
        </div>

        {/* 씬 타임라인 시퀀서 (Scene Sequencer) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>🎞️ 타임라인 씬 시퀀서 (Scene Sequencer - 최대 30초 숏폼 조립)</span>
            </label>
            <span className="text-[10px] text-slate-400">씬 클릭 시 개별 편집 및 캔버스 로드</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
            {scenes.map((scene, idx) => {
              const isActive = scene.id === activeSceneId;
              return (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`
                    relative p-3 rounded-2xl border transition shrink-0 w-36 sm:w-44 cursor-pointer
                    flex flex-col justify-between space-y-2
                    ${isActive
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-lg ring-2 ring-indigo-500/50'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      {scene.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteScene(scene.id, e)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition"
                      title="씬 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
                    <img src={scene.previewUrl} alt={scene.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-black/80 text-white">
                      {scene.duration}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-300">{scene.camera}</span>
                    <span>씬 {idx + 1}</span>
                  </div>
                </div>
              );
            })}

            {/* [+ 새 씬 추가] 버튼 */}
            {scenes.length < 6 && totalDuration < 30 && (
              <button
                onClick={handleAddScene}
                className="
                  h-28 w-32 shrink-0 rounded-2xl
                  border-2 border-dashed border-slate-700 hover:border-indigo-500
                  bg-slate-800/40 hover:bg-slate-800/80
                  flex flex-col items-center justify-center space-y-1.5
                  text-slate-400 hover:text-indigo-400 transition cursor-pointer
                "
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-bold whitespace-nowrap">+ 새 씬 추가</span>
                <span className="text-[9px] text-slate-500">(5초 단위)</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. 하단 체인 파이프라인 액션 바 */}
      <div className="bg-slate-100 dark:bg-neutral-800/80 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-neutral-300">
          <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-white whitespace-nowrap">오디오 체인 파이프라인:</span>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">완성된 영상에 맞춤형 배경음악과 사운드트랙을 연결합니다.</span>
        </div>

        {/* 🎵 3단계: 어울리는 BGM & 사운드 입히기 */}
        <button
          onClick={handleChainToAudio}
          className="
            w-full sm:w-auto
            flex items-center justify-center space-x-1.5
            px-5 py-2.5 rounded-xl text-xs font-bold
            bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90
            text-white transition shadow-md active:scale-95
            whitespace-nowrap cursor-pointer shrink-0
          "
        >
          <Music className="w-4 h-4" />
          <span className="whitespace-nowrap">🎵 3단계: 어울리는 BGM & 사운드 입히기</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
