import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { extractNotionPageId } from '../../services/notionApi';
import { 
  X, 
  ExternalLink, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles
} from 'lucide-react';

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
  const [inputPageId, setInputPageId] = useState<string>(notionParentPageId);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isNotionSettingsModalOpen) return null;

  const parsedId = extractNotionPageId(inputPageId);
  const isPageIdValid = parsedId.length === 32;

  const handleSave = (andPublish = false) => {
    setNotionApiKey(inputKey);
    setNotionParentPageId(inputPageId);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsNotionSettingsModalOpen(false);
      if (andPublish) {
        publishToNotion();
      }
    }, 500);
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
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 font-bold shadow-xs">
              <span>N</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Notion 워크스페이스 연동 설정
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                내 노션 계정에 템플릿을 자동으로 생성하기 위한 인증 정보입니다
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
          
          {/* Beginner's 3-Step Guide Accordion */}
          <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 overflow-hidden">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition"
            >
              <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-semibold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>처음이신가요? 3분 완성 노션 연동 가이드</span>
              </div>
              {isGuideOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
            </button>

            {isGuideOpen && (
              <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-neutral-700 dark:text-neutral-300 border-t border-blue-100 dark:border-blue-900/40">
                <div className="space-y-1.5">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>노션 API 키(토큰) 발급받기</span>
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
                    로 이동하여 <strong>[새 통합 만들기]</strong>를 클릭하고 생성된 <strong>'내부 통합 시크릿(secret_...)'</strong>을 복사합니다.
                  </p>
                </div>

                <div className="space-y-1.5 p-2 rounded-lg bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>부모 페이지에 통합 연결하기 (필수!)</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 pl-5 leading-relaxed text-[11px]">
                    템플릿을 생성할 노션 페이지로 이동한 후, 우측 상단의 <strong>··· (더보기)</strong> → <strong>[연결(Connect to)]</strong> 메뉴에서 1단계에서 만든 통합을 반드시 <strong>추가</strong>해 주세요! (연결하지 않으면 권한 없음 오류 발생)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>페이지 링크 복사하여 붙여넣기</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 pl-5 leading-relaxed">
                    해당 부모 페이지의 웹 주소창 URL 또는 <strong>[링크 복사]</strong> 버튼을 눌러 아래 입력창에 그대로 붙여넣으시면 됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* 1. Notion API Secret */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                1. Notion API Token (내부 통합 시크릿)
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
                2. Parent Page ID 또는 Notion URL
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
            🔒 입력하신 노션 API 키와 페이지 정보는 서버에 저장되지 않고 오직 사용자의 브라우저 로컬 저장소(localStorage)에만 안전하게 보관됩니다.
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
              setInputKey('');
              setInputPageId('');
              setNotionApiKey('');
              setNotionParentPageId('');
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
              disabled={!inputKey || !inputPageId}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition disabled:opacity-50"
            >
              {savedSuccess ? '저장됨!' : '설정 저장'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!inputKey || !inputPageId}
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
