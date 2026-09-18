import React from 'react';
import { Clock, MessageSquare, Star, MoreHorizontal } from 'lucide-react';

interface NotionHeaderProps {
  title: string;
  icon: string;
  description?: string;
}

export const NotionHeader: React.FC<NotionHeaderProps> = ({ title, icon, description }) => {
  return (
    <div className="relative px-6 sm:px-12 md:px-16 pt-2 pb-6">
      {/* Notion Floating Emoji Icon */}
      <div className="-mt-14 sm:-mt-16 mb-4 flex items-center justify-between">
        <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-xl flex items-center justify-center text-4xl sm:text-5xl select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer p-1">
          <span>{icon || '📑'}</span>
        </div>

        {/* Notion Action Toolbar Mockup */}
        <div className="flex items-center space-x-2 text-neutral-400 dark:text-neutral-500 text-xs">
          <button className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            <Star className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">즐겨찾기</span>
          </button>
          <button className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">수정됨</span>
          </button>
          <button className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3 leading-tight">
        {title}
      </h1>

      {/* Page Description */}
      {description && (
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl mb-4">
          {description}
        </p>
      )}

      {/* Notion Sub Actions Mockup */}
      <div className="flex items-center space-x-3 text-xs text-neutral-400 dark:text-neutral-500 pt-1 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
        <span className="flex items-center space-x-1 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>댓글 추가</span>
        </span>
        <span>•</span>
        <span className="text-[11px]">템플릿 구조 v1.0</span>
      </div>
    </div>
  );
};
