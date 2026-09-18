import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { PromptSuggestionChips } from './PromptSuggestionChips';

import { RotateCcw } from 'lucide-react';

export const ChatContainer: React.FC = () => {
  const { messages, clearChatHistory, pendingChatPrompt, setPendingChatPrompt } = useApp();
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (pendingChatPrompt) {
      setSelectedPrompt(pendingChatPrompt);
      setPendingChatPrompt('');
    }
  }, [pendingChatPrompt, setPendingChatPrompt]);

  const handleClearHistory = () => {
    if (window.confirm('지금까지의 대화 기록을 모두 비우고 초기 상태로 리셋하시겠습니까?')) {
      clearChatHistory();
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-notion-dark-sidebar/40 border-r border-neutral-200 dark:border-notion-dark-border">
      
      {/* Sub Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200/80 dark:border-notion-dark-border/80 bg-white/60 dark:bg-notion-dark-bg/60 backdrop-blur">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            AI 템플릿 아키텍트 채팅
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
            대화로 노션 구조 빌드
          </span>
          {messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              className="px-2 py-1 rounded-lg text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition flex items-center space-x-1"
              title="대화 기록 비우기 (초기화)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>대화 초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Area: Suggestions + Input */}
      <div className="p-4 bg-white dark:bg-notion-dark-bg border-t border-neutral-200/80 dark:border-notion-dark-border space-y-2">
        <PromptSuggestionChips onSelect={(prompt) => setSelectedPrompt(prompt)} />
        <ChatInput
          inputPrompt={selectedPrompt}
          onClearPrompt={() => setSelectedPrompt('')}
        />
      </div>
    </div>
  );
};
