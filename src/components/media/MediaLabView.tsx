import React, { useState, useEffect } from 'react';
import { Palette, Image, HardDrive, Trash2, Sparkles, RefreshCw, Upload } from 'lucide-react';
import { getRecentMediaItems, deleteMediaItem, saveMediaItem } from '../../lib/mediaStorage';
import type { MediaItem } from '../../lib/mediaStorage';

export const MediaLabView: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const items = await getRecentMediaItems(20);
      setMediaList(items);
    } catch (err) {
      console.error('IndexedDB 미디어 로드 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteMediaItem(id);
      setMediaList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('미디어 삭제 실패:', err);
    }
  };

  // 샘플 테스트 파일 추가 (IndexedDB 동작 테스트용)
  const handleAddSample = async () => {
    try {
      const sampleItem = await saveMediaItem({
        type: 'IMAGE',
        dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        prompt: 'AI 아키텍처 비주얼 컨셉 아트 샘플',
      });
      setMediaList((prev) => [sampleItem, ...prev]);
    } catch (err) {
      console.error('샘플 미디어 추가 실패:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg p-4 sm:p-6 select-none">
      {/* 4번째 탭 빈 미디어 랩 메인 컨테이너 (Slate-50 배경, Slate-200 보더) */}
      <div className="max-w-6xl mx-auto w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* 헤더 섹션 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-neutral-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white whitespace-nowrap">
                  🎨 AI 미디어 랩
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                  제4챕터 미디어 스튜디오
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 whitespace-nowrap">
                1계층 대용량 IndexedDB 캐시 저장소 기반 AI 이미지·비디오·오디오 에셋 제작실
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={loadMedia}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shadow-xs"
              title="캐시 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
            <button
              onClick={handleAddSample}
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>샘플 캐시 생성</span>
            </button>
          </div>
        </div>

        {/* 1계층 IndexedDB 정보 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/80 flex items-center space-x-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">저장소 인프라</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white whitespace-nowrap">IndexedDB (1계층 캐시)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/80 flex items-center space-x-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">캐시된 에셋 수</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white whitespace-nowrap">{mediaList.length}개 에셋 보관 중</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/80 flex items-center space-x-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">새로고침 무결성</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">영구 로컬 캐싱 보장</span>
            </div>
          </div>
        </div>

        {/* 미디어 에셋 갤러리 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <span>🖼️ 최근 작업 미디어 캐시</span>
            <span className="text-xs text-slate-400 font-normal">(최대 20개 자동 유지)</span>
          </h3>

          {mediaList.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl text-center space-y-2 bg-white/40 dark:bg-neutral-800/40">
              <Palette className="w-10 h-10 mx-auto text-slate-300 dark:text-neutral-600 animate-pulse" />
              <p className="text-xs font-bold text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                저장된 미디어 에셋이 없습니다.
              </p>
              <p className="text-[11px] text-slate-400 whitespace-nowrap">
                AI 이미지/비디오 생성 명령을 옴니 챗에 보내거나 상단 [샘플 캐시 생성] 버튼을 누르세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition"
                >
                  <div className="aspect-video w-full bg-slate-100 dark:bg-neutral-900 relative overflow-hidden">
                    <img
                      src={item.dataUrl}
                      alt={item.prompt || '미디어'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur">
                      {item.type}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition hover:bg-rose-600"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-neutral-200 line-clamp-2">
                      {item.prompt || '생성된 미디어 에셋'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(item.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
