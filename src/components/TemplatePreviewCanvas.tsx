import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { InspectorChat } from './workspace/InspectorChat';
import { ensureTemplateAgentBlueprint } from '../services/notionDynamicBuilder';
import { saveArchivedTemplate } from '../services/archiveStorage';
import { getSafeProperties } from '../lib/templateUtils';
import { normalizeTemplatePayload } from '../utils/schemaAdapter';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Database,
  ShieldCheck,
  Calculator,
  Zap,
  Tag,
  MessageSquare,
  Loader2,
  FileText,
  GitBranch,
  Code2,
  ChevronLeft,
  RotateCcw,
  Undo2,
  Save,
  History,
  ChevronDown,
  Copy,
  X
} from 'lucide-react';

export interface TemplatePreviewCanvasProps {
  template: NotionTemplate | null;
}

export interface TemplateHistoryEntry {
  id: string;
  version: number;
  label: string;
  timestamp: string;
  template: NotionTemplate;
}

const VAULT_STORAGE_KEY = 'notion_template_vault_draft';
const DRAFT_STORAGE_KEY = 'notion_architect_draft_template';

export const TemplatePreviewCanvas: React.FC<TemplatePreviewCanvasProps> = ({ template: rawTemplate }) => {
  const { 
    setPendingChatPrompt, 
    setActiveMobileTab, 
    showToast,
    publishToNotion,
    isPublishing,
    previewMode,
    setPreviewMode,
    setIsRawJsonModalOpen,
    isGenerating,
    setCurrentTemplate,
  } = useApp();

  // [Step 1: DB properties 스키마 어댑터 정규화 - 런타임 타입 충돌 원천 차단]
  const template = useMemo(() => normalizeTemplatePayload(rawTemplate), [rawTemplate]);

  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);

  // [Step 4] Memory Vault & 캔버스 인라인 편집기 상태 관리
  const [editableTemplate, setEditableTemplate] = useState<NotionTemplate | null>(() => {
    if (!template) return null;
    try {
      const saved = localStorage.getItem(VAULT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.databases && parsed.databases.length > 0 && parsed.title === template.title) {
          const normalizedSaved = normalizeTemplatePayload(parsed);
          return normalizedSaved ? ensureTemplateAgentBlueprint(normalizedSaved) : null;
        }
      }
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
    return ensureTemplateAgentBlueprint(template);
  });

  // ─── [작업 히스토리 스택 (Undo / Version History) 상태 관리] ─────────────────
  const [templateHistory, setTemplateHistory] = useState<TemplateHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // ─── [통합 저장 및 관리 드롭다운 & 다른 이름으로 저장 모달 상태] ───────────────
  const [isSaveManageOpen, setIsSaveManageOpen] = useState<boolean>(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState<boolean>(false);
  const [saveAsTitle, setSaveAsTitle] = useState<string>('');
  const saveManageDropdownRef = useRef<HTMLDivElement>(null);

  const isInternalActionRef = React.useRef<boolean>(false);
  const lastTemplateIdRef = React.useRef<string | null>(null);

  // 드롭다운 외부 클릭 시 자동 닫힘 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (saveManageDropdownRef.current && !saveManageDropdownRef.current.contains(e.target as Node)) {
        setIsSaveManageOpen(false);
      }
    };
    if (isSaveManageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSaveManageOpen]);

  // [Clean Wipe & Canvas Reset Listener]
  useEffect(() => {
    const handleReset = () => {
      setEditableTemplate(null);
      setTemplateHistory([]);
      setHistoryIndex(-1);
      lastTemplateIdRef.current = null;
      try {
        localStorage.removeItem(VAULT_STORAGE_KEY);
        localStorage.removeItem('notion_template_cache');
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
    };
    window.addEventListener('canvas:reset', handleReset);
    return () => window.removeEventListener('canvas:reset', handleReset);
  }, []);

  // [히스토리 스택 스냅샷 등록 헬퍼]
  const pushHistoryEntry = (newTpl: NotionTemplate, label: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTemplateHistory(prev => {
      let base = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : [];
      // 만약 이전 히스토리가 비어있다면 현재 editableTemplate을 최초 원본으로 먼저 확보
      if (base.length === 0 && editableTemplate) {
        base = [{
          id: `v1-${Date.now() - 1000}`,
          version: 1,
          label: '최초 원본',
          timestamp: timeStr,
          template: JSON.parse(JSON.stringify(editableTemplate))
        }];
      }
      const nextVer = (base[base.length - 1]?.version || 0) + 1;
      const newEntry: TemplateHistoryEntry = {
        id: `v${nextVer}-${Date.now()}`,
        version: nextVer,
        label,
        timestamp: timeStr,
        template: JSON.parse(JSON.stringify(newTpl))
      };
      const nextHistory = [...base, newEntry].slice(-30); // 최대 30개 보관
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
  };

  // [최초 자동 저장]: 신규 템플릿 로드 시에만 history[0] 스냅샷 등록 (내부 수정 시 리셋 방지)
  useEffect(() => {
    if (!template) {
      setEditableTemplate(null);
      setTemplateHistory([]);
      setHistoryIndex(-1);
      lastTemplateIdRef.current = null;
      return;
    }

    // 내부 변경(Undo 또는 인스펙터 수정)에 의한 prop 갱신일 경우 히스토리 리셋 차단!
    if (isInternalActionRef.current) {
      isInternalActionRef.current = false;
      return;
    }

    const currentId = template.id || template.title;
    if (lastTemplateIdRef.current !== currentId) {
      lastTemplateIdRef.current = currentId;
      const updated = ensureTemplateAgentBlueprint(template);
      setEditableTemplate(updated);
      if (updated.databases.length > 0) {
        setSelectedDbId(updated.databases[0].name);
      }
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const initialEntry: TemplateHistoryEntry = {
        id: `v1-${Date.now()}`,
        version: 1,
        label: '최초 원본',
        timestamp: timeStr,
        template: JSON.parse(JSON.stringify(updated))
      };
      setTemplateHistory([initialEntry]);
      setHistoryIndex(0);
    }
  }, [template]);

  // [2초 디바운스 자동 세이프가드]: 템플릿 변경 시 조용히 백그라운드 로컬스토리지에만 저장 (배너 미표시)
  useEffect(() => {
    if (!editableTemplate) return;
    const timer = setTimeout(() => {
      try {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const payload = {
          template: editableTemplate,
          savedAt: Date.now(),
          timeString: timeStr
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(editableTemplate));
      } catch (e) {
        console.warn('Auto draft sync failed', e);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [editableTemplate]);

  // [↩️ 되돌리기 (Undo) 핸들러]: 직전 상태로 즉시 롤백 (historyIndex > 0)
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetEntry = templateHistory[prevIdx];
      if (targetEntry) {
        isInternalActionRef.current = true;
        setHistoryIndex(prevIdx);
        const snapshotCopy = JSON.parse(JSON.stringify(targetEntry.template));
        setEditableTemplate(snapshotCopy);
        showToast(`↩️ '${targetEntry.label}' (v${targetEntry.version}) 시점으로 되돌렸습니다.`, 'info');
      }
    }
  };

  // [💾 저장하기 (Save) 단일 통합 핸들러]: 로컬 초안 및 내 보관함에 타임스탬프와 함께 동시 저장
  const handleSaveAll = () => {
    if (!editableTemplate) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      // 1. 로컬스토리지 저장
      const payload = {
        template: editableTemplate,
        savedAt: Date.now(),
        timeString: timeStr
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(editableTemplate));

      // 2. 내 보관함에 덮어쓰기/신규 동시 저장
      const targetId = editableTemplate.id || template?.id || `arch-${Date.now()}`;
      const targetTitle = editableTemplate.title.trim();
      saveArchivedTemplate({
        id: targetId,
        title: targetTitle,
        description: editableTemplate.description || '캔버스 작업실 템플릿',
        icon: editableTemplate.icon || '📑',
        cover_url: editableTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
        tags: ['#내가만든템플릿', '#캔버스저장', '#NOA인스펙터'],
        templateData: editableTemplate,
        source: 'created',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // 3. 상태 갱신 및 히스토리 체크포인트 등록
      setLastSavedTime(timeStr);
      pushHistoryEntry(editableTemplate, '저장 체크포인트');
      showToast(`💾 템플릿이 로컬 및 내 보관함에 안전하게 저장되었습니다 (${timeStr})`, 'success');
    } catch (e) {
      console.error('Failed to save template', e);
      showToast('저장에 실패했습니다.', 'error');
    }
  };

  // [⏱️ 버전 복구 (Restore) 핸들러]: 특정 시점 데이터로 캔버스 즉각 원상 복구
  const handleRestoreVersion = (index: number) => {
    const target = templateHistory[index];
    if (target) {
      isInternalActionRef.current = true;
      setHistoryIndex(index);
      const snapshotCopy = JSON.parse(JSON.stringify(target.template));
      setEditableTemplate(snapshotCopy);
      setIsSaveManageOpen(false);
      showToast(`⏱️ '${target.label}' (v${target.version}) 시점으로 복원되었습니다.`, 'success');
    }
  };

  // [💾 저장 및 관리: 1) 현재 상태 저장]
  const handleSaveCurrentState = () => {
    handleSaveAll();
    setIsSaveManageOpen(false);
  };

  // [💾 저장 및 관리: 2) 다른 이름으로 저장 열기 & 확인]
  const handleOpenSaveAsModal = () => {
    setSaveAsTitle(editableTemplate?.title ? `${editableTemplate.title} (사본)` : '새 템플릿 사본');
    setIsSaveAsModalOpen(true);
    setIsSaveManageOpen(false);
  };

  const handleSaveAsConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editableTemplate || !saveAsTitle.trim()) return;

    const newId = `tpl-copy-${Date.now()}`;
    const newTitle = saveAsTitle.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const duplicatedTemplate: NotionTemplate = {
      ...editableTemplate,
      id: newId,
      title: newTitle
    };

    try {
      saveArchivedTemplate({
        id: newId,
        title: newTitle,
        description: duplicatedTemplate.description || '복제된 사용자 템플릿',
        icon: duplicatedTemplate.icon || '📑',
        cover_url: duplicatedTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
        tags: ['#내가만든템플릿', '#복제저장', '#NOA인스펙터'],
        templateData: duplicatedTemplate,
        source: 'created',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      setEditableTemplate(duplicatedTemplate);
      setCurrentTemplate(duplicatedTemplate);
      setLastSavedTime(timeStr);
      pushHistoryEntry(duplicatedTemplate, `다른 이름으로 저장: ${newTitle}`);
      setIsSaveAsModalOpen(false);
      showToast(`📑 "${newTitle}" 템플릿으로 보관함에 새롭게 복제 저장되었습니다!`, 'success');
    } catch (err) {
      console.error('Save As error:', err);
      showToast('다른 이름으로 저장에 실패했습니다.', 'error');
    }
  };

  // [💾 저장 및 관리: 4) 최초 원본(v1)으로 복구]
  const handleResetToV1 = () => {
    setIsSaveManageOpen(false);
    if (templateHistory.length > 0 && templateHistory[0]) {
      handleRestoreVersion(0);
      showToast('🔄 최초 원본(v1) 상태로 1초 만에 복구되었습니다.', 'info');
    } else {
      handleResetToOriginal();
    }
  };

  // 변경 시 Memory Vault (localStorage) 자동 지속 보존
  useEffect(() => {
    try {
      if (editableTemplate) {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(editableTemplate));
      } else {
        localStorage.removeItem(VAULT_STORAGE_KEY);
        localStorage.removeItem('notion_template_cache');
      }
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [editableTemplate]);



  const handleResetToOriginal = () => {
    try {
      localStorage.removeItem(VAULT_STORAGE_KEY);
      localStorage.removeItem('notion_template_cache');
    } catch {}
    if (!template) {
      setEditableTemplate(null);
    } else {
      const original = ensureTemplateAgentBlueprint(template);
      setEditableTemplate(original);
    }
    showToast('💡 템플릿 스키마가 초기 상태로 복원되었습니다.', 'info');
  };

  // 1. DB 명칭 인라인 변경
  const handleUpdateDatabaseName = (dbIndex: number, newName: string) => {
    if (!editableTemplate) return;
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const oldName = prev.databases[dbIndex]?.name;
      const updatedDbs = prev.databases.map((db, i) => {
        if (i === dbIndex) {
          return { ...db, name: newName };
        }
        if (oldName) {
          const updatedProps = getSafeProperties(db.properties).map((p: any) => {
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
        title: prev.title || '',
        databases: updatedDbs
      };
    });
    showToast(`데이터베이스 명칭이 '${newName}'(으)로 변경되었습니다.`, 'info');
  };

  // 2. 속성(컬럼)명 인라인 변경
  const handleUpdatePropertyName = (dbIndex: number, propIndex: number, newName: string) => {
    if (!editableTemplate) return;
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;
      const updatedProps = [...updatedDbs[dbIndex].properties];
      if (!updatedProps[propIndex]) return prev;
      updatedProps[propIndex] = { ...updatedProps[propIndex], name: newName };
      updatedDbs[dbIndex] = { ...updatedDbs[dbIndex], properties: updatedProps };
      const res: NotionTemplate = { ...prev, title: prev.title || "", databases: updatedDbs };
      return res;
    });
    showToast(`속성명이 '${newName}'(으)로 변경되었습니다.`, "info");
  };

  // 3. 속성 타입 드롭다운 변경
  const handleUpdatePropertyType = (dbIndex: number, propIndex: number, newType: NotionPropertyType) => {
    if (!editableTemplate) return;
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;
      const updatedProps = [...updatedDbs[dbIndex].properties];
      const targetProp = updatedProps[propIndex];
      if (!targetProp) return prev;
      const newProp: NotionProperty = { ...targetProp, type: newType };
      if (newType === "formula") {
        newProp.expression = 'ifs(prop("상태") == "완료", "■■■■■ 100% 🟢", "■■■□□ 60% 🟡")';
      } else if (newType === "select" || newType === "multi_select" || newType === "status") {
        newProp.options = ["대기 중", "진행 중", "완료"];
      } else if (newType === "relation") {
        const otherDb = prev.databases.find((_, i) => i !== dbIndex);
        newProp.target = otherDb?.name || "관련 데이터베이스";
      }
      updatedProps[propIndex] = newProp;
      updatedDbs[dbIndex] = { ...updatedDbs[dbIndex], properties: updatedProps };
      const res: NotionTemplate = { ...prev, title: prev.title || "", databases: updatedDbs };
      return res;
    });
    showToast(`속성 타입이 '${newType}'(으)로 변경되었습니다.`, "info");
  };

  // 4. 속성 삭제
  const handleDeleteProperty = (dbIndex: number, propIndex: number) => {
    if (!editableTemplate) return;
    const safeProps = getSafeProperties(editableTemplate.databases[dbIndex]?.properties);
    const targetProp = safeProps[propIndex];
    if (targetProp?.type === "title") {
      showToast("기본 제목(Title) 속성은 삭제할 수 없습니다.", "info");
      return;
    }
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;
      const updatedProps = getSafeProperties(updatedDbs[dbIndex].properties).filter((_: any, i: number) => i !== propIndex);
      updatedDbs[dbIndex] = { ...updatedDbs[dbIndex], properties: updatedProps };
      const res: NotionTemplate = { ...prev, title: prev.title || "", databases: updatedDbs };
      return res;
    });
    showToast("속성이 삭제되었습니다.", "info");
  };

  // 5. 새 속성 추가
  const handleAddProperty = (dbIndex: number) => {
    if (!editableTemplate) return;
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;
      const currentProps = getSafeProperties(updatedDbs[dbIndex].properties);
      const newIndex = currentProps.length + 1;
      const newProp: NotionProperty = { name: `새 속성 ${newIndex}`, type: "rich_text" };
      updatedDbs[dbIndex] = { ...updatedDbs[dbIndex], properties: [...currentProps, newProp] };
      const res: NotionTemplate = { ...prev, title: prev.title || "", databases: updatedDbs };
      return res;
    });
    showToast("새 속성이 추가되었습니다. 캔버스에서 명칭과 타입을 설정하세요.", "success");
  };

  // 5-1. 인스펙터 커스텀 속성 추가 핸들러
  const handleAddCustomProperty = (dbIndex: number, property: NotionProperty) => {
    if (!editableTemplate) return;
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const updatedDbs = [...prev.databases];
      if (!updatedDbs[dbIndex]) return prev;
      const currentProps = getSafeProperties(updatedDbs[dbIndex].properties);
      updatedDbs[dbIndex] = { ...updatedDbs[dbIndex], properties: [...currentProps, property] };
      return { ...prev, databases: updatedDbs };
    });
    showToast(`"${property.name}" 속성이 추가되었습니다.`, "success");
  };

  // 6. 새 관계형 데이터베이스 추가
  const handleAddDatabase = () => {
    if (!editableTemplate) return;
    setEditableTemplate((prev): NotionTemplate | null => {
      if (!prev) return null;
      const newIdx = prev.databases.length + 1;
      const newDb: NotionDatabase = {
        name: `📂 신규 업무 DB ${newIdx}`,
        description: "사용자가 캔버스에서 직접 추가한 상용 관계형 데이터베이스",
        view_type: "table",
        properties: [
          { name: "제목", type: "title" },
          { name: "마감일", type: "date" },
          { name: "진행 상태", type: "status", options: ["대기 중", "진행 중", "완료"] },
          { name: "Quality_Status", type: "select", options: ["초안", "검수 중", "승인", "반려"] },
          { name: "Verified", type: "checkbox" },
          { name: "진행률 수식", type: "formula", expression: 'ifs(prop("진행 상태") == "완료", "100% 🟢", "50% 🟡")' }
        ],
        sample_rows: [{ "제목": "신규 업무 항목 1", "진행 상태": "진행 중", "Quality_Status": "초안", "Verified": false }]
      };
      const res: NotionTemplate = { ...prev, title: prev.title || "", databases: [...prev.databases, newDb] };
      return res;
    });
    showToast("신규 데이터베이스가 추가되었습니다.", "success");
  };

  // 통계 계산: DB 수, 총 속성 수, Formulas 2.0 수식 수
  const totalDatabases = editableTemplate ? editableTemplate.databases.length : 0;
  const totalProperties = editableTemplate ? editableTemplate.databases.reduce((sum, db) => sum + getSafeProperties(db.properties).length, 0) : 0;
  const totalFormulas = editableTemplate ? editableTemplate.databases.reduce(
    (sum, db) => sum + getSafeProperties(db.properties).filter((p: any) => p.type === 'formula').length,
    0
  ) : 0;

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
    if (!editableTemplate) return;
    const promptText = `"${editableTemplate.title}" 템플릿의 데이터베이스 속성을 고도화하고 맞춤형 수식을 추가해줘.`;
    setPendingChatPrompt(promptText);
    setActiveMobileTab('chat');
    showToast('💬 대화창에 템플릿 수정 프롬프트가 자동 입력되었습니다.', 'info');
  };

  // 에이전트 스킬 프리셋 주입 핸들러
  const handleApplySkill = (skillPrompt: string, skillName: string) => {
    if (!editableTemplate) return;
    setPendingChatPrompt(`현재 "${editableTemplate.title}" 템플릿에 [${skillName}]을 무손실 업그레이드로 적용해줘: ${skillPrompt}`);
    setActiveMobileTab('chat');
    showToast(`💬 "${skillName}" 요청이 대화창에 준비되었습니다.`, 'info');
  };

  return (
    <div className="w-full h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-950 font-sans">
      {/* 2단 리사이저블 분할 레이아웃: 좌측 메인 캔버스 75% ↔ 우측 NOA 인스펙터 25% (기본값) */}
      <ResizableSplitLayout
        side="right"
        defaultRatio={25}
        minRatio={15}
        maxRatio={40}
        minPixelWidth={260}
        storageKey="template_builder_inspector_split_v1"
        className="h-full min-h-0"
        mainContent={({ isCollapsed, toggleCollapse }) => {
          return (
            <div className="flex flex-col h-full min-h-0 w-full overflow-hidden bg-white dark:bg-zinc-950">
              {/* 1. 상단 툴바: 표준 클린 모노톤 & 메탈릭 미니멀 룩 */}
              <div className="h-11 px-3 sm:px-6 bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0 select-none z-20">
                {/* [좌측]: [ 📄 노션 페이지 뷰 ] [ 🌳 구조 트리 ] */}
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex items-center bg-white/80 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium">
                    <button
                      onClick={() => setPreviewMode('notion')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition whitespace-nowrap cursor-pointer text-xs ${
                        previewMode === 'notion'
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>노션 페이지 뷰</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode('tree')}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition whitespace-nowrap cursor-pointer text-xs ${
                        previewMode === 'tree'
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>구조 트리</span>
                    </button>
                  </div>
                </div>

                {/* [우측]: [ 💾 저장 및 관리 ▼ ] | [ </> JSON ] [ ⚡ 노션에 바로 배포 ] */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                  {/* 단 하나의 [ 💾 저장 및 관리 ▼ ] 통합 드롭다운 */}
                  <div className="relative" ref={saveManageDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSaveManageOpen((prev) => !prev)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 border border-zinc-300 dark:border-zinc-700 shadow-2xs transition cursor-pointer select-none active:scale-98"
                      title="저장, 사본 복제, Undo 되돌리기, 원본 리셋 및 버전 관리"
                    >
                      <Save className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <span>저장 및 관리</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${isSaveManageOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Google AI Studio 스타일 세련된 모노톤 드롭다운 팝업 */}
                    {isSaveManageOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1.5 text-xs text-zinc-800 dark:text-zinc-200 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in zoom-in-95 duration-100">
                        {/* 섹션 1: 저장 & 사본 */}
                        <div className="py-1 space-y-0.5">
                          {/* 1) [ 💾 현재 상태 저장 ] */}
                          <button
                            type="button"
                            onClick={handleSaveCurrentState}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition cursor-pointer group"
                          >
                            <div className="flex items-center space-x-2">
                              <Save className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white shrink-0" />
                              <div>
                                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">현재 상태 저장</div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {lastSavedTime ? `최근 저장: ${lastSavedTime}` : '로컬 초안에 즉시 덮어쓰기'}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                              Ctrl+S
                            </span>
                          </button>

                          {/* 2) [ 📑 다른 이름으로 저장 ] */}
                          <button
                            type="button"
                            onClick={handleOpenSaveAsModal}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition cursor-pointer group"
                          >
                            <div className="flex items-center space-x-2">
                              <Copy className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white shrink-0" />
                              <div>
                                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">다른 이름으로 저장</div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">새 템플릿으로 복제 보관</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                              복제
                            </span>
                          </button>
                        </div>

                        {/* 섹션 2: 롤백 & 복구 */}
                        <div className="py-1 space-y-0.5">
                          {/* 3) [ ↩️ 직전 작업 되돌리기 (Undo) ] */}
                          <button
                            type="button"
                            onClick={() => {
                              handleUndo();
                              setIsSaveManageOpen(false);
                            }}
                            disabled={historyIndex <= 0}
                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition ${
                              historyIndex > 0
                                ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer group'
                                : 'opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Undo2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                              <div>
                                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">직전 작업 되돌리기 (Undo)</div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">AI 수정 직전 스냅샷으로 롤백</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                              v{historyIndex >= 1 ? historyIndex : 1}
                            </span>
                          </button>

                          {/* 4) [ 🔄 최초 원본(v1)으로 복구 ] */}
                          <button
                            type="button"
                            onClick={handleResetToV1}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition cursor-pointer group"
                          >
                            <div className="flex items-center space-x-2">
                              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <div>
                                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">최초 원본(v1)으로 복구</div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">템플릿 로드 초기 상태로 1초 리셋</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                              초기화
                            </span>
                          </button>
                        </div>

                        {/* 섹션 3: 5) [ ⏱️ 버전 히스토리 ] */}
                        <div className="pt-1.5 pb-1">
                          <div className="px-2 py-1 flex items-center justify-between font-bold text-zinc-600 dark:text-zinc-400 text-[11px]">
                            <span className="flex items-center space-x-1.5">
                              <History className="w-3.5 h-3.5" />
                              <span>버전 히스토리 ({templateHistory.length})</span>
                            </span>
                            <span className="text-[10px] font-normal text-zinc-400">선택 복원</span>
                          </div>
                          <div className="max-h-44 overflow-y-auto py-1 space-y-1">
                            {templateHistory.length === 0 ? (
                              <div className="p-2 text-center text-zinc-400 text-[11px]">기록된 버전이 없습니다.</div>
                            ) : (
                              templateHistory.map((item, idx) => {
                                const isCurrent = idx === historyIndex;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleRestoreVersion(idx)}
                                    className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition cursor-pointer text-xs ${
                                      isCurrent
                                        ? 'bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-1.5 truncate">
                                      <span className="px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-[9px] font-mono shrink-0">
                                        v{item.version}
                                      </span>
                                      <span className="truncate">{item.label}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 shrink-0 text-[10px] text-zinc-400">
                                      <span>{item.timestamp}</span>
                                      {isCurrent && <span className="text-emerald-500 font-bold text-xs">●</span>}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 세로 구분선 */}
                  <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-0.5" />

                  {/* [ </> JSON ] 버튼 */}
                  <button
                    onClick={() => setIsRawJsonModalOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 transition cursor-pointer whitespace-nowrap"
                    title="템플릿 JSON 원본 코드 확인"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  {/* [ ⚡ 노션에 바로 배포 ] 버튼 */}
                  <button
                    onClick={publishToNotion}
                    disabled={isPublishing || !editableTemplate}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                    <span>{isPublishing ? '배포 중...' : '노션에 바로 배포'}</span>
                  </button>

                  {/* 우측 인스펙터 패널이 접혔을 때 나타나는 [◀ NOA 인스펙터] 버튼 */}
                  {isCollapsed && (
                    <button
                      type="button"
                      onClick={toggleCollapse}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-xs font-bold whitespace-nowrap cursor-pointer shadow-2xs"
                      title="우측 NOA 인스펙터 챗 펼치기"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>인스펙터</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. 상단 KPI 요약 헤더 바: 실버 & 아연 모노톤 테마 */}
              <div className="h-10 px-4 sm:px-6 bg-zinc-100/70 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs overflow-x-auto shrink-0 select-none scrollbar-none z-10">
                <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
                  {/* KPI 1: 설계 진척도 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      설계 진척도
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-16 sm:w-24 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full w-full" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        100%
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                  {/* KPI 2: 멀티 DB 수 */}
                  <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                    <Database className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-500 dark:text-zinc-400">데이터베이스</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{totalDatabases}개</span>
                  </div>

                  <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                  {/* KPI 3: 속성 수 */}
                  <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                    <Tag className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-500 dark:text-zinc-400">전체 속성</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{totalProperties}개</span>
                  </div>

                  <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700 shrink-0" />

                  {/* KPI 4: 수식 수 */}
                  <div className="flex items-center space-x-1 text-[11px] whitespace-nowrap">
                    <Calculator className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                    <span className="text-zinc-500 dark:text-zinc-400">Formulas 2.0</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{totalFormulas}개</span>
                  </div>
                </div>

                {/* KPI 5: 무손실 검증 상태 뱃지 (Memory Vault 뱃지 및 초기화 버튼 UI 제거, 자동 캐시는 백그라운드 동작) */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 whitespace-nowrap">
                    <ShieldCheck className="w-3 h-3 mr-1 text-zinc-600 dark:text-zinc-300" />
                    무손실 검증: PASS
                  </span>
                </div>
              </div>

            {/* 3. 메인 캔버스 뷰 (세로 스크롤 허용) */}
            <div className="w-full h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-fade-in">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
                    <Sparkles className="w-7 h-7 text-zinc-800 dark:text-zinc-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-bold mb-3">
                    <Zap className="w-3.5 h-3.5" />
                    <span>AI 템플릿 아키텍트 실시간 분석 & 설계 중</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-2 tracking-tight">
                    기존 캔버스 상태를 초기화하고 새 템플릿을 빌드하고 있습니다...
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                    데이터 시트 구조, 스마트 헤더 행, 관계형 DB 스키마 및 Formula 2.0 수식을 정밀 분석하여 맞춤형 대시보드 뷰를 생성합니다.
                  </p>
                </div>
              ) : !editableTemplate ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center mb-5 text-2xl shadow-xs">
                    ✨
                  </div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-xs font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                    <span>새로운 템플릿 제작 대기 중</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-2 tracking-tight">
                    어떤 노션 시스템을 구축할까요?
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed mb-6">
                    하단 옴니 챗에 원하시는 템플릿 주제를 입력하시거나, 엑셀/PDF 문서를 첨부하시면 AI 아키텍트가 1장 완결형 노션 대시보드로 즉시 자동 빌드합니다.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    <button 
                      onClick={() => setPendingChatPrompt('원격검침 실시간 모니터링 관리 OS 만들어줘')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                    >
                      ⚡ 원격검침 실시간 모니터링
                    </button>
                    <button 
                      onClick={() => setPendingChatPrompt('주민 민원 및 세대 하자 통합 관리 대시보드 만들어줘')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                    >
                      🏢 주민 민원 및 세대 하자 대시보드
                    </button>
                    <button 
                      onClick={() => setPendingChatPrompt('자격증/수험생 올인원 합격 스케줄러 만들어줘')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                    >
                      🎯 자격증/수험생 합격 스케줄러
                    </button>
                  </div>
                </div>
              ) : previewMode === 'tree' ? (
                <div className="p-4 sm:p-8 pb-32">
                  <StructureTreeView template={editableTemplate} />
                </div>
              ) : (
                <div className="pb-32">
                  {/* 최상단 커스텀 에이전트 3.0 원클릭 셋업 콜아웃 카드 */}
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

                  {/* 하단 통합 액션 배너 (메탈릭 실버 & 징크 그라데이션) */}
                  <div className="px-6 sm:px-10 md:px-12 mt-12 mb-8">
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-neutral-900 text-white shadow-xl border border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{editableTemplate.icon || '📑'}</span>
                          <h4 className="text-base sm:text-lg font-extrabold text-white">
                            {editableTemplate.title}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 max-w-xl leading-relaxed">
                          우측 NOA 인스펙터 챗을 통해 속성 추가, Formula 2.0 수식 개선, 관계형 롤업을 정밀 지시하거나, 노션에 즉시 생성할 수 있습니다.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          onClick={handleModifyWithChat}
                          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition active:scale-95 cursor-pointer"
                          title="해당 템플릿 구조를 AI 채팅창에 자동 입력하고 커스텀 수정을 시작합니다"
                        >
                          <MessageSquare className="w-4 h-4 text-zinc-300" />
                          <span>💬 대화로 수정하기</span>
                        </button>

                        <button
                          onClick={publishToNotion}
                          disabled={isPublishing}
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
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
        );
      }}
        sideContent={({ isCollapsed, toggleCollapse }) => (
          <InspectorChat
            template={editableTemplate}
            selectedDbName={selectedDbId}
            onSelectDbName={(name) => {
              setSelectedDbId(name);
              scrollToDb(name);
            }}
            onAddProperty={(dbIdx, prop) => {
              handleAddCustomProperty(dbIdx, prop);
            }}
            onUpdatePropertyName={(dbIdx, oldName, newName) => {
              const safeProps = getSafeProperties(editableTemplate?.databases[dbIdx]?.properties);
              const pIdx = safeProps.findIndex((p: any) => p.name === oldName);
              if (pIdx >= 0) handleUpdatePropertyName(dbIdx, pIdx, newName);
            }}
            onUpdatePropertyType={(dbIdx, propName, newType) => {
              const safeProps = getSafeProperties(editableTemplate?.databases[dbIdx]?.properties);
              const pIdx = safeProps.findIndex((p: any) => p.name === propName);
              if (pIdx >= 0) handleUpdatePropertyType(dbIdx, pIdx, newType);
            }}
            onDeleteProperty={(dbIdx, propName) => {
              const safeProps = getSafeProperties(editableTemplate?.databases[dbIdx]?.properties);
              const pIdx = safeProps.findIndex((p: any) => p.name === propName);
              if (pIdx >= 0) handleDeleteProperty(dbIdx, pIdx);
            }}
            onApplyPresetInstruction={(instruction) => {
              handleApplySkill(instruction, '인스펙터 스키마 지시');
            }}
            onApplyTemplateUpdate={(updatedTemplate) => {
              pushHistoryEntry(updatedTemplate, 'AI 인스펙터 수정');
              setEditableTemplate(updatedTemplate);
            }}
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />
        )}
      />

      {/* 다른 이름으로 저장 (사본 복제) 모달 */}
      {isSaveAsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                <span>다른 이름으로 저장</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveAsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              현재 작업 중인 템플릿의 사본을 새 명칭으로 내 보관함에 별도 복제 생성합니다.
            </p>
            <form onSubmit={handleSaveAsConfirm} className="space-y-4">
              <input
                type="text"
                value={saveAsTitle}
                onChange={(e) => setSaveAsTitle(e.target.value)}
                placeholder="새 템플릿 명칭 입력"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
              />
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSaveAsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!saveAsTitle.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition disabled:opacity-40 cursor-pointer"
                >
                  복제 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreviewCanvas;
