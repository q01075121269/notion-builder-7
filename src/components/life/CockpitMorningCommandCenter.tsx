// src/components/life/CockpitMorningCommandCenter.tsx
// 2열 벤토 그리드 조종석 캔버스 (좌측 35% 데일리 실행 & 캡처 엔진 / 우측 65% PARA 마스터 매트릭스)

import React from 'react';
import type { 
  ResolvedProjectItem, 
  TaskHabitItem, 
  ResourceInboxItem, 
  ResourceType,
  ProjectArea
} from '../../types/lifeHub';

import { QuickCaptureThingsCard } from './QuickCaptureThingsCard';
import { HabitTrackerCard } from './HabitTrackerCard';
import { Top3MITsCard } from './Top3MITsCard';
import { ProjectsMatrixView } from './ProjectsMatrixView';
import { AreasOfResponsibilityCard } from './AreasOfResponsibilityCard';
import { ExternalLink, Bookmark, FileText, Receipt, StickyNote } from 'lucide-react';

interface CockpitMorningCommandCenterProps {
  projects: ResolvedProjectItem[];
  tasks: TaskHabitItem[];
  resources: ResourceInboxItem[];
  onToggleTask: (taskId: string) => void;
  onAddResource: (resource: {
    title: string;
    type: ResourceType;
    summary: string;
    sourceUrl?: string;
  }) => void;
  onAddProject?: () => void;
  onSelectArea?: (area: ProjectArea) => void;
}

export const CockpitMorningCommandCenter: React.FC<CockpitMorningCommandCenterProps> = ({
  projects,
  resources,
  onToggleTask,
  onAddResource,
  onAddProject,
  onSelectArea
}) => {
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case '북마크':
        return <Bookmark className="w-3 h-3 text-blue-500" />;
      case '문서':
        return <FileText className="w-3 h-3 text-emerald-500" />;
      case '영수증':
        return <Receipt className="w-3 h-3 text-purple-500" />;
      default:
        return <StickyNote className="w-3 h-3 text-amber-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ─────────────────────────────────────────────────────────────────────────────
          [좌측 패널] 데일리 실행 & 캡처 엔진 (35% 폭 -> lg:col-span-4 또는 5)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-4 xl:col-span-4 space-y-4">
        {/* ① [⚡ 1초 퀵 인박스] */}
        <QuickCaptureThingsCard onCapture={onAddResource} />

        {/* ② [🎯 오늘의 Top 3 (Next Actions / MITs)] - 한눈에 정면 노출 */}
        <Top3MITsCard onToggleTask={onToggleTask} />

        {/* ③ [🔥 모닝 루틴 & 스마트 해빗 트래커] */}
        <HabitTrackerCard />
      </div>


      {/* ─────────────────────────────────────────────────────────────────────────────
          [우측 캔버스] PARA 마스터 매트릭스 & 프로젝트 코어 (65% 폭 -> lg:col-span-8)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-8 xl:col-span-8 space-y-4">
        {/* ① [Active Projects 매트릭스 (Thomas Frank 스타일)] */}
        <ProjectsMatrixView
          projects={projects}
          onToggleTask={onToggleTask}
          onAddProject={onAddProject}
        />

        {/* ② [Areas of Responsibility (4대 지속 책임 영역 카드)] */}
        <AreasOfResponsibilityCard onSelectArea={onSelectArea} />

        {/* ③ [Resources & 지식 아카이브 요약 카드] */}
        <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-100 dark:border-white/5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5">
              <span>📚 연결된 Resources & 스와이프 파일 아카이브</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                {resources.length}건
              </span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resources.map((res) => (
              <div
                key={res.id}
                className="p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-950/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-zinc-500">
                      {getResourceIcon(res.type)}
                      <span>{res.type}</span>
                    </span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                      res.status === '처리완료' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {res.title}
                  </h5>

                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {res.summary}
                  </p>
                </div>

                {res.sourceUrl && (
                  <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                    <a
                      href={res.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline truncate max-w-full"
                    >
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{res.sourceUrl}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
