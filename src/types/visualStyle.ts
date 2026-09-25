// src/types/visualStyle.ts
// 5대 프리미엄 비주얼 스타일 갤러리 규격 및 디자인 시스템 토큰

export type SparkVisualStyle = 
  | '3d-isometric'  // 🧊 3D 테크 & 아이소메트릭 (3D Isometric Bento)
  | 'storybook'     // ✏️ 동화 & 스토리북 일러스트 (Hand-drawn Storybook)
  | 'mckinsey'      // 🏛️ 맥킨지 익제큐티브 (Executive Data Matrix)
  | 'cyber-glow'    // 🌌 사이버 HUD 글로우 (Cyber Glow)
  | 'swiss-minimal'; // 📄 모던 스위스 미니멀 (Minimal Swiss Grid)

export interface VisualStyleMeta {
  id: SparkVisualStyle;
  name: string;
  shortName: string;
  emoji: string;
  tagline: string;
  keywords: string[];
  themeTokens: {
    container: string;
    card: string;
    cardActive: string;
    badge: string;
    header: string;
    accentText: string;
    subtext: string;
    border: string;
    button: string;
    glowShadow: string;
  };
}

export const VISUAL_STYLES: Record<SparkVisualStyle, VisualStyleMeta> = {
  '3d-isometric': {
    id: '3d-isometric',
    name: '3D 테크 & 아이소메트릭',
    shortName: '3D 테크',
    emoji: '🧊',
    tagline: '글래스모피즘, 입체 3D 섀도우 & 네온 그라디언트 림 라이트',
    keywords: ['3d', '아이소메트릭', '테크', '글래스', '입체'],
    themeTokens: {
      container: 'bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40',
      card: 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-sky-200/80 dark:border-sky-500/30 shadow-lg shadow-sky-500/5 hover:shadow-xl hover:shadow-sky-500/10 rounded-2xl transition-all duration-200',
      cardActive: 'ring-2 ring-sky-500/60 shadow-xl shadow-sky-500/20 bg-white/95 dark:bg-slate-900/95',
      badge: 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow-xs rounded-lg px-2.5 py-1 text-xs',
      header: 'font-extrabold tracking-tight text-slate-900 dark:text-white',
      accentText: 'text-sky-600 dark:text-sky-400 font-bold',
      subtext: 'text-slate-600 dark:text-slate-400 text-xs',
      border: 'border-sky-200 dark:border-sky-500/30',
      button: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold shadow-md rounded-xl transition-all',
      glowShadow: 'shadow-[0_10px_30px_rgba(14,165,233,0.15)]'
    }
  },

  'storybook': {
    id: 'storybook',
    name: '동화 & 스토리북 일러스트',
    shortName: '동화 일러스트',
    emoji: '✏️',
    tagline: '유기적 곡선, 세이지/크림 파스텔 톤 & 동화책 감성',
    keywords: ['동화', '스토리북', '일러스트', '파스텔', '세이지', '따뜻한'],
    themeTokens: {
      container: 'bg-[#faf8f5] dark:bg-[#151914]',
      card: 'bg-[#fffefb] dark:bg-[#1e241c] border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200',
      cardActive: 'ring-3 ring-emerald-500/50 border-solid border-emerald-400 bg-amber-50/50 dark:bg-emerald-950/30',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-medium rounded-full px-3 py-1 text-xs',
      header: 'font-bold tracking-normal text-emerald-950 dark:text-emerald-100',
      accentText: 'text-emerald-700 dark:text-emerald-300 font-semibold',
      subtext: 'text-stone-600 dark:text-stone-400 text-xs',
      border: 'border-emerald-300/80 dark:border-emerald-700/50',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-2xl shadow-xs transition-all',
      glowShadow: 'shadow-sm'
    }
  },

  'mckinsey': {
    id: 'mckinsey',
    name: '맥킨지 익제큐티브',
    shortName: '맥킨지 컨설팅',
    emoji: '🏛️',
    tagline: '글로벌 전략 컨설팅 펌 스타일: 절제된 딥 네이비 & 1px 정밀 라인',
    keywords: ['맥킨지', '컨설팅', '익제큐티브', '전략', '네이비', '보고서'],
    themeTokens: {
      container: 'bg-slate-100/70 dark:bg-[#0b0f17]',
      card: 'bg-white dark:bg-[#111622] border border-slate-300 dark:border-slate-800 rounded-none shadow-none hover:border-slate-500 dark:hover:border-slate-600 transition-all duration-150',
      cardActive: 'border-l-4 border-l-blue-900 dark:border-l-blue-400 bg-slate-50/80 dark:bg-slate-900/60',
      badge: 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-none',
      header: 'font-serif font-bold tracking-tight text-slate-950 dark:text-slate-50',
      accentText: 'text-blue-900 dark:text-sky-300 font-bold',
      subtext: 'text-slate-600 dark:text-slate-400 text-xs font-sans',
      border: 'border-slate-300 dark:border-slate-800',
      button: 'bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold rounded-none transition-all',
      glowShadow: 'shadow-none'
    }
  },

  'cyber-glow': {
    id: 'cyber-glow',
    name: '사이버 HUD 글로우',
    shortName: '사이버 HUD',
    emoji: '🌌',
    tagline: '딥 다크 배경, 네온 사이언/퍼플 발광 효과 & 관제 HUD 모노',
    keywords: ['사이버', 'hud', '글로우', '네온', '사이버펑크', '다크'],
    themeTokens: {
      container: 'bg-[#050811] dark:bg-[#03060c]',
      card: 'bg-[#0a0f1d]/90 border border-cyan-500/40 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:border-cyan-400 transition-all duration-200 backdrop-blur-md',
      cardActive: 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/80 bg-[#0d1527]',
      badge: 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-mono font-bold tracking-widest text-xs px-2.5 py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      header: 'font-mono font-black tracking-tight text-cyan-100 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
      accentText: 'text-cyan-400 font-mono font-bold',
      subtext: 'text-slate-400 text-xs font-mono',
      border: 'border-cyan-500/40',
      button: 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all',
      glowShadow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]'
    }
  },

  'swiss-minimal': {
    id: 'swiss-minimal',
    name: '모던 스위스 미니멀',
    shortName: '스위스 미니멀',
    emoji: '📄',
    tagline: '극단적 여백의 미, 볼드한 대형 타이포 & 흑백 모노크롬 감성',
    keywords: ['스위스', '미니멀', '모노크롬', '흑백', '모던', '타이포'],
    themeTokens: {
      container: 'bg-white dark:bg-black',
      card: 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-lg shadow-none hover:border-neutral-900 dark:hover:border-neutral-100 transition-all duration-150',
      cardActive: 'border-2 border-neutral-900 dark:border-neutral-100 bg-white dark:bg-black shadow-md',
      badge: 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-bold uppercase tracking-tight text-[11px] px-2 py-0.5 rounded-sm',
      header: 'font-black tracking-tighter text-neutral-900 dark:text-neutral-50',
      accentText: 'text-neutral-900 dark:text-neutral-100 font-black',
      subtext: 'text-neutral-600 dark:text-neutral-400 text-xs font-normal',
      border: 'border-neutral-300 dark:border-neutral-800',
      button: 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold rounded-sm transition-all',
      glowShadow: 'shadow-none'
    }
  }
};
