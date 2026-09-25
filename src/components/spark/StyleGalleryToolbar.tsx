// src/components/spark/StyleGalleryToolbar.tsx
// 5대 프리미엄 비주얼 스타일 갤러리 툴바 컴포넌트

import React from 'react';
import type { SparkVisualStyle } from '../../types/visualStyle';
import { VISUAL_STYLES } from '../../types/visualStyle';
import { Palette, Sparkles, Check } from 'lucide-react';

interface StyleGalleryToolbarProps {
  activeStyle: SparkVisualStyle;
  onSelectStyle: (style: SparkVisualStyle) => void;
}

export const StyleGalleryToolbar: React.FC<StyleGalleryToolbarProps> = ({
  activeStyle,
  onSelectStyle
}) => {
  const stylesList = Object.values(VISUAL_STYLES);

  return (
    <div className="w-full px-4 sm:px-6 py-2 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto select-none transition-colors duration-200">
      
      {/* 갤러리 타이틀 라벨 */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <Palette className="w-4 h-4" />
        </div>
        <div className="hidden md:block">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              비주얼 스타일 갤러리
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              5대 규격
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">클릭 즉시 모든 산출물에 일괄 적용</p>
        </div>
      </div>

      {/* 5대 스타일 카드 버튼 목록 */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {stylesList.map((st) => {
          const isActive = st.id === activeStyle;

          return (
            <button
              key={st.id}
              onClick={() => onSelectStyle(st.id)}
              className={`
                group relative px-2.5 sm:px-3 py-1.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center space-x-2
                ${isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md font-bold scale-[1.02]'
                  : 'bg-white/80 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }
              `}
              title={`${st.name}: ${st.tagline}`}
            >
              {/* 이모지 아이콘 */}
              <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                {st.emoji}
              </span>

              {/* 텍스트 메타 */}
              <div className="flex flex-col">
                <span className={`text-xs whitespace-nowrap leading-tight ${isActive ? 'text-white dark:text-zinc-900 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-medium'}`}>
                  {st.shortName}
                </span>
                <span className={`hidden xl:inline text-[9px] truncate max-w-[120px] ${isActive ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {st.tagline.slice(0, 16)}...
                </span>
              </div>

              {/* 활성 체크 표시 */}
              {isActive && (
                <div className="w-3.5 h-3.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex items-center justify-center shrink-0 ml-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 우측 힌트 */}
      <div className="hidden lg:flex items-center space-x-1 text-[11px] text-slate-400 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>채팅창에 "3D 테크 스타일로 바꿔줘"처럼 지시 가능</span>
      </div>

    </div>
  );
};
