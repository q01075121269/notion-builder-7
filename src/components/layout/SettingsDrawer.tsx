import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Settings, 
  Key, 
  BookOpen, 
  Calendar, 
  Moon, 
  Sun, 
  RotateCcw, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Bot,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { GeminiModelType } from '../../types/chat';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    authUser,
    logout,
    isDark,
    toggleDarkMode,
    selectedModel,
    setSelectedModel,
    apiKey,
    setIsApiKeyModalOpen,
    notionApiKey,
    notionParentPageId,
    setIsNotionSettingsModalOpen,
    setIsGoogleSyncModalOpen,
    setIsGuideModalOpen,
    resetToDefault,
    showToast,
    isBuildingMasterWorkspace,
    buildMasterWorkspace
  } = useApp();

  if (!isOpen) return null;

  const isNotionConnected = Boolean(notionApiKey && notionParentPageId);

  const handleReset = () => {
    if (confirm('현재 템플릿과 대화 내역을 초기 기본 상태로 리셋하시겠습니까?')) {
      resetToDefault();
      showToast('기본 템플릿 상태로 초기화되었습니다.', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-notion-dark-card border-l border-neutral-200 dark:border-notion-dark-border shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Top Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                  설정 및 워크스페이스 관리
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Notion Architect 시스템 설정 및 외부 API 연동
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              aria-label="서랍 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            
            {/* User Profile Card */}
            {authUser && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center space-x-3">
                <img
                  src={authUser.picture}
                  alt={authUser.name}
                  className="w-11 h-11 rounded-full border border-neutral-300 dark:border-neutral-700 object-cover shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                      {authUser.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                      {authUser.role === 'admin' ? '관리자 승인' : '일반 사용자'}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 truncate mt-0.5">
                    {authUser.email}
                  </span>
                </div>
              </div>
            )}

            {/* Section 1: 핵심 연동 관리 */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                핵심 워크스페이스 연동
              </span>

              {/* 1. Notion Workspace Connection */}
              <button
                onClick={() => {
                  setIsNotionSettingsModalOpen(true);
                  onClose();
                }}
                className="w-full group p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-600 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                    N
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                      <span>노션 워크스페이스 연동 관리</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {isNotionConnected 
                        ? 'Internal Integration Secret 연동 완료' 
                        : '토큰 및 부모 페이지 ID 등록 필요'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isNotionConnected ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      연동됨
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      연결 필요
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* 1-1. Notion Master Workspace One-Click Auto Builder */}
              <div className="p-3.5 rounded-2xl border border-teal-200/70 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">👑</span>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center space-x-1">
                        <span>노션 마스터 허브 원클릭 구축</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-600 text-white">추천</span>
                      </h4>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        라이프 허브·템플릿 보관함·개발 랩 3대 DB 원스톱 자동 생성
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await buildMasterWorkspace();
                  }}
                  disabled={!isNotionConnected || isBuildingMasterWorkspace}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#1A2B4C] hover:bg-[#121e35] dark:bg-teal-600 dark:hover:bg-teal-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  {isBuildingMasterWorkspace ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                      <span>3대 마스터 DB 자동 구축 중...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ 노션 마스터 허브 3대 DB 원클릭 구축</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. Gemini API Key Registration */}
              <button
                onClick={() => {
                  setIsApiKeyModalOpen(true);
                  onClose();
                }}
                className="w-full group p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-600 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Gemini AI API 키 등록
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {apiKey ? 'API 키 등록 완료 (안전 보관됨)' : 'Google AI Studio API Key 필요'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {apiKey ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      등록됨
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      미등록
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* 3. Google Calendar Sync */}
              <button
                onClick={() => {
                  setIsGoogleSyncModalOpen(true);
                  onClose();
                }}
                className="w-full group p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-600 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Google 캘린더 동기화 설정
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      노션 DB 날짜 속성과 Google Calendar 양방향 동기화
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Section 2: 친절 가이드 및 설명서 */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                도움말 & 지원
              </span>

              <button
                onClick={() => {
                  setIsGuideModalOpen(true);
                  onClose();
                }}
                className="w-full group p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/70 dark:border-amber-900/50 hover:border-amber-400 transition flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      쉬운 사용 설명서 (초보자 맞춤형)
                    </div>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      템플릿 제작부터 노션 배포까지 단계별 친절 안내
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </button>
            </div>

            {/* Section 3: 환경 설정 & 시스템 관리 */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                환경 설정
              </span>

              {/* Theme Mode Toggle */}
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                    {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">화면 테마</span>
                    <p className="text-[11px] text-neutral-400">
                      {isDark ? '다크 모드 활성화됨' : '라이트 모드 활성화됨'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 transition cursor-pointer"
                >
                  {isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
                </button>
              </div>

              {/* AI Model Selector */}
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">기본 AI 모델</span>
                    <p className="text-[11px] text-neutral-400">생성 속도 및 추론 심도 설정</p>
                  </div>
                </div>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as GeminiModelType)}
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value="gemini-3.6-flash">3.6 Flash (공식 최신/권장)</option>
                  <option value="gemini-3.8-flash">3.8 Flash (최신)</option>
                  <option value="gemini-2.0-flash">2.0 Flash (레거시)</option>
                  <option value="gemini-1.5-flash">1.5 Flash (레거시)</option>
                  <option value="gemini-1.5-pro">1.5 Pro (고성능/정밀)</option>
                </select>
              </div>

              {/* Reset to Default */}
              <button
                onClick={handleReset}
                className="w-full p-3 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 text-rose-600 dark:text-rose-400 flex items-center space-x-3 transition cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <div className="text-xs font-bold">기본 템플릿으로 리셋</div>
                  <p className="text-[11px] text-rose-500/80 dark:text-rose-400/80">
                    현재 설계 중인 템플릿과 대화 기록 초기화
                  </p>
                </div>
              </button>
            </div>

          </div>

          {/* Drawer Footer: Logout */}
          <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">
              Notion Architect v4.5
            </span>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
