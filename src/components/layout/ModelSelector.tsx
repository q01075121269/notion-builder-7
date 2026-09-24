import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { GeminiModelType } from '../../types/chat';
import { Zap, ChevronDown, Check, Cpu, BrainCircuit, Info } from 'lucide-react';

export interface ModelConfig {
  id: GeminiModelType;
  name: string;
  shortName: string;
  description: string;
  iconType: 'lite' | 'flash' | 'pro';
  badge?: string;
  isLocked: boolean;
}

export const GEMINI_PRIMARY_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: '3.5 Flash-Lite',
    shortName: '3.5 Lite',
    description: '가장 빠른 답변 제공 (일상 대화, 단순 메모, 속도 최우선)',
    iconType: 'lite',
    isLocked: false,
  },
  {
    id: 'gemini-3.8-flash',
    name: '3.8 Flash',
    shortName: '3.8 Flash',
    description: '무엇이든 도움을 받으세요 (일반 업무일지, 표/DB 생성 표준 추천 - 기본값)',
    iconType: 'flash',
    badge: '기본값',
    isLocked: false,
  },
  {
    id: 'gemini-3.1-pro',
    name: '3.1 Pro',
    shortName: '3.1 Pro',
    description: '고급 추론 (다중 관계형 DB, Formulas 2.0 수식 설계)',
    iconType: 'pro',
    isLocked: false,
  },
];

export const ModelSelector: React.FC = () => {
  const { 
    selectedModel, 
    setSelectedModel, 
    isThinkingEnabled, 
    toggleThinking, 
    showToast 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 모델 정보 탐색 (Fallback: 3.8 Flash)
  const currentConfig = GEMINI_PRIMARY_MODELS.find(m => m.id === selectedModel) || GEMINI_PRIMARY_MODELS[1];

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
    setSelectedModel(config.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_gemini_model', config.id);
      localStorage.setItem('gemini_selected_model', config.id);
    }
    showToast(`AI 모델이 [${config.name}]로 전환되었습니다.`, 'success');
    setIsOpen(false);
  };

  const handleToggleThinking = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleThinking();
    const nextState = !isThinkingEnabled;
    if (nextState) {
      showToast('확장된 사고 모델 (Thinking Engine 2.0)이 활성화되었습니다.', 'success');
    } else {
      showToast('확장된 사고 모델이 비활성화되었습니다.', 'info');
    }
  };

  return (
    <div className="relative shrink-0 z-50 overflow-visible" ref={containerRef}>
      {/* 헤더 모델 셀렉터 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/90 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition whitespace-nowrap cursor-pointer shadow-2xs"
        title="2026 최신 Gemini AI 모델 선택 (구글 공식 2단 라인업)"
      >
        <Zap className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
        <span className="hidden lg:inline font-extrabold">{currentConfig.name}</span>
        <span className="lg:hidden font-extrabold">{currentConfig.shortName}</span>

        {isThinkingEnabled && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-600">
            사고ON
          </span>
        )}

        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ml-1 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 구글 공식 2단 구조 드롭다운 팝오버 (z-[9999] 최상위 배치) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 bg-white dark:bg-notion-dark-card border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-2.5 z-[9999] flex flex-col gap-2 animate-fadeIn select-none">
          {/* 드롭다운 상단 타이틀 */}
          <div className="px-2 py-1 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-[11px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>2026 Gemini AI 모델 셀렉터</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold border border-slate-200 dark:border-zinc-700">
              Google Official
            </span>
          </div>

          {/* 1단: 기본 모델 선택 라디오 리스트 */}
          <div className="space-y-1">
            <div className="px-2 pt-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
              1단: 기본 AI 엔진 선택
            </div>
            {GEMINI_PRIMARY_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectModel(m)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left text-xs ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                      : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {m.iconType === 'pro' ? (
                        <Cpu className={`w-4 h-4 ${isSelected ? 'text-white dark:text-neutral-900' : 'text-slate-500'}`} />
                      ) : (
                        <Zap className={`w-4 h-4 ${isSelected ? 'text-white dark:text-neutral-900' : 'text-slate-500'}`} />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold truncate">{m.name}</span>
                        {m.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                            isSelected 
                              ? 'bg-neutral-700 text-white dark:bg-neutral-200 dark:text-neutral-900' 
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
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

                  <div className="shrink-0 ml-1">
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 1단과 2단 구분선 */}
          <div className="border-t border-slate-100 dark:border-neutral-800 my-0.5" />

          {/* 2단: 부가 기능 독립 토글 (확장된 사고 모델) */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
              2단: 부가 추론 엔진 옵션
            </div>
            
            <div 
              onClick={handleToggleThinking}
              className="group p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-700/80 hover:border-slate-400 dark:hover:border-zinc-600 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                <BrainCircuit className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition">
                      확장된 사고 모델
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                      Thinking 2.0
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                    복잡한 문제 해결 (시스템 자가 진단 및 심층 추론 엔진 가동)
                  </p>
                </div>
              </div>

              {/* 스위치 토글 버튼 */}
              <button
                type="button"
                onClick={handleToggleThinking}
                className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer ${
                  isThinkingEnabled ? 'bg-zinc-800 dark:bg-zinc-200 justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                }`}
                title={isThinkingEnabled ? '확장 사고 모델 끄기' : '확장 사고 모델 켜기'}
              >
                <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${isThinkingEnabled ? 'bg-white dark:bg-zinc-900' : 'bg-white'}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1.5 px-2 text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight border-t border-neutral-100 dark:border-neutral-800">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>기본 AI 엔진에 심층 사고(Thinking Engine) 옵션을 자유롭게 켜고 끌 수 있습니다.</span>
          </div>
        </div>
      )}
    </div>
  );
};
