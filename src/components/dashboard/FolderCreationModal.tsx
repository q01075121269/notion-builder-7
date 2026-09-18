import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, X, Check } from 'lucide-react';

interface FolderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void;
  sourceTemplateTitle: string;
  targetTemplateTitle: string;
}

export const FolderCreationModal: React.FC<FolderCreationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sourceTemplateTitle,
  targetTemplateTitle
}) => {
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(folderName.trim() || '새 컬렉션 폴더');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div 
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 transition"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                새 폴더로 묶기
              </h3>
              <p className="text-[11px] text-slate-400">
                두 템플릿을 하나의 폴더로 병합합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 병합 대상 카드 요약 */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800 mb-4 space-y-1.5 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="line-clamp-1 font-medium">{sourceTemplateTitle}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="line-clamp-1 font-medium">{targetTemplateTitle}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              폴더 이름
            </label>
            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="예: 2026 하반기 업무 모음, 개인 프로젝트..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer whitespace-nowrap"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" />
              <span>폴더 생성</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
