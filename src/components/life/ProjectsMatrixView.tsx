// src/components/life/ProjectsMatrixView.tsx
// Active Projects 매트릭스 (Thomas Frank 스타일) - 4대 뷰 스위처: 표, 보드, 타임라인, 캘린더

import React, { useState } from 'react';
import { 
  Rocket, 
  Table as TableIcon, 
  Kanban, 
  GanttChart, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Layers,
  Plus
} from 'lucide-react';

import type { ResolvedProjectItem, ProjectArea, ProjectStatus } from '../../types/lifeHub';

type MatrixViewMode = 'table' | 'board' | 'timeline' | 'calendar';

interface ProjectsMatrixViewProps {
  projects: ResolvedProjectItem[];
  onToggleTask: (taskId: string) => void;
  onAddProject?: () => void;
}

export const ProjectsMatrixView: React.FC<ProjectsMatrixViewProps> = ({
  projects,
  onToggleTask,
  onAddProject
}) => {
  const [viewMode, setViewMode] = useState<MatrixViewMode>('table');

  const getAreaBadgeColor = (area: ProjectArea) => {
    switch (area) {
      case '커리어':
        return 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      case '재테크':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      case '건강':
        return 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      case '라이프':
        return 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case '완료':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">완료 ✅</span>;
      case '진행':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">진행 중 ⚡</span>;
      case '기획':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">기획 📋</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-xs space-y-3.5">
      {/* 상단 타이틀 & 4대 뷰 스위처 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Rocket className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Active Projects 매트릭스 (Thomas Frank 스타일)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {projects.length}개 활성
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* 4대 인터랙티브 뷰 스위처 */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>표</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3 h-3" />
              <span>보드</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <GanttChart className="w-3 h-3" />
              <span>타임라인</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>캘린더</span>
            </button>
          </div>

          {onAddProject && (
            <button
              onClick={onAddProject}
              className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer"
              title="새 프로젝트 추가"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. [ ▦ 표(Table) 뷰 ]
         ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px] font-medium">
                <th className="py-2 px-2.5">프로젝트명</th>
                <th className="py-2 px-2">영역</th>
                <th className="py-2 px-2">목표일</th>
                <th className="py-2 px-2">상태</th>
                <th className="py-2 px-2.5 min-w-[160px]">Formulas 2.0 진척률</th>
                <th className="py-2 px-2">D-Day</th>
                <th className="py-2 px-2">하위 과제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-950/40 transition">
                  <td className="py-2.5 px-2.5 font-bold text-zinc-900 dark:text-zinc-100 max-w-[170px] truncate">
                    {proj.title}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getAreaBadgeColor(proj.area)}`}>
                      {proj.area}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {proj.targetDate}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    {getStatusBadge(proj.status)}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {proj.progressGauge || '□□□□□□□□□□ 0%'}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            (proj.progressRate || 0) === 100
                              ? 'bg-emerald-500'
                              : (proj.progressRate || 0) >= 50
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                          }`}
                          style={{ width: `${proj.progressRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                      {proj.ddayTag || '기한 미정'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {proj.relatedTasks.slice(0, 2).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onToggleTask(t.id)}
                          className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] border transition cursor-pointer ${
                            t.completed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 line-through'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 hover:border-blue-400'
                          }`}
                          title={`클릭하여 '${t.title}' 완료 토글`}
                        >
                          <CheckCircle2 className={`w-2.5 h-2.5 ${t.completed ? 'text-emerald-500' : 'text-zinc-300'}`} />
                          <span className="max-w-[70px] truncate">{t.title}</span>
                        </button>
                      ))}
                      {proj.relatedTasks.length > 2 && (
                        <span className="text-[9px] text-zinc-400 self-center">
                          +{proj.relatedTasks.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. [ 📋 보드(Kanban) 뷰 ]
         ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['기획', '진행', '완료'] as ProjectStatus[]).map((statusCol) => {
            const colProjects = projects.filter(p => p.status === statusCol);
            return (
              <div key={statusCol} className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span>{statusCol}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800">
                    {colProjects.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colProjects.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getAreaBadgeColor(p.area)}`}>
                          {p.area}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 font-mono">
                          {p.ddayTag}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {p.title}
                      </h4>

                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-zinc-500 font-semibold">
                          {p.progressGauge}
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${p.progressRate || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Tasks {p.relatedTasks.length}건</span>
                        <span>{p.targetDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. [ ⏱️ 타임라인(Gantt) 뷰 ]
         ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'timeline' && (
        <div className="space-y-2.5 p-2 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
            <span>프로젝트 타임스팬 (9월 ~ 10월 간트 궤적)</span>
            <span>마감일 기한 바</span>
          </div>

          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={proj.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <span className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                    <span>{proj.title}</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{proj.targetDate} ({proj.ddayTag})</span>
                </div>

                <div className="w-full h-4 rounded-md bg-zinc-200/70 dark:bg-zinc-800 relative overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-md opacity-90 transition-all ${
                      idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(25, proj.progressRate || 40)}%` }}
                  />
                  <span className="absolute left-2 text-[9px] font-bold text-white drop-shadow-xs font-mono">
                    {proj.progressGauge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. [ 📅 캘린더 뷰 ]
         ───────────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'calendar' && (
        <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
            2026년 9월 ~ 10월 핵심 프로젝트 마일스톤 캘린더
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {projects.map((proj) => (
              <div key={proj.id} className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>📅 {proj.targetDate}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{proj.ddayTag}</span>
                </div>
                <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {proj.title}
                </h5>
                <div className="text-[10px] font-mono text-zinc-500">
                  {proj.progressGauge}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 지식 아카이브 요약 바 */}
      <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-500">
        <span className="flex items-center space-x-1">
          <Layers className="w-3 h-3 text-purple-500" />
          <span>Formulas 2.0 lets() 연산 엔진 활성</span>
        </span>
        <span className="text-[10px] text-zinc-400">
          하위 과제 체크 시 실시간 동기화
        </span>
      </div>
    </div>
  );
};
