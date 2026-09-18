import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Key, ExternalLink, Eye, EyeOff, X, Check, ShieldCheck } from 'lucide-react';

export const ApiKeyModal: React.FC = () => {
  const { isApiKeyModalOpen, setIsApiKeyModalOpen, apiKey, setApiKey } = useApp();
  const [inputKey, setInputKey] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isApiKeyModalOpen) return null;

  const handleSave = () => {
    setApiKey(inputKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsApiKeyModalOpen(false);
    }, 800);
  };

  const handleClear = () => {
    setInputKey('');
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-notion-dark-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Gemini API 키 설정</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">AI 템플릿 실시간 생성을 위해 필요합니다</p>
            </div>
          </div>
          <button
            onClick={() => setIsApiKeyModalOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Google AI Studio API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-2.5 p-3 text-xs bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              입력하신 API 키는 서버에 저장되지 않고 오직 사용자의 브라우저 로컬 스토리지(LocalStorage)에만 안전하게 보관됩니다.
            </p>
          </div>

          {/* Guide Link */}
          <div className="pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Google AI Studio에서 무료 API 키 발급받기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-notion-dark-border">
          <button
            onClick={handleClear}
            className="text-xs text-neutral-500 hover:text-red-500 transition"
          >
            키 초기화
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsApiKeyModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-xs font-medium text-white rounded-lg flex items-center space-x-1.5 transition ${
                savedSuccess ? 'bg-emerald-600' : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>저장 완료!</span>
                </>
              ) : (
                <span>저장하기</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
