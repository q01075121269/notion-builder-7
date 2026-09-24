import React, { useState } from 'react';
import type { PlanTriad, PlanOption } from '../../types/office';
import { 
  Sparkles, 
  ShieldCheck, 
  Rocket, 
  Zap, 
  Check, 
  HelpCircle, 
  ArrowRight, 
  X, 
  Target, 
  Coins, 
  ThumbsUp, 
  AlertCircle, 
  Milestone,
  RefreshCw
} from 'lucide-react';

interface PlanTriadIncubatorProps {
  planTriad: PlanTriad;
  onSelectOption: (optionKey: 'A' | 'B' | 'C') => void;
  onApplyToDocument: (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }) => void;
}

export const PlanTriadIncubator: React.FC<PlanTriadIncubatorProps> = ({
  planTriad,
  onSelectOption,
  onApplyToDocument
}) => {
  const [topicKeyword, setTopicKeyword] = useState('2026 하반기 엔터프라이즈 AI 오피스 스튜디오 도입');
  const [isGenerating, setIsGenerating] = useState(false);

  // 소크라테스식 핀포인트 질문 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetOptionKey, setTargetOptionKey] = useState<'A' | 'B' | 'C'>(planTriad.selectedOption || 'A');
  const [q1Target, setQ1Target] = useState('보안 및 거버넌스 승인 부서 (CISO & 기획총괄)');
  const [q2Channel, setQ2Channel] = useState('사내 온프레미스 프라이빗 망 및 전사 노션 통합 워크스페이스');

  const handleCardClick = (key: 'A' | 'B' | 'C') => {
    setTargetOptionKey(key);
    onSelectOption(key);
    setIsModalOpen(true);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  };

  const handleConfirmAndDocument = () => {
    onApplyToDocument(targetOptionKey, {
      targetDetail: q1Target,
      channelDetail: q2Channel
    });
    setIsModalOpen(false);
  };

  const renderOptionCard = (
    key: 'A' | 'B' | 'C',
    opt: PlanOption,
    colorTheme: {
      badge: string;
      border: string;
      activeBorder: string;
      icon: React.ReactNode;
      subTitle: string;
      btnBg: string;
    }
  ) => {
    const isSelected = planTriad.selectedOption === key;

    return (
      <div
        key={key}
        className={`
          flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 relative border
          ${isSelected 
            ? `${colorTheme.activeBorder} shadow-xl scale-[1.01] bg-white dark:bg-zinc-850 ring-2 ring-indigo-500/20` 
            : `${colorTheme.border} bg-white/80 dark:bg-zinc-900/90 hover:shadow-lg hover:border-slate-400 dark:hover:border-zinc-700`
          }
        `}
      >
        {/* 상단 뱃지 & 선택 상태 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${colorTheme.badge}`}>
              {colorTheme.icon}
              <span>{colorTheme.subTitle}</span>
            </span>

            {isSelected && (
              <span className="flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                <Check className="w-3.5 h-3.5" />
                <span>선택됨</span>
              </span>
            )}
          </div>

          {/* 타이틀 및 핵심 컨셉 */}
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
            {opt.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-6 font-medium">
            {opt.concept}
          </p>

          {/* 스펙 명세 (타깃 / 가격 / 장단점) */}
          <div className="space-y-3 text-xs mb-6">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-750">
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400 font-bold mb-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                <span>목표 타깃 & 환경</span>
              </div>
              <p className="text-slate-800 dark:text-zinc-200 font-semibold">{opt.target}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-750">
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400 font-bold mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>예산 및 가격 모델</span>
              </div>
              <p className="text-slate-800 dark:text-zinc-200 font-semibold">{opt.pricing}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] mb-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>장점 (Pros)</span>
                </div>
                <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-snug">{opt.pros}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
                <div className="flex items-center space-x-1 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] mb-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>단점 (Cons)</span>
                </div>
                <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-snug">{opt.cons}</p>
              </div>
            </div>
          </div>

          {/* 로드맵 */}
          <div className="space-y-2 mb-6">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Milestone className="w-3.5 h-3.5 text-indigo-500" />
              <span>실행 로드맵 (Roadmap)</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
              {opt.roadmap.map((step, sIdx) => (
                <li key={sIdx} className="flex items-start gap-2 bg-slate-50/80 dark:bg-zinc-800/40 p-2 rounded-lg">
                  <span className="font-mono text-indigo-500 font-black text-[11px] shrink-0">0{sIdx + 1}</span>
                  <span className="leading-tight">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 액션 버튼 */}
        <button
          onClick={() => handleCardClick(key)}
          className={`
            w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 transition cursor-pointer shadow-md active:scale-98
            ${colorTheme.btnBg}
          `}
        >
          <span>{key}안 선택 및 문서화 질문 열기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col py-6 px-4 sm:px-8 space-y-6 max-w-[1400px] mx-auto">
      
      {/* 상단 인큐베이터 컨트롤 배너 */}
      <div className="bg-gradient-to-r from-indigo-900 via-zinc-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>3-Way AI 기획 인큐베이터 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              하나의 키워드로 세 가지 전략적 대안 동시 발산
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              사내 규정 및 예산 분석 소스를 바탕으로 [정석·안정형], [파격·혁신형], [실속·MVP형] 3대 플랜을 생성하고, 소크라테스식 핀포인트 질문을 거쳐 최종 공식 문서로 즉시 전환합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={topicKeyword}
              onChange={(e) => setTopicKeyword(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-400 focus:border-indigo-400 outline-none w-full sm:w-80 shadow-inner"
              placeholder="사업 키워드 입력..."
            />
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>3-Way 재생성</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3대 카드 동시 비교 노출 (3열 그리드) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderOptionCard('A', planTriad.optionA, {
          subTitle: 'A안 : 정석·안정형',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
          border: 'border-blue-200 dark:border-blue-900',
          activeBorder: 'border-blue-500 ring-2 ring-blue-400/20',
          icon: <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          btnBg: 'bg-blue-600 hover:bg-blue-500 text-white'
        })}

        {renderOptionCard('B', planTriad.optionB, {
          subTitle: 'B안 : 파격·혁신형',
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
          border: 'border-purple-200 dark:border-purple-900',
          activeBorder: 'border-purple-500 ring-2 ring-purple-400/20',
          icon: <Rocket className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white'
        })}

        {renderOptionCard('C', planTriad.optionC, {
          subTitle: 'C안 : 실속·초고속 MVP',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
          border: 'border-amber-200 dark:border-amber-900',
          activeBorder: 'border-amber-500 ring-2 ring-amber-400/20',
          icon: <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white'
        })}
      </div>

      {/* 소크라테스식 핀포인트 질문 2문항 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  소크라테스식 핀포인트 기획 정밀화
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">[{targetOptionKey}안]</strong>을 바탕으로 정식 기안서 및 슬라이드를 구축하기 위해 2가지 핵심 전략 파라미터를 확정합니다.
            </p>

            <div className="space-y-4">
              {/* 질문 1: 타깃 오디언스 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>핵심 의사결정권자(타깃 승인자)의 주요 평가 기준은 무엇인가요?</span>
                </label>
                <input
                  type="text"
                  value={q1Target}
                  onChange={(e) => setQ1Target(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:border-indigo-500 text-slate-800 dark:text-white font-medium"
                />
              </div>

              {/* 질문 2: 배포 채널 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>초기 확산 및 실행을 위한 최우선 도입 채널은 어디인가요?</span>
                </label>
                <input
                  type="text"
                  value={q2Channel}
                  onChange={(e) => setQ2Channel(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:border-indigo-500 text-slate-800 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAndDocument}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer shadow-md active:scale-95"
              >
                <span>최종 문서화 직결 ➔ 캔버스로 반영</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
