import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Leaf,
  FileText,
  Palette,
  Clock, 
  Settings, 
  Bot,
  ChevronDown,
  Crown,
  ExternalLink
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
    createdNotionResource,
    setIsNotionSettingsModalOpen,
    apiKey,
    showToast
  } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const isConfigured = Boolean(notionApiKey && notionParentPageId && apiKey);

  // 노션 통합 허브 바로가기 URL
  const targetNotionUrl = createdNotionResource?.pageUrl || (
    notionParentPageId 
      ? `https://notion.so/${notionParentPageId.replace(/-/g, '')}` 
      : null
  );

  const handleOpenMasterHub = () => {
    if (targetNotionUrl) {
      window.open(targetNotionUrl, '_blank');
      showToast('👑 내 노션 통합 허브 마스터 워크스페이스로 이동합니다!', 'success');
    } else {
      setIsNotionSettingsModalOpen(true);
      showToast('노션 연동 설정이 필요합니다. 토큰과 부모 페이지 ID를 등록해 주세요.', 'info');
    }
  };

  const modelLabels: Record<GeminiModelType, { label: string; short: string }> = {
    'auto': { label: '⚡ Auto (스마트 라우팅: 기본 권장)', short: '⚡ Auto' },
    'gemini-3.8-flash': { label: '🚀 Gemini 3.8 Flash (초고속 / 일상 처리)', short: '🚀 3.8 Flash' },
    'gemini-3.1-pro': { label: '🧠 Gemini 3.1 Pro (심층 추론 / 복합 템플릿 설계)', short: '🧠 3.1 Pro' },
    'gemini-3.6-flash': { label: 'Gemini 3.6 Flash (표준 추천)', short: '3.6 Flash' },
    'gemini-2.0-flash': { label: 'Gemini 2.0 Flash (레거시)', short: '2.0 Flash' },
    'gemini-1.5-flash': { label: 'Gemini 1.5 Flash (레거시)', short: '1.5 Flash' },
    'gemini-1.5-pro': { label: 'Gemini 1.5 Pro (고성능)', short: '1.5 Pro' }
  };

  const handleDailyRoutine = () => {
    setCurrentView('life');
    const omniInput = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (omniInput) {
      omniInput.value = '오늘 데일리 루틴 및 핵심 일정을 한눈에 브리핑해 줘';
      omniInput.focus();
      omniInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    showToast('⏰ 오늘의 데일리 루틴과 라이프 비서 스케줄이 준비되었습니다.', 'info');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md border-b border-neutral-200/90 dark:border-notion-dark-border transition-colors select-none">
        <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 h-full flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap overflow-x-auto no-scrollbar">
          
          {/* [좌측]: Notion Architect 심플 로고 (클릭 시 홈 대시보드로 이동) */}
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={() => setCurrentView('home')}
              className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-bold text-base shadow-xs hover:scale-105 transition cursor-pointer shrink-0"
              title="홈 대시보드로 이동"
            >
              <span>N</span>
            </button>
            <div 
              className="flex items-center space-x-1.5 cursor-pointer shrink-0"
              onClick={() => setCurrentView('home')}
            >
              <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
                Notion Architect
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                AI Studio
              </span>
            </div>
          </div>

          {/* [중앙]: [🏗️ 템플릿 마스터 | 🌱 라이프 Hub | 📄 오피스 스튜디오 | 🎨 AI 미디어 랩] 4대 메인 탭 */}
          <div className="flex items-center bg-neutral-100/90 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 shrink-0 gap-0.5 sm:gap-1">
            {/* 1. 🏗️ 템플릿 마스터 */}
            <button
              onClick={() => setCurrentView('builder')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'builder'
                  ? 'bg-white dark:bg-notion-dark-card text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="템플릿 마스터"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">🏗️ 템플릿 마스터</span>
            </button>

            {/* 2. 🌱 라이프 Hub (기존 잘못된 중복 루틴 명칭을 라이프 Hub로 정정) */}
            <button
              onClick={() => setCurrentView('life')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'life'
                  ? 'bg-white dark:bg-notion-dark-card text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="라이프 Hub & 루틴 관리"
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="whitespace-nowrap">🌱 라이프 Hub</span>
            </button>

            {/* 3. 📄 오피스 스튜디오 */}
            <button
              onClick={() => setCurrentView('devlab')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'devlab'
                  ? 'bg-white dark:bg-notion-dark-card text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="오피스 스튜디오"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="whitespace-nowrap">📄 오피스 스튜디오</span>
            </button>

            {/* 4. 🎨 AI 미디어 랩 */}
            <button
              onClick={() => setCurrentView('media_lab')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'media_lab'
                  ? 'bg-white dark:bg-notion-dark-card text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="AI 미디어 랩"
            >
              <Palette className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="whitespace-nowrap">🎨 AI 미디어 랩</span>
            </button>
          </div>

          {/* [우측]: [👑 통합 허브] + [⏰ 루틴 브리핑], Gemini 모델 셀렉터, [⚙️ 설정] 버튼, 프로필 아바타 */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 whitespace-nowrap pr-1">
            {/* 👑 통합 허브 (사용자 요청: 루틴 브리핑 옆으로 이동) */}
            <button
              onClick={handleOpenMasterHub}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-xs active:scale-95 shrink-0"
              title="내 노션 통합 허브 워크스페이스 새 탭 열기"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">👑 통합 허브</span>
              <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
            </button>

            {/* 데일리 루틴 퀵 버튼 */}
            <button
              onClick={handleDailyRoutine}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold transition whitespace-nowrap shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="오늘의 데일리 루틴 브리핑"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="whitespace-nowrap">⏰ 루틴 브리핑</span>
            </button>
            
            {/* 1. Gemini 모델 셀렉터 */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsModelDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/90 text-neutral-700 dark:text-neutral-200 text-xs font-medium transition whitespace-nowrap cursor-pointer"
                title="Google Gemini AI 모델 변경"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden lg:inline font-semibold">{modelLabels[selectedModel]?.label || 'Gemini 1.5'}</span>
                <span className="lg:hidden font-semibold">{modelLabels[selectedModel]?.short || '1.5'}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {isModelDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsModelDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-notion-dark-card rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-1.5 z-50 animate-fadeIn">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Gemini 모델 선택
                    </div>
                    {(['auto', 'gemini-3.8-flash', 'gemini-3.1-pro', 'gemini-3.6-flash', 'gemini-2.0-flash'] as GeminiModelType[]).map((m) => (
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

            {/* 2. [⚙️ 설정] 버튼 */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition whitespace-nowrap shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="설정 및 외부 연동 관리 열기"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300 shrink-0" />
              <span className="hidden sm:inline">설정</span>
              
              {/* 연동 완료 상태 인디케이터 */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            </button>

            {/* 3. 프로필 아바타 (오른쪽 잘림 방지를 위해 shrink-0 및 여백 보장) */}
            {authUser && (
              <div className="pl-0.5 sm:pl-1 shrink-0 flex items-center">
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
