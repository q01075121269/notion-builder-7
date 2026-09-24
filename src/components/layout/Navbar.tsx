import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Leaf,
  FileText,
  Palette,
  Sun, 
  Settings, 
  Crown,
  ExternalLink
} from 'lucide-react';
import { UserProfileDropdown } from '../auth/UserProfileDropdown';
import { SettingsDrawer } from './SettingsDrawer';
import { ModelSelector } from './ModelSelector';

export const Navbar: React.FC = () => {
  const {
    authUser,
    logout,
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

  const handleDailyRoutine = () => {
    setCurrentView('life');
    window.dispatchEvent(new CustomEvent('open-morning-briefing'));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-morning-briefing'));
    }, 120);
    showToast('☀️ 오늘의 모닝 루틴 브리핑 카드를 불러왔습니다.', 'info');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-14 bg-gradient-to-r from-zinc-100 via-slate-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-850 dark:to-zinc-800 border-b border-zinc-300 dark:border-zinc-700 transition-colors select-none overflow-visible">
        <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 h-full flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap overflow-visible relative z-50">
          
          {/* [좌측]: Notion Architect 심플 로고 (클릭 시 홈 대시보드로 이동) */}
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={() => setCurrentView('home')}
              className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-base shadow-xs hover:scale-105 transition cursor-pointer shrink-0"
              title="홈 대시보드로 이동"
            >
              <span>N</span>
            </button>
            <div 
              className="flex items-center space-x-1.5 cursor-pointer shrink-0"
              onClick={() => setCurrentView('home')}
            >
              <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                Notion Architect
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-nowrap border border-zinc-300 dark:border-zinc-700">
                AI Studio
              </span>
            </div>
          </div>

          {/* [중앙]: [🏗️ 템플릿 마스터 | 🌱 라이프 Hub | 📄 오피스 스튜디오 | 🎨 AI 미디어 랩] 4대 메인 탭 (모노톤 & 메탈릭) */}
          <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-300 dark:border-zinc-700 shrink-0 gap-0.5 sm:gap-1">
            {/* 1. 🏗️ 템플릿 마스터 */}
            <button
              onClick={() => setCurrentView('builder')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'builder'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
              title="템플릿 마스터"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" />
              <span className="whitespace-nowrap">🏗️ 템플릿 마스터</span>
            </button>

            {/* 2. 🌱 라이프 Hub */}
            <button
              onClick={() => setCurrentView('life')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'life'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
              title="라이프 Hub & 루틴 관리"
            >
              <Leaf className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" />
              <span className="whitespace-nowrap">🌱 라이프 Hub</span>
            </button>

            {/* 3. 📄 오피스 스튜디오 */}
            <button
              onClick={() => setCurrentView('devlab')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'devlab'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
              title="오피스 스튜디오"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" />
              <span className="whitespace-nowrap">📄 오피스 스튜디오</span>
            </button>

            {/* 4. 🎨 AI 미디어 랩 */}
            <button
              onClick={() => setCurrentView('media_lab')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                currentView === 'media_lab'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs border border-zinc-300 dark:border-zinc-700'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
              title="AI 미디어 랩"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" />
              <span className="whitespace-nowrap">🎨 AI 미디어 랩</span>
            </button>
          </div>

          {/* [우측]: [👑 통합 허브] + [⏰ 루틴 브리핑], Gemini 모델 셀렉터, [⚙️ 설정] 버튼, 프로필 아바타 */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 whitespace-nowrap pr-1 relative z-50 overflow-visible">
            {/* 👑 통합 허브 */}
            <button
              onClick={handleOpenMasterHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer border border-zinc-700 dark:border-zinc-300 shrink-0 tracking-tight"
              title="내 노션 통합 허브 워크스페이스 새 탭 열기"
            >
              <Crown className="w-3.5 h-3.5 text-zinc-200 dark:text-zinc-700 shrink-0" />
              <span className="whitespace-nowrap">👑 통합 허브</span>
              <ExternalLink className="w-3 h-3 opacity-70 shrink-0 text-zinc-300 dark:text-zinc-600" />
            </button>

            {/* 데일리 루틴 퀵 버튼 */}
            <button
              onClick={handleDailyRoutine}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-bold transition whitespace-nowrap shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="오늘의 데일리 루틴 브리핑"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
              <span className="whitespace-nowrap">☀️ 루틴 브리핑</span>
            </button>
            
            {/* 1. Gemini 2026 모델 셀렉터 (티어 잠금 연동) */}
            <ModelSelector />

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
