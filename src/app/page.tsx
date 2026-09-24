import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { ChatHistoryDrawer } from '../components/chat/ChatHistoryDrawer';
import { 
  getSavedSessions, 
  getActiveSessionId, 
  setActiveSessionId, 
  deleteSession,
  updateSessionMessages
} from '../services/chatStorage';
import type { ChatSession } from '../services/chatStorage';
import { 
  Sparkles, 
  Clock, 
  Send, 
  Mic, 
  Paperclip, 
  Bot, 
  Database, 
  Cpu, 
  Lightbulb, 
  Building2, 
  CalendarDays, 
  Wallet,
  X,
  Loader2,
  Square
} from 'lucide-react';
import { parseUploadedFile } from '../services/fileParserService';
import type { AttachedFile } from '../types/fileAttachment';

export const HomePage: React.FC = () => {
  const { 
    selectedModel, 
    notionApiKey, 
    notionParentPageId,
    createdNotionResource,
    setIsNotionSettingsModalOpen,
    messages,
    sendMessage,
    isGenerating,
    showToast,
    setCurrentTemplate,
    clearRecentModifications,
    clearChatHistory
  } = useApp();

  const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || notionParentPageId));

  // 1. 좌측 히스토리 서랍 및 세션 상태
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => getSavedSessions());
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(() => getActiveSessionId());

  // 2. 대화 입력창 관련 상태
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 세션 불러오기 & 실시간 자동 동기화
  useEffect(() => {
    const loadedSessions = getSavedSessions();
    setSessions(loadedSessions);
    const activeId = getActiveSessionId();
    if (activeId) {
      setActiveSessionIdState(activeId);
    } else if (loadedSessions.length > 0) {
      setActiveSessionIdState(loadedSessions[0].id);
      setActiveSessionId(loadedSessions[0].id);
    }
  }, []);

  // 메시지 변동 시 자동으로 현재 세션 업데이트 및 스크롤 하단 이동
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      updateSessionMessages(activeSessionId, messages);
      setSessions(getSavedSessions());
    }
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeSessionId]);

  // 새로운 대화 생성 (Clean Reset)
  const handleNewChat = () => {
    clearChatHistory();
    setSessions(getSavedSessions());
    setActiveSessionIdState(getActiveSessionId());
    setCurrentTemplate(null);
    clearRecentModifications();
    setInputPrompt('');
    setAttachedFiles([]);
    try {
      localStorage.removeItem('notion_template_cache');
      localStorage.removeItem('notion_template_vault_draft');
    } catch {}
    showToast('✨ 새 Co-Thinking 대화 세션이 시작되었습니다.', 'info');
  };

  // 특정 세션 선택
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveSessionIdState(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // AppContext의 messages가 자동으로 sync되거나 새로 로드될 수 있도록 조치
      window.location.reload(); // 세션 전환 시 안전한 상태 동기화
    }
  };

  // 세션 삭제
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSession(sessionId);
    setSessions(updated);
    const newActiveId = getActiveSessionId();
    setActiveSessionIdState(newActiveId);
    showToast('대화 기록이 삭제되었습니다.', 'info');
  };

  // Quick Starters 유도 칩 클릭 핸들러
  const handleQuickStarter = (promptText: string) => {
    setInputPrompt('');
    sendMessage(promptText);
  };

  // 입력 전송 핸들러 (전송 즉시 자동 1라인 초기화)
  const handleSend = () => {
    const trimmed = inputPrompt.trim();
    if ((!trimmed && attachedFiles.length === 0) || isGenerating) return;
    const promptToSend = inputPrompt;
    const filesToSend = [...attachedFiles];
    setInputPrompt(''); // API 호출 전 첫 줄에서 즉시 빈칸 리셋
    setAttachedFiles([]);
    stopListening();
    sendMessage(promptToSend, filesToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parsed = await parseUploadedFile(file);
        setAttachedFiles(prev => [...prev, parsed]);
        showToast(`📎 [${file.name}] 파일 분석 완료`, 'success');
      }
    } catch (err: any) {
      showToast(err?.message || '파일 업로드 실패', 'error');
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isListeningRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const basePromptRef = useRef<string>('');

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  // 음성 인식 (STT) 토글 - continuous & 침묵 방어 & 누적 버퍼
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge를 사용해 주세요.', 'warning');
      return;
    }

    if (isListening) {
      stopListening();
      showToast('⏹️ 음성 인식이 중지되었습니다.', 'info');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = true;

      basePromptRef.current = inputPrompt ? inputPrompt.trim() + ' ' : '';
      isListeningRef.current = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ 음성을 듣고 있습니다... (말이 끊겨도 계속 녹음됩니다)', 'info');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript + ' ';
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        if (finalTranscript) {
          basePromptRef.current += finalTranscript;
        }

        const currentCombined = (basePromptRef.current + interimTranscript).trim();
        setInputPrompt(currentCombined);
      };

      recognition.onerror = (e: any) => {
        console.warn('[STT] recognition error:', e);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          stopListening();
          showToast('마이크 접근 권한이 거부되었습니다.', 'error');
        }
      };

      recognition.onend = () => {
        // 사용자가 명시적으로 녹음 중지를 누르지 않았다면 침묵 방어로 자동 재시작
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // start 실패시 안전하게 딜레이 후 재시도
            setTimeout(() => {
              if (isListeningRef.current) {
                try { recognition.start(); } catch {}
              }
            }, 300);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error('[STT] Initialization failed:', err);
      stopListening();
    }
  };

  // 시작 유도 칩 목록 (Quick Starters)
  const quickStarters = [
    {
      id: 'worklog',
      icon: Lightbulb,
      iconColor: 'text-amber-500',
      badge: '기획',
      title: '업무일지 기획하기',
      prompt: '오늘 진행할 대표 업무일지 노션 템플릿과 데이터베이스 구조를 함께 기획해 줘.'
    },
    {
      id: 'facility',
      icon: Building2,
      iconColor: 'text-blue-500',
      badge: '설계',
      title: '시설관리 DB 설계',
      prompt: '건물 시설 관리, 정기 점검, 하자 보수 이력을 효율적으로 추적하는 노션 DB 구조를 설계해 줘.'
    },
    {
      id: 'schedule',
      icon: CalendarDays,
      iconColor: 'text-emerald-500',
      badge: '일정',
      title: '프로젝트 일정 브레인스토밍',
      prompt: '신규 프로젝트의 단계별 마일스톤과 담당자 할 일 관리를 위한 타임라인 템플릿 아이디어를 짚어줘.'
    },
    {
      id: 'asset',
      icon: Wallet,
      iconColor: 'text-purple-500',
      badge: '자산',
      title: '개인 가계부 & 자산 관리',
      prompt: '수입/지출 내역과 월별 예산 잔액을 자동 계산하는 스마트 가계부 노션 템플릿 구조를 추천해 줘.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-neutral-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white select-none relative">
      
      {/* 1. 상단 절제된 타이포그래피 헤더 & 좌측 서랍 토글 바 */}
      <header className="shrink-0 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-notion-dark-card/80 backdrop-blur px-4 py-3 sm:px-6 flex items-center justify-between z-10">
        
        {/* 좌측 서랍 토글 버튼 & 메인 제목 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition font-bold text-xs cursor-pointer shadow-2xs"
            title="대화 기록 서랍 열기"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>대화 기록</span>
          </button>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          <div className="hidden sm:flex items-center space-x-2">
            <Bot className="w-5 h-5 text-amber-500" />
            <h1 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">
              노아(NOA) Co-Thinking Canvas
            </h1>
          </div>
        </div>

        {/* 우측 노션 연결 및 엔진 칩 */}
        <div className="flex items-center space-x-2">
          <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
            <Cpu className="w-3.5 h-3.5" />
            <span>엔진: {selectedModel}</span>
          </span>

          <button
            onClick={() => setIsNotionSettingsModalOpen(true)}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
              isNotionConnected
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60 animate-pulse'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isNotionConnected ? '노션 연결됨' : '노션 연결 (클릭)'}</span>
          </button>
        </div>
      </header>

      {/* 2. 중앙 대형 대화·기획 캔버스 메인 영역 (max-w-4xl mx-auto) */}
      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto overflow-hidden px-4 py-4 sm:px-6">
        
        {/* 대화 스크롤 본문 */}
        <div 
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700"
        >
          {/* 타이포그래피 안내 헤더 */}
          <div className="text-center py-6 space-y-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              노아(NOA)와 함께 생각을 정리하고 기획해 보세요
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
              명시적인 템플릿 생성 명령 전까지, 노아(NOA)는 아이디어를 경청하고 구조화하는 대화형 Co-Thinking 파트너로 동작합니다.
            </p>
          </div>

          {/* Quick Starters (초기 유도 칩 4개 배치 - 메시지가 환영메시지만 있거나 적을 때 안내) */}
          {messages.length <= 1 && (
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>💡 시작을 돕는 가벼운 기획 프롬프트 (Quick Starters)</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickStarters.map((qs) => {
                  const IconComponent = qs.icon;
                  return (
                    <div
                      key={qs.id}
                      onClick={() => handleQuickStarter(qs.prompt)}
                      className="group p-4 rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <IconComponent className={`w-4 h-4 ${qs.iconColor}`} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {qs.badge}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                          {qs.title}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                          {qs.prompt}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 스크롤 대화 메시지 스트림 */}
          <div className="space-y-4 pt-2">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
          </div>
        </div>

        {/* 3. 하단 중앙 대화 입력 영역 (ChatGPT / NotebookLM 스타일) */}
        <div className="pt-3 pb-2 shrink-0">
          <div className="relative rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-300 dark:border-neutral-700 shadow-xl focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all p-3 space-y-2">
            
            {/* 첨부된 파일 바 렌더링 */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                {attachedFiles.map((att, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
                  >
                    <span>📎</span>
                    <span className="font-semibold max-w-[120px] truncate">{att.name}</span>
                    <button 
                      onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-neutral-400 hover:text-red-500 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 입력 텍스트 에어리어 */}
            <textarea
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="노아(NOA)에게 어떤 업무를 도와드릴지 편하게 말씀해 주세요..."
              className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none resize-none leading-relaxed min-h-[40px]"
            />

            {/* 하단 버튼 툴바 */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
              
              {/* 좌측 첨부 & 음성 버튼 */}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingFile}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  title="파일 첨부 (엑셀, 워드, PDF, 이미지)"
                >
                  {isParsingFile ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Paperclip className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleListening}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-md'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  title={isListening ? '녹음 중지 (클릭 시 종료)' : '음성 지속 입력 (클릭 시 시작)'}
                >
                  {isListening ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[11px]">녹음 중지</span>
                    </>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* 우측 전송 버튼 */}
              <button
                onClick={handleSend}
                disabled={(!inputPrompt.trim() && attachedFiles.length === 0) || isGenerating}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  (inputPrompt.trim() || attachedFiles.length > 0) && !isGenerating
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100'
                    : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed'
                }`}
              >
                <span>전송</span>
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* 4. 좌측 슬라이드 대화 기록 서랍 */}
      <ChatHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
};

export default HomePage;
