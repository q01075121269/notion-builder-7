// src/components/spark/artifacts/InfographicPosterRenderer.tsx
// 10대 고해상도 인포그래픽 포스터 템플릿 렌더러 (SVG 차트 및 인터랙티브 템플릿 엔진)

import React, { useState, useRef } from 'react';
import type { OfficeDocument, PlanTriad } from '../../../types/office';
import type { SparkVisualStyle } from '../../../types/visualStyle';
import { VISUAL_STYLES } from '../../../types/visualStyle';
import { 
  Printer, 
  CheckCircle2, 
  BarChart3, 
  Share2, 
  Sparkles, 
  ArrowRight, 
  Database, 
  Globe, 
  Cpu, 
  Award 
} from 'lucide-react';
import { InteractiveBarChart } from '../../office/charts/InteractiveBarChart';
import { DonutProgressGauge } from '../../office/charts/DonutProgressGauge';
import { TimelineConnector } from '../../office/charts/TimelineConnector';

export type InfographicTemplateType =
  | 'bento'             // 1. [벤토 그리드 요약 포스터]
  | 'stat-focus'        // 2. [수치 통계 집중형]
  | 'process-roadmap'   // 3. [프로세스 로드맵형]
  | 'triad-matrix'      // 4. [3-Way 비교 매트릭스]
  | 'swot'              // 5. [SWOT 4분면 분석형]
  | 'ecosystem-map'     // 6. [시스템 에코시스템 맵]
  | 'roi-economic'      // 7. [ROI 경제성 분석형]
  | 'google-grounding'  // 8. [구글 웹 팩트 아카이브형]
  | 'pyramid'           // 9. [피라미드 위계 구조형]
  | 'editorial';        // 10. [모던 매거진 에디토리얼]

export interface InfographicTemplateMeta {
  id: InfographicTemplateType;
  label: string;
  emoji: string;
  desc: string;
}

export const INFOGRAPHIC_TEMPLATES: InfographicTemplateMeta[] = [
  { id: 'bento', label: '벤토 요약 포스터', emoji: '🍱', desc: '올인원 비주얼 벤토 그리드 리포트' },
  { id: 'stat-focus', label: '수치 통계 집중형', emoji: '📊', desc: '4대 KPI + 연간 성장 막대 그래프' },
  { id: 'process-roadmap', label: '프로세스 로드맵', emoji: '🗺️', desc: '발의부터 확산까지의 플로우차트' },
  { id: 'triad-matrix', label: '3-Way 비교표', emoji: '⚖️', desc: '안정형 vs 혁신형 vs MVP 3단 매트릭스' },
  { id: 'swot', label: 'SWOT 4분면 분석', emoji: '🧭', desc: '강점/약점/기회/위협 4분할 분석 카드' },
  { id: 'ecosystem-map', label: '에코시스템 맵', emoji: '🌐', desc: '중앙 허브 기반 모듈 방사형 연결망' },
  { id: 'roi-economic', label: 'ROI 경제성 분석', emoji: '📈', desc: '도입 비용 대비 회수 기간 및 순이익' },
  { id: 'google-grounding', label: '웹 팩트 아카이브', emoji: '🔍', desc: '검증된 웹 출처 및 신뢰도 지표 캡슐' },
  { id: 'pyramid', label: '피라미드 위계형', emoji: '🏛️', desc: '인프라 ➔ 거버넌스 ➔ 서비스 계층도' },
  { id: 'editorial', label: '모던 매거진 1-Page', emoji: '📰', desc: '볼드 타이포그래피 & 에디토리얼 리포트' }
];

interface InfographicPosterRendererProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  visualStyle?: SparkVisualStyle;
  onChangeDocument?: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const InfographicPosterRenderer: React.FC<InfographicPosterRendererProps> = ({
  document,
  planTriad,
  visualStyle = '3d-isometric',
  onShowToast
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTemplate, setActiveTemplate] = useState<InfographicTemplateType>('bento');
  const styleMeta = VISUAL_STYLES[visualStyle] || VISUAL_STYLES['3d-isometric'];

  const toast = onShowToast || ((_m: string) => {});

  // 예산 총합 산출
  const totalBudget = document.content.sheetsContent?.rows.reduce((acc, r) => {
    const val = typeof r.cells[3] === 'number' ? (r.cells[3] as number) : 0;
    return acc + val;
  }, 0) || 85000000;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('인포그래픽 공유 링크가 클립보드에 복사되었습니다.', 'success');
  };

  return (
    <div className={`w-full min-h-full py-6 px-3 sm:px-8 flex flex-col items-center justify-start ${styleMeta.themeTokens.container} transition-all duration-200 select-text`}>
      
      {/* 1. 상단 툴바: 템플릿 안내 및 공유/인쇄 */}
      <div className="w-full max-w-[1100px] mb-3 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 text-zinc-100 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-white">
                와이드 포스터형 비주얼 인포그래픽
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                10대 다이내믹 템플릿
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              현재 스타일: {styleMeta.name} ({styleMeta.emoji})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>공유</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF/인쇄</span>
          </button>
        </div>
      </div>

      {/* 🍱 인포그래픽 템플릿 (10종) 선택 바 */}
      <div className="w-full max-w-[1100px] mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-zinc-400 shrink-0 text-[11px] mr-1 flex items-center gap-1">
          <span>🍱 템플릿:</span>
        </span>
        {INFOGRAPHIC_TEMPLATES.map(tpl => {
          const isSelected = activeTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => setActiveTemplate(tpl.id)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
              title={tpl.desc}
            >
              <span>{tpl.emoji}</span>
              <span>{tpl.label}</span>
            </button>
          );
        })}
      </div>

      {/* 대형 와이드 포스터 캔버스 본체 */}
      <div 
        ref={containerRef}
        className="w-full max-w-[1100px] p-6 sm:p-10 rounded-3xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl relative overflow-hidden transition-all duration-300"
      >
        {/* 스타일 장식 배경 */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),transparent_60%)]" />

        {/* 상단 공통 HERO 배너 */}
        <div className="relative z-10 pb-5 border-b border-zinc-800 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono uppercase tracking-wider text-xs px-3 py-1 rounded-full font-bold">
                INFOGRAPHIC POSTER
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Verified by Multi-agent</span>
              </span>
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              작성: {document.metadata.author || '신사업전략본부'} | 템플릿: {INFOGRAPHIC_TEMPLATES.find(t => t.id === activeTemplate)?.label}
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 leading-tight tracking-tight">
            {document.title}
          </h1>
          <p className="text-sm text-zinc-300 font-medium max-w-3xl">
            {planTriad?.optionA.concept || '인공지능 에이전트와 사내 표준 결재선 연동을 통한 전사 행정 업무 프로세스 혁신 포스터'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 10대 템플릿 본문 동적 교체 렌더링 */}
        {/* ========================================================================= */}
        <div className="relative z-10">

          {/* 1. [벤토 그리드 요약 포스터] */}
          {activeTemplate === 'bento' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase">예산 규모</span>
                  <div className="text-2xl font-black text-white mt-1">{(totalBudget / 10000).toLocaleString()}만원</div>
                  <span className="text-[11px] text-emerald-400">100% 확정 집행</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase">공수 절감율</span>
                  <div className="text-2xl font-black text-cyan-400 mt-1">70%</div>
                  <span className="text-[11px] text-cyan-300">연간 2,400시간 절감</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase">규정 검증</span>
                  <div className="text-2xl font-black text-purple-400 mt-1">제45조</div>
                  <span className="text-[11px] text-purple-300">보안 게이트웨이 승인</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400 uppercase">결재선</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">4단 완결</div>
                  <span className="text-[11px] text-emerald-300">대표이사 최종 재가</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                  <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>핵심 추진 과제 및 전략적 가치</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                    기존에는 분산되어 있던 수기 공문서, 엑셀 수식 계산, 프레젠테이션 장표를 하나의 지식 소스에서 동시 출하하는 파이프라인을 구축하여 전사 행정 오류를 완전히 종식합니다.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="font-bold text-cyan-300">문서 정합성</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">100% 보장</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="font-bold text-emerald-300">기안 시간</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">0초 캔버스 동기화</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="font-bold text-purple-300">감사 적합성</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">사전 통과</div>
                    </div>
                  </div>
                </div>

                <DonutProgressGauge
                  value={84.5}
                  size={150}
                  title="전사 실증 달성도"
                  subtitle="30인 실무 피드백 완수"
                />
              </div>
            </div>
          )}

          {/* 2. [수치 통계 집중형] */}
          {activeTemplate === 'stat-focus' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <InteractiveBarChart
                  title="3개년 연간 행정 처리 건수 및 자동화 진척"
                  growthTag="+38% 성장"
                  unit="k건"
                  height={220}
                />
                <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-bold text-zinc-300">주요 산출 정량 지표</span>
                    <span className="text-[10px] font-mono text-cyan-400">AUDIT VERIFIED</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">월평균 기안서 처리 시간</span>
                      <span className="font-mono font-bold text-white">4.2h ➔ 45m</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">수식 불일치 반려율</span>
                      <span className="font-mono font-bold text-emerald-400">32% ➔ 0%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">연간 절감 인건비 환산액</span>
                      <span className="font-mono font-bold text-cyan-300">약 3억 2,000만원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. [프로세스 로드맵형] */}
          {activeTemplate === 'process-roadmap' && (
            <div className="space-y-4">
              <TimelineConnector
                title="발의에서 전사 안착까지의 4단계 엔터프라이즈 로드맵"
              />
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                <span className="font-bold text-white block mb-1">💡 마일스톤 운영 핵심 원칙</span>
                각 단계별 산출물은 사내 온프레미스 프록시를 통해 암호화 검증을 거치며, 기안 상신 시 4단 승인 라인에 실시간 알림이 발송됩니다.
              </div>
            </div>
          )}

          {/* 4. [3-Way 비교 매트릭스] */}
          {activeTemplate === 'triad-matrix' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">A안 • 안정형</span>
                  <h4 className="text-sm font-bold text-white mt-2 mb-1">완전 온프레미스 격리형</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">금융/공공 기관 필수 폐쇄망 규격. 보안 규정 100% 만족.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-300">
                  소요 예산: 8,500만원
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-blue-950/30 border-2 border-blue-500/50 flex flex-col justify-between relative">
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">최적 추천안</span>
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">B안 • 혁신형</span>
                  <h4 className="text-sm font-bold text-cyan-300 mt-2 mb-1">하이브리드 AI 에이전트</h4>
                  <p className="text-xs text-zinc-200 leading-relaxed">구글 실시간 웹 검색 그라운딩 및 전사 지식 창고 실시간 동기화.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-800/50 text-xs font-mono text-cyan-300 font-bold">
                  소요 예산: 1억 1,000만원
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">C안 • 초고속 MVP</span>
                  <h4 className="text-sm font-bold text-white mt-2 mb-1">부서 단위 파일럿 팩</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">신사업팀 30인 즉시 실증. 2주 내 도입 효과 분석 보고서 확정.</p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-300">
                  소요 예산: 3,500만원
                </div>
              </div>
            </div>
          )}

          {/* 5. [SWOT 4분면 분석형] */}
          {activeTemplate === 'swot' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/40 text-emerald-100">
                <span className="text-xs font-bold font-mono tracking-widest text-emerald-400 block mb-1">STRENGTHS (강점)</span>
                <ul className="text-xs space-y-1.5 text-emerald-200">
                  <li>• 단일 지식 소스 기반 4대 포맷 실시간 동기화</li>
                  <li>• 사내 정보보안 규정 제45조 100% 준수 게이트웨이</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/20 border-2 border-amber-500/40 text-amber-100">
                <span className="text-xs font-bold font-mono tracking-widest text-amber-400 block mb-1">WEAKNESSES (약점)</span>
                <ul className="text-xs space-y-1.5 text-amber-200">
                  <li>• 기존 레거시 ERP 시스템과의 초기 연동 공수 필요</li>
                  <li>• 실무진의 생성형 AI 프롬프트 숙련도 격차</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-blue-950/20 border-2 border-blue-500/40 text-blue-100">
                <span className="text-xs font-bold font-mono tracking-widest text-cyan-400 block mb-1">OPPORTUNITIES (기회)</span>
                <ul className="text-xs space-y-1.5 text-blue-200">
                  <li>• 정부 공공 디지털 전환 지침 및 스마트 행정 가속화</li>
                  <li>• 문서 작성 공수 70% 절감으로 고부가가치 업무 집중</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-rose-950/20 border-2 border-rose-500/40 text-rose-100">
                <span className="text-xs font-bold font-mono tracking-widest text-rose-400 block mb-1">THREATS (위협)</span>
                <ul className="text-xs space-y-1.5 text-rose-200">
                  <li>• 외부 LLM API 트래픽 변동성 및 규제 강화</li>
                  <li>• 사내 폐쇄망 보안 감사 불시 점검 대응 필요</li>
                </ul>
              </div>
            </div>
          )}

          {/* 6. [시스템 에코시스템 맵] */}
          {activeTemplate === 'ecosystem-map' && (
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center space-y-4">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block">
                전사 지능형 에코시스템 아키텍처
              </span>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 w-full sm:w-1/4">
                  <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-white">사내 지식 DB</div>
                  <p className="text-[11px] text-zinc-400 mt-1">PDF, HWP, 노션 위키</p>
                </div>

                <ArrowRight className="w-5 h-5 text-zinc-600 hidden sm:block" />

                <div className="p-5 rounded-2xl bg-blue-950/50 border-2 border-cyan-400 w-full sm:w-1/3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Cpu className="w-8 h-8 text-cyan-300 mx-auto mb-2 animate-pulse" />
                  <div className="text-sm font-black text-white">AI 오피스 코어 엔진</div>
                  <p className="text-xs text-cyan-200 mt-1">Fact Grounding & 3-Way 파이프라인</p>
                </div>

                <ArrowRight className="w-5 h-5 text-zinc-600 hidden sm:block" />

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 w-full sm:w-1/4">
                  <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-white">4대 완제품 산출</div>
                  <p className="text-[11px] text-zinc-400 mt-1">기안서, 엑셀, 장표, 인포</p>
                </div>
              </div>
            </div>
          )}

          {/* 7. [ROI 경제성 분석형] */}
          {activeTemplate === 'roi-economic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase">3개년 누적 순이익 및 회수 기간</span>
                <h4 className="text-lg font-black text-white">투자 회수 기간: 4.8개월</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  초기 구축비 8,500만원 투자 대비, 첫해 연간 인건비 절감액 3.2억원으로 반기 이내에 전액 회수 가능합니다.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center font-mono">
                  <div className="p-2 rounded bg-zinc-900">
                    <span className="text-[10px] text-zinc-400 block">1년차</span>
                    <span className="text-xs font-bold text-emerald-400">+2.3억</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900">
                    <span className="text-[10px] text-zinc-400 block">2년차</span>
                    <span className="text-xs font-bold text-emerald-400">+4.8억</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900">
                    <span className="text-[10px] text-zinc-400 block">3년차</span>
                    <span className="text-xs font-bold text-emerald-400">+7.5억</span>
                  </div>
                </div>
              </div>

              <DonutProgressGauge
                value={92}
                size={160}
                title="ROI 달성 신뢰도 (92%)"
                subtitle="재무/회계 감사 검증 통과"
                secondaryValue={85}
                secondaryLabel="예산 무결성"
              />
            </div>
          )}

          {/* 8. [구글 웹 팩트 아카이브형] */}
          {activeTemplate === 'google-grounding' && (
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>실시간 구글 웹 검색 기반 팩트 아카이브 (27개 출처 연동)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  FACT GROUNDED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="font-bold text-white block">전자정부법 제32조</span>
                  <p className="text-[11px] text-zinc-400 mt-1">행정업무 디지털화 법적 타당성 검증</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="font-bold text-white block">정보보안 가이드 제45조</span>
                  <p className="text-[11px] text-zinc-400 mt-1">보안 게이트웨이 기술 표준 승인</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="font-bold text-white block">조달청 나라장터 단가</span>
                  <p className="text-[11px] text-zinc-400 mt-1">표준 SW 라이선스 계약 단가 일치</p>
                </div>
              </div>
            </div>
          )}

          {/* 9. [피라미드 위계 구조형] */}
          {activeTemplate === 'pyramid' && (
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-center max-w-xl mx-auto">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-3">
                3단 디지털 행정 위계 구조 피라미드
              </span>

              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md mx-auto w-3/5">
                [TOP] C레벨 1-Page 의사결정 & 대표이사 재가
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 text-white font-bold text-xs shadow-sm mx-auto w-4/5">
                [MID] 사내 규정 제45조 보안 거버넌스 & 4단 승인 라인
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-xs shadow-2xs mx-auto w-full">
                [BASE] Gemini Grounding 인프라 및 단일 골든 패스 지식 소스
              </div>
            </div>
          )}

          {/* 10. [모던 매거진 에디토리얼] */}
          {activeTemplate === 'editorial' && (
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="border-b-2 border-white pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 block uppercase">
                  ENTERPRISE AI SPECIAL REPORT • ISSUE #2026
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight mt-1">
                  행정의 단일 골든 패스: 분산된 도구의 종말
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-300 leading-relaxed">
                <p>
                  "도구의 분산은 곧 데이터의 왜곡을 의미한다." 기존 공문서 기안 과정에서 기안서, 수식 엑셀, 장표를 각각 따로 다루던 방식은 인간의 실수와 지연을 필연적으로 동반했습니다.
                </p>
                <p>
                  2026 오피스 스튜디오는 하나의 지식 소스에서 실시간으로 4대 완제품을 렌더링함으로써 공수 70% 단축과 100% 무결성을 실현하는 차세대 표준입니다.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>VERIFIED BY ARCHITECT HOLDINGS</span>
                <span>STATUS: FINAL APPROVED</span>
              </div>
            </div>
          )}

        </div>

        {/* 풋터 */}
        <div className="mt-8 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-500 relative z-10">
          <span>차세대 지능형 오피스 스튜디오 | 사내 공식 발표 인포그래픽</span>
          <span className="font-mono">Document Security: CONFIDENTIAL</span>
        </div>

      </div>

    </div>
  );
};
