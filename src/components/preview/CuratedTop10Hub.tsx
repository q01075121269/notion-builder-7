import React, { useState } from 'react';
import { 
  SEPTEMBER_TOP_10_TEMPLATES, 
  type CuratedTemplateItem 
} from '../../services/curatedTemplates';
import { getSafeProperties } from '../../lib/templateUtils';
import { 
  Sparkles, 
  TrendingUp, 
  Eye, 
  Heart, 
  Database, 
  Layers, 
  MessageSquare, 
  ChevronRight, 
  Calendar,
  Filter
} from 'lucide-react';

interface CuratedTop10HubProps {
  onSelectTemplate: (item: CuratedTemplateItem) => void;
  onModifyWithChat: (item: CuratedTemplateItem) => void;
}

export const CuratedTop10Hub: React.FC<CuratedTop10HubProps> = ({
  onSelectTemplate,
  onModifyWithChat
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [likedTemplates, setLikedTemplates] = useState<Record<string, boolean>>({});

  const categories = ['전체', '업무/실무', '학업/스터디', '라이프/재무', '프로젝트/취업'];

  const filteredTemplates = selectedCategory === '전체'
    ? SEPTEMBER_TOP_10_TEMPLATES
    : SEPTEMBER_TOP_10_TEMPLATES.filter(t => t.category === selectedCategory);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedTemplates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 shadow-md ring-2 ring-yellow-300/60 font-black';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-neutral-900 shadow-sm ring-2 ring-slate-200/60 font-bold';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm ring-2 ring-amber-500/40 font-bold';
      default:
        return 'bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50/70 dark:bg-notion-dark-bg overflow-y-auto pb-20">
      
      {/* 1. 상단 시즌 히어로 배너 */}
      <div className="relative px-5 sm:px-8 py-7 bg-gradient-to-br from-indigo-900 via-neutral-900 to-slate-900 text-white overflow-hidden shrink-0 border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -right-8 -bottom-10 opacity-10 text-white pointer-events-none select-none text-[180px] font-black leading-none">
          09
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>2026년 9월 가을 시즌 큐레이션</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-neutral-200 backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>실시간 인기 트렌드 TOP 10</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            접속 월 기준 시즌별 노션 템플릿 큐레이션 허브
          </h2>
          
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed max-w-2xl">
            9월 3분기 실적 마감, 2학기 대학 개강, 갓생 루틴 및 하반기 자산 관리에 즉시 실전 투입 가능한 
            검증된 고도화 템플릿 10종입니다. 카드를 클릭해 <strong>실시간 노션 뷰와 DB 스키마 표</strong>를 분석해 보세요.
          </p>

          {/* 카테고리 필터 칩 */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-5">
            <div className="flex items-center space-x-1 mr-1 text-xs text-neutral-400 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>분류:</span>
            </div>
            {categories.map((cat) => {
              const count = cat === '전체' 
                ? SEPTEMBER_TOP_10_TEMPLATES.length 
                : SEPTEMBER_TOP_10_TEMPLATES.filter(t => t.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                    selectedCategory === cat
                      ? 'bg-white text-neutral-900 shadow-md font-bold ring-2 ring-white/50'
                      : 'bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. TOP 10 템플릿 카드 그리드 */}
      <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200 flex items-center space-x-2">
            <span>{selectedCategory} 템플릿 리스트</span>
            <span className="text-xs font-normal text-neutral-500">
              (총 {filteredTemplates.length}개)
            </span>
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
            💡 카드를 클릭하면 즉시 노션 비주얼과 DB 스키마 구조가 펼쳐집니다
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filteredTemplates.map((item) => {
            const hasFormula = item.template.databases?.some(db => 
              getSafeProperties(db?.properties).some(p => p.type === 'formula')
            );
            const dbCount = item.template.databases?.length || 0;
            const blockCount = item.template.page_layout?.length || 0;
            const isLiked = likedTemplates[item.id];
            const currentLikes = item.likes + (isLiked ? 1 : 0);

            return (
              <div
                key={item.id}
                onClick={() => onSelectTemplate(item)}
                className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card shadow-xs hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* 상단 썸네일 커버 & 배지 오버레이 */}
                <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={item.template.cover_url}
                    alt={item.template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* 순위 배지 & 카테고리 뱃지 */}
                  <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
                    <span className={`px-2.5 py-1 rounded-lg text-xs tracking-wider uppercase ${getRankBadgeStyle(item.rank)}`}>
                      {item.rank === 1 ? '🥇 TOP 1' : item.rank === 2 ? '🥈 TOP 2' : item.rank === 3 ? '🥉 TOP 3' : `${item.rank}위`}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                      {item.badge}
                    </span>
                  </div>

                  {/* 좋아요 버튼 & 카테고리 라벨 */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/80 dark:bg-black/60 text-neutral-800 dark:text-neutral-200 backdrop-blur-md">
                      {item.category}
                    </span>
                    <button
                      onClick={(e) => toggleLike(item.id, e)}
                      className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition cursor-pointer"
                      title="좋아요"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                    </button>
                  </div>

                  {/* 커버 하단 제목 및 이모지 */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center space-x-2.5 z-10">
                    <span className="text-2xl p-1 rounded-lg bg-white/90 dark:bg-neutral-900/90 shadow-sm shrink-0">
                      {item.template.icon || '📑'}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-amber-200 transition">
                      {item.template.title}
                    </h4>
                  </div>
                </div>

                {/* 중간 설명 및 스펙 배지 */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                      {item.template.description}
                    </p>

                    {/* 스펙 뱃지 칩들 */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        <Database className="w-3 h-3 text-indigo-500" />
                        <span>DB {dbCount}개</span>
                      </span>

                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        <Layers className="w-3 h-3 text-emerald-500" />
                        <span>블록 {blockCount}개</span>
                      </span>

                      {hasFormula && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                          <Sparkles className="w-3 h-3" />
                          <span>Formula 2.0 지원</span>
                        </span>
                      )}

                      <div className="ml-auto flex items-center space-x-3 text-[11px] text-neutral-400">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{item.views.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 text-rose-500" />
                          <span>{currentLikes.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 하단 실전 연동 원클릭 버튼 2종 */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    {/* 1. [원클릭 인터랙티브 분석 뷰] */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(item);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                      <span>🔍 구조 분석 &amp; 미리보기</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>

                    {/* 2. [💬 대화로 수정하기] */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onModifyWithChat(item);
                      }}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 transition cursor-pointer"
                      title="AI 채팅창에 프롬프트를 자동 입력하여 커스텀 수정을 진행합니다"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>대화로 수정</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
