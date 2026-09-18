import React from 'react';
import type { ArchivedTemplate } from '../../types/dashboard';
import { 
  Zap, 
  Edit3, 
  Trash2, 
  Database, 
  Layers 
} from 'lucide-react';

interface CompactListViewProps {
  templates: ArchivedTemplate[];
  onSelectEdit: (template: ArchivedTemplate) => void;
  onInstantDeploy: (template: ArchivedTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const CompactListView: React.FC<CompactListViewProps> = ({
  templates,
  onSelectEdit,
  onInstantDeploy,
  onDeleteTemplate
}) => {
  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-notion-dark-card shadow-xs overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-neutral-900/60 border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 font-semibold">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[240px]">템플릿명</th>
              <th className="py-3 px-4 min-w-[120px]">태그</th>
              <th className="py-3 px-4 min-w-[120px]">DB / 블록</th>
              <th className="py-3 px-4 w-28">생성일</th>
              <th className="py-3 px-4 w-36 text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
            {templates.map((tpl, idx) => {
              const dbCount = tpl.templateData?.databases?.length || 0;
              const blockCount = tpl.templateData?.page_layout?.length || 0;

              return (
                <tr 
                  key={tpl.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition group"
                >
                  {/* 순번 */}
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {idx + 1}
                  </td>

                  {/* 템플릿명 */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base p-1 rounded-md bg-slate-100 dark:bg-neutral-800 shrink-0">
                        {tpl.icon || '📑'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {tpl.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {tpl.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 태그 */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags?.slice(0, 2).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* DB / 블록 */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-neutral-400">
                      <span className="flex items-center space-x-0.5">
                        <Database className="w-3 h-3 text-indigo-500" />
                        <span>{dbCount}개</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-0.5">
                        <Layers className="w-3 h-3 text-emerald-500" />
                        <span>{blockCount}개</span>
                      </span>
                    </div>
                  </td>

                  {/* 생성일 */}
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(tpl.createdAt).toLocaleDateString()}
                  </td>

                  {/* 액션 버튼 */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* [⚡ 노션 생성] */}
                      <button
                        onClick={() => onInstantDeploy(tpl)}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs transition active:scale-95 cursor-pointer"
                        title="노션 워크스페이스에 즉시 생성"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                        <span>생성</span>
                      </button>

                      {/* [✏️ 수정] */}
                      <button
                        onClick={() => onSelectEdit(tpl)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* [🗑️ 삭제] */}
                      <button
                        onClick={() => {
                          if (window.confirm(`"${tpl.title}" 템플릿을 삭제하시겠습니까?`)) {
                            onDeleteTemplate(tpl.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
