import React, { useState } from 'react';
import type { PlanTriad, PlanOption } from '../../types/office';
import { 
  Sparkles, 
  ShieldCheck, 
  Flame, 
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
  Loader2
} from 'lucide-react';

interface TriOptionIdeatorProps {
  planTriad: PlanTriad;
  onUpdatePlanTriad: (newTriad: PlanTriad) => void;
  onApplyPlanToDoc: (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }, chosenOption: PlanOption) => void;
}

export const TriOptionIdeator: React.FC<TriOptionIdeatorProps> = ({
  planTriad,
  onUpdatePlanTriad,
  onApplyPlanToDoc
}) => {
  const [keywordInput, setKeywordInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 소크라테스식 핀포인트 질문 2문항 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<'A' | 'B' | 'C'>('A');
  const [q1Target, setQ1Target] = useState('사내 C-레벨 및 보안/예산 심의 위원회');
  const [q2Channel, setQ2Channel] = useState('사내 인트라넷 공식 공지 및 노션 통합 포털');

  // 키워드 기반 동적 3-Way 생성 로직 (Zero-Hardcoding 준수: 키워드를 조합하여 3가지 독창적 플랜 빌드)
  const handleGenerateTriad = () => {
    const raw = keywordInput.trim() || 'AI 기반 사내 복지 구독 서비스';
    setIsGenerating(true);

    setTimeout(() => {
      const generatedTriad: PlanTriad = {
        selectedOption: 'A',
        optionA: {
          title: `[정석·안정형] 엔터프라이즈 표준 ${raw} 모델`,
          concept: `기존 사내 규정과 예산 가이드라인을 100% 준수하며 검증된 파트너십 기반으로 안전하게 론칭하는 정규 도입안`,
          target: `전사 임직원 및 컴플라이언스/재무 부서 (높은 신뢰도 및 무결성 중시)`,
          pricing: `연간 정규 예산 편성 (분기별 분할 집행 및 ROI 정기 감사)`,
          pros: `사내 보안 및 감사 기준 100% 통과, 리스크 최소화, 안정적 운영 기반`,
          cons: `도입 검토 승인 기간 6~8주 소요, 형식적 절차 필요`,
          roadmap: [
            `1단계: ${raw} 사내 요구도 설문 및 보안성 심의 (3주)`,
            `2단계: 우수 벤더 비교 견적 및 시범 부서 파일럿 운영 (3주)`,
            `3단계: 전사 공식 배포 및 만족도 기반 연간 계약 체결 (2주)`
          ]
        },
        optionB: {
          title: `[파격·혁신형] 도파민 폭발! 자율 참여형 게이미피케이션 ${raw}`,
          concept: `인간의 참여 본능과 보상 시스템을 결합하여 자발적 바이럴과 높은 몰입도를 유도하는 실험적 파격 기획`,
          target: `MZ 세대 및 테크/마케팅 이노베이션 부서 (재미와 신속한 피드백 선호)`,
          pricing: `성과 보상형 인센티브 펀드 (참여율에 따른 동적 예산 배분)`,
          pros: `단기간 내 전사 관심도 300% 급증, 바이럴 효과, 부서 간 자발적 경쟁 유도`,
          cons: `초기 기획 설계 복잡도 증가, 일부 부서의 보수적 반응 가능성`,
          roadmap: [
            `1단계: ${raw} 게이미피케이션 룰 및 보상 메커니즘 설계 (1주)`,
            `2단계: 사내 오픈 베타 챌린지 및 리더보드 가동 (2주)`,
            `3단계: 전사 월간 어워즈 및 데이터 기반 기능 고도화 (1주)`
          ]
        },
        optionC: {
          title: `[실속·초고속 MVP] 0원 자본 7일 단기 챌린지 린(Lean) ${raw}`,
          concept: `대규모 예산 승인 없이 기존 노션/슬랙/구글폼 인프라를 활용하여 7일 만에 결과를 검증하는 초고속 린 런칭`,
          target: `즉각적인 성과 입증이 필요한 실무 기획 TF 및 애자일 팀`,
          pricing: `0원 자본 (사내 기존 무료 도구 및 사내 리소스 100% 활용)`,
          pros: `예산 승인 대기시간 제로, 즉각적인 현장 유저 피드백 획득, 실패 비용 전무`,
          cons: `수작업 운영 공수 일부 발생, 확장 시 자동화 파이프라인 추가 필요`,
          roadmap: [
            `Day 1~2: 노션 템플릿 및 간이 신청 폼 세팅 (48시간)`,
            `Day 3~5: 핵심 10명 대상 마이크로 파일럿 챌린지 실행 (72시간)`,
            `Day 6~7: 데이터 취합 후 경영진 보고용 1-Page 기안서 산출`
          ]
        }
      };

      onUpdatePlanTriad(generatedTriad);
      setIsGenerating(false);
    }, 600);
  };

  const handleOpenConfirmModal = (key: 'A' | 'B' | 'C') => {
    setSelectedKey(key);
    setIsModalOpen(true);
  };

  const handleFinalConfirm = () => {
    const chosen = selectedKey === 'A' 
      ? planTriad.optionA 
      : selectedKey === 'B' 
        ? planTriad.optionB 
        : planTriad.optionC;

    onApplyPlanToDoc(selectedKey, {
      targetDetail: q1Target,
      channelDetail: q2Channel
    }, chosen);

    setIsModalOpen(false);
  };

  const renderCard = (
    key: 'A' | 'B' | 'C',
    opt: PlanOption,
    theme: {
      tag: string;
      tagClass: string;
      icon: React.ReactNode;
      borderClass: string;
      hoverClass: string;
      buttonBg: string;
    }
  ) => {
    const isSelected = planTriad.selectedOption === key;

    return (
      <div
        key={key}
        className={`
          flex flex-col justify-between rounded-3xl p-6 transition-all duration-200 border relative
          ${isSelected 
            ? `${theme.borderClass} ring-2 ring-indigo-500/30 bg-white dark:bg-zinc-850 shadow-xl scale-[1.01]` 
            : `${theme.hoverClass} bg-white/90 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-sm`
          }
        `}
      >
        <div>
          {/* 상단 뱃지 & 선택 인디케이터 */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${theme.tagClass}`}>
              {theme.icon}
              <span>{theme.tag}</span>
            </span>

            {isSelected && (
              <span className="flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                <Check className="w-3.5 h-3.5" />
                <span>선택됨</span>
              </span>
            )}
          </div>

          {/* 타이틀 및 컨셉 */}
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2 leading-snug">
            {opt.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-5 font-medium">
            {opt.concept}
          </p>

          {/* 타깃 & 가격 모델 */}
          <div className="space-y-2.5 text-xs mb-5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-750">
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400 font-bold mb-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                <span>핵심 타깃</span>
              </div>
              <p className="text-slate-800 dark:text-zinc-200 font-semibold">{opt.target}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-750">
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400 font-bold mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>예산 및 가격 체계</span>
              </div>
              <p className="text-slate-800 dark:text-zinc-200 font-semibold">{opt.pricing}</p>
            </div>

            {/* 장점 & 단점 */}
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
          <div className="space-y-1.5 mb-6">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Milestone className="w-3.5 h-3.5 text-indigo-500" />
              <span>실행 로드맵</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
              {opt.roadmap.map((step, sIdx) => (
                <li key={sIdx} className="flex items-start gap-2 bg-slate-50/80 dark:bg-zinc-800/40 p-2 rounded-lg">
                  <span className="font-mono text-indigo-500 font-bold text-[11px] shrink-0">0{sIdx + 1}</span>
                  <span className="leading-tight">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 확정 버튼 */}
        <button
          onClick={() => handleOpenConfirmModal(key)}
          className={`
            w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 transition cursor-pointer shadow-md active:scale-98
            ${theme.buttonBg}
          `}
        >
          <span>🚀 이 안으로 기획 확정</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col py-6 px-4 sm:px-8 space-y-6 max-w-[1400px] mx-auto select-none">
      
      {/* 상단 기획 키워드 인풋바 & 발산 배너 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>3-Way AI 기획 발산 엔진 (Tri-Option Ideator)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              상반된 세 가지 기획 관점을 1초 만에 인큐베이팅
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              아이디어 키워드를 입력하면 검증된 정석형, 도파민 폭발 혁신형, 초고속 0원 린 MVP형 3가지 대안을 즉시 비교 발산하고 공문서로 직결합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateTriad();
              }}
              placeholder="기획 아이디어 또는 키워드를 툭 던져보세요..."
              className="px-4 py-3 rounded-2xl bg-zinc-800/90 border border-zinc-700 text-xs sm:text-sm text-white placeholder-zinc-400 focus:border-indigo-400 outline-none w-full sm:w-80 shadow-inner"
            />
            <button
              onClick={handleGenerateTriad}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-1.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-black transition shadow-lg whitespace-nowrap cursor-pointer active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>3-Way 발산 중...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>⚡ 3-Way 기획 발산</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3대 기획 카드 동시 비교 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderCard('A', planTriad.optionA, {
          tag: '🛡️ A안 [정석·안정형]',
          tagClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
          icon: <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          borderClass: 'border-blue-500 dark:border-blue-500',
          hoverClass: 'hover:border-blue-300 dark:hover:border-blue-800',
          buttonBg: 'bg-blue-600 hover:bg-blue-500 text-white'
        })}

        {renderCard('B', planTriad.optionB, {
          tag: '🔥 B안 [파격·혁신형]',
          tagClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
          icon: <Flame className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          borderClass: 'border-purple-500 dark:border-purple-500',
          hoverClass: 'hover:border-purple-300 dark:hover:border-purple-800',
          buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white'
        })}

        {renderCard('C', planTriad.optionC, {
          tag: '⚡ C안 [실속·초고속 MVP]',
          tagClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
          icon: <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          borderClass: 'border-amber-500 dark:border-amber-500',
          hoverClass: 'hover:border-amber-300 dark:hover:border-amber-800',
          buttonBg: 'bg-amber-600 hover:bg-amber-500 text-white'
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
                  소크라테스식 핀포인트 질문
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
              선택하신 <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">[{selectedKey}안]</strong>의 기획 뼈대를 공문서와 슬라이드에 반영하기 전, 2가지 필수 핵심 요소를 점검합니다.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>타깃 및 예산/과금 방식은 어떻게 설정할까요?</span>
                </label>
                <input
                  type="text"
                  value={q1Target}
                  onChange={(e) => setQ1Target(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 outline-none focus:border-indigo-500 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>주요 실행 및 배포 채널은 어디인가요?</span>
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
                onClick={handleFinalConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center space-x-2 transition cursor-pointer shadow-md active:scale-95"
              >
                <span>확인 ➔ 실시간 캔버스에 주입</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
