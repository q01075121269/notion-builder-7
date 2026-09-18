import React, { useState, useEffect } from 'react';
import { Palette, HardDrive, Trash2, RefreshCw, Film, Wand2, Music, FolderOpen } from 'lucide-react';
import { getRecentMediaItems, deleteMediaItem } from '../../lib/mediaStorage';
import type { MediaItem } from '../../lib/mediaStorage';
import { ImageStudioView } from './ImageStudioView';
import { VideoStudioView } from './VideoStudioView';
import { AudioStudioView } from './AudioStudioView';
import { MediaVaultDrawer } from './MediaVaultDrawer';
import { useApp } from '../../context/AppContext';

export type MediaSubTab = 'IMAGE' | 'VIDEO' | 'AUDIO';

export const MediaLabView: React.FC = () => {
  const { showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<MediaSubTab>('IMAGE');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // 체인 파이프라인 데이터
  const [videoFirstFrame, setVideoFirstFrame] = useState<{ url: string; prompt: string } | null>(null);
  const [audioTargetVideo, setAudioTargetVideo] = useState<{ title: string; duration: number } | null>(null);

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

  // 1단계 이미지 -> 2단계 비디오 체인 전송
  const handleTransferToVideo = (imageDataUrl: string, prompt: string) => {
    setVideoFirstFrame({ url: imageDataUrl, prompt });
    setActiveSubTab('VIDEO');
    showToast('🎬 캔버스 이미지가 제2단계 모션 영상 시작 프레임으로 연결되었습니다!', 'success');
  };

  // 2단계 비디오 -> 3단계 오디오 BGM 체인 전송
  const handleTransferToAudio = (videoData: { title: string; scenesCount: number; totalDuration: number }) => {
    setAudioTargetVideo({ title: videoData.title, duration: videoData.totalDuration });
    setActiveSubTab('AUDIO');
    showToast('🎵 완성된 모션 영상에 맞춤형 BGM을 입히는 3단계 모듈로 연결되었습니다!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg p-4 sm:p-6 select-none relative">
      
      {/* 우측 슬라이드-오버 보관함 서랍 UI */}
      <MediaVaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onRestoreSettings={() => loadMedia()}
      />

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
                1단계 이미지 • 2단계 모션 영상 • 3단계 오디오 BGM 파이프라인
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Sub Tab Switcher */}
            <div className="flex items-center bg-slate-200/70 dark:bg-neutral-800 p-1 rounded-2xl border border-slate-300/60 dark:border-neutral-700/60 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubTab('IMAGE')}
                className={`
                  flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                  ${activeSubTab === 'IMAGE'
                    ? 'bg-white dark:bg-neutral-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-500" />
                <span className="whitespace-nowrap">1. 이미지 스튜디오</span>
              </button>

              <button
                onClick={() => setActiveSubTab('VIDEO')}
                className={`
                  flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                  ${activeSubTab === 'VIDEO'
                    ? 'bg-white dark:bg-neutral-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <Film className="w-3.5 h-3.5 text-indigo-500" />
                <span className="whitespace-nowrap">2. 5초 영상 스튜디오</span>
                {videoFirstFrame && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveSubTab('AUDIO')}
                className={`
                  flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                  ${activeSubTab === 'AUDIO'
                    ? 'bg-white dark:bg-neutral-900 text-pink-700 dark:text-pink-300 shadow-sm'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <Music className="w-3.5 h-3.5 text-pink-500" />
                <span className="whitespace-nowrap">3. BGM & 사운드</span>
                {audioTargetVideo && (
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* 상단 우측 [🗂️ 미디어 보관함] 버튼 */}
            <button
              onClick={() => setIsVaultOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-sm hover:shadow transition cursor-pointer whitespace-nowrap"
            >
              <FolderOpen className="w-4 h-4 text-purple-200" />
              <span>🗂️ 미디어 보관함</span>
            </button>
          </div>

        </div>

        {/* 탭 렌더링 */}
        {activeSubTab === 'IMAGE' ? (
          <ImageStudioView onTransferToVideo={handleTransferToVideo} />
        ) : activeSubTab === 'VIDEO' ? (
          <VideoStudioView
            firstFrame={videoFirstFrame}
            onTransferToAudio={handleTransferToAudio}
          />
        ) : (
          <AudioStudioView
            targetVideo={audioTargetVideo}
            onMasteringComplete={loadMedia}
          />
        )}

        {/* 1계층 IndexedDB 최근 미디어 캐시 보관함 */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span>💾 1계층 IndexedDB 캐시 에셋 보관함 ({mediaList.length})</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsVaultOpen(true)}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                전체 서랍 열기 →
              </button>
              <button
                onClick={loadMedia}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 text-slate-600 dark:text-neutral-300 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>캐시 갱신</span>
              </button>
            </div>
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


