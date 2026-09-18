import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ShieldCheck, Lock, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { getAdminEmails } from '../../services/authStorage';
import type { AuthUser } from '../../types/auth';

interface LoginViewProps {
  onLogin?: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { login } = useApp();
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const doLogin = (user: AuthUser) => {
    if (onLogin) {
      onLogin(user);
    } else {
      login(user);
    }
  };

  const adminList = getAdminEmails();
  const defaultAdmin = adminList[0] || 'admin@gmail.com';

  const handleAdminQuickLogin = () => {
    doLogin({
      id: 'admin-google-01',
      email: defaultAdmin,
      name: '시스템 관리자',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      role: 'admin',
      loginAt: Date.now()
    });
  };

  const handleGuestQuickLogin = () => {
    doLogin({
      id: 'guest-google-02',
      email: 'unauthorized_guest@gmail.com',
      name: '일반 방문자',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      role: 'user',
      loginAt: Date.now()
    });
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    doLogin({
      id: `google-user-${Date.now()}`,
      email: customEmail.trim(),
      name: customEmail.split('@')[0],
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      role: 'user', // 내부에서 화이트리스트 자동 판별
      loginAt: Date.now()
    });
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-neutral-50 via-white to-neutral-100 dark:from-notion-dark-bg dark:via-neutral-900 dark:to-neutral-950 text-notion-light-text dark:text-notion-dark-text font-sans select-none">
      
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-amber-400/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/90 dark:bg-notion-dark-card/90 backdrop-blur-xl border border-neutral-200/90 dark:border-notion-dark-border rounded-3xl shadow-2xl p-8 space-y-7 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
            <span>N</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
                Notion Architect
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Private</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Google OAuth 기반 비공개 AI 워크스페이스
            </p>
          </div>
        </div>

        {/* Security Notice Box */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start space-x-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-neutral-600 dark:text-neutral-300 space-y-0.5">
            <span className="font-bold text-neutral-900 dark:text-white block">
              보안 인증 게이트 (Auth Gate)
            </span>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              본 서비스는 미인가 사용자의 Gemini API 크레딧 소모를 방지하기 위해 <strong>화이트리스트에 등록된 구글 관리자 계정</strong>만 접근을 허용합니다.
            </p>
          </div>
        </div>

        {/* Primary OAuth Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleAdminQuickLogin}
            className="w-full py-3 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-3 group"
          >
            {/* Google SVG Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google 계정으로 계속하기 (관리자 로그인)</span>
          </button>
        </div>

        {/* Test / Alternate Logins (화이트리스트 차단 검증 및 사용자 정의) */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-[11px] text-neutral-400">
            <Lock className="w-3 h-3" />
            <span>인가 테스트 및 계정 전환 옵션</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAdminQuickLogin}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center space-x-1"
              title={`관리자(${defaultAdmin})로 로그인`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>관리자 권한 진입</span>
            </button>

            <button
              onClick={handleGuestQuickLogin}
              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[11px] font-semibold border border-rose-200 dark:border-rose-800 transition flex items-center justify-center space-x-1"
              title="비인가 계정 로그인 시도하여 차단 화면 검증"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>비인가 차단 테스트</span>
            </button>
          </div>

          {/* Custom Email Input Accordion */}
          {!isCustomMode ? (
            <button
              onClick={() => setIsCustomMode(true)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline"
            >
              직접 구글 이메일 입력하여 로그인하기
            </button>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-2 pt-2 text-left animate-fadeIn">
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="google-email@gmail.com"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none font-mono"
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-600"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold flex items-center space-x-1"
                >
                  <span>로그인</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-neutral-400 space-y-1">
          <div>등록된 관리자 이메일 목록:</div>
          <div className="font-mono text-neutral-500 dark:text-neutral-400">
            {adminList.join(', ')}
          </div>
        </div>

      </div>
    </div>
  );
};
