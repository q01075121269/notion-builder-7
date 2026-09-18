import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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
  getTemplateFolders,
  deleteTemplateFolder,
  moveTemplateToFolder,
  createFolderWithTemplates
} from '../../services/archiveStorage';
import { createNotionTemplateInWorkspace } from '../../services/notionApi';
import { 
  Sparkles, 
  Layers, 
  BookmarkCheck
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    currentTemplate,
    setCurrentTemplate, 
    setCurrentView, 
    setActiveMobileTab,
    setIsViewingCurationHub,
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

  // 2. 컨트롤 바 상태 (검색, 필터, 정렬, 3대 뷰)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ArchiveViewMode>('card');

  // 3. 모달 상태 (폴더 생성, 폴더 상세)
  const [isFolderCreateModalOpen, setIsFolderCreateModalOpen] = useState(false);
  const [folderMergeData, setFolderMergeData] = useState<{ sourceId: string; targetId: string } | null>(null);
  const [activeFolderModal, setActiveFolderModal] = useState<TemplateFolder | null>(null);

  // 4. TOP 50 쇼케이스 즉시 배포 로딩 상태
  const [importingTop50Id, setImportingTop50Id] = useState<string | null>(null);

  const refreshData = () => {
    try {
      setTemplates(getArchivedTemplates() || []);
      setFolders(getTemplateFolders() || []);
    } catch (e) {
      console.error('Failed to refresh templates:', e);
    }
  };

  // 검색 및 카테고리 필터링 + 정렬 메모이제이션
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

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
    if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else {
      // 최신순 (newest)
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return result;
  }, [templates, selectedCategory, searchQuery, sortBy]);

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

    // 1. 내 보관함에 아카이빙 영구 저장
    const newArchived: ArchivedTemplate = {
      id: `arch-top50-${Date.now()}`,
      title: tplItem.title,
      description: tplItem.description,
      icon: tplItem.icon,
      cover_url: tplItem.cover_url,
      tags: [tplItem.tag, '#월간베스트'],
      templateData: tplItem.templateData,
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

  // 핸들러: 현재 작업물 보관함에 저장
  const handleArchiveCurrent = () => {
    if (!currentTemplate) return;
    const newArchived: ArchivedTemplate = {
      id: `arch-${Date.now()}`,
      title: currentTemplate.title,
      description: currentTemplate.description || '빌더 작성 템플릿',
      icon: currentTemplate.icon || '📑',
      cover_url: currentTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
      tags: ['#사용자작성', '#맞춤제작'],
      templateData: currentTemplate,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveArchivedTemplate(newArchived);
    refreshData();
    showToast(`"${currentTemplate.title}" 템플릿이 내 보관함에 저장되었습니다.`, 'success');
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
      <div className="h-full w-full overflow-y-auto bg-slate-50/60 dark:bg-notion-dark-bg p-4 sm:p-6 lg:p-8 space-y-8 select-none">
        
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
        {/* 3. 중간: 스마트 컨트롤 바 (검색 + 알약 필터 + 3대 뷰 전환) */}
        {/* ==================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>내가 보관한 노션 템플릿</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                  {templates.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                AI 빌더로 맞춤 설계하거나 TOP 50 쇼케이스에서 가져온 나만의 템플릿 컬렉션입니다.
              </p>
            </div>

            {/* 현재 빌더 작업물 보관 버튼 */}
            {currentTemplate && (
              <button
                onClick={handleArchiveCurrent}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-neutral-200 bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="현재 AI 빌더에서 작업 중인 템플릿을 내 보관함에 추가합니다"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>현재 빌더 템플릿 저장</span>
              </button>
            )}
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
                  아직 저장된 템플릿이 없습니다
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
        {/* 모달 1: 스마트폰 스타일 드래그 병합 새 폴더 생성 모달 */}
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
        {/* 모달 2: 폴더 상세 열람 및 관리 모달 */}
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
