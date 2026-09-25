import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getSafeProperties } from '../../lib/templateUtils';
import { Top50ShowcaseCarousel } from './Top50ShowcaseCarousel';
import { SmartControlBar, type ArchiveViewMode, type SortOption } from './SmartControlBar';
import { InteractiveCardGridView } from './InteractiveCardGridView';
import { CompactListView } from './CompactListView';
import { FolderCollectionView } from './FolderCollectionView';
import { FolderCreationModal } from './FolderCreationModal';
import { FolderDetailModal } from './FolderDetailModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { ArchivedTemplate, TemplateFolder } from '../../types/dashboard';
import type { Top50TemplateItem } from '../../services/top50Templates';
import { 
  getArchivedTemplates, 
  deleteArchivedTemplate, 
  saveArchivedTemplate,
  clearChatSlopTemplates,
  resetArchiveToDefault,
  getTemplateFolders,
  deleteTemplateFolder,
  moveTemplateToFolder,
  createFolderWithTemplates
} from '../../services/archiveStorage';
import { createNotionTemplateInWorkspace } from '../../services/notionApi';
import { 
  Sparkles, 
  Layers, 
  BookmarkCheck,
  Eye,
  X,
  ExternalLink,
  Link as LinkIcon,
  Wand2,
  Star,
  Database
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    currentTemplate,
    setCurrentTemplate, 
    setCurrentView, 
    setActiveMobileTab,
    setIsViewingCurationHub,
    createdNotionResource,
    notionApiKey,
    notionParentPageId,
    setIsNotionSettingsModalOpen,
    showToast
  } = useApp();

  // 1. 상태 관리 (템플릿 및 폴더 스토리지)
  const [templates, setTemplates] = useState<ArchivedTemplate[]>(() => {
    try {
      return getArchivedTemplates() || [];
    } catch {
      return [];
    }
  });

  const [folders, setFolders] = useState<TemplateFolder[]>(() => {
    try {
      return getTemplateFolders() || [];
    } catch {
      return [];
    }
  });

  // 2. 컨트롤 바 및 탭 필터 상태 (검색, 카테고리, 출처필터, 정렬, 3대 뷰)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'created' | 'curated'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ArchiveViewMode>('card');

  // 3. 미리보기 모달 상태
  const [previewModalTemplate, setPreviewModalTemplate] = useState<ArchivedTemplate | null>(null);

  // 4. 모달 상태 (폴더 생성, 폴더 상세)
  const [isFolderCreateModalOpen, setIsFolderCreateModalOpen] = useState(false);
  const [folderMergeData, setFolderMergeData] = useState<{ sourceId: string; targetId: string } | null>(null);
  const [activeFolderModal, setActiveFolderModal] = useState<TemplateFolder | null>(null);

  // 5. TOP 50 쇼케이스 즉시 배포 로딩 상태
  const [importingTop50Id, setImportingTop50Id] = useState<string | null>(null);

  const refreshData = () => {
    try {
      setTemplates(getArchivedTemplates() || []);
      setFolders(getTemplateFolders() || []);
    } catch (e) {
      console.error('Failed to refresh templates:', e);
    }
  };

  // 노션 저장소 워크스페이스 타깃 URL
  const targetNotionUrl = createdNotionResource?.pageUrl || (
    notionParentPageId 
      ? `https://notion.so/${notionParentPageId.replace(/-/g, '')}` 
      : 'https://notion.so'
  );

  const createdCount = useMemo(() => templates.filter(t => t.source === 'created').length, [templates]);
  const curatedCount = useMemo(() => templates.filter(t => t.source !== 'created').length, [templates]);

  // 검색, 카테고리, 출처 필터링 + 정렬 메모이제이션
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // 출처 필터 (내가 생성함 vs 추천 큐레이션)
    if (sourceFilter === 'created') {
      result = result.filter(t => t.source === 'created');
    } else if (sourceFilter === 'curated') {
      result = result.filter(t => t.source !== 'created');
    }

    // 카테고리 필터
    if (selectedCategory !== '전체') {
      result = result.filter(tpl => {
        if (!tpl.tags || tpl.tags.length === 0) return false;
        return tpl.tags.some(t => t.includes(selectedCategory.replace('#', '')));
      });
    }

    // 검색어 필터 (제목, 설명, 태그)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(tpl => 
        tpl.title?.toLowerCase().includes(q) ||
        tpl.description?.toLowerCase().includes(q) ||
        tpl.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // 정렬
    if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'));
    }

    return result;
  }, [templates, sourceFilter, selectedCategory, searchQuery, sortBy]);

  // 핸들러: 빌더로 가져가서 편집
  const handleSelectEdit = (tpl: ArchivedTemplate) => {
    setCurrentTemplate(tpl.templateData);
    setIsViewingCurationHub(false);
    setCurrentView('builder');
    setActiveMobileTab('preview');
    showToast(`"${tpl.title}" 템플릿을 빌더로 불러왔습니다.`, 'info');
  };

  // 핸들러: 템플릿 삭제
  const handleDeleteTemplate = (id: string) => {
    deleteArchivedTemplate(id);
    refreshData();
    showToast('템플릿이 보관함에서 삭제되었습니다.', 'info');
  };

  // 핸들러: 노션에 즉시 생성 배포
  const handleInstantDeploy = async (tpl: ArchivedTemplate) => {
    if (!notionApiKey || !notionParentPageId) {
      setIsNotionSettingsModalOpen(true);
      showToast('노션 연동 키 설정이 필요합니다.', 'error');
      return;
    }

    try {
      showToast(`"${tpl.title}" 노션 워크스페이스에 생성 중...`, 'info');
      await createNotionTemplateInWorkspace(
        tpl.templateData,
        notionApiKey,
        notionParentPageId
      );
      showToast(`"${tpl.title}" 노션에 성공적으로 생성되었습니다!`, 'success');
    } catch (e: any) {
      showToast(`노션 생성 실패: ${e?.message || '알 수 없는 오류'}`, 'error');
    }
  };

  // 핸들러: TOP 50 쇼케이스에서 원클릭 노션 가져오기 ⚡
  const handleInstantImportFromTop50 = async (tplItem: Top50TemplateItem) => {
    setImportingTop50Id(tplItem.id);

    // 1. 내 보관함에 아카이빙 영구 저장 (source: 'curated')
    const newArchived: ArchivedTemplate = {
      id: `arch-top50-${Date.now()}`,
      title: tplItem.title,
      description: tplItem.description,
      icon: tplItem.icon,
      cover_url: tplItem.cover_url,
      tags: [tplItem.tag, '#월간베스트'],
      templateData: tplItem.templateData,
      source: 'curated',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveArchivedTemplate(newArchived);
    refreshData();

    // 2. 노션 API 키가 연동되어 있으면 실제 워크스페이스에도 즉시 자동 생성
    if (notionApiKey && notionParentPageId) {
      try {
        await createNotionTemplateInWorkspace(
          tplItem.templateData,
          notionApiKey,
          notionParentPageId
        );
        showToast(`"${tplItem.title}" 템플릿이 내 노션 및 보관함에 성공적으로 복제되었습니다! ⚡`, 'success');
      } catch (err: any) {
        showToast(`보관함에 저장 완료되었습니다. (노션 전송 오류: ${err?.message})`, 'info');
      }
    } else {
      showToast(`"${tplItem.title}" 템플릿이 내 보관함에 저장되었습니다. 우측 상단에서 노션 키를 연결해 바로 생성할 수 있습니다.`, 'success');
    }

    setImportingTop50Id(null);
  };

  // 핸들러: TOP 50 카드 클릭 시 빌더로 로드
  const handleSelectTop50Template = (tplItem: Top50TemplateItem) => {
    setCurrentTemplate(tplItem.templateData);
    setIsViewingCurationHub(false);
    setCurrentView('builder');
    setActiveMobileTab('preview');
    showToast(`"${tplItem.title}" 템플릿이 빌더에 로드되었습니다.`, 'info');
  };

  // 핸들러: 현재 작업물 보관함에 저장 (기존 ID 또는 동일 제목 존재 시 덮어쓰기 Upsert)
  
  // 핸들러: 과거 말버릇 및 중복 템플릿 일괄 정리
  const handleCleanSlopTemplates = () => {
    clearChatSlopTemplates();
    refreshData();
    showToast('과거 음성 말버릇 제목 및 중복 더미 템플릿이 깔끔하게 정리되었습니다! ✨', 'success');
  };

  // 핸들러: 보관함 시드 리셋
  const handleResetArchive = () => {
    if (window.confirm('보관함을 초기 추천 템플릿 상태로 리셋하시겠습니까? (직접 작성한 템플릿이 초기화됩니다)')) {
      resetArchiveToDefault();
      refreshData();
      showToast('보관함이 초기 추천 템플릿으로 리셋되었습니다.', 'info');
    }
  };

  const handleArchiveCurrent = () => {
    if (!currentTemplate) return;
    
    const existingList = getArchivedTemplates();
    const cleanTitle = currentTemplate.title.trim();
    
    // 기존 템플릿 검색 (ID 일치, templateData.id 일치, 또는 동일 제목)
    const existing = existingList.find(t => 
      (currentTemplate.id && t.id === currentTemplate.id) ||
      (currentTemplate.id && t.templateData?.id === currentTemplate.id) ||
      (t.title === cleanTitle && (t.source === 'created' || !t.id.startsWith('arch-tpl-')))
    );

    const targetId = existing ? existing.id : (currentTemplate.id || `arch-${Date.now()}`);
    currentTemplate.id = targetId;

    const targetArchived: ArchivedTemplate = {
      id: targetId,
      title: cleanTitle,
      description: currentTemplate.description || '빌더 작성 템플릿',
      icon: currentTemplate.icon || '📑',
      cover_url: currentTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
      tags: ['#내가만든템플릿', '#맞춤제작', '#에이전트3.0'],
      templateData: {
        ...currentTemplate,
        id: targetId,
        title: cleanTitle
      },
      source: existing?.source || 'created',
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    saveArchivedTemplate(targetArchived);
    refreshData();

    if (existing) {
      showToast(`"${cleanTitle}" 기존 템플릿의 스키마와 데이터가 최신 상태로 덮어쓰기(업데이트)되었습니다!`, 'success');
    } else {
      showToast(`"${cleanTitle}" 템플릿이 내 보관함에 새롭게 저장되었습니다.`, 'success');
    }
  };

  // 핸들러: 스마트폰식 DnD 두 카드 병합 모달 호출
  const handleMergeIntoNewFolder = (sourceTemplateId: string, targetTemplateId: string) => {
    setFolderMergeData({ sourceId: sourceTemplateId, targetId: targetTemplateId });
    setIsFolderCreateModalOpen(true);
  };

  // 핸들러: 기존 폴더에 카드 드롭 삽입
  const handleDropIntoExistingFolder = (sourceTemplateId: string, targetFolderId: string) => {
    moveTemplateToFolder(sourceTemplateId, targetFolderId);
    refreshData();
    const folder = folders.find(f => f.id === targetFolderId);
    showToast(`"${folder?.name || '폴더'}"에 템플릿이 추가되었습니다.`, 'success');
  };

  // 핸들러: 폴더 생성 확인
  const handleConfirmFolderCreate = (folderName: string) => {
    if (!folderMergeData) return;
    createFolderWithTemplates(folderName, [folderMergeData.sourceId, folderMergeData.targetId]);
    setIsFolderCreateModalOpen(false);
    setFolderMergeData(null);
    refreshData();
    showToast(`"${folderName}" 폴더가 생성되었습니다.`, 'success');
  };

  // 핸들러: 폴더에서 카드 꺼내기
  const handleRemoveFromFolder = (templateId: string) => {
    moveTemplateToFolder(templateId, null);
    refreshData();
    showToast('템플릿이 폴더 밖으로 이동되었습니다.', 'info');
  };

  // 핸들러: 폴더 삭제
  const handleDeleteFolder = (folderId: string) => {
    deleteTemplateFolder(folderId);
    refreshData();
    showToast('폴더가 해제되었습니다.', 'info');
  };

  const sourceTpl = templates.find(t => t.id === folderMergeData?.sourceId);
  const targetTpl = templates.find(t => t.id === folderMergeData?.targetId);

  return (
    <ErrorBoundary>
      <div className="h-full w-full overflow-y-auto bg-[var(--bg-base)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 space-y-8 select-none">
        
        {/* ==================================================== */}
        {/* 1. 상단: 내 노션 저장소 워크스페이스 연결 배너 */}
        {/* ==================================================== */}
        <section className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                {currentTemplate?.icon || '📝'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                    현재 빌더 작업 중인 템플릿:
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                    "{currentTemplate?.title || '작업물 없음'}"
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  생성된 템플릿은 보관함 카드에서 [미리보기] 버튼으로 상세 스펙을 열람하거나 내 노션 저장소로 연결할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* 노션 실제 저장소 워크스페이스 바로가기 버튼 */}
              <a
                href={targetNotionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                title="실제 내 노션 저장소(Workspace)로 이동하여 전체 페이지 열람"
              >
                <LinkIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>내 노션 저장소 바로가기</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>

              {/* 현재 작업물 보관함에 저장 버튼 */}
              {currentTemplate && (
                <button
                  onClick={handleArchiveCurrent}
                  className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                  <span>현재 빌더 템플릿 저장</span>
                </button>
              )}

              {/* 말버릇/중복 템플릿 정리 버튼 */}
              <button
                onClick={handleCleanSlopTemplates}
                className="flex-1 md:flex-none px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-200/80 dark:border-neutral-700/80"
                title="과거 음성 말버릇 제목이나 중복 생성된 템플릿을 한 번에 정제합니다"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>말버릇·중복 정리</span>
              </button>

              {/* 보관함 리셋 버튼 */}
              <button
                onClick={handleResetArchive}
                className="flex-1 md:flex-none px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1 transition cursor-pointer border border-slate-200/80 dark:border-neutral-700/80"
                title="보관함을 초기 추천 템플릿 상태로 리셋합니다"
              >
                <span>리셋</span>
              </button>
            </div>
          </div>

          {/* 연동 가이드 미니 바 */}
          <div className="pt-2.5 border-t border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${notionApiKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              <span>
                {notionApiKey ? '🟢 내 노션 API 연동됨 (노션으로 1초 발행 가능)' : '🟡 노션 API 미연동 — 노션으로 직접 발행하려면 계정을 설정하세요.'}
              </span>
            </div>
            {!notionApiKey && (
              <button
                onClick={() => setIsNotionSettingsModalOpen(true)}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                노션 연동 설정하기 ➔
              </button>
            )}
          </div>
        </section>

        {/* ==================================================== */}
        {/* 2. 상단: '월간 베스트 TOP 50 쇼케이스' (가로 탐색 갤러리) */}
        {/* ==================================================== */}
        <section>
          <Top50ShowcaseCarousel
            onSelectTemplate={handleSelectTop50Template}
            onInstantImport={handleInstantImportFromTop50}
            isImportingId={importingTop50Id}
          />
        </section>

        {/* ==================================================== */}
        {/* 3. 중간: 스마트 컨트롤 바 + 출처 구분 탭 필터 */}
        {/* ==================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>내가 보관한 노션 템플릿</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                  {filteredTemplates.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                AI 빌더로 맞춤 설계하거나 TOP 50 쇼케이스에서 가져온 나만의 템플릿 컬렉션입니다.
              </p>
            </div>

            {/* ── 출처 구분 탭 필터 ─────────────────────────────────── */}
            <div className="flex items-center space-x-1.5 bg-neutral-200/70 dark:bg-neutral-800 p-1 rounded-xl">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  sourceFilter === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                전체 ({templates.length})
              </button>
              <button
                onClick={() => setSourceFilter('created')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  sourceFilter === 'created'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Wand2 className="w-3 h-3" />
                <span>내가 생성함 ({createdCount})</span>
              </button>
              <button
                onClick={() => setSourceFilter('curated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  sourceFilter === 'curated'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Star className="w-3 h-3" />
                <span>추천 큐레이션 ({curatedCount})</span>
              </button>
            </div>
          </div>

          <SmartControlBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={filteredTemplates.length}
          />
        </section>

        {/* ==================================================== */}
        {/* 4 & 5. 하단: '내가 만든 템플릿' 3대 뷰 모드 및 스마트 드래그 폴더링 */}
        {/* ==================================================== */}
        <section>
          {filteredTemplates.length === 0 && folders.length === 0 ? (
            /* 정갈한 Empty State */
            <div className="py-16 sm:py-24 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-notion-dark-card/40 max-w-md mx-auto my-6 space-y-4 shadow-2xs animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                <Layers className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sourceFilter === 'created'
                    ? '아직 직접 생성한 템플릿이 없습니다'
                    : sourceFilter === 'curated'
                    ? '보관된 추천 큐레이션 템플릿이 없습니다'
                    : '아직 저장된 템플릿이 없습니다'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  상단의 <strong>월간 베스트 TOP 50 쇼케이스</strong>에서 원하는 템플릿을 바로 가져오거나, 
                  AI 빌더와 대화하여 새 템플릿을 만들어 보세요!
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentView('builder');
                  setActiveMobileTab('chat');
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-neutral-100 shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                <span>새 템플릿 만들기</span>
              </button>
            </div>
          ) : (
            /* 3대 뷰 전환 렌더링 */
            <>
              {viewMode === 'card' && (
                <InteractiveCardGridView
                  templates={filteredTemplates}
                  folders={folders}
                  onSelectEdit={handleSelectEdit}
                  onInstantDeploy={handleInstantDeploy}
                  onDeleteTemplate={handleDeleteTemplate}
                  onOpenFolder={(folder) => setActiveFolderModal(folder)}
                  onMergeIntoNewFolder={handleMergeIntoNewFolder}
                  onDropIntoExistingFolder={handleDropIntoExistingFolder}
                  onPreviewTemplate={(tpl) => setPreviewModalTemplate(tpl)}
                />
              )}

              {viewMode === 'list' && (
                <CompactListView
                  templates={filteredTemplates}
                  onSelectEdit={handleSelectEdit}
                  onInstantDeploy={handleInstantDeploy}
                  onDeleteTemplate={handleDeleteTemplate}
                />
              )}

              {viewMode === 'collection' && (
                <FolderCollectionView
                  folders={folders}
                  templates={filteredTemplates}
                  onOpenFolder={(folder) => setActiveFolderModal(folder)}
                  onSelectEdit={handleSelectEdit}
                  onInstantDeploy={handleInstantDeploy}
                  onDeleteTemplate={handleDeleteTemplate}
                />
              )}
            </>
          )}
        </section>

        {/* ==================================================== */}
        {/* 모달 1: 템플릿 상세 미리보기 모달 (Preview Modal) */}
        {/* ==================================================== */}
        {previewModalTemplate && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-text">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[80vh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-14 md:mb-0">
              {/* Header */}
              <div className="relative h-32 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                <img
                  src={previewModalTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
                  alt={previewModalTemplate.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-4 flex items-center space-x-3">
                  <span className="text-3xl bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-md">
                    {previewModalTemplate.icon || '📑'}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {previewModalTemplate.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        previewModalTemplate.source === 'created'
                          ? 'bg-blue-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}>
                        {previewModalTemplate.source === 'created' ? '🏗️ 내가 생성한 템플릿' : '🌟 추천 큐레이션'}
                      </span>
                      <span className="text-[10px] text-neutral-300">
                        DB {previewModalTemplate.templateData?.databases?.length || 0}개 · 블록 {previewModalTemplate.templateData?.page_layout?.length || 0}개
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scroll Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-white mb-1">💡 템플릿 설명 & 개요</h4>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed bg-slate-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-slate-200 dark:border-neutral-700">
                    {previewModalTemplate.description || '상세 설명이 등록되지 않은 템플릿입니다.'}
                  </p>
                </div>

                {/* Databases Preview */}
                {previewModalTemplate.templateData?.databases && previewModalTemplate.templateData.databases.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                      <Database className="w-4 h-4 text-indigo-500" />
                      <span>포함된 데이터베이스 ({previewModalTemplate.templateData.databases.length}개)</span>
                    </h4>

                    {previewModalTemplate.templateData.databases.map((db, i) => (
                      <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-white dark:bg-neutral-800/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                            📊 {db.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium">
                            {db.view_type || 'table'} 뷰
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 pt-1">
                          {getSafeProperties(db.properties).map((prop, pi) => (
                            <span key={pi} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-600">
                              {prop.name} <span className="text-neutral-400">({prop.type})</span>
                            </span>
                          ))}
                        </div>

                        {db.sample_rows && db.sample_rows.length > 0 && (
                          <div className="mt-2 text-[11px] bg-slate-50 dark:bg-neutral-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-neutral-800">
                            <p className="text-[10px] font-bold text-neutral-500 mb-1">샘플 데이터 예시 ({db.sample_rows.length}개 행):</p>
                            <div className="space-y-1">
                              {db.sample_rows.slice(0, 2).map((row, ri) => (
                                <p key={ri} className="text-neutral-600 dark:text-neutral-400 truncate">
                                  • {Object.values(row).join(' | ')}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Page Layout Preview */}
                {previewModalTemplate.templateData?.page_layout && previewModalTemplate.templateData.page_layout.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span>페이지 내 구성 블록 ({previewModalTemplate.templateData.page_layout.length}개)</span>
                    </h4>
                    <div className="bg-slate-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-slate-200 dark:border-neutral-700 space-y-1.5">
                      {previewModalTemplate.templateData.page_layout.map((block, bi) => (
                        <div key={bi} className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-neutral-700 font-mono">
                            {block.type}
                          </span>
                          <span className="truncate">{(block as any).content || (block as any).title || '내용 블록'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                <a
                  href={previewModalTemplate.notionUrl || targetNotionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>내 노션 저장소에서 열기</span>
                </a>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      handleSelectEdit(previewModalTemplate);
                      setPreviewModalTemplate(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                    <span>빌더 캔버스로 불러와서 수정</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 모달 2: 스마트폰 스타일 드래그 병합 새 폴더 생성 모달 */}
        {/* ==================================================== */}
        <FolderCreationModal
          isOpen={isFolderCreateModalOpen}
          onClose={() => {
            setIsFolderCreateModalOpen(false);
            setFolderMergeData(null);
          }}
          onConfirm={handleConfirmFolderCreate}
          sourceTemplateTitle={sourceTpl?.title || '템플릿 A'}
          targetTemplateTitle={targetTpl?.title || '템플릿 B'}
        />

        {/* ==================================================== */}
        {/* 모달 3: 폴더 상세 열람 및 관리 모달 */}
        {/* ==================================================== */}
        <FolderDetailModal
          folder={activeFolderModal}
          templates={templates.filter(t => t.folderId === activeFolderModal?.id)}
          isOpen={Boolean(activeFolderModal)}
          onClose={() => setActiveFolderModal(null)}
          onSelectEdit={handleSelectEdit}
          onInstantDeploy={handleInstantDeploy}
          onRemoveFromFolder={handleRemoveFromFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      </div>
    </ErrorBoundary>
  );
};
