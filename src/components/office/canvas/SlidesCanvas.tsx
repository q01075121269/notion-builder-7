import React, { useState } from 'react';
import type { OfficeDocument, SlideItem } from '../../../types/office';
import { Presentation, Plus, Trash2, Sparkles, ChevronLeft, ChevronRight, LayoutTemplate } from 'lucide-react';

interface SlidesCanvasProps {
  document: OfficeDocument;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
}

export const SlidesCanvas: React.FC<SlidesCanvasProps> = ({
  document,
  onChangeDocument
}) => {
  const slides = document.content.slidesContent.slides;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  const handleUpdateActiveSlide = (updatedSlide: SlideItem) => {
    const updatedSlides = slides.map((s, idx) => idx === currentSlideIndex ? updatedSlide : s);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updatedSlides }
      }
    }, '슬라이드 내용 편집');
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      title: '새로운 발표 슬라이드 제목',
      subtitle: '소제목 및 발표의 핵심 테마를 한 줄로 요약하세요.',
      bullets: [
        '첫 번째 핵심 요점 및 추진 배경',
        '두 번째 세부 실행 과제 및 정량 목표',
        '세 번째 기대 효과 및 사내 협업 가이드'
      ],
      badge: 'NEW SLIDE'
    };
    const updatedSlides = [...slides, newSlide];
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updatedSlides }
      }
    }, '새 슬라이드 추가');
    setCurrentSlideIndex(updatedSlides.length - 1);
  };

  const handleDeleteSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    const updatedSlides = slides.filter((_, i) => i !== idx);
    onChangeDocument({
      ...document,
      content: {
        ...document.content,
        slidesContent: { slides: updatedSlides }
      }
    }, '슬라이드 삭제');
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  };

  const handleBulletChange = (bIdx: number, val: string) => {
    const newBullets = [...activeSlide.bullets];
    newBullets[bIdx] = val;
    handleUpdateActiveSlide({ ...activeSlide, bullets: newBullets });
  };

  const handleAddBullet = () => {
    handleUpdateActiveSlide({
      ...activeSlide,
      bullets: [...activeSlide.bullets, '신규 세부 실행 포인트를 입력하세요.']
    });
  };

  const handleDeleteBullet = (bIdx: number) => {
    if (activeSlide.bullets.length <= 1) return;
    handleUpdateActiveSlide({
      ...activeSlide,
      bullets: activeSlide.bullets.filter((_, i) => i !== bIdx)
    });
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-6">
      
      {/* 상단 슬라이드 내비게이션 바 */}
      <div className="w-full max-w-[1000px] mb-4 flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-2">
          <Presentation className="w-5 h-5 text-amber-500" />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
            16:9 와이드 슬라이드 덱 ({currentSlideIndex + 1} / {slides.length})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
          </button>
          <button
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
          </button>
          <button
            onClick={handleAddSlide}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>슬라이드 추가</span>
          </button>
        </div>
      </div>

      {/* 메인 16:9 슬라이드 프리뷰 카드 */}
      <div className="w-full max-w-[1000px] aspect-[16/9] bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-white rounded-3xl shadow-2xl border border-zinc-700 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
        
        {/* 장식용 은은한 글래스모피즘 그라데이션 블러 */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 상단 뱃지 & 슬라이드 제목 */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              {activeSlide.badge || 'STRATEGY 2026'}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              SLIDE #{currentSlideIndex + 1}
            </span>
          </div>

          <input
            type="text"
            value={activeSlide.title}
            onChange={(e) => handleUpdateActiveSlide({ ...activeSlide, title: e.target.value })}
            className="w-full text-2xl sm:text-4xl font-black bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-amber-400 outline-none pb-1 text-white tracking-tight transition"
          />

          <input
            type="text"
            value={activeSlide.subtitle}
            onChange={(e) => handleUpdateActiveSlide({ ...activeSlide, subtitle: e.target.value })}
            className="w-full text-xs sm:text-base font-medium text-zinc-400 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-amber-400 outline-none pb-1 transition"
          />
        </div>

        {/* 중앙 3단 비교 블록 / 리스트 */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 my-auto py-4">
          {activeSlide.bullets.map((bullet, bIdx) => (
            <div 
              key={bIdx}
              className="bg-zinc-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-zinc-700/60 hover:border-amber-400/50 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Point 0{bIdx + 1}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBullet(bIdx)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition"
                    title="항목 제거"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={bullet}
                  onChange={(e) => handleBulletChange(bIdx, e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-xs sm:text-sm text-zinc-200 outline-none resize-none leading-relaxed border-none p-0 focus:ring-0"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 하단 툴바 & 항목 추가 */}
        <div className="relative z-10 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <LayoutTemplate className="w-4 h-4 text-zinc-400" />
            <span>오피스 스튜디오 2026 • AI 프레젠테이션 자동화</span>
          </div>

          <button
            onClick={handleAddBullet}
            className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>포인트 블록 추가</span>
          </button>
        </div>

      </div>

      {/* 하단 썸네일 스트립 */}
      <div className="w-full max-w-[1000px] mt-6 flex items-center gap-3 overflow-x-auto pb-2">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => setCurrentSlideIndex(idx)}
            className={`
              w-36 h-20 rounded-xl p-2.5 shrink-0 cursor-pointer border transition-all flex flex-col justify-between relative group
              ${currentSlideIndex === idx 
                ? 'bg-zinc-800 border-amber-400 ring-2 ring-amber-400/30 text-white' 
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-zinc-600'
              }
            `}
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span>#{idx + 1}</span>
              {slides.length > 1 && (
                <button
                  onClick={(e) => handleDeleteSlide(idx, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                  title="슬라이드 삭제"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[11px] font-bold truncate">{slide.title}</p>
          </div>
        ))}
      </div>

    </div>
  );
};
