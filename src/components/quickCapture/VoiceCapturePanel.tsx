import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2, AlertCircle } from 'lucide-react';

// 음성 인식 중복 단어 및 구문 정규화 제거 함수
function cleanDuplicateSpeech(text: string): string {
  if (!text) return '';
  // 1. 연속된 동일 단어 제거 (예: "회의 회의" -> "회의", "어 어 어떤" -> "어 어떤")
  let cleaned = text.replace(/\b(\S+)(?:\s+\1\b)+/gi, '$1');
  
  // 2. 연속된 동일 구문 제거 (예: "점심 먹고 점심 먹고" -> "점심 먹고")
  cleaned = cleaned.replace(/(\b.+?\b)\s+\1/gi, '$1');

  // 3. 다중 공백 정리
  return cleaned.replace(/\s+/g, ' ').trim();
}

interface VoiceCapturePanelProps {
  onSendTranscript: (text: string) => void;
  isProcessing: boolean;
}

export const VoiceCapturePanel: React.FC<VoiceCapturePanelProps> = ({
  onSendTranscript,
  isProcessing
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      // event.results 전체를 순회하여 확정된 텍스트와 임시 텍스트를 엄격히 분리
      for (let i = 0; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalStr += result[0].transcript + ' ';
        } else {
          interimStr += result[0].transcript;
        }
      }

      // 최종 확정 텍스트에 중복 단어/구문 필터링 적용
      const cleanedFinal = cleanDuplicateSpeech(finalStr);
      if (cleanedFinal) {
        setTranscript(cleanedFinal);
      }
      // 임시 텍스트는 프리뷰용으로만 실시간 표시 (누적 방지)
      setInterimTranscript(interimStr.trim());
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
      setInterimTranscript('');
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermissionDenied(true);
      }
    };

    // 음성 종료 시 최종 확정된 텍스트만 깔끔하게 보존하고 임시 버퍼는 100% 비움
    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
      setTranscript(prev => cleanDuplicateSpeech(prev));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!speechSupported) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
      setInterimTranscript('');
    } else {
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleQuickSample = (sample: string) => {
    setTranscript(cleanDuplicateSpeech(sample));
    setInterimTranscript('');
  };

  const handleSend = () => {
    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    }

    const textToSend = cleanDuplicateSpeech(transcript.trim() || interimTranscript.trim());
    if (!textToSend || isProcessing) return;
    onSendTranscript(textToSend);
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-6">
      {/* Visual Wave & Big Round Button */}
      <div className="relative flex items-center justify-center my-4">
        {/* Pulsing Aura Rings when recording */}
        {isRecording && (
          <>
            <div className="absolute w-40 h-40 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
            <div className="absolute w-32 h-32 rounded-full bg-rose-500/30 animate-pulse pointer-events-none" />
          </>
        )}

        <button
          onClick={toggleRecording}
          disabled={!speechSupported || isProcessing}
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
            isRecording
              ? 'bg-rose-500 hover:bg-rose-600 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-400/40'
              : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30 hover:scale-105 active:scale-95'
          } ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
              <span className="text-[11px] font-bold mt-1">말씀하세요...</span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-[11px] font-bold mt-1">눌러서 녹음</span>
            </>
          )}
        </button>
      </div>

      {/* Recognition Status / Support Notice */}
      <div className="text-center space-y-1">
        {isRecording ? (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>음성을 실시간 인식하고 있습니다 (한국어)</span>
          </div>
        ) : permissionDenied ? (
          <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>마이크 권한이 차단되었습니다. 브라우저 주소창에서 권한을 허용하시거나 상단 [✏️ 빠른 메모] 탭에서 텍스트로 직접 입력해 주세요.</span>
          </div>
        ) : !speechSupported ? (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>이 브라우저는 음성 API를 지원하지 않습니다. 아래 예시를 선택하거나 상단 [✏️ 빠른 메모] 탭을 이용해 주세요.</span>
          </div>
        ) : (
          <p className="text-xs text-neutral-400">
            버튼을 누르고 일정이나 지출, 할 일을 자연스럽게 말씀해 보세요.
          </p>
        )}
      </div>

      {/* Transcript Preview Box */}
      <div className="w-full max-w-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 min-h-[90px] flex flex-col justify-between space-y-3 shadow-inner">
        <div className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
          {transcript || interimTranscript ? (
            <>
              <span>{transcript}</span>
              <span className="text-neutral-400 dark:text-neutral-500 italic ml-1">{interimTranscript}</span>
            </>
          ) : (
            <span className="text-neutral-400 dark:text-neutral-500 text-xs">
              인식된 음성 텍스트가 이곳에 실시간 표시됩니다...
            </span>
          )}
        </div>

        {/* Send Action */}
        {(transcript || interimTranscript) && (
          <div className="flex justify-end pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'AI 분석 및 노션 전송 중...' : '다중 분할 및 노션 즉시 전송'}</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Voice Sample Chips */}
      <div className="w-full max-w-lg space-y-2">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-neutral-400">
          <Volume2 className="w-3.5 h-3.5" />
          <span>터치하여 바로 테스트할 수 있는 음성 예시:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            '내일 오후 3시 치과 가고, 점심 식비 12,000원 썼어',
            '금요일 14시 팀 주간 회의 일정 잡고, 기획서 초안 작성 태스크 추가해줘',
            '오늘 저녁 커피값 4,500원 결제했고, 퇴근 후 헬스장 1시간 운동하기'
          ].map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickSample(sample)}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 border border-neutral-200/50 dark:border-neutral-700/50 transition truncate max-w-full"
            >
              🗣️ "{sample}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
