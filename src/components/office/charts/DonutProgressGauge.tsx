// src/components/office/charts/DonutProgressGauge.tsx
// SVG strokeDasharray/strokeDashoffset 기반 원형 도넛 진행률 게이지

import React from 'react';

interface DonutProgressGaugeProps {
  value?: number; // 0 ~ 100
  max?: number;
  size?: number;
  strokeWidth?: number;
  title?: string;
  subtitle?: string;
  unit?: string;
  color?: string; // Tailwind hex or class color
  secondaryValue?: number;
  secondaryLabel?: string;
  className?: string;
}

export const DonutProgressGauge: React.FC<DonutProgressGaugeProps> = ({
  value = 84.5,
  max = 100,
  size = 180,
  strokeWidth = 16,
  title = '전사 업무 효율 개선율',
  subtitle = '목표 80% 초과 달성',
  unit = '%',
  color = '#3b82f6', // blue-500
  secondaryValue = 65,
  secondaryLabel = '예산 집행률',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), max);
  const strokeDashoffset = circumference - (clampedValue / max) * circumference;

  return (
    <div className={`p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 flex flex-col items-center justify-between shadow-sm ${className}`}>
      {/* 타이틀 헤더 */}
      <div className="w-full text-left mb-2">
        <h4 className="text-xs font-bold text-zinc-200">{title}</h4>
        {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
      </div>

      {/* SVG 도넛 본체 */}
      <div className="relative flex items-center justify-center my-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 배경 트랙 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-800/80 fill-none"
          />
          {/* 활성 프로그레스 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-1000 ease-out"
          />
        </svg>

        {/* 중앙 수치 라벨 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
            {value}
            <span className="text-base font-bold text-zinc-400 ml-0.5">{unit}</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
            OPTIMAL
          </span>
        </div>
      </div>

      {/* 하단 보조 서브 메트릭 바 */}
      {secondaryLabel && (
        <div className="w-full mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400 text-[11px]">{secondaryLabel}</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(100, secondaryValue)}%` }}
              />
            </div>
            <span className="font-mono font-bold text-zinc-200 text-xs">{secondaryValue}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
