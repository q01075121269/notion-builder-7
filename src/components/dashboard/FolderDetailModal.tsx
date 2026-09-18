import React from 'react';
import type { ArchivedTemplate, TemplateFolder } from '../../types/dashboard';
import { 
  FolderGit2, 
  X, 
  Zap, 
  Edit3, 
  LogOut, 
  Database, 
  Layers
} from 'lucide-react';

interface FolderDetailModalProps {
  folder: TemplateFolder | null;
  templates: ArchivedTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEdit: (template: ArchivedTemplate) => void;
  onInstantDeploy: (template: ArchivedTemplate) => void;
  onRemoveFromFolder: (templateId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const FolderDetailModal: React.FC<FolderDetailModalProps> = ({
  folder,
  templates,
  isOpen,
  onClose,
  onSelectEdit,
  onInstantDeploy,
  onRemoveFromFolder,
  onDeleteFolder
}) => {
  if (!isOpen || !folder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div 
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden transition"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {folder.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {templates.length}개 보관 중
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                생성일: {new Date(folder.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (window.confirm(`"${folder.name}" 폴더를 해제하시겠습니까? (포함된 템플릿은 삭제되지 않고 기본 보관함으로 이동합니다)`)) {
                  onDeleteFolder(folder.id);
                  onClose();
                }
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer whitespace-nowrap"
              title="폴더 해제 (템플릿 유지)"
            >
              폴더 해제
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 모달 본문: 폴더 내 템플릿 목록 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {templates.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              이 폴더에 담긴 템플릿이 없습니다.
            </div>
          ) : (
            templates.map((tpl) => {
              const dbCount = tpl.templateData?.databases?.length || 0;
              const blockCount = tpl.templateData?.page_layout?.length || 0;

              return (
                <div
                  key={tpl.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 hover:bg-white dark:hover:bg-neutral-900 transition"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl p-1 rounded-lg bg-white dark:bg-neutral-800 shadow-2xs shrink-0">
                      {tpl.icon || '📑'}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tpl.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {tpl.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Database className="w-3 h-3 text-indigo-500" />
                          <span>DB {dbCount}개</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Layers className="w-3 h-3 text-emerald-500" />
                          <span>블록 {blockCount}개</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(tpl.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 카드 액션 버튼군 */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                    {/* [⚡ 노션 생성] */}
                    <button
                      onClick={() => onInstantDeploy(tpl)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                      title="내 노션에 바로 생성"
                    >
                      <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                      <span>노션 생성</span>
                    </button>

                    {/* [✏️ 수정] */}
                    <button
                      onClick={() => {
                        onSelectEdit(tpl);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="빌더에서 열기/수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* [폴더에서 꺼내기] */}
                    <button
                      onClick={() => onRemoveFromFolder(tpl.id)}
                      className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer whitespace-nowrap"
                      title="폴더에서 밖으로 꺼내기"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">꺼내기</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 모달 하단 닫기 */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-slate-200/80 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 transition cursor-pointer whitespace-nowrap"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
