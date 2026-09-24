// src/app/life/page.tsx
// 라이프 Hub 4대 마스터 DB(Projects, Tasks & Habits, Resources & Inbox, Life Log)
// 양방향 관계형(Mutual Relation) 및 Formulas 2.0 엔진 실시간 통합 화면

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Rocket, 
  CheckSquare, 
  Inbox, 
  Activity, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  LayoutGrid
} from 'lucide-react';


import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import type { 
  ProjectItem, 
  TaskHabitItem, 
  ResourceInboxItem, 
  LifeLogItem,
  LifeHubMasterState,
  ProjectArea,
  ProjectStatus,
  TaskType,
  TaskPriority,
  ResourceType,
  ResourceStatus,
  LifeLogCategory
} from '../../types/lifeHub';
import {
  loadLifeHubMasterState,
  saveLifeHubMasterState,
  enrichTasksWithFormulas,
  enrichProjectsWithFormulasAndRelations,
  INITIAL_LIFE_HUB_PROJECTS,
  INITIAL_LIFE_HUB_TASKS,
  INITIAL_LIFE_HUB_RESOURCES,
  INITIAL_LIFE_HUB_LOGS
} from '../../services/lifeHubMasterEngine';

import { ProjectsMasterView } from '../../components/life/ProjectsMasterView';
import { TasksHabitsMasterView } from '../../components/life/TasksHabitsMasterView';
import { ResourcesInboxMasterView } from '../../components/life/ResourcesInboxMasterView';
import { LifeLogMasterView } from '../../components/life/LifeLogMasterView';

type LifeMasterTab = 'projects' | 'tasks' | 'resources' | 'lifelog';
type ViewMode = 'tabs' | 'grid';

export const LifePage: React.FC = () => {
  const { 
    setCurrentView, 
    notionApiKey, 
    showToast,
    createdNotionResource,
    selectedNotionDbId,
    setIsNotionSettingsModalOpen
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [activeTab, setActiveTab] = useState<LifeMasterTab>('projects');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 4대 마스터 DB 상태 (Fallback 빈 배열 안전 보장)
  const [projects, setProjects] = useState<ProjectItem[]>(() => INITIAL_LIFE_HUB_PROJECTS);
  const [tasks, setTasks] = useState<TaskHabitItem[]>(() => INITIAL_LIFE_HUB_TASKS);
  const [resources, setResources] = useState<ResourceInboxItem[]>(() => INITIAL_LIFE_HUB_RESOURCES);
  const [lifeLogs, setLifeLogs] = useState<LifeLogItem[]>(() => INITIAL_LIFE_HUB_LOGS);

  // 선택된 특정 프로젝트 ID (양방향 하이라이트용)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 초기 로컬 스토리지 로드
  useEffect(() => {
    try {
      setIsLoading(true);
      const loaded = loadLifeHubMasterState();
      setProjects(loaded.projects || INITIAL_LIFE_HUB_PROJECTS);
      setTasks(loaded.tasks || INITIAL_LIFE_HUB_TASKS);
      setResources(loaded.resources || INITIAL_LIFE_HUB_RESOURCES);
      setLifeLogs(loaded.lifeLogs || INITIAL_LIFE_HUB_LOGS);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('[LifePage] Failed to load initial state:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 상태 변경 시 로컬 스토리지 자동 영속화
  const persistState = useCallback((
    p: ProjectItem[], 
    t: TaskHabitItem[], 
    r: ResourceInboxItem[], 
    l: LifeLogItem[]
  ) => {
    const newState: LifeHubMasterState = {
      projects: p,
      tasks: t,
      resources: r,
      lifeLogs: l,
      lastSyncedAt: new Date().toISOString()
    };
    saveLifeHubMasterState(newState);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 양방향 관계형(Mutual Relation) 및 Formulas 2.0 실시간 계산 파이프라인
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Task에 Formulas 2.0 스트릭/D-Day 결과 주입
  const resolvedTasks = useMemo(() => {
    return enrichTasksWithFormulas(tasks);
  }, [tasks]);

  // 2. Projects에 하위 Tasks 완료율 게이지 바 (■■■■■■■■□□ 80%) 및 양방향 관계형 연결 주입
  const resolvedProjects = useMemo(() => {
    return enrichProjectsWithFormulasAndRelations(projects, resolvedTasks, resources);
  }, [projects, resolvedTasks, resources]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 액션 핸들러 (양방향 연동 완벽 동기화)
  // ─────────────────────────────────────────────────────────────────────────────

  // 과제 / 루틴 완료 토글 (체크박스 클릭 시 프로젝트 게이지 자동 연동 갱신)
  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const nextTasks = prevTasks.map(t => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          let nextStreak = t.streakCount || 0;
          if (t.type === '모닝루틴') {
            nextStreak = nextCompleted ? nextStreak + 1 : Math.max(0, nextStreak - 1);
          }
          return {
            ...t,
            completed: nextCompleted,
            streakCount: nextStreak
          };
        }
        return t;
      });

      // 영속화
      persistState(projects, nextTasks, resources, lifeLogs);
      return nextTasks;
    });

    showToast('과제 상태가 변경되었으며, Projects 진척률 게이지가 실시간 갱신되었습니다.', 'success');
  }, [projects, resources, lifeLogs, persistState, showToast]);

  // 프로젝트 추가
  const handleAddProject = useCallback((newProjData: {
    title: string;
    area: ProjectArea;
    targetDate: string;
    status: ProjectStatus;
    description?: string;
  }) => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProjData.title,
      area: newProjData.area,
      targetDate: newProjData.targetDate,
      status: newProjData.status,
      taskIds: [],
      resourceIds: [],
      description: newProjData.description,
      createdAt: new Date().toISOString()
    };

    setProjects(prev => {
      const next = [newProj, ...prev];
      persistState(next, tasks, resources, lifeLogs);
      return next;
    });
    showToast(`'${newProjData.title}' 프로젝트가 신규 생성되었습니다.`, 'success');
  }, [tasks, resources, lifeLogs, persistState, showToast]);

  // 프로젝트 삭제
  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== projectId);
      // 소속 태스크의 projectId 연결 해제
      setTasks(prevTasks => {
        const nextTasks = prevTasks.map(t => t.projectId === projectId ? { ...t, projectId: undefined } : t);
        persistState(next, nextTasks, resources, lifeLogs);
        return nextTasks;
      });
      return next;
    });
    showToast('프로젝트가 삭제되었습니다.', 'info');
  }, [resources, lifeLogs, persistState, showToast]);

  // 과제 추가
  const handleAddTask = useCallback((newTaskData: {
    title: string;
    type: TaskType;
    dueDate: string;
    priority: TaskPriority;
    duration: string;
    projectId?: string;
    streakCount?: number;
    notes?: string;
  }) => {
    const newTask: TaskHabitItem = {
      id: `task-${Date.now()}`,
      title: newTaskData.title,
      type: newTaskData.type,
      dueDate: newTaskData.dueDate,
      priority: newTaskData.priority,
      completed: false,
      duration: newTaskData.duration,
      projectId: newTaskData.projectId,
      streakCount: newTaskData.streakCount || 0,
      notes: newTaskData.notes,
      createdAt: new Date().toISOString()
    };

    setTasks(prevTasks => {
      const nextTasks = [newTask, ...prevTasks];
      // 연결된 프로젝트가 있다면 해당 프로젝트의 taskIds에도 추가
      if (newTask.projectId) {
        setProjects(prevProj => {
          const nextProj = prevProj.map(p => {
            if (p.id === newTask.projectId && !p.taskIds.includes(newTask.id)) {
              return { ...p, taskIds: [...p.taskIds, newTask.id] };
            }
            return p;
          });
          persistState(nextProj, nextTasks, resources, lifeLogs);
          return nextProj;
        });
      } else {
        persistState(projects, nextTasks, resources, lifeLogs);
      }
      return nextTasks;
    });
    showToast(`'${newTaskData.title}' 과제가 등록되었습니다.`, 'success');
  }, [projects, resources, lifeLogs, persistState, showToast]);

  // 과제 삭제
  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      // 프로젝트 taskIds에서도 정리
      setProjects(prevProj => {
        const nextProj = prevProj.map(p => ({
          ...p,
          taskIds: p.taskIds.filter(id => id !== taskId)
        }));
        persistState(nextProj, next, resources, lifeLogs);
        return nextProj;
      });
      return next;
    });
    showToast('과제가 삭제되었습니다.', 'info');
  }, [resources, lifeLogs, persistState, showToast]);

  // 리소스 상태 토글 (인박스 ↔ 처리완료)
  const handleToggleResourceStatus = useCallback((resourceId: string) => {
    setResources(prev => {
      const next = prev.map(r => {
        if (r.id === resourceId) {
          const nextStatus: ResourceStatus = r.status === '처리완료' ? '인박스' : '처리완료';
          return { ...r, status: nextStatus };
        }
        return r;
      });
      persistState(projects, tasks, next, lifeLogs);
      return next;
    });
  }, [projects, tasks, lifeLogs, persistState]);

  // 리소스 추가
  const handleAddResource = useCallback((newResData: {
    title: string;
    type: ResourceType;
    sourceUrl?: string;
    summary: string;
    status: ResourceStatus;
    projectId?: string;
    tags?: string[];
  }) => {
    const newRes: ResourceInboxItem = {
      id: `res-${Date.now()}`,
      title: newResData.title,
      type: newResData.type,
      sourceUrl: newResData.sourceUrl,
      summary: newResData.summary,
      status: newResData.status,
      projectId: newResData.projectId,
      tags: newResData.tags,
      createdAt: new Date().toISOString()
    };

    setResources(prev => {
      const next = [newRes, ...prev];
      persistState(projects, tasks, next, lifeLogs);
      return next;
    });
    showToast(`'${newResData.title}' 리소스가 저장되었습니다.`, 'success');
  }, [projects, tasks, lifeLogs, persistState, showToast]);

  // 리소스 삭제
  const handleDeleteResource = useCallback((resourceId: string) => {
    setResources(prev => {
      const next = prev.filter(r => r.id !== resourceId);
      persistState(projects, tasks, next, lifeLogs);
      return next;
    });
    showToast('리소스가 삭제되었습니다.', 'info');
  }, [projects, tasks, lifeLogs, persistState, showToast]);

  // 라이프 로그 추가
  const handleAddLifeLog = useCallback((newLogData: {
    title: string;
    category: LifeLogCategory;
    amount?: number | null;
    date: string;
    note: string;
  }) => {
    const newLog: LifeLogItem = {
      id: `log-${Date.now()}`,
      title: newLogData.title,
      category: newLogData.category,
      amount: newLogData.amount,
      date: newLogData.date,
      note: newLogData.note,
      createdAt: new Date().toISOString()
    };

    setLifeLogs(prev => {
      const next = [newLog, ...prev];
      persistState(projects, tasks, resources, next);
      return next;
    });
    showToast(`'${newLogData.title}' 라이프 로그가 기록되었습니다.`, 'success');
  }, [projects, tasks, resources, persistState, showToast]);

  // 라이프 로그 삭제
  const handleDeleteLifeLog = useCallback((logId: string) => {
    setLifeLogs(prev => {
      const next = prev.filter(l => l.id !== logId);
      persistState(projects, tasks, resources, next);
      return next;
    });
    showToast('라이프 로그가 삭제되었습니다.', 'info');
  }, [projects, tasks, resources, persistState, showToast]);

  // 동기화 새로고침
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const loaded = loadLifeHubMasterState();
      setProjects(loaded.projects);
      setTasks(loaded.tasks);
      setResources(loaded.resources);
      setLifeLogs(loaded.lifeLogs);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsLoading(false);
      showToast('라이프 Hub 4대 마스터 DB 최신 상태를 동기화했습니다.', 'success');
    }, 300);
  }, [showToast]);

  const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || selectedNotionDbId));

  // 4대 마스터 DB 탭 정의
  const TABS: { 
    id: LifeMasterTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    countText: string;
    badgeColor: string;
  }[] = [
    {
      id: 'projects',
      label: '1. 🚀 Projects DB',
      icon: Rocket,
      countText: `${resolvedProjects.length}개`,
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
    },
    {
      id: 'tasks',
      label: '2. 🎯 Tasks & Habits DB',
      icon: CheckSquare,
      countText: `${resolvedTasks.filter(t => t.completed).length}/${resolvedTasks.length} 완료`,
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
    },
    {
      id: 'resources',
      label: '3. 📚 Resources & Inbox DB',
      icon: Inbox,
      countText: `${resources.length}건`,
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    },
    {
      id: 'lifelog',
      label: '4. 📊 Life Log DB',
      icon: Activity,
      countText: `${lifeLogs.length}건`,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-50 dark:bg-notion-dark-bg text-slate-900 dark:text-slate-100 selection:bg-slate-200 dark:selection:bg-neutral-700 font-sans">
      {/* 상단 서브 헤더 네비게이션 */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3.5 border-b border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">홈으로</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌿</span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  라이프 Hub (Life Hub)
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                  PARA & GTD 4대 마스터 DB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 whitespace-nowrap hidden sm:block">
                Projects ↔ Tasks & Habits ↔ Resources & Inbox ↔ Life Log 유기적 양방향 관계형 및 Formulas 2.0 엔진
              </p>
            </div>
          </div>
        </div>

        {/* 컨트롤: 뷰 모드 토글 & 동기화 & 노션 연동 */}
        <div className="flex items-center space-x-2">
          {/* 탭 보기 vs 4분할 한눈에 보기 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 shadow-xs">
            <button
              onClick={() => setViewMode('tabs')}
              title="상단 탭 스위칭 보기"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'tabs'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">탭 보기</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="4분할 그리드로 한눈에 보기"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">4분할 한눈에</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="4대 마스터 DB 실시간 동기화"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            <span className="whitespace-nowrap">{isLoading ? '동기화 중...' : '실시간 동기화'}</span>
            {lastSyncTime && <span className="text-[10px] text-slate-400 hidden sm:inline whitespace-nowrap">({lastSyncTime})</span>}
          </button>

          <button
            onClick={() => setIsNotionSettingsModalOpen(true)}
            title={isNotionConnected ? '노션 워크스페이스 연결됨' : '노션 연결 설정'}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition whitespace-nowrap shadow-xs ${
              isNotionConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isNotionConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="whitespace-nowrap">{isNotionConnected ? '노션 연결됨' : '노션 연결 대기'}</span>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 컨테이너 */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-7 space-y-6">
        {/* 상단 4대 마스터 DB 탭 네비게이션 */}
        <div className="bg-slate-100/90 dark:bg-neutral-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-700/60 shadow-xs overflow-x-auto scrollbar-none">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-w-[560px] sm:min-w-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && viewMode === 'tabs';

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setViewMode('tabs');
                  }}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-neutral-700'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border border-slate-200/60 dark:border-neutral-700/60 whitespace-nowrap ${tab.badgeColor}`}>
                    {tab.countText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 로딩 스켈레톤 (Fail-Fast 및 런타임 방어) */}
        {isLoading ? (
          <div className="p-8 space-y-4 rounded-2xl bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-800 animate-pulse">
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-neutral-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-36 bg-slate-100 dark:bg-neutral-800 rounded-xl"></div>
              <div className="h-36 bg-slate-100 dark:bg-neutral-800 rounded-xl"></div>
            </div>
          </div>
        ) : viewMode === 'tabs' ? (
          /* [탭 보기] 모드 */
          <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 sm:p-7 shadow-sm">
            {activeTab === 'projects' && (
              <ErrorBoundary fallbackTitle="Projects DB 모듈 로드 중 오류가 발생했습니다.">
                <ProjectsMasterView
                  projects={resolvedProjects}
                  onToggleTask={handleToggleTask}
                  onAddProject={handleAddProject}
                  onDeleteProject={handleDeleteProject}
                  onSelectProject={(id) => setSelectedProjectId(id)}
                  selectedProjectId={selectedProjectId}
                  isCompact={false}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'tasks' && (
              <ErrorBoundary fallbackTitle="Tasks & Habits DB 모듈 로드 중 오류가 발생했습니다.">
                <TasksHabitsMasterView
                  tasks={resolvedTasks}
                  projects={projects}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  isCompact={false}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'resources' && (
              <ErrorBoundary fallbackTitle="Resources & Inbox DB 모듈 로드 중 오류가 발생했습니다.">
                <ResourcesInboxMasterView
                  resources={resources}
                  projects={projects}
                  onToggleStatus={handleToggleResourceStatus}
                  onAddResource={handleAddResource}
                  onDeleteResource={handleDeleteResource}
                  isCompact={false}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'lifelog' && (
              <ErrorBoundary fallbackTitle="Life Log DB 모듈 로드 중 오류가 발생했습니다.">
                <LifeLogMasterView
                  logs={lifeLogs}
                  onAddLog={handleAddLifeLog}
                  onDeleteLog={handleDeleteLifeLog}
                  isCompact={false}
                />
              </ErrorBoundary>
            )}
          </div>
        ) : (
          /* [4분할 한눈에 보기 (2x2 그리드)] 모드 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Projects DB */}
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[650px] max-h-[650px] overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                <ErrorBoundary fallbackTitle="Projects DB 로드 중 오류">
                  <ProjectsMasterView
                    projects={resolvedProjects}
                    onToggleTask={handleToggleTask}
                    onAddProject={handleAddProject}
                    onDeleteProject={handleDeleteProject}
                    onSelectProject={(id) => setSelectedProjectId(id)}
                    selectedProjectId={selectedProjectId}
                    isCompact={true}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* 2. Tasks & Habits DB */}
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[650px] max-h-[650px] overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                <ErrorBoundary fallbackTitle="Tasks & Habits DB 로드 중 오류">
                  <TasksHabitsMasterView
                    tasks={resolvedTasks}
                    projects={projects}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    isCompact={true}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* 3. Resources & Inbox DB */}
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[650px] max-h-[650px] overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                <ErrorBoundary fallbackTitle="Resources & Inbox DB 로드 중 오류">
                  <ResourcesInboxMasterView
                    resources={resources}
                    projects={projects}
                    onToggleStatus={handleToggleResourceStatus}
                    onAddResource={handleAddResource}
                    onDeleteResource={handleDeleteResource}
                    isCompact={true}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* 4. Life Log DB */}
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[650px] max-h-[650px] overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                <ErrorBoundary fallbackTitle="Life Log DB 로드 중 오류">
                  <LifeLogMasterView
                    logs={lifeLogs}
                    onAddLog={handleAddLifeLog}
                    onDeleteLog={handleDeleteLifeLog}
                    isCompact={true}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LifePage;
