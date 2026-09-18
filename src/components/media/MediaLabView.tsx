import React, { useState, useEffect } from 'react';
import { Palette, HardDrive, Trash2, RefreshCw, Film, Wand2 } from 'lucide-react';
import { getRecentMediaItems, deleteMediaItem } from '../../lib/mediaStorage';
import type { MediaItem } from '../../lib/mediaStorage';
import { ImageStudioView } from './ImageStudioView';
import { useApp } from '../../context/AppContext';

export type MediaSubTab = 'IMAGE' | 'VIDEO';

export const MediaLabView: React.FC = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<MediaSubTab>('IMAGE');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 체인 파이프라인으로 전달될 비디오 시작 프레임
  const [videoFirstFrame, setVideoFirstFrame] = useState<{ url: string; prompt: string } | null>(null);

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
      showToast('삭제되었습니다.', 'info');
    } catch (err) {
      console.error('미디어 삭제 실패:', err);
    }
  };

  // 이미지 캔버스 -> 비디오 체인 전송 핸들러
  const handleTransferToVideo = (imageDataUrl: string, prompt: string) => {
    setVideoFirstFrame({ url: imageDataUrl, prompt });
    setActiveSubTab('VIDEO');
    showToast('🎬 캔버스 이미지가 제2단계 모션 영상 시작 프레임으로 연결되었습니다!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg p-4 sm:p-6 select-none">
      
      {/* 제4챕터 AI 미디어 랩 메인 컨테이너 (Slate-50 배경, Slate-200 보더) */}
      <div className="max-w-6xl mx-auto w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
        
        {/* 상단 탭 헤더 세그먼트 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-neutral-800 pb-5">
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white whitespace-nowrap">
                  🎨 AI 미디어 랩
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                  제4챕터 미디어 스튜디오
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 whitespace-nowrap">
                스마트 이미지 캔버스 • 모션 영상 체인 파이프라인 • 1계층 IndexedDB 캐시
              </p>
            </div>
          </div>

          {/* Sub Tab Switcher: [🖼️ 1단계 스마트 이미지 스튜디오 | 🎬 2단계 5초 모션 영상] */}
          <div className="flex items-center bg-slate-200/70 dark:bg-neutral-800 p-1 rounded-2xl border border-slate-300/60 dark:border-neutral-700/60 shrink-0">
            <button
              onClick={() => setActiveSubTab('IMAGE')}
              className={`
                flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${activeSubTab === 'IMAGE'
                  ? 'bg-white dark:bg-neutral-900 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <Wand2 className="w-4 h-4 text-purple-500" />
              <span className="whitespace-nowrap">1단계: 스마트 이미지 스튜디오</span>
            </button>

            <button
              onClick={() => setActiveSubTab('VIDEO')}
              className={`
                flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                ${activeSubTab === 'VIDEO'
                  ? 'bg-white dark:bg-neutral-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <Film className="w-4 h-4 text-indigo-500" />
              <span className="whitespace-nowrap">2단계: 5초 모션 영상 모듈</span>
              {videoFirstFrame && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>
          </div>

        </div>

        {/* 탭 렌더링 */}
        {activeSubTab === 'IMAGE' ? (
          <ImageStudioView onTransferToVideo={handleTransferToVideo} />
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-700 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <Film className="w-5 h-5 text-indigo-500" />
                <span>🎬 제2단계: 5초 모션 영상 생성 모듈</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                체인 연동 준비완료
              </span>
            </div>

            {videoFirstFrame ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={videoFirstFrame.url}
                    alt="시작 키프레임"
                    className="w-32 h-20 object-cover rounded-xl border border-indigo-300 dark:border-indigo-700 shadow-sm"
                  />
                  <div className="space-y-1 text-xs">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-600 text-white text-[10px]">
                      First Frame 키프레임 로드됨
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-neutral-200">
                      프롬프트: {videoFirstFrame.prompt || '1단계 스마트 이미지 스튜디오 연동 에셋'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      이미지 캔버스에서 선택한 그래픽이 시네마틱 모션 영상의 0초 시작 프레임으로 전달되었습니다.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-2xl">
                <Film className="w-10 h-10 mx-auto text-slate-300 dark:text-neutral-600 animate-bounce" />
                <p className="text-xs font-bold text-slate-600 dark:text-neutral-400">
                  전달된 시작 키프레임 이미지가 없습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  1단계 스마트 이미지 스튜디오에서 <b>[🎬 이 이미지로 5초 모션 영상 만들기]</b> 버튼을 누르면 시작 이미지가 자동으로 채워집니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 1계층 IndexedDB 최근 미디어 캐시 보관함 */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span>💾 1계층 IndexedDB 캐시 에셋 보관함 ({mediaList.length})</span>
            </h3>
            <button
              onClick={loadMedia}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 text-slate-600 dark:text-neutral-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>캐시 갱신</span>
            </button>
          </div>

          {mediaList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition"
                >
                  <div className="aspect-video w-full bg-slate-100 dark:bg-neutral-900 relative overflow-hidden">
                    <img
                      src={item.dataUrl}
                      alt={item.prompt || '미디어'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition hover:bg-rose-600"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-medium text-slate-700 dark:text-neutral-300 truncate">
                      {item.prompt || '생성 미디어'}
                    </p>
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

