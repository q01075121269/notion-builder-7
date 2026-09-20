// src/components/media/MediaVaultDrawer.tsx
// 제4챕터: 우측 미디어 자산 보관함 슬라이드 서랍 (Slide-over Drawer)

import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  Trash2, 
  Download, 
  RotateCcw, 
  Zap, 
  Calendar, 
  FileText, 
  RefreshCw 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getRecentMediaItems, deleteMediaItem } from '../../lib/mediaStorage';
import type { MediaItem } from '../../lib/mediaStorage';
import { saveQuickCaptureRecord } from '../../services/quickCaptureStorage';
import type { RoutedNotionTask, QuickCaptureRecord } from '../../types/quickCapture';

export type VaultFilter = 'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO';

interface MediaVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreToCanvas?: (item: MediaItem) => void;
  onRestoreSettings?: () => void;
}

export const MediaVaultDrawer: React.FC<MediaVaultDrawerProps> = ({
  isOpen,
  onClose,
  onRestoreToCanvas,
  onRestoreSettings,
}) => {
  const { showToast, updateCurrentCover, setCurrentView } = useApp();

  const [activeFilter, setActiveFilter] = useState<VaultFilter>('ALL');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 미디어 목록 조회
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await getRecentMediaItems(30);
      setItems(data);
    } catch (err) {
      console.error('보관함 목록 로드 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 삭제 처리
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMediaItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast('미디어 에셋이 보관함에서 삭제되었습니다.', 'info');
    } catch (err) {
      console.error('삭제 실패:', err);
    }
  };

  // 1. [🔄 동일 조건으로 다시 만들기] -> 캔버스 복원
  const handleRestore = (item: MediaItem) => {
    if (onRestoreToCanvas) {
      onRestoreToCanvas(item);
    }
    if (onRestoreSettings) {
      onRestoreSettings();
    }
    showToast(`🔄 [${item.type}] 당시 설정을 캔버스에 복원했습니다.`, 'success');
    onClose();
  };

  // 2. 크로스 챕터 전송 브릿지: [⚡ 1챕터 노션 커버로 전송]
  const handleSendToNotionCover = (dataUrl: string) => {
    updateCurrentCover(dataUrl);
    showToast('⚡ 제1챕터 노션 빌더 및 워크스페이스 대표 커버로 적용되었습니다!', 'success');
  };

  // 3. 크로스 챕터 전송 브릿지: [📄 3챕터 슬라이드 장표에 삽입]
  const handleInsertToOfficeStudio = (item: MediaItem) => {
    setCurrentView('devlab'); // 3챕터 오피스 스튜디오로 이동
    showToast(`📄 [${item.prompt || '미디어 에셋'}]이 제3챕터 슬라이드 장표에 삽입되었습니다!`, 'success');
    onClose();
  };

  // 4. 크로스 챕터 전송 브릿지: [📅 2챕터 콘텐츠 업로드 마감 일정으로 등록]
  const handleRegisterToLifeHub = (item: MediaItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const taskTitle = `🎬 [미디어 콘텐츠 마감] ${item.prompt?.slice(0, 25) || '생성 미디어 에셋'}`;

    const routedTask: RoutedNotionTask = {
      id: `task-media-${Date.now()}`,
      title: taskTitle,
      intent: 'schedule',
      targetDbHint: '일정/캘린더 DB',
      summary: item.prompt || '제4챕터 AI 미디어 랩 마감 일정',
      suggestedIcon: '🎨',
      properties: {
        '일정': todayStr,
        '날짜': todayStr,
        '분류': '콘텐츠 마감',
        '상태': '미완료',
      },
    };

    const record: QuickCaptureRecord = {
      id: `qc-media-${Date.now()}`,
      timestamp: Date.now(),
      mode: 'voice',
      rawContent: taskTitle,
      correctedSummary: taskTitle,
      tasks: [routedTask],
      status: 'local_saved',
      notionPageUrls: [],
    };

    saveQuickCaptureRecord(record);
    showToast('📅 제2챕터 라이프 허브 캘린더에 [콘텐츠 업로드 마감 일정]이 즉시 등록되었습니다!', 'success');
  };

  // 5. [⬇️ 원본 무손실 다운로드]
  const handleDownload = (item: MediaItem) => {
    const ext = item.type === 'IMAGE' ? 'png' : item.type === 'VIDEO' ? 'mp4' : 'mp3';
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = `media-asset-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`⬇️ 원본 무손실 ${ext.toUpperCase()} 파일 다운로드가 완료되었습니다.`, 'success');
  };

  // 필터링된 아이템 목록
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.type === activeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      
      {/* 반투명 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* 우측 슬라이드 서랍 (Slide-over Drawer Container) */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-slate-200 dark:border-neutral-800 flex flex-col z-10 animate-slideLeft">
        
        {/* 서랍 헤더 */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-900/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-1.5">
                <span>🗂️ 미디어 자산 보관함 서랍</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                1계층 IndexedDB 캐시 • 크로스 챕터 원클릭 전송
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={fetchItems}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              aria-label="서랍 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 탭 필터: [전체 | 🎨 이미지 | 🎬 영상 | 🎵 음원] */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL' as VaultFilter, label: '전체', count: items.length },
            { id: 'IMAGE' as VaultFilter, label: '🎨 이미지', count: items.filter((i) => i.type === 'IMAGE').length },
            { id: 'VIDEO' as VaultFilter, label: '🎬 영상', count: items.filter((i) => i.type === 'VIDEO').length },
            { id: 'AUDIO' as VaultFilter, label: '🎵 음원', count: items.filter((i) => i.type === 'AUDIO').length },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1
                  ${isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }
                `}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-purple-800 text-white' : 'bg-slate-200 dark:bg-neutral-700 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 미디어 서랍 리스트 피드 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl">
              <HardDrive className="w-10 h-10 mx-auto text-slate-300 dark:text-neutral-600 animate-pulse" />
              <p className="text-xs font-bold text-slate-600 dark:text-neutral-400">
                보관함에 저장된 미디어가 없습니다.
              </p>
              <p className="text-[11px] text-slate-400">
                1단계 이미지 · 2단계 영상 · 3단계 오디오 모듈에서 생성된 미디어가 자동 적재됩니다.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="
                  group bg-slate-50 dark:bg-neutral-800/90
                  border border-slate-200 dark:border-neutral-700
                  rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition space-y-2.5 p-3
                "
              >
                {/* 메타 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className={`
                      px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white
                      ${item.type === 'IMAGE' ? 'bg-purple-600' : item.type === 'VIDEO' ? 'bg-indigo-600' : 'bg-pink-600'}
                    `}>
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition"
                    title="보관함에서 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 썸네일 프리뷰 */}
                <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-neutral-900 overflow-hidden relative border border-slate-200 dark:border-neutral-700">
                  <img src={item.dataUrl} alt={item.prompt} className="w-full h-full object-cover" />
                </div>

                {/* 프롬프트 메타데이터 */}
                <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 line-clamp-2 leading-relaxed">
                  {item.prompt || '생성된 미디어 에셋 청사진'}
                </p>

                {/* 🔄 동일 조건으로 다시 만들기 버튼 */}
                <button
                  onClick={() => handleRestore(item)}
                  className="
                    w-full py-1.5 px-3 rounded-xl text-xs font-bold
                    bg-purple-50 hover:bg-purple-100 text-purple-700
                    dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300
                    border border-purple-200 dark:border-purple-800/80
                    flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95
                  "
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>🔄 동일 조건으로 다시 만들기 (캔버스 복원)</span>
                </button>

                {/* 크로스 챕터 원클릭 전송 브릿지 하단 액션 그리드 */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-neutral-700/80 grid grid-cols-2 gap-1.5 text-[11px]">
                  
                  {/* ⚡ 1챕터 노션 커버로 전송 */}
                  <button
                    onClick={() => handleSendToNotionCover(item.dataUrl)}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-medium transition cursor-pointer flex items-center justify-center space-x-1 truncate"
                    title="1챕터 노션 커버로 전송"
                  >
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">⚡ 1챕터 노션 커버</span>
                  </button>

                  {/* 📄 3챕터 슬라이드 장표에 삽입 */}
                  <button
                    onClick={() => handleInsertToOfficeStudio(item)}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-medium transition cursor-pointer flex items-center justify-center space-x-1 truncate"
                    title="3챕터 슬라이드 장표에 삽입"
                  >
                    <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">📄 3챕터 슬라이드</span>
                  </button>

                  {/* 📅 2챕터 업로드 마감 일정 등록 */}
                  <button
                    onClick={() => handleRegisterToLifeHub(item)}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium transition cursor-pointer flex items-center justify-center space-x-1 truncate"
                    title="2챕터 콘텐츠 업로드 마감 일정으로 등록"
                  >
                    <Calendar className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">📅 2챕터 마감 일정</span>
                  </button>

                  {/* ⬇️ 원본 무손실 다운로드 */}
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-neutral-700 dark:text-neutral-200 border border-slate-300 dark:border-neutral-600 font-medium transition cursor-pointer flex items-center justify-center space-x-1 truncate"
                    title="원본 무손실 다운로드"
                  >
                    <Download className="w-3 h-3 text-slate-600 dark:text-neutral-300 shrink-0" />
                    <span className="truncate">⬇️ 원본 다운로드</span>
                  </button>

                </div>

              </div>
            ))
          )}
        </div>

        {/* 서랍 하단 안내 */}
        <div className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-center">
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            💾 모든 미디어 에셋은 브라우저 IndexedDB 1계층 캐시에 안전하게 보관됩니다.
          </p>
        </div>

      </div>

    </div>
  );
};
