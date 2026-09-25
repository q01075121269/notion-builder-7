import React, { createContext, useContext, useState, useEffect } from 'react';

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
    appBg: 'bg-[var(--bg-app)] text-[var(--text-primary)]',
    appText: 'text-[var(--text-primary)]',
    panelBg: 'bg-[var(--bg-surface)]',
    panelBorder: 'border-[var(--border-color)]',
    panelText: 'text-[var(--text-primary)]',
    panelSubtext: 'text-[var(--text-secondary)]',
    panelHover: 'hover:bg-[#282a2c]',
    canvasBg: 'bg-[var(--bg-app)]',
    cardBg: 'bg-[var(--bg-card)]',
    cardBorder: 'border-[var(--border-color)]',
    cardShadow: 'shadow-none',
    cardHover: 'hover:border-[#78d9ec]/50 hover:bg-[#232426]',
    headerBg: 'bg-[var(--bg-surface)]/95 backdrop-blur-md',
    headerBorder: 'border-[var(--border-color)]',
    textPrimary: 'text-[var(--text-primary)]',
    textSecondary: 'text-[var(--text-secondary)]',
    textMuted: 'text-[#8e918f]',
    accentText: 'text-[var(--accent-color)]',
    accentBg: 'bg-[#a8c7fa]/10',
    accentBorder: 'border-[#a8c7fa]/30',
    accentRing: 'ring-[#a8c7fa]/20',
    accentGradient: 'from-[#a8c7fa] via-[#78d9ec] to-[#d3e3fd]',
    pillBg: 'bg-[#282a2c]',
    pillBorder: 'border-[var(--border-color)]',
    pillText: 'text-[var(--accent-color)]',
    inputBg: 'bg-[var(--bg-app)]',
    inputBorder: 'border-[var(--border-color)] focus:border-[#a8c7fa]',
    inputText: 'text-[var(--text-primary)] placeholder-[#8e918f]',
    btnPrimary: 'bg-[#a8c7fa] hover:bg-[#d3e3fd] text-[#041e49] font-bold shadow-sm',
    btnSecondary: 'bg-[#282a2c] hover:bg-[#333537] text-[#e3e3e3] border-[var(--border-color)]'
  },

  // 2. ☀️ [Google Gemini Light Mode - 순정 NotebookLM 라이트]
  light: {
    id: 'light',
    name: '라이트 모드',
    icon: '☀️',
    appBg: 'bg-[var(--bg-app)] text-[var(--text-primary)]',
    appText: 'text-[var(--text-primary)]',
    panelBg: 'bg-[var(--bg-surface)]',
    panelBorder: 'border-[var(--border-color)]',
    panelText: 'text-[var(--text-primary)]',
    panelSubtext: 'text-[var(--text-secondary)]',
    panelHover: 'hover:bg-[#f0f4f9]',
    canvasBg: 'bg-[var(--bg-app)]',
    cardBg: 'bg-[var(--bg-card)]',
    cardBorder: 'border-[var(--border-color)]',
    cardShadow: 'shadow-xs',
    cardHover: 'hover:border-[#1a73e8]/50 hover:shadow-sm',
    headerBg: 'bg-[var(--bg-surface)]/95 backdrop-blur-md',
    headerBorder: 'border-[var(--border-color)]',
    textPrimary: 'text-[var(--text-primary)]',
    textSecondary: 'text-[var(--text-secondary)]',
    textMuted: 'text-[#747775]',
    accentText: 'text-[var(--accent-color)]',
    accentBg: 'bg-[#e8f0fe]',
    accentBorder: 'border-[#d2e3fc]',
    accentRing: 'ring-[#1a73e8]/20',
    accentGradient: 'from-[#1a73e8] via-[#1557b0] to-[#0b57d0]',
    pillBg: 'bg-[#f0f4f9]',
    pillBorder: 'border-[var(--border-color)]',
    pillText: 'text-[var(--accent-color)]',
    inputBg: 'bg-[var(--bg-surface)]',
    inputBorder: 'border-[var(--border-color)] focus:border-[#1a73e8]',
    inputText: 'text-[var(--text-primary)] placeholder-[#747775]',
    btnPrimary: 'bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold shadow-sm',
    btnSecondary: 'bg-[#f0f4f9] hover:bg-[#e3e3e3] text-[#1f1f1f] border-[var(--border-color)]'
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
      const saved = localStorage.getItem('theme') || localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (saved === 'silicon-dark') return 'dark';
      if (saved === 'clean-modern' || saved === 'warm-editorial') return 'light';
    } catch {}
    return 'dark'; // 기본값 Google Gemini Dark Mode
  });

  // HTML 태그의 .dark 클래스 및 localStorage 동기화
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const themeConfig = THEME_CONFIGS[theme];

  return (
    <SparkThemeContext.Provider value={{ theme, setTheme, toggleTheme, themeConfig }}>
      <div className={`w-full h-full bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200 flex flex-col overflow-hidden`}>
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
