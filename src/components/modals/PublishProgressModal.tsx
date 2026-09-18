import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const PublishProgressModal: React.FC = () => {
  const { 
    isPublishing, 
    publishProgress, 
    publishError, 
    publishToNotion, 
    setIsNotionSettingsModalOpen 
  } = useApp();

  // 에러가 있거나 배포 중일 때만 표시
  if (!isPublishing && !publishError) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-2xl shadow-2xl p-6 text-notion-light-text dark:text-notion-dark-text text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {publishError ? (
          // Error State
          <div className="space-y-4 animate-fadeIn">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                노션 템플릿 생성 실패
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 whitespace-pre-wrap leading-relaxed bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 text-left">
                {publishError}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setIsNotionSettingsModalOpen(true)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                연동 설정 확인
              </button>
              <button
                onClick={publishToNotion}
                className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 transition flex items-center space-x-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 시도</span>
              </button>
            </div>
          </div>
        ) : (
          // Progress State
          <div className="space-y-5 animate-fadeIn">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-neutral-100 dark:border-neutral-800 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                내 노션에 템플릿 생성 중...
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                잠시만 기다려 주세요. 공식 Notion API 규격에 맞춰 구조를 조립하고 있습니다.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-neutral-900 dark:bg-white h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${publishProgress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="truncate max-w-[280px] font-medium text-neutral-700 dark:text-neutral-300">
                  {publishProgress.step}
                </span>
                <span className="font-mono font-semibold">{publishProgress.percent}%</span>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400">
              * 페이지, 데이터베이스, 캘린더 일정 및 콜아웃 블록이 순차적으로 배치됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
