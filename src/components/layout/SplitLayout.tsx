import React from 'react';
import { useApp } from '../../context/AppContext';
import { ChatContainer } from '../chat/ChatContainer';
import { NotionMockup } from '../preview/NotionMockup';

export const SplitLayout: React.FC = () => {
  const { activeMobileTab, setActiveMobileTab } = useApp();

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Mobile Only: Chat vs Preview Segment Switcher */}
      <div className="md:hidden flex items-center justify-center py-2 px-3 bg-neutral-100/90 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700/80 shrink-0">
        <div className="grid grid-cols-2 w-full max-w-xs bg-white dark:bg-neutral-900 p-1 rounded-xl shadow-xs border border-neutral-200/80 dark:border-neutral-700/80">
          <button
            onClick={() => setActiveMobileTab('chat')}
            className={`py-1.5 text-xs font-bold rounded-lg transition active:scale-95 whitespace-nowrap cursor-pointer ${
              activeMobileTab === 'chat'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            💬 AI 대화 & 요청
          </button>
          <button
            onClick={() => setActiveMobileTab('preview')}
            className={`py-1.5 text-xs font-bold rounded-lg transition active:scale-95 whitespace-nowrap cursor-pointer ${
              activeMobileTab === 'preview'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            📑 템플릿 미리보기
          </button>
        </div>
      </div>

      {/* PC: Left 2-Split (AI Chat) / Mobile: Tab Dependent */}
      <div
        className={`w-full md:w-[42%] lg:w-[38%] h-full flex-shrink-0 transition-all duration-300 ${
          activeMobileTab === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="w-full h-full">
          <ChatContainer />
        </div>
      </div>

      {/* PC: Right 2-Split (Notion Mockup Preview) / Mobile: Tab Dependent */}
      <div
        className={`w-full md:w-[58%] lg:w-[62%] h-full flex-1 overflow-hidden transition-all duration-300 ${
          activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="w-full h-full">
          <NotionMockup />
        </div>
      </div>

    </div>
  );
};
