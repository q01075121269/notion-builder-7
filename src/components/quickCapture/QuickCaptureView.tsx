import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { CaptureMode, QuickCaptureRecord, RoutedNotionTask } from '../../types/quickCapture';
import type { CreatedNotionResource } from '../../types/notion';
import { cleanDuplicateSpeech } from '../../services/quickCaptureLocalParser';
import { 
  getQuickCaptureRecords, 
  saveQuickCaptureRecord, 
  deleteQuickCaptureRecord, 
  clearQuickCaptureRecords,
  isDefaultQuickCaptureEnabled,
  setDefaultQuickCaptureEnabled
} from '../../services/quickCaptureStorage';
import { 
  analyzeAndRouteQuickText, 
  analyzeImageWithGeminiVision, 
  dispatchRoutedTasksToNotion 
} from '../../services/quickCaptureService';
import { VoiceCapturePanel } from './VoiceCapturePanel';
import { PhotoCapturePanel } from './PhotoCapturePanel';
import { TextMemoPanel } from './TextMemoPanel';
import { CaptureHistoryTimeline } from './CaptureHistoryTimeline';
import { 
  Zap, 
  Mic, 
  Camera, 
  Edit3, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuickCaptureView: React.FC = () => {
  const { 
    apiKey, 
    selectedModel, 
    notionApiKey, 
    notionParentPageId,
    createdNotionResource, 
    setIsNotionSettingsModalOpen,
    isBuildingMasterWorkspace,
    buildMasterWorkspace,
    selectedNotionDbId,
    setSelectedNotionDbId,
    selectedExpenseDbId,
    setSelectedExpenseDbId,
    refreshNotionDatabases 
  } = useApp();
  const [activeMode, setActiveMode] = useState<CaptureMode>('voice');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [records, setRecords] = useState<QuickCaptureRecord[]>([]);
  const [isDefaultMobile, setIsDefaultMobile] = useState<boolean>(isDefaultQuickCaptureEnabled());
  const isProcessingRef = useRef<boolean>(false);
  const lastProcessedTextRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  useEffect(() => {
    setRecords(getQuickCaptureRecords());
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleDefaultMobile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsDefaultMobile(checked);
    setDefaultQuickCaptureEnabled(checked);
    showToast('success', checked ? '모바일 접속 시 첫 화면이 퀵 캡처로 설정되었습니다.' : '모바일 기본 첫 화면 설정이 해제되었습니다.');
  };

  // 1. 텍스트 / 음성 캡처 전송 처리 (중복 방지 락 및 태스크 레벨 정규화 적용)
  const handleProcessText = async (rawText: string, mode: CaptureMode = 'voice') => {
    const cleanedText = cleanDuplicateSpeech(rawText);
    if (!cleanedText) return;

    // A. 동시 요청 차단 (Mutex Lock)
    if (isProcessingRef.current) {
      console.warn('[QuickCapture] 이미 다른 전송 작업이 진행 중입니다.');
      return;
    }

    // B. 3초 이내 동일 텍스트 중복 입력 방지 (모바일 멀티터치 방어)
    const now = Date.now();
    if (
      lastProcessedTextRef.current.text === cleanedText &&
      now - lastProcessedTextRef.current.time < 3000
    ) {
      console.warn('[QuickCapture] 3초 이내 동일 텍스트 중복 방지됨');
      return;
    }

    isProcessingRef.current = true;
    lastProcessedTextRef.current = { text: cleanedText, time: now };
    setIsProcessing(true);

    try {
      // Gemini 멀티 인텐트 라우팅
      const analysis = await analyzeAndRouteQuickText(cleanedText, apiKey, selectedModel);

      // 작업 레벨 중복 제거 (동일 인텐트 + 동일 제목 + 동일 날짜 중복 제거)
      const uniqueTasks: RoutedNotionTask[] = [];
      const seenKeys = new Set<string>();
      for (const t of analysis.tasks) {
        const normTitle = (t.title || '').replace(/\s+/g, '').toLowerCase();
        const normDate = String(t.properties?.['일정'] || t.properties?.['날짜'] || '').split(' ')[0];
        const key = `${t.intent}-${normTitle}-${normDate}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueTasks.push(t);
        }
      }
      analysis.tasks = uniqueTasks;
      
      // 노션 연동 리소스 구성 (DB가 0개이더라도 부모 페이지가 있으면 즉시 Fallback 생성)
      const targetResource: CreatedNotionResource | null = createdNotionResource || (notionParentPageId ? {
        pageId: notionParentPageId,
        pageUrl: `https://notion.so/${notionParentPageId.replace(/-/g, '')}`,
        pageTitle: '노션 부모 페이지',
        databases: [],
        createdAt: new Date().toISOString()
      } : null);

      // 노션 워크스페이스로 즉시 전송
      const dispatchResult = await dispatchRoutedTasksToNotion(
        analysis.tasks,
        notionApiKey,
        targetResource
      );

      const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || notionParentPageId));
      const record: QuickCaptureRecord = {
        id: `qc-${Date.now()}`,
        timestamp: Date.now(),
        mode,
        rawContent: cleanedText,
        correctedSummary: analysis.correctedText || analysis.rawInput,
        tasks: analysis.tasks,
        status: isNotionConnected && dispatchResult.successCount > 0 ? 'sent' : 'local_saved',
        notionPageUrls: dispatchResult.pageUrls
      };

      saveQuickCaptureRecord(record);
      setRecords(getQuickCaptureRecords());

      if (isNotionConnected && dispatchResult.successCount > 0) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        showToast('success', `노션에 ${dispatchResult.successCount}개의 작업이 1초 만에 안전하게 등록되었습니다!`);
      } else {
        showToast('success', '로컬 보관함에 퀵 캡처되었습니다. (노션 연동 시 자동 생성 가능)');
      }
    } catch (err: any) {
      console.error('Quick capture failed:', err);
      showToast('error', err.message || '퀵 캡처 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  // 2. 사진 OCR 캡처 전송 처리
  const handleProcessImage = async (base64DataUrl: string) => {
    setIsProcessing(true);
    try {
      const analysis = await analyzeImageWithGeminiVision(base64DataUrl, apiKey);

      const targetResource: CreatedNotionResource | null = createdNotionResource || (notionParentPageId ? {
        pageId: notionParentPageId,
        pageUrl: `https://notion.so/${notionParentPageId.replace(/-/g, '')}`,
        pageTitle: '노션 부모 페이지',
        databases: [],
        createdAt: new Date().toISOString()
      } : null);

      const dispatchResult = await dispatchRoutedTasksToNotion(
        analysis.tasks,
        notionApiKey,
        targetResource
      );

      const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || notionParentPageId));
      const record: QuickCaptureRecord = {
        id: `qc-${Date.now()}`,
        timestamp: Date.now(),
        mode: 'photo',
        rawContent: analysis.rawInput,
        imageUrl: base64DataUrl,
        correctedSummary: analysis.correctedText || analysis.rawInput,
        tasks: analysis.tasks,
        status: isNotionConnected && dispatchResult.successCount > 0 ? 'sent' : 'local_saved',
        notionPageUrls: dispatchResult.pageUrls
      };

      saveQuickCaptureRecord(record);
      setRecords(getQuickCaptureRecords());

      if (isNotionConnected && dispatchResult.successCount > 0) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
        showToast('success', `이미지 분석 완료! 노션에 ${dispatchResult.successCount}개 항목이 등록되었습니다.`);
      } else {
        showToast('success', '이미지 분석 및 로컬 보관이 완료되었습니다.');
      }
    } catch (err: any) {
      console.error('Vision capture failed:', err);
      showToast('error', err.message || '사진 OCR 분석 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRecord = (id: string) => {
    deleteQuickCaptureRecord(id);
    setRecords(getQuickCaptureRecords());
  };

  const handleClearAll = () => {
    if (window.confirm('모든 퀵 캡처 기록을 삭제하시겠습니까?')) {
      clearQuickCaptureRecords();
      setRecords([]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-notion-dark-bg p-4 sm:p-6 select-none">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-purple-500/10 border border-amber-500/20 dark:border-amber-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 font-black">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-base text-neutral-900 dark:text-white">
                  모바일 1초 퀵 캡처 허브
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Quick Capture
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                노션 앱을 켜지 않고도 음성, 사진, 메모를 즉시 노션 DB로 전송합니다.
              </p>
            </div>
          </div>

          {/* Mobile Default Toggle */}
          <label className="flex items-center space-x-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 cursor-pointer bg-white/80 dark:bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-amber-500" />
            <span>모바일 첫 화면</span>
            <input
              type="checkbox"
              checked={isDefaultMobile}
              onChange={handleToggleDefaultMobile}
              className="rounded text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
            />
          </label>
        </div>

        {/* Notion Connection Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-neutral-800 text-xs shadow-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${notionApiKey ? 'bg-emerald-500 animate-ping' : 'bg-neutral-400'}`} />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {notionApiKey 
                ? (typeof window !== 'undefined' && localStorage.getItem('master_life_hub_db_id')
                    ? '👑 노션 라이프 허브 DB 실시간 1초 연동 활성화됨'
                    : `연결된 노션 워크스페이스 (${createdNotionResource?.databases?.length || 0}개 DB 감지)`)
                : '노션 미연동 상태 (캡처 시 로컬 보관함에 안전하게 저장됩니다)'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. 기본 일정/할일 DB 선택 */}
            {createdNotionResource && createdNotionResource.databases.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-neutral-400 font-semibold">📅 일정:</span>
                <select
                  value={selectedNotionDbId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedNotionDbId(val || null);
                    if (val) localStorage.setItem('selected_notion_db_id', val);
                  }}
                  className="text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 outline-hidden"
                >
                  {createdNotionResource.databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2. 가계부 DB 선택 (지출 분기 라우팅용) */}
            {createdNotionResource && createdNotionResource.databases.length > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-neutral-400 font-semibold">💰 가계부:</span>
                <select
                  value={selectedExpenseDbId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedExpenseDbId(val || null);
                    if (val) localStorage.setItem('selected_expense_db_id', val);
                  }}
                  className="text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 outline-hidden"
                >
                  <option value="">(자동 탐색 / 라이프 허브 합산)</option>
                  {createdNotionResource.databases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {notionApiKey && notionParentPageId && (
              <button
                onClick={() => refreshNotionDatabases()}
                title="DB 목록 새로고침"
                className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                🔄
              </button>
            )}

            {notionApiKey && notionParentPageId && typeof window !== 'undefined' && !localStorage.getItem('master_life_hub_db_id') && (
              <button
                onClick={buildMasterWorkspace}
                disabled={isBuildingMasterWorkspace}
                className="text-[11px] bg-teal-600 hover:bg-teal-700 text-white font-bold px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isBuildingMasterWorkspace ? (
                  <span>⏳ 3대 DB 구축 중...</span>
                ) : (
                  <span>👑 마스터 DB 원클릭 구축</span>
                )}
              </button>
            )}
            {!notionApiKey && (
              <button
                onClick={() => setIsNotionSettingsModalOpen(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1"
              >
                <Settings className="w-3 h-3" />
                <span>노션 연동하기</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-200/60 dark:bg-neutral-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveMode('voice')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeMode === 'voice'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-500" />
            <span>🎙️ 음성 인식</span>
          </button>

          <button
            onClick={() => setActiveMode('photo')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeMode === 'photo'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-500" />
            <span>📷 사진/OCR</span>
          </button>

          <button
            onClick={() => setActiveMode('memo')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeMode === 'memo'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4 text-emerald-500" />
            <span>✏️ 빠른 메모</span>
          </button>
        </div>

        {/* Mode Main Panels */}
        <div className="bg-white dark:bg-notion-dark-card border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          {activeMode === 'voice' && (
            <VoiceCapturePanel
              onSendTranscript={(text: string) => handleProcessText(text, 'voice')}
              isProcessing={isProcessing}
            />
          )}

          {activeMode === 'photo' && (
            <PhotoCapturePanel
              onSendImage={handleProcessImage}
              isProcessing={isProcessing}
            />
          )}

          {activeMode === 'memo' && (
            <TextMemoPanel
              onSendMemo={(memo: string) => handleProcessText(memo, 'memo')}
              isProcessing={isProcessing}
            />
          )}
        </div>

        {/* Timeline Feed */}
        <CaptureHistoryTimeline
          records={records}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAll}
        />

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-short">
          <div className={`flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white ${
            toastMessage.type === 'success' ? 'bg-neutral-900 dark:bg-white dark:text-neutral-900 border border-neutral-700' : 'bg-rose-600'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
