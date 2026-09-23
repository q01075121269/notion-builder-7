import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ResizableSplitLayoutProps {
  leftContent: ReactNode | ((props: { isCollapsed: boolean; toggleCollapse: () => void }) => ReactNode);
  rightContent: ReactNode | ((props: { isCollapsed: boolean; toggleCollapse: () => void }) => ReactNode);
  defaultRatio?: number; // 기본 비율 (예: 25%)
  minRatio?: number;     // 최소 비율 (기본값: 15%)
  maxRatio?: number;     // 최대 비율 (기본값: 40%)
  storageKey?: string;   // 챕터별 독립 로컬스토리지 저장 키
  minPixelWidth?: number;// 최소 너비 px (기본값: 220px)
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

export const ResizableSplitLayout: React.FC<ResizableSplitLayoutProps> = ({
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

    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0) return;

        const currentPixelX = moveEvent.clientX - rect.left;
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
  }, [maxRatio, minPixelWidth, minRatio]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col md:flex-row w-full h-full min-h-0 overflow-hidden select-none ${className}`}
    >
      {/* 드래그 중 마우스 이탈 방지 및 텍스트 선택 방지 전역 오버레이 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      {/* 좌측 패널 (기본 25%, 15%~40% 조절 가능 / 모바일은 상하 스택) */}
      <div
        className={`w-full h-full min-h-0 transition-[width] ease-out shrink-0 overflow-hidden ${
          isDragging ? 'duration-0' : 'duration-200'
        } ${
          isCollapsed ? 'hidden md:block md:!w-0' : 'md:block'
        } ${leftClassName}`}
        {...(!isCollapsed && {
          style: {
            width: `calc(${ratio}% - 5px)`,
            minWidth: ratio > 0 ? `${minPixelWidth}px` : 0,
          },
        })}
      >
        <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
          {typeof leftContent === 'function' ? leftContent({ isCollapsed, toggleCollapse }) : leftContent}
        </div>
      </div>

      {/* 중앙 분할 구분선 (Splitter Bar) - 데스크톱 전용 */}
      <div
        onPointerDown={handlePointerDown}
        className={`hidden md:flex relative group items-center justify-center shrink-0 w-2.5 -mx-1 z-30 cursor-col-resize transition-colors duration-150 ${
          isDragging
            ? 'bg-slate-300 dark:bg-slate-700'
            : 'hover:bg-slate-200/80 dark:hover:bg-slate-800'
        }`}
        title="마우스로 드래그하여 패널 너비를 조절하거나 알약 버튼을 클릭하여 접으세요 (15% ~ 40%)"
      >
        {/* 세로 구분선 가이드라인 */}
        <div
          className={`w-[1px] h-full transition-colors ${
            isDragging
              ? 'bg-slate-400 dark:bg-slate-500'
              : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
          }`}
        />

        {/* 원클릭 스냅 접기/펼치기 미니 알약 버튼 [◀ / ▶] */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          className="absolute z-40 flex items-center justify-center w-5 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-90 cursor-pointer"
          title={isCollapsed ? '좌측 에이전트 패널 펼치기' : '좌측 에이전트 패널 접기 (전체화면 캔버스)'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 우측 메인 캔버스 영역 (기본 75%) */}
      <div
        className={`flex-1 h-full min-h-0 flex flex-col overflow-hidden transition-all ${
          isDragging ? 'duration-0' : 'duration-200'
        } ${rightClassName}`}
      >
        {typeof rightContent === 'function' ? rightContent({ isCollapsed, toggleCollapse }) : rightContent}
      </div>
    </div>
  );
};

export default ResizableSplitLayout;
