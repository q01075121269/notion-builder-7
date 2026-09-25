// src/components/office/charts/InteractiveBarChart.tsx
// 순수 React + SVG + Tailwind 기반 고대비 인터랙티브 막대 차트

import React, { useState } from 'react';

export interface BarChartItem {
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
}

interface InteractiveBarChartProps {
  data?: BarChartItem[];
  title?: string;
  growthTag?: string;
  unit?: string;
  height?: number;
  className?: string;
}

const DEFAULT_DATA: BarChartItem[] = [
  { label: '2024', value: 45, sublabel: '도입 전' },
  { label: '2025', value: 78, sublabel: '파일럿 부서' },
  { label: '2026 (목표)', value: 120, sublabel: '전사 확산 (+38%)' }
];

export const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  data = DEFAULT_DATA,
  title = '연도별 자동화 처리량 및 생산성 추이',
  growthTag = '+38% 폭풍 성장',
  unit = 'k건',
  height = 200,
  className = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className={`w-full p-4 rounded-2xl bg-zinc-900/90 dark:bg-zinc-900/90 border border-zinc-800 text-zinc-100 flex flex-col justify-between shadow-sm ${className}`}>
      {/* 헤더 및 성장률 뱃지 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold text-zinc-200">{title}</h4>
          <p className="text-[11px] text-zinc-400">데이터 기반 검증 지표</p>
        </div>
        {growthTag && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {growthTag}
          </span>
        )}
      </div>

      {/* SVG 및 바 렌더링 영역 */}
      <div className="relative w-full flex items-end justify-around gap-2 sm:gap-6 pt-6 pb-2" style={{ height: `${height}px` }}>
        {/* 배경 가로 눈금선 */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="w-full border-b border-dashed border-zinc-500" />
          <div className="w-full border-b border-dashed border-zinc-500" />
          <div className="w-full border-b border-dashed border-zinc-500" />
        </div>

        {data.map((item, idx) => {
          const heightPercent = Math.min(100, Math.round((item.value / maxValue) * 100));
          const isHovered = hoveredIdx === idx;
          const isTarget = item.label.includes('목표') || idx === data.length - 1;

          return (
            <div
              key={idx}
              className="relative flex-1 flex flex-col items-center justify-end h-full z-10 group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* 호버 툴팁 */}
              {isHovered && (
                <div className="absolute -top-10 px-2.5 py-1 rounded-lg bg-zinc-950 text-white text-[11px] font-bold border border-zinc-700 shadow-xl pointer-events-none whitespace-nowrap animate-fadeIn z-20">
                  {item.label}: {item.value.toLocaleString()}{unit}
                  {item.sublabel && <span className="text-zinc-400 font-normal ml-1">({item.sublabel})</span>}
                </div>
              )}

              {/* 상단 값 표시 */}
              <span className={`text-[11px] font-bold font-mono mb-1 transition-all ${isHovered ? 'text-white scale-110' : 'text-zinc-400'}`}>
                {item.value}{unit}
              </span>

              {/* 막대 바 */}
              <div className="w-full max-w-[48px] bg-zinc-800/80 rounded-t-xl overflow-hidden flex items-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-xl transition-all duration-500 relative ${
                    item.color 
                      ? item.color 
                      : isTarget 
                        ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : 'bg-gradient-to-t from-zinc-700 to-zinc-500 hover:from-zinc-600 hover:to-zinc-400'
                  }`}
                >
                  {/* 상단 하이라이트 라인 */}
                  <div className="w-full h-1 bg-white/40 rounded-t-full" />
                </div>
              </div>

              {/* 하단 레이블 */}
              <div className="mt-2 text-center">
                <span className={`text-xs font-bold block truncate transition-colors ${isHovered ? 'text-white' : 'text-zinc-300'}`}>
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[10px] text-zinc-500 block truncate">
                    {item.sublabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
