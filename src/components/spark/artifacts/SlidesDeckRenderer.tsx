// src/components/spark/artifacts/SlidesDeckRenderer.tsx
// 16:9 와이드 비율의 프레젠테이션 카드 덱 렌더러

import React, { useState } from 'react';
import type { OfficeDocument, SlideItem } from '../../../types/office';
import type { SparkVisualStyle } from '../../../types/visualStyle';
import { VISUAL_STYLES } from '../../../types/visualStyle';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Mic, 
  Presentation, 
  Copy, 
  Check, 
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';

interface SlideStylePreset {
  containerBg: string;
  frameClass: string;
  overlayClass: string;
  badgeClass: string;
  sectionTextClass: string;
  titleClass: string;
  subtitleClass: string;
  cardClass: string;
  cardBadgeClass: string;
  cardCategoryText: string;
  cardTextAreaClass: string;
  kpiBorderClass: string;
  kpiBoxClass: string;
  kpiLabelClass: string;
  kpiValueClass: string;
  footerClass: string;
  controlClass: string;
}

const SLIDE_THEMES: Record<SparkVisualStyle, SlideStylePreset> = {
  '3d-isometric': {
    containerBg: 'bg-[#070b14]',
    frameClass: 'bg-[#090e1a] text-white border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,210,255,0.18)] rounded-3xl',
    overlayClass: 'bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.15),transparent_50%)]',
    badgeClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono uppercase tracking-wider text-xs px-3 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] font-bold',
    sectionTextClass: 'text-cyan-400 font-mono tracking-wider',
    titleClass: 'text-white font-black tracking-tight drop-shadow-[0_2px_12px_rgba(6,182,212,0.4)]',
    subtitleClass: 'text-cyan-200/90 font-medium',
    cardClass: 'backdrop-blur-xl bg-zinc-900/70 border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,190,255,0.15)] rounded-2xl hover:border-cyan-400/60 transition-all',
    cardBadgeClass: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black rounded-full',
    cardCategoryText: 'text-cyan-300 font-semibold',
    cardTextAreaClass: 'text-slate-100 placeholder-zinc-500 font-medium',
    kpiBorderClass: 'border-cyan-500/20',
    kpiBoxClass: 'backdrop-blur-md bg-cyan-950/20 border border-cyan-500/30 rounded-xl',
    kpiLabelClass: 'text-cyan-400 font-medium',
    kpiValueClass: 'text-white font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    footerClass: 'text-cyan-400/70 border-cyan-500/20',
    controlClass: 'bg-zinc-900/90 border-cyan-500/30 text-cyan-200'
  },

  'storybook': {
    containerBg: 'bg-[#ede6da]',
    frameClass: 'bg-[#f4efe6] text-[#2c2825] border-2 border-[#d6cbbe] shadow-xl rounded-3xl',
    overlayClass: 'bg-[radial-gradient(#c5baab_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-25',
    badgeClass: 'bg-[#e2dacd] text-[#5c4e3f] border border-[#cfc3b3] font-bold text-xs px-3 py-1 rounded-full shadow-xs',
    sectionTextClass: 'text-[#8a7b6c] font-mono tracking-wider',
    titleClass: 'text-[#2c2825] font-black tracking-normal',
    subtitleClass: 'text-[#6a5f54] font-medium',
    cardClass: 'rounded-3xl border-2 border-[#d6cbbe] bg-white/90 shadow-sm text-[#2c2825] hover:border-[#b8aa97] transition-all',
    cardBadgeClass: 'bg-[#8c7b6c] text-[#fbf9f5] font-black rounded-full',
    cardCategoryText: 'text-[#7d6d5d] font-bold',
    cardTextAreaClass: 'text-[#2c2825] placeholder-stone-400 font-medium',
    kpiBorderClass: 'border-[#d6cbbe]',
    kpiBoxClass: 'bg-[#ece4d6] border border-[#d6cbbe] rounded-2xl',
    kpiLabelClass: 'text-[#7d6d5d] font-bold',
    kpiValueClass: 'text-[#2c2825] font-black',
    footerClass: 'text-[#8a7b6c] border-[#d6cbbe]',
    controlClass: 'bg-[#f4efe6] border-[#d6cbbe] text-[#2c2825]'
  },

  'mckinsey': {
    containerBg: 'bg-[#050b18]',
    frameClass: 'bg-[#0a1128] text-slate-100 border border-slate-700 shadow-2xl rounded-none',
    overlayClass: 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20',
    badgeClass: 'bg-blue-600 text-white font-mono uppercase tracking-widest text-[11px] px-2.5 py-0.5 rounded-none font-bold',
    sectionTextClass: 'text-slate-400 font-mono tracking-widest',
    titleClass: 'font-serif font-black text-slate-50 tracking-tight',
    subtitleClass: 'text-slate-300 font-sans font-medium',
    cardClass: 'rounded-none border border-slate-700 bg-slate-900/90 shadow-none text-slate-100 hover:border-slate-500 transition-all',
    cardBadgeClass: 'bg-slate-200 text-slate-950 font-bold rounded-none',
    cardCategoryText: 'text-blue-400 font-bold tracking-wider',
    cardTextAreaClass: 'text-slate-100 placeholder-slate-500 font-medium',
    kpiBorderClass: 'border-slate-800',
    kpiBoxClass: 'border border-slate-700 bg-slate-950/80 rounded-none',
    kpiLabelClass: 'text-slate-400 font-semibold',
    kpiValueClass: 'text-slate-50 font-black',
    footerClass: 'text-slate-400 border-slate-800',
    controlClass: 'bg-slate-900 border-slate-700 text-slate-200'
  },

  'cyber-glow': {
    containerBg: 'bg-black',
    frameClass: 'bg-zinc-950 text-cyan-400 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] rounded-xl',
    overlayClass: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-transparent to-transparent',
    badgeClass: 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-mono tracking-widest text-xs px-2.5 py-0.5 rounded-xs font-bold',
    sectionTextClass: 'text-cyan-400 font-mono tracking-widest',
    titleClass: 'font-mono text-cyan-300 font-black tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]',
    subtitleClass: 'font-mono text-cyan-200/80 font-medium',
    cardClass: 'bg-black/90 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-lg text-cyan-200 hover:border-cyan-400 transition-all',
    cardBadgeClass: 'bg-cyan-400 text-black font-black rounded-xs',
    cardCategoryText: 'text-cyan-400 font-mono font-bold',
    cardTextAreaClass: 'text-cyan-200 placeholder-cyan-800 font-mono',
    kpiBorderClass: 'border-cyan-500/40',
    kpiBoxClass: 'bg-zinc-950 border border-cyan-500/40 rounded-lg',
    kpiLabelClass: 'text-cyan-400 font-mono',
    kpiValueClass: 'text-cyan-300 font-mono font-black drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    footerClass: 'text-cyan-500 border-cyan-500/40 font-mono',
    controlClass: 'bg-zinc-950 border-cyan-500/50 text-cyan-300'
  },

  'swiss-minimal': {
    containerBg: 'bg-neutral-100',
    frameClass: 'bg-white text-black border-2 border-black shadow-[6px_6px_0px_#000] rounded-none',
    overlayClass: 'bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] opacity-10',
    badgeClass: 'bg-black text-white font-mono font-bold tracking-wider text-xs px-2.5 py-0.5 rounded-none',
    sectionTextClass: 'text-neutral-500 font-mono tracking-widest',
    titleClass: 'text-black font-black tracking-tighter uppercase',
    subtitleClass: 'text-neutral-700 font-medium',
    cardClass: 'bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-none text-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all',
    cardBadgeClass: 'bg-black text-white font-black rounded-none',
    cardCategoryText: 'text-black font-mono font-bold',
    cardTextAreaClass: 'text-black placeholder-neutral-400 font-medium',
    kpiBorderClass: 'border-black',
    kpiBoxClass: 'bg-neutral-100 border border-black rounded-none',
    kpiLabelClass: 'text-black font-bold font-mono',
    kpiValueClass: 'text-black font-black',
    footerClass: 'text-neutral-600 border-black',
    controlClass: 'bg-white border-black text-black shadow-[2px_2px_0px_#000]'
  }
};

interface SlidesDeckRendererProps {
  document: OfficeDocument;
  visualStyle?: SparkVisualStyle;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const SlidesDeckRenderer: React.FC<SlidesDeckRendererProps> = ({
  document,
  visualStyle = '3d-isometric',
  onChangeDocument,
  onShowToast
}) => {
  const slides = document.content.slidesContent?.slides || [];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [speakerNotes, setSpeakerNotes] = useState<Record<number, string>>({
    0: '오프닝 스크립트: 본 프로젝트의 핵심 목표와 배경을 강조하고, 사내외 이해관계자들의 공감을 이끌어내는 인트로 진행.'
  });
  const [copied, setCopied] = useState(false);

  const styleMeta = VISUAL_STYLES[visualStyle] || VISUAL_STYLES['3d-isometric'];
  const slideTheme = SLIDE_THEMES[visualStyle] || SLIDE_THEMES['3d-isometric'];

  const activeSlide: SlideItem = slides[currentSlideIndex] || {
    id: 'default-1',
    title: document.title || '발표 자료 슬라이드',
    subtitle: '스마트 행정 및 자동화 추진 전략',
    bullets: ['핵심 추진 과제 1', '핵심 실행 방안 2', '기대 효과 및 로드맵 3'],
    badge: 'STRATEGY'
  };

  const handleUpdateActiveSlide = (partial: Partial<SlideItem>) => {
    const updatedSlide = { ...activeSlide, ...partial };
    const updatedSlides = slides.map((s, idx) => idx === currentSlideIndex ? updatedSlide : s);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updatedSlides }
      }
    }, '슬라이드 실시간 편집');
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      title: '새로운 핵심 전략 슬라이드',
      subtitle: '추진 과제 및 세부 실행 계획 요약',
      bullets: [
        '단계별 마일스톤 및 리소스 배분 계획',
        '정량적 성과 지표(KPI) 및 데이터 검증 체계',
        '사내 변경 관리 및 단계적 확산 가이드라인'
      ],
      badge: 'PHASE ' + (slides.length + 1)
    };
    const updated = [...slides, newSlide];
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updated }
      }
    }, '새 슬라이드 추가');
    setCurrentSlideIndex(updated.length - 1);
  };

  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) {
      onShowToast?.('최소 1장의 슬라이드는 유지되어야 합니다.', 'info');
      return;
    }
    const updated = slides.filter((_, i) => i !== idx);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updated }
      }
    }, '슬라이드 삭제');
    if (currentSlideIndex >= updated.length) {
      setCurrentSlideIndex(updated.length - 1);
    }
  };

  const handleBulletChange = (idx: number, text: string) => {
    const newBullets = [...(activeSlide.bullets || [])];
    newBullets[idx] = text;
    handleUpdateActiveSlide({ bullets: newBullets });
  };

  const handleCopyScript = () => {
    const text = `[Slide ${currentSlideIndex + 1}: ${activeSlide.title}]\n${activeSlide.subtitle}\n\n- ${activeSlide.bullets.join('\n- ')}\n\n[발표자 노트]\n${speakerNotes[currentSlideIndex] || '노트 없음'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onShowToast?.('슬라이드 대본이 클립보드에 복사되었습니다.', 'success');
  };

  return (
    <div className={`w-full min-h-full py-6 px-3 sm:px-8 flex flex-col items-center justify-start ${slideTheme.containerBg} transition-all duration-300 select-text`}>
      
      {/* 1. 상단 슬라이드 덱 컨트롤 헤더 */}
      <div className={`w-full max-w-[1040px] mb-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-sm transition-all duration-200 ${slideTheme.controlClass}`}>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold">
                16:9 프레젠테이션 슬라이드 덱
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Slide {currentSlideIndex + 1} of {Math.max(1, slides.length)}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              스타일: {styleMeta.name} ({styleMeta.emoji})
            </p>
          </div>
        </div>

        {/* 미니 썸네일 스트립 */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full sm:max-w-md py-1">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`
                px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer
                ${idx === currentSlideIndex
                  ? `${slideTheme.badgeClass} ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-black/10 dark:bg-white/10 opacity-70 hover:opacity-100'
                }
              `}
              title={s.title}
            >
              #{idx + 1}
            </button>
          ))}
          <button
            onClick={handleAddSlide}
            className="p-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-blue-500 hover:text-white transition cursor-pointer shrink-0"
            title="새 슬라이드 추가"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 중앙 16:9 와이드 메인 프레젠테이션 카드 뷰어 */}
      <div className={`w-full max-w-[1040px] aspect-[16/9] min-h-[480px] flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden transition-all duration-300 group ${slideTheme.frameClass}`}>
        
        {/* 스타일 배경 오버레이 */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${slideTheme.overlayClass}`} />

        {/* 슬라이드 탑 메타 바 */}
        <div className="flex items-center justify-between w-full relative z-10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className={slideTheme.badgeClass}>
              {activeSlide.badge || 'EXECUTIVE SUMMARY'}
            </span>
            <span className={`text-xs ${slideTheme.sectionTextClass}`}>
              SECTION #{currentSlideIndex + 1}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyScript}
              className="p-1.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs flex items-center space-x-1 transition cursor-pointer"
              title="슬라이드 대본 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={(e) => handleDeleteSlide(currentSlideIndex, e)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs transition cursor-pointer"
              title="현재 슬라이드 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 슬라이드 메인 헤드라인 및 서브타이틀 */}
        <div className="relative z-10 my-auto py-4">
          <input
            type="text"
            value={activeSlide.title}
            onChange={(e) => handleUpdateActiveSlide({ title: e.target.value })}
            className={`w-full text-2xl sm:text-4xl bg-transparent outline-none border-b border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-blue-500 transition-colors pb-1 ${slideTheme.titleClass}`}
            placeholder="슬라이드 대형 헤드라인을 입력하세요"
          />
          <input
            type="text"
            value={activeSlide.subtitle}
            onChange={(e) => handleUpdateActiveSlide({ subtitle: e.target.value })}
            className={`w-full text-sm sm:text-base bg-transparent outline-none mt-2 ${slideTheme.subtitleClass}`}
            placeholder="핵심 메시지 서브타이틀을 입력하세요"
          />

          {/* 3대 핵심 메시지 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            {(activeSlide.bullets || []).slice(0, 3).map((bullet, bIdx) => (
              <div
                key={bIdx}
                className={`p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 ${slideTheme.cardClass}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-5 h-5 flex items-center justify-center text-xs shrink-0 ${slideTheme.cardBadgeClass}`}>
                    {bIdx + 1}
                  </span>
                  <span className={`text-[11px] uppercase ${slideTheme.cardCategoryText}`}>
                    핵심 전략 포인트
                  </span>
                </div>
                <textarea
                  value={bullet}
                  onChange={(e) => handleBulletChange(bIdx, e.target.value)}
                  rows={3}
                  className={`w-full text-xs sm:text-sm bg-transparent outline-none resize-none leading-relaxed ${slideTheme.cardTextAreaClass}`}
                  placeholder="세부 실행 내용을 입력하세요"
                />
              </div>
            ))}
          </div>

          {/* 비주얼 데이터 포인트 (KPI 3종 미니 지표 바) */}
          <div className={`grid grid-cols-3 gap-3 mt-4 pt-4 border-t ${slideTheme.kpiBorderClass}`}>
            <div className={`flex items-center space-x-2.5 p-2 ${slideTheme.kpiBoxClass}`}>
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-[10px] uppercase ${slideTheme.kpiLabelClass}`}>업무 효율 증대</div>
                <div className={`text-sm ${slideTheme.kpiValueClass}`}>+84.5%</div>
              </div>
            </div>

            <div className={`flex items-center space-x-2.5 p-2 ${slideTheme.kpiBoxClass}`}>
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-[10px] uppercase ${slideTheme.kpiLabelClass}`}>구축 예상 일정</div>
                <div className={`text-sm ${slideTheme.kpiValueClass}`}>Q3 완료 (4주)</div>
              </div>
            </div>

            <div className={`flex items-center space-x-2.5 p-2 ${slideTheme.kpiBoxClass}`}>
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-[10px] uppercase ${slideTheme.kpiLabelClass}`}>목표 정확도</div>
                <div className={`text-sm ${slideTheme.kpiValueClass}`}>99.8% 달성</div>
              </div>
            </div>
          </div>
        </div>

        {/* 슬라이드 풋터 브랜딩 */}
        <div className={`flex items-center justify-between text-[11px] border-t pt-2 shrink-0 relative z-10 ${slideTheme.footerClass}`}>
          <span>{document.title} | 비즈니스 발표 프레젠테이션</span>
          <span className="font-mono">Page {currentSlideIndex + 1} / {slides.length}</span>
        </div>
      </div>

      {/* 3. 하단 슬라이드 덱 네비게이션 & 스피커 노트 토글 */}
      <div className="w-full max-w-[1040px] mt-4 flex flex-col gap-2">
        <div className={`flex items-center justify-between p-3 rounded-2xl border shadow-sm transition-all duration-200 ${slideTheme.controlClass}`}>
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전 슬라이드</span>
          </button>

          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`
              flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer
              ${showSpeakerNotes
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/50 hover:bg-amber-100'
              }
            `}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{showSpeakerNotes ? '발표자 스피커 노트 닫기' : '🎙️ 발표자 스피커 노트 열기'}</span>
          </button>

          <button
            onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <span>다음 슬라이드</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 접이식 발표자 스피커 노트 패널 */}
        {showSpeakerNotes && (
          <div className="w-full bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/60 rounded-2xl p-4 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Mic className="w-4 h-4 text-amber-600" />
                <span>발표자 스피커 노트 & Q&A 방어 대본 (Slide #{currentSlideIndex + 1})</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                실시간 키노트 프롬프터 연동
              </span>
            </div>
            <textarea
              value={speakerNotes[currentSlideIndex] || ''}
              onChange={(e) => setSpeakerNotes(prev => ({ ...prev, [currentSlideIndex]: e.target.value }))}
              rows={4}
              placeholder="이 슬라이드를 발표할 때 언급할 핵심 멘트, 예상 질문 및 방어 논리를 작성하세요..."
              className="w-full text-xs bg-white/80 dark:bg-black/40 text-slate-800 dark:text-slate-200 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 outline-none leading-relaxed resize-y"
            />
          </div>
        )}
      </div>

    </div>
  );
};
