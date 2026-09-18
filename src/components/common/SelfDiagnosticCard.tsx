import React, { useState } from 'react';
import {
  Search,
  ClipboardList,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Terminal,
  Zap,
} from 'lucide-react';

// ─── 진단 결과 인터페이스 ──────────────────────────────────────────────────────
export interface DiagnosticResult {
  /** 결함 분류 라벨 (예: "CORS 정책 위반", "Auth 토큰 만료") */
  error_class: string;
  /** 근본 원인 1-2문장 */
  root_cause: string;
  /** 심각도 레벨 */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** 재현 조건 */
  reproduction?: string;
  /** 안티그래비티 조치 프롬프트 (코드블록에 표시 + 복사 대상) */
  fix_prompt: string;
  /** 관련 파일 또는 컴포넌트 힌트 */
  affected_files?: string[];
  /** 예상 해결 난이도 */
  effort?: 'low' | 'medium' | 'high';
}

interface SelfDiagnosticCardProps {
  diagnostic: DiagnosticResult;
  /** 메시지 타임스탬프 */
  timestamp?: string;
}

const SEVERITY_META: Record<
  DiagnosticResult['severity'],
  { label: string; badgeCls: string; barCls: string; icon: React.ReactNode }
> = {
  critical: {
    label: '치명적',
    badgeCls: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
    barCls: 'bg-red-500',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  },
  high: {
    label: '높음',
    badgeCls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    barCls: 'bg-orange-500',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />,
  },
  medium: {
    label: '중간',
    badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    barCls: 'bg-amber-400',
    icon: <Wrench className="w-3.5 h-3.5 text-amber-500" />,
  },
  low: {
    label: '낮음',
    badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barCls: 'bg-emerald-400',
    icon: <Wrench className="w-3.5 h-3.5 text-emerald-500" />,
  },
};

const EFFORT_LABEL: Record<NonNullable<DiagnosticResult['effort']>, string> = {
  low: '⚡ 즉시 해결 가능',
  medium: '🔧 30분 내 해결',
  high: '🏗️ 심층 분석 필요',
};

export const SelfDiagnosticCard: React.FC<SelfDiagnosticCardProps> = ({
  diagnostic,
  timestamp,
}) => {
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(true);

  const severity = SEVERITY_META[diagnostic.severity];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagnostic.fix_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: execCommand
      const el = document.createElement('textarea');
      el.value = diagnostic.fix_prompt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="
      w-full rounded-2xl overflow-hidden
      border border-slate-200 dark:border-neutral-700
      bg-white dark:bg-neutral-900
      shadow-sm
      text-xs
    ">
      {/* ── 카드 헤더 ──────────────────────────────────────────────────────── */}
      <div className="
        flex items-center justify-between
        px-4 py-3
        bg-gradient-to-r from-slate-800 via-neutral-900 to-slate-800
        dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950
      ">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-[11px] font-black text-white tracking-wide">
              🛠️ 시스템 엔지니어 자체 진단 카드
            </div>
            <div className="text-[10px] text-neutral-400">
              Self-Diagnostic Prompt Card
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* 심각도 배지 */}
          <span className={`
            inline-flex items-center space-x-1
            px-2 py-0.5 rounded-full
            text-[10px] font-bold border
            ${severity.badgeCls}
          `}>
            {severity.icon}
            <span>{severity.label}</span>
          </span>
          {timestamp && (
            <span className="text-[10px] text-neutral-500">{timestamp}</span>
          )}
        </div>
      </div>

      {/* ── 결함 분류 타이틀 바 ─────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-neutral-900 dark:text-white text-[12px]">
            {diagnostic.error_class}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {diagnostic.effort && (
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
              {EFFORT_LABEL[diagnostic.effort]}
            </span>
          )}
          {/* 심각도 바 */}
          <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${severity.barCls} transition-all`}
              style={{
                width:
                  diagnostic.severity === 'critical' ? '100%'
                  : diagnostic.severity === 'high' ? '75%'
                  : diagnostic.severity === 'medium' ? '50%'
                  : '25%',
              }}
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-neutral-800">

        {/* ── 섹션 1: 결함 진단 및 원인 분석 ─────────────────────────────── */}
        <div>
          <button
            onClick={() => setAnalysisOpen(!analysisOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition text-left"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px]">
                🔍 결함 진단 및 원인 분석
              </span>
            </div>
            {analysisOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            }
          </button>

          {analysisOpen && (
            <div className="px-4 pb-4 space-y-3">
              {/* 근본 원인 */}
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">📌 근본 원인</p>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {diagnostic.root_cause}
                </p>
              </div>

              {/* 재현 조건 */}
              {diagnostic.reproduction && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">🔁 재현 조건</p>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {diagnostic.reproduction}
                  </p>
                </div>
              )}

              {/* 영향 파일 */}
              {diagnostic.affected_files && diagnostic.affected_files.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                    📂 영향 컴포넌트/파일
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnostic.affected_files.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-[10px] border border-neutral-200/60 dark:border-neutral-700/60"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 섹션 2: 안티그래비티 조치 프롬프트 ─────────────────────────── */}
        <div>
          <button
            onClick={() => setPromptOpen(!promptOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition text-left"
          >
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-[11px]">
                📋 안티그래비티 조치 프롬프트
              </span>
            </div>
            {promptOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            }
          </button>

          {promptOpen && (
            <div className="px-4 pb-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-700">
                {/* 코드 블록 헤더 */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 dark:bg-neutral-950">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[10px] text-neutral-500 font-mono">fix_prompt.txt</span>
                  </div>

                  {/* 원클릭 복사 버튼 */}
                  <button
                    onClick={handleCopy}
                    className={`
                      flex items-center space-x-1.5
                      px-2.5 py-1 rounded-lg
                      text-[11px] font-bold
                      transition active:scale-95
                      ${copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                    `}
                    title="프롬프트를 클립보드에 복사합니다"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>📋 원클릭 프롬프트 복사</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 프롬프트 코드 */}
                <pre className="
                  p-4 overflow-x-auto
                  bg-slate-950 dark:bg-neutral-950
                  text-emerald-300 dark:text-emerald-400
                  text-[11px] leading-relaxed
                  font-mono
                  whitespace-pre-wrap break-words
                  max-h-64
                ">
                  {diagnostic.fix_prompt}
                </pre>
              </div>

              {/* 복사 성공 토스트 힌트 */}
              {copied && (
                <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-fadeIn">
                  <Zap className="w-3 h-3" />
                  <span>클립보드에 복사되었습니다! 안티그래비티 또는 Gemini에 바로 붙여넣으세요.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 헬퍼: 오케스트레이터 페이로드 → DiagnosticResult 변환 ─────────────────
export function payloadToDiagnostic(
  payload: Record<string, any>,
  fallbackTitle?: string
): DiagnosticResult {
  return {
    error_class: payload?.error_class || payload?.title || fallbackTitle || '시스템 오류 감지',
    root_cause: payload?.root_cause || payload?.content || '원인을 분석 중입니다...',
    severity: payload?.severity || 'medium',
    reproduction: payload?.reproduction,
    fix_prompt: payload?.fix_prompt || payload?.content || '이 오류에 대한 해결 방법을 안티그래비티에서 찾아드립니다.',
    affected_files: payload?.affected_files || payload?.files || undefined,
    effort: payload?.effort,
  };
}
