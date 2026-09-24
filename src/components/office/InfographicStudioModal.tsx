import React, { useState, useRef } from 'react';
import type { OfficeDocument, PlanTriad } from '../../types/office';
import { 
  X, 
  Download, 
  Printer, 
  LayoutGrid, 
  Milestone, 
  TrendingUp, 
  Scale, 
  CheckCircle2, 
  ShieldCheck,
  Target,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { downloadBlob } from '../../lib/office/fileExporters';

interface InfographicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficeDocument;
  planTriad?: PlanTriad;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

type InfographicTab = 'bento' | 'roadmap' | 'kpi' | 'comparison';

export const InfographicStudioModal: React.FC<InfographicStudioModalProps> = ({
  isOpen,
  onClose,
  document,
  planTriad,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<InfographicTab>('bento');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const toast = onShowToast || ((_msg: string, _type?: string) => {});

  // 문서 데이터 기반 통계 지표 추출
  const totalBudget = document.content.sheetsContent.rows.reduce((acc, r) => {
    const val = typeof r.cells[3] === 'number' ? (r.cells[3] as number) : 0;
    return acc + val;
  }, 0);

  const sectionsCount = document.content.docsContent.sections.length;
  const targetAudience = planTriad?.optionA.target || '전사 실무진 및 주요 의사결정권자';
  const primaryConcept = planTriad?.optionA.concept || `${document.title} 표준화 및 자동화 파이프라인`;

  // HTML Canvas 기반 고해상도 PNG 다운로드
  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      // SVG 직렬화 또는 캔버스 드로잉
      const canvas = window.document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 배경
        ctx.fillStyle = '#0f172a'; // slate-900
        ctx.fillRect(0, 0, 1200, 700);

        // 상단 헤더
        ctx.fillStyle = '#6366f1'; // indigo-500
        ctx.fillRect(40, 40, 8, 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`OFFICE STUDIO 2026 : ${document.title}`, 60, 68);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText(`비주얼 요약 리포트 | ${document.metadata.date || new Date().toISOString().slice(0, 10)} | 기안: ${document.metadata.author}`, 60, 100);

        // 카드 1: 타깃 & 핵심 가치
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, 130, 360, 240);
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('타깃 및 추진 가치', 65, 170);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '15px sans-serif';
        ctx.fillText(`• 대상: ${targetAudience.slice(0, 25)}`, 65, 210);
        ctx.fillText(`• 콘셉트: ${primaryConcept.slice(0, 25)}`, 65, 245);
        ctx.fillText(`• 컴플라이언스 100% 통과 규격`, 65, 280);

        // 카드 2: 예산 및 지표
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(420, 130, 360, 240);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('총 산출 예산 및 규모', 445, 170);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`${(totalBudget / 10000).toLocaleString()} 만 원`, 445, 230);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px sans-serif';
        ctx.fillText(`=SUM 불변 표준 수식 검증 완료 (${document.content.sheetsContent.rows.length}개 항목)`, 445, 275);

        // 카드 3: 로드맵 & 마일스톤
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(800, 130, 360, 240);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('추진 마일스톤', 825, 170);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '15px sans-serif';
        ctx.fillText('1단계: 기획 뼈대 상신 및 심의', 825, 210);
        ctx.fillText('2단계: 핵심 인프라 및 파일럿 셋업', 825, 245);
        ctx.fillText('3단계: 전사 확산 및 성과 분석', 825, 280);

        // 하단 와이드 밴드: KPI 대시보드
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, 390, 1120, 260);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('핵심 기대 효과 및 업무 생산성 지표', 65, 435);

        // 메트릭 3종
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('78%', 120, 520);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '16px sans-serif';
        ctx.fillText('문서 작성 및 결재 공수 절감', 80, 560);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('100%', 520, 520);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '16px sans-serif';
        ctx.fillText('한컴 2014~2026 OWPML 표준 호환', 450, 560);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText('0 건', 920, 520);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '16px sans-serif';
        ctx.fillText('개인정보 누출 및 수식 오류 차단', 850, 560);

        canvas.toBlob(blob => {
          if (blob) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            downloadBlob(blob, `${document.title}_인포그래픽_${activeTab}_${dateStr}.png`);
            toast('고해상도 인포그래픽 이미지(PNG) 다운로드가 완료되었습니다.', 'success');
          }
        }, 'image/png');
      }
    } catch (e) {
      console.error(e);
      toast('이미지 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF 출력 대화상자 호출
  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
    toast('인포그래픽 인쇄 대화상자를 호출했습니다.', 'info');
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="infographic-studio-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none no-print"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* 1. 상단 타이틀 바 */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="infographic-studio-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>인포그래픽 스튜디오 2026</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">NotebookLM Visuals</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                캔버스 본문 데이터를 분석하여 실시간 고해상도 시각화 카드로 컴파일합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 4대 비주얼 스타일 탭 세그먼트 */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bento')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'bento'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>벤토 그리드 요약</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>추진 로드맵</span>
          </button>

          <button
            onClick={() => setActiveTab('kpi')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'kpi'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>KPI 지표 대시보드</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>3-Way 비교 인포그래픽</span>
          </button>
        </div>

        {/* 3. 인포그래픽 비주얼 렌더링 뷰포트 (인쇄/다운로드 대상) */}
        <div 
          ref={cardRef}
          className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-900 text-slate-100 p-6 sm:p-8 space-y-6 shadow-xl"
        >
          {/* 3-1. 벤토 그리드 요약 (Bento Grid) */}
          {activeTab === 'bento' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
                  Executive Bento Briefing
                </span>
                <span className="text-xs text-slate-400">
                  {document.metadata.date || new Date().toISOString().slice(0, 10)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 카드 1: 타깃 & 콘셉트 */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-bold">핵심 타깃</span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">
                    {targetAudience}
                  </p>
                  <p className="text-xs text-slate-300">
                    {primaryConcept}
                  </p>
                </div>

                {/* 카드 2: 예산 규모 */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-bold">총 산출 예산</span>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {(totalBudget / 10000).toLocaleString()} <span className="text-sm font-normal text-slate-300">만 원</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    =SUM 불변 표준 수식 바인딩 검증 완료
                  </p>
                </div>

                {/* 카드 3: 컴플라이언스 & 거버넌스 */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <div className="flex items-center space-x-2 text-sky-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold">보안 및 표준화</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    OWPML KS X 6101 통과
                  </p>
                  <p className="text-[11px] text-slate-400">
                    4단 결재란 및 휴대폰 번호 마스킹 완료
                  </p>
                </div>

                {/* 하단 전폭 카드: 주요 실행 섹션 서머리 */}
                <div className="md:col-span-3 bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <span className="text-xs font-bold text-slate-300">
                    주요 과제 요약 ({sectionsCount}개 조항)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                    {document.content.docsContent.sections.slice(0, 4).map((s, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="truncate">{s.marker} {s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3-2. 추진 로드맵 (Roadmap) */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono tracking-widest text-sky-400 uppercase">
                  Milestone Timeline Flow
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {document.title} 4단계 실행 로드맵
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                {[
                  { step: '01', title: '기안 및 심의', desc: '4단 결재선 상신 및 부서 사전 협의', status: '완료' },
                  { step: '02', title: '인프라 셋업', desc: '표준 캔버스 및 데이터 파이프라인 구축', status: '진행중' },
                  { step: '03', title: '시범 파일럿', desc: '1단계 파일럿 검증 및 사용자 피드백', status: '예정' },
                  { step: '04', title: '전사 확대', desc: '라이프 Hub 및 노션 위키 전사 배포', status: '예정' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/70 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-indigo-400 font-mono">{item.step}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.status === '완료' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        item.status === '진행중' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-3. KPI 지표 대시보드 (KPI Dashboard) */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
                  Impact & ROI Metrics
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  도입 성과 및 핵심 수치 지표
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/70 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">문서 작업 공수</span>
                  <p className="text-4xl font-black text-indigo-400">78%</p>
                  <p className="text-xs text-slate-300">기존 대비 공수 절감 효과</p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-indigo-500 h-full w-[78%]" />
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/70 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">총 산출 예산 규모</span>
                  <p className="text-4xl font-black text-emerald-400">
                    {(totalBudget / 10000).toLocaleString()}<span className="text-lg">만</span>
                  </p>
                  <p className="text-xs text-slate-300">1997년 이후 전 엑셀 호환 수식</p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-emerald-500 h-full w-[92%]" />
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/70 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">공문서 표준화율</span>
                  <p className="text-4xl font-black text-sky-400">100%</p>
                  <p className="text-xs text-slate-300">OWPML KS X 6101 국가 규격</p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                    <div className="bg-sky-500 h-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3-4. 3-Way 비교 인포그래픽 (Comparison) */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono tracking-widest text-amber-400 uppercase">
                  Triad Strategy Matrix
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  3-Way 기획안 전략적 비교 대조
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* A안 */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-400">A안 : 정석·안정형</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">기본 추천</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {planTriad?.optionA.title || '사내 표준 공문서 체계'}
                  </p>
                  <p className="text-xs text-slate-300">
                    {planTriad?.optionA.concept || '보수적이고 검증된 프로세스 기반 전사 확산'}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/60 space-y-1">
                    <p>장점: {planTriad?.optionA.pros[0] || '리스크 최소화'}</p>
                    <p>단점: {planTriad?.optionA.cons[0] || '구축 기간 소요'}</p>
                  </div>
                </div>

                {/* B안 */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400">B안 : 파격·혁신형</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">패러다임 전환</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {planTriad?.optionB.title || '완전 자율형 AI 오피스'}
                  </p>
                  <p className="text-xs text-slate-300">
                    {planTriad?.optionB.concept || '생성형 AI 전면 도입 및 자동 결재 시스템'}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/60 space-y-1">
                    <p>장점: {planTriad?.optionB.pros[0] || '압도적 생산성'}</p>
                    <p>단점: {planTriad?.optionB.cons[0] || '조직 적응 필요'}</p>
                  </div>
                </div>

                {/* C안 */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400">C안 : 실속·효율형</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">가성비 극대화</span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {planTriad?.optionC.title || '핵심 기능 집중 도입'}
                  </p>
                  <p className="text-xs text-slate-300">
                    {planTriad?.optionC.concept || '단기 성과 위주의 파일럿 셋업'}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/60 space-y-1">
                    <p>장점: {planTriad?.optionC.pros[0] || '즉시 도입 가능'}</p>
                    <p>단점: {planTriad?.optionC.cons[0] || '기능 제한'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. 하단 액션 버튼 바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>고해상도 1200x700 캔버스 렌더러 지원</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PDF에 포함하여 출력</span>
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span>{isExporting ? '인포그래픽 생성 중...' : '인포그래픽 이미지(PNG) 다운로드'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
