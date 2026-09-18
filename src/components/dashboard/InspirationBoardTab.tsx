import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Image as ImageIcon 
} from 'lucide-react';
import type { InspirationItem } from '../../types/dashboard';

interface InspirationBoardTabProps {
  items: InspirationItem[];
  onDelete: (id: string) => void;
  onOpenNewModal: () => void;
}

export const InspirationBoardTab: React.FC<InspirationBoardTabProps> = ({
  items,
  onDelete,
  onOpenNewModal
}) => {
  const { updateCurrentCover } = useApp();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [appliedUrl, setAppliedUrl] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('전체');

  const categories = ['전체', '커버 이미지', '레이아웃 영감', '컬러 팔레트', '아이콘/배경'];

  const filtered = selectedCat === '전체'
    ? items
    : items.filter(i => i.category === selectedCat);

  const handleApplyCover = (url: string) => {
    updateCurrentCover(url);
    setAppliedUrl(url);
    setTimeout(() => setAppliedUrl(null), 2000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedCat === cat
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add Pin Button */}
        <button
          onClick={onOpenNewModal}
          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>영감 이미지 스크랩</span>
        </button>
      </div>

      {/* Pinterest-style Masonry Columns */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 space-y-2">
          <ImageIcon className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium">등록된 영감 이미지가 없습니다.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative break-inside-avoid rounded-2xl overflow-hidden border border-neutral-200 dark:border-notion-dark-border bg-white dark:bg-notion-dark-card shadow-xs hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                
                {/* Floating Category Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium">
                  {item.category}
                </div>

                {/* Hover Overlay with Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                  <div className="flex justify-end space-x-1.5">
                    <button
                      onClick={() => handleCopyUrl(item.imageUrl)}
                      className="p-1.5 rounded-lg bg-white/90 text-neutral-800 hover:bg-white transition"
                      title="이미지 URL 복사"
                    >
                      {copiedUrl === item.imageUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/90 text-neutral-800 hover:bg-white transition"
                      title="새 탭에서 원본 보기"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        if (confirm(`'${item.title}' 영감 카드를 삭제하시겠습니까?`)) {
                          onDelete(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white transition"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Apply Cover Button */}
                  <button
                    onClick={() => handleApplyCover(item.imageUrl)}
                    className="w-full py-2 px-3 rounded-lg bg-white text-neutral-900 font-bold text-xs shadow-md hover:bg-neutral-100 transition flex items-center justify-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {appliedUrl === item.imageUrl ? '커버에 적용 완료!' : '현재 템플릿 커버로 적용'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 space-y-1">
                <h5 className="font-bold text-xs text-neutral-900 dark:text-white line-clamp-1">
                  {item.title}
                </h5>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{item.author || 'Unsplash'}</span>
                  <div className="flex gap-1">
                    {(item.tags || []).slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[10px] text-neutral-500">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
