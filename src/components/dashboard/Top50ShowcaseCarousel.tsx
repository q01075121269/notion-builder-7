import React, { useRef } from 'react';
import { TOP_50_SHOWCASE_TEMPLATES, type Top50TemplateItem } from '../../services/top50Templates';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Sparkles, 
  Eye, 
  Heart,
  Calendar
} from 'lucide-react';

interface Top50ShowcaseCarouselProps {
  onSelectTemplate: (template: Top50TemplateItem) => void;
  onInstantImport: (template: Top50TemplateItem) => void;
  isImportingId?: string | null;
}

export const Top50ShowcaseCarousel: React.FC<Top50ShowcaseCarouselProps> = ({
  onSelectTemplate,
  onInstantImport,
  isImportingId
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-neutral-950 font-black shadow-sm';
    if (rank === 2) return 'bg-slate-300 text-neutral-900 font-bold';
    if (rank === 3) return 'bg-amber-700 text-white font-bold';
    return 'bg-neutral-900/80 dark:bg-white/90 text-white dark:text-neutral-900 font-semibold';
  };

  return (
    <div className="relative w-full rounded-2xl bg-white dark:bg-notion-dark-card border border-slate-200/80 dark:border-neutral-800 shadow-xs p-5 transition">
      
      {/* 헤더 & 좌우 네비게이션 버튼 */}
      <div className="flex items-center justify-between gap-3 mb-4 select-none">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/40 whitespace-nowrap">
              <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>2026년 9월 시즌 쇼케이스</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 whitespace-nowrap">
              실시간 월간 베스트 50
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>월간 베스트 TOP 50 쇼케이스</span>
          </h3>
        </div>

        {/* 넷플릭스 스타일 좌우 슬라이드 컨트롤러 */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 flex items-center justify-center transition shadow-2xs active:scale-95 cursor-pointer"
            title="이전 템플릿 보기"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 flex items-center justify-center transition shadow-2xs active:scale-95 cursor-pointer"
            title="다음 템플릿 보기"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 가로 스크롤 캐러셀 영역 (NotebookLM / Netflix 스타일) */}
      <div 
        ref={scrollContainerRef}
        className="flex items-stretch space-x-3.5 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TOP_50_SHOWCASE_TEMPLATES.map((tpl) => {
          const isCurrentImporting = isImportingId === tpl.id;

          return (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl)}
              className="group relative w-64 sm:w-72 shrink-0 flex flex-col justify-between rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 hover:bg-white dark:hover:bg-neutral-900 hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden select-none"
            >
              {/* 상단 이미지 썸네일 & 순위 뱃지 */}
              <div className="relative h-28 w-full overflow-hidden bg-slate-200 dark:bg-neutral-800">
                <img
                  src={tpl.cover_url}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* 순위 뱃지 */}
                <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] tracking-tight ${getRankBadgeColor(tpl.rank)}`}>
                    {tpl.rank <= 3 ? `TOP ${tpl.rank}` : `${tpl.rank}위`}
                  </span>
                  {tpl.badge && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20 whitespace-nowrap">
                      {tpl.badge}
                    </span>
                  )}
                </div>

                {/* 이모지 + 카테고리 태그 */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between z-10">
                  <span className="text-xl p-0.5 rounded bg-white/90 dark:bg-neutral-900/90 shadow-2xs">
                    {tpl.icon}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/80 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-300 backdrop-blur-md whitespace-nowrap">
                    {tpl.tag}
                  </span>
                </div>
              </div>

              {/* 본문 설명 & 하단 액션 버튼 */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 dark:text-neutral-500">
                    <span className="flex items-center space-x-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      <span>{tpl.views.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-0.5">
                      <Heart className="w-2.5 h-2.5 text-rose-500" />
                      <span>{tpl.likes.toLocaleString()}</span>
                    </span>
                  </div>

                  {/* [⚡ 노션 즉시 가져오기] 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInstantImport(tpl);
                    }}
                    disabled={isCurrentImporting}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs transition active:scale-95 disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
                    title="내 노션 워크스페이스에 즉시 생성 및 복제합니다"
                  >
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>{isCurrentImporting ? '생성 중...' : '노션 가져오기'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
