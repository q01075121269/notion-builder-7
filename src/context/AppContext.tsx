import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { 
  NotionTemplate, 
  CreatedNotionResource,
  RecentModifications 
} from '../types/notion';
import type { ChatMessage, GeminiModelType } from '../types/chat';
import type { GoogleSyncConfig } from '../types/dashboard';
import type { BeginnerGuide, GuideAudience } from '../types/guide';
import type { AuthUser } from '../types/auth';
import { PRESET_TEMPLATES } from '../services/presetTemplates';
import { SEPTEMBER_TOP_10_TEMPLATES } from '../services/curatedTemplates';
import { normalizeTemplatePayload } from '../utils/schemaAdapter';
import { processConversationWithGemini } from '../services/gemini';
import { createNotionTemplateInWorkspace, applyPatchToRemoteWorkspace, appendGuideToggleToNotionPage } from '../services/notionApi';
import { buildMasterWorkspaceInNotion } from '../services/notionMasterWorkspace';
import { fetchNotionDatabases } from '../services/notionDatabaseSync';
import { getGoogleSyncConfig, saveGoogleSyncConfig, saveArchivedTemplate } from '../services/archiveStorage';
import { DEFAULT_GUIDES, generateGuideWithGemini, createFallbackGuide } from '../services/guideGenerator';
import { getAuthSession, saveAuthSession, clearAllAuthAndCredentials, isUserAdmin } from '../services/authStorage';
import { getSavedChatMessages, saveChatMessages, createNewSession, INITIAL_CHAT_MESSAGES } from '../services/chatStorage';
import confetti from 'canvas-confetti';

export type ViewType = 'home' | 'builder' | 'life' | 'devlab' | 'media_lab' | 'dashboard' | 'quick_capture';

interface AppContextType {
  // 6단계 보안 및 인증 (Google OAuth & RBAC)
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;

  // Theme
  isDark: boolean;
  toggleDarkMode: () => void;
  selectedModel: GeminiModelType;
  setSelectedModel: (model: GeminiModelType) => void;
  isThinkingEnabled: boolean;
  setIsThinkingEnabled: (enabled: boolean) => void;
  toggleThinking: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;

  // View Mode (v2.0 3대 독립 작업실 & 홈 대시보드)
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // 5단계: 초보자 맞춤형 비주얼 가이드
  currentGuide: BeginnerGuide | null;
  setCurrentGuide: (guide: BeginnerGuide | null) => void;
  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;
  isGeneratingGuide: boolean;
  isAppendingGuideToNotion: boolean;
  generateGuide: (audience?: GuideAudience) => Promise<void>;
  appendGuideToNotion: () => Promise<{ success: boolean; message: string }>;

  // Notion Integration (2단계 & 3단계)
  notionApiKey: string;
  setNotionApiKey: (key: string) => void;
  notionParentPageId: string;
  setNotionParentPageId: (id: string) => void;
  isPublishing: boolean;
  publishProgress: { step: string; percent: number };
  publishError: string | null;
  createdNotionResource: CreatedNotionResource | null;
  isNotionSettingsModalOpen: boolean;
  setIsNotionSettingsModalOpen: (open: boolean) => void;
  isPublishSuccessModalOpen: boolean;
  setIsPublishSuccessModalOpen: (open: boolean) => void;
  publishToNotion: () => Promise<void>;
  isBuildingMasterWorkspace: boolean;
  buildMasterWorkspace: () => Promise<void>;
  selectedNotionDbId: string | null;
  setSelectedNotionDbId: (id: string | null) => void;
  selectedExpenseDbId: string | null;
  setSelectedExpenseDbId: (id: string | null) => void;
  refreshNotionDatabases: () => Promise<void>;

  // Google Workspace & Notion Calendar Sync (4단계)
  isGoogleSyncModalOpen: boolean;
  setIsGoogleSyncModalOpen: (open: boolean) => void;
  googleSyncConfig: GoogleSyncConfig;
  setGoogleSyncConfig: (config: GoogleSyncConfig) => void;

  // 3단계 Diff & Patch 하이라이트 상태
  recentModifications: RecentModifications;
  clearRecentModifications: () => void;

  // View & Tabs
  activeMobileTab: 'chat' | 'preview';
  setActiveMobileTab: (tab: 'chat' | 'preview') => void;
  previewMode: 'notion' | 'tree';
  setPreviewMode: (mode: 'notion' | 'tree') => void;

  // Modals
  isApiKeyModalOpen: boolean;
  setIsApiKeyModalOpen: (open: boolean) => void;
  isRawJsonModalOpen: boolean;
  setIsRawJsonModalOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;

  // Chat & Template
  messages: ChatMessage[];
  currentTemplate: NotionTemplate | null;
  setCurrentTemplate: (template: NotionTemplate | null) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  sendMessage: (prompt: string, attachedFiles?: import('../types/fileAttachment').AttachedFile[]) => Promise<void>;
  clearChatHistory: () => void;
  applyPreset: (presetKey: string) => void;
  resetToDefault: () => void;
  updateCurrentCover: (newUrl: string) => void;

  // 접속 월(2026년 9월) TOP 10 큐레이션 허브 및 인터랙티브 뷰 상태
  isViewingCurationHub: boolean;
  setIsViewingCurationHub: (viewing: boolean) => void;
  selectedCuratedId: string | null;
  setSelectedCuratedId: (id: string | null) => void;
  loadCuratedTemplate: (curatedId: string) => void;
  pendingChatPrompt: string;
  setPendingChatPrompt: (prompt: string) => void;

  // 전역 알림 토스트 (Runtime Defense & Alerts)
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 6단계: 보안 인증 상태 (Auth Gate & RBAC)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    return getAuthSession();
  });

  const isAuthenticated = !!authUser;
  const isAdmin = authUser ? isUserAdmin(authUser.email) : false;

  const login = (user: AuthUser) => {
    const adminRole = isUserAdmin(user.email) ? 'admin' : 'user';
    const enrichedUser: AuthUser = {
      ...user,
      role: adminRole,
    };
    setAuthUser(enrichedUser);
    saveAuthSession(enrichedUser);
  };

  const logout = () => {
    clearAllAuthAndCredentials();
    setAuthUser(null);
    setNotionApiKeyState('');
    setNotionParentPageIdState('');
    setCreatedNotionResource(null);
    setMessages(INITIAL_CHAT_MESSAGES);
    setCurrentTemplate(PRESET_TEMPLATES.college_student);
    setCurrentGuide(DEFAULT_GUIDES.college_student);
    clearRecentModifications();
  };

  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('notion_maker_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Gemini Model & API Key (구형 1.5 계열 강제 마이그레이션 적용)
  const [selectedModel, setSelectedModelState] = useState<GeminiModelType>(() => {
    const saved = (localStorage.getItem('selected_gemini_model') || localStorage.getItem('gemini_selected_model')) as string;
    if (saved && (saved.includes('1.5') || saved.includes('1.0'))) {
      localStorage.setItem('selected_gemini_model', 'gemini-2.5-flash');
      localStorage.setItem('gemini_selected_model', 'gemini-2.5-flash');
      return 'gemini-2.5-flash';
    }
    if (saved && (saved === 'gemini-3.5-flash-lite' || saved === 'gemini-3.8-flash' || saved === 'gemini-3.1-pro' || saved === 'gemini-2.5-flash')) return saved as GeminiModelType;
    return 'gemini-2.5-flash';
  });

  const setSelectedModel = (model: GeminiModelType) => {
    const safeModel = (model && (model.includes('1.5') || model.includes('1.0'))) ? 'gemini-2.5-flash' : model;
    setSelectedModelState(safeModel);
    localStorage.setItem('selected_gemini_model', safeModel);
    localStorage.setItem('gemini_selected_model', safeModel);
  };

  // 2026 확장된 사고 모델 (Thinking Switch) 상태
  const [isThinkingEnabled, setIsThinkingEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_thinking_enabled') === 'true';
    }
    return false;
  });

  const setIsThinkingEnabled = (enabled: boolean) => {
    setIsThinkingEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_thinking_enabled', enabled ? 'true' : 'false');
    }
  };

  const toggleThinking = () => {
    const next = !isThinkingEnabled;
    setIsThinkingEnabled(next);
  };
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });

  // Notion Integration State
  const [notionApiKey, setNotionApiKeyState] = useState<string>(() => {
    return localStorage.getItem('notion_api_key') || '';
  });
  const [notionParentPageId, setNotionParentPageIdState] = useState<string>(() => {
    return localStorage.getItem('notion_parent_page_id') || '';
  });
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishProgress, setPublishProgress] = useState<{ step: string; percent: number }>({
    step: '',
    percent: 0
  });
  const [publishError, setPublishError] = useState<string | null>(null);
  const [createdNotionResource, setCreatedNotionResourceState] = useState<CreatedNotionResource | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('created_notion_resource');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return null;
  });

  const setCreatedNotionResource = (res: CreatedNotionResource | null) => {
    setCreatedNotionResourceState(res);
    if (typeof window !== 'undefined') {
      if (res) localStorage.setItem('created_notion_resource', JSON.stringify(res));
      else localStorage.removeItem('created_notion_resource');
    }
  };

  const [selectedNotionDbId, setSelectedNotionDbIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selected_notion_db_id') || localStorage.getItem('master_life_hub_db_id') || null;
    }
    return null;
  });

  const setSelectedNotionDbId = (id: string | null) => {
    setSelectedNotionDbIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('selected_notion_db_id', id);
      else localStorage.removeItem('selected_notion_db_id');
    }
  };

  const [selectedExpenseDbId, setSelectedExpenseDbIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selected_expense_db_id') || localStorage.getItem('master_expense_db_id') || null;
    }
    return null;
  });

  const setSelectedExpenseDbId = (id: string | null) => {
    setSelectedExpenseDbIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('selected_expense_db_id', id);
      else localStorage.removeItem('selected_expense_db_id');
    }
  };

  const [isBuildingMasterWorkspace, setIsBuildingMasterWorkspace] = useState<boolean>(false);
  const [isNotionSettingsModalOpen, setIsNotionSettingsModalOpen] = useState<boolean>(false);
  const [isPublishSuccessModalOpen, setIsPublishSuccessModalOpen] = useState<boolean>(false);

  // 3단계: 최근 수정(Diff & Patch) 하이라이트 상태
  const [recentModifications, setRecentModifications] = useState<RecentModifications>({
    propertyNames: [],
    blockContents: [],
    timestamp: 0
  });

  // View Mode (v2.0 3대 독립 작업실 & 홈 대시보드)
  const [currentView, setCurrentViewState] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '');
      if (path === '/builder') return 'builder';
      if (path === '/life') return 'life';
      if (path === '/devlab') return 'devlab';
      if (path === '/dashboard') return 'dashboard';
      if (path === '/quick_capture') return 'quick_capture';

      const isDefaultQc = localStorage.getItem('default_view_quick_capture') === 'true';
      const isMobile = window.innerWidth < 768;
      if (isDefaultQc && isMobile) return 'quick_capture';
    }
    return 'home';
  });

  const setCurrentView = (view: ViewType) => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      const targetPath = view === 'home' ? '/' : `/${view}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view }, '', targetPath);
      }
    }
  };

  // 브라우저 뒤로가기/앞으로가기(popstate) 라우트 동기화
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/+$/, '');
      if (path === '/builder') setCurrentViewState('builder');
      else if (path === '/life') setCurrentViewState('life');
      else if (path === '/devlab') setCurrentViewState('devlab');
      else if (path === '/dashboard') setCurrentViewState('dashboard');
      else if (path === '/quick_capture') setCurrentViewState('quick_capture');
      else setCurrentViewState('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 4단계: Google Workspace & Notion Calendar Sync
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState<boolean>(false);
  const [googleSyncConfig, setGoogleSyncConfigState] = useState<GoogleSyncConfig>(() => getGoogleSyncConfig());

  const setGoogleSyncConfig = (config: GoogleSyncConfig) => {
    setGoogleSyncConfigState(config);
    saveGoogleSyncConfig(config);
  };

  // 5단계: 초보자 맞춤형 비주얼 가이드 상태
  const [currentGuide, setCurrentGuide] = useState<BeginnerGuide | null>(DEFAULT_GUIDES.college_student);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState<boolean>(false);
  const [isAppendingGuideToNotion, setIsAppendingGuideToNotion] = useState<boolean>(false);

  // Views & Modals
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'preview'>('chat');
  const [previewMode, setPreviewMode] = useState<'notion' | 'tree'>('notion');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isRawJsonModalOpen, setIsRawJsonModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Template & Chat State
  const [currentTemplate, setCurrentTemplateState] = useState<NotionTemplate | null>(() => {
    const init = SEPTEMBER_TOP_10_TEMPLATES[0]?.template || PRESET_TEMPLATES.college_student;
    return normalizeTemplatePayload(init);
  });

  const setCurrentTemplate = useCallback((tpl: NotionTemplate | null) => {
    setCurrentTemplateState(normalizeTemplatePayload(tpl));
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>(() => getSavedChatMessages());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 접속 월(2026년 9월) 시즌 TOP 10 큐레이션 허브 & 인터랙티브 분석 뷰 상태
  // 첫 접속 시 오른쪽 영역에 큐레이션 보드 리스트가 기본 노출됨
  const [isViewingCurationHub, setIsViewingCurationHub] = useState<boolean>(false);
  const [selectedCuratedId, setSelectedCuratedId] = useState<string | null>('curated-1');
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string>('');

  const loadCuratedTemplate = (curatedId: string) => {
    const item = SEPTEMBER_TOP_10_TEMPLATES.find(t => t.id === curatedId);
    if (item) {
      setCurrentTemplate(item.template);
      setSelectedCuratedId(curatedId);
      setIsViewingCurationHub(false);
      showToast(`"${item.template.title}" 템플릿 분석 뷰로 전환되었습니다.`, 'info');
    }
  };

  // Sync Chat Messages with Local Storage
  useEffect(() => {
    saveChatMessages(messages);
  }, [messages]);

  // Sync Dark Mode with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('notion_maker_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('notion_maker_theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem('gemini_api_key', key.trim());
  };

  const setNotionApiKey = (key: string) => {
    setNotionApiKeyState(key);
    localStorage.setItem('notion_api_key', key.trim());
  };

  // 새로고침(F5) 및 초기 로드 시 노션 DB 목록 자동 재조회
  const refreshNotionDatabases = useCallback(async () => {
    if (!notionApiKey || !notionParentPageId) return;
    try {
      const resource = await fetchNotionDatabases(notionApiKey, notionParentPageId);
      if (resource) {
        setCreatedNotionResource(resource);
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('selected_notion_db_id') : null;
        const exists = resource.databases.some(d => d.id === savedId);
        if (!exists && resource.databases.length > 0) {
          const lifeDb = resource.databases.find(d => d.name.includes('라이프'));
          setSelectedNotionDbId(lifeDb ? lifeDb.id : resource.databases[0].id);
        }

        // 가계부 DB 자동 탐색 및 유지
        const savedExpenseId = typeof window !== 'undefined' ? localStorage.getItem('selected_expense_db_id') : null;
        const expenseExists = resource.databases.some(d => d.id === savedExpenseId);
        if (!expenseExists && resource.databases.length > 0) {
          const expenseDb = resource.databases.find(d => {
            const name = d.name.toLowerCase();
            return name.includes('가계부') || name.includes('지출') || name.includes('비용') || name.includes('소비');
          });
          if (expenseDb) {
            setSelectedExpenseDbId(expenseDb.id);
          }
        }
      }
    } catch (err) {
      console.warn('노션 DB 자동 재조회 중 경고:', err);
    }
  }, [notionApiKey, notionParentPageId]);

  useEffect(() => {
    refreshNotionDatabases();
  }, [refreshNotionDatabases]);

  const setNotionParentPageId = (id: string) => {
    setNotionParentPageIdState(id);
    localStorage.setItem('notion_parent_page_id', id.trim());
  };

  const clearRecentModifications = () => {
    setRecentModifications({ propertyNames: [], blockContents: [], timestamp: 0 });
  };

  const clearChatHistory = () => {
    createNewSession();
    setMessages([]);
    setCurrentTemplate(null);
    clearRecentModifications();
    try {
      localStorage.removeItem('notion_template_cache');
      localStorage.removeItem('notion_template_vault_draft');
    } catch {}
    showToast('✨ 새 Co-Thinking 대화 세션이 시작되었습니다.', 'info');
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.65 }
    });
  };

  // 전역 토스트 상태 (런타임 알림)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };
  const hideToast = () => setToast(null);

  const updateCurrentCover = (newUrl: string) => {
    if (currentTemplate) {
      setCurrentTemplate({
        ...currentTemplate,
        cover_url: newUrl
      });
      showToast('커버 이미지가 업데이트되었습니다.', 'success');
    }
  };

  // [3단계 및 확장 파이프라인] 대화형 프롬프트 처리 핸들러 (파일 분석, 비전 역설계 및 모드 A/B 분기)
  const sendMessage = async (
    prompt: string,
    attachedFiles: import('../types/fileAttachment').AttachedFile[] = []
  ) => {
    if (!isAuthenticated) {
      showToast('보안 인증이 필요합니다. Google 계정으로 로그인해 주세요.', 'error');
      return;
    }
    if ((!prompt.trim() && attachedFiles.length === 0) || isGenerating) return;

    const userAttachments = attachedFiles.map(f => ({
      name: f.name,
      category: f.category,
      sizeFormatted: f.sizeFormatted,
      previewUrl: f.previewUrl
    }));

    const userMessageId = `msg-user-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: prompt.trim(),
      timestamp: Date.now(),
      attachments: userAttachments.length > 0 ? userAttachments : undefined
    };

    const assistantMessageId = `msg-assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true
    };

    setMessages(prev => [...prev, newUserMessage, initialAssistantMessage]);
    setIsGenerating(true);

    try {
      if (!apiKey && !import.meta.env.VITE_GEMINI_API_KEY) {
        setIsApiKeyModalOpen(true);
        throw new Error('Gemini API 키가 필요합니다. 열린 설정 창에서 API 키를 입력해 주세요.');
      }

      // 신규 생성 의도(제안 생성 클릭 등)일 경우 기존 템플릿 맥락을 끊고 null 전달
      const isExplicitCreateIntent = prompt.includes('신규 생성') || prompt.includes('템플릿 생성') || prompt.includes('새로 만들어줘') || prompt.includes('바로 생성해줘');
      const targetTemplateContext = isExplicitCreateIntent ? null : currentTemplate;

      // Gemini Master Brain Engine 호출 (멀티턴 히스토리 전달)
      const response = await processConversationWithGemini(
        prompt,
        apiKey,
        targetTemplateContext,
        selectedModel,
        attachedFiles,
        messages
      );

      // 모드 A. 일반 대화 및 사용법 안내인 경우 (템플릿 변경 없이 친절한 설명 렌더링)
      if (response.mode === 'CONVERSATION_GUIDE') {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  isLoading: false,
                  content: response.explanation
                }
              : msg
          )
        );
        return;
      }

      // 모드 B-1. 부분 수정(PATCH_UPDATE) 모드인 경우
      if (response.mode === 'PATCH_UPDATE') {
        const { changes, updated_template, explanation } = response;
        
        setCurrentTemplate(updated_template);

        // 하이라이트 상태 기록
        const newPropNames = changes.new_properties?.map(p => p.name) || [];
        const newBlocks = changes.blocks_to_append?.map(b => 'content' in b ? (b as any).content : b.type) || [];
        setRecentModifications({
          propertyNames: newPropNames,
          blockContents: newBlocks,
          timestamp: Date.now()
        });

        // 실제 노션 워크스페이스에 이미 배포된 상태라면 원격 PATCH 동기화 수행
        let remoteSyncNotice = '';
        if (createdNotionResource && notionApiKey) {
          const syncResult = await applyPatchToRemoteWorkspace(response, notionApiKey, createdNotionResource);
          if (syncResult.success) {
            remoteSyncNotice = `\n\n🟢 **실제 노션 워크스페이스 동기화 완료**: ${syncResult.message}`;
          } else {
            remoteSyncNotice = `\n\n⚠️ **원격 노션 동기화 실패**: ${syncResult.message} (로컬 미리보기에는 정상 적용되었습니다)`;
          }
        }

        setIsViewingCurationHub(false);
        if (window.innerWidth < 768) {
          setActiveMobileTab('preview');
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  isLoading: false,
                  content: `🛠️ **[부분 수정 반영 완료]**\n\n${explanation}${remoteSyncNotice}`,
                  templateData: updated_template
                }
              : msg
          )
        );
      } 
      // 2. 신규 생성(CREATE_NEW) 모드인 경우
      else {
        const { template, explanation } = response;
        setCurrentTemplate(template);
        clearRecentModifications();
        triggerCelebration();
        setCurrentGuide(createFallbackGuide(template, 'general'));
        setIsViewingCurationHub(false);

        // 1. 템플릿 보관함(localStorage saved_templates)에 자동 영구 적재
        try {
          saveArchivedTemplate({
            id: template.id || `archived-${Date.now()}`,
            title: template.title,
            description: template.description || explanation.slice(0, 80),
            icon: template.icon || '📄',
            cover_url: template.cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be8860ee?auto=format&fit=crop&w=1600&q=80',
            tags: ['#노아자동생성', '#CoThinking'],
            templateData: template,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } catch (err) {
          console.warn('[VaultSync] Failed to auto-archive template:', err);
        }

        // 2. 생성 완료 즉시 사용자를 작업실 캔버스(builder workspace)로 자동 이동
        setCurrentView('builder');
        if (window.innerWidth < 768) {
          setActiveMobileTab('preview');
        }

        // 3. Notion API가 연결된 경우 실제 노션 부모 페이지에 템플릿 자동 생성 및 URL 반환
        let notionNotice = '';
        if (notionApiKey && notionParentPageId) {
          try {
            showToast('🚀 노션 워크스페이스에 템플릿 페이지 생성을 시작합니다...', 'info');
            const result = await createNotionTemplateInWorkspace(
              template,
              notionApiKey,
              notionParentPageId
            );
            if (result && result.pageUrl) {
              setCreatedNotionResource(result);
              notionNotice = `\n\n🎉 **노션 워크스페이스 실물 배포 완료!**\n- 🔗 **생성된 노션 페이지**: [${result.pageTitle}](${result.pageUrl})`;
            }
          } catch (notionErr: any) {
            console.warn('노션 자동 배포 실패:', notionErr);
            notionNotice = `\n\n⚠️ 노션 자동 배포 실패: ${notionErr?.message || '권한을 확인해 주세요.'}`;
          }
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  isLoading: false,
                  content: `${explanation}\n\n- **데이터베이스**: ${template.databases.map(d => `\`${d.name}\``).join(', ')}\n- **속성 구성**: 날짜(일정), 상태, 수식, 연관관계 속성 자동 구성.${notionNotice}`,
                  templateData: template
                }
              : msg
          )
        );
        showToast("기획안을 바탕으로 템플릿이 성공적으로 설계되었습니다.", 'success');
      }

    } catch (err: any) {
      const errorMsg = err?.message || '대화 처리 중 오류가 발생했습니다.';
      showToast(errorMsg, 'error');
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                isLoading: false,
                content: `⚠️ **처리 실패**\n\n${errorMsg}`,
                error: errorMsg
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 2단계: 실제 노션 워크스페이스에 템플릿 자동 배포 실행 핸들러
  const publishToNotion = async () => {
    if (!isAuthenticated) {
      showToast('보안 인증이 필요합니다. Google 계정으로 로그인 후 이용해 주세요.', 'error');
      return;
    }
    if (!currentTemplate) return;

    if (!notionApiKey || !notionParentPageId) {
      setIsNotionSettingsModalOpen(true);
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishProgress({ step: '노션 API 연결 준비 중...', percent: 5 });

    try {
      const result = await createNotionTemplateInWorkspace(
        currentTemplate,
        notionApiKey,
        notionParentPageId,
        (step, percent) => {
          setPublishProgress({ step, percent });
        }
      );

      setCreatedNotionResource(result);
      triggerCelebration();
      setIsPublishSuccessModalOpen(true);
      showToast(`🎉 노션 워크스페이스에 "${currentTemplate.title}" 배포 완결! 새 탭으로 이동합니다.`, 'success');

      // 배포 완결 후 생성된 노션 페이지 새 탭 즉시 자동 오픈
      if (result.pageUrl) {
        try { window.open(result.pageUrl, '_blank'); } catch {}
      }

      // 4단계: 배포 성공 시 내 보관함에도 자동 아카이빙 영구 보존 (Upsert 덮어쓰기 연동)
      const targetArchiveId = currentTemplate.id || `arch-published-${Date.now()}`;
      currentTemplate.id = targetArchiveId;

      saveArchivedTemplate({
        id: targetArchiveId,
        title: currentTemplate.title,
        description: currentTemplate.description || '노션 워크스페이스 배포 템플릿',
        icon: currentTemplate.icon || '📑',
        cover_url: currentTemplate.cover_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
        tags: ['#배포완료', '#노션연동', '#실시간', '#대시보드'],
        templateData: {
          ...currentTemplate,
          id: targetArchiveId
        },
        notionUrl: result.pageUrl,
        source: 'created',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      const successMsg: ChatMessage = {
        id: `publish-success-${Date.now()}`,
        role: 'assistant',
        content: `🎉 **노션 워크스페이스에 템플릿이 성공적으로 배포되었습니다!**\n\n- **🔗 바로가기 페이지**: [${result.pageTitle}](${result.pageUrl})\n- **생성된 데이터베이스**: ${result.databases.map(d => `\`${d.name}\``).join(', ')}\n\n💡 *노션 부모 페이지 우측 상단 '···' -> [연결(Connect to)]에 내 통합이 추가되어 있어야 정상 노출됩니다.*`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, successMsg]);

    } catch (err: any) {
      console.error('노션 배포 실패:', err);
      const errMsg = err?.message || '노션 API 연동 중 알 수 없는 오류가 발생했습니다.';
      setPublishError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // 마스터 워크스페이스 원클릭 자동 구축
  const buildMasterWorkspace = async () => {
    if (!notionApiKey || !notionParentPageId) {
      setIsNotionSettingsModalOpen(true);
      showToast('노션 API 키와 부모 페이지 ID를 먼저 설정해 주세요.', 'error');
      return;
    }

    setIsBuildingMasterWorkspace(true);
    try {
      showToast('👑 노션 5대 마스터 허브 자동 구축을 시작합니다...', 'info');
      const resource = await buildMasterWorkspaceInNotion(
        notionApiKey,
        notionParentPageId,
        (step) => showToast(step, 'info')
      );

      setCreatedNotionResource(resource);
      triggerCelebration();
      showToast('🎉 노션 마스터 허브(5대 DB) 구축 완료! 새 탭으로 페이지를 엽니다.', 'success');

      // 구축 완료 후 즉시 생성된 노션 마스터 허브 페이지 새 탭 오픈
      if (resource.pageUrl) {
        try { window.open(resource.pageUrl, '_blank'); } catch {}
      }

      const successMsg: ChatMessage = {
        id: `master-hub-success-${Date.now()}`,
        role: 'assistant',
        content: `👑 **노션 마스터 허브(5대 DB) 구축 완결!**\n\n- **🔗 마스터 페이지 바로가기**: [${resource.pageTitle}](${resource.pageUrl})\n- **생성된 5대 마스터 DB**: ${resource.databases.map(d => `\`${d.name}\``).join(', ')}\n\n📌 *부모 페이지 하위에 **'${resource.pageTitle}'** 하위 페이지가 새로 생성되었습니다. 노션 페이지 우측 상단 '···' -> [연결(Connect to)]에서 내 통합이 허용되어 있는지 확인해 주세요!*`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, successMsg]);
    } catch (err: any) {
      console.error('마스터 허브 구축 실패:', err);
      showToast(err.message || '마스터 허브 구축 중 오류가 발생했습니다. 노션 페이지 [연결] 설정을 확인해주세요.', 'error');
    } finally {
      setIsBuildingMasterWorkspace(false);
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESET_TEMPLATES[presetKey];
    if (preset) {
      setCurrentTemplate(preset);
      clearRecentModifications();
      triggerCelebration();
      setCurrentGuide(createFallbackGuide(preset, 'general'));
      
      const assistantMsg: ChatMessage = {
        id: `preset-${Date.now()}`,
        role: 'assistant',
        content: `🎯 **"${preset.title}"** 프리셋 템플릿을 불러왔습니다!\n\n수정하고 싶은 속성이나 블록이 있다면 아래 대화창에 편하게 입력해 주세요. (예: "여기에 우선순위 속성 추가해줘")`,
        timestamp: Date.now(),
        templateData: preset
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (window.innerWidth < 768) {
        setActiveMobileTab('preview');
      }
    }
  };

  const resetToDefault = () => {
    setCurrentTemplate(PRESET_TEMPLATES.college_student);
    clearRecentModifications();
    setMessages(INITIAL_CHAT_MESSAGES);
    setCurrentGuide(DEFAULT_GUIDES.college_student);
  };

  // 5단계: 초보자 가이드 자동 생성 핸들러
  const generateGuide = async (audience: GuideAudience = 'general') => {
    if (!currentTemplate) return;
    setIsGeneratingGuide(true);
    try {
      const guide = await generateGuideWithGemini(currentTemplate, apiKey, audience, selectedModel);
      setCurrentGuide(guide);
      triggerCelebration();
      showToast('초보자 맞춤형 설명서가 생성되었습니다!', 'success');
    } catch (e: any) {
      console.error('가이드 생성 실패:', e);
      setCurrentGuide(createFallbackGuide(currentTemplate, audience));
      showToast('설명서 생성 중 오류가 발생하여 기본 설명서로 전환되었습니다.', 'info');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // 5단계: 노션 워크스페이스에 설명서 토글 블록 자동 삽입 핸들러
  const appendGuideToNotion = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentGuide) {
      showToast('생성된 설명서가 없습니다.', 'error');
      return { success: false, message: '생성된 설명서가 없습니다.' };
    }
    if (!createdNotionResource || !notionApiKey) {
      const msg = '먼저 상단의 [내 노션에 템플릿 생성하기]를 통해 노션 워크스페이스에 페이지를 생성해 주세요.';
      showToast(msg, 'error');
      return { 
        success: false, 
        message: msg
      };
    }
    setIsAppendingGuideToNotion(true);
    try {
      const res = await appendGuideToggleToNotionPage(createdNotionResource.pageId, currentGuide, notionApiKey);
      if (res.success) {
        showToast('노션 페이지에 사용 설명서가 추가되었습니다!', 'success');
      } else {
        showToast(res.message || '설명서 삽입에 실패했습니다.', 'error');
      }
      return res;
    } catch (err: any) {
      const errMsg = err?.message || '노션 API 통신 중 오류가 발생했습니다.';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } finally {
      setIsAppendingGuideToNotion(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        authUser,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        isDark,
        toggleDarkMode,
        selectedModel,
        setSelectedModel,
        isThinkingEnabled,
        setIsThinkingEnabled,
        toggleThinking,
        apiKey,
        setApiKey,
        currentView,
        setCurrentView,
        currentGuide,
        setCurrentGuide,
        isGuideModalOpen,
        setIsGuideModalOpen,
        isGeneratingGuide,
        isAppendingGuideToNotion,
        generateGuide,
        appendGuideToNotion,
        notionApiKey,
        setNotionApiKey,
        notionParentPageId,
        setNotionParentPageId,
        isPublishing,
        publishProgress,
        publishError,
        createdNotionResource,
        isNotionSettingsModalOpen,
        setIsNotionSettingsModalOpen,
        isPublishSuccessModalOpen,
        setIsPublishSuccessModalOpen,
        publishToNotion,
        isBuildingMasterWorkspace,
        buildMasterWorkspace,
        selectedNotionDbId,
        setSelectedNotionDbId,
        selectedExpenseDbId,
        setSelectedExpenseDbId,
        refreshNotionDatabases,
        isGoogleSyncModalOpen,
        setIsGoogleSyncModalOpen,
        googleSyncConfig,
        setGoogleSyncConfig,
        recentModifications,
        clearRecentModifications,
        activeMobileTab,
        setActiveMobileTab,
        previewMode,
        setPreviewMode,
        isApiKeyModalOpen,
        setIsApiKeyModalOpen,
        isRawJsonModalOpen,
        setIsRawJsonModalOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        messages,
        currentTemplate,
        setCurrentTemplate,
        isGenerating,
        setIsGenerating,
        sendMessage,
        clearChatHistory,
        applyPreset,
        resetToDefault,
        updateCurrentCover,
        isViewingCurationHub,
        setIsViewingCurationHub,
        selectedCuratedId,
        setSelectedCuratedId,
        loadCuratedTemplate,
        pendingChatPrompt,
        setPendingChatPrompt,
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
