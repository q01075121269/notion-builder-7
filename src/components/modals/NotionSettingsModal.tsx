import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { extractNotionPageId } from '../../services/notionApi';
import { 
  X, 
  ExternalLink, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  RefreshCw,
  Key
} from 'lucide-react';

interface HealthCheckResult {
  gemini: { ok: boolean; message: string };
  notion: { ok: boolean; message: string };
}

export const NotionSettingsModal: React.FC = () => {
  const {
    isNotionSettingsModalOpen,
    setIsNotionSettingsModalOpen,
    notionApiKey,
    setNotionApiKey,
    notionParentPageId,
    setNotionParentPageId,
    publishToNotion,
    setIsGoogleSyncModalOpen,
    createdNotionResource,
    selectedNotionDbId,
    setSelectedNotionDbId,
    selectedExpenseDbId,
    setSelectedExpenseDbId
  } = useApp();

  const [inputKey, setInputKey] = useState<string>(notionApiKey);
  const [inputGeminiKey, setInputGeminiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [inputPageId, setInputPageId] = useState<string>(notionParentPageId);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);

  const runHealthCheck = async (gKey: string, nKey: string) => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/auth/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': gKey,
          'x-notion-api-key': nKey
        },
        body: JSON.stringify({
          geminiApiKey: gKey,
          notionApiKey: nKey
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      } else {
        setHealthStatus({
          gemini: { ok: false, message: '🔴 인증 실패 (서버 응답 오류)' },
          notion: { ok: false, message: '🔴 인증 실패 (서버 응답 오류)' }
        });
      }
    } catch (e: any) {
      setHealthStatus({
        gemini: { ok: false, message: `🔴 인증 실패 (${e.message})` },
        notion: { ok: false, message: `🔴 인증 실패 (${e.message})` }
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isNotionSettingsModalOpen) {
      const currentGKey = localStorage.getItem('gemini_api_key') || '';
      const currentNKey = notionApiKey || localStorage.getItem('notion_api_key') || '';
      setInputGeminiKey(currentGKey);
      setInputKey(currentNKey);
      runHealthCheck(currentGKey, currentNKey);
    }
  }, [isNotionSettingsModalOpen, notionApiKey]);

  if (!isNotionSettingsModalOpen) return null;

  const parsedId = extractNotionPageId(inputPageId);
  const isPageIdValid = parsedId.length === 32;

  const handleSave = async (andPublish = false) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', inputGeminiKey.trim());
      localStorage.setItem('notion_api_key', inputKey.trim());
    }
    setNotionApiKey(inputKey.trim());
    setNotionParentPageId(inputPageId.trim());

    await runHealthCheck(inputGeminiKey.trim(), inputKey.trim());

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsNotionSettingsModalOpen(false);
      if (andPublish) {
        publishToNotion();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-notion-dark-border rounded-2xl shadow-2xl overflow-hidden text-notion-light-text dark:text-notion-dark-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-notion-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-xs">
              <span>N</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center space-x-2">
                <span>노아(NOA) & Notion 연동 설정</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                AI 파트너 노아(NOA)와 내 노션 계정을 직결하기 위한 인증 키 설정입니다
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotionSettingsModalOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* 실시간 Health Check 라이브 상태 핑 카드 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                  실시간 연동 상태 (Live Health Check)
                </span>
              </div>
              <button
                type="button"
                onClick={() => runHealthCheck(inputGeminiKey, inputKey)}
                disabled={isTesting}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                <span>재검증</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-1 ${
                healthStatus?.gemini?.ok
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="font-semibold text-[11px] text-neutral-600 dark:text-neutral-400">
                  Gemini AI (노아 파트너)
                </div>
                <div className="font-bold">
                  {isTesting ? '⏳ 검증 중...' : (healthStatus?.gemini?.message || '🔴 키 미입력')}
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-1 ${
                healthStatus?.notion?.ok
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="font-semibold text-[11px] text-neutral-600 dark:text-neutral-400">
                  Notion API (워크스페이스)
                </div>
                <div className="font-bold">
                  {isTesting ? '⏳ 검증 중...' : (healthStatus?.notion?.message || '🔴 키 미입력')}
                </div>
              </div>
            </div>
          </div>

          {/* Beginner's 3-Step Guide Accordion */}
          <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition"
            >
              <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-semibold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>처음이신가요? API 키 발급 가이드</span>
              </div>
              {isGuideOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
            </button>

            {isGuideOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-neutral-700 dark:text-neutral-300 border-t border-blue-100 dark:border-blue-900/40">
                <div className="space-y-1.5">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Gemini API 키 무료 발급하기</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 pl-5 leading-relaxed">
                    Google AI Studio에서 무료로 키를 발급받을 수 있습니다. 아래 [Google AI Studio 바로가기] 버튼을 이용하세요.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>노션 API 키(내부 통합 시크릿) 발급받기</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 pl-5 leading-relaxed">
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline inline-flex items-center space-x-0.5 font-medium"
                    >
                      <span>노션 개발자 포털 (my-integrations)</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                    에서 <strong>[새 통합 만들기]</strong> 후 <strong>'내부 통합 시크릿(secret_...)'</strong>을 복사합니다.
                  </p>
                </div>

                <div className="space-y-1.5 p-2 rounded-lg bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>노션 부모 페이지에 통합 연결하기 (필수!)</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 pl-5 leading-relaxed text-[11px]">
                    노션 부모 페이지 우측 상단 <strong>··· (더보기)</strong> → <strong>[연결(Connect to)]</strong>에서 발급한 통합을 추가해야 권한 오류가 발생하지 않습니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* 0. Gemini API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>1. Gemini API Key (노아 AI 파트너 엔진)</span>
                </label>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-bold transition shadow-xs"
                >
                  <span>Google AI Studio 무료 발급</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={inputGeminiKey}
                onChange={(e) => setInputGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-mono"
              />
              <span className="text-[11px] text-neutral-400 block">
                https://aistudio.google.com/ 에서 생성한 API Key (클라이언트-백엔드 정식 직결)
              </span>
            </div>

            {/* 1. Notion API Secret */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                2. Notion API Token (내부 통합 시크릿)
              </label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-mono"
              />
              <span className="text-[11px] text-neutral-400 block">
                notion.so/my-integrations 에서 발급받은 시크릿 키
              </span>
            </div>

            {/* 2. Parent Page ID / URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                3. Parent Page ID 또는 Notion URL
              </label>
              <input
                type="text"
                value={inputPageId}
                onChange={(e) => setInputPageId(e.target.value)}
                placeholder="https://www.notion.so/My-Dashboard-76081e7d23d84920b790d96d7ff43fcf"
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 font-mono"
              />
              {inputPageId.trim() && (
                <div className="flex items-center space-x-1.5 text-[11px] pt-0.5">
                  {isPageIdValid ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>페이지 ID 인식 성공 ({parsedId.slice(0, 8)}...{parsedId.slice(-4)})</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠️ 32자리 노션 페이지 ID를 감지하지 못했습니다. 페이지 URL 전체를 붙여넣어 보세요.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 3. 데이터베이스 선택 드롭다운 (감지된 DB가 있을 때) */}
            {createdNotionResource && createdNotionResource.databases.length > 0 && (
              <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
                <div className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center space-x-1.5">
                  <span>🗂️ 감지된 노션 데이터베이스 라우팅 설정</span>
                </div>
                
                {/* 3-1. 기본 일정/할일 DB */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    📅 기본 일정/라이프 허브 DB
                  </label>
                  <select
                    value={selectedNotionDbId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedNotionDbId(val || null);
                      if (val) localStorage.setItem('selected_notion_db_id', val);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg font-medium"
                  >
                    {createdNotionResource.databases.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3-2. 가계부 DB */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    💰 가계부 DB (지출/영수증 자동 전송 대상)
                  </label>
                  <select
                    value={selectedExpenseDbId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedExpenseDbId(val || null);
                      if (val) localStorage.setItem('selected_expense_db_id', val);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg font-medium"
                  >
                    <option value="">(자동 탐색 / 미연동 시 라이프 허브 표에 안전 합산)</option>
                    {createdNotionResource.databases.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 text-[11px] bg-neutral-100 dark:bg-neutral-800/50 rounded-lg text-neutral-500 dark:text-neutral-400 leading-relaxed">
            🔒 입력하신 API 키와 페이지 정보는 외부 중앙 서버에 누출되지 않고 오직 사용자의 브라우저 로컬 저장소(localStorage)에만 안전하게 보관됩니다.
          </div>

          {/* 4단계: Google Workspace & 노션 캘린더 연동 바로가기 */}
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                <span>Google Workspace & 노션 캘린더 싱크</span>
              </span>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                구글 캘린더 및 Gmail과 노션 날짜(Date) 속성을 연결할 수 있습니다
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNotionSettingsModalOpen(false);
                setIsGoogleSyncModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shrink-0 ml-2 shadow-xs"
            >
              연동 허브 열기
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-notion-dark-border">
          <button
            onClick={() => {
              setInputGeminiKey('');
              setInputKey('');
              setInputPageId('');
              setNotionApiKey('');
              setNotionParentPageId('');
              if (typeof window !== 'undefined') {
                localStorage.removeItem('gemini_api_key');
                localStorage.removeItem('notion_api_key');
              }
              setHealthStatus(null);
            }}
            className="text-xs text-neutral-400 hover:text-red-500 transition"
          >
            설정 초기화
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsNotionSettingsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition"
            >
              닫기
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!inputGeminiKey || !inputKey}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition disabled:opacity-50"
            >
              {savedSuccess ? '검증 및 저장됨!' : '설정 저장'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!inputGeminiKey || !inputKey}
              className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>저장하고 바로 생성</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
