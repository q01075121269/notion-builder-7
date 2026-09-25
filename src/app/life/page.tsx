// src/app/life/page.tsx
// 라이프 Hub(Life Hub) 2열 벤토 그리드 조종석 캔버스 렌더러 (모닝 커맨드 센터, PARA 매트릭스, 해빗 트래커, 인텔리전스 독)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sun, 
  Brain, 
  Coins, 
  Activity, 
  ArrowLeft, 
  Save, 
  Send, 
  ChevronDown, 
  Download,
  RotateCcw,
  Loader2
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

import { CockpitMorningCommandCenter } from '../../components/life/CockpitMorningCommandCenter';
import { ProjectsMasterView } from '../../components/life/ProjectsMasterView';
import { TasksHabitsMasterView } from '../../components/life/TasksHabitsMasterView';
import { ResourcesInboxMasterView } from '../../components/life/ResourcesInboxMasterView';
import { LifeLogMasterView } from '../../components/life/LifeLogMasterView';
import { IntelligenceDock } from '../../components/life/IntelligenceDock';
import { MorningBriefingModal } from '../../components/life/MorningBriefingModal';
import type { TriageResult } from '../../services/lifeHubAutoTriageRouter';
import { deployLifeHubToNotion } from '../../services/lifeHubNotionPublisher';

type ViewModeTab = 'morning_command' | 'para_second_brain' | 'smart_finance' | 'health_routine';

export const LifePage: React.FC = () => {
  const { 
    setCurrentView, 
    notionApiKey, 
    notionParentPageId,
    showToast,
    createdNotionResource,
    setCreatedNotionResource,
    selectedNotionDbId,
    setIsNotionSettingsModalOpen,
    setIsPublishSuccessModalOpen,
    apiKey
  } = useApp();

  // 상단 서브 뷰 모드 탭 (기본 활성: ☀️ 모닝 커맨드 센터)
  const [activeTab, setActiveTab] = useState<ViewModeTab>('morning_command');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState<boolean>(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  const [dockStatusMessage, setDockStatusMessage] = useState<string | null>(null);

  // 노션 배포(Export) 인터랙션 및 진행률 상태
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStepText, setExportStepText] = useState<string>('');

  // 글로벌 루틴 브리핑 오픈 이벤트 리스너
  useEffect(() => {
    const handleOpenBriefing = () => {
      setIsBriefingOpen(true);
    };
    window.addEventListener('open-morning-briefing', handleOpenBriefing);
    return () => window.removeEventListener('open-morning-briefing', handleOpenBriefing);
  }, []);

  // 4대 마스터 DB 상태 (Fallback 빈 배열 안전 보장)
  const [projects, setProjects] = useState<ProjectItem[]>(() => INITIAL_LIFE_HUB_PROJECTS);
  const [tasks, setTasks] = useState<TaskHabitItem[]>(() => INITIAL_LIFE_HUB_TASKS);
  const [resources, setResources] = useState<ResourceInboxItem[]>(() => INITIAL_LIFE_HUB_RESOURCES);
  const [lifeLogs, setLifeLogs] = useState<LifeLogItem[]>(() => INITIAL_LIFE_HUB_LOGS);

  // 초기 로컬 스토리지 로드
  useEffect(() => {
    try {
      setIsLoading(true);
      const loaded = loadLifeHubMasterState();
      setProjects(loaded.projects || INITIAL_LIFE_HUB_PROJECTS);
      setTasks(loaded.tasks || INITIAL_LIFE_HUB_TASKS);
      setResources(loaded.resources || INITIAL_LIFE_HUB_RESOURCES);
      setLifeLogs(loaded.lifeLogs || INITIAL_LIFE_HUB_LOGS);
    } catch (e) {
      console.error('[LifePage] Failed to load state:', e);
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
  // 양방향 관계형(Mutual Relation) 및 Formulas 2.0 실시간 계산
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Task에 스트릭/D-Day 수식 주입
  const resolvedTasks = useMemo(() => {
    return enrichTasksWithFormulas(tasks);
  }, [tasks]);

  // 2. Projects에 하위 Tasks 완료율 게이지 바 (■■■■■■■■□□ 80%) 및 양방향 관계형 연결 주입
  const resolvedProjects = useMemo(() => {
    return enrichProjectsWithFormulasAndRelations(projects, resolvedTasks, resources);
  }, [projects, resolvedTasks, resources]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 액션 핸들러
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. 과제 / 루틴 완료 토글 (체크박스 클릭 시 프로젝트 게이지 자동 연동 갱신)
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

      persistState(projects, nextTasks, resources, lifeLogs);
      return nextTasks;
    });

    showToast('과제 상태가 변경되었으며, Projects 진척률 게이지가 실시간 연동되었습니다.', 'success');
  }, [projects, resources, lifeLogs, persistState, showToast]);

  // 2. 1초 퀵 캡처 인박스 등록
  const handleQuickCapture = useCallback((item: {
    title: string;
    type: ResourceType;
    summary: string;
    sourceUrl?: string;
  }) => {
    const newRes: ResourceInboxItem = {
      id: `res-${Date.now()}`,
      title: item.title,
      type: item.type,
      sourceUrl: item.sourceUrl,
      summary: item.summary,
      status: '인박스',
      createdAt: new Date().toISOString()
    };

    setResources(prev => {
      const next = [newRes, ...prev];
      persistState(projects, tasks, next, lifeLogs);
      return next;
    });

    showToast(`'${item.title}' 항목이 1초 퀵 인박스에 저장되었습니다.`, 'success');
  }, [projects, tasks, lifeLogs, persistState, showToast]);

  // 2-1. [노아 AI 인텔리전스] 4대 마스터 DB 자동 분기 적재 (낙관적 업데이트)
  const handleTriageCapture = useCallback((result: TriageResult) => {
    if (result.destination === 'tasks' && result.taskData) {
      const newTask: TaskHabitItem = {
        id: `task-${Date.now()}`,
        ...result.taskData,
        createdAt: new Date().toISOString()
      };
      setTasks(prev => {
        const next = [newTask, ...prev];
        persistState(projects, next, resources, lifeLogs);
        return next;
      });
      setDockStatusMessage('✅ 인박스: 방금 1건 자동 분류 완료');
      showToast(`과제 등록 완료: ${result.explanation}`, 'success');
    } else if (result.destination === 'lifeLogs' && result.logData) {
      const newLog: LifeLogItem = {
        id: `log-${Date.now()}`,
        ...result.logData,
        createdAt: new Date().toISOString()
      };
      setLifeLogs(prev => {
        const next = [newLog, ...prev];
        persistState(projects, tasks, resources, next);
        return next;
      });
      setDockStatusMessage('✅ 인박스: 방금 1건 자동 분류 완료');
      showToast(`가계부 기록 완료: ${result.explanation}`, 'success');
    } else if (result.destination === 'projects' && result.projectData) {
      const newProj: ProjectItem = {
        id: `proj-${Date.now()}`,
        ...result.projectData,
        createdAt: new Date().toISOString()
      };
      setProjects(prev => {
        const next = [newProj, ...prev];
        persistState(next, tasks, resources, lifeLogs);
        return next;
      });
      setDockStatusMessage('✅ 인박스: 방금 1건 자동 분류 완료');
      showToast(`프로젝트 초안 등록: ${result.explanation}`, 'success');
    } else {
      const newRes: ResourceInboxItem = {
        id: `res-${Date.now()}`,
        title: result.resourceData?.title || result.itemTitle,
        type: result.resourceData?.type || '빠른메모',
        sourceUrl: result.resourceData?.sourceUrl,
        summary: result.resourceData?.summary || result.explanation,
        status: '인박스',
        tags: result.resourceData?.tags || ['인박스'],
        createdAt: new Date().toISOString()
      };
      setResources(prev => {
        const next = [newRes, ...prev];
        persistState(projects, tasks, next, lifeLogs);
        return next;
      });
      setDockStatusMessage('✅ 인박스: 방금 1건 자동 분류 완료');
      showToast(`인박스 보관 완료: ${result.explanation}`, 'success');
    }

    // 4초 후 독 메시지 정상화
    setTimeout(() => {
      setDockStatusMessage(null);
    }, 4000);
  }, [projects, tasks, resources, lifeLogs, persistState, showToast]);

  // 2-2. 모닝 브리핑 모달 -> 하루 시작하기 (Top 3 영역으로 부드러운 스크롤 이동)
  const handleStartDay = useCallback(() => {
    setIsBriefingOpen(false);
    setActiveTab('morning_command');
    setTimeout(() => {
      const top3El = document.getElementById('top3-action-card');
      if (top3El) {
        top3El.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }, []);

  // 2-3. [노션 무손실 배포 엔진] 4대 마스터 DB 및 접이식 토글 에이전트 지침서 일괄 배포
  const handleExportToNotion = useCallback(async () => {
    if (!notionApiKey?.trim() || !notionParentPageId?.trim()) {
      setIsNotionSettingsModalOpen(true);
      showToast('노션 API 연동 키와 부모 페이지 ID를 먼저 설정해 주세요.', 'warning');
      return;
    }

    setIsExporting(true);
    setExportStepText('배포 준비 중... (1/5)');

    try {
      const currentState: LifeHubMasterState = {
        projects,
        tasks,
        resources,
        lifeLogs
      };

      const result = await deployLifeHubToNotion(
        notionApiKey,
        notionParentPageId,
        currentState,
        (step) => {
          setExportStepText(step);
        }
      );

      // 전역 생성 리소스 등록
      setCreatedNotionResource({
        pageId: result.pageId,
        pageUrl: result.pageUrl,
        pageTitle: result.pageTitle,
        pageIcon: '🌱',
        databases: result.databases,
        createdAt: new Date().toISOString()
      });

      showToast('🎉 라이프 Hub가 노션에 완벽하게 생성되었습니다!', 'success');
      
      // 노션 배포 완료 모달 팝업
      setIsPublishSuccessModalOpen(true);
    } catch (err: any) {
      console.error('[LifePage] Notion export failed:', err);
      showToast(err.message || '노션 배포 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setIsExporting(false);
      setExportStepText('');
    }
  }, [
    notionApiKey,
    notionParentPageId,
    projects,
    tasks,
    resources,
    lifeLogs,
    setIsNotionSettingsModalOpen,
    setIsPublishSuccessModalOpen,
    setCreatedNotionResource,
    showToast
  ]);

  // 3. 프로젝트 추가
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
    showToast(`'${newProjData.title}' 프로젝트가 생성되었습니다.`, 'success');
  }, [tasks, resources, lifeLogs, persistState, showToast]);

  // 프로젝트 삭제
  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== projectId);
      persistState(next, tasks, resources, lifeLogs);
      return next;
    });
    showToast('프로젝트가 삭제되었습니다.', 'info');
  }, [tasks, resources, lifeLogs, persistState, showToast]);

  // 태스크 추가
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
    showToast(`'${newTaskData.title}' 과제가 추가되었습니다.`, 'success');
  }, [projects, resources, lifeLogs, persistState, showToast]);

  // 태스크 삭제
  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== taskId);
      persistState(projects, next, resources, lifeLogs);
      return next;
    });
    showToast('과제가 삭제되었습니다.', 'info');
  }, [projects, resources, lifeLogs, persistState, showToast]);

  // 리소스 상태 토글
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
    showToast(`'${newLogData.title}' 로그가 기록되었습니다.`, 'success');
  }, [projects, tasks, resources, persistState, showToast]);

  // 라이프 로그 삭제
  const handleDeleteLifeLog = useCallback((logId: string) => {
    setLifeLogs(prev => {
      const next = prev.filter(l => l.id !== logId);
      persistState(projects, tasks, resources, next);
      return next;
    });
    showToast('로그가 삭제되었습니다.', 'info');
  }, [projects, tasks, resources, persistState, showToast]);

  // JSON 백업 다운로드
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ projects, tasks, resources, lifeLogs }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `life_hub_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsSaveMenuOpen(false);
    showToast('라이프 Hub 데이터가 JSON 백업 파일로 내보내졌습니다.', 'success');
  };

  // 시드 데이터 초기화
  const handleResetSeedData = () => {
    if (window.confirm('기본 시드 데이터로 전체 초기화하시겠습니까?')) {
      setProjects(INITIAL_LIFE_HUB_PROJECTS);
      setTasks(INITIAL_LIFE_HUB_TASKS);
      setResources(INITIAL_LIFE_HUB_RESOURCES);
      setLifeLogs(INITIAL_LIFE_HUB_LOGS);
      persistState(INITIAL_LIFE_HUB_PROJECTS, INITIAL_LIFE_HUB_TASKS, INITIAL_LIFE_HUB_RESOURCES, INITIAL_LIFE_HUB_LOGS);
      setIsSaveMenuOpen(false);
      showToast('라이프 Hub 데이터가 초기 시드로 복원되었습니다.', 'info');
    }
  };

  const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || selectedNotionDbId));

  // 4대 뷰 모드 탭 목록 (단일 Lucide Monochrome 라인 아이콘 통일)
  const VIEW_TABS = [
    { id: 'morning_command' as ViewModeTab, label: '모닝 커맨드 센터', icon: Sun },
    { id: 'para_second_brain' as ViewModeTab, label: 'PARA 세컨드 브레인', icon: Brain },
    { id: 'smart_finance' as ViewModeTab, label: '스마트 재정', icon: Coins },
    { id: 'health_routine' as ViewModeTab, label: '건강 & 루틴', icon: Activity }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-[var(--bg-base)] text-[var(--text-primary)] font-sans selection:bg-blue-100 dark:selection:bg-blue-950">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. [상단 서브 컨트롤 바] - Google AI Studio & Linear 모노톤 스타일
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* 좌측 뷰 모드 탭들 */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">홈으로</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 dark:border-zinc-800 hidden sm:block" />

          {/* 4대 뷰 모드 토글 탭 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            {VIEW_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold shadow-xs border border-slate-200 dark:border-zinc-700'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-800 dark:text-zinc-200' : 'text-slate-500 dark:text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우측 액션 툴바 (Linear/Apple 모노톤 스타일 정돈) */}
        <div className="flex items-center space-x-2 shrink-0">

          {/* [ 💾 관리 ▼ (통합 드롭다운)] */}
          <div className="relative">
            <button
              onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>관리</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isSaveMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl p-1.5 z-40 space-y-1">
                <button
                  onClick={handleExportJson}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-left cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>JSON 데이터 백업</span>
                </button>
                <button
                  onClick={handleResetSeedData}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>초기 시드 데이터 복원</span>
                </button>
              </div>
            )}
          </div>

          {/* [ ⚡ 노션 내보내기 ] - 실제 노션 API 무손실 배포 엔진 연동 */}
          <button
            onClick={handleExportToNotion}
            disabled={isExporting}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer shadow-2xs ${
              isExporting
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 cursor-wait'
                : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
            }`}
            title="현재 라이프 Hub 4대 DB를 내 노션 워크스페이스에 일괄 배포"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>{exportStepText || '배포 중...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-300" />
                <span className="hidden sm:inline">노션 내보내기</span>
                <span className="sm:hidden">내보내기</span>
              </>
            )}
          </button>

          {/* 노션 연결 상태 슬림 도트 뱃지 */}
          <button
            onClick={() => setIsNotionSettingsModalOpen(true)}
            title={isNotionConnected ? '노션 연결됨' : '노션 연결 설정'}
            className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${isNotionConnected ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-400'}`} />
            <span>{isNotionConnected ? '연결됨' : '미연결'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          메인 바디 캔버스
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-7 space-y-6 pb-24">
        <ErrorBoundary fallbackTitle="라이프 Hub 화면 로드 중 오류가 발생했습니다.">
          {isLoading ? (
            /* 스켈레톤 로더 */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-pulse">
              <div className="lg:col-span-4 space-y-4">
                <div className="h-44 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800" />
                <div className="h-52 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800" />
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="h-96 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800" />
              </div>
            </div>
          ) : activeTab === 'morning_command' ? (
            /* ☀️ [1. 모닝 커맨드 센터] - 2열 벤토 그리드 조종석 캔버스 (좌측 35% / 우측 65%) */
            <CockpitMorningCommandCenter
              projects={resolvedProjects}
              tasks={resolvedTasks}
              resources={resources}
              onToggleTask={handleToggleTask}
              onAddResource={handleQuickCapture}
              onTriageCapture={handleTriageCapture}
              apiKey={apiKey}
              onAddProject={() => setActiveTab('para_second_brain')}
            />
          ) : activeTab === 'para_second_brain' ? (
            /* 🧠 [2. PARA 세컨드 브레인] - Projects & Resources 매트릭스 뷰 */
            <div className="space-y-5">
              <ProjectsMasterView
                projects={resolvedProjects}
                onToggleTask={handleToggleTask}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
              />
              <ResourcesInboxMasterView
                resources={resources}
                projects={projects}
                onToggleStatus={handleToggleResourceStatus}
                onAddResource={handleAddResource}
                onDeleteResource={handleDeleteResource}
              />
            </div>
          ) : activeTab === 'smart_finance' ? (
            /* 💰 [3. 스마트 재정] - Life Log 가계부 & 소비 지출 분석 */
            <div className="space-y-5">
              <LifeLogMasterView
                logs={lifeLogs}
                onAddLog={handleAddLifeLog}
                onDeleteLog={handleDeleteLifeLog}
              />
            </div>
          ) : (
            /* 🏃 [4. 건강 & 루틴] - 모닝 루틴 & 해빗 & 운동/수면 로깅 */
            <div className="space-y-5">
              <TasksHabitsMasterView
                tasks={resolvedTasks}
                projects={projects}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
              />
              <LifeLogMasterView
                logs={lifeLogs.filter(l => l.category === '운동' || l.category === '수면')}
                onAddLog={handleAddLifeLog}
                onDeleteLog={handleDeleteLifeLog}
              />
            </div>
          )}
        </ErrorBoundary>
      </div>


      {/* ─────────────────────────────────────────────────────────────────────────────
          4. [하단 인텔리전스 독] - 2026 자율 AI 에이전트 브리핑 바
         ───────────────────────────────────────────────────────────────────────────── */}
      <IntelligenceDock 
        inboxCount={resources.filter(r => r.status === '인박스').length} 
        statusMessage={dockStatusMessage}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. [모닝 루틴 브리핑 인터랙티브 모달]
         ───────────────────────────────────────────────────────────────────────────── */}
      <MorningBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        tasks={resolvedTasks}
        projects={resolvedProjects}
        onStartDay={handleStartDay}
      />
    </div>
  );
};

export default LifePage;
