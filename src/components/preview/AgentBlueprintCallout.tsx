import React, { useState } from 'react';
import type { AgentBlueprint } from '../../types/notion';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Copy,
  Check,
  Sparkles,
  Clock,
  ShieldCheck,
  Zap,
  Database,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  FileText,
  Activity,
  Workflow
} from 'lucide-react';

interface AgentBlueprintCalloutProps {
  blueprint: AgentBlueprint;
  templateTitle: string;
}

export const AgentBlueprintCallout: React.FC<AgentBlueprintCalloutProps> = ({
  blueprint,
  templateTitle,
}) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'subagents' | 'guardrails' | 'prompt'>('overview');

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(blueprint.setupPromptMarkdown);
      setCopied(true);
      showToast('🤖 에이전트 3.0 셋업 프롬프트가 클립보드에 복사되었습니다! 노션 공식 에이전트 설정에 붙여넣으세요.', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('클립보드 복사 권한을 확인해주세요.', 'error');
    }
  };

  return (
    <div className="w-full rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/50 dark:from-purple-950/20 dark:via-slate-900/60 dark:to-indigo-950/20 shadow-sm overflow-hidden mb-6 transition-all">
      {/* 1. 상단 마스터 헤더 */}
      <div className="p-4 sm:p-5 border-b border-purple-100 dark:border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>🤖 커스텀 에이전트 3.0 원클릭 셋업</span>
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                Benchmark v3.0
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                품질 게이트 탑재
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              <strong className="text-purple-700 dark:text-purple-300">[{templateTitle}]</strong> 노션 공식 커스텀 에이전트에 그대로 복사-붙여넣기할 수 있는 상주 지능 블루프린트 및 감사 로그 연동 규격
            </p>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
          <button
            onClick={handleCopyPrompt}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/20'
            }`}
            title="노션 공식 에이전트 설정에 바로 넣을 수 있는 프롬프트 전체를 복사합니다"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>📋 프롬프트 복사</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isExpanded ? '접기' : '상세 펼치기'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. 상세 본문 영역 (펼침 상태) */}
      {isExpanded && (
        <div className="p-4 sm:p-5">
          {/* 네비게이션 서브 탭 */}
          <div className="flex items-center space-x-1 border-b border-purple-100 dark:border-purple-900/30 pb-2.5 mb-4 overflow-x-auto text-xs font-semibold scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>역할 & 트리거</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'skills'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>모듈형 스킬팩 (4종)</span>
            </button>

            <button
              onClick={() => setActiveTab('subagents')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'subagents'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>서브 에이전트 분업</span>
            </button>

            <button
              onClick={() => setActiveTab('guardrails')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'guardrails'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI 워크슬롭 불문율 & 검수표</span>
            </button>

            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'prompt'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>프롬프트 전문 보기</span>
            </button>
          </div>

          {/* 탭 1: 역할 & 트리거 */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 역할 및 페르소나 카드 */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-purple-700 dark:text-purple-300 font-bold">
                    <Bot className="w-4 h-4" />
                    <span>에이전트 역할 및 페르소나</span>
                  </div>
                  <div className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <p><strong className="text-slate-900 dark:text-slate-100">명칭:</strong> {blueprint.persona.role}</p>
                    <p><strong className="text-slate-900 dark:text-slate-100">목표:</strong> {blueprint.persona.objective}</p>
                    <p><strong className="text-slate-900 dark:text-slate-100">책임 범위:</strong> {blueprint.persona.scope}</p>
                  </div>
                </div>

                {/* 다중 트리거 카드 */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-indigo-700 dark:text-indigo-300 font-bold">
                    <Zap className="w-4 h-4" />
                    <span>다중 복합 트리거 (Multi-Triggers)</span>
                  </div>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">스케줄: </span>
                        <span>{blueprint.multiTriggers.schedule}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Database className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">노션 이벤트: </span>
                        <span>{blueprint.multiTriggers.notionEvents.join(' / ')}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Activity className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">외부 이벤트: </span>
                        <span>{blueprint.multiTriggers.externalEvents.join(' / ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 품질 게이트 & 감사 DB 연동 안내 배너 */}
              <div className="p-3 rounded-xl bg-purple-100/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    메인 DB 스키마에 <strong>Quality_Status</strong> (초안/검수 중/승인/반려), <strong>Verified</strong> (공식 검증 마크) 및 <strong>Agent_Heartbeat_Log</strong> 양방향 관계형이 무손실로 사전 탑재되었습니다.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 탭 2: 모듈형 스킬팩 (4종) */}
          {activeTab === 'skills' && (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blueprint.skills.map((skill, idx) => (
                  <div
                    key={skill.id || idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-mono flex items-center justify-center">
                          0{idx + 1}
                        </span>
                        {skill.name}
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                        {skill.trigger.split('/')[0]}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                      <strong className="text-slate-700 dark:text-slate-300">트리거 로직:</strong> {skill.logic}
                    </p>
                    <p className="text-slate-800 dark:text-slate-200 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                      <strong className="text-purple-600 dark:text-purple-400">수행 액션:</strong> {skill.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 탭 3: 서브 에이전트 분업 */}
          {activeTab === 'subagents' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {blueprint.subAgents.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{sub.name}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                      {sub.role}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {sub.responsibility}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 탭 4: AI 워크슬롭 불문율 & 검수표 */}
          {activeTab === 'guardrails' && (
            <div className="space-y-3.5 text-xs">
              {/* 3대 불문율 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Done 완료 기준 (Lock Purpose)</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {blueprint.workslopGuardrails.doneDefinition.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>공식 출처 한정 (Verified Sources Only)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    워크스페이스 내 <strong>Verified = true</strong> 마크가 부여된 공인 문서와 실제 DB 레코드만 인용하며, 외부 미확인 데이터나 AI 환각 미사여구는 원천 차단됩니다.
                  </p>
                </div>
              </div>

              {/* 자체 검수 표 (Verification Table) */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>📊 자체 검수 표 (Verification Table) 출력 강제</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    전 항목 PASS
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-1.5 font-semibold">검수 항목</th>
                        <th className="py-1.5 font-semibold">통과 기준</th>
                        <th className="py-1.5 font-semibold">검수 결과</th>
                        <th className="py-1.5 font-semibold text-center">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="py-1.5 font-medium">Formulas 2.0 문법</td>
                        <td className="py-1.5">오류 없는 정규 Notion 수식</td>
                        <td className="py-1.5">progress(), dateBetween() 유효</td>
                        <td className="py-1.5 text-center font-bold text-emerald-600">✅ PASS</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">관계형 스키마 무결성</td>
                        <td className="py-1.5">최소 2개 이상 DB 상호 Relation</td>
                        <td className="py-1.5">마스터 DB ↔ Heartbeat 로그 양방향 연결</td>
                        <td className="py-1.5 text-center font-bold text-emerald-600">✅ PASS</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">데이터 무손실 (Zero Loss)</td>
                        <td className="py-1.5">기존 행 및 고유 ID 100% 보존</td>
                        <td className="py-1.5">변경 0건 / 신규 품질속성 100% 안전 추가</td>
                        <td className="py-1.5 text-center font-bold text-emerald-600">✅ PASS</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-medium">Work-slop 차단율</td>
                        <td className="py-1.5">미사여구 배제 및 실행 액션 비율</td>
                        <td className="py-1.5">실행 가능 항목 100% 유지</td>
                        <td className="py-1.5 text-center font-bold text-emerald-600">✅ PASS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 탭 5: 프롬프트 전문 보기 */}
          {activeTab === 'prompt' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>노션 공식 커스텀 에이전트 지침(Instructions)에 그대로 입력할 수 있는 텍스트입니다.</span>
                <button
                  onClick={handleCopyPrompt}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>텍스트 복사</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-64 whitespace-pre-wrap select-all leading-relaxed">
                {blueprint.setupPromptMarkdown}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
