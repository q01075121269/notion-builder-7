import React, { useState, useRef } from 'react';
import type { ArchivedTemplate, TemplateFolder } from '../../types/dashboard';
import { 
  FolderGit2, 
  Database, 
  Layers, 
  Sparkles, 
  Zap, 
  Edit3, 
  Trash2, 
  GripVertical
} from 'lucide-react';

interface InteractiveCardGridViewProps {
  templates: ArchivedTemplate[];
  folders: TemplateFolder[];
  onSelectEdit: (template: ArchivedTemplate) => void;
  onInstantDeploy: (template: ArchivedTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onOpenFolder: (folder: TemplateFolder) => void;
  onMergeIntoNewFolder: (sourceTemplateId: string, targetTemplateId: string) => void;
  onDropIntoExistingFolder: (sourceTemplateId: string, targetFolderId: string) => void;
}

export const InteractiveCardGridView: React.FC<InteractiveCardGridViewProps> = ({
  templates,
  folders,
  onSelectEdit,
  onInstantDeploy,
  onDeleteTemplate,
  onOpenFolder,
  onMergeIntoNewFolder,
  onDropIntoExistingFolder
}) => {
  // 드래그 중인 템플릿 ID
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  // 현재 드래그 오버 중인 대상 카드 ID 또는 폴더 ID
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // 터치 이벤트 지원 상태
  const touchTimerRef = useRef<any>(null);
  const touchStartTemplateIdRef = useRef<string | null>(null);

  // 폴더에 속하지 않은 루트 템플릿들
  const rootTemplates = templates.filter(t => !t.folderId);

  // 1. 마우스 DnD 핸들러
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTemplateId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTargetId !== targetId) {
      setDragOverTargetId(targetId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, targetId: string) => {
    if (dragOverTargetId === targetId) {
      setDragOverTargetId(null);
    }
  };

  const handleDropOnTemplate = (e: React.DragEvent, targetTemplateId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTemplateId;
    setDraggedTemplateId(null);
    setDragOverTargetId(null);

    if (!sourceId || sourceId === targetTemplateId) return;

    // 스마트폰처럼 두 카드를 하나의 폴더로 병합
    onMergeIntoNewFolder(sourceId, targetTemplateId);
  };

  const handleDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTemplateId;
    setDraggedTemplateId(null);
    setDragOverTargetId(null);

    if (!sourceId) return;

    // 기존 폴더에 삽입
    onDropIntoExistingFolder(sourceId, folderId);
  };

  const handleDragEnd = () => {
    setDraggedTemplateId(null);
    setDragOverTargetId(null);
  };

  // 2. 모바일 터치 이벤트 핸들러 (롱프레스 후 드래그 대응)
  const handleTouchStart = (templateId: string) => {
    touchTimerRef.current = setTimeout(() => {
      touchStartTemplateIdRef.current = templateId;
      setDraggedTemplateId(templateId);
    }, 450); // 450ms 롱프레스
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    setDraggedTemplateId(null);
    touchStartTemplateIdRef.current = null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 select-none">
      
      {/* 1. 폴더 카드들 렌더링 (스마트 컬렉션 폴더) */}
      {folders.map((folder) => {
        const folderTemplates = templates.filter(t => t.folderId === folder.id);
        const isHoveredAsDropTarget = dragOverTargetId === folder.id;

        return (
          <div
            key={folder.id}
            onClick={() => onOpenFolder(folder)}
            onDragOver={(e) => handleDragOver(e, folder.id)}
            onDragLeave={(e) => handleDragLeave(e, folder.id)}
            onDrop={(e) => handleDropOnFolder(e, folder.id)}
            className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
              isHoveredAsDropTarget
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.02]'
                : 'border-slate-200/90 dark:border-neutral-800 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-neutral-900/80 dark:via-neutral-900 dark:to-neutral-800/60 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/60'
            }`}
          >
            {/* 폴더 뱃지 & 아이콘 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {folder.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {folderTemplates.length}개 템플릿 묶음
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 whitespace-nowrap">
                🗂 컬렉션
              </span>
            </div>

            {/* 내부 템플릿 미니 썸네일 중첩 프리뷰 */}
            <div className="my-4 p-3 rounded-xl bg-white/70 dark:bg-neutral-800/50 border border-slate-200/60 dark:border-neutral-700/50 space-y-1.5">
              {folderTemplates.slice(0, 3).map((ft, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600 dark:text-neutral-300">
                  <span className="text-sm shrink-0">{ft.icon || '📑'}</span>
                  <span className="line-clamp-1 text-[11px] font-medium">{ft.title}</span>
                </div>
              ))}
              {folderTemplates.length > 3 && (
                <div className="text-[10px] text-slate-400 font-medium pl-6">
                  외 {folderTemplates.length - 3}개 더보기...
                </div>
              )}
              {folderTemplates.length === 0 && (
                <div className="text-center text-[11px] text-slate-400 py-2">
                  카드를 드래그하여 이 폴더에 담으세요
                </div>
              )}
            </div>

            {/* 폴더 하단 안내 */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-neutral-800">
              <span>스마트폰식 폴더링 지원</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                열기 &rarr;
              </span>
            </div>
          </div>
        );
      })}

      {/* 2. 루트 템플릿 카드들 렌더링 (DnD 드래그 소스 & 드롭 타깃) */}
      {rootTemplates.map((tpl) => {
        const isDragging = draggedTemplateId === tpl.id;
        const isDropTarget = dragOverTargetId === tpl.id;
        const dbCount = tpl.templateData?.databases?.length || 0;
        const blockCount = tpl.templateData?.page_layout?.length || 0;
        const hasFormula = tpl.templateData?.databases?.some(db => 
          db.properties?.some(p => p.type === 'formula')
        );

        return (
          <div
            key={tpl.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tpl.id)}
            onDragOver={(e) => handleDragOver(e, tpl.id)}
            onDragLeave={(e) => handleDragLeave(e, tpl.id)}
            onDrop={(e) => handleDropOnTemplate(e, tpl.id)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(tpl.id)}
            onTouchEnd={handleTouchEnd}
            className={`group relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-notion-dark-card overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing ${
              isDragging ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
            } ${
              isDropTarget
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-4 ring-indigo-500/20 scale-[1.02]'
                : 'border-slate-200/90 dark:border-neutral-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-neutral-700'
            }`}
          >
            {/* 상단 썸네일 커버 & 드래그 그립 힌트 */}
            <div className="relative h-32 w-full overflow-hidden bg-slate-100 dark:bg-neutral-800">
              <img
                src={tpl.cover_url}
                alt={tpl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* 드래그 힌트 뱃지 */}
              <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/40 text-white/80 backdrop-blur-xs text-[10px] flex items-center space-x-0.5 opacity-60 group-hover:opacity-100 transition">
                <GripVertical className="w-3 h-3" />
                <span className="hidden sm:inline">드래그하여 폴더링</span>
              </div>

              {/* 이모지 + 제목 */}
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center space-x-2 z-10">
                <span className="text-2xl p-1 rounded-lg bg-white/90 dark:bg-neutral-900/90 shadow-2xs shrink-0">
                  {tpl.icon || '📑'}
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-200 transition">
                  {tpl.title}
                </h4>
              </div>
            </div>

            {/* 카드 본문 설명 & DB 스펙 */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>

                {/* 스펙 뱃지 칩 */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-neutral-800">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 whitespace-nowrap">
                    <Database className="w-2.5 h-2.5 text-indigo-500" />
                    <span>DB {dbCount}개</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 whitespace-nowrap">
                    <Layers className="w-2.5 h-2.5 text-emerald-500" />
                    <span>블록 {blockCount}개</span>
                  </span>
                  {hasFormula && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 whitespace-nowrap">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>수식 2.0</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 하단 마우스 호버 시 플로팅 액션 바 */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] text-slate-400">
                  {new Date(tpl.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* [⚡ 노션 생성] */}
                  <button
                    onClick={() => onInstantDeploy(tpl)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                    title="내 노션 워크스페이스에 즉시 생성"
                  >
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>노션 생성</span>
                  </button>

                  {/* [✏️ 수정] */}
                  <button
                    onClick={() => onSelectEdit(tpl)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    title="빌더에서 열기/수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* [🗑️ 삭제] */}
                  <button
                    onClick={() => {
                      if (window.confirm(`"${tpl.title}" 템플릿을 보관함에서 삭제하시겠습니까?`)) {
                        onDeleteTemplate(tpl.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
