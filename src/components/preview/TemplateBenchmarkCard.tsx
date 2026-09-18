import React, { useState, useMemo } from 'react';
import type { NotionTemplate, NotionDatabase } from '../../types/notion';
import {
  Trophy,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Zap,
  Star,
  TrendingUp,
  CheckCircle2,
  Link2,
  Hash,
} from 'lucide-react';

// ─── 타입 ──────────────────────────────────────────────────────────────────────
interface BenchmarkFeature {
  label: string;
  icon: string;
  category: 'formula' | 'relation' | 'view' | 'automation' | 'unique';
  color: string;
  bgColor: string;
  borderColor: string;
}

// ─── 템플릿 분석 유틸리티 ─────────────────────────────────────────────────────
function analyzeTemplate(template: NotionTemplate): {
  dbCount: number;
  formulaCount: number;
  relationCount: number;
  viewTypes: string[];
  formulas: string[];
  relations: Array<{ from: string; to: string }>;
  features: BenchmarkFeature[];
  complexityScore: number;
} {
  const dbs = template.databases || [];
  const dbCount = dbs.length;

  const formulas: string[] = [];
  const relations: Array<{ from: string; to: string }> = [];
  const viewTypes: Set<string> = new Set();

  dbs.forEach((db: NotionDatabase) => {
    if (db.view_type) viewTypes.add(db.view_type);
    db.properties?.forEach((prop) => {
      if (prop.type === 'formula' && prop.expression) {
        formulas.push(prop.expression);
      }
      if (prop.type === 'relation' && prop.target) {
        relations.push({ from: db.name, to: prop.target });
      }
    });
  });

  // 핵심 기능 태그 생성
  const features: BenchmarkFeature[] = [];

  // 다중 DB Relation
  if (relations.length > 0) {
    features.push({
      label: `${relations.length}개 DB Relation 연동`,
      icon: '🔗',
      category: 'relation',
      color: 'text-indigo-700 dark:text-indigo-300',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      borderColor: 'border-indigo-200 dark:border-indigo-800/60',
    });
  }

  // Formulas 2.0
  if (formulas.length > 0) {
    features.push({
      label: `Formula 2.0 × ${formulas.length}개 수식`,
      icon: '⚡',
      category: 'formula',
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-200 dark:border-amber-800/60',
    });
  }

  // 복수 뷰
  const viewArr = Array.from(viewTypes);
  if (viewArr.length > 1) {
    features.push({
      label: `${viewArr.length}종 뷰 (${viewArr.join(', ')})`,
      icon: '🎨',
      category: 'view',
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    });
  }

  // DB 개수
  if (dbCount >= 3) {
    features.push({
      label: `${dbCount}중 연동 데이터베이스`,
      icon: '🗄️',
      category: 'unique',
      color: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      borderColor: 'border-purple-200 dark:border-purple-800/60',
    });
  }

  // 복잡도 점수 (0 ~ 100)
  const complexityScore = Math.min(
    100,
    dbCount * 10 + formulas.length * 15 + relations.length * 12 + viewArr.length * 8
  );

  return {
    dbCount,
    formulaCount: formulas.length,
    relationCount: relations.length,
    viewTypes: viewArr,
    formulas,
    relations,
    features,
    complexityScore,
  };
}

// ─── 시중 일반 템플릿 대비 추가 기능 비교표 ──────────────────────────────────
const MARKET_BASELINE_FEATURES = [
  { label: '단순 텍스트/할일 목록', hasBaseline: true, hasOurs: true, icon: '✅' },
  { label: '다중 DB Relation 연동', hasBaseline: false, hasOurs: true, icon: '🔗' },
  { label: 'Formula 2.0 자동화 수식', hasBaseline: false, hasOurs: true, icon: '⚡' },
  { label: '복수 뷰 타입 지원', hasBaseline: false, hasOurs: true, icon: '🎨' },
  { label: 'AI 생성 샘플 데이터', hasBaseline: false, hasOurs: true, icon: '🤖' },
  { label: '즉시 노션 배포 지원', hasBaseline: false, hasOurs: true, icon: '🚀' },
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
interface TemplateBenchmarkCardProps {
  template: NotionTemplate;
}

export const TemplateBenchmarkCard: React.FC<TemplateBenchmarkCardProps> = ({ template }) => {
  const [isOpen, setIsOpen] = useState(false);
  const analysis = useMemo(() => analyzeTemplate(template), [template]);

  const scoreColor =
    analysis.complexityScore >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : analysis.complexityScore >= 40
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-neutral-500';

  const scoreBarColor =
    analysis.complexityScore >= 70
      ? 'bg-emerald-500'
      : analysis.complexityScore >= 40
      ? 'bg-amber-500'
      : 'bg-neutral-400';

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-neutral-900 dark:to-amber-950/20 shadow-sm">

      {/* ── 아코디언 헤더 (클릭하여 펼치기) ─────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-black text-amber-800 dark:text-amber-300 tracking-wide">
              💡 상용 베스트셀러 대비 고도화 분석
            </div>
            <div className="text-[10px] text-amber-600/70 dark:text-amber-500/70">
              Template Value-Add Benchmark
            </div>
          </div>

          {/* 미니 특징 뱃지 요약 (접힌 상태에서도 가시) */}
          <div className="hidden sm:flex items-center gap-1 ml-1">
            {analysis.formulaCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ⚡ F×{analysis.formulaCount}
              </span>
            )}
            {analysis.relationCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                🔗 R×{analysis.relationCount}
              </span>
            )}
            {analysis.dbCount > 1 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                🗄️ DB×{analysis.dbCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* 복잡도 스코어 */}
          <span className={`text-[11px] font-black ${scoreColor}`}>
            {analysis.complexityScore}pt
          </span>
          {isOpen
            ? <ChevronDown className="w-4 h-4 text-amber-500" />
            : <ChevronRight className="w-4 h-4 text-amber-500" />
          }
        </div>
      </button>

      {/* ── 아코디언 본문 ─────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 text-xs border-t border-amber-100 dark:border-amber-900/40 pt-3">

          {/* 1. 고도화 점수 바 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>고도화 복잡도 지수</span>
              </span>
              <span className={`font-black text-sm ${scoreColor}`}>
                {analysis.complexityScore}<span className="text-[10px] font-normal">/100</span>
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreBarColor} transition-all duration-700`}
                style={{ width: `${analysis.complexityScore}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-neutral-500">
              {analysis.complexityScore >= 70
                ? '🏆 엔터프라이즈급 — 시중 상위 5% 템플릿과 동급'
                : analysis.complexityScore >= 40
                ? '⭐ 고급형 — 시중 유료 템플릿 수준'
                : '📋 표준형 — 일반 무료 템플릿 수준'}
            </p>
          </div>

          {/* 2. 핵심 기능 태그 */}
          {analysis.features.length > 0 && (
            <div>
              <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>탑재된 핵심 고급 기능</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.features.map((feat, i) => (
                  <span
                    key={i}
                    className={`
                      inline-flex items-center space-x-1
                      px-2.5 py-1 rounded-xl
                      text-[11px] font-bold border
                      ${feat.bgColor} ${feat.borderColor} ${feat.color}
                    `}
                  >
                    <span>{feat.icon}</span>
                    <span>{feat.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Formula 수식 뱃지 목록 */}
          {analysis.formulas.length > 0 && (
            <div>
              <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>적용된 Formula 2.0 수식</span>
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {analysis.formulas.map((expr, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-neutral-950 border border-slate-700 dark:border-neutral-700"
                  >
                    <Hash className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <code className="text-[10px] text-emerald-300 dark:text-emerald-400 font-mono break-all leading-relaxed">
                      {expr}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. DB Relation 맵 */}
          {analysis.relations.length > 0 && (
            <div>
              <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center space-x-1">
                <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                <span>다중 DB 관계형 구조 맵</span>
              </p>
              <div className="space-y-1.5">
                {analysis.relations.map((rel, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50"
                  >
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 truncate max-w-[40%]">
                      {rel.from}
                    </span>
                    <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 truncate max-w-[40%]">
                      {rel.to}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. 시중 일반 템플릿 대비 비교표 */}
          <div>
            <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>시중 일반 템플릿 대비 추가된 핵심 기능</span>
            </p>
            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
              {/* 헤더 */}
              <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-2">
                <span>기능</span>
                <span className="text-center px-3">시중 일반</span>
                <span className="text-center px-3">이 템플릿</span>
              </div>
              {/* 행 */}
              {MARKET_BASELINE_FEATURES.map((feat, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1fr_auto_auto] items-center px-3 py-2 text-[11px] ${
                    i % 2 === 0
                      ? 'bg-white dark:bg-neutral-900'
                      : 'bg-neutral-50/60 dark:bg-neutral-800/40'
                  }`}
                >
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    {feat.icon} {feat.label}
                  </span>
                  <span className="text-center px-3">
                    {feat.hasBaseline
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      : <span className="text-neutral-300 dark:text-neutral-600 font-bold">✗</span>
                    }
                  </span>
                  <span className="text-center px-3">
                    {feat.hasOurs
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                      : <span className="text-neutral-300 dark:text-neutral-600 font-bold">✗</span>
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
