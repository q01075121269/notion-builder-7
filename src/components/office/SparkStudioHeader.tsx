import React, { useState, useRef, useEffect } from 'react';
import { useSparkTheme } from '../../context/SparkThemeContext';
import { Search, Mic, MicOff, Sparkles, Loader2, Sun, Moon } from 'lucide-react';

interface SparkStudioHeaderProps {
  onStartResearch: (query: string) => void;
  isResearching?: boolean;
  defaultQuery?: string;
}

export const SparkStudioHeader: React.FC<SparkStudioHeaderProps> = ({
  onStartResearch,
  isResearching = false,
  defaultQuery = '스마트 시설물 유지관리 및 AI 에이전트 행정 자동화'
}) => {
  const { theme, toggleTheme, themeConfig } = useSparkTheme();
  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 음성 인식 (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('현재 브라우저에서는 음성 인식을 지원하지 않습니다.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && !isResearching) {
      e.preventDefault();
      onStartResearch(searchQuery.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isResearching) {
      onStartResearch(searchQuery.trim());
    }
  };

  return (
    <header className={`w-full border-b ${themeConfig.headerBorder} ${themeConfig.headerBg} px-4 lg:px-6 py-2.5 transition-colors duration-200 z-30 shrink-0 shadow-2xs`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* [중앙 옴니 리서치 바]: 대형 라운드 리서치 입력창 */}
        <form onSubmit={handleSubmit} className="w-full md:flex-1 max-w-3xl relative">
          <div className={`relative flex items-center w-full rounded-2xl border transition-all duration-200 shadow-inner ${themeConfig.inputBg} ${themeConfig.inputBorder} ${isListening ? 'ring-2 ring-rose-500/50 border-rose-500' : ''}`}>
            
            <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 shrink-0 text-slate-400" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="주제나 키워드를 입력하면 AI 에이전트들이 웹 전체를 실시간 자율 조사하여 비주얼 스파크페이지를 완성합니다."
              className={`w-full py-2.5 text-xs sm:text-sm bg-transparent outline-none font-medium truncate ${themeConfig.inputText}`}
            />

            {/* 우측 인라인 액션 버튼 모음 */}
            <div className="flex items-center space-x-1.5 pr-2 shrink-0">
              {/* 음성 입력 마이크 버튼 */}
              <button
                type="button"
                onClick={toggleListening}
                className={`
                  flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border
                  ${isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/40'
                  }
                `}
                title={isListening ? '음성 인식 중지' : '음성으로 주제 입력'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline font-bold">청취 중...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium">음성 입력</span>
                  </>
                )}
              </button>

              {/* [ 🚀 자율 리서치 시작 ] 버튼 */}
              <button
                type="submit"
                disabled={isResearching || !searchQuery.trim()}
                className={`
                  flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${themeConfig.btnPrimary}
                `}
                title="웹 전체 자율 조사 및 스파크페이지 생성"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>자율 탐색 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🚀 자율 리서치 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* [Google NotebookLM 단일 2단 Dark / Light 토글 스위치] */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`
            flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap border shrink-0
            ${themeConfig.pillBg} ${themeConfig.pillBorder} ${themeConfig.textPrimary} hover:opacity-90 shadow-xs
          `}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span>라이트 모드</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#1a73e8] shrink-0" />
              <span>다크 모드</span>
            </>
          )}
        </button>

      </div>
    </header>
  );
};
