import React, { useState } from 'react';
import {
  Inbox,
  Bookmark,
  FileText,
  Receipt,
  StickyNote,
  ExternalLink,
  Plus,
  Trash2,
  FolderGit2,
  Search,
  Sparkles
} from 'lucide-react';
import type { ResourceInboxItem, ResourceType, ResourceStatus, ProjectItem } from '../../types/lifeHub';

interface ResourcesInboxMasterViewProps {
  resources: ResourceInboxItem[];
  projects: ProjectItem[];
  onToggleStatus: (resourceId: string) => void;
  onAddResource: (resource: {
    title: string;
    type: ResourceType;
    sourceUrl?: string;
    summary: string;
    status: ResourceStatus;
    projectId?: string;
    tags?: string[];
  }) => void;
  onDeleteResource: (resourceId: string) => void;
  isCompact?: boolean;
}

export const ResourcesInboxMasterView: React.FC<ResourcesInboxMasterViewProps> = ({
  resources,
  projects,
  onToggleStatus,
  onAddResource,
  onDeleteResource,
  isCompact = false
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | '인박스' | '처리완료'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1초 퀵 인라인 메모 인풋 상태
  const [quickMemoText, setQuickMemoText] = useState('');

  // 신규 모달 상태
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ResourceType>('빠른메모');
  const [newUrl, setNewUrl] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newStatus, setNewStatus] = useState<ResourceStatus>('인박스');
  const [newProjectId, setNewProjectId] = useState<string>('');

  const filteredResources = resources.filter(r => {
    if (filterType !== 'ALL' && r.type !== filterType) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
    }
    return true;
  });

  const handleQuickMemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMemoText.trim()) return;
    onAddResource({
      title: quickMemoText.trim(),
      type: '빠른메모',
      summary: '1초 퀵 캡처로 등록된 인박스 메모',
      status: '인박스'
    });
    setQuickMemoText('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddResource({
      title: newTitle.trim(),
      type: newType,
      sourceUrl: newUrl.trim() || undefined,
      summary: newSummary.trim() || '요약 내용 없음',
      status: newStatus,
      projectId: newProjectId ? newProjectId : undefined
    });
    setNewTitle('');
    setNewUrl('');
    setNewSummary('');
    setIsAddModalOpen(false);
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case '빠른메모':
        return <StickyNote className="w-3.5 h-3.5 text-amber-500" />;
      case '북마크':
        return <Bookmark className="w-3.5 h-3.5 text-blue-500" />;
      case '문서':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case '영수증':
        return <Receipt className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const getTypeBadgeColor = (type: ResourceType) => {
    switch (type) {
      case '빠른메모':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      case '북마크':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      case '문서':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      case '영수증':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60';
    }
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const found = projects.find(p => p.id === projectId);
    return found ? found.title : null;
  };

  return (
    <div className={`flex flex-col h-full ${isCompact ? 'space-y-3' : 'space-y-4'}`}>
      {/* 헤더 및 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Resources & Inbox DB (지식 창고 & 스와이프 파일)
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                {resources.length}건
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              1초 퀵 메모 · 웹 북마크 · 원문 URL · 프로젝트 양방향 연결
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 유형 필터 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/60 text-xs">
            {(['ALL', '빠른메모', '북마크', '문서', '영수증'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-1.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterType === type
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type === 'ALL' ? '전체' : type}
              </button>
            ))}
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-neutral-800 border border-slate-200/70 dark:border-neutral-700/60 text-xs">
            {(['ALL', '인박스', '처리완료'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  filterStatus === status
                    ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'ALL' ? '모두' : status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>신규 리소스</span>
          </button>
        </div>
      </div>

      {/* 검색 & 1초 퀵 메모 바 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목 또는 내용 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <form onSubmit={handleQuickMemoSubmit} className="flex items-center space-x-2 p-1 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 flex-1">
          <div className="pl-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <input
            type="text"
            value={quickMemoText}
            onChange={(e) => setQuickMemoText(e.target.value)}
            placeholder="1초 퀵 메모 (Enter 즉시 인박스 저장)..."
            className="flex-1 px-2 py-1 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!quickMemoText.trim()}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-40 cursor-pointer"
          >
            저장
          </button>
        </form>
      </div>


      {/* 리소스 목록 그리드 */}
      {filteredResources.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 text-slate-400">
          <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">등록된 리소스 또는 메모가 없습니다.</p>
        </div>
      ) : (
        <div className={`grid gap-3.5 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {filteredResources.map(res => {
            const projectName = getProjectName(res.projectId);

            return (
              <div
                key={res.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border bg-white dark:bg-neutral-900/80 border-slate-200/90 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-neutral-700 transition-all duration-200 shadow-xs"
              >
                <div>
                  {/* 상단 메타: 유형, 처리상태, 삭제 */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeBadgeColor(res.type)}`}>
                        {getTypeIcon(res.type)}
                        <span>{res.type}</span>
                      </span>

                      {/* 처리상태 토글 버튼 */}
                      <button
                        onClick={() => onToggleStatus(res.id)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                          res.status === '처리완료'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                        }`}
                        title="클릭하여 상태 변경"
                      >
                        {res.status === '처리완료' ? '✅ 처리완료' : '📥 인박스'}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm(`'${res.title}' 리소스를 삭제하시겠습니까?`)) {
                          onDeleteResource(res.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 제목 */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                    {res.title}
                  </h4>

                  {/* 요약 내용 */}
                  <p className="text-[11px] text-slate-600 dark:text-neutral-400 line-clamp-2 mb-2.5">
                    {res.summary}
                  </p>
                </div>

                {/* 하단 메타: 원문URL & 소속 프로젝트 */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-neutral-800 text-[10px]">
                  {res.sourceUrl && (
                    <a
                      href={res.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline truncate max-w-full"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{res.sourceUrl}</span>
                    </a>
                  )}

                  {projectName && (
                    <div className="flex items-center space-x-1 text-slate-500 dark:text-neutral-400">
                      <FolderGit2 className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="font-semibold text-purple-700 dark:text-purple-300 truncate">
                        관련 프로젝트: {projectName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 신규 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-purple-500" />
              <span>신규 리소스 / 지식 창고 등록</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  제목 (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 2026 AI 에이전트 프롬프트 패턴집"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    유형 (Type)
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="빠른메모">빠른메모</option>
                    <option value="북마크">북마크</option>
                    <option value="문서">문서</option>
                    <option value="영수증">영수증</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    처리 상태 (Status)
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ResourceStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="인박스">인박스</option>
                    <option value="처리완료">처리완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  원문 URL (선택)
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  요약 내용 (Text) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="핵심 인사이트 또는 보관 이유를 작성하세요."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  관련 프로젝트 (Projects DB 관계형 연결)
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- 관련 프로젝트 선택 (선택 안 함) --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.area})</option>
                  ))}
                </select>
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
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-xs cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
