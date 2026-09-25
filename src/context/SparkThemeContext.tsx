import React, { createContext, useContext, useState } from 'react';

export type SparkTheme = 'silicon-dark' | 'modern-navy' | 'warm-editorial';

export interface SparkThemeClasses {
  id: SparkTheme;
  name: string;
  icon: string;
  // 전체 배경 & 텍스트
  appBg: string;
  appText: string;
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
  // 1. 🌌 [Silicon Dark] (기본 추천)
  'silicon-dark': {
    id: 'silicon-dark',
    name: '실리콘 다크',
    icon: '🌌',
    appBg: 'bg-slate-950 text-slate-100',
    appText: 'text-slate-100',
    cardBg: 'bg-slate-900/85 backdrop-blur-xl',
    cardBorder: 'border-slate-800/90',
    cardShadow: 'shadow-2xl shadow-indigo-950/20',
    cardHover: 'hover:border-cyan-500/40 hover:shadow-cyan-950/30',
    headerBg: 'bg-slate-950/90 backdrop-blur-md',
    headerBorder: 'border-slate-800/80',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    accentRing: 'ring-cyan-500/20',
    accentGradient: 'from-cyan-400 via-indigo-400 to-purple-400',
    pillBg: 'bg-slate-800/70',
    pillBorder: 'border-slate-700/60',
    pillText: 'text-cyan-300',
    inputBg: 'bg-slate-900/90',
    inputBorder: 'border-slate-700 focus:border-cyan-400',
    inputText: 'text-slate-100 placeholder-slate-500',
    btnPrimary: 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
  },

  // 2. 🏛️ [Modern Navy] (맥킨지/대기업 컨설팅)
  'modern-navy': {
    id: 'modern-navy',
    name: '모던 네이비',
    icon: '🏛️',
    appBg: 'bg-[#0b1329] text-slate-50',
    appText: 'text-slate-50',
    cardBg: 'bg-[#111c44]/90 backdrop-blur-xl',
    cardBorder: 'border-blue-900/60',
    cardShadow: 'shadow-xl shadow-blue-950/40',
    cardHover: 'hover:border-blue-500/50 hover:shadow-blue-900/30',
    headerBg: 'bg-[#0b1329]/90 backdrop-blur-md',
    headerBorder: 'border-blue-900/50',
    textPrimary: 'text-slate-50',
    textSecondary: 'text-blue-100/90',
    textMuted: 'text-blue-300/60',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    accentRing: 'ring-blue-500/20',
    accentGradient: 'from-blue-400 via-sky-300 to-amber-300',
    pillBg: 'bg-[#1a275a]/70',
    pillBorder: 'border-blue-800/60',
    pillText: 'text-blue-300',
    inputBg: 'bg-[#111c44]/95',
    inputBorder: 'border-blue-800/80 focus:border-blue-400',
    inputText: 'text-slate-100 placeholder-blue-300/40',
    btnPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/30',
    btnSecondary: 'bg-[#1a275a] hover:bg-[#233375] text-blue-100 border-blue-800'
  },

  // 3. ☕ [Warm Editorial] (노션 프리미엄 감성)
  'warm-editorial': {
    id: 'warm-editorial',
    name: '웜 에디토리얼',
    icon: '☕',
    appBg: 'bg-[#faf8f5] text-[#2d2a26]',
    appText: 'text-[#2d2a26]',
    cardBg: 'bg-white/95 backdrop-blur-md',
    cardBorder: 'border-[#e8e4de]',
    cardShadow: 'shadow-lg shadow-stone-200/60',
    cardHover: 'hover:border-amber-400/50 hover:shadow-stone-300/70',
    headerBg: 'bg-[#faf8f5]/90 backdrop-blur-md',
    headerBorder: 'border-[#e8e4de]',
    textPrimary: 'text-[#2d2a26]',
    textSecondary: 'text-stone-700',
    textMuted: 'text-stone-400',
    accentText: 'text-amber-800',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-600/30',
    accentRing: 'ring-amber-500/20',
    accentGradient: 'from-amber-700 via-orange-600 to-stone-800',
    pillBg: 'bg-[#f4efe8]',
    pillBorder: 'border-[#dfd8cd]',
    pillText: 'text-amber-900',
    inputBg: 'bg-white',
    inputBorder: 'border-stone-300 focus:border-amber-600',
    inputText: 'text-stone-900 placeholder-stone-400',
    btnPrimary: 'bg-gradient-to-r from-[#2d2a26] to-[#453f3a] hover:from-[#1f1d1a] hover:to-[#38332f] text-amber-50 font-bold shadow-md shadow-stone-400/20',
    btnSecondary: 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
  }
};

const THEME_STORAGE_KEY = 'anti_spark_studio_theme_v1';

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
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
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
