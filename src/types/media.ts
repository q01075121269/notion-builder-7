// src/types/media.ts
// 제4챕터 AI 미디어 랩(AI Media Lab 2026) 세션 & FSM 데이터 모델

export type MediaDomain = 'visual' | 'video' | 'audio' | 'omni';

export type SessionMode = 'interview' | 'oneshot';

export type FSMState = 'IDLE' | 'INTERVIEWING' | 'GENERATING' | 'REFINING' | 'COMPLETED';

export interface InterviewStep {
  id: number;
  domain: MediaDomain;
  stepName: string;
  question: string;
  chips: string[];
  canSkip: boolean;
}

export interface MediaArtifact {
  id: string;
  title: string;
  domain: MediaDomain;
  aspectRatio: '16:9' | '9:16' | '1:1';
  previewUrl?: string;
  waveformData?: number[];
  promptHistory: { userRaw: string; optimizedVPO: string }[];
  stems?: { name: string; active: boolean; volume: number }[];
  captions?: { start: number; end: number; text: string }[];
  provenance: { c2paSigned: boolean; synthId: boolean; license: string };
  progressPercent: number;
  currentStepText: string;
}

export interface MediaCheckpoint {
  id: string;
  timestamp: string;
  snapshot: MediaArtifact;
}

export interface MediaSession {
  id: string;
  name: string;
  domain: MediaDomain;
  mode: SessionMode;
  fsmState: FSMState;
  currentStepIndex: number;
  interviewSteps: InterviewStep[];
  artifact: MediaArtifact | null;
  history: MediaCheckpoint[];
  historyIndex: number;
}
