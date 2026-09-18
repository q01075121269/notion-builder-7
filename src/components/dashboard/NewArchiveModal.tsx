import React, { useState } from 'react';
import { X, Plus, Image, Code2 } from 'lucide-react';
import type { 
  ArchiveCategoryType, 
  PromptCategory, 
  InspirationCategory 
} from '../../types/dashboard';
import { 
  savePromptSnippet, 
  saveInspiration 
} from '../../services/archiveStorage';

interface NewArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory: ArchiveCategoryType;
  onSuccess: () => void;
}

export const NewArchiveModal: React.FC<NewArchiveModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  onSuccess
}) => {
  const [category, setCategory] = useState<ArchiveCategoryType>(defaultCategory);

  // Prompt Form State
  const [promptTitle, setPromptTitle] = useState('');
  const [promptCategory, setPromptCategory] = useState<PromptCategory>('프롬프트');
  const [promptContent, setPromptContent] = useState('');
  const [promptDesc, setPromptDesc] = useState('');
  const [promptTags, setPromptTags] = useState('');

  // Inspiration Form State
  const [inspTitle, setInspTitle] = useState('');
  const [inspImageUrl, setInspImageUrl] = useState('');
  const [inspCategory, setInspCategory] = useState<InspirationCategory>('커버 이미지');
  const [inspTags, setInspTags] = useState('');
  const [inspAuthor, setInspAuthor] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (category === 'prompts') {
      if (!promptTitle.trim() || !promptContent.trim()) return;
      const tagsArray = promptTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

      savePromptSnippet({
        id: `custom-snip-${Date.now()}`,
        title: promptTitle.trim(),
        category: promptCategory,
        description: promptDesc.trim() || '사용자 등록 프롬프트/스니펫',
        content: promptContent.trim(),
        tags: tagsArray.length > 0 ? tagsArray : ['#자료실'],
        createdAt: Date.now()
      });
    } else if (category === 'inspiration') {
      if (!inspTitle.trim() || !inspImageUrl.trim()) return;
      const tagsArray = inspTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

      saveInspiration({
        id: `custom-insp-${Date.now()}`,
        title: inspTitle.trim(),
        imageUrl: inspImageUrl.trim(),
        category: inspCategory,
        author: inspAuthor.trim() || '사용자 스크랩',
        tags: tagsArray.length > 0 ? tagsArray : ['#영감'],
        createdAt: Date.now()
      });
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-2xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-notion-dark-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              새 아카이브 자료 등록
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher */}
        <div className="flex border-b border-neutral-200 dark:border-notion-dark-border bg-neutral-50 dark:bg-neutral-900/40 px-6 py-2 space-x-2">
          <button
            type="button"
            onClick={() => setCategory('prompts')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              category === 'prompts'
                ? 'bg-white dark:bg-notion-dark-card text-neutral-900 dark:text-white shadow-xs border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-500" />
            <span>프롬프트 & 스니펫</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('inspiration')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              category === 'inspiration'
                ? 'bg-white dark:bg-notion-dark-card text-neutral-900 dark:text-white shadow-xs border border-neutral-200 dark:border-neutral-700'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Image className="w-3.5 h-3.5 text-purple-500" />
            <span>이미지 & 영감 핀</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {category === 'prompts' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  자료 제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 프로젝트 진행률 계산 노션 수식 2.0"
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    카테고리
                  </label>
                  <select
                    value={promptCategory}
                    onChange={(e) => setPromptCategory(e.target.value as PromptCategory)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                  >
                    <option value="프롬프트">프롬프트</option>
                    <option value="JSON스니펫">JSON스니펫</option>
                    <option value="수식코드">수식코드</option>
                    <option value="자동화팁">자동화팁</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    태그 (쉼표 구분)
                  </label>
                  <input
                    type="text"
                    placeholder="업무, 수식, 생산성"
                    value={promptTags}
                    onChange={(e) => setPromptTags(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  간략한 설명
                </label>
                <input
                  type="text"
                  placeholder="어떤 기능이나 목적으로 사용하는지 적어주세요"
                  value={promptDesc}
                  onChange={(e) => setPromptDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  프롬프트 / 코드 내용
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="복사해서 쓸 프롬프트 또는 코드 스니펫을 입력하세요"
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  영감 핀 제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 미니멀 우드 데스크 셋업"
                  value={inspTitle}
                  onChange={(e) => setInspTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  이미지 URL (Unsplash 등 고화질 이미지)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={inspImageUrl}
                  onChange={(e) => setInspImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none font-mono"
                />
              </div>

              {inspImageUrl && (
                <div className="w-full h-24 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img 
                    src={inspImageUrl} 
                    alt="미리보기" 
                    className="w-full h-full object-cover" 
                    onError={(e) => ((e.target as any).style.display = 'none')}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    분류
                  </label>
                  <select
                    value={inspCategory}
                    onChange={(e) => setInspCategory(e.target.value as InspirationCategory)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                  >
                    <option value="커버 이미지">커버 이미지</option>
                    <option value="레이아웃 영감">레이아웃 영감</option>
                    <option value="컬러 팔레트">컬러 팔레트</option>
                    <option value="아이콘/배경">아이콘/배경</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    저자 / 출처 (선택)
                  </label>
                  <input
                    type="text"
                    placeholder="Unsplash / 개인 소장"
                    value={inspAuthor}
                    onChange={(e) => setInspAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  태그 (쉼표 구분)
                </label>
                <input
                  type="text"
                  placeholder="미니멀, 데스크, 모던"
                  value={inspTags}
                  onChange={(e) => setInspTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white shadow-xs"
            >
              자료실에 보관하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
