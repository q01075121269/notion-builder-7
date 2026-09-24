// src/components/life/ProjectsMasterView.tsx
// ① Projects DB: 핵심 목표 & 기한 있는 프로젝트 마스터 뷰 (Formulas 2.0 게이지 & 양방향 Tasks 연동)

import React, { useState } from 'react';
import { 
  Rocket, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';

import type { ResolvedProjectItem, ProjectArea, ProjectStatus } from '../../types/lifeHub';

interface ProjectsMasterViewProps {
  projects: ResolvedProjectItem[];
  onToggleTask: (taskId: string) => void;
  onAddProject: (project: {
    title: string;
    area: ProjectArea;
    targetDate: string;
    status: ProjectStatus;
    description?: string;
  }) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject?: (projectId: string) => void;
  selectedProjectId?: string | null;
  isCompact?: boolean;
}

export const ProjectsMasterView: React.FC<ProjectsMasterViewProps> = ({
  projects,
  onToggleTask,
  onAddProject,
  onDeleteProject,
  onSelectProject,
  selectedProjectId,
  isCompact = false
}) => {
  const [filterArea, setFilterArea] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArea, setNewArea] = useState<ProjectArea>('커리어');
  const [newTargetDate, setNewTargetDate] = useState('2026-09-30');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('진행');
  const [newDesc, setNewDesc] = useState('');

  const filteredProjects = projects.filter(p => {
    if (filterArea === 'ALL') return true;
    return p.area === filterArea;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddProject({
      title: newTitle.trim(),
      area: newArea,
      targetDate: newTargetDate,
      status: newStatus,
      description: newDesc.trim() || undefined
    });
    setNewTitle('');
    setNewDesc('');
    setIsAddModalOpen(false);
  };

  const getAreaBadgeColor = (area: ProjectArea) => {
    switch (area) {
      case '커리어':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60';
      case '재테크':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60';
      case '건강':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60';
      case '라이프':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case '완료':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">완료 ✅</span>;
      case '진행':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">진행 중 ⚡</span>;
      case '기획':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">기획 📋</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 헤더 및 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Projects DB (핵심 목표 & 프로젝트)
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {projects.length}개
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Formulas 2.0 하위 과제 완료율 게이지 바 · 스마트 D-Day 태그 자동 연산
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 영역 필터 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/60 text-xs">
            <Filter className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
            {(['ALL', '커리어', '재테크', '건강', '라이프'] as const).map(area => (
              <button
                key={area}
                onClick={() => setFilterArea(area)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterArea === area
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {area === 'ALL' ? '전체' : area}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 프로젝트</span>
          </button>
        </div>
      </div>

      {/* 프로젝트 카드 그리드 */}
      {filteredProjects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 text-slate-400">
          <Rocket className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">등록된 프로젝트가 없습니다.</p>
          <p className="text-xs mt-1 text-slate-400">우측 상단 '신규 프로젝트' 버튼으로 핵심 목표를 추가해보세요.</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {filteredProjects.map(proj => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject?.(proj.id)}
                className={`relative group p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-neutral-900/70 border-slate-200/90 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-sm'
                }`}
              >
                {/* 상단 메타: 영역, D-Day, 상태, 삭제 버튼 */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getAreaBadgeColor(proj.area)}`}>
                      {proj.area}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700">
                      {proj.ddayTag || '📅 기한 미정'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {getStatusBadge(proj.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`'${proj.title}' 프로젝트를 삭제하시겠습니까?`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="프로젝트 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 프로젝트 타이틀 & 설명 */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">
                  {proj.title}
                </h3>
                {proj.description && (
                  <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 mb-3">
                    {proj.description}
                  </p>
                )}

                {/* 목표일 정보 */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-neutral-400 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>목표일: {proj.targetDate}</span>
                </div>

                {/* Formulas 2.0 비주얼 진척률 게이지 바 (핵심) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/50 mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-600 dark:text-neutral-300 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Formulas 2.0 게이지 바</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-neutral-200 text-[11px]">
                      {proj.progressGauge || '□□□□□□□□□□ 0%'}
                    </span>
                  </div>

                  {/* HTML 프로그레스 바 UI 동기화 */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-neutral-700 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
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

                {/* 양방향 관계형: 하위 실행 과제 (Tasks DB 연동 칩) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-blue-500" />
                      <span>양방향 연동 Tasks ({proj.relatedTasks.length}건)</span>
                    </span>
                    <span>
                      완료: {proj.relatedTasks.filter(t => t.completed).length} / {proj.relatedTasks.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {proj.relatedTasks.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">연결된 하위 과제가 없습니다.</span>
                    ) : (
                      proj.relatedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTask(t.id);
                          }}
                          className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition cursor-pointer ${
                            t.completed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 line-through'
                              : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-neutral-700 hover:border-blue-400'
                          }`}
                          title={`클릭하여 '${t.title}' 완료 상태 토글 (진척률 실시간 반응)`}
                        >
                          <CheckCircle2 className={`w-3 h-3 ${t.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-neutral-500'}`} />
                          <span className="max-w-[140px] truncate">{t.title}</span>
                          <span className="text-[9px] opacity-75 font-mono">({t.duration})</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 양방향 관계형: 관련 리소스 (Resources DB 연동 칩) */}
                {proj.relatedResources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center space-x-1.5 text-[11px]">
                    <span className="text-slate-400 font-medium">참조 리소스:</span>
                    <div className="flex flex-wrap gap-1">
                      {proj.relatedResources.map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 text-[10px]"
                        >
                          <span>{r.type === '문서' ? '📄' : r.type === '북마크' ? '🔖' : '💡'}</span>
                          <span className="max-w-[120px] truncate">{r.title}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 신규 프로젝트 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Rocket className="w-5 h-5 text-blue-500" />
              <span>신규 프로젝트 생성</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  프로젝트명 (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 3분기 플래그십 런칭"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    영역 (Area)
                  </label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value as ProjectArea)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="커리어">커리어</option>
                    <option value="재테크">재테크</option>
                    <option value="건강">건강</option>
                    <option value="라이프">라이프</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    상태 (Status)
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="기획">기획</option>
                    <option value="진행">진행</option>
                    <option value="완료">완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  목표일 (Target Date)
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  설명 / 핵심 가치
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="프로젝트의 핵심 목표와 성공 기준을 작성하세요."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs cursor-pointer"
                >
                  생성 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
