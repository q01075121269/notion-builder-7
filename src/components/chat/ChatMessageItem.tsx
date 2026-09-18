import React from 'react';
import type { ChatMessage } from '../../types/chat';
import { useApp } from '../../context/AppContext';
import { Bot, User, Database, ArrowRight, LayoutTemplate } from 'lucide-react';

export const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { setCurrentTemplate, setActiveMobileTab, currentTemplate } = useApp();
  const isUser = message.role === 'user';

  const handleApplyTemplate = () => {
    if (message.templateData) {
      setCurrentTemplate(message.templateData);
      if (window.innerWidth < 768) {
        setActiveMobileTab('preview');
      }
    }
  };

  const isCurrentTemplate = currentTemplate && message.templateData && currentTemplate.title === message.templateData.title;

  return (
    <div className={`flex w-full space-x-3 text-sm animate-fadeIn ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-xs">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Box */}
      <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Attached Files Badges */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {message.attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-2xs"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-4 h-4 rounded object-cover"
                  />
                ) : (
                  <span>
                    {att.category === 'spreadsheet' ? '📗' : 
                     att.category === 'pdf' ? '📕' : 
                     att.category === 'document' ? '📘' : 
                     att.category === 'image' ? '🖼️' : '📎'}
                  </span>
                )}
                <span className="font-medium max-w-[150px] truncate" title={att.name}>
                  {att.name}
                </span>
                <span className="text-[10px] opacity-60">({att.sizeFormatted})</span>
              </div>
            ))}
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tr-xs'
              : 'bg-white dark:bg-notion-dark-card border border-neutral-200/80 dark:border-notion-dark-border text-neutral-800 dark:text-neutral-200 rounded-tl-xs'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center space-x-2 py-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400 pl-2">
                노션 최적화 데이터베이스 및 레이아웃 설계 중...
              </span>
            </div>
          ) : (
            <div>{message.content}</div>
          )}
        </div>

        {/* Generated Template Summary Card */}
        {message.templateData && !message.isLoading && (
          <div className="w-full p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 text-left space-y-2.5 shadow-sm transition hover:shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{message.templateData.icon}</span>
                <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {message.templateData.title}
                </span>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                구조 생성됨
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex items-center space-x-1 px-2 py-0.5 bg-white dark:bg-neutral-700 rounded border border-neutral-200/60 dark:border-neutral-600">
                <Database className="w-3 h-3 text-neutral-400" />
                <span>DB {message.templateData.databases.length}개</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-0.5 bg-white dark:bg-neutral-700 rounded border border-neutral-200/60 dark:border-neutral-600">
                <LayoutTemplate className="w-3 h-3 text-neutral-400" />
                <span>블록 {message.templateData.page_layout.length}개</span>
              </div>
            </div>

            <button
              onClick={handleApplyTemplate}
              className={`w-full flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-medium rounded-lg transition ${
                isCurrentTemplate
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-default'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-xs'
              }`}
            >
              <span>{isCurrentTemplate ? '현재 미리보기 표시 중' : '미리보기에 반영하기'}</span>
              {!isCurrentTemplate && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
