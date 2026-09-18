import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  Database,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Calendar,
  Code2,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { 
  sendToOrchestrator, 
  speakKoreanText, 
  stopSpeech
} from '../services/orchestratorService';
import type {
  ChatMessage,
  OrchestratorResponse 
} from '../services/orchestratorService';

export const HomePage: React.FC = () => {
  const { 
    setCurrentView, 
    selectedModel, 
    notionApiKey, 
    createdNotionResource,
    apiKey,
    authUser,
    showToast
  } = useApp();

  const isNotionConnected = Boolean(notionApiKey && createdNotionResource);

  // 대화 히스토리 상태
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: '안녕하세요! 노션 마스터 AI 비서입니다. 무엇을 도와드릴까요? 음성이나 텍스트로 자유롭게 말씀해 주세요.\n(예: "내일 3시 치과 일정 등록", "CORS 에러 트러블슈팅", "프로젝트 관리 템플릿 만들어줘")',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      intent: 'CHAT'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // 채팅 스크롤 자동 이동
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // STT 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'ko-KR';

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
          // 음성 인식 후 자동 전송
          handleSendMessage(transcript);
        };

        recog.onerror = (event: any) => {
          console.warn('음성 인식 오류:', event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      stopSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // 음성 인식 토글
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 최신 모바일 브라우저를 권장합니다.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeech();
      setIsSpeaking(false);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('음성 인식 시작 실패:', err);
      }
    }
  };

  // TTS 토글
  const toggleTts = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    }
    setIsTtsEnabled(!isTtsEnabled);
  };

  // 메시지 전송 처리
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isLoading) return;

    setInputValue('');
    stopSpeech();
    setIsSpeaking(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response: OrchestratorResponse = await sendToOrchestrator(
        text,
        newHistory,
        apiKey,
        authUser?.email
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply_message,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        redirect_url: response.redirect_url,
        needs_clarification: response.needs_clarification,
        payload: response.payload
      };

      setMessages((prev) => [...prev, aiMessage]);

      // TTS 출력 (활성화 상태인 경우)
      if (isTtsEnabled) {
        setIsSpeaking(true);
        speakKoreanText(response.reply_message, () => {
          setIsSpeaking(false);
        });
      }

      // 리다이렉트 대상이 있고, 추가 확인이 필요 없는 경우 페이지 전환 옵션 안내
      if (response.redirect_url && !response.needs_clarification) {
        const target = response.redirect_url;
        const viewMap: Record<string, any> = {
          '/builder': 'builder',
          '/life': 'life',
          '/devlab': 'devlab'
        };

        if (viewMap[target]) {
          showToast(
            `${response.intent === 'BUILDER' ? '✨ 템플릿 빌더' : response.intent === 'LIFE' ? '🌿 라이프 허브' : '💻 개발 랩'} 연결 준비 완료: 작업실로 즉시 이동할 수 있습니다.`,
            'info'
          );
        }
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: 'CHAT'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 대화 초기화
  const handleResetChat = () => {
    stopSpeech();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: '대화 기록이 초기화되었습니다. 새로운 질문이나 요청을 말씀해 주세요!',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        intent: 'CHAT'
      }
    ]);
  };

  // 빠른 프롬프트 추천 칩
  const quickChips = [
    { label: '📅 내일 치과 일정', text: '내일 오후 3시 치과 진료 예약 잡아줘' },
    { label: '🍱 점심 식비 등록', text: '점심 식비로 12,000원 결제했어' },
    { label: '🐞 CORS 에러 일지', text: 'Next.js CORS 오류 원인과 해결법 개발 랩에 정리해줘' },
    { label: '✨ 프로젝트 템플릿', text: '스타트업 팀 프로젝트 관리 노션 템플릿 만들어줘' },
    { label: '💬 오늘 할 일 추천', text: '오늘 집중하기 좋은 업무 루틴 추천해줘' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg text-neutral-900 dark:text-white select-none">
      
      {/* 1. 히어로 헤더 섹션 */}
      <div className="relative overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-notion-dark-card py-8 sm:py-10 px-4 sm:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-emerald-500/5 to-blue-500/5 dark:from-amber-500/10 dark:via-emerald-500/10 dark:to-blue-500/10 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>v2.0 Orchestrator Hub</span>
            </span>

            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <Cpu className="w-3.5 h-3.5" />
              <span>엔진: {selectedModel}</span>
            </span>

            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              <Database className="w-3.5 h-3.5" />
              <span>{isNotionConnected ? '노션 워크스페이스 연결됨' : '노션 연결 대기'}</span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Notion AI Master Workspace <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-600">v2.0</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              양방향 대화형 비서에게 말하거나 타이핑하면, 3대 독립 작업실(노션 빌더·라이프 허브·개발 랩)로 의도를 자동 분류하고 처리해 드립니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 대화형 AI 오케스트레이터 인터페이스 (채팅 피드 + 음성 STT / TTS) */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 pt-6 pb-2">
        <div className="bg-white dark:bg-notion-dark-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
          
          {/* 오케스트레이터 상단 툴바 */}
          <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                  <span>대화형 AI 오케스트레이터</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  음성/텍스트 멀티턴 대화 • 실시간 인텐트 라우팅
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* TTS 음성 토글 버튼 */}
              <button
                onClick={toggleTts}
                title={isTtsEnabled ? '한국어 음성 읽기 켜짐 (클릭하여 끄기)' : '한국어 음성 읽기 꺼짐 (클릭하여 켜기)'}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                  isTtsEnabled
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {isTtsEnabled ? (
                  <>
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-amber-500' : ''}`} />
                    <span className="hidden sm:inline">음성 TTS 켜짐</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">음성 음소거</span>
                  </>
                )}
              </button>

              {/* 대화 리셋 버튼 */}
              <button
                onClick={handleResetChat}
                title="대화 히스토리 초기화"
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 채팅 메시지 피드 영역 */}
          <div className="p-4 sm:p-5 h-64 sm:h-72 overflow-y-auto space-y-4 bg-neutral-50/20 dark:bg-transparent">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-tr-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* 인텐트 분류 배지 및 페이지 바로가기 버튼 */}
                    {!isUser && msg.intent && msg.intent !== 'CHAT' && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            msg.intent === 'BUILDER'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : msg.intent === 'LIFE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {msg.intent === 'BUILDER' ? (
                            <Sparkles className="w-2.5 h-2.5" />
                          ) : msg.intent === 'LIFE' ? (
                            <Calendar className="w-2.5 h-2.5" />
                          ) : (
                            <Code2 className="w-2.5 h-2.5" />
                          )}
                          <span>
                            {msg.intent === 'BUILDER'
                              ? '노션 빌더 액션'
                              : msg.intent === 'LIFE'
                              ? '라이프 허브 액션'
                              : '개발 랩 액션'}
                          </span>
                        </span>

                        {/* 작업실 바로가기 이동 버튼 */}
                        {msg.redirect_url && (
                          <button
                            onClick={() => {
                              if (msg.redirect_url === '/builder') setCurrentView('builder');
                              else if (msg.redirect_url === '/life') setCurrentView('life');
                              else if (msg.redirect_url === '/devlab') setCurrentView('devlab');
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:scale-105 active:scale-95 transition shadow-2xs cursor-pointer"
                          >
                            <span>작업실로 즉시 이동</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* 되묻기 알림 */}
                    {!isUser && msg.needs_clarification && (
                      <div className="flex items-center space-x-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        <HelpCircle className="w-3 h-3" />
                        <span>정확한 저장을 위해 추가 정보를 말씀해 주세요!</span>
                      </div>
                    )}

                    <span className="text-[10px] text-neutral-400 block px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI 답변 대기 중 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl px-4 py-3 border border-neutral-200/80 dark:border-neutral-700 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-150" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 pl-1">
                    의도 분석 및 작업실 라우팅 중...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* 추천 칩 목록 */}
          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800/80 bg-white dark:bg-notion-dark-card flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-neutral-400 shrink-0 font-medium mr-1">추천:</span>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.text)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* 하단 입력 폼 (텍스트 입력창 + 마이크 버튼) */}
          <div className="p-3 sm:p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {/* 마이크 버튼 (음성 STT) */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? '음성 듣는 중... 클릭하여 중지' : '모바일/PC 마이크 음성 입력'}
                className={`p-2.5 sm:p-3 rounded-2xl transition flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200 dark:ring-rose-900/50'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* 텍스트 입력 인풋 */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    isListening
                      ? '🎙️ 지금 말씀하세요... 한국어로 듣고 있습니다.'
                      : '비서에게 말하거나 타이핑하세요 (예: "내일 3시 치과 예약해줘")'
                  }
                  disabled={isLoading}
                  className="w-full bg-white dark:bg-neutral-800/90 text-neutral-900 dark:text-white text-xs sm:text-sm rounded-2xl px-4 py-2.5 sm:py-3 border border-neutral-200/80 dark:border-neutral-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/40 transition placeholder:text-neutral-400"
                />
              </div>

              {/* 전송 버튼 */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 sm:p-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-40 hover:opacity-90 active:scale-95 transition shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* 2. 3대 독립 작업실 대형 대시보드 카드 그리드 */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center space-x-2">
                <span>🎯 3대 독립 작업실 바로가기</span>
              </h2>
              <p className="text-xs text-neutral-500">목적에 맞게 분리된 특화 작업 공간으로 즉시 입장합니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            
            {/* 카드 1: ✨ 노션 템플릿 빌더 (v1 격리 보존) */}
            <div 
              onClick={() => setCurrentView('builder')}
              className="group relative bg-white dark:bg-notion-dark-card rounded-3xl p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl">
                    ✨
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <ShieldCheck className="w-3 h-3" />
                    <span>v1 핵심 보존</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    노션 템플릿 빌더
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    AI 대화형 프롬프트로 맞춤형 노션 템플릿을 제작하고, 실시간 반응형 프리뷰와 Formula 2.0 수식을 연동합니다.
                  </p>
                </div>

                <ul className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>SplitLayout 2분할 실시간 렌더링</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>엑셀/PDF/이미지 멀티포맷 역설계</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>노션 API 원클릭 원격 워크스페이스 배포</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 relative z-10">
                <div className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-between group-hover:bg-amber-600 dark:group-hover:bg-amber-400 dark:group-hover:text-neutral-900 transition">
                  <span>빌더 작업실 입장</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

            {/* 카드 2: 🌿 라이프 허브 */}
            <div 
              onClick={() => setCurrentView('life')}
              className="group relative bg-white dark:bg-notion-dark-card rounded-3xl p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-2xl">
                    🌿
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span>일상 & 생산성</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    라이프 허브
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    스마트 일정, 이메일 AI 브리핑, 가계부 지출 내역, 데일리 우선순위 할 일을 한곳에서 체계적으로 관리합니다.
                  </p>
                </div>

                <ul className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Google Calendar / 노션 캘린더 동기화</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>이메일 핵심 요약 및 긴급 액션 자동 추출</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>소비 지출 카테고리 시각화 통계</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 relative z-10">
                <div className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-between group-hover:bg-emerald-600 dark:group-hover:bg-emerald-400 dark:group-hover:text-neutral-900 transition">
                  <span>라이프 허브 입장</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

            {/* 카드 3: 💻 개발 랩 */}
            <div 
              onClick={() => setCurrentView('devlab')}
              className="group relative bg-white dark:bg-notion-dark-card rounded-3xl p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden hover:-translate-y-1"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl">
                    💻
                  </div>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <span>엔지니어링 Studio</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    개발 랩
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    새로운 기술 아이디어 기획, 버그 트러블슈팅 일지, 그리고 Gemini 시스템 프롬프트 라이브러리를 보관합니다.
                  </p>
                </div>

                <ul className="space-y-1 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>개발 백로그 및 기술 스택 아카이브</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>API 및 인프라 장애 원인/해결책 기록</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>원클릭 AI 시스템 프롬프트 복사 엔진</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 relative z-10">
                <div className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-between group-hover:bg-blue-600 dark:group-hover:bg-blue-400 dark:group-hover:text-neutral-900 transition">
                  <span>개발 랩 입장</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3. 하단 퀵 유틸리티 바 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200/80 dark:border-neutral-800">
          
          <div 
            onClick={() => setCurrentView('quick_capture')}
            className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-notion-dark-card hover:border-rose-300 dark:hover:border-rose-700 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">⚡ 1초 퀵 캡처 허브</h4>
                <p className="text-[11px] text-neutral-500">모바일 음성 말하기 또는 영수증 사진 한 장으로 1초 노션 전송</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400" />
          </div>

          <div 
            onClick={() => setCurrentView('dashboard')}
            className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-notion-dark-card hover:border-blue-300 dark:hover:border-blue-700 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">📑 템플릿 보관함 & 스마트 사서</h4>
                <p className="text-[11px] text-neutral-500">월간 TOP 50 프리셋 둘러보기 및 노션 전수 검색 AI 사서 Q&A</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;
