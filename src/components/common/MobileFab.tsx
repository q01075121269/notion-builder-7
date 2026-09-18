import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileFab: React.FC = () => {
  const { currentView, setCurrentView, setActiveMobileTab } = useApp();

  // 대시보드 화면일 때만 모바일 우측 하단에 고정 표시
  if (currentView !== 'dashboard') return null;

  const handleClick = () => {
    setCurrentView('builder');
    setActiveMobileTab('chat');
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden animate-bounce-short">
      <button
        onClick={handleClick}
        className="flex items-center space-x-2 px-4 py-3 rounded-full bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-900 font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all border border-neutral-700/20 dark:border-white/40"
      >
        <Plus className="w-4 h-4 text-amber-400 dark:text-amber-600" />
        <span>새 템플릿 만들기</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-500" />
      </button>
    </div>
  );
};
