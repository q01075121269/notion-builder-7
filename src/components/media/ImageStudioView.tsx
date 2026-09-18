// src/components/media/ImageStudioView.tsx
// 제4챕터 1단계: 스마트 이미지 스튜디오 캔버스 컴포넌트

import React, { useState } from 'react';
import { 
  Sparkles, 
  Scissors, 
  Paintbrush, 
  Download, 
  Film, 
  Zap, 
  Layers, 
  Maximize2, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Check,
  RefreshCw,
  Wand2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { saveMediaItem } from '../../lib/mediaStorage';

export type ImageCreationType = 'LOGO' | 'THUMBNAIL' | 'ART';
export type ImageStyle = '3D_RENDER' | 'CINEMATIC' | 'VECTOR_2D' | 'ANIME';
export type AspectRatioType = '16:9' | '9:16' | '1:1' | '3:1';

interface ImageStudioViewProps {
  onTransferToVideo?: (imageDataUrl: string, prompt: string) => void;
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ onTransferToVideo }) => {
  const { showToast, updateCurrentCover } = useApp();

  // 1. 상단 3-알약 프리셋 바 상태
  const [creationType, setCreationType] = useState<ImageCreationType>('ART');
  const [style, setStyle] = useState<ImageStyle>('CINEMATIC');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');
  
  // 프롬프트 및 캔버스 이미지 상태
  const [promptText, setPromptText] = useState('사이버펑크 감성의 네온사인이 빛나는 미래도시 프론트엔드 연구소 3D 컨셉 아트');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );

  // 캔버스 편집 효과 상태
  const [isTransparentBg, setIsTransparentBg] = useState(false);
  const [isMagicBrushActive, setIsMagicBrushActive] = useState(false);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // 제작 타입 라벨
  const creationTypeOptions: { id: ImageCreationType; label: string; icon: any }[] = [
    { id: 'ART', label: '고화질 실사/아트', icon: ImageIcon },
    { id: 'LOGO', label: '브랜드 로고/아이콘', icon: Layers },
    { id: 'THUMBNAIL', label: '썸네일/포스터(타이포)', icon: Type },
  ];

  // 화풍 스타일 라벨
  const styleOptions: { id: ImageStyle; label: string }[] = [
    { id: '3D_RENDER', label: '3D 렌더' },
    { id: 'CINEMATIC', label: '시네마틱 실사' },
    { id: 'VECTOR_2D', label: '2D 미니멀 벡터' },
    { id: 'ANIME', label: '애니메이션 일러스트' },
  ];

  // 종횡비 규격 라벨
  const ratioOptions: { id: AspectRatioType; label: string; ratioClass: string }[] = [
    { id: '16:9', label: '16:9 와이드', ratioClass: 'aspect-video' },
    { id: '9:16', label: '9:16 쇼츠', ratioClass: 'aspect-[9/16]' },
    { id: '1:1', label: '1:1 정방형', ratioClass: 'aspect-square' },
    { id: '3:1', label: '3:1 노션 커버', ratioClass: 'aspect-[3/1]' },
  ];

  // AI 이미지 생성 처리
  const handleGenerate = async () => {
    if (!promptText.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      // 종횡비 및 스타일 기반 샘플 이미지 할당
      const sampleMap: Record<AspectRatioType, string> = {
        '16:9': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        '9:16': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=1000',
        '1:1': 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=800',
        '3:1': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=400',
      };

      await new Promise((res) => setTimeout(res, 1200)); // 생성 시뮬레이션
      const newUrl = sampleMap[aspectRatio] || sampleMap['16:9'];
      setCurrentImageUrl(newUrl);
      setIsTransparentBg(false);

      // IndexedDB 미디어 저장소에 1계층 자동 보관
      await saveMediaItem({
        type: 'IMAGE',
        dataUrl: newUrl,
        prompt: `[${creationType}/${style}/${aspectRatio}] ${promptText}`,
      });

      showToast('🎨 AI 미디어 랩 캔버스에 이미지 생성이 완료되었습니다!', 'success');
    } catch (err) {
      console.error('이미지 생성 실패:', err);
      showToast('이미지 생성 도중 오류가 발생했습니다.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 1초 누끼(배경 제거) 효과 토글
  const handleToggleRemoveBg = () => {
    setIsTransparentBg((prev) => !prev);
    showToast(
      !isTransparentBg 
        ? '✂️ 배경이 투명 분리(PNG 누끼)되었습니다.' 
        : '원본 배경으로 복원되었습니다.',
      'info'
    );
  };

  // 매직 브러시 부분 수정 토글
  const handleToggleMagicBrush = () => {
    setIsMagicBrushActive((prev) => !prev);
    showToast(
      !isMagicBrushActive 
        ? '🖌️ 매직 브러시 모드 활성화: 원하는 영역을 드래그하여 부분 수정하세요.' 
        : '매직 브러시 모드가 해제되었습니다.',
      'info'
    );
  };

  // 무손실 PNG 다운로드
  const handleDownloadPng = () => {
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `media-studio-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 무손실 PNG 이미지 다운로드가 시작되었습니다.', 'success');
  };

  // 체인 파이프라인: 5초 모션 영상 만들기
  const handleChainToVideo = () => {
    if (onTransferToVideo) {
      onTransferToVideo(currentImageUrl, promptText);
    } else {
      showToast('🎬 제2단계 5초 모션 영상 키프레임으로 이미지가 전달되었습니다!', 'info');
    }
  };

  // 체인 파이프라인: 내 노션 페이지 대표 커버로 전송
  const handleSendToNotionCover = () => {
    updateCurrentCover(currentImageUrl);
    showToast('⚡ 현재 이미지가 노션 워크스페이스 메인 커버로 즉시 반영되었습니다!', 'success');
  };

  const selectedRatioClass = ratioOptions.find((r) => r.id === aspectRatio)?.ratioClass || 'aspect-video';

  return (
    <div className="flex flex-col w-full space-y-5">
      
      {/* 1. 상단 3-알약 프리셋 바 (Capsule Selectors) */}
      <div className="bg-white dark:bg-neutral-800/90 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700 shadow-2xs space-y-3.5">
        
        {/* 알약 1: 제작 타입 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300 w-24 shrink-0">
            <Wand2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="whitespace-nowrap">제작 타입</span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {creationTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = creationType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setCreationType(opt.id)}
                  className={`
                    flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition
                    whitespace-nowrap cursor-pointer active:scale-95
                    ${isActive
                      ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300 dark:ring-amber-900'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{opt.label}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 알약 2: 화풍 스타일 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300 w-24 shrink-0">
            <Palette className="w-3.5 h-3.5 text-purple-500" />
            <span className="whitespace-nowrap">화풍 스타일</span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {styleOptions.map((opt) => {
              const isActive = style === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`
                    flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition
                    whitespace-nowrap cursor-pointer active:scale-95
                    ${isActive
                      ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300 dark:ring-purple-900'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                    }
                  `}
                >
                  <span className="whitespace-nowrap">{opt.label}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 알약 3: 종횡비 규격 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300 w-24 shrink-0">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="whitespace-nowrap">종횡비 규격</span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {ratioOptions.map((opt) => {
              const isActive = aspectRatio === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setAspectRatio(opt.id)}
                  className={`
                    flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition
                    whitespace-nowrap cursor-pointer active:scale-95
                    ${isActive
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-900'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                    }
                  `}
                >
                  <span className="whitespace-nowrap">{opt.label}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 프롬프트 입력 바 */}
      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2.5 rounded-2xl border border-slate-200 dark:border-neutral-700 shadow-2xs">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
        <input
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="상상하는 이미지를 자유롭게 묘사하세요..."
          className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !promptText.trim()}
          className="
            px-4 py-2 rounded-xl text-xs font-bold
            bg-neutral-900 text-white hover:bg-neutral-800
            dark:bg-white dark:text-neutral-900 dark:hover:bg-slate-100
            disabled:opacity-40 transition active:scale-95
            whitespace-nowrap shrink-0 shadow-xs flex items-center space-x-1.5
          "
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>생성 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>이미지 생성</span>
            </>
          )}
        </button>
      </div>

      {/* 2. 스마트 메인 캔버스 (Canvas-First Preview) */}
      <div 
        className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center group"
        onMouseEnter={() => setIsHoveringCanvas(true)}
        onMouseLeave={() => setIsHoveringCanvas(false)}
      >
        <div 
          className={`
            relative w-full ${selectedRatioClass} max-h-[550px]
            rounded-3xl overflow-hidden shadow-xl
            border border-slate-300 dark:border-neutral-700
            transition-all duration-300 flex items-center justify-center
            ${isTransparentBg ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-200 dark:bg-neutral-900' : 'bg-slate-900'}
          `}
        >
          {/* 이미지 프리뷰 */}
          <img
            src={currentImageUrl}
            alt="AI 메인 캔버스 프리뷰"
            className={`
              w-full h-full object-cover transition duration-300
              ${isTransparentBg ? 'filter drop-shadow-xl contrast-105' : ''}
              ${isMagicBrushActive ? 'cursor-crosshair opacity-90' : ''}
            `}
          />

          {/* 매직 브러시 모드 마스크 오버레이 시각화 */}
          {isMagicBrushActive && (
            <div className="absolute inset-0 bg-indigo-500/10 border-2 border-dashed border-indigo-400 pointer-events-none flex items-center justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-lg animate-pulse">
                🖌️ 매직 브러시 드래그 활성화됨
              </span>
            </div>
          )}

          {/* 호버/클릭 시 나타나는 캔버스 플로팅 툴바 */}
          <div
            className={`
              absolute top-4 right-4 z-20
              flex items-center space-x-1.5 p-1.5 rounded-2xl
              bg-neutral-900/85 dark:bg-neutral-900/90 backdrop-blur-md text-white
              border border-white/20 shadow-2xl transition-all duration-300
              ${isHoveringCanvas || isMagicBrushActive || isTransparentBg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}
          >
            {/* ✂️ 1초 누끼(배경 제거) */}
            <button
              onClick={handleToggleRemoveBg}
              className={`
                flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${isTransparentBg ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-white/20 text-slate-200'}
              `}
              title="1초 누끼 (투명 PNG 배경 분리)"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">✂️ 1초 누끼</span>
            </button>

            {/* 🖌️ 매직 브러시(부분 수정) */}
            <button
              onClick={handleToggleMagicBrush}
              className={`
                flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${isMagicBrushActive ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-white/20 text-slate-200'}
              `}
              title="매직 브러시 (영역 부분 수정)"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">🖌️ 매직 브러시</span>
            </button>

            {/* 💾 무손실 PNG 다운로드 */}
            <button
              onClick={handleDownloadPng}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/25 text-white transition cursor-pointer whitespace-nowrap"
              title="무손실 PNG 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">💾 PNG 다운로드</span>
            </button>
          </div>

          {/* 캔버스 하단 메타정보 정보 뱃지 */}
          <div className="absolute bottom-3 left-4 z-10 flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur border border-white/10">
              규격: {aspectRatio}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-900/70 text-purple-200 backdrop-blur border border-purple-500/30">
              스타일: {style}
            </span>
          </div>

        </div>
      </div>

      {/* 3. 체인 파이프라인 액션 바 */}
      <div className="bg-slate-100 dark:bg-neutral-800/80 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-neutral-300">
          <Layers className="w-4 h-4 text-purple-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-white whitespace-nowrap">체인 파이프라인:</span>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">완성된 캔버스 에셋을 다음 단계로 직접 전송합니다.</span>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
          {/* 🎬 이 이미지로 5초 모션 영상 만들기 */}
          <button
            onClick={handleChainToVideo}
            className="
              flex-1 sm:flex-initial
              flex items-center justify-center space-x-1.5
              px-4 py-2 rounded-xl text-xs font-bold
              bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
              text-white transition shadow-md active:scale-95
              whitespace-nowrap cursor-pointer
            "
          >
            <Film className="w-4 h-4" />
            <span className="whitespace-nowrap">🎬 이 이미지로 5초 모션 영상 만들기</span>
          </button>

          {/* ⚡ 내 노션 페이지 대표 커버로 전송 */}
          <button
            onClick={handleSendToNotionCover}
            className="
              flex-1 sm:flex-initial
              flex items-center justify-center space-x-1.5
              px-4 py-2 rounded-xl text-xs font-bold
              bg-amber-500 hover:bg-amber-600 text-white
              transition shadow-xs active:scale-95
              whitespace-nowrap cursor-pointer
            "
          >
            <Zap className="w-4 h-4" />
            <span className="whitespace-nowrap">⚡ 내 노션 페이지 대표 커버로 전송</span>
          </button>
        </div>

      </div>

    </div>
  );
};
