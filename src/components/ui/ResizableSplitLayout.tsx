// src/components/ui/ResizableSplitLayout.tsx
// 데스크톱 2단 리사이저블 분할 레이아웃 (60FPS 드래그 + 원클릭 접기/펼치기)
// 좌측 또는 우측 사이드바(Inspector) 모두 지원

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ResizableSplitLayoutProps {
  // 신규 권장 Props (main: 메인 캔버스 75%, side: 인스펙터/패널 25%)
  mainContent?: ReactNode | ((props: { isCollapsed: boolean; toggleCollapse: () => void }) => ReactNode);
  sideContent?: ReactNode | ((props: { isCollapsed: boolean; toggleCollapse: () => void }) => ReactNode);
  side?: 'left' | 'right'; // 사이드 패널 위치 (기본값: 'right')

  // 레거시 호환용 Props
  leftContent?: ReactNode | ((props: { isCollapsed: boolean; toggleCollapse: () => void }) => ReactNode);
  rightContent?: ReactNode | ((props: { isCollapsed: boolean; toggleCollapse: () => void }) => ReactNode);

  defaultRatio?: number; // 기본 비율 (예: 25%)
  minRatio?: number;     // 최소 비율 (기본값: 15%)
  maxRatio?: number;     // 최대 비율 (기본값: 40%)
  storageKey?: string;   // 독립 로컬스토리지 저장 키
  minPixelWidth?: number;// 최소 너비 px (기본값: 220px)
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

export const ResizableSplitLayout: React.FC<ResizableSplitLayoutProps> = ({
  mainContent,
  sideContent,
  side = 'right',
  leftContent,
  rightContent,
  defaultRatio = 25,
  minRatio = 15,
  maxRatio = 40,
  storageKey = 'resizable_split_ratio',
  minPixelWidth = 220,
  className = '',
  leftClassName = '',
  rightClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 저장된 비율 로드
  const [ratio, setRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= maxRatio) {
          return parsed;
        }
      }
    } catch {
      // localStorage 접근 불가 환경 방어
    }
    return defaultRatio;
  });

  // 접힘(0%) 상태 관리 및 이전 너비 기억
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => ratio === 0);
  const [lastExpandedRatio, setLastExpandedRatio] = useState<number>(() => 
    ratio > 0 ? ratio : defaultRatio
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 비율 변경 시 localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, ratio.toString());
    } catch {
      // ignore
    }
  }, [ratio, storageKey]);

  // 원클릭 접기/펼치기 토글
  const toggleCollapse = useCallback(() => {
    if (isCollapsed || ratio === 0) {
      const restoreWidth = lastExpandedRatio >= minRatio && lastExpandedRatio <= maxRatio
        ? lastExpandedRatio 
        : defaultRatio;
      setRatio(restoreWidth);
      setIsCollapsed(false);
    } else {
      setLastExpandedRatio(ratio);
      setRatio(0);
      setIsCollapsed(true);
    }
  }, [isCollapsed, ratio, lastExpandedRatio, minRatio, maxRatio, defaultRatio]);

  // 마우스/터치 리사이징 로직 (Pointer Events + requestAnimationFrame 60FPS)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;

        // 사이드 패널의 위치에 따른 너비 계산 (좌측 vs 우측)
        const currentPixelX = side === 'right'
          ? rect.right - moveEvent.clientX
          : moveEvent.clientX - rect.left;

        let calculatedRatio = (currentPixelX / rect.width) * 100;

        // 15% 이하 또는 minPixelWidth 이하로 강하게 당기면 0%로 스냅 접힘
        const pixelThreshold = Math.max(minPixelWidth, (minRatio / 100) * rect.width);
        const snapThreshold = pixelThreshold * 0.75; // 75% 지점에서 0%로 스냅

        if (currentPixelX <= snapThreshold) {
          calculatedRatio = 0;
          setIsCollapsed(true);
        } else if (currentPixelX < pixelThreshold) {
          calculatedRatio = (pixelThreshold / rect.width) * 100;
          setIsCollapsed(false);
          setLastExpandedRatio(calculatedRatio);
        } else if (calculatedRatio > maxRatio) {
          calculatedRatio = maxRatio;
          setIsCollapsed(false);
          setLastExpandedRatio(calculatedRatio);
        } else {
          setIsCollapsed(false);
          setLastExpandedRatio(calculatedRatio);
        }

        setRatio(calculatedRatio);
      });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }, [maxRatio, minPixelWidth, minRatio, side]);

  // 실제 렌더링할 메인 및 사이드 컨텐츠 결정
  const effectiveMainContent = mainContent || (side === 'left' ? rightContent : leftContent);
  const effectiveSideContent = sideContent || (side === 'left' ? leftContent : rightContent);

  const renderSidePanel = () => (
    <div
      className={`w-full h-full min-h-0 transition-[width] ease-out shrink-0 overflow-hidden ${
        isDragging ? 'duration-0' : 'duration-200'
      } ${
        isCollapsed ? 'hidden md:block md:!w-0' : 'md:block'
      } ${side === 'left' ? leftClassName : rightClassName}`}
      {...(!isCollapsed && {
        style: {
          width: `calc(${ratio}% - 5px)`,
          minWidth: ratio > 0 ? `${minPixelWidth}px` : 0,
        },
      })}
    >
      <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
        {typeof effectiveSideContent === 'function' 
          ? effectiveSideContent({ isCollapsed, toggleCollapse }) 
          : effectiveSideContent}
      </div>
    </div>
  );

  const renderMainCanvas = () => (
    <div
      className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden transition-all ${
        isDragging ? 'duration-0' : 'duration-200'
      } ${side === 'left' ? rightClassName : leftClassName}`}
    >
      {typeof effectiveMainContent === 'function' 
        ? effectiveMainContent({ isCollapsed, toggleCollapse }) 
        : effectiveMainContent}
    </div>
  );

  const renderSplitter = () => (
    <div
      onPointerDown={handlePointerDown}
      className={`hidden md:flex relative group items-center justify-center shrink-0 w-2.5 -mx-1 z-30 cursor-col-resize transition-colors duration-150 ${
        isDragging
          ? 'bg-zinc-300 dark:bg-zinc-700'
          : 'hover:bg-zinc-200/80 dark:hover:bg-zinc-800'
      }`}
      title="마우스로 드래그하여 패널 너비를 조절하거나 알약 버튼을 클릭하여 접으세요 (15% ~ 40%)"
    >
      {/* 세로 구분선 가이드라인 */}
      <div
        className={`w-[1px] h-full transition-colors ${
          isDragging
            ? 'bg-zinc-400 dark:bg-zinc-500'
            : 'bg-zinc-200 dark:bg-zinc-800 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'
        }`}
      />

      {/* 원클릭 스냅 접기/펼치기 미니 알약 버튼 [◀ / ▶] */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleCollapse();
        }}
        className="absolute z-40 flex items-center justify-center w-5 h-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-90 cursor-pointer"
        title={
          side === 'right'
            ? (isCollapsed ? '우측 인스펙터 패널 펼치기' : '우측 인스펙터 패널 접기 (전체화면 캔버스)')
            : (isCollapsed ? '좌측 패널 펼치기' : '좌측 패널 접기 (전체화면 캔버스)')
        }
      >
        {side === 'right' ? (
          isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col md:flex-row w-full h-full min-h-0 overflow-hidden select-none ${className}`}
    >
      {/* 드래그 중 마우스 이탈 방지 및 텍스트 선택 방지 전역 오버레이 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      {side === 'left' ? (
        <>
          {renderSidePanel()}
          {renderSplitter()}
          {renderMainCanvas()}
        </>
      ) : (
        <>
          {renderMainCanvas()}
          {renderSplitter()}
          {renderSidePanel()}
        </>
      )}
    </div>
  );
};

export default ResizableSplitLayout;
