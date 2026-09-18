import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Database, 
  Calendar, 
  BookmarkCheck, 
  Layers,
  Sparkles
} from 'lucide-react';
import type { ArchivedTemplate } from '../../types/dashboard';

interface TemplateArchiveTabProps {
  templates: ArchivedTemplate[];
  onDelete: (id: string) => void;
  onSelectEdit: (template: ArchivedTemplate) => void;
  onArchiveCurrent: () => void;
}

export const TemplateArchiveTab: React.FC<TemplateArchiveTabProps> = ({
  templates,
  onDelete,
  onSelectEdit,
  onArchiveCurrent
}) => {
  const { currentTemplate, setCurrentView, setActiveMobileTab } = useApp();

  return (
    <div className="space-y-6">
      {/* Top Banner Action */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-notion-dark-border bg-gradient-to-r from-neutral-50 to-neutral-100/60 dark:from-neutral-900/60 dark:to-neutral-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-lg shrink-0">
            {currentTemplate?.icon || '📝'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-neutral-900 dark:text-white">
                현재 빌더 작업 중인 템플릿:
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                "{currentTemplate?.title || '작업물 없음'}"
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              현재 AI 빌더에서 구성한 템플릿 구조를 내 보관함에 영구 보존할 수 있습니다
            </p>
          </div>
        </div>
        <button
          onClick={onArchiveCurrent}
          className="px-3.5 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs shrink-0"
        >
          <BookmarkCheck className="w-4 h-4 text-amber-400 dark:text-amber-500" />
          <span>현재 작업물 보관함에 저장</span>
        </button>
      </div>

      {/* Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
      {!templates || templates.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-notion-dark-card/50 max-w-md mx-auto my-8 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              아직 저장된 템플릿이 없습니다.
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              AI 빌더와 자연어로 대화하며 원하는 노션 템플릿을 몇 초 만에 생성해 보세요!
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentView('builder');
              setActiveMobileTab('chat');
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-md transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
            <span>새 템플릿 만들기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl, idx) => {
            if (!tpl) return null;
            const dbCount = tpl.templateData?.databases?.length || 0;
            const blockCount = tpl.templateData?.page_layout?.length || 0;
            const hasDateProp = tpl.templateData?.databases?.some(db =>
              db?.properties?.some(p => p?.type === 'date')
            ) || false;

            return (
              <div
                key={tpl.id || `tpl-${idx}`}
                className="group flex flex-col rounded-2xl border border-neutral-200/90 dark:border-notion-dark-border bg-white dark:bg-notion-dark-card overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Card Thumbnail / Cover */}
                <div className="relative h-36 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={tpl.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
                    alt={tpl.title || '템플릿 커버'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  
                  {/* Floating Icon */}
                  <div className="absolute bottom-3 left-4 w-9 h-9 rounded-xl bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center text-xl">
                    <span>{tpl.icon || '📑'}</span>
                  </div>

                  {/* Calendar Sync Badge if applicable */}
                  {hasDateProp && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center space-x-1 shadow-xs">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>캘린더 싱크 지원</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {tpl.title || '제목 없는 템플릿'}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {tpl.description || '노션 템플릿'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(tpl.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Stats */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Database className="w-3 h-3" />
                        <span>DB {dbCount}개</span>
                      </span>
                      <span>블록 {blockCount}개</span>
                    </div>
                    <span>{tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString() : ''}</span>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 flex items-center justify-between gap-1.5">
                    {/* Modify (Load to Builder) Action */}
                    <button
                      onClick={() => onSelectEdit(tpl)}
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                      title="이 템플릿을 빌더로 불러와서 자연어로 대화 수정"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>빌더로 수정</span>
                    </button>

                    {/* Open in Notion (if URL available or search link) */}
                    <a
                      href={tpl.notionUrl || `https://www.notion.so`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition flex items-center space-x-1"
                      title="노션에서 직접 열기"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">노션 열기</span>
                    </a>

                    {/* Delete Action */}
                    <button
                      onClick={() => {
                        if (confirm(`'${tpl.title || '이'}' 템플릿을 보관함에서 삭제하시겠습니까?`)) {
                          onDelete(tpl.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
