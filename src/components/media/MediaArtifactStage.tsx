// src/components/media/MediaArtifactStage.tsx
// 중앙 라이브 미디어 캔버스 뷰어 (비율 원클릭 스위처, 9:16 쇼츠 세이프존, 키네틱 가라오케 자막, 비트 싱크 MV 플레이어)

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Cloud, 
  Smartphone, 
  ShieldCheck, 
  Film, 
  Music, 
  Image as ImageIcon 
} from 'lucide-react';
import type { MediaArtifact } from '../../types/media';
import type { MVPipelineResult } from '../../lib/media/videoPipeline';
import type { VPOOptimizationResult } from '../../lib/media/vpo';

interface MediaArtifactStageProps {
  artifact: MediaArtifact;
  mvData?: MVPipelineResult | null;
  vpoData?: VPOOptimizationResult | null;
  aspectRatio: '16:9' | '9:16' | '1:1';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1') => void;
  onSave4K: () => void;
  onNotionSync: () => void;
  onCopyLink: () => void;
  onSendEmail?: () => void;
  onLifeSync?: () => void;
}

export const MediaArtifactStage: React.FC<MediaArtifactStageProps> = ({
  artifact,
  mvData,
  vpoData,
  aspectRatio,
  onAspectRatioChange,
  onSave4K,
  onNotionSync,
  onCopyLink
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(5.2);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const totalDuration = mvData?.totalDuration || 16;

  // 비디오/MV 재생 프로그레스 시뮬레이션
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => (prev >= totalDuration ? 0 : Number((prev + 0.1).toFixed(1))));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalDuration]);

  // 현재 활성화된 씬 컷 계산 (EDL 매칭)
  const currentScene = mvData?.edlList.find(
    (cut) => currentTime >= cut.startTime && currentTime <= cut.endTime
  ) || mvData?.edlList[0];

  // 키네틱 가라오케 자막 단어 하이라이트 인덱스 계산
  const getKaraokeWords = () => {
    if (!currentScene) return [];
    const lyrics = currentScene.karaokeLyrics;
    const sceneElapsed = currentTime - currentScene.startTime;
    const sceneDuration = currentScene.endTime - currentScene.startTime;
    const activeIndex = Math.min(
      lyrics.length - 1,
      Math.floor((sceneElapsed / sceneDuration) * lyrics.length)
    );

    return lyrics.map((word, idx) => ({
      text: word,
      isHighlighted: idx <= activeIndex,
      isCurrent: idx === activeIndex
    }));
  };

  const karaokeWords = getKaraokeWords();

  return (
    <div 
      className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative group select-none animate-fadeIn"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ======================================================================= */}
      {/* 1. 상단 미니멀 컨트롤 바: 비율 원클릭 스위처 & 쇼츠 세이프존 토글 */}
      {/* ======================================================================= */}
      <div className="w-full flex items-center justify-between pb-3 px-1 text-xs">
        {/* 비율 원클릭 스위처 */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <button
            onClick={() => onAspectRatioChange('16:9')}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
              aspectRatio === '16:9'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            16:9 와이드 (유튜브)
          </button>

          <button
            onClick={() => onAspectRatioChange('9:16')}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            9:16 세로 (쇼츠/릴스)
          </button>

          <button
            onClick={() => onAspectRatioChange('1:1')}
            className={`px-3 py-1 rounded-xl font-semibold transition cursor-pointer ${
              aspectRatio === '1:1'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            1:1 정방형 (인스타)
          </button>
        </div>

        {/* 9:16 모드일 때 세이프존 가이드 토글 스위치 */}
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

          {/* VPO 또는 FaceID 서명 뱃지 */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>FaceID Lock 99.4%</span>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. 대형 캔버스 뷰어 컨테이너 (호버 시 플로팅 알약 노출) */}
      {/* ======================================================================= */}
      <div 
        className={`w-full bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
          aspectRatio === '16:9' 
            ? 'aspect-video max-w-5xl' 
            : aspectRatio === '9:16' 
              ? 'w-[320px] sm:w-[360px] h-[580px] sm:h-[640px]' 
              : 'aspect-square max-w-xl'
        }`}
      >
        {/* ------------------------------------------------------------------- */}
        {/* 마우스 호버(Hover) 시에만 나타나는 상단 플로팅 알약 UI */}
        {/* ------------------------------------------------------------------- */}
        <div 
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-700/90 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <button
            onClick={onSave4K}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="4K 무손실 내보내기"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>4K 무손실 내보내기</span>
          </button>

          <button
            onClick={onCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="공유"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>공유</span>
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
        {/* 메인 캔버스 렌더링 화면 (비디오/3D/MV 실시간 연출 시각화) */}
        {/* ------------------------------------------------------------------- */}
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center p-6">
          <div className="text-center space-y-3 max-w-md">
            <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center backdrop-blur-md border border-white/20">
              {artifact.domain === 'audio' ? (
                <Music className="w-8 h-8 text-white/90" strokeWidth={1.5} />
              ) : artifact.domain === 'visual' ? (
                <ImageIcon className="w-8 h-8 text-white/90" strokeWidth={1.5} />
              ) : (
                <Film className="w-8 h-8 text-white/90" strokeWidth={1.5} />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {artifact.title}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {vpoData?.technicalSpecs.engineOrCamera || 'Unreal Engine 5.5 Octane Render • 8K UHD'}
              </p>
              {mvData?.groundingRelighting && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {mvData.groundingRelighting.sourceAttribution}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 9:16 모바일 쇼츠 세이프존(Safe Zone) 마스크 가이드 */}
        {/* 우측 버튼 영역(72px)과 하단 제목 영역(180px)을 반투명 점선으로 표시 */}
        {/* ------------------------------------------------------------------- */}
        {aspectRatio === '9:16' && showSafeZone && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3">
            {/* 상단 헤더 세이프존 */}
            <div className="border border-dashed border-amber-400/40 rounded-lg p-1.5 flex justify-between items-center bg-amber-400/5">
              <span className="text-[9px] font-mono text-amber-300">쇼츠 상단 헤더 영역</span>
              <span className="text-[9px] font-mono text-amber-300">검색 / 카메라</span>
            </div>

            {/* 중간 우측 버튼 영역 (72px 너비 마스크) */}
            <div className="self-end w-[72px] h-[220px] border border-dashed border-amber-400/40 rounded-lg p-1 flex flex-col justify-around items-center bg-amber-400/5 my-auto">
              <span className="text-[8px] font-mono text-amber-300">좋아요</span>
              <span className="text-[8px] font-mono text-amber-300">댓글</span>
              <span className="text-[8px] font-mono text-amber-300">공유</span>
              <span className="text-[8px] font-mono text-amber-300">리믹스</span>
              <span className="text-[8px] font-mono text-amber-300">사운드</span>
            </div>

            {/* 하단 제목/캡션 영역 (180px 높이 마스크) */}
            <div className="w-full h-[140px] border border-dashed border-amber-400/40 rounded-lg p-2 flex flex-col justify-between bg-amber-400/5">
              <span className="text-[9px] font-mono text-amber-300">
                하단 세이프존 마스크 (제목/채널/사운드명 180px)
              </span>
              <span className="text-[8px] font-mono text-zinc-400 text-right">
                ※ 자막 및 피사체는 이 상단에 배치 권장
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* 키네틱 가라오케 자막 (Karaoke Subtitle) 오버레이 */}
        {/* ------------------------------------------------------------------- */}
        <div className="relative z-30 px-6 pb-2 text-center">
          <div className="inline-flex flex-wrap justify-center gap-1.5 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
            {karaokeWords.map((item, idx) => (
              <span
                key={idx}
                className={`text-sm sm:text-base font-bold transition-all duration-150 ${
                  item.isCurrent
                    ? 'text-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)]'
                    : item.isHighlighted
                      ? 'text-white'
                      : 'text-zinc-400 opacity-60'
                }`}
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* 3. 하단 비트 싱크 MV 타임라인 컨트롤러 & 비트 드롭 마커 */}
        {/* ------------------------------------------------------------------- */}
        <div className="relative z-30 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-2.5">
          {/* 현재 씬 및 카메라 모션 안내 */}
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="font-semibold text-white">
              {currentScene?.shotType || 'Scene 1: Intro Close-up'}
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              {currentTime.toFixed(1)}s / {totalDuration}s
            </span>
          </div>

          {/* 재생 시크바 & 비트 드롭 마커 (Beat Marker: 0s, 4s, 12s, 16s) */}
          <div className="relative w-full h-3 flex items-center group/timeline cursor-pointer">
            {/* 기본 트랙 */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>

            {/* 비트 드롭 마커 핀 포인트 시각화 */}
            {(mvData?.beatMarkers || [0, 4, 12, 16]).map((marker, mIdx) => {
              const posPercent = (marker / totalDuration) * 100;
              return (
                <div
                  key={mIdx}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] z-10"
                  style={{ left: `${posPercent}%` }}
                  title={`Beat Drop: ${marker}s`}
                />
              );
            })}
          </div>

          {/* 재생 컨트롤 버튼 및 씬 세부 정보 */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" strokeWidth={1.5} />
                )}
              </button>

              <span className="text-[11px] text-zinc-300 truncate max-w-xs">
                {currentScene?.cameraMotion || 'Cinematic Dolly Camera Rig'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
              <span>BPM {mvData?.bpm || 120}</span>
              <span>•</span>
              <span>4K 60FPS</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
