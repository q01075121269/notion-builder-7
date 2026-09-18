import React from 'react';
import type { AuthUser } from '../../types/auth';
import { getAdminEmails } from '../../services/authStorage';

interface UnauthorizedViewProps {
  user: AuthUser;
  onLogout: () => void;
  onSwitchAccount?: () => void;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  user,
  onLogout,
  onSwitchAccount = onLogout,
}) => {
  const adminEmails = getAdminEmails();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-rose-500/30 selection:text-rose-200">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-rose-500/30 rounded-3xl shadow-2xl p-8 sm:p-10 backdrop-blur-xl text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            접근 권한 제한 (Access Denied)
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            관리자 승인이 필요합니다
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            본 서비스는 Gemini API 자원 보호 및 노션 워크스페이스 보안을 위해 
            <strong className="text-slate-200"> 사전에 승인된 관리자 구글 계정(Whitelist)</strong>에 한해 접근이 허용됩니다.
          </p>
        </div>

        {/* Current User Info Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-12 h-12 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{user.name}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                일반 게스트
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
            미승인
          </span>
        </div>

        {/* Whitelist Info Box */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left text-xs text-amber-300/90 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            관리자 등록 및 접근 권한 안내
          </div>
          <p className="text-slate-400 leading-normal">
            관리자 권한을 부여받으려면 시스템 관리자에게 위 구글 이메일(<span className="text-amber-300 font-mono">{user.email}</span>)을 등록 요청하시거나, 등록된 관리자 계정으로 다시 로그인해 주세요.
          </p>
          <div className="pt-1 text-[11px] text-slate-500">
            등록된 관리자 예시: <span className="font-mono text-slate-400">{adminEmails.slice(0, 2).join(', ')}...</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onSwitchAccount}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            다른 계정으로 로그인
          </button>
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃 및 세션 종료
          </button>
        </div>
      </div>
    </div>
  );
};
