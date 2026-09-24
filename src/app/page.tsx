import React from 'react';
import { useApp } from '../context/AppContext';
import { DailyRoutineCockpit } from '../components/routine/DailyRoutineCockpit';
import { 
  Sparkles, 
  ArrowRight, 
  Leaf, 
  FileText, 
  Palette, 
  Cpu, 
  Database,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { 
    setCurrentView, 
    selectedModel, 
    notionApiKey, 
    notionParentPageId,
    createdNotionResource,
    setIsNotionSettingsModalOpen
  } = useApp();

  const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || notionParentPageId));

  const chapters = [
    {
      id: 'builder',
      title: '🏗️ 템플릿 마스터',
      subtitle: '노션 템플릿 빌더 & 보관함',
      icon: Sparkles,
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      borderColor: 'hover:border-amber-400 dark:hover:border-amber-500',
      description: 'AI 자연어로 맞춤형 노션 템플릿을 신속 생성하고, 실시간 반응형 프리뷰와 보관함을 원스톱으로 관리합니다.',
      features: [
        'AI 실시간 2분할(Split) 프리뷰',
        'Formula 2.0 수식 & DB 자동 설계',
        '템플릿 보관함 통합 서브 스위처'
      ],
      btnColor: 'group-hover:bg-amber-600 dark:group-hover:bg-amber-400 dark:group-hover:text-neutral-900'
    },
    {
      id: 'life',
      title: '👔 라이프 비서',
      subtitle: '일정 · 가계부 · 이메일 · 할 일',
      icon: Leaf,
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderColor: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      description: 'Google/노션 캘린더 동기화, 이메일 브리핑, 지출 가계부 분석 및 스마트 데일리 할 일을 통합 제공합니다.',
      features: [
        '노션 캘린더 즉시 자동 전송',
        '스마트 이메일 요약 & 긴급 액션',
        '소비 패턴 이상 지출 AI 감지'
      ],
      btnColor: 'group-hover:bg-emerald-600 dark:group-hover:bg-emerald-400 dark:group-hover:text-neutral-900'
    },
    {
      id: 'devlab',
      title: '📄 오피스 스튜디오',
      subtitle: 'Docs · Sheets · Slides 라이브',
      icon: FileText,
      iconColor: 'text-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderColor: 'hover:border-blue-400 dark:hover:border-blue-500',
      description: '3대 비즈니스 문서 라이브 렌더러와 사내 표준 규격 양식, NotebookLM형 RAG 지식 소스를 탑재했습니다.',
      features: [
        'Docs, Sheets, Slides 전문 렌더러',
        '자유 기획 ↔ 사내 표준 양식 듀얼 모드',
        'NotebookLM 지식 서랍 & 팩트 각주'
      ],
      btnColor: 'group-hover:bg-blue-600 dark:group-hover:bg-blue-400 dark:group-hover:text-neutral-900'
    },
    {
      id: 'media_lab',
      title: '🎨 AI 미디어 랩',
      subtitle: '이미지 · 비디오 · 오디오 믹서',
      icon: Palette,
      iconColor: 'text-purple-500',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      borderColor: 'hover:border-purple-400 dark:hover:border-purple-500',
      description: '멀티 스타일 멀티엔진 이미지 생성, 씬 타임라인 영상 스튜디오, 4대 프리셋 오디오 믹서를 통합 제공합니다.',
      features: [
        'Image-to-Video 씬 시퀀서 타임라인',
        '4대 목적별 오디오 파형 믹서',
        '슬라이드 서랍 보관함 & 에셋 전송'
      ],
      btnColor: 'group-hover:bg-purple-600 dark:group-hover:bg-purple-400 dark:group-hover:text-neutral-900'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white select-none">
      
      {/* 1. 글로벌 메인 히어로 바 */}
      <div className="relative overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-notion-dark-card py-6 sm:py-8 px-4 sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-emerald-500/5 to-blue-500/5 dark:from-amber-500/10 dark:via-emerald-500/10 dark:to-blue-500/10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Notion Architect v2.0</span>
              </span>

              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <Cpu className="w-3.5 h-3.5" />
                <span>엔진: {selectedModel}</span>
              </span>

              <button
                onClick={() => setIsNotionSettingsModalOpen(true)}
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  isNotionConnected
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60 animate-pulse'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isNotionConnected ? '노션 워크스페이스 연결됨' : '노션 연결 필요 (클릭)'}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Notion AI Master Workspace <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-600">v2.0</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              최하단 중앙 노아(NOA) 챗을 통해 어떤 지시든 음성/텍스트로 입력하면 4대 전문 챕터 작업실로 자동 분류 처리됩니다.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-neutral-700">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>하단 노아(NOA) 챗 활성화됨</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4대 핵심 챕터 퀵 런처 그리드 (Slate-50 배경, Slate-200 테두리, hover:shadow-md) */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center space-x-2">
                <span>🚀 4대 핵심 챕터 퀵 런처</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                필요한 전문 작업실을 바로 선택하여 자유롭게 작업에 몰입하세요.
              </p>
            </div>
          </div>

          {/* 4대 챕터 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {chapters.map((chap) => {
              const IconComp = chap.icon;
              return (
                <div
                  key={chap.id}
                  onClick={() => setCurrentView(chap.id as any)}
                  className={`group relative bg-slate-50 dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 ${chap.borderColor} hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden hover:-translate-y-1`}
                >
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-neutral-800 shadow-xs border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center">
                        <IconComp className={`w-5 h-5 ${chap.iconColor}`} />
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${chap.badgeBg}`}>
                        {chap.subtitle}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        {chap.title}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed min-h-[3rem]">
                        {chap.description}
                      </p>
                    </div>

                    <ul className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 pt-3 border-t border-slate-200/80 dark:border-neutral-800">
                      {chap.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${chap.iconColor} shrink-0`} />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 relative z-10">
                    <div className={`w-full py-2 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-between ${chap.btnColor} transition`}>
                      <span>작업실 바로가기</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 24시간 데일리 루틴 관제 콕핏 (자정 자동 롤백 엔진 탑재) */}
        <DailyRoutineCockpit />

        {/* 안내 카드 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                💡 언제든 최하단 노아(NOA) 챗으로 통합 지시 가능
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                어느 페이지에서나 화면 최하단 노아(NOA) 챗에 음성이나 텍스트를 입력하면 AI 오케스트레이터가 자동으로 알맞은 챕터 작업실을 업데이트합니다.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
