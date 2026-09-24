import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { RawJsonModal } from './components/modals/RawJsonModal';
import { ExportModal } from './components/modals/ExportModal';
import { NotionSettingsModal } from './components/modals/NotionSettingsModal';
import { PublishProgressModal } from './components/modals/PublishProgressModal';
import { PublishSuccessModal } from './components/modals/PublishSuccessModal';
import { GoogleSyncModal } from './components/modals/GoogleSyncModal';
import { GuideModal } from './components/guide/GuideModal';
import { LoginView } from './components/auth/LoginView';
import { UnauthorizedView } from './components/auth/UnauthorizedView';
import { QuickCaptureView } from './components/quickCapture/QuickCaptureView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toast } from './components/common/Toast';

import HomePage from './app/page';
import BuilderPage from './app/builder/page';
import LifePage from './app/life/page';
import DevLabPage from './app/devlab/page';
import MediaLabPage from './app/medialab/page';

export const MainApp: React.FC = () => {
  const { 
    currentView,
    authUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    toast,
    hideToast
  } = useApp();

  // 1. 미인증 상태 -> Google OAuth 로그인 화면 (Auth Gate)
  if (!isAuthenticated || !authUser) {
    return <LoginView onLogin={login} />;
  }

  // 2. 인증되었으나 관리자 화이트리스트에 미등록된 계정 -> 차단 및 권한 요청 화면
  if (!isAdmin) {
    return (
      <UnauthorizedView 
        user={authUser} 
        onLogout={logout} 
        onSwitchAccount={logout} 
      />
    );
  }

  // 3. 관리자 권한 인가 완료 -> 정상 빌더 & 대시보드 애플리케이션 진입
  return (
    <ErrorBoundary fallbackTitle="앱 화면 로드 중 예기치 않은 오류가 발생했습니다.">
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-notion-dark-bg text-notion-light-text dark:text-notion-dark-text font-sans">
        <Navbar />
        
        {/* 뷰 모드 분기: 홈 대시보드 vs 템플릿 빌더 vs 라이프 허브 vs 개발 랩 vs AI 미디어 랩 vs 내 보관함 vs 1초 퀵 캡처 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'home' ? (
            <HomePage />
          ) : currentView === 'builder' ? (
            <BuilderPage />
          ) : currentView === 'life' ? (
            <LifePage />
          ) : (currentView === 'devlab' || currentView === 'office') ? (
            <DevLabPage />
          ) : currentView === 'media_lab' ? (
            <MediaLabPage />
          ) : currentView === 'dashboard' ? (
            <DashboardView />
          ) : currentView === 'quick_capture' ? (
            <QuickCaptureView />
          ) : (
            <HomePage />
          )}
        </main>
        
        {/* Global Floating Toast Alerts */}
        <Toast toast={toast} onClose={hideToast} />

        {/* Modals */}
        <ApiKeyModal />
        <NotionSettingsModal />
        <GoogleSyncModal />
        <GuideModal />
        <PublishProgressModal />
        <PublishSuccessModal />
        <RawJsonModal />
        <ExportModal />
      </div>
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="애플리케이션 초기화 중 오류가 발생했습니다.">
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
