import React, { useState } from 'react';
import type { NotionBlock, CalloutBlock, ToggleBlock, ColumnListBlock } from '../../types/notion';
import { useApp } from '../../context/AppContext';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';

export const NotionBlocks: React.FC<{ blocks: NotionBlock[] }> = ({ blocks }) => {
  const { recentModifications } = useApp();

  return (
    <div className="space-y-4 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
      {blocks.map((block, index) => {
        const contentStr = 'content' in block ? (block as any).content : ('title' in block ? (block as any).title : '');
        const isModified = recentModifications.blockContents.some(c => 
          c && contentStr && (contentStr.includes(c) || c.includes(contentStr))
        );

        return (
          <div 
            key={block.id || `block-${index}`} 
            className={`relative rounded-xl transition-all ${
              isModified ? 'ring-2 ring-emerald-500/40 p-1.5 bg-emerald-50/20 dark:bg-emerald-950/10' : ''
            }`}
          >
            {isModified && (
              <div className="absolute -top-2.5 right-3 z-10 flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shadow-xs animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
                <span>새 블록 추가됨</span>
              </div>
            )}
            <BlockRenderer block={block} />
          </div>
        );
      })}
    </div>
  );
};

export const BlockRenderer: React.FC<{ block: NotionBlock }> = ({ block }) => {
  switch (block.type) {
    case 'callout':
      return <CalloutBlockView block={block as CalloutBlock} />;
    case 'column_list':
      return <ColumnListBlockView block={block as ColumnListBlock} />;
    case 'toggle':
      return <ToggleBlockView block={block as ToggleBlock} />;
    case 'heading_1':
      return (
        <h1 className="text-xl sm:text-2xl font-bold mt-6 mb-2 text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-1">
          {block.content}
        </h1>
      );
    case 'heading_2':
      return (
        <h2 className="text-lg sm:text-xl font-semibold mt-4 mb-2 text-neutral-900 dark:text-neutral-100">
          {block.content}
        </h2>
      );
    case 'heading_3':
      return (
        <h3 className="text-base sm:text-lg font-semibold mt-3 mb-1 text-neutral-900 dark:text-neutral-100">
          {block.content}
        </h3>
      );
    case 'bulleted_list_item':
      return (
        <div className="flex items-start space-x-2 pl-2">
          <span className="text-neutral-400 select-none">•</span>
          <span>{block.content}</span>
        </div>
      );
    case 'divider':
      return <hr className="my-4 border-neutral-200 dark:border-neutral-800" />;
    case 'database_view':
      return (
        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs flex items-center space-x-2 text-neutral-600 dark:text-neutral-300">
          <span>🔗 데이터베이스 뷰 연동:</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{block.database_name}</span>
        </div>
      );
    case 'paragraph':
    default:
      return <p className="leading-relaxed">{'content' in block ? (block as any).content : ''}</p>;
  }
};

// 1. Callout Block View
const CalloutBlockView: React.FC<{ block: CalloutBlock }> = ({ block }) => {
  const getColorClass = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200';
      case 'amber':
      case 'yellow':
        return 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200';
      case 'emerald':
      case 'green':
        return 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200';
      case 'purple':
        return 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40 text-purple-900 dark:text-purple-200';
      default:
        return 'bg-neutral-100/80 dark:bg-neutral-800/60 border-neutral-200/80 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200';
    }
  };

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-lg border ${getColorClass(block.color)} transition`}>
      <span className="text-xl flex-shrink-0 select-none">{block.icon || '💡'}</span>
      <div className="flex-1 font-normal leading-relaxed">{block.content}</div>
    </div>
  );
};

// 2. Toggle Block View
const ToggleBlockView: React.FC<{ block: ToggleBlock }> = ({ block }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 overflow-hidden bg-white/40 dark:bg-neutral-900/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition group"
      >
        <span className="text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
          {block.title}
        </span>
      </button>

      {isOpen && (
        <div className="px-8 pb-3 pt-1 space-y-2 text-sm text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-neutral-900/50 animate-fadeIn">
          {block.content && <p>{block.content}</p>}
          {block.blocks && block.blocks.map((subBlock, idx) => (
            <BlockRenderer key={idx} block={subBlock} />
          ))}
        </div>
      )}
    </div>
  );
};

// 3. Column List Block View
const ColumnListBlockView: React.FC<{ block: ColumnListBlock }> = ({ block }) => {
  const colCount = block.columns?.length || 2;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${colCount} gap-4 my-2`}>
      {block.columns?.map((col, idx) => (
        <div 
          key={idx} 
          className="p-3.5 rounded-lg bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/50 space-y-2"
        >
          {col.blocks.map((subBlock, sIdx) => (
            <BlockRenderer key={sIdx} block={subBlock} />
          ))}
        </div>
      ))}
    </div>
  );
};
