import React from 'react';
import type { ArchivedTemplate, TemplateFolder } from '../../types/dashboard';
import { 
  FolderGit2, 
  Folder, 
  ChevronRight, 
  Zap, 
  Edit3, 
  Trash2 
} from 'lucide-react';

interface FolderCollectionViewProps {
  folders: TemplateFolder[];
  templates: ArchivedTemplate[];
  onOpenFolder: (folder: TemplateFolder) => void;
  onSelectEdit: (template: ArchivedTemplate) => void;
  onInstantDeploy: (template: ArchivedTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const FolderCollectionView: React.FC<FolderCollectionViewProps> = ({
  folders,
  templates,
  onOpenFolder,
  onSelectEdit,
  onInstantDeploy,
  onDeleteTemplate
}) => {
  const uncategorizedTemplates = templates.filter(t => !t.folderId);

  return (
    <div className="space-y-8 select-none">
      
      {/* 1. 폴더 목록 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>컬렉션 폴더 ({folders.length})</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            카드를 드래그하여 폴더로 묶거나 폴더를 클릭해 관리하세요
          </span>
        </div>

        {folders.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 text-center">
            <Folder className="w-8 h-8 mx-auto text-slate-300 dark:text-neutral-600 mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
              생성된 컬렉션 폴더가 없습니다.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              카드 뷰에서 템플릿 카드를 다른 카드 위에 겹쳐 드롭하면 스마트폰처럼 폴더가 자동 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => {
              const count = templates.filter(t => t.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => onOpenFolder(folder)}
                  className="group p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-md transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {folder.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {count}개 템플릿
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. 미분류 템플릿 섹션 */}
      {uncategorizedTemplates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <span>미분류 템플릿 ({uncategorizedTemplates.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uncategorizedTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="text-xl p-1 rounded bg-slate-100 dark:bg-neutral-800 shrink-0">
                    {tpl.icon || '📑'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {tpl.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {tpl.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => onInstantDeploy(tpl)}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                    title="노션에 즉시 생성"
                  >
                    <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                  </button>
                  <button
                    onClick={() => onSelectEdit(tpl)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`"${tpl.title}" 템플릿을 삭제하시겠습니까?`)) {
                        onDeleteTemplate(tpl.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
