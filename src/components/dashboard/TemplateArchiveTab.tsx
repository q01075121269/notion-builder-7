import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Database, 
  Calendar, 
  BookmarkCheck, 
  Layers,
  Sparkles,
  Filter,
  Wand2,
  Star,
  Eye,
  X,
  Link as LinkIcon
} from 'lucide-react';
import type { ArchivedTemplate } from '../../types/dashboard';

interface TemplateArchiveTabProps {
  templates: ArchivedTemplate[];
  onDelete: (id: string) => void;
  onSelectEdit: (template: ArchivedTemplate) => void;
  onArchiveCurrent: () => void;
}

export const TemplateArchiveTab: React.FC<TemplateArchiveTabProps> = ({
  templates,
  onDelete,
  onSelectEdit,
  onArchiveCurrent
}) => {
  const { 
    currentTemplate, 
    setCurrentView, 
    setActiveMobileTab,
    createdNotionResource,
    notionParentPageId,
    notionApiKey,
    setIsNotionSettingsModalOpen
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'created' | 'curated'>('all');
  const [selectedPreview, setSelectedPreview] = useState<ArchivedTemplate | null>(null);

  const createdCount = templates.filter(t => t.source === 'created').length;
  const curatedCount = templates.filter(t => t.source !== 'created').length;

  const filteredTemplates = templates.filter((t) => {
    if (activeFilter === 'created') return t.source === 'created';
    if (activeFilter === 'curated') return t.source !== 'created';
    return true;
  });

  // 노션 저장소 워크스페이스 URL 구하기
  const targetNotionUrl = createdNotionResource?.pageUrl || (
    notionParentPageId 
      ? `https://notion.so/${notionParentPageId.replace(/-/g, '')}` 
      : 'https://notion.so'
  );

  return (
    <div className="space-y-6">
      {/* ── 1. 상단 워크스페이스 저장소 & 작업 상태 배너 ────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-notion-dark-border bg-gradient-to-r from-slate-50 via-indigo-50/40 to-amber-50/30 dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-800/80 shadow-xs space-y-3">
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
                생성된 템플릿은 언제든지 아래 내 보관함에서 내용 미리보기 및 빌더 재로드가 가능합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* 노션 실제 저장소 워크스페이스 바로가기 버튼 */}
            <a
              href={targetNotionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
              title="실제 내 노션 저장소(Workspace)로 이동하여 전체 페이지 열람"
            >
              <LinkIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>내 노션 저장소 바로가기</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            {/* 현재 작업물 보관함에 저장 버튼 */}
            <button
              onClick={onArchiveCurrent}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
              <span>현재 작업물 보관함에 저장</span>
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
      </div>

      {/* ── 2. 내 보관함 출처 구분 필터 스위처 ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">보관함 필터:</span>
          <div className="flex items-center space-x-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              전체 ({templates.length})
            </button>
            <button
              onClick={() => setActiveFilter('created')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeFilter === 'created'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              <span>내가 생성한 템플릿 ({createdCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('curated')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeFilter === 'curated'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>추천/TOP 큐레이션 ({curatedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. 템플릿 그리드 목록 ────────────────────────────────────────────────── */}
      {!filteredTemplates || filteredTemplates.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-notion-dark-card/50 max-w-md mx-auto my-8 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {activeFilter === 'created'
                ? '아직 직접 생성한 템플릿이 없습니다.'
                : activeFilter === 'curated'
                ? '보관된 추천 큐레이션 템플릿이 없습니다.'
                : '아직 저장된 템플릿이 없습니다.'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              AI 빌더와 대화하여 나만의 자격증/수험생/업무 노션 템플릿을 자동으로 생성해 보세요!
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentView('builder');
              setActiveMobileTab('chat');
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-md transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
            <span>새 템플릿 생성하기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl, idx) => {
            if (!tpl) return null;
            const dbCount = tpl.templateData?.databases?.length || 0;
            const blockCount = tpl.templateData?.page_layout?.length || 0;
            const isCreatedByMe = tpl.source === 'created';
            const hasDateProp = tpl.templateData?.databases?.some(db =>
              db?.properties?.some(p => p?.type === 'date')
            ) || false;

            return (
              <div
                key={tpl.id || `tpl-${idx}`}
                className="group flex flex-col rounded-2xl border border-neutral-200/90 dark:border-notion-dark-border bg-white dark:bg-notion-dark-card overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Card Thumbnail / Cover */}
                <div className="relative h-36 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={tpl.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
                    alt={tpl.title || '템플릿 커버'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  
                  {/* Floating Icon */}
                  <div className="absolute bottom-3 left-4 w-9 h-9 rounded-xl bg-white dark:bg-neutral-900 shadow-md flex items-center justify-center text-xl">
                    <span>{tpl.icon || '📑'}</span>
                  </div>

                  {/* ── 출처 배지 (내가 생성함 vs 추천 큐레이션) ────────────────── */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1">
                    {isCreatedByMe ? (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center space-x-1 shadow-xs">
                        <Wand2 className="w-2.5 h-2.5 text-amber-300" />
                        <span>내가 생성한 템플릿</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center space-x-1 shadow-xs">
                        <Star className="w-2.5 h-2.5 text-yellow-300" />
                        <span>추천 큐레이션</span>
                      </span>
                    )}
                  </div>

                  {/* Calendar Sync Badge if applicable */}
                  {hasDateProp && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center space-x-1 shadow-xs">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>캘린더 싱크</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {tpl.title || '제목 없는 템플릿'}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {tpl.description || '노션 템플릿'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(tpl.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata Stats */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Database className="w-3 h-3" />
                        <span>DB {dbCount}개</span>
                      </span>
                      <span>블록 {blockCount}개</span>
                    </div>
                    <span>{tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString() : ''}</span>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 flex items-center justify-between gap-1.5">
                    {/* 미리보기 (Preview Modal) 버튼 */}
                    <button
                      onClick={() => setSelectedPreview(tpl)}
                      className="py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer border border-indigo-200 dark:border-indigo-800"
                      title="템플릿 구성 내용 및 DB 미리보기"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>미리보기</span>
                    </button>

                    {/* 빌더로 수정 액션 */}
                    <button
                      onClick={() => onSelectEdit(tpl)}
                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
                      title="이 템플릿을 빌더로 불러와서 자연어로 대화 수정"
                    >
                      <Edit3 className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>빌더로 수정</span>
                    </button>

                    {/* 노션 직접 열기 */}
                    <a
                      href={tpl.notionUrl || targetNotionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition flex items-center space-x-1"
                      title="노션 저장소에서 직접 열기"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => {
                        if (confirm(`'${tpl.title || '이'}' 템플릿을 보관함에서 삭제하시겠습니까?`)) {
                          onDelete(tpl.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. 템플릿 미리보기 모달 (Preview Modal) ──────────────────────────────── */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Modal Header */}
            <div className="relative h-32 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
              <img
                src={selectedPreview.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
                alt={selectedPreview.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <button
                onClick={() => setSelectedPreview(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-4 flex items-center space-x-3">
                <span className="text-3xl bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-md">
                  {selectedPreview.icon || '📑'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedPreview.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedPreview.source === 'created'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-600 text-white'
                    }`}>
                      {selectedPreview.source === 'created' ? '🏗️ 내가 생성한 템플릿' : '🌟 추천 큐레이션'}
                    </span>
                    <span className="text-[10px] text-neutral-300">
                      DB {selectedPreview.templateData?.databases?.length || 0}개 · 블록 {selectedPreview.templateData?.page_layout?.length || 0}개
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white mb-1">💡 템플릿 설명 & 개요</h4>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed bg-slate-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-slate-200 dark:border-neutral-700">
                  {selectedPreview.description || '상세 설명이 등록되지 않은 템플릿입니다.'}
                </p>
              </div>

              {/* Databases Preview */}
              {selectedPreview.templateData?.databases && selectedPreview.templateData.databases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-indigo-500" />
                    <span>포함된 데이터베이스 ({selectedPreview.templateData.databases.length}개)</span>
                  </h4>

                  {selectedPreview.templateData.databases.map((db, i) => (
                    <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-white dark:bg-neutral-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                          📊 {db.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium">
                          {db.view_type || 'table'} 뷰
                        </span>
                      </div>
                      
                      {/* Properties tags */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {db.properties?.map((prop, pi) => (
                          <span key={pi} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-600">
                            {prop.name} <span className="text-neutral-400">({prop.type})</span>
                          </span>
                        ))}
                      </div>

                      {/* Sample Rows Preview */}
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

              {/* Page Layout Blocks Preview */}
              {selectedPreview.templateData?.page_layout && selectedPreview.templateData.page_layout.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>페이지 내 구성 블록 ({selectedPreview.templateData.page_layout.length}개)</span>
                  </h4>
                  <div className="bg-slate-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-slate-200 dark:border-neutral-700 space-y-1.5">
                    {selectedPreview.templateData.page_layout.map((block, bi) => (
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

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <a
                href={selectedPreview.notionUrl || targetNotionUrl}
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
                    onSelectEdit(selectedPreview);
                    setSelectedPreview(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                  <span>빌더 캔버스로 불러와서 수정</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
