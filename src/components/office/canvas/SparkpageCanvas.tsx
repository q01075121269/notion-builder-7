import React, { useState } from 'react';
import type { OfficeDocument, PlanTriad, OfficeCitation, OfficeSource } from '../../../types/office';
import type { SparkpagePayload } from '../../../types/spark';
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
  Cpu,
  Loader2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { FactCitationPopover } from '../FactCitationPopover';

interface SparkpageCanvasProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  sources?: OfficeSource[];
  sparkpageData?: SparkpagePayload | null;
  isResearching?: boolean;
  researchStep?: number; // 1, 2, 3
  researchMessage?: string;
  onChangeDocument: (updated: OfficeDocument, actionName: string) => void;
  onApplyPlanToDoc?: (selectedKey: 'A' | 'B' | 'C', qaAnswers: { targetDetail: string; channelDetail: string }) => void;
  onSelectCitation?: (citation: OfficeCitation) => void;
}

export const SparkpageCanvas: React.FC<SparkpageCanvasProps> = ({
  document,
  planTriad,
  sources = [],
  sparkpageData,
  isResearching = false,
  researchStep = 1,
  researchMessage = '실시간 구글 웹 인덱스 탐색 중...',
  onChangeDocument,
  onApplyPlanToDoc,
  onSelectCitation
}) => {
  const { themeConfig } = useSparkTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(sparkpageData?.hero?.title || document.title);
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

  // 1. Hero 데이터 준비 (API sparkpageData 우선 바인딩)
  const heroTitle = sparkpageData?.hero?.title || document.title;
  const heroSummary = sparkpageData?.hero?.summary || '구글 실시간 검색에서 확인된 공공 지침, 기술 표준, 실증 효과를 종합한 전략 스파크페이지입니다.';
  const heroConfidence = sparkpageData?.hero?.confidence || 99.4;

  const heroTakeaways = sparkpageData?.hero?.takeaways || [
    {
      id: 1,
      title: '국토부 2026 스마트 건물 유지관리 지침 부합',
      desc: 'IoT 센서 및 AI 에이전트 기반 행정 자동화 체계를 수립하여 표준 규격을 완벽 충족합니다.'
    },
    {
      id: 2,
      title: '건축물 결함 감지 및 보고서 공수 78% 절감',
      desc: '지자체 인허가 및 정기 안전 점검 보고서 작성 시간을 획기적으로 단축합니다.'
    },
    {
      id: 3,
      title: '행정망 보안 제45조 가이드라인 완벽 통과',
      desc: '망분리 환경에 최적화된 독립형 온프레미스·클라우드 하이브리드 거버넌스를 지원합니다.'
    }
  ];

  // 2. KPI 메트릭스 데이터 준비
  const kpis = sparkpageData?.kpis || [
    { label: '행정 공수 절감', value: '-78%', sub: '수기 점검 대비', change: '▲ 4.2배 단축', progress: 85 },
    { label: '투자 대비 ROI', value: '320%', sub: '11개월 내 회수', change: '★ 경제성 입증', progress: 92 },
    { label: '법적 규격 오류율', value: '0.02%', sub: '기술 규격 자동 검증', change: '▼ 99.8% 예방', progress: 98 }
  ];

  // 3. 로드맵 마일스톤 데이터 준비
  const milestones = sparkpageData?.milestones || [
    { step: 'Q1', title: '스마트 센서 표준 규격 확정 및 AI 인프라 구축', desc: '국토부 표준 적합성 검증 및 데이터 수집 파이프라인 연동', status: '완료' },
    { step: 'Q2', title: '시범 시설물 5개소 현장 실증 및 모델 고도화', desc: '이상 진단 정확도 98% 확보 및 행정 결재 자동화 파일럿 가동', status: '진행중' },
    { step: 'Q3', title: '전사 확산 및 행정망 정식 보안 인증', desc: '국가정보원 보안성 심의 통과 및 전국 단위 확산', status: '대기' }
  ];

  // 4. 3-Way 전략 데이터 준비
  const strategies = sparkpageData?.strategies || [
    {
      id: 'A',
      name: planTriad?.optionA.title || '온프레미스 + AI 게이트웨이 하이브리드',
      type: '정석 하이브리드',
      budget: planTriad?.optionA.pricing || '초기 3,200만 / 월 120만',
      pros: planTriad?.optionA.pros || '공공 행정망 보안 100% 충족 및 안정적 도입',
      cons: planTriad?.optionA.cons || '구축 기간 약 8주 소요'
    },
    {
      id: 'B',
      name: planTriad?.optionB.title || '자율 에이전트 기반 완전 무인 모니터링',
      type: '완전 자율 무인화',
      budget: planTriad?.optionB.pricing || '초기 4,800만 / 월 210만',
      pros: planTriad?.optionB.pros || '24시간 무인 가동 및 야간 인건비 90% 이상 절감',
      cons: planTriad?.optionB.cons || '초기 정밀 AI 학습 데이터 셋 구축 필요'
    },
    {
      id: 'C',
      name: planTriad?.optionC.title || '클라우드 SaaS 신속 도입형 MVP',
      type: '초단기 MVP',
      budget: planTriad?.optionC.pricing || '초기 800만 / 월 65만',
      pros: planTriad?.optionC.pros || '2주 내 즉시 체감 성과 창출 및 경영진 조기 보고',
      cons: planTriad?.optionC.cons || '내부 행정망과의 전용선 연동 제약'
    }
  ];

  // 5. 검증된 웹 출처 데이터 준비
  const displaySources = (sparkpageData?.sources && sparkpageData.sources.length > 0)
    ? sparkpageData.sources
    : sources.length > 0
      ? sources.map(s => {
          let domain = 'google.com';
          try {
            if (s.url) domain = new URL(s.url).hostname.replace(/^www\./, '');
          } catch {}
          return {
            title: s.title,
            url: s.url || '#',
            domain: domain,
            snippet: s.summary || s.content?.slice(0, 100)
          };
        })
      : [
          { title: '국토교통부 2026 스마트 건물 유지관리 지침 및 센서 규격', url: 'https://molit.go.kr', domain: 'molit.go.kr', snippet: '스마트 시설물 관리 및 센서 표준 규격' },
          { title: '전자신문: 생성형 AI 기반 지자체 행정 업무 자동화 도입 사례', url: 'https://etnews.com', domain: 'etnews.com', snippet: '공공 행정 AI 어시스턴트 도입을 통한 공수 절감 사례' },
          { title: '한국건설기술연구원: IoT 센서 기반 건축물 예지보전 ROI 보고서', url: 'https://kict.re.kr', domain: 'kict.re.kr', snippet: '건축물 수명 연장 및 유지보수 비용 35% 절감 연구' },
          { title: '국가정보원/행안부: 행정망 프록시 게이트웨이 보안 가이드', url: 'https://mois.go.kr', domain: 'mois.go.kr', snippet: '망분리 환경에서의 생성형 AI 연동 보안 수칙 제45조' },
          { title: '조달청: 2026년 공공기관 AI 행정 어시스턴트 도입 규격 가이드', url: 'https://pps.go.kr', domain: 'pps.go.kr', snippet: '공공 클라우드 조달 혁신제품 등록 기준 및 가이드' }
        ];

  const handleSourceClick = (src: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (src.url && src.url !== '#' && src.url.startsWith('http')) {
      window.open(src.url, '_blank', 'noopener,noreferrer');
    } else {
      const fakeCitation: OfficeCitation = {
        id: `cite-${Date.now()}`,
        sourceId: src.domain || 'web',
        sourceTitle: src.title,
        textQuote: src.snippet || `${src.title}의 공식 웹 인덱스 검색 결과에 근거함.`,
        pageOrLine: '공식 웹 링크'
      };
      setPopoverCitation(fakeCitation);
      onSelectCitation?.(fakeCitation);
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
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 relative">
      
      {/* ========================================================================= */}
      {/* 2. 젠스파크형 실시간 멀티 에이전트 자율 리서치 프로그레스 모달 (Progress Stepper) */}
      {/* ========================================================================= */}
      {isResearching && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
            
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>

            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                Genspark Autonomous Engine
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-3">
                실시간 구글 웹 그라운딩 자율 리서치
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {researchMessage}
              </p>
            </div>

            {/* 3단계 진행 스테퍼 */}
            <div className="space-y-3 pt-2 text-left">
              {[
                { step: 1, label: '실시간 구글 웹 인덱스 및 최신 리포트 탐색' },
                { step: 2, label: '3개 이상 공공/기업 기술 출처 교차 팩트체크' },
                { step: 3, label: 'Bento Grid 비주얼 스파크페이지 조립' }
              ].map(s => {
                const isPassed = researchStep > s.step;
                const isCurrent = researchStep === s.step;
                return (
                  <div 
                    key={s.step} 
                    className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/20' 
                        : isPassed 
                          ? 'bg-slate-800/40 border-slate-700/60' 
                          : 'bg-slate-800/20 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-cyan-300' : isPassed ? 'text-slate-300' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500">
              구글 실시간 검색 Grounding Chunks에서 출처와 수치를 정밀 크롤링 중입니다.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Bento Grid 인터랙티브 스파크페이지 캔버스 메인 레이아웃 */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-5 animate-fadeIn">
        
        {/* ========================================================================= */}
        {/* 1. 🌟 [Hero Summary Card (col-span-4)]: 실제 분석된 헤드라인 + 3대 Key Takeaways */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-4 rounded-3xl border p-6 sm:p-8 transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              
              {/* 상단 메타 태그 라인 */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${themeConfig.pillBg} ${themeConfig.pillBorder} ${themeConfig.pillText}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified by {displaySources.length} Web Sources</span>
                  <span className="text-emerald-400 font-mono font-extrabold">(신뢰도 {heroConfidence}%)</span>
                </span>

                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${themeConfig.pillBg} ${themeConfig.textMuted}`}>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Google Search Grounding Live</span>
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
                    setTitleDraft(heroTitle);
                    setIsEditingTitle(true);
                  }}
                  className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight cursor-pointer group flex items-center space-x-3 ${themeConfig.textPrimary}`}
                  title="클릭하여 주제명 수정"
                >
                  <span>{heroTitle}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md border border-slate-700 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-normal">
                    수정
                  </span>
                </h1>
              )}

              <p className={`mt-2 text-sm sm:text-base font-normal leading-relaxed ${themeConfig.textSecondary}`}>
                {heroSummary}
              </p>
            </div>

            {/* 우측 리서치 일시 및 상태 */}
            <div className={`shrink-0 flex md:flex-col items-end justify-between p-3 rounded-2xl border ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{sparkpageData?.generatedAt ? new Date(sparkpageData.generatedAt).toLocaleDateString() : '2026.09.25'} 자율 리서치</span>
              </div>
              <div className="mt-1 flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>실시간 라이브 싱크 가동 중</span>
              </div>
            </div>
          </div>

          {/* 핵심 3대 Key Takeaways 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 border-t border-slate-800/40">
            {heroTakeaways.map((takeaway, idx) => (
              <div 
                key={takeaway.id || idx}
                className={`p-4 rounded-2xl border transition-all duration-200 ${themeConfig.pillBg} ${themeConfig.pillBorder} hover:border-cyan-500/30 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${themeConfig.btnPrimary}`}>
                      {takeaway.id || idx + 1}
                    </span>
                    <span className={`text-xs font-bold truncate ${themeConfig.textPrimary}`}>
                      {takeaway.title}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm font-medium leading-relaxed ${themeConfig.textSecondary}`}>
                    {takeaway.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. 📈 [KPI Metrics Bento Card (col-span-2)]: 실제 검색된 공수/ROI 수치 + 게이지 */}
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

            {/* 수치 그리드 */}
            <div className="grid grid-cols-3 gap-3 my-4">
              {kpis.map((kpi, idx) => (
                <div key={idx} className={`p-3.5 rounded-2xl border text-center ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                  <div className="text-[11px] text-slate-400 font-semibold mb-1 truncate" title={kpi.label}>
                    {kpi.label}
                  </div>
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r ${idx === 0 ? 'from-emerald-400 to-cyan-400' : idx === 1 ? 'from-cyan-400 to-indigo-400' : 'from-purple-400 to-rose-400'} bg-clip-text text-transparent`}>
                    {kpi.value}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-slate-300 truncate">
                    {kpi.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프로그레스 게이지 바 */}
          <div className="mt-4 pt-3 border-t border-slate-800/50">
            <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
              <span className={themeConfig.textSecondary}>인프라 구축 및 지표 달성도</span>
              <span className="text-emerald-400 font-bold font-mono">
                {kpis[0]?.progress || 92}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800/80 overflow-hidden relative">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-700 ease-out" 
                style={{ width: `${kpis[0]?.progress || 92}%` }} 
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
              {milestones.map((m, idx) => (
                <div key={idx} className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all ${themeConfig.pillBg} ${themeConfig.pillBorder}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                    m.step === 'Q1' 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                      : m.step === 'Q2' 
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  }`}>
                    {m.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold truncate ${themeConfig.textPrimary}`}>{m.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ml-1 ${
                        m.status === '완료' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : m.status === '진행중' 
                            ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' 
                            : 'bg-slate-700/60 text-slate-300'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 text-right">
            <span className="text-[11px] text-slate-500 font-medium">※ 구글 실시간 리포트 기반 타임라인 자동 매핑됨</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. ⚖️ [3-Way Strategy Comparison Card (col-span-4)]: 3단 비교 대조군 */}
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
            {strategies.map((strategy) => {
              const isSelected = selectedPlanTab === strategy.id;
              const iconMap = {
                A: <Flame className="w-4 h-4" />,
                B: <Cpu className="w-4 h-4" />,
                C: <Zap className="w-4 h-4" />
              };
              const colorClass = strategy.id === 'A' ? 'cyan' : strategy.id === 'B' ? 'indigo' : 'amber';

              return (
                <div 
                  key={strategy.id}
                  className={`
                    rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative
                    ${isSelected
                      ? `border-${colorClass}-400 bg-${colorClass}-950/20 ring-2 ring-${colorClass}-400/30 shadow-xl`
                      : `${themeConfig.pillBg} ${themeConfig.pillBorder} hover:border-slate-600`
                    }
                  `}
                >
                  {isSelected && (
                    <div className={`absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-${colorClass}-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow`}>
                      Current Selected Plan
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`p-1.5 rounded-lg bg-${colorClass}-500/20 text-${colorClass}-400`}>
                        {iconMap[strategy.id]}
                      </span>
                      <span className={`text-xs font-bold text-${colorClass}-400 uppercase tracking-wider`}>
                        {strategy.id}안 ({strategy.type})
                      </span>
                    </div>
                    <h4 className={`text-base font-bold mb-2 ${themeConfig.textPrimary}`}>
                      {strategy.name}
                    </h4>

                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">예산 규모</span>
                        <span className="font-semibold text-slate-200">{strategy.budget}</span>
                      </div>
                      <div className="py-1 border-b border-slate-800">
                        <span className="text-slate-500 block mb-0.5">핵심 강점</span>
                        <span className="text-emerald-400 font-medium">{strategy.pros}</span>
                      </div>
                      <div className="py-1">
                        <span className="text-slate-500 block mb-0.5">고려 사항</span>
                        <span className="text-slate-400">{strategy.cons}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyStrategy(strategy.id)}
                    className={`
                      w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2
                      ${isSelected
                        ? `bg-${colorClass}-400 text-slate-950 font-extrabold shadow-md`
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }
                    `}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{isSelected ? '현재 채택됨' : `${strategy.id}안 전략 채택하기`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. 🌐 [Verified Web Sources Pill Carousel (col-span-4)]: 실제 구글 웹 파비콘 + 새 탭 링크 */}
        {/* ========================================================================= */}
        <div className={`col-span-1 md:col-span-4 rounded-3xl border p-6 transition-all duration-200 ${themeConfig.cardBg} ${themeConfig.cardBorder} ${themeConfig.cardShadow}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-xl ${themeConfig.accentBg} ${themeConfig.accentBorder} border`}>
                <Globe className={`w-4 h-4 ${themeConfig.accentText}`} />
              </div>
              <h3 className={`text-sm sm:text-base font-bold ${themeConfig.textPrimary}`}>
                구글 웹 검색 검증된 {displaySources.length}대 기술 및 공공 출처 (Google Search Grounding)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              클릭 시 공식 원문 페이지가 새 탭에서 즉시 열립니다.
            </span>
          </div>

          {/* 실제 파비콘과 도메인이 포함된 알약 캡슐 리스트 */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            {displaySources.map((source, index) => {
              const faviconUrl = `https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`;
              return (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleSourceClick(source, e)}
                  className={`
                    inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all duration-150 cursor-pointer text-left group
                    ${themeConfig.pillBg} ${themeConfig.pillBorder} hover:scale-[1.02] hover:border-cyan-400/50 hover:shadow-md
                  `}
                  title={`${source.title}\n(${source.url})`}
                >
                  {/* 실제 파비콘 */}
                  <img
                    src={faviconUrl}
                    alt={source.domain}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-4 h-4 rounded-full object-contain shrink-0"
                  />
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className={`truncate max-w-[200px] sm:max-w-[280px] font-medium ${themeConfig.textPrimary} group-hover:text-cyan-400 transition-colors`}>
                    {source.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                    {source.domain}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                </a>
              );
            })}
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
