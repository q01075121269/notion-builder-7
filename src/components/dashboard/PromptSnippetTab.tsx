import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Layers,
  ArrowRight
} from 'lucide-react';
import type { PromptSnippet } from '../../types/dashboard';

interface PromptSnippetTabProps {
  snippets: PromptSnippet[];
  onDelete: (id: string) => void;
  onOpenNewModal: () => void;
  onSendToBuilderChat: (content: string) => void;
}

export const PromptSnippetTab: React.FC<PromptSnippetTabProps> = ({
  snippets,
  onDelete,
  onOpenNewModal,
  onSendToBuilderChat
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('전체');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['전체', '프롬프트', 'JSON스니펫', '수식코드', '자동화팁'];

  const filtered = selectedCat === '전체'
    ? snippets
    : snippets.filter(s => s.category === selectedCat);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Add Bar */}
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

        {/* Add Snippet Button */}
        <button
          onClick={onOpenNewModal}
          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>새 스니펫 등록</span>
        </button>
      </div>

      {/* Snippets List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 space-y-2">
          <Layers className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium">선택된 카테고리의 스니펫이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-notion-dark-border bg-white dark:bg-notion-dark-card p-4 space-y-3 hover:border-neutral-400 dark:hover:border-neutral-600 transition"
            >
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleCopy(item.id, item.content)}
                      className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                      title="클립보드에 복사"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${item.title}' 스니펫을 삭제하시겠습니까?`)) {
                          onDelete(item.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Code/Content Preview Box */}
              <div className="relative rounded-lg bg-neutral-900 text-neutral-200 p-3 text-xs font-mono max-h-36 overflow-y-auto border border-neutral-800">
                <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                  {item.content}
                </pre>
              </div>

              {/* Footer: Tags & Send to Chat Button */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex flex-wrap gap-1">
                  {(item.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => onSendToBuilderChat(item.content)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center space-x-1 transition"
                  title="이 프롬프트를 빌더 대화창에 입력하여 새 템플릿 생성하기"
                >
                  <span>빌더로 보내기</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
