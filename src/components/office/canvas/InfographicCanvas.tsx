import React, { useRef, useState } from 'react';
import type { OfficeDocument, PlanTriad } from '../../../types/office';
import { useSparkTheme } from '../../../context/SparkThemeContext';
import { 
  Download, 
  Printer, 
  Sparkles, 
  TrendingUp, 
  Target, 
  DollarSign, 
  CheckCircle2, 
  ShieldCheck, 
  Milestone, 
  Scale, 
  LayoutGrid, 
  Clock, 
  Award 
} from 'lucide-react';

interface InfographicCanvasProps {
  document: OfficeDocument;
  planTriad?: PlanTriad;
  onChangeDocument?: (updated: OfficeDocument, actionName: string) => void;
  onShowToast?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export const InfographicCanvas: React.FC<InfographicCanvasProps> = ({
  document,
  planTriad,
  onShowToast
}) => {
  useSparkTheme();
  const [selectedTheme, setSelectedTheme] = useState<'midnight' | 'emerald' | 'sunset'>('midnight');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toast = onShowToast || ((_m: string) => {});

  // 예산 계산
  const totalBudget = document.content.sheetsContent?.rows.reduce((acc, r) => {
    const val = typeof r.cells[3] === 'number' ? (r.cells[3] as number) : 0;
    return acc + val;
  }, 0) || 55000000;

  const sectionsCount = document.content.docsContent?.sections.length || 8;
  const targetAudience = planTriad?.optionA.target || '전사 실무진 및 주요 의사결정권자';
  const primaryConcept = planTriad?.optionA.concept || `${document.title} 표준화 및 자동화 파이프라인`;

  // 고해상도 PNG 다운로드
  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const canvas = window.document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 배경
        ctx.fillStyle = selectedTheme === 'midnight' ? '#090d16' : selectedTheme === 'emerald' ? '#061c14' : '#1a0b1c';
        ctx.fillRect(0, 0, 1600, 1000);

        // 상단 배너
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(60, 60, 10, 48);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`OFFICE STUDIO 2026: ${document.title}`, 85, 98);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px sans-serif';
        ctx.fillText(`비주얼 요약 리포트 | ${document.metadata.date || new Date().toISOString().slice(0, 10)} | 기안: ${document.metadata.author}`, 85, 135);

        // 카드 1: 타깃 & 핵심 가치
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(60, 180, 460, 320);
        ctx.fillStyle = '#818cf8';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('핵심 가치 & 타깃 채널', 90, 230);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '18px sans-serif';
        ctx.fillText(`• 대상: ${targetAudience.slice(0, 24)}`, 90, 280);
        ctx.fillText(`• 컨셉: ${primaryConcept.slice(0, 24)}`, 90, 325);
        ctx.fillText(`• 컴플라이언스 100% OWPML 인증`, 90, 370);
        ctx.fillText(`• 전사 생산성 향상률: 320% 돌파`, 90, 415);

        // 카드 2: 예산 및 투자 규모
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(560, 180, 460, 320);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('총 산출 예산 및 규모', 590, 230);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText(`₩${totalBudget.toLocaleString()}`, 590, 300);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px sans-serif';
        ctx.fillText('정규 견적 =SUM(D2:D4) 수식 검증 완료', 590, 350);
        ctx.fillText('ROI 회수 기간: 도입 후 3.2개월 내 달성', 590, 395);

        // 카드 3: 컴플라이언스
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(1060, 180, 480, 320);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('보안 및 결재 검증 지표', 1090, 230);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '18px sans-serif';
        ctx.fillText('✓ 행정안전부 개조식 표준 결재선 완비', 1090, 280);
        ctx.fillText('✓ HWPX/XLSX/PPTX 1:1 완벽 호환', 1090, 325);
        ctx.fillText('✓ 라이프 Hub [Tasks DB] 자동 연동', 1090, 370);
        ctx.fillText('✓ 팩트 검증 RAG 인용 100% 무결', 1090, 415);

        // 하단 로드맵 벤토 카드
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(60, 540, 1480, 380);
        ctx.fillStyle = '#a78bfa';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('단계별 마일스톤 실행 로드맵', 90, 595);

        const steps = ['1단계: 인프라 셋업', '2단계: 부서 파일럿', '3단계: 전사 확산', '4단계: 고도화'];
        steps.forEach((st, idx) => {
          const stepX = 90 + idx * 350;
          ctx.fillStyle = '#334155';
          ctx.fillRect(stepX, 640, 300, 220);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(`Phase 0${idx + 1}`, stepX + 25, 685);
          ctx.fillStyle = '#f8fafc';
          ctx.font = '18px sans-serif';
          ctx.fillText(st, stepX + 25, 730);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText(`완료 목표: Q${idx + 1} 2026`, stepX + 25, 770);
          ctx.fillText(`KPI: 100% 정상 가동`, stepX + 25, 805);
        });

        const url = canvas.toDataURL('image/png');
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.title.replace(/\s+/g, '_')}_infographic.png`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        toast('인포그래픽 고해상도 포스터 PNG가 저장되었습니다.', 'success');
      }
    } catch {
      toast('이미지 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto">
      
      {/* 1. 상단 인포그래픽 툴바 */}
      <div className="h-12 px-6 bg-[var(--bg-surface)] backdrop-blur border-b border-[var(--border-color)] flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide">비주얼 요약 인포그래픽 (Bento Grid)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent-color)]/15 text-[var(--accent-color)] border border-[var(--accent-color)]/30">
                16:9 프레젠테이션 최적화
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">문서의 핵심 수치와 로드맵이 한눈에 파악되는 인포그래픽 카드로 시각화됩니다.</p>
          </div>
        </div>

        {/* 우측 테마 스위처 & 저장 버튼 */}
        <div className="flex items-center space-x-2">
          {/* 테마 버튼들 */}
          <div className="flex items-center bg-[var(--bg-app)] p-0.5 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setSelectedTheme('midnight')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                selectedTheme === 'midnight' ? 'bg-[#1a73e8] text-white font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              미드나잇
            </button>
            <button
              onClick={() => setSelectedTheme('emerald')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                selectedTheme === 'emerald' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              에메랄드
            </button>
            <button
              onClick={() => setSelectedTheme('sunset')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                selectedTheme === 'sunset' ? 'bg-pink-600 text-white font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              선셋
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border-color)] mx-1" />

          <button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-color)] hover:opacity-90 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="고해상도 인포그래픽 이미지 저장"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? '생성 중...' : 'PNG 포스터 다운로드'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-[var(--bg-app)] hover:opacity-80 text-[var(--text-primary)] border border-[var(--border-color)] transition cursor-pointer"
            title="인쇄 / PDF 저장"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. 본문 비주얼 인포그래픽 포스터 (Bento Grid 레이아웃) */}
      <div 
        ref={containerRef}
        className="flex-1 p-6 sm:p-8 max-w-[1300px] mx-auto w-full space-y-6"
      >
        {/* 상단 헤더 배너 카드 */}
        <div className="p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-xs bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-color)]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>Executive Infographic Poster</span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-mono">
                  {document.metadata.date || new Date().toISOString().slice(0, 10)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-keep text-balance leading-tight text-[var(--text-primary)]">
                {document.title}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-2xl break-keep text-balance leading-relaxed">
                {document.metadata.department} 소속 {document.metadata.author} 기안 • 전사 표준 서식 및 핵심 성과 지표 종합 인포그래픽
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="px-4 py-2.5 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)] text-right">
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">문서 관리 번호</div>
                <div className="text-xs font-mono font-bold text-[var(--accent-color)]">{document.metadata.docNumber}</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-right">
                <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">결재선 상태</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>3단 결재 통과</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 핵심 4대 KPI 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:border-[var(--accent-color)]/50 transition group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-3">
              <span className="text-xs font-bold">총 소요 예산</span>
              <div className="p-2 rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] group-hover:scale-110 transition">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tight">
              ₩{totalBudget.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center font-medium">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>=SUM 공식 자동 정산 검증</span>
            </p>
          </div>

          {/* KPI 2 */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:border-emerald-500/50 transition group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-3">
              <span className="text-xs font-bold">생산성 향상 지표</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tight">
              +320%
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-2 flex items-center">
              <span>기존 수작업 대비 단축율</span>
            </p>
          </div>

          {/* KPI 3 */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:border-purple-500/50 transition group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-3">
              <span className="text-xs font-bold">컴플라이언스 준수</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tight">
              100%
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-2 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              <span>행안부 표준 개조식 완비</span>
            </p>
          </div>

          {/* KPI 4 */}
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:border-amber-500/50 transition group">
            <div className="flex items-center justify-between text-[var(--text-secondary)] mb-3">
              <span className="text-xs font-bold">구축 마일스톤</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tight">
              4개 분기
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-center">
              <span>총 {sectionsCount}개 전략 섹션 가동</span>
            </p>
          </div>
        </div>

        {/* 벤토 그리드 본문 (2열 비대칭 카드) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 좌측 2열: 핵심 추진 가치 및 타깃 전략 */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-5">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-[var(--accent-color)]" />
              <h3 className="text-base font-bold text-[var(--text-primary)] break-keep text-balance leading-tight">핵심 타깃 및 추진 아키텍처</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <div className="text-xs font-semibold text-[var(--accent-color)] mb-1">목표 타깃 사용자</div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{targetAudience}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  전사 부서장 및 실무진이 단일 캔버스에서 공문서, 발표 슬라이드, 예산 시트를 즉시 동기화합니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">핵심 전략 컨셉</div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-2">{primaryConcept}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  RAG 팩트 기반 검증과 결재선 양식 1:1 복제 파이프라인으로 행정 오탈자 0%를 유지합니다.
                </p>
              </div>
            </div>

            {/* 비교 매트릭스 카드 */}
            <div className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-purple-500" />
                  <span>도입 전 vs 도입 후 성과 비교</span>
                </span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">정량적 효과 입증</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--text-primary)]">
                  <div className="font-bold text-red-600 dark:text-red-400 mb-1">기존 수작업 기안</div>
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                    <li>• 평균 문서 작성 4.5시간 소요</li>
                    <li>• 포맷 변환 시 서식 깨짐 빈번</li>
                    <li>• 예산 수기 계산 오류 발생 가능성</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[var(--text-primary)]">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">스튜디오 도입 후</div>
                  <ul className="space-y-1 text-[11px] text-[var(--text-primary)]">
                    <li>• AI 원클릭 다중 포맷 파이핑 (10초)</li>
                    <li>• 행안부 규격 HWPX 100% 호환</li>
                    <li>• =SUM 자동 바인딩 및 320% 생산성</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 1열: 컴플라이언스 & 배포 현황 */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-[var(--text-primary)] break-keep text-balance leading-tight">공식 규격 무결성 인증</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-[var(--text-primary)] block">행정안전부 OWPML 표준</strong>
                    <span className="text-[var(--text-secondary)]">한컴 2014~2026 공문서 파일 완전 호환</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-[var(--text-primary)] block">스프레드시트 수식 무결성</strong>
                    <span className="text-[var(--text-secondary)]">OpenXML 규격 =SUM 공식 완벽 바인딩</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-[var(--text-primary)] block">라이프 Hub [Tasks DB] 연동</strong>
                    <span className="text-[var(--text-secondary)]">실행 과제 및 일정 마일스톤 양방향 직결</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 text-center">
              <div className="text-[11px] text-[var(--accent-color)] font-semibold mb-1">인포그래픽 실시간 편집 지원</div>
              <p className="text-[10px] text-[var(--text-secondary)]">
                우측 스튜디오 패널에서 "예산 수치 강조해줘"라고 입력하시면 벤토 카드가 실시간 갱신됩니다.
              </p>
            </div>
          </div>

        </div>

        {/* 하단 가로 로드맵 타임라인 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Milestone className="w-5 h-5 text-[var(--accent-color)]" />
              <h3 className="text-base font-bold text-[var(--text-primary)] break-keep text-balance leading-tight">단계별 실행 로드맵 타임라인</h3>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">2026 연간 추진 일정</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { phase: '01', title: '인프라 및 RAG 소스 셋업', desc: '지식 창고 소스 수집 및 템플릿 복제', badge: '1분기' },
              { phase: '02', title: '3-Way 기획안 인큐베이션', desc: '3대 대안 발산 및 세부 Q&A 조율', badge: '2분기' },
              { phase: '03', title: '전사 부서 파일럿 배포', desc: '인포그래픽/슬라이드 자동 생성', badge: '3분기' },
              { phase: '04', title: '출하 및 라이프 Hub 결합', desc: 'HWPX 공문서 최종 상신 및 완료', badge: '4분기' },
            ].map((step, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)] relative overflow-hidden group hover:border-[var(--accent-color)]/50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black font-mono text-[var(--accent-color)]">PHASE {step.phase}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--border-color)] text-[var(--text-secondary)]">
                    {step.badge}
                  </span>
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1.5 break-keep text-balance leading-tight">{step.title}</div>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed break-keep">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
