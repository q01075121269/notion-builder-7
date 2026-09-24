import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { GeminiModelType } from '../../types/chat';
import { Bot, ChevronDown, Lock, Info, Check } from 'lucide-react';

export interface ModelConfig {
  id: GeminiModelType;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  badge?: string;
  isLocked: boolean;
  tierLabel?: string;
}

export const GEMINI_2026_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: '⚡ 3.5 Flash-Lite',
    shortName: '3.5 Lite',
    description: '가장 빠른 답변 제공 (일상 대화, 단순 메모, 속도 최우선)',
    icon: '⚡',
    isLocked: false,
  },
  {
    id: 'gemini-3.8-flash',
    name: '🚀 3.8 Flash',
    shortName: '3.8 Flash',
    description: '무엇이든 도움을 받으세요 (일반 업무일지, 표/DB 생성 표준 추천 - 기본값)',
    icon: '🚀',
    badge: '기본값',
    isLocked: false,
  },
  {
    id: 'gemini-3.1-pro',
    name: '🧠 3.1 Pro',
    shortName: '3.1 Pro',
    description: '고급 추론 (다중 관계형 DB, Formulas 2.0 수식 설계)',
    icon: '🧠',
    isLocked: true,
    tierLabel: 'Pro 플랜',
  },
  {
    id: 'gemini-3.1-thinking',
    name: '🔬 확장된 사고 모델',
    shortName: '확장 사고',
    description: '복잡한 문제 해결 (시스템 아키텍처 자가 진단 및 심층 추론)',
    icon: '🔬',
    isLocked: true,
    tierLabel: 'Ultra/종량',
  },
];

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelConfig | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 모델 정보 탐색 (Fallback: 3.8 Flash)
  const currentConfig = GEMINI_2026_MODELS.find(m => m.id === selectedModel) || GEMINI_2026_MODELS[1];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModel = (config: ModelConfig) => {
    if (config.isLocked) {
      showToast(
        '현재 무료 API 키 범위를 초과하는 상위 모델입니다. Google AI Studio 유료 플랜 또는 상위 구독 키가 필요합니다.',
        'info'
      );
      return;
    }

    setSelectedModel(config.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_gemini_model', config.id);
      localStorage.setItem('gemini_selected_model', config.id);
    }
    showToast(`🤖 AI 모델이 [${config.name}]로 전환되었습니다.`, 'success');
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* 헤더 모델 셀렉터 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/90 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-2xs"
        title="2026 최신 Gemini AI 모델 선택 (구글 공식 라인업)"
      >
        <Bot className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="hidden lg:inline font-extrabold">{currentConfig.name}</span>
        <span className="lg:hidden font-extrabold">{currentConfig.shortName}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 모델 선택 드롭다운 팝오버 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-notion-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-2 z-50 animate-fadeIn space-y-1">
          <div className="px-2.5 py-1.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              2026 Gemini AI 모델 셀렉터
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
              Google AI Official
            </span>
          </div>

          <div className="space-y-1 pt-1">
            {GEMINI_2026_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div key={m.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSelectModel(m)}
                    onMouseEnter={() => setHoveredModel(m)}
                    onMouseLeave={() => setHoveredModel(null)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left text-xs ${
                      m.isLocked
                        ? 'opacity-50 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 cursor-not-allowed'
                        : isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                        : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="text-base shrink-0">{m.icon}</span>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold truncate">{m.name}</span>
                          {m.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                              isSelected 
                                ? 'bg-amber-400 text-neutral-900' 
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}>
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate ${
                          isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {m.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1 ml-1">
                      {m.isLocked ? (
                        <div className="flex items-center space-x-1 text-rose-500 dark:text-rose-400 font-extrabold text-[10px] bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                          <Lock className="w-3 h-3" />
                          <span>{m.tierLabel}</span>
                        </div>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      ) : null}
                    </div>
                  </button>

                  {/* 구글 공식 설명 툴팁 (마우스 호버 시 세부 안내) */}
                  {hoveredModel?.id === m.id && (
                    <div className="absolute left-0 right-0 -bottom-10 z-50 p-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-[10px] shadow-lg border border-neutral-700 dark:border-neutral-300 pointer-events-none animate-fadeIn flex items-center space-x-1.5">
                      <Info className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{m.description}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 pb-1 px-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
            💡 Pro & 사고 모델은 Google AI Studio 유료 플랜 계정 키 연동 시 활성화됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
