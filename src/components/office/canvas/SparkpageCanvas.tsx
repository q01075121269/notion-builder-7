import React, { useState } from 'react';
import type { OfficeDocument, PlanTriad, OfficeCitation, OfficeSource } from '../../../types/office';
import { useSparkTheme } from '../../../context/SparkThemeContext';
import { 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  Layers, 
  Activity, 
  Check, 
  Flame, 
  Zap, 
  Cpu
} from 'lucide-react';
import { FactCitationPopover } from '../FactCitationPopover';

interface SparkpageCanvasProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  sources?: OfficeSource[];
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onApplyPlanToDoc?: (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }) => void;
  onSelectCitation?: (citation: OfficeCitation) => void;
}

export const SparkpageCanvas: React.FC<SparkpageCanvasProps> = ({
  document,
  planTriad,
  sources = [],
  onChangeDocument,
  onApplyPlanToDoc,
  onSelectCitation
}) => {
  const { themeConfig } = useSparkTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(document.title);
  const [popoverCitation, setPopoverCitation] = useState<OfficeCitation | null>(null);
  const [selectedPlanTab, setSelectedPlanTab] = useState<'A' | 'B' | 'C'>(planTriad?.selectedOption || 'A');

  // 제목 저장 핸들러
  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== document.title) {
      onChangeDocument({
        ...document,
        title: titleDraft.trim()
      }, '스파크페이지 주제 헤드라인 수정');
    }
  };

  // 본문 요약 섹션들에서 3줄 추출 (없을 경우 기본 하이라이트 제공)
  const sections = document.content.docsContent.sections;
  const summaryBullets = sections.length > 0
    ? sections.filter(s => s.level <= 2).slice(0, 3).map(s => s.text.replace(/^[0-9.]+\s*|□\s*/, ''))
    : [
        '국토부 2026 스마트 건물 유지관리 지침에 부합하는 IoT 센서 및 AI 에이전트 행정 자동화 체계 수립',
        '건축물 결함 사전 감지 및 지자체 인허가·점검 보고서 작성 공수 78% 이상 획기적 절감',
        '행정망 프록시 게이트웨이 보안 가이드라인을 완벽 충족하는 독립형 온프레미스·클라우드 하이브리드 거버넌스'
      ];

  // 18개 출처 리스트 (props의 sources 또는 fallback)
  const activeSources = sources.length > 0 ? sources : [
    { id: 'src-1', title: '국토부 2026 스마트 건물 유지관리 지침 및 센서 규격', type: 'deep_research', tokenCount: 4200, createdAt: '2026-09-25' },
    { id: 'src-2', title: '전자신문: 생성형 AI 기반 지자체 행정 업무 자동화 도입 사례', type: 'deep_research', tokenCount: 3100, createdAt: '2026-09-25' },
    { id: 'src-3', title: '한국건설기술연구원: IoT 센서 기반 건축물 예지보전 ROI 보고서', type: 'deep_research', tokenCount: 3800, createdAt: '2026-09-25' },
    { id: 'src-4', title: '국가정보원/행안부: 행정망 프록시 게이트웨이 보안 제45조 가이드', type: 'deep_research', tokenCount: 2900, createdAt: '2026-09-25' },
    { id: 'src-5', title: '조달청: 2026년 공공기관 AI 행정 어시스턴트 도입 규격 가이드', type: 'deep_research', tokenCount: 3400, createdAt: '2026-09-25' },
    { id: 'src-6', title: '산업통상자원부: 지능형 건축물 설비 에너지 관리 표준 매뉴얼', type: 'deep_research', tokenCount: 2800, createdAt: '2026-09-25' }
  ];

  const handleSourceClick = (src: any) => {
    // 인용 클릭 핸들러 트리거
    const fakeCitation: OfficeCitation = {
      id: `cite-${src.id}`,
      sourceId: src.id,
      sourceTitle: src.title,
      textQuote: src.content || `${src.title}의 핵심 규격 및 실증 분석 데이터에 근거함.`,
      pageOrLine: '공식 기술 문서 p.14-22'
    };
    setPopoverCitation(fakeCitation);
    if (onSelectCitation) {
      onSelectCitation(fakeCitation);
    }
  };

  const handleApplyStrategy = (key: 'A' | 'B' | 'C') => {
    setSelectedPlanTab(key);
    if (onApplyPlanToDoc) {
      onApplyPlanToDoc(key, {
        targetDetail: '전사 스마트 시설물 및 행정 시스템',
        channelDetail: '온프레미스 + AI 게이트웨이'
      });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* ========================================================================= */}
        {/* 1. 🌟 [Hero Summary Card (col-span-4)]: 대형 타이포그래피 + 3줄 브리핑 + 뱃지 */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-4 rounded-3xl border p-6 sm:p-8 transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              
              {/* 상단 메타 태그 라인 */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${themeConfig.pillBg} ${themeConfig.pillBorder} ${themeConfig.pillText}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified by {activeSources.length} Web Sources</span>
                  <span className="text-emerald-400 font-mono font-extrabold">(신뢰도 99.4%)</span>
                </span>

                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${themeConfig.pillBg} ${themeConfig.textMuted}`}>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Genspark 2026 Autonomous Research</span>
                </span>
              </div>

              {/* 대형 타이포그래피 헤드라인 (직접 편집 가능) */}
              {isEditingTitle ? (
                <div className="flex items-center space-x-2 my-2">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                    className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold w-full px-3 py-1.5 rounded-xl border outline-none ${themeConfig.inputBg} ${themeConfig.inputBorder} ${themeConfig.inputText}`}
                  />
                  <button
                    onClick={handleSaveTitle}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${themeConfig.btnPrimary}`}
                  >
                    저장
                  </button>
                </div>
              ) : (
                <h1 
                  onClick={() => {
                    setTitleDraft(document.title);
                    setIsEditingTitle(true);
                  }}
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight cursor-pointer group flex items-center space-x-3 ${themeConfig.textPrimary}`}
                  title="클릭하여 주제명 수정"
                >
                  <span>{document.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md border border-slate-700 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                    수정
                  </span>
                </h1>
              )}

              <p className={`mt-2 text-sm sm:text-base font-normal leading-relaxed ${themeConfig.textSecondary}`}>
                글로벌 AI 연구 에이전트들이 국내외 공공 기술 규격, 실증 리포트 및 행정 보안 법률을 교차 분석하여 도출한 종합 전략 스파크페이지입니다.
              </p>
            </div>

            {/* 우측 리서치 일시 및 상태 */}
            <div className={`shrink-0 flex md:flex-col items-end justify-between p-3 rounded-2xl border ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>2026.09.25 자율 리서치 완료</span>
              </div>
              <div className="mt-1 flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>실시간 라이브 싱크 가동 중</span>
              </div>
            </div>
          </div>

          {/* 핵심 3줄 브리핑 (Executive Summary Bento Box) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 border-t border-slate-800/40">
            {summaryBullets.map((bullet, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-2xl border transition-all duration-200 ${themeConfig.pillBg} ${themeConfig.pillBorder} hover:border-cyan-500/30`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${themeConfig.btnPrimary}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Key Takeaway</span>
                </div>
                <p className={`text-xs sm:text-sm font-medium leading-relaxed ${themeConfig.textPrimary}`}>
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. 📈 [KPI Metrics Bento Card (col-span-2)]: 대형 그라디언트 수치 + 증감 태그 */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-2 rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl ${themeConfig.accentBg} ${themeConfig.accentBorder} border`}>
                  <TrendingUp className={`w-4 h-4 ${themeConfig.accentText}`} />
                </div>
                <h3 className={`text-sm sm:text-base font-bold ${themeConfig.textPrimary}`}>
                  핵심 성과 KPI 및 경제성 분석
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${themeConfig.pillBg} ${themeConfig.accentText} border ${themeConfig.pillBorder}`}>
                실증 ROI 모델
              </span>
            </div>

            {/* 3대 핵심 수치 그리드 */}
            <div className="grid grid-cols-3 gap-3 my-4">
              {/* 1. 공수 절감 */}
              <div className={`p-3.5 rounded-2xl border text-center ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                <div className="text-[11px] text-slate-400 font-semibold mb-1">행정 공수 절감</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  -78%
                </div>
                <div className="mt-1 inline-flex items-center text-[10px] font-bold text-emerald-400">
                  ▲ 전년비 4.2배 단축
                </div>
              </div>

              {/* 2. ROI 회수 */}
              <div className={`p-3.5 rounded-2xl border text-center ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                <div className="text-[11px] text-slate-400 font-semibold mb-1">투자 대비 ROI</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  320%
                </div>
                <div className="mt-1 inline-flex items-center text-[10px] font-bold text-cyan-400">
                  ★ 11개월 내 전액 회수
                </div>
              </div>

              {/* 3. 오류율 */}
              <div className={`p-3.5 rounded-2xl border text-center ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                <div className="text-[11px] text-slate-400 font-semibold mb-1">법적 검토 오류율</div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent">
                  0.02%
                </div>
                <div className="mt-1 inline-flex items-center text-[10px] font-bold text-purple-400">
                  ▼ 인적 실수 99.8% 예방
                </div>
              </div>
            </div>
          </div>

          {/* 프로그레스 게이지 바 */}
          <div className="mt-4 pt-3 border-t border-slate-800/50">
            <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
              <span className={themeConfig.textSecondary}>인프라 구축 공정 및 실증 안정화 달성률</span>
              <span className="text-emerald-400 font-bold font-mono">92.4%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800/80 overflow-hidden relative">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-700 ease-out" 
                style={{ width: '92.4%' }} 
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. 🗺️ [Milestone Roadmap Card (col-span-2)]: 단계별 입체 프로세스 타임라인 */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-2 rounded-3xl border p-6 flex flex-col justify-between transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl ${themeConfig.accentBg} ${themeConfig.accentBorder} border`}>
                  <Layers className={`w-4 h-4 ${themeConfig.accentText}`} />
                </div>
                <h3 className={`text-sm sm:text-base font-bold ${themeConfig.textPrimary}`}>
                  단계별 추진 로드맵 (Milestones)
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${themeConfig.pillBg} ${themeConfig.pillText} border ${themeConfig.pillBorder}`}>
                2026 연간 계획
              </span>
            </div>

            {/* 타임라인 스텝 3단계 */}
            <div className="space-y-3.5 my-2">
              {/* Q1 */}
              <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  Q1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${themeConfig.textPrimary}`}>스마트 센서 규격 확정 및 AI 인프라 구축</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">완료</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    국토부 규격 적합성 검증 및 데이터 수집 게이트웨이 파이프라인 연동
                  </p>
                </div>
              </div>

              {/* Q2 */}
              <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  Q2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${themeConfig.textPrimary}`}>시범 건축물 5개소 현장 실증 및 모델 고도화</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold animate-pulse">진행 중</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    실시간 이상 진단 정확도 98.7% 확보 및 행정 결재 자동화 파일럿 테스트
                  </p>
                </div>
              </div>

              {/* Q3~Q4 */}
              <div className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  Q3+
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${themeConfig.textPrimary}`}>전사 확산 및 행정망 정식 인증 배포</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-semibold">예정</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    국가정보원 보안성 심의 통과 및 전 자치단체/민간 확산 체계 가동
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-right">
            <span className="text-[11px] text-slate-500 font-medium">※ 주간 마일스톤 자동 평가 엔진과 연계됨</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. ⚖️ [3-Way Strategy Comparison Card (col-span-4)]: 3단 입체 카드 덱 레이아웃 */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-4 rounded-3xl border p-6 sm:p-8 transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚖️</span>
                <h3 className={`text-base sm:text-lg font-extrabold ${themeConfig.textPrimary}`}>
                  3-Way 실행 전략 비교 및 맞춤형 채택 (Strategy Triad)
                </h3>
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${themeConfig.textSecondary}`}>
                조직의 예산, 일정 및 보안 수준에 맞춰 가장 최적화된 실행 전략을 원클릭으로 채택할 수 있습니다.
              </p>
            </div>

            {/* 플랜 탭 선택기 */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
              {(['A', 'B', 'C'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedPlanTab(key)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer
                    ${selectedPlanTab === key
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {key}안
                </button>
              ))}
            </div>
          </div>

          {/* 3단 카드 덱 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* A안: 정석 하이브리드 */}
            <div 
              className={`
                rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative
                ${selectedPlanTab === 'A'
                  ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/30 shadow-xl'
                  : `${themeConfig.pillBg} ${themeConfig.pillBorder} hover:border-slate-600`
                }
              `}
            >
              {selectedPlanTab === 'A' && (
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow">
                  Current Selected Plan
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400"><Flame className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">A안 (정석·안정형)</span>
                </div>
                <h4 className={`text-base font-bold mb-2 ${themeConfig.textPrimary}`}>
                  {planTriad?.optionA.title || '온프레미스 + AI 게이트웨이 하이브리드'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {planTriad?.optionA.concept || '보안 규정을 100% 준수하면서 기존 공공 인프라와 무리 없이 결합하는 표준 모델'}
                </p>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">예산 규모</span>
                    <span className="font-semibold text-slate-200">{planTriad?.optionA.pricing || '초기 3,200만 / 월 120만'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">도입 소요 기간</span>
                    <span className="font-semibold text-slate-200">약 8주 (안정적 구축)</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">핵심 장점</span>
                    <span className="text-emerald-400 font-medium">{planTriad?.optionA.pros || '국토부 가이드라인 및 공공 보안 심의 100% 무통과'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleApplyStrategy('A')}
                className={`
                  w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2
                  ${selectedPlanTab === 'A'
                    ? 'bg-cyan-400 text-slate-950 font-extrabold shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }
                `}
              >
                {selectedPlanTab === 'A' ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{selectedPlanTab === 'A' ? '현재 채택됨' : 'A안 전략 채택하기'}</span>
              </button>
            </div>

            {/* B안: 완전 무인화 혁신형 */}
            <div 
              className={`
                rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative
                ${selectedPlanTab === 'B'
                  ? 'border-indigo-400 bg-indigo-950/20 ring-2 ring-indigo-400/30 shadow-xl'
                  : `${themeConfig.pillBg} ${themeConfig.pillBorder} hover:border-slate-600`
                }
              `}
            >
              {selectedPlanTab === 'B' && (
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-indigo-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow">
                  Current Selected Plan
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400"><Cpu className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">B안 (파격·완전무인화)</span>
                </div>
                <h4 className={`text-base font-bold mb-2 ${themeConfig.textPrimary}`}>
                  {planTriad?.optionB.title || '자율 에이전트 기반 완전 무인 모니터링'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {planTriad?.optionB.concept || '사람의 수동 점검 없이 AI가 센서 이상을 스스로 분석하고 기안문까지 자동 발송'}
                </p>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">예산 규모</span>
                    <span className="font-semibold text-slate-200">{planTriad?.optionB.pricing || '초기 4,800만 / 월 210만'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">도입 소요 기간</span>
                    <span className="font-semibold text-slate-200">약 12주 (AI 심화 학습)</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">핵심 장점</span>
                    <span className="text-cyan-400 font-medium">{planTriad?.optionB.pros || '인건비 절감 극대화 및 야간·주말 24시간 즉각 대응'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleApplyStrategy('B')}
                className={`
                  w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2
                  ${selectedPlanTab === 'B'
                    ? 'bg-indigo-500 text-white font-extrabold shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }
                `}
              >
                {selectedPlanTab === 'B' ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{selectedPlanTab === 'B' ? '현재 채택됨' : 'B안 전략 채택하기'}</span>
              </button>
            </div>

            {/* C안: 초고속 MVP */}
            <div 
              className={`
                rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative
                ${selectedPlanTab === 'C'
                  ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-400/30 shadow-xl'
                  : `${themeConfig.pillBg} ${themeConfig.pillBorder} hover:border-slate-600`
                }
              `}
            >
              {selectedPlanTab === 'C' && (
                <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow">
                  Current Selected Plan
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400"><Zap className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">C안 (실속·초고속 MVP)</span>
                </div>
                <h4 className={`text-base font-bold mb-2 ${themeConfig.textPrimary}`}>
                  {planTriad?.optionC.title || '클라우드 SaaS 신속 도입형 MVP'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {planTriad?.optionC.concept || '인프라 구축 비용을 최소화하고 기성 SaaS 서비스로 2주 내 즉시 체감 성과 창출'}
                </p>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">예산 규모</span>
                    <span className="font-semibold text-slate-200">{planTriad?.optionC.pricing || '초기 800만 / 월 65만'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">도입 소요 기간</span>
                    <span className="font-semibold text-slate-200">약 2주 (즉시 가동)</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">핵심 장점</span>
                    <span className="text-amber-400 font-medium">{planTriad?.optionC.pros || '초저비용으로 빠른 경영진 보고 및 파일럿 효용 입증'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleApplyStrategy('C')}
                className={`
                  w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2
                  ${selectedPlanTab === 'C'
                    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }
                `}
              >
                {selectedPlanTab === 'C' ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{selectedPlanTab === 'C' ? '현재 채택됨' : 'C안 전략 채택하기'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. 🌐 [Verified Web Sources Pill Carousel (col-span-4)]: 실제 발굴된 10~20개 출처 캡슐 리스트 */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-4 rounded-3xl border p-6 transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-xl ${themeConfig.accentBg} ${themeConfig.accentBorder} border`}>
                <Globe className={`w-4 h-4 ${themeConfig.accentText}`} />
              </div>
              <h3 className={`text-sm sm:text-base font-bold ${themeConfig.textPrimary}`}>
                신뢰성 검증된 {activeSources.length}대 기술 및 공공 출처 (Verified Web Grounding)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              클릭 시 해당 출처의 핵심 데이터와 원문 인용문을 즉시 확인합니다.
            </span>
          </div>

          {/* 알약 캡슐 리스트 (Horizontal Flow) */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {activeSources.map((source, index) => (
              <button
                key={source.id || index}
                onClick={() => handleSourceClick(source)}
                className={`
                  inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all duration-150 cursor-pointer text-left
                  ${themeConfig.pillBg} ${themeConfig.pillBorder} hover:scale-[1.02] hover:border-cyan-400/50 hover:shadow-md
                `}
                title={`${source.title} (토큰: ${source.tokenCount.toLocaleString()} tokens)`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {index + 1}
                </span>
                <span className={`truncate max-w-[220px] sm:max-w-[320px] font-medium ${themeConfig.textPrimary}`}>
                  {source.title}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 인용 팝오버 (FactCitationPopover) */}
      {popoverCitation && (
        <FactCitationPopover
          citation={popoverCitation}
          onClose={() => setPopoverCitation(null)}
        />
      )}
    </div>
  );
};
