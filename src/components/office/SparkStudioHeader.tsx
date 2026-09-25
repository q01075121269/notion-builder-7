import React, { useState, useRef, useEffect } from 'react';
import { useSparkTheme, type SparkTheme } from '../../context/SparkThemeContext';
import { Search, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';

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
  const { theme, setTheme, themeConfig } = useSparkTheme();
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

  const themes: { id: SparkTheme; label: string; icon: string }[] = [
    { id: 'silicon-dark', label: '실리콘 다크', icon: '🌌' },
    { id: 'clean-modern', label: '클린 모던', icon: '🏛️' },
    { id: 'warm-editorial', label: '웜 에디토리얼', icon: '☕' }
  ];

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

        {/* [원클릭 테마 전환 세그먼트]: 3대 테마 토글 버튼 그룹 */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900/60 dark:bg-black/40 border border-slate-700/50 backdrop-blur shrink-0">
          {themes.map(t => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`
                  flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap
                  ${isActive
                    ? 'bg-slate-800/90 text-white shadow-sm ring-1 ring-white/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }
                `}
                title={`${t.label} 비주얼 테마로 전환`}
              >
                <span className="text-sm">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
