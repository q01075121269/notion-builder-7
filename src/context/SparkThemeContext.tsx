import React, { createContext, useContext, useState } from 'react';

export type SparkTheme = 'silicon-dark' | 'clean-modern' | 'warm-editorial' | 'modern-navy';

export interface SparkThemeClasses {
  id: SparkTheme;
  name: string;
  icon: string;
  // 전체 배경 & 텍스트
  appBg: string;
  appText: string;
  // 패널 (좌측 지식창고, 우측 스튜디오, 상단 바)
  panelBg: string;
  panelBorder: string;
  panelText: string;
  panelSubtext: string;
  panelHover: string;
  // 카드 스타일
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHover: string;
  // 헤더 & 바
  headerBg: string;
  headerBorder: string;
  // 텍스트 계층
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // 액센트 & 하이라이트
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentRing: string;
  accentGradient: string;
  // 뱃지 & 알약
  pillBg: string;
  pillBorder: string;
  pillText: string;
  // 인풋/버튼
  inputBg: string;
  inputBorder: string;
  inputText: string;
  btnPrimary: string;
  btnSecondary: string;
}

export const THEME_CONFIGS: Record<SparkTheme, SparkThemeClasses> = {
  // 1. 🌌 [실리콘 다크 (Silicon Dark)]
  'silicon-dark': {
    id: 'silicon-dark',
    name: '실리콘 다크',
    icon: '🌌',
    appBg: 'bg-slate-950 text-slate-100',
    appText: 'text-slate-100',
    panelBg: 'bg-slate-900',
    panelBorder: 'border-slate-800',
    panelText: 'text-slate-100',
    panelSubtext: 'text-slate-400',
    panelHover: 'hover:bg-slate-800/80',
    cardBg: 'bg-slate-900/90 backdrop-blur-xl',
    cardBorder: 'border-slate-700/60',
    cardShadow: 'shadow-2xl shadow-indigo-950/30',
    cardHover: 'hover:border-cyan-500/50 hover:shadow-cyan-950/40',
    headerBg: 'bg-slate-950/95 backdrop-blur-md',
    headerBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    accentRing: 'ring-cyan-500/20',
    accentGradient: 'from-cyan-400 via-indigo-400 to-purple-400',
    pillBg: 'bg-slate-800/80',
    pillBorder: 'border-slate-700/70',
    pillText: 'text-cyan-300',
    inputBg: 'bg-slate-900/95',
    inputBorder: 'border-slate-700 focus:border-cyan-400',
    inputText: 'text-slate-100 placeholder-slate-500',
    btnPrimary: 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
  },

  // 2. 🏛️ [클린 모던 (Clean Modern)] - 확실한 고대비 화이트/그레이
  'clean-modern': {
    id: 'clean-modern',
    name: '클린 모던',
    icon: '🏛️',
    appBg: 'bg-slate-50 text-slate-900',
    appText: 'text-slate-900',
    panelBg: 'bg-white',
    panelBorder: 'border-slate-200',
    panelText: 'text-slate-800',
    panelSubtext: 'text-slate-500',
    panelHover: 'hover:bg-slate-100',
    cardBg: 'bg-white shadow-md',
    cardBorder: 'border-slate-300',
    cardShadow: 'shadow-md shadow-slate-200/60',
    cardHover: 'hover:border-blue-500/50 hover:shadow-lg',
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-slate-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentRing: 'ring-blue-500/20',
    accentGradient: 'from-blue-600 via-indigo-600 to-slate-900',
    pillBg: 'bg-slate-100',
    pillBorder: 'border-slate-300',
    pillText: 'text-slate-800',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300 focus:border-blue-600',
    inputText: 'text-slate-900 placeholder-slate-400',
    btnPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
  },

  // modern-navy (clean-modern의 별칭으로 유지)
  'modern-navy': {
    id: 'clean-modern',
    name: '클린 모던',
    icon: '🏛️',
    appBg: 'bg-slate-50 text-slate-900',
    appText: 'text-slate-900',
    panelBg: 'bg-white',
    panelBorder: 'border-slate-200',
    panelText: 'text-slate-800',
    panelSubtext: 'text-slate-500',
    panelHover: 'hover:bg-slate-100',
    cardBg: 'bg-white shadow-md',
    cardBorder: 'border-slate-300',
    cardShadow: 'shadow-md shadow-slate-200/60',
    cardHover: 'hover:border-blue-500/50 hover:shadow-lg',
    headerBg: 'bg-white/95 backdrop-blur-md',
    headerBorder: 'border-slate-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    accentText: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentRing: 'ring-blue-500/20',
    accentGradient: 'from-blue-600 via-indigo-600 to-slate-900',
    pillBg: 'bg-slate-100',
    pillBorder: 'border-slate-300',
    pillText: 'text-slate-800',
    inputBg: 'bg-white',
    inputBorder: 'border-slate-300 focus:border-blue-600',
    inputText: 'text-slate-900 placeholder-slate-400',
    btnPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
  },

  // 3. ☕ [웜 에디토리얼 (Warm Editorial)] - 고대비 차콜 & 딥 세피아 가독성 교정
  'warm-editorial': {
    id: 'warm-editorial',
    name: '웜 에디토리얼',
    icon: '☕',
    appBg: 'bg-[#f7f4ed] text-[#1f1e1c]',
    appText: 'text-[#1f1e1c]',
    panelBg: 'bg-[#efebe2]',
    panelBorder: 'border-[#e2dcd2]',
    panelText: 'text-[#1f1e1c]',
    panelSubtext: 'text-[#5a554e]',
    panelHover: 'hover:bg-[#e6e1d7]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    cardBorder: 'border-[#dfd8cc]',
    cardShadow: 'shadow-md shadow-stone-300/50',
    cardHover: 'hover:border-amber-600/50 hover:shadow-lg',
    headerBg: 'bg-[#f7f4ed]/95 backdrop-blur-md',
    headerBorder: 'border-[#e2dcd2]',
    textPrimary: 'text-[#1f1e1c]',
    textSecondary: 'text-[#38342e]',
    textMuted: 'text-[#6e685f]',
    accentText: 'text-[#8b4513]',
    accentBg: 'bg-[#eaddcf]',
    accentBorder: 'border-[#d0c0af]',
    accentRing: 'ring-amber-800/20',
    accentGradient: 'from-[#8b4513] via-[#a0522d] to-[#1f1e1c]',
    pillBg: 'bg-[#e8e2d5]',
    pillBorder: 'border-[#d7cfbf]',
    pillText: 'text-[#2a241e]',
    inputBg: 'bg-white',
    inputBorder: 'border-[#cfc6b5] focus:border-[#8b4513]',
    inputText: 'text-[#1f1e1c] placeholder-[#8c8577]',
    btnPrimary: 'bg-gradient-to-r from-[#2d2822] to-[#4a4237] hover:from-[#1b1814] hover:to-[#383229] text-amber-50 font-bold shadow-md shadow-stone-400/30',
    btnSecondary: 'bg-[#e2dcd0] hover:bg-[#d5cebf] text-[#2d2822] border-[#cfc6b5]'
  }
};

const THEME_STORAGE_KEY = 'anti_spark_studio_theme_v2';

interface SparkThemeContextValue {
  theme: SparkTheme;
  setTheme: (theme: SparkTheme) => void;
  themeConfig: SparkThemeClasses;
}

const SparkThemeContext = createContext<SparkThemeContextValue | null>(null);

export const SparkThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<SparkTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as SparkTheme;
      if (saved && THEME_CONFIGS[saved]) {
        return saved;
      }
    } catch {}
    return 'silicon-dark';
  });

  const setTheme = (newTheme: SparkTheme) => {
    const resolvedTheme = newTheme === 'modern-navy' ? 'clean-modern' : newTheme;
    setThemeState(resolvedTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    } catch {}
  };

  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS['silicon-dark'];

  return (
    <SparkThemeContext.Provider value={{ theme, setTheme, themeConfig }}>
      <div className={`w-full h-full ${themeConfig.appBg} transition-colors duration-200 flex flex-col overflow-hidden`}>
        {children}
      </div>
    </SparkThemeContext.Provider>
  );
};

export const useSparkTheme = (): SparkThemeContextValue => {
  const context = useContext(SparkThemeContext);
  if (!context) {
    throw new Error('useSparkTheme must be used within a SparkThemeProvider');
  }
  return context;
};
