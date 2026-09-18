import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Terminal, 
  Lightbulb, 
  Bug, 
  Bookmark, 
  ArrowLeft, 
  Copy, 
  Check
} from 'lucide-react';

type DevLabTab = 'idea' | 'troubleshooting' | 'prompts';

export const DevLabPage: React.FC = () => {
  const { setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState<DevLabTab>('idea');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ideas = [
    {
      id: 'i1',
      title: 'Notion Formula 2.0 실시간 인터프리터 & 유효성 검사기',
      desc: '사용자가 작성한 if(), prop() 수식이 노션 API에 전달되기 전 문법 오류를 사전에 감지하고 교정 제안',
      tags: ['수식', 'Formula2.0', 'AST'],
      date: '2026-09-18'
    },
    {
      id: 'i2',
      title: 'Gemini 3.6 Flash 기반 멀티모달 아키텍처 다이어그램 자동 생성',
      desc: 'Mermaid.js 코드 블록을 노션 페이지에 임베드하여 개발 시스템 구성도를 시각화',
      tags: ['AI', 'Mermaid', 'VisualGuide'],
      date: '2026-09-17'
    },
    {
      id: 'i3',
      title: '로컬 SQLite 캐시와 노션 원격 DB 양방향 오프라인 동기화',
      desc: '비행기 모드나 모바일 네트워크 단절 시에도 1초 퀵 캡처 기록을 보존하고 복구 시 자동 푸시',
      tags: ['Offline', 'PWA', 'IndexedDB'],
      date: '2026-09-16'
    }
  ];

  const troubleshootLogs = [
    {
      id: 'tr1',
      issue: 'Gemini API 404: models/gemini-2.0-flash is no longer available',
      cause: 'Google API v1beta 엔드포인트에서 2.0 모델 지원 종료, 최신 공식 모델 gemini-3.6-flash 요구',
      solution: '서버리스 프록시 내부 다단계 Fallback 구축 및 정규식 추천 모델 자동 감지 적용',
      status: '해결 완료 ✅',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    },
    {
      id: 'tr2',
      issue: 'Notion Database Formula 속성 생성 시 400 Validation Error',
      cause: '노션 API v2022-06-28에서는 DB 스키마 생성 시 formula expression 작성이 제한적임',
      solution: '기본 속성 생성 후 페이지 개별 행 생성 시 계산된 텍스트 필드로 병행 기록 폴백',
      status: '해결 완료 ✅',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    },
    {
      id: 'tr3',
      issue: '모바일 브라우저에서 SpeechRecognition 끊김 현상',
      cause: '모바일 OS의 백그라운드 오디오 절전 정책으로 인한 인터벌 타임아웃',
      solution: 'onerror 핸들러에서 자동 재연결 및 침묵 감지 후 1초 자동 전송 루프 도입',
      status: '진행 중 ⚡',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    }
  ];

  const prompts = [
    {
      id: 'p1',
      title: '노션 템플릿 마스터 아키텍트 시스템 프롬프트',
      target: 'Gemini 3.6 Flash',
      content: `당신은 'Notion AI Master Builder'의 총괄 전담 시스템 컨트롤러입니다.
사용자의 요구사항을 엄격히 분석하여 다음 2가지 모드로 분기 응답하세요:
모드 A: 사용법 조언 및 일반 질문 -> 친절한 한국어 마크다운 가이드
모드 B: 템플릿 제작 명령 -> 순수 JSON 규격 (CREATE_NEW / PATCH_UPDATE)`
    },
    {
      id: 'p2',
      title: '1초 퀵 캡처 멀티 인텐트 분할 라우터 프롬프트',
      target: 'Gemini 3.6 Flash Routing',
      content: `당신은 모바일 생산성 및 노션 데이터베이스 자동 분류 라우팅 전문가입니다.
자연어 메모나 음성 텍스트를 맞춤법 교정 후 [schedule, expense, todo, contact, idea, general] 6개 인텐트로 독립 분할하세요.`
    },
    {
      id: 'p3',
      title: '스마트 사서 (Workspace RAG 팩트 브리핑)',
      target: 'Gemini 3.6 Flash Grounding',
      content: `노션 워크스페이스에서 검색된 블록 텍스트만을 사실에 기반하여 요약하고 허위 정보(Hallucination)를 절대 말하지 마세요. 문서 출처 링크를 명확히 첨부하세요.`
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-notion-dark-bg/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>홈으로</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">💻</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">개발 랩 (Dev Lab)</h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">개발자 아이디어 기획, 버그 트러블슈팅 일지, AI 프롬프트 라이브러리</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
            <Terminal className="w-3.5 h-3.5" />
            <span>v2.0 Dev Studio</span>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6">
        {/* 3대 서브 탭 스위처 */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-200/60 dark:bg-neutral-800/60 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/60">
          <button
            onClick={() => setActiveTab('idea')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'idea'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>기획 & 아이디어</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">3</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'troubleshooting'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Bug className="w-4 h-4 text-rose-500" />
            <span>트러블슈팅 일지</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">최근</span>
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'prompts'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 text-blue-500" />
            <span>프롬프트 보관함</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">3종</span>
          </button>
        </div>

        {/* 탭별 메인 컨텐츠 영역 */}
        <div className="bg-white dark:bg-notion-dark-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* 1. 기획 & 아이디어 */}
          {activeTab === 'idea' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <span>개발 기획 및 백로그</span>
                  </h2>
                  <p className="text-xs text-neutral-500">프로젝트 설계, 신규 기능 아이디어 및 기술 연구 메모</p>
                </div>
              </div>

              <div className="space-y-4">
                {ideas.map((idea) => (
                  <div key={idea.id} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 hover:border-amber-400 transition space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{idea.title}</h3>
                      <span className="text-[11px] text-neutral-400">{idea.date}</span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{idea.desc}</p>
                    <div className="flex items-center space-x-1.5 pt-1">
                      {idea.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. 트러블슈팅 일지 */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Bug className="w-5 h-5 text-rose-500" />
                    <span>기술 부채 및 트러블슈팅 일지</span>
                  </h2>
                  <p className="text-xs text-neutral-500">버그 원인 분석, Gemini 모델 버전 이슈 및 해결책 레코드</p>
                </div>
              </div>

              <div className="space-y-4">
                {troubleshootLogs.map((log) => (
                  <div key={log.id} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1.5">
                        <span>🚨</span>
                        <span>{log.issue}</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${log.badgeColor}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1 bg-white/70 dark:bg-neutral-950/50 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                      <div><strong className="text-neutral-500">원인:</strong> {log.cause}</div>
                      <div><strong className="text-emerald-600 dark:text-emerald-400">해결:</strong> {log.solution}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 프롬프트 보관함 */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Bookmark className="w-5 h-5 text-blue-500" />
                    <span>AI 시스템 프롬프트 보관함</span>
                  </h2>
                  <p className="text-xs text-neutral-500">엔진별 프롬프트 자산 및 지침서 라이브러리</p>
                </div>
              </div>

              <div className="space-y-4">
                {prompts.map((p) => (
                  <div key={p.id} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{p.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                          {p.target}
                        </span>
                      </div>
                      <button
                        onClick={() => copyText(p.id, p.content)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium border border-neutral-200 dark:border-neutral-700 transition cursor-pointer"
                      >
                        {copiedId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>복사</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] p-3 rounded-xl bg-neutral-900 text-neutral-200 dark:bg-neutral-950 dark:text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto">
                      {p.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DevLabPage;
