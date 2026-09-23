import React, { useState, useEffect } from 'react';
import type { NotionTemplate, NotionDatabase, NotionProperty, NotionPropertyType } from '../types/notion';
import { ResizableSplitLayout } from './ui/ResizableSplitLayout';
import { NotionCover } from './preview/NotionCover';
import { NotionHeader } from './preview/NotionHeader';
import { NotionBlocks } from './preview/NotionBlocks';
import { NotionDatabaseView } from './preview/NotionDatabaseView';
import { TemplateSchemaTable } from './preview/TemplateSchemaTable';
import { TemplateBenchmarkCard } from './preview/TemplateBenchmarkCard';
import { StructureTreeView } from './preview/StructureTreeView';
import { AgentBlueprintCallout } from './preview/AgentBlueprintCallout';
import { ensureTemplateAgentBlueprint } from '../services/notionDynamicBuilder';
import { saveArchivedTemplate } from '../services/archiveStorage';
import { useApp } from '../context/AppContext';
import {
  Layers,
  BookmarkCheck,
  Sparkles,
  Database,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calculator,
  Zap,
  Tag,
  Radio,
  MessageSquare,
  Loader2,
  FileText,
  GitBranch,
  Code2,
  Share2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export interface TemplatePreviewCanvasProps {
  template: NotionTemplate;
}

const VAULT_STORAGE_KEY = 'notion_template_vault_draft';

export const TemplatePreviewCanvas: React.FC<TemplatePreviewCanvasProps> = ({ template }) => {
  const { 
    setPendingChatPrompt, 
    setActiveMobileTab, 
    showToast,
    publishToNotion,
    isPublishing,
    previewMode,
    setPreviewMode,
    setIsRawJsonModalOpen,
    setIsExportModalOpen,
  } = useApp();

  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);

  // [Step 4] Memory Vault & 캔버스 인라인 편집기 상태 관리
  const [editableTemplate, setEditableTemplate] = useState<NotionTemplate>(() => {
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.databases && parsed.databases.length > 0 && parsed.title === template.title) {
          return ensureTemplateAgentBlueprint(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
    return ensureTemplateAgentBlueprint(template);
  });

  // template prop이 외부에서 완전히 변경되었을 때 (예: 다른 프리셋 선택)
  useEffect(() => {
    const updated = ensureTemplateAgentBlueprint(template);
    setEditableTemplate(updated);
  }, [template]);

  // 변경 시 Memory Vault (localStorage) 자동 지속 보존
  useEffect(() => {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(editableTemplate));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [editableTemplate]);

  // 초기화 핸들러 (원래 템플릿 복원)
  
  // [Step 5 신규] 캔버스에서 인라인 수정한 스키마를 보관함에 즉시 덮어쓰기(Upsert) 저장
  const handleSaveToArchive = () => {
    if (!editableTemplate) return;

    const targetId = editableTemplate.id || template.id || `arch-${Date.now()}`;
    const targetTitle = editableTemplate.title.trim();

    const updatedTemplate: NotionTemplate = {
      ...editableTemplate,
      id: targetId,
      title: targetTitle
    };

    saveArchivedTemplate({
      id: targetId,
      title: targetTitle,
      description: updatedTemplate.description || '캔버스 인라인 편집 템플릿',
      icon: updatedTemplate.icon || '📑',
      cover_url: updatedTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
      tags: ['#내가만든템플릿', '#캔버스편집', '#에이전트3.0'],
      templateData: updatedTemplate,
      source: 'created',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    showToast(`"${targetTitle}" 템플릿이 내 보관함에 안전하게 덮어쓰기(업데이트) 저장되었습니다!`, 'success');
  };

  const handleResetToOriginal = () => {
    try {
      localStorage.removeItem(VAULT_STORAGE_KEY);
    } catch {}
    const original = ensureTemplateAgentBlueprint(template);
    setEditableTemplate(original);
    showToast('💡 템플릿 스키마가 초기 상태로 복원되었습니다.', 'info');
  };

  // 1. DB 명칭 인라인 변경
  const handleUpdateDatabaseName = (dbIndex: number, newName: string) => {
    setEditableTemplate(prev => {
      const oldName = prev.databases[dbIndex]?.name;
      const updatedDbs = prev.databases.map((db, i) => {
        if (i === dbIndex) {
          return { ...db, name: newName };
        }
        if (oldName) {
          const updatedProps = db.properties.map(p => {
            if (p.type === 'relation' && p.target === oldName) {
              return { ...p, target: newName };
            }
            return p;
          });
          return { ...db, properties: updatedProps };
        }
        return db;
      });

      return {
        ...prev,
        databases: updatedDbs
      };
    });
    showToast(`데이터베이스 명칭이 '${newName}'(으)로 변경되었습니다.`, 'info');
  };

  // 2. 속성(컬럼)명 인라인 변경
  const handleUpdatePropertyName = (dbIndex: number, propIndex: number, newName: string) => {
    setEditableTemplate(prev => {
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;

      const updatedProps = [...updatedDbs[dbIndex].properties];
      if (!updatedProps[propIndex]) return prev;

      updatedProps[propIndex] = {
        ...updatedProps[propIndex],
        name: newName
      };

      updatedDbs[dbIndex] = {
        ...updatedDbs[dbIndex],
        properties: updatedProps
      };

      return {
        ...prev,
        databases: updatedDbs
      };
    });
    showToast(`속성명이 '${newName}'(으)로 변경되었습니다.`, 'info');
  };

  // 3. 속성 타입 드롭다운 변경
  const handleUpdatePropertyType = (dbIndex: number, propIndex: number, newType: NotionPropertyType) => {
    setEditableTemplate(prev => {
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;

      const updatedProps = [...updatedDbs[dbIndex].properties];
      const targetProp = updatedProps[propIndex];
      if (!targetProp) return prev;

      const newProp: NotionProperty = {
        ...targetProp,
        type: newType,
      };

      if (newType === 'formula') {
        newProp.expression = 'ifs(prop("상태") == "완료", "■■■■■ 100% 🟢", "■■■□□ 60% 🟡")';
      } else if (newType === 'select' || newType === 'multi_select' || newType === 'status') {
        newProp.options = ['대기 중', '진행 중', '완료'];
      } else if (newType === 'relation') {
        const otherDb = prev.databases.find((_, i) => i !== dbIndex);
        newProp.target = otherDb?.name || '관련 데이터베이스';
      }

      updatedProps[propIndex] = newProp;
      updatedDbs[dbIndex] = {
        ...updatedDbs[dbIndex],
        properties: updatedProps
      };

      return {
        ...prev,
        databases: updatedDbs
      };
    });
    showToast(`속성 타입이 '${newType}'(으)로 변경되었습니다.`, 'info');
  };

  // 4. 속성 삭제
  const handleDeleteProperty = (dbIndex: number, propIndex: number) => {
    const targetProp = editableTemplate.databases[dbIndex]?.properties[propIndex];
    if (targetProp?.type === 'title') {
      showToast('기본 제목(Title) 속성은 삭제할 수 없습니다.', 'info');
      return;
    }

    setEditableTemplate(prev => {
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;

      const updatedProps = updatedDbs[dbIndex].properties.filter((_, i) => i !== propIndex);
      updatedDbs[dbIndex] = {
        ...updatedDbs[dbIndex],
        properties: updatedProps
      };

      return {
        ...prev,
        databases: updatedDbs
      };
    });
    showToast('속성이 삭제되었습니다.', 'info');
  };

  // 5. 새 속성 추가
  const handleAddProperty = (dbIndex: number) => {
    setEditableTemplate(prev => {
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;

      const newIndex = updatedDbs[dbIndex].properties.length + 1;
      const newProp: NotionProperty = {
        name: `새 속성 ${newIndex}`,
        type: 'text'
      };

      updatedDbs[dbIndex] = {
        ...updatedDbs[dbIndex],
        properties: [...updatedDbs[dbIndex].properties, newProp]
      };

      return {
        ...prev,
        databases: updatedDbs
      };
    });
    showToast('새 속성이 추가되었습니다. 캔버스에서 명칭과 타입을 설정하세요.', 'success');
  };

  // 6. 새 관계형 데이터베이스 추가
  const handleAddDatabase = () => {
    setEditableTemplate(prev => {
      const newIdx = prev.databases.length + 1;
      const newDb: NotionDatabase = {
        name: `📂 신규 업무 DB ${newIdx}`,
        description: '사용자가 캔버스에서 직접 추가한 상용 관계형 데이터베이스',
        view_type: 'table',
        properties: [
          { name: '제목', type: 'title' },
          { name: '마감일', type: 'date' },
          { name: '진행 상태', type: 'status', options: ['대기 중', '진행 중', '완료'] },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' },
          { name: '진행률 수식', type: 'formula', expression: 'ifs(prop("진행 상태") == "완료", "100% 🟢", "50% 🟡")' }
        ],
        sample_rows: [
          { '제목': '신규 업무 항목 1', '진행 상태': '진행 중', 'Quality_Status': '초안', 'Verified': false }
        ]
      };

      return {
        ...prev,
        databases: [...prev.databases, newDb]
      };
    });
    showToast('신규 데이터베이스가 추가되었습니다.', 'success');
  };

  // 통계 계산: DB 수, 총 속성 수, Formulas 2.0 수식 수
  const totalDatabases = editableTemplate.databases.length;
  const totalProperties = editableTemplate.databases.reduce((sum, db) => sum + db.properties.length, 0);
  const totalFormulas = editableTemplate.databases.reduce(
    (sum, db) => sum + db.properties.filter((p) => p.type === 'formula').length,
    0
  );

  // 특정 DB 스크롤 이동
  const scrollToDb = (dbName: string) => {
    setSelectedDbId(dbName);
    const element = document.getElementById(`db-section-${dbName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 대화창 수정 유도
  const handleModifyWithChat = () => {
    const promptText = `"${editableTemplate.title}" 템플릿의 데이터베이스 속성을 고도화하고 맞춤형 수식을 추가해줘.`;
    setPendingChatPrompt(promptText);
    setActiveMobileTab('chat');
    showToast('💬 대화창에 템플릿 수정 프롬프트가 자동 입력되었습니다.', 'info');
  };

  // 에이전트 스킬 프리셋 주입 핸들러
  const handleApplySkill = (skillPrompt: string, skillName: string) => {
    setPendingChatPrompt(`현재 "${editableTemplate.title}" 템플릿에 [${skillName}]을 무손실 업그레이드로 적용해줘: ${skillPrompt}`);
    setActiveMobileTab('chat');
    showToast(`💬 "${skillName}" 요청이 대화창에 준비되었습니다.`, 'info');
  };

  return (
    <div className="w-full h-full min-h-0 overflow-hidden bg-white dark:bg-notion-dark-bg">
      <ResizableSplitLayout
        defaultRatio={25}
        minRatio={15}
        maxRatio={40}
        minPixelWidth={230}
        storageKey="template_builder_resizable_split_v2"
        className="h-full min-h-0"
        leftContent={({ toggleCollapse }) => (
          <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
            {/* 좌측 사이드바 상단 헤더 & [◀ 접기] 토글 버튼 */}
            <div className="h-11 px-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs shrink-0 select-none">
              <div className="flex items-center space-x-1.5 min-w-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate whitespace-nowrap">
                  에이전트 3.0 패널
                </span>
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="좌측 패널 접기 (전체화면 모드)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>접기</span>
              </button>
            </div>

            {/* 좌측 패널 스크롤 가능 영역 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
              {/* 1. 에이전트 3.0 상태 모니터링 카드 */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      에이전트 3.0 상태
                    </span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                    ● Active
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">전담 서브에이전트</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">총괄 PM 에이전트</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">트리거 체이닝</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">스케줄(09:00) + 이벤트</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">감사 로그 상태</span>
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                      Heartbeat 정상
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="whitespace-nowrap">품질 게이트</span>
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                      Verified 100%
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 네비게이션 바로가기 (DB 및 섹션 목록) */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    템플릿 DB 바로가기 ({totalDatabases})
                  </span>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {editableTemplate.databases.map((db, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToDb(db.name)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-left transition whitespace-nowrap cursor-pointer ${
                        selectedDbId === db.name
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <Database className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{db.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0 whitespace-nowrap">
                        {db.properties.length} 속성
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 추천 에이전트 스킬 프리셋 */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-xs">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    추천 에이전트 스킬 주입
                  </span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() =>
                      handleApplySkill(
                        'D-Day 1일 이내 미완료 태스크를 상단 콜아웃에 실시간 긴급 경고 뱃지로 띄우는 알림 스킬을 추가해줘.',
                        '마감 24h 긴급 알림'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">마감 24h 긴급 알림</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  <button
                    onClick={() =>
                      handleApplySkill(
                        '매일 자정 dateBetween() 수식과 진행률 롤업 게이지를 자동 갱신하고 지연 태스크를 자동 분류하는 수식 스킬을 붙여줘.',
                        'D-Day 자정 자동 갱신'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Calculator className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">D-Day 자정 자동 갱신</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  <button
                    onClick={() =>
                      handleApplySkill(
                        '매주 월요일 08:30 지난주 완료 실적과 이번 주 집중 과제 TOP 3을 대시보드 상단에 3줄 요약 브리핑하는 스킬을 장착해줘.',
                        '주간 결산 브리핑'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Activity className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">주간 결산 브리핑</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  <button
                    onClick={() =>
                      handleApplySkill(
                        '하단에 Agent_Heartbeat_Log 감사 DB를 연결하고, 모든 자동화 트리거와 무손실 검증 이력을 기록하도록 구성해줘.',
                        '감사 로그 DB 연동'
                      )
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition cursor-pointer text-left border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate whitespace-nowrap">감사 로그 DB 연동</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        rightContent={({ isCollapsed, toggleCollapse }) => (
          <div className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-white dark:bg-notion-dark-bg">
            {/* 1. 상단 툴바 (뷰 전환 및 공유/배포 액션) - 고정 Header */}
            <div className="h-11 px-3 sm:px-6 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-notion-dark-border flex items-center justify-between gap-2 shrink-0 select-none z-20">
              <div className="flex items-center space-x-2 shrink-0">
                {/* 좌측 패널이 접혔을 때 나타나는 [▶ 펼치기] 버튼 */}
                {isCollapsed && (
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold whitespace-nowrap cursor-pointer"
                    title="좌측 에이전트 패널 펼치기"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span>패널 열기</span>
                  </button>
                )}

                {/* 뷰 모드 전환 토글 (페이지 뷰 vs 구조 트리 뷰) */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
                  <button
                    onClick={() => setPreviewMode('notion')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                      previewMode === 'notion'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>노션 페이지</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('tree')}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                      previewMode === 'tree'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>구조 트리</span>
                  </button>
                </div>
              </div>

              {/* 우측 유틸리티 버튼 (JSON 보기, 배포, 내보내기) */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                
                <button
                  onClick={handleSaveToArchive}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer whitespace-nowrap"
                  title="현재 인라인 수정한 스키마를 내 보관함에 즉시 덮어쓰기(업데이트) 저장합니다"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">보관함 저장</span>
                </button>

                <button
                  onClick={() => setIsRawJsonModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer whitespace-nowrap"
                  title="템플릿 JSON 원본 코드 확인"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">JSON</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer whitespace-nowrap"
                  title="PDF / 마크다운 / HTML 내보내기"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">내보내기</span>
                </button>

                <button
                  onClick={publishToNotion}
                  disabled={isPublishing}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isPublishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  )}
                  <span>{isPublishing ? '배포 중...' : '노션에 바로 배포'}</span>
                </button>
              </div>
            </div>

            {/* 2. 상단 KPI 요약 헤더 바 - 고정 Subheader */}
            <div className="h-10 px-4 sm:px-6 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto shrink-0 select-none scrollbar-none z-10">
              <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
                {/* KPI 1: 설계 진척도 */}
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    설계 진척도
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-16 sm:w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-800 dark:bg-slate-200 rounded-full w-full" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      100%
                    </span>
                  </div>
                </div>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 shrink-0" />

                {/* KPI 2: 멀티 DB 수 */}
                <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 dark:text-slate-400">데이터베이스</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalDatabases}개</span>
                </div>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 shrink-0" />

                {/* KPI 3: 속성 수 */}
                <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500 dark:text-slate-400">총 속성</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalProperties}개</span>
                </div>

                <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 shrink-0" />

                {/* KPI 4: Formulas 2.0 수식 */}
                <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                  <Calculator className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-slate-500 dark:text-slate-400">Formulas 2.0</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300 font-mono">{totalFormulas}개</span>
                </div>
              </div>

              {/* KPI 5: 무손실 검증 상태 뱃지 & Memory Vault 상태 */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 mr-1 text-slate-600 dark:text-slate-300" />
                  무손실 검증: PASS
                </span>

                <span 
                  title="모든 인라인 스키마 수정 내역이 브라우저 로컬스토리지에 실시간 자동 보존됩니다"
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap"
                >
                  <Database className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />
                  Memory Vault: 동기화됨 💾
                </span>

                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="인라인 편집된 스키마를 원래 템플릿 상태로 복원합니다"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>초기화</span>
                </button>
              </div>
            </div>

            {/* 3. 세로 휠 스크롤(Vertical Scroll) 해제된 메인 캔버스 뷰 */}
            <div className="w-full h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {previewMode === 'tree' ? (
                <div className="p-4 sm:p-8 pb-32">
                  <StructureTreeView template={editableTemplate} />
                </div>
              ) : (
                <div className="pb-32">
                  {/* [Step 3] 최상단 커스텀 에이전트 3.0 원클릭 셋업 콜아웃 카드 */}
                  {editableTemplate.agentBlueprint && (
                    <div className="px-4 sm:px-10 md:px-12 pt-4">
                      <AgentBlueprintCallout
                        blueprint={editableTemplate.agentBlueprint}
                        templateTitle={editableTemplate.title}
                      />
                    </div>
                  )}

                  {/* 상용 베스트셀러 대비 고도화 분석 아코디언 */}
                  <div className="px-4 sm:px-10 md:px-12 pt-2">
                    <TemplateBenchmarkCard template={editableTemplate} />
                  </div>

                  {/* 커버 이미지 */}
                  <NotionCover coverUrl={editableTemplate.cover_url} />

                  {/* 노션 페이지 헤더 (이모지, 제목, 설명, 메타) */}
                  <NotionHeader
                    title={editableTemplate.title}
                    icon={editableTemplate.icon}
                    description={editableTemplate.description}
                  />

                  {/* 페이지 레이아웃 블록들 */}
                  <div className="px-6 sm:px-10 md:px-12">
                    <NotionBlocks blocks={editableTemplate.page_layout} />
                  </div>

                  {/* 다중 데이터베이스 섹션 (인라인 편집 지원) */}
                  <div className="px-6 sm:px-10 md:px-12 mt-6 space-y-6">
                    {editableTemplate.databases.map((db: NotionDatabase, idx: number) => (
                      <div key={idx} id={`db-section-${db.name}`}>
                        <NotionDatabaseView 
                          database={db}
                          dbIndex={idx}
                          onUpdateDatabaseName={handleUpdateDatabaseName}
                          onUpdatePropertyName={handleUpdatePropertyName}
                          onUpdatePropertyType={handleUpdatePropertyType}
                          onDeleteProperty={handleDeleteProperty}
                          onAddProperty={handleAddProperty}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 스키마 명세 테이블 (인라인 편집 및 새 속성/DB 추가 지원) */}
                  <div className="px-6 sm:px-10 md:px-12 mt-8">
                    <TemplateSchemaTable 
                      databases={editableTemplate.databases} 
                      onUpdateDatabaseName={handleUpdateDatabaseName}
                      onUpdatePropertyName={handleUpdatePropertyName}
                      onUpdatePropertyType={handleUpdatePropertyType}
                      onDeleteProperty={handleDeleteProperty}
                      onAddProperty={handleAddProperty}
                      onAddDatabase={handleAddDatabase}
                    />
                  </div>

                  {/* 하단 통합 액션 배너 */}
                  <div className="px-6 sm:px-10 md:px-12 mt-12 mb-8">
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-indigo-950 to-neutral-900 text-white shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{editableTemplate.icon || '📑'}</span>
                          <h4 className="text-base sm:text-lg font-extrabold text-white">
                            {editableTemplate.title}
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                          이 템플릿을 내 노션에 직접 배포하거나, 하단 옴니 챗과 대화하여 우리 팀만의 전용 필드나 
                          수식을 손쉽게 추가할 수 있습니다.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          onClick={handleModifyWithChat}
                          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition active:scale-95 cursor-pointer"
                          title="해당 템플릿 구조를 AI 채팅창에 자동 입력하고 커스텀 수정을 시작합니다"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-300" />
                          <span>💬 대화로 수정하기</span>
                        </button>

                        <button
                          onClick={publishToNotion}
                          disabled={isPublishing}
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
                          title="클릭 한 번으로 내 노션 워크스페이스에 전체 페이지와 DB를 즉시 생성합니다"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              <span>생성 중...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                              <span>⚡ 이 템플릿 내 노션에 바로 생성</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default TemplatePreviewCanvas;
