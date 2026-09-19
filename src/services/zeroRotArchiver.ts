/**
 * [Step 3: 목적지 직행(Zero-Rot) 자산 아카이빙 파이프라인]
 * 루틴 실행 및 옴니 챗에서 생성된 모든 산출물이 각 챕터 전용 보관함과
 * 노션 DB(1~6)로 정확히 자동 분류 적재되도록 처리하는 헬퍼 서비스입니다.
 */

import { saveMediaItem } from '../lib/mediaStorage';
import { saveQuickCaptureRecord } from './quickCaptureStorage';
import { dispatchRoutedTasksToNotion } from './quickCaptureService';
import type { RoutedNotionTask, QuickCaptureRecord } from '../types/quickCapture';

export interface OfficeKnowledgeSource {
  id: number;
  name: string;
  type: 'PDF' | 'DOCX' | 'LINK' | 'EMAIL' | 'ROUTINE';
  size: string;
  selected: boolean;
  citationText: string;
  excerpt: string;
  tag: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  OFFICE_SOURCES: 'notion_architect_office_sources_v1'
};

/**
 * 1. 🎵 음악/오디오 산출물 아카이빙 (출근 스트리밍, 기상곡 등)
 * ➔ 제4챕터 [🎨 AI 미디어 랩] 보관함 > 음원 탭 및 노션 [DB 6: 미디어 에셋]으로 자동 영구 보관
 */
export async function archiveAudioArtifact(params: {
  title: string;
  dataUrl?: string;
  prompt?: string;
  notionApiKey?: string;
  targetResource?: any;
}): Promise<{ success: boolean; message: string }> {
  try {
    const audioDataUrl = params.dataUrl || 'data:audio/mp3;base64,SUQ3BAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2MTAwAAAAAAAAAAAAAAD/';
    const promptWithTag = `[📅 데일리 루틴 생성물] ${params.prompt || params.title}`;

    // 1) 제4챕터 미디어 랩 IndexedDB 보관함에 저장
    await saveMediaItem({
      type: 'AUDIO',
      dataUrl: audioDataUrl,
      prompt: promptWithTag,
      createdAt: Date.now()
    });

    let notionStatus = '로컬 보관 완료';

    // 2) 노션 API가 연동되어 있다면 [DB 6: 미디어 에셋]으로 원격 적재
    if (params.notionApiKey) {
      const task: RoutedNotionTask = {
        id: `media-db6-${Date.now()}`,
        title: `🎵 ${params.title}`,
        intent: 'idea',
        targetDbHint: 'DB 6: 미디어 에셋 DB',
        summary: promptWithTag,
        suggestedIcon: '🎵',
        properties: {
          '제목': params.title,
          '유형': '오디오',
          '태그': '📅 데일리 루틴 생성물',
          '생성일시': new Date().toISOString()
        }
      };

      const dispatchRes = await dispatchRoutedTasksToNotion([task], params.notionApiKey, params.targetResource);
      if (dispatchRes.successCount > 0) {
        notionStatus = '노션 [DB 6: 미디어 에셋] 동기화 완료';
      }
    }

    return {
      success: true,
      message: `🎵 [오디오 산출물] "${params.title}"이(가) 제4챕터 AI 미디어 랩 및 ${notionStatus} 되었습니다!`
    };
  } catch (err: any) {
    console.error('Audio archiving failed:', err);
    return {
      success: false,
      message: `오디오 아카이빙 중 오류 발생: ${err.message || '알 수 없는 오류'}`
    };
  }
}

/**
 * 2. 📄 텍스트/뉴스/토론 산출물 아카이빙 (출근길 테크 뉴스, 취침 AI 토론 대본 등)
 * ➔ 제3챕터 [📄 오피스 스튜디오] > 지식 소스 서랍 및 노션 [DB 5: 오피스 문서 DB]로 자동 적재
 */
export async function archiveTextDiscussionArtifact(params: {
  title: string;
  content: string;
  excerpt?: string;
  notionApiKey?: string;
  targetResource?: any;
}): Promise<{ success: boolean; message: string }> {
  try {
    const existingSources = getOfficeKnowledgeSources();
    const newSource: OfficeKnowledgeSource = {
      id: Date.now(),
      name: `[📅 데일리 루틴] ${params.title}`,
      type: 'ROUTINE',
      size: `${(params.content.length / 1024).toFixed(1)} KB`,
      selected: true,
      citationText: `[루틴] ${params.title}`,
      excerpt: params.excerpt || params.content.slice(0, 150) + '...',
      tag: '📅 데일리 루틴 생성물',
      createdAt: new Date().toISOString()
    };

    const updatedSources = [newSource, ...existingSources];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.OFFICE_SOURCES, JSON.stringify(updatedSources));
      window.dispatchEvent(new CustomEvent('office_sources_update'));
    }

    let notionStatus = '지식 소스 서랍 적재 완료';

    // 노션 API 연동 시 [DB 5: 오피스 문서 DB] 자동 전달
    if (params.notionApiKey) {
      const task: RoutedNotionTask = {
        id: `doc-db5-${Date.now()}`,
        title: `📄 ${params.title}`,
        intent: 'general',
        targetDbHint: 'DB 5: 오피스 문서 DB',
        summary: `[📅 데일리 루틴 생성물] ${params.content.slice(0, 200)}`,
        suggestedIcon: '📄',
        properties: {
          '문서명': params.title,
          '분류': '데일리 루틴 텍스트/토론',
          '태그': '📅 데일리 루틴 생성물',
          '생성일시': new Date().toISOString()
        }
      };

      const dispatchRes = await dispatchRoutedTasksToNotion([task], params.notionApiKey, params.targetResource);
      if (dispatchRes.successCount > 0) {
        notionStatus = '노션 [DB 5: 오피스 문서 DB] 적재 완료';
      }
    }

    return {
      success: true,
      message: `📄 [텍스트/토론 산출물] "${params.title}"이(가) 제3챕터 오피스 스튜디오 ${notionStatus} 되었습니다!`
    };
  } catch (err: any) {
    console.error('Text discussion archiving failed:', err);
    return {
      success: false,
      message: `텍스트 아카이빙 오류: ${err.message || '알 수 없는 오류'}`
    };
  }
}

/**
 * 오피스 스튜디오 지식 소스 서랍 항목 가져오기
 */
export function getOfficeKnowledgeSources(): OfficeKnowledgeSource[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFICE_SOURCES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * 3. 📅 일정/할일/가계부 산출물 아카이빙 (메일 액션 아이템, 데일리 지출 등)
 * ➔ 제2챕터 [👔 라이프 비서] 캘린더/할일 DB 및 노션 [DB 1, 2, 3]으로 실시간 동기화
 */
export async function archiveRoutineLifeTask(params: {
  title: string;
  intent: 'schedule' | 'todo' | 'expense';
  dateStr?: string;
  amount?: number;
  summary?: string;
  notionApiKey?: string;
  targetResource?: any;
}): Promise<{ success: boolean; message: string }> {
  try {
    const todayStr = params.dateStr || new Date().toISOString().split('T')[0];
    const isExpense = params.intent === 'expense';
    const isTodo = params.intent === 'todo';

    const routedTask: RoutedNotionTask = {
      id: `routine-task-${Date.now()}`,
      title: `[📅 데일리 루틴 생성물] ${params.title}`,
      intent: params.intent,
      targetDbHint: isExpense ? 'DB 3: 가계부/지출 DB' : isTodo ? 'DB 2: 할 일 DB' : 'DB 1: 일정/캘린더 DB',
      summary: params.summary || params.title,
      suggestedIcon: isExpense ? '💰' : isTodo ? '⚡' : '📅',
      properties: {
        '일정': todayStr,
        '날짜': todayStr,
        '분류': isExpense ? '지출' : isTodo ? '할 일' : '일정',
        '태그': '📅 데일리 루틴 생성물',
        '상태': '미완료',
        ...(isExpense && params.amount ? { '금액': params.amount } : {})
      }
    };

    let dispatchResult = { successCount: 0, pageUrls: [] as string[] };
    if (params.notionApiKey) {
      dispatchResult = await dispatchRoutedTasksToNotion([routedTask], params.notionApiKey, params.targetResource);
    }

    const record: QuickCaptureRecord = {
      id: `routine-qc-${Date.now()}`,
      timestamp: Date.now(),
      mode: 'memo',
      rawContent: params.title,
      correctedSummary: params.summary || params.title,
      tasks: [routedTask],
      status: params.notionApiKey && dispatchResult.successCount > 0 ? 'sent' : 'local_saved',
      notionPageUrls: dispatchResult.pageUrls
    };

    saveQuickCaptureRecord(record);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('life_hub_update'));
    }

    const targetDbName = isExpense ? 'DB 3(가계부)' : isTodo ? 'DB 2(할 일)' : 'DB 1(캘린더)';
    const notionNotice = params.notionApiKey && dispatchResult.successCount > 0
      ? ` 및 노션 ${targetDbName} 동기화 완료`
      : ' (노션 연동 대기)';

    return {
      success: true,
      message: `📅 [라이프 산출물] "${params.title}"이(가) 제2챕터 라이프 비서${notionNotice} 되었습니다!`
    };
  } catch (err: any) {
    console.error('Routine life task archiving failed:', err);
    return {
      success: false,
      message: `라이프 아카이빙 오류: ${err.message || '알 수 없는 오류'}`
    };
  }
}
