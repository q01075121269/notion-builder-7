import React, { createContext, useContext, useState } from 'react';

export type SparkTheme = 'dark' | 'light' | 'silicon-dark' | 'clean-modern' | 'warm-editorial' | 'modern-navy';

export interface SparkThemeClasses {
  id: 'dark' | 'light';
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
  // 캔버스 배경
  canvasBg: string;
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

export const THEME_CONFIGS: Record<'dark' | 'light', SparkThemeClasses> = {
  // 1. 🌙 [Google Gemini Dark Mode - 순정 NotebookLM 다크]
  dark: {
    id: 'dark',
    name: '다크 모드',
    icon: '🌙',
    appBg: 'bg-[#131314] text-[#e3e3e3]',
    appText: 'text-[#e3e3e3]',
    panelBg: 'bg-[#1e1f20]',
    panelBorder: 'border-[#333537]',
    panelText: 'text-[#e3e3e3]',
    panelSubtext: 'text-[#c4c7c5]',
    panelHover: 'hover:bg-[#282a2c]',
    canvasBg: 'bg-[#131314]',
    cardBg: 'bg-[#1e1f20]',
    cardBorder: 'border-[#333537]',
    cardShadow: 'shadow-none',
    cardHover: 'hover:border-[#78d9ec]/50 hover:bg-[#232426]',
    headerBg: 'bg-[#1e1f20]/95 backdrop-blur-md',
    headerBorder: 'border-[#333537]',
    textPrimary: 'text-[#e3e3e3]',
    textSecondary: 'text-[#c4c7c5]',
    textMuted: 'text-[#8e918f]',
    accentText: 'text-[#a8c7fa]',
    accentBg: 'bg-[#a8c7fa]/10',
    accentBorder: 'border-[#a8c7fa]/30',
    accentRing: 'ring-[#a8c7fa]/20',
    accentGradient: 'from-[#a8c7fa] via-[#78d9ec] to-[#d3e3fd]',
    pillBg: 'bg-[#282a2c]',
    pillBorder: 'border-[#333537]',
    pillText: 'text-[#a8c7fa]',
    inputBg: 'bg-[#131314]',
    inputBorder: 'border-[#333537] focus:border-[#a8c7fa]',
    inputText: 'text-[#e3e3e3] placeholder-[#8e918f]',
    btnPrimary: 'bg-[#a8c7fa] hover:bg-[#d3e3fd] text-[#041e49] font-bold shadow-sm',
    btnSecondary: 'bg-[#282a2c] hover:bg-[#333537] text-[#e3e3e3] border-[#333537]'
  },

  // 2. ☀️ [Google Gemini Light Mode - 순정 NotebookLM 라이트]
  light: {
    id: 'light',
    name: '라이트 모드',
    icon: '☀️',
    appBg: 'bg-[#f8fafd] text-[#1f1f1f]',
    appText: 'text-[#1f1f1f]',
    panelBg: 'bg-[#ffffff]',
    panelBorder: 'border-[#e3e3e3]',
    panelText: 'text-[#1f1f1f]',
    panelSubtext: 'text-[#444746]',
    panelHover: 'hover:bg-[#f0f4f9]',
    canvasBg: 'bg-[#f8fafd]',
    cardBg: 'bg-[#ffffff]',
    cardBorder: 'border-[#e3e3e3]',
    cardShadow: 'shadow-xs',
    cardHover: 'hover:border-[#1a73e8]/50 hover:shadow-sm',
    headerBg: 'bg-[#ffffff]/95 backdrop-blur-md',
    headerBorder: 'border-[#e3e3e3]',
    textPrimary: 'text-[#1f1f1f]',
    textSecondary: 'text-[#444746]',
    textMuted: 'text-[#747775]',
    accentText: 'text-[#1a73e8]',
    accentBg: 'bg-[#e8f0fe]',
    accentBorder: 'border-[#d2e3fc]',
    accentRing: 'ring-[#1a73e8]/20',
    accentGradient: 'from-[#1a73e8] via-[#1557b0] to-[#0b57d0]',
    pillBg: 'bg-[#f0f4f9]',
    pillBorder: 'border-[#e3e3e3]',
    pillText: 'text-[#1a73e8]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#e3e3e3] focus:border-[#1a73e8]',
    inputText: 'text-[#1f1f1f] placeholder-[#747775]',
    btnPrimary: 'bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold shadow-sm',
    btnSecondary: 'bg-[#f0f4f9] hover:bg-[#e3e3e3] text-[#1f1f1f] border-[#e3e3e3]'
  }
};

const THEME_STORAGE_KEY = 'anti_spark_notebooklm_mode_v3';

interface SparkThemeContextValue {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  themeConfig: SparkThemeClasses;
}

const SparkThemeContext = createContext<SparkThemeContextValue | null>(null);

export const SparkThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (saved === 'silicon-dark') return 'dark';
      if (saved === 'clean-modern' || saved === 'warm-editorial') return 'light';
    } catch {}
    return 'dark'; // 기본값 Google Gemini Dark Mode
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const themeConfig = THEME_CONFIGS[theme];

  return (
    <SparkThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeConfig }}>
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
