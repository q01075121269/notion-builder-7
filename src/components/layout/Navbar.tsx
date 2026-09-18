import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home,
  Sparkles, 
  Leaf,
  Terminal,
  Palette,
  Layers, 
  Settings, 
  Bot,
  ChevronDown
} from 'lucide-react';
import { UserProfileDropdown } from '../auth/UserProfileDropdown';
import { SettingsDrawer } from './SettingsDrawer';
import type { GeminiModelType } from '../../types/chat';

export const Navbar: React.FC = () => {
  const {
    authUser,
    logout,
    selectedModel,
    setSelectedModel,
    currentView,
    setCurrentView,
    notionApiKey,
    notionParentPageId,
    apiKey
  } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const isConfigured = Boolean(notionApiKey && notionParentPageId && apiKey);

  const modelLabels: Record<GeminiModelType, { label: string; short: string }> = {
    'gemini-3.6-flash': { label: 'Gemini 3.6 Flash (권장)', short: '3.6 Flash' },
    'gemini-3.8-flash': { label: 'Gemini 3.8 Flash (최신)', short: '3.8 Flash' },
    'gemini-2.0-flash': { label: 'Gemini 2.0 Flash (레거시)', short: '2.0 Flash' },
    'gemini-1.5-flash': { label: 'Gemini 1.5 Flash (레거시)', short: '1.5 Flash' },
    'gemini-1.5-pro': { label: 'Gemini 1.5 Pro (고성능)', short: '1.5 Pro' }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md border-b border-neutral-200/90 dark:border-notion-dark-border transition-colors select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
          
          {/* [좌측]: Notion Architect 심플 로고 */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            <button 
              onClick={() => setCurrentView('builder')}
              className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-bold text-base shadow-sm hover:scale-105 transition cursor-pointer shrink-0"
              title="홈으로 이동"
            >
              <span>N</span>
            </button>
            <div 
              className="flex items-center space-x-1.5 cursor-pointer shrink-0"
              onClick={() => setCurrentView('builder')}
            >
              <span className="font-bold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
                Notion Architect
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                AI Studio
              </span>
            </div>
          </div>

          {/* [중앙]: [1. 🏗️ 템플릿 마스터 | 2. 👔 라이프 비서 | 3. 📄 오피스 스튜디오 | 4. 🎨 AI 미디어 랩] 4대 글로벌 내비게이션 바 */}
          <div className="flex items-center bg-neutral-100/90 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 shrink-0">
            {/* 홈 */}
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center space-x-1 px-2 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'home'
                  ? 'bg-white dark:bg-notion-dark-card text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="메인 홈 대시보드"
            >
              <Home className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
              <span className="whitespace-nowrap">홈</span>
            </button>

            {/* 1. 🏗️ 템플릿 마스터 */}
            <button
              onClick={() => setCurrentView('builder')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'builder'
                  ? 'bg-white dark:bg-notion-dark-card text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="제1챕터: 템플릿 마스터"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">1. 🏗️ 템플릿 마스터</span>
            </button>

            {/* 2. 👔 라이프 비서 */}
            <button
              onClick={() => setCurrentView('life')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'life'
                  ? 'bg-white dark:bg-notion-dark-card text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="제2챕터: 라이프 비서"
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="whitespace-nowrap">2. 👔 라이프 비서</span>
            </button>

            {/* 3. 📄 오피스 스튜디오 */}
            <button
              onClick={() => setCurrentView('devlab')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'devlab'
                  ? 'bg-white dark:bg-notion-dark-card text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="제3챕터: 오피스 스튜디오"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="whitespace-nowrap">3. 📄 오피스 스튜디오</span>
            </button>

            {/* 4. 🎨 AI 미디어 랩 */}
            <button
              onClick={() => setCurrentView('media_lab')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'media_lab'
                  ? 'bg-white dark:bg-notion-dark-card text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="제4챕터: AI 미디어 랩"
            >
              <Palette className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="whitespace-nowrap">4. 🎨 AI 미디어 랩</span>
            </button>
          </div>

          {/* [우측]: 보관함, Gemini 모델 셀렉터, [⚙️ 설정] 버튼, 프로필 아바타 */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 whitespace-nowrap">
            {/* 보관함 숏컷 */}
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                currentView === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
              title="내 보관함"
            >
              <Layers className="w-4 h-4 text-blue-500" />
            </button>
            
            {/* 1. Gemini 모델 셀렉터 (Google AI Studio 스타일의 라운드 드롭다운) */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/90 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition whitespace-nowrap cursor-pointer"
                title="Google Gemini AI 모델 변경"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden md:inline font-semibold">{modelLabels[selectedModel]?.label || 'Gemini 1.5'}</span>
                <span className="md:hidden font-semibold">{modelLabels[selectedModel]?.short || '1.5'}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {isModelDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsModelDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-notion-dark-card rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-1.5 z-50 animate-fadeIn">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Gemini 모델 선택
                    </div>
                    {(['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'] as GeminiModelType[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl transition text-left cursor-pointer ${
                          selectedModel === m
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{modelLabels[m].label}</span>
                        {selectedModel === m && <span className="text-[10px] opacity-80">선택됨</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 2. [⚙️ 설정] 버튼 (서랍형 모달 호출) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition whitespace-nowrap shadow-xs cursor-pointer active:scale-95"
              title="설정 및 외부 연동 관리 열기"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
              <span className="hidden sm:inline">설정</span>
              
              {/* 연동 완료 상태 인디케이터 */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            </button>

            {/* 3. 프로필 아바타 */}
            {authUser && (
              <div className="pl-1 shrink-0">
                <UserProfileDropdown user={authUser} onLogout={logout} />
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Google AI Studio 스타일의 우측 슬라이드 서랍(Drawer) */}
      <SettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
