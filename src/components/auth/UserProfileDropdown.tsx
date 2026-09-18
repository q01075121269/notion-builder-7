import React, { useState, useRef, useEffect } from 'react';
import type { AuthUser } from '../../types/auth';

interface UserProfileDropdownProps {
  user: AuthUser;
  onLogout: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all text-left group focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        title={`${user.name} (${user.email})`}
      >
        <div className="relative">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-indigo-500/50 ring-2 ring-indigo-500/20"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-indigo-400">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
        </div>

        <div className="hidden md:block text-xs text-left">
          <div className="flex items-center gap-1.5 font-medium text-slate-200 group-hover:text-white truncate max-w-[120px]">
            <span>{user.name}</span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            ADMIN
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl divide-y divide-slate-800/80">
          {/* User Header Info */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center border border-indigo-400">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate" title={user.email}>
                  {user.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    관리자 권한 인가됨
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access details */}
          <div className="px-4 py-2.5 text-[11px] text-slate-400 space-y-1 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span>보안 프로토콜</span>
              <span className="text-slate-300 font-medium">Google OAuth 2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>API 격리 프록시</span>
              <span className="text-emerald-400 font-medium">보호 활성화됨</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>로그아웃 (세션 및 인증정보 파기)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
