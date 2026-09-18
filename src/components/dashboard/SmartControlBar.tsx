import React from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  FolderGit2, 
  ArrowUpDown
} from 'lucide-react';

export type ArchiveViewMode = 'card' | 'list' | 'collection';
export type SortOption = 'newest' | 'name';

interface SmartControlBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ArchiveViewMode;
  onViewModeChange: (mode: ArchiveViewMode) => void;
  totalCount: number;
}

export const SmartControlBar: React.FC<SmartControlBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount
}) => {
  const categories = [
    { label: '전체', value: '전체' },
    { label: '#업무/프로젝트', value: '#업무/프로젝트' },
    { label: '#가계부/재테크', value: '#가계부/재테크' },
    { label: '#루틴/자기계발', value: '#루틴/자기계발' },
    { label: '#학업/스터디', value: '#학업/스터디' }
  ];

  return (
    <div className="w-full space-y-3 select-none">
      
      {/* 상단 1열: 검색 인풋 + 정렬 + 3대 뷰 전환 세그먼트 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* [좌측]: 실시간 검색 인풋 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 템플릿 검색 (제목, 설명, 태그)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-300 dark:focus:ring-neutral-700 shadow-2xs transition"
          />
        </div>

        {/* [우측]: 정렬 셀렉터 + 3대 뷰 전환 버튼 */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-nowrap shrink-0">
          
          {/* 정렬 셀렉터 */}
          <div className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-800 text-xs text-slate-700 dark:text-neutral-300 shadow-2xs shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-hidden cursor-pointer whitespace-nowrap"
            >
              <option value="newest" className="dark:bg-neutral-900">최신순</option>
              <option value="name" className="dark:bg-neutral-900">이름순</option>
            </select>
          </div>

          {/* 3대 뷰 전환 세그먼트 버튼 */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-neutral-700/80 shrink-0">
            {/* 1. [ ⊞ 카드 ] */}
            <button
              onClick={() => onViewModeChange('card')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-notion-dark-card text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="비주얼 썸네일과 스키마 정보가 돋보이는 갤러리 뷰"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>카드</span>
            </button>

            {/* 2. [ ☰ 목록 ] */}
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-notion-dark-card text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="테이블 스프레드시트 형태의 컴팩트 리스트 뷰"
            >
              <List className="w-3.5 h-3.5 shrink-0" />
              <span>목록</span>
            </button>

            {/* 3. [ 🗂 컬렉션 ] */}
            <button
              onClick={() => onViewModeChange('collection')}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                viewMode === 'collection'
                  ? 'bg-white dark:bg-notion-dark-card text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="폴더 단위로 묶여 서랍처럼 펼쳐지는 그룹형 폴더 뷰"
            >
              <FolderGit2 className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
              <span>컬렉션</span>
            </button>
          </div>
        </div>
      </div>

      {/* 하단 2열: 카테고리 알약 필터 칩 */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center space-x-1.5 shrink-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer select-none ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold'
                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200/80 dark:border-neutral-700/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap hidden sm:inline">
          총 {totalCount}개의 저장된 템플릿
        </div>
      </div>
    </div>
  );
};
