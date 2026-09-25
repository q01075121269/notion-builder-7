// src/components/media/MediaArtifactStage.tsx
// 중앙 라이브 미디어 캔버스 뷰어 (실체 고화질 비주얼 렌더러, 비율 스위처 물리 바인딩, 세이프존, 유틸리티 알약)

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Link as LinkIcon, 
  Cloud, 
  Smartphone, 
  ShieldCheck, 
  Camera,
  Check
} from 'lucide-react';
import type { MediaArtifact } from '../../types/media';
import type { MVPipelineResult } from '../../lib/media/videoPipeline';
import type { VPOOptimizationResult } from '../../lib/media/vpo';
import { resolveVisualAssetByPrompt, downloadImageDirectly } from '../../lib/media/visualAssets';

interface MediaArtifactStageProps {
  artifact: MediaArtifact;
  mvData?: MVPipelineResult | null;
  vpoData?: VPOOptimizationResult | null;
  aspectRatio: '16:9' | '9:16' | '1:1';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1') => void;
  onSave4K: () => void;
  onNotionSync: () => void;
  onCopyLink: () => void;
}

export const MediaArtifactStage: React.FC<MediaArtifactStageProps> = ({
  artifact,
  mvData,
  vpoData: _vpoData,
  aspectRatio,
  onAspectRatioChange,
  onSave4K,
  onNotionSync,
  onCopyLink
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 비주얼 프롬프트 매칭 실제 고화질 이미지 리소스 도출
  const visualInfo = resolveVisualAssetByPrompt(artifact.title || artifact.promptHistory[0]?.userRaw || '');
  const displayImageUrl = artifact.previewUrl || visualInfo.imageUrl;

  const isVideoMode = artifact.domain === 'video';
  const totalDuration = mvData?.totalDuration || 16;

  // 비디오/MV 모드일 때만 타이머 시뮬레이션 가동
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVideoMode && isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => (prev >= totalDuration ? 0 : Number((prev + 0.1).toFixed(1))));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isVideoMode, isPlaying, totalDuration]);

  // 비율에 따른 물리 캔버스 컨테이너 스타일 계산
  const getAspectContainerClass = () => {
    if (aspectRatio === '16:9') {
      return 'aspect-video max-w-4xl w-full';
    }
    if (aspectRatio === '9:16') {
      return 'aspect-[9/16] max-w-sm w-full';
    }
    return 'aspect-square max-w-md w-full';
  };

  const handleDownload = async () => {
    onSave4K();
    await downloadImageDirectly(displayImageUrl, `${artifact.title || 'noa-visual-master'}.png`);
  };

  const handleCopyLinkWithFeedback = () => {
    onCopyLink();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative select-none animate-fadeIn pb-4"
    >
      {/* ======================================================================= */}
      {/* 1. 상단 미니멀 컨트롤 바: 비율 원클릭 스위처 & 쇼츠 세이프존 토글 */}
      {/* ======================================================================= */}
      <div className="w-full flex items-center justify-between pb-3 px-1 text-xs">
        
        {/* 비율 원클릭 스위처 (16:9 / 9:16 / 1:1 물리 전환) */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <button
            onClick={() => onAspectRatioChange('16:9')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs scale-102'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            16:9 와이드 (유튜브)
          </button>

          <button
            onClick={() => onAspectRatioChange('9:16')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs scale-102'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            9:16 세로 (쇼츠/릴스)
          </button>

          <button
            onClick={() => onAspectRatioChange('1:1')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              aspectRatio === '1:1'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs scale-102'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            1:1 정방형 (인스타)
          </button>
        </div>

        {/* 9:16 모드 진입 시 세이프존 가이드 토글 스위치 및 서명 배지 */}
        <div className="flex items-center gap-2">
          {aspectRatio === '9:16' && (
            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium border transition cursor-pointer ${
                showSafeZone
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>쇼츠 세이프존 {showSafeZone ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>C2PA SynthID 서명 완료</span>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. 대형 캔버스 뷰어 컨테이너 (비율 물리 바인딩 & 호버 시 플로팅 알약) */}
      {/* ======================================================================= */}
      <div 
        className={`${getAspectContainerClass()} bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 ease-out group`}
      >
        {/* ------------------------------------------------------------------- */}
        {/* 마우스 호버(Hover) 시에만 나타나는 상단 플로팅 알약 UI */}
        {/* ------------------------------------------------------------------- */}
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-700/90 shadow-2xl backdrop-blur-xl opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto"
        >
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="고화질 저장"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>고화질 저장</span>
          </button>

          <button
            onClick={handleCopyLinkWithFeedback}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="링크 복사"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
            ) : (
              <LinkIcon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            )}
            <span>{isCopied ? '복사됨' : '링크 복사'}</span>
          </button>

          <button
            onClick={onNotionSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="노션 DB 적재"
          >
            <Cloud className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>노션 DB 적재</span>
          </button>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 실제 고화질 캔버스 미디어 렌더러 (얼굴/머리 잘림 100% 방지: 듀얼 시네마틱 뷰) */}
        {/* ------------------------------------------------------------------- */}
        <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
          {/* 뒤편 배경: 동일 이미지의 앰비언트 블러 글로우로 여백을 품격있게 채움 */}
          <img 
            src={displayImageUrl} 
            alt="" 
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-35 scale-110 pointer-events-none select-none"
          />

          {/* 전면 메인 뷰: 머리끝 정수리부터 턱/어깨선까지 100% 온전하게 보이는 object-contain 뷰 */}
          <div className="w-full h-full max-h-[520px] flex items-center justify-center p-3 sm:p-5 relative z-10">
            <img 
              src={displayImageUrl} 
              alt={artifact.title}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-500 ease-out group-hover:scale-[1.01]"
              loading="eager"
            />
          </div>

          {/* 부드러운 하단 그라디언트 비네팅 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-15" />
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 9:16 모바일 쇼츠 세이프존(Safe Zone) 마스크 가이드 (토글 시에만 노출) */}
        {/* ------------------------------------------------------------------- */}
        {aspectRatio === '9:16' && showSafeZone && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3.5">
            {/* 상단 헤더 영역 마스크 */}
            <div className="border border-dashed border-amber-400/50 rounded-xl p-1.5 flex justify-between items-center bg-black/30 backdrop-blur-2xs">
              <span className="text-[9px] font-mono text-amber-300 font-semibold">쇼츠 상단 헤더 영역</span>
              <span className="text-[9px] font-mono text-amber-300">검색 / 메뉴</span>
            </div>

            {/* 우측 72px 버튼 세이프존 마스크 */}
            <div className="self-end w-[72px] h-[200px] border border-dashed border-amber-400/50 rounded-xl p-1 flex flex-col justify-around items-center bg-black/30 backdrop-blur-2xs my-auto">
              <span className="text-[8px] font-mono text-amber-300">좋아요</span>
              <span className="text-[8px] font-mono text-amber-300">댓글</span>
              <span className="text-[8px] font-mono text-amber-300">공유</span>
              <span className="text-[8px] font-mono text-amber-300">리믹스</span>
            </div>

            {/* 하단 180px 제목/사운드 세이프존 마스크 */}
            <div className="w-full h-[120px] border border-dashed border-amber-400/50 rounded-xl p-2 flex flex-col justify-between bg-black/30 backdrop-blur-2xs">
              <span className="text-[9px] font-mono text-amber-300 font-semibold">
                하단 세이프존 마스크 (제목/사운드 180px)
              </span>
              <span className="text-[8px] font-mono text-zinc-300 text-right">
                ※ 중요 자막 및 피사체는 이 상단 배치 권장
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* 캔버스 하단 단정하고 우아한 프롬프트 메타데이터 뱃지 바 (영문 메타 전면 삭제) */}
        {/* ------------------------------------------------------------------- */}
        <div className="relative z-30 p-4 sm:p-5 flex flex-col gap-2 mt-auto">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm sm:text-base text-white drop-shadow-md tracking-tight flex items-center gap-2 break-keep font-medium truncate max-w-xs sm:max-w-md">
              <Camera className="w-4 h-4 text-zinc-300 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{artifact.title || visualInfo.title}</span>
            </h3>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-black/60 text-emerald-400 backdrop-blur-md border border-emerald-500/20 shadow-xs">
                📸 포토리얼 실사 8K
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/50 text-zinc-300 backdrop-blur-md border border-white/10">
                {aspectRatio}
              </span>
            </div>
          </div>

          {/* 비디오 모드일 때만 재생 바 시각화 */}
          {isVideoMode && mvData && (
            <div className="pt-2 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Play className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </button>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-300">
                {currentTime.toFixed(1)}s / {totalDuration}s
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
