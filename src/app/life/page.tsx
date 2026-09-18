// src/app/life/page.tsx
// 라이프 허브: 노션 DB 및 퀵 캡처 실시간 양방향 융합 렌더링 화면
// Step 0: 사용자 동선 최적화 (1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약) 및 Notion/Linear 모노톤 스타일 리팩토링

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Mail, 
  CreditCard, 
  CheckSquare, 
  ArrowLeft, 
  RefreshCw, 
  Edit2, 
  X, 
  Check,
  LayoutGrid,
  Layers
} from 'lucide-react';

import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { 
  fetchNotionDatabaseRows, 
  deleteNotionPage, 
  updateNotionPage, 
  calculateDDay 
} from '../../services/notionLifeHubSync';
import type { 
  LifeScheduleItem, 
  LifeExpenseItem, 
  LifeTodoItem 
} from '../../services/notionLifeHubSync';
import { 
  parseNotionScheduleRows, 
  parseNotionExpenseRows, 
  extractQuickCaptureLifeItems 
} from '../../services/lifeHubDataParser';
import { 
  getDeletedLifeItemIds, 
  markLifeItemAsDeleted, 
  removeTaskFromQuickCapture 
} from '../../services/quickCaptureStorage';
import { ScheduleView } from '../../components/life/ScheduleView';
import { TodoManagerView } from '../../components/life/TodoManagerView';
import { ExpenseAnalyticsView } from '../../components/life/ExpenseAnalyticsView';
import { EmailManagerView, type LifeEmailItem } from '../../components/life/EmailManagerView';

// 사용자 동선 우선순위 재배치: 1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약
type LifeHubTab = 'schedule' | 'todo' | 'expense' | 'email';
type ViewMode = 'tabs' | 'grid';

const INITIAL_DEMO_SCHEDULES: LifeScheduleItem[] = [
  { 
    id: 's1', 
    title: '치과 정기 검진 및 스케일링', 
    date: '2026-09-19 15:00', 
    start: '2026-09-19 15:00',
    end: '2026-09-19 16:00',
    dday: 'D-1', 
    category: '건강', 
    icon: '🦷',
    location: '강남 연세사랑치과의원 3층',
    attendees: [
      { name: '나 (본인)', email: 'me@notion.com', status: 'accepted' },
      { name: '김원장 (주치의)', email: 'dentist@clinic.com', status: 'accepted' }
    ],
    notes: '스케일링 및 어금니 레진 치료 경과 확인. 치과 보험 청구 서류 수령 필요.',
    status: '미완료'
  },
  { 
    id: 's2', 
    title: 'Q3 프로젝트 최종 릴리즈 회의', 
    date: '2026-09-22 10:30', 
    start: '2026-09-22 10:30',
    end: '2026-09-22 12:00',
    dday: 'D-4', 
    category: '업무', 
    icon: '💼',
    location: '본사 대회의실 A (온/오프라인 병행)',
    meetingUrl: 'https://meet.google.com/q3-release-final',
    attendees: [
      { name: '이팀장 (PM)', email: 'pm@company.com', status: 'accepted' },
      { name: '박개발 (Lead)', email: 'dev@company.com', status: 'accepted' },
      { name: '최디자인 (UI/UX)', email: 'design@company.com', status: 'accepted' },
      { name: '나 (아키텍트)', email: 'me@company.com', status: 'accepted' }
    ],
    notes: '1. Vercel 서버리스 프록시 성능 모니터링 결산\n2. Gemini 3.6 Flash 모델 지연시간 벤치마크 공유\n3. 프로덕션 DNS 컷오버 체크리스트 점검',
    status: '미완료'
  },
  { 
    id: 's3', 
    title: '부모님 생신 저녁 식사', 
    date: '2026-09-26 18:30', 
    start: '2026-09-26 18:30',
    end: '2026-09-26 21:00',
    dday: 'D-8', 
    category: '가족', 
    icon: '🎂',
    location: '경복궁 한정식 서초점 룸 5호',
    attendees: [
      { name: '아버지', status: 'accepted' },
      { name: '어머니', status: 'accepted' },
      { name: '동생', status: 'accepted' },
      { name: '나 (예약자)', status: 'accepted' }
    ],
    notes: '생신 케이크(수제 딸기 케이크) 픽업 17:30까지 완료할 것. 선물(스마트워치) 포장 완료.',
    status: '미완료'
  },
  {
    id: 's4',
    title: 'Notion AI 아키텍처 주간 싱크업',
    date: '2026-09-18 14:00',
    start: '2026-09-18 14:00',
    end: '2026-09-18 15:00',
    dday: 'D-Day',
    category: '업무',
    icon: '⚡',
    meetingUrl: 'https://meet.google.com/notion-arch-sync',
    location: 'Google Meet 화상회의',
    attendees: [
      { name: '나', email: 'me@company.com', status: 'accepted' },
      { name: '정엔지니어', email: 'jung@company.com', status: 'accepted' }
    ],
    notes: '1. 노션 캘린더 iCal 연동 규격 검토\n2. 슬라이드오버 드로어 인터페이스 테스트 및 피드백',
    status: '진행 중'
  }
];

const INITIAL_DEMO_TODOS: LifeTodoItem[] = [
  { 
    id: 't1', 
    title: 'v2.0 라우트 분리 작업 완료 및 배포', 
    done: true, 
    priority: '🔥 긴급/중요', 
    eisenhower: 'P1',
    dueDate: '2026-09-18', 
    reminder: 'before_30m',
    subtasks: [
      { id: 'st-t1-1', title: '1단계: 변경 모듈 단위 테스트 및 번들 빌드 검증 (`npm run build`)', done: true },
      { id: 'st-t1-2', title: '2단계: Vercel 서버리스 프록시 환경변수 및 CORS 연동 확인', done: true },
      { id: 'st-t1-3', title: '3단계: GitHub main 브랜치 커밋/푸시 및 프로덕션 배포 완료 점검', done: true }
    ]
  },
  { 
    id: 't2', 
    title: '주간 업무 결산 리포트 작성', 
    done: false, 
    priority: '⭐ 중요/계획', 
    eisenhower: 'P2',
    dueDate: '2026-09-19', 
    reminder: 'day_9am',
    subtasks: [
      { id: 'st-t2-1', title: '1단계: 이번 주 주요 추진 성과 및 지표 데이터 취합', done: true },
      { id: 'st-t2-2', title: '2단계: 노션 주간 업무 보고 템플릿에 핵심 요약 초안 작성', done: false },
      { id: 'st-t2-3', title: '3단계: 팀 슬랙 공유 및 차주 우선순위 안건 등록', done: false }
    ]
  },
  { 
    id: 't3', 
    title: '헬스장 하체 운동 40분', 
    done: false, 
    priority: '☕ 여유/보관', 
    eisenhower: 'P4',
    dueDate: '2026-09-20', 
    reminder: 'none' 
  },
  { 
    id: 't4', 
    title: '전기세 및 공과금 자동이체 확인', 
    done: true, 
    priority: '⚡ 긴급/위임', 
    eisenhower: 'P3',
    dueDate: '2026-09-17', 
    reminder: 'none' 
  }
];

const INITIAL_DEMO_EXPENSES: LifeExpenseItem[] = [
  // 2026년 9월 데이터: 총 1,375,000원 (250만원 예산의 55.0% 소진 -> 18일 기준 권장 60.0% 대비 5% 안전)
  // 식비: 480,000원
  { id: 'ex1', title: '점심 식사 (구내식당 정식)', amount: 9000, date: '2026-09-18', category: '식비', icon: '🍱', paymentMethod: '체크카드', type: '지출', merchant: '사내식당' },
  { id: 'ex2', title: '팀 프로젝트 저녁 회식 (삼겹살)', amount: 120000, date: '2026-09-15', category: '식비', icon: '🥩', paymentMethod: '신용카드', type: '지출', merchant: '맛찬들 왕소금구이' },
  { id: 'ex3', title: '주말 가족 외식 (이탈리안)', amount: 165000, date: '2026-09-13', category: '식비', icon: '🍝', paymentMethod: '신용카드', type: '지출', merchant: '보나베띠' },
  { id: 'ex4', title: '주간 식자재 장보기 (이마트)', amount: 142000, date: '2026-09-08', category: '식비', icon: '🛒', paymentMethod: '신용카드', type: '지출', merchant: '이마트 역삼점' },
  { id: 'ex5', title: '점심 샐러드 & 샌드위치 배달', amount: 44000, date: '2026-09-04', category: '식비', icon: '🥗', paymentMethod: '간편결제', type: '지출', merchant: '배달의민족' },

  // 주거/구독: 365,000원
  { id: 'ex6', title: '아파트 관리비 및 공과금', amount: 285000, date: '2026-09-10', category: '주거/구독', icon: '🏠', paymentMethod: '현금', type: '지출', merchant: '관리사무소' },
  { id: 'ex7', title: '넷플릭스 & 유튜브 프리미엄 구독', amount: 34000, date: '2026-09-05', category: '주거/구독', icon: '🎬', paymentMethod: '신용카드', type: '지출', merchant: '구글/넷플릭스' },
  { id: 'ex8', title: '클라우드 저장소 & 노션 AI 구독', amount: 46000, date: '2026-09-02', category: '주거/구독', icon: '☁️', paymentMethod: '신용카드', type: '지출', merchant: 'Notion Labs' },

  // 쇼핑: 150,000원
  { id: 'ex9', title: '가을 출퇴근용 셔츠 및 슬랙스', amount: 115000, date: '2026-09-11', category: '쇼핑', icon: '👔', paymentMethod: '신용카드', type: '지출', merchant: '무신사 스토어' },
  { id: 'ex10', title: '사무용 듀얼 모니터 암 거치대', amount: 35000, date: '2026-09-06', category: '쇼핑', icon: '🖥️', paymentMethod: '간편결제', type: '지출', merchant: '네이버페이' },

  // 교통: 125,000원
  { id: 'ex11', title: '지하철/버스 정기 교통카드 충전', amount: 65000, date: '2026-09-17', category: '교통', icon: '🚇', paymentMethod: '신용카드', type: '지출', merchant: '티머니' },
  { id: 'ex12', title: '심야 야근 카카오 T 택시비', amount: 24000, date: '2026-09-12', category: '교통', icon: '🚕', paymentMethod: '간편결제', type: '지출', merchant: '카카오모빌리티' },
  { id: 'ex13', title: '주유소 휘발유 주유', amount: 36000, date: '2026-09-07', category: '교통', icon: '⛽', paymentMethod: '신용카드', type: '지출', merchant: 'GS칼텍스' },

  // 문화/여가: 110,000원
  { id: 'ex14', title: '영화관람 및 팝콘 세트 (2인)', amount: 38000, date: '2026-09-14', category: '문화/여가', icon: '🍿', paymentMethod: '간편결제', type: '지출', merchant: 'CGV 강남' },
  { id: 'ex15', title: '업무용 개발 전문 서적 2권 구입', amount: 52000, date: '2026-09-09', category: '문화/여가', icon: '📚', paymentMethod: '신용카드', type: '지출', merchant: '교보문고' },
  { id: 'ex16', title: '주말 미술 전시회 입장 티켓', amount: 20000, date: '2026-09-03', category: '문화/여가', icon: '🎨', paymentMethod: '신용카드', type: '지출', merchant: '예술의전당' },

  // 기타/미분류 (누수 의심 지출): 총 145,000원 (그 중 편의점/카페 소액 104,400원 = 72% 비중)
  { id: 'ex17', title: 'GS25 편의점 야식 및 컵라면', amount: 9800, date: '2026-09-17', category: '기타', icon: '🏪', paymentMethod: '체크카드', type: '지출', merchant: 'GS25 역삼점', isLeak: true },
  { id: 'ex18', title: '스타벅스 카페 라떼 & 마카롱', amount: 11500, date: '2026-09-16', category: '기타', icon: '☕', paymentMethod: '간편결제', type: '지출', merchant: '스타벅스 코리아', isLeak: true },
  { id: 'ex19', title: 'CU 편의점 음료 및 초콜릿', amount: 5400, date: '2026-09-15', category: '기타', icon: '🍫', paymentMethod: '체크카드', type: '지출', merchant: 'CU 강남스퀘어점', isLeak: true },
  { id: 'ex20', title: '메가MGC커피 아이스 아메리카노', amount: 4000, date: '2026-09-14', category: '기타', icon: '🥤', paymentMethod: '간편결제', type: '지출', merchant: '메가커피 테헤란로점', isLeak: true },
  { id: 'ex21', title: '세븐일레븐 모바일 간식 결제', amount: 14200, date: '2026-09-11', category: '기타', icon: '🏪', paymentMethod: '간편결제', type: '지출', merchant: '세븐일레븐', isLeak: true },
  { id: 'ex22', title: '이디야 커피 2잔 테이크아웃', amount: 6400, date: '2026-09-09', category: '기타', icon: '☕', paymentMethod: '신용카드', type: '지출', merchant: '이디야커피', isLeak: true },
  { id: 'ex23', title: 'GS25 간식 및 샌드위치', amount: 8600, date: '2026-09-08', category: '기타', icon: '🥪', paymentMethod: '체크카드', type: '지출', merchant: 'GS25 서초점', isLeak: true },
  { id: 'ex24', title: '컴포즈 커피 및 디저트', amount: 7500, date: '2026-09-05', category: '기타', icon: '☕', paymentMethod: '간편결제', type: '지출', merchant: '컴포즈커피', isLeak: true },
  { id: 'ex25', title: '배달의민족 야간 배달팁', amount: 4000, date: '2026-09-04', category: '기타', icon: '🛵', paymentMethod: '간편결제', type: '지출', merchant: '배달의민족', isLeak: true },
  { id: 'ex26', title: '스타벅스 원두 및 텀블러 쿠폰', amount: 18000, date: '2026-09-03', category: '기타', icon: '☕', paymentMethod: '신용카드', type: '지출', merchant: '스타벅스 코리아', isLeak: true },
  { id: 'ex27', title: 'CU 편의점 생수 및 간식 묶음', amount: 15000, date: '2026-09-01', category: '기타', icon: '🏪', paymentMethod: '신용카드', type: '지출', merchant: 'CU 본점', isLeak: true },
  { id: 'ex28', title: '모바일 앱 인앱결제 정기권', amount: 22000, date: '2026-09-10', category: '기타', icon: '📱', paymentMethod: '신용카드', type: '지출', merchant: '애플 앱스토어', isLeak: false },
  { id: 'ex29', title: '우체국 등기 발송 및 서류 수수료', amount: 18600, date: '2026-09-02', category: '기타', icon: '✉️', paymentMethod: '체크카드', type: '지출', merchant: '서울중앙우체국', isLeak: false },

  // 2026년 8월 데이터 (월 스위칭 시 지난달 결산용)
  { id: 'ex-aug-1', title: '8월 아파트 관리비', amount: 260000, date: '2026-08-10', category: '주거/구독', icon: '🏠', paymentMethod: '현금', type: '지출' },
  { id: 'ex-aug-2', title: '8월 식비 및 마트 장보기', amount: 620000, date: '2026-08-20', category: '식비', icon: '🍱', paymentMethod: '신용카드', type: '지출' },
  { id: 'ex-aug-3', title: '8월 하계 휴가 숙소 예약', amount: 350000, date: '2026-08-05', category: '문화/여가', icon: '🏖️', paymentMethod: '신용카드', type: '지출' }
];

const INITIAL_DEMO_EMAILS: LifeEmailItem[] = [
  {
    id: 'e1',
    sender: 'GitHub Security Team',
    senderEmail: 'security@github.com',
    subject: '[Security Alert] GitHub Personal Access Token 의심 활동 감지',
    summary: '새로운 IP(198.51.100.42)에서 PAT 토큰을 사용한 비인가 리포지토리 접근 시도가 차단되었습니다. 즉시 토큰을 폐기하고 재생성하십시오.',
    time: '10분 전',
    date: '2026-09-18',
    urgency: 'urgent',
    suggestedAction: 'GitHub Personal Access Token 폐기 및 보안 키 갱신',
    bodyText: `안녕하세요, 개발자님.

GitHub Security Center에서 귀하의 계정 및 연동 리포지토리에 대한 비정상적인 보안 이벤트를 감지하였습니다.

• 감지 일시: 2026년 9월 18일 18:48 (KST)
• 이벤트 유형: Suspicious Personal Access Token (classic) API Usage
• 출발지 IP: 198.51.100.42 (US / Cloud Provider Exit Node)
• 영향받은 리포지토리: notion-builder-7 (Private)

해당 토큰을 통한 고위험 쓰기(Write) 권한 요청은 시스템에 의해 즉시 차단(Blocked) 조치되었습니다.
추가 피해를 예방하기 위해 아래 권고 조치를 24시간 이내에 수행해 주시기 바랍니다.

[권고 조치 사항]
1. GitHub 계정 설정 > Developer Settings에서 해당 토큰 폐기(Revoke)
2. Fine-grained Personal Access Token으로 전환 및 최소 권한 부여
3. 2단계 인증(2FA) 재인증 및 SSH 키 목록 점검

상세 보안 감사 로그를 첨부파일로 동봉하오니 확인 바랍니다.

GitHub Security Operations Team`,
    attachments: [
      {
        id: 'att-1',
        name: 'github_security_audit_log.txt',
        size: '45 KB',
        type: 'file',
        dataContent: `[AUDIT LOG] 2026-09-18 18:48:12 UTC\nIP: 198.51.100.42\nAction: git-receive-pack\nStatus: BLOCKED\nToken_Prefix: ghp_9921\nReason: Anomalous Geo-Location & Rate Limit Triggered`
      }
    ]
  },
  {
    id: 'e2',
    sender: '이팀장 (PM)',
    senderEmail: 'pm.lee@company.com',
    subject: 'Q3 프로젝트 v2.0 최종 릴리즈 명세서 및 일정 검토 요청',
    summary: 'Q3 마일스톤 최종 v2.0 프로덕션 릴리즈를 위한 아키텍처 점검 및 Vercel 서버리스 배포 체크리스트 검토 요청의 건입니다.',
    time: '1시간 전',
    date: '2026-09-18',
    urgency: 'important',
    suggestedAction: 'Q3 프로젝트 v2.0 릴리즈 명세서 검토 및 피드백 회신',
    bodyText: `안녕하세요, 개발팀 여러분. PM 이팀장입니다.

어느덧 Q3 스프린트 개발 마일스톤이 마무리 단계에 접어들었습니다.
다음 주 목요일로 예정된 메이저 v2.0 프로덕션 릴리즈를 앞두고, 최종 아키텍처 명세서 및 릴리즈 체크리스트를 공유드립니다.

이번 릴리즈의 핵심 변경 사항은 다음과 같습니다:
1. 라이프 허브 4대 모듈(일정, 할일, 가계부, 이메일) v2.0 통합
2. Vercel 서버리스 Notion API 프록시 캐싱 적용
3. Gemini 2.5 Flash 기반 AI 누수 진단 및 자동 답장 파이프라인

동봉된 [Q3_Release_Specification.pdf] 문서를 검토하신 후,
아키텍처 및 보안 측면에서 추가 보완이 필요한 부분이 있다면 다음 주 월요일(9/21) 오전 11시까지 피드백 또는 회신 부탁드립니다.

모두 한 주간 수고 많으셨습니다.

감사합니다.
PM 이팀장 드림`,
    attachments: [
      {
        id: 'att-2',
        name: 'Q3_Release_Specification.pdf',
        size: '2.8 MB',
        type: 'pdf',
        dataContent: `[PDF DUMMY] Q3 Release Architecture Specification v2.0\nPrepared by PM Team\nApproved for Production Deploy`
      }
    ]
  },
  {
    id: 'e3',
    sender: 'Notion Team HQ',
    senderEmail: 'updates@m.notion.so',
    subject: 'Notion 3.0 신규 수식 라이브러리 및 롤업 규격 안내',
    summary: 'Notion 3.0 공식 업데이트로 강력해진 Formulas 2.0 및 가계부/프로젝트 롤업 최적화 템플릿 치트시트가 공개되었습니다.',
    time: '어제',
    date: '2026-09-17',
    urgency: 'info',
    suggestedAction: 'Notion 3.0 신규 수식 치트시트 워크스페이스 템플릿 적용',
    bodyText: `안녕하세요, 노션 빌더 여러분!

더욱 스마트하고 강력해진 Notion 3.0 기능 업데이트 소식을 전해드립니다.

이제 가계부 데이터베이스와 프로젝트 보드에서 복잡한 다단계 수식(Formula)과 실시간 롤업(Rollup)을 코드 블록 수준으로 자유롭게 작성할 수 있습니다.

[주요 업데이트 하이라이트]
• Array functions: map(), filter(), find() 등의 배열 함수 전면 지원
• Dynamic Pacing Formula: 일자별 예산 소진율 자동 연산 수식 템플릿 기본 탑재
• Multi-database Rollup: 3개 이상의 관계형 DB 간 실시간 롤업 캐싱 가속

새로운 수식 문법과 실무 활용 예제가 정리된 [Notion_Formulas_Cheatsheet.xlsx] 파일을 함께 첨부해 드립니다. 지금 바로 워크스페이스에 적용해 보세요!

Happy Building!
The Notion Team`,
    attachments: [
      {
        id: 'att-3',
        name: 'Notion_Formulas_Cheatsheet.xlsx',
        size: '680 KB',
        type: 'xlsx',
        dataContent: `[EXCEL DUMMY] Formula_Name,Syntax,Description\nmap,prop("Items").map(...),Iterate array\nrollup_sum,sum(prop("Amount")),Rollup sum`
      }
    ]
  },
  {
    id: 'e4',
    sender: 'Google Cloud Billing',
    senderEmail: 'google-cloud-billing@google.com',
    subject: '2026년 8월 Google Cloud 결제 영수증 발행 안내',
    summary: '2026년 8월 Google Cloud Platform 청구 금액 12,400원이 등록된 신용카드로 정상 결제 완료되었습니다.',
    time: '2일 전',
    date: '2026-09-16',
    urgency: 'info',
    suggestedAction: 'GCP 8월 결제 영수증 회계 처리 및 법인카드 지출 등록',
    bodyText: `Google Cloud Platform 고객님께,

2026년 8월 청구 주기(2026-08-01 ~ 2026-08-31)에 대한 정기 이용 요금이 정상적으로 결제되었음을 알려드립니다.

• 결제 계정: Notion-Builder-Production-Account
• 결제 수단: 신용카드 (끝자리: 7721)
• 총 청구 금액: ₩12,400 (VAT 포함)
• 결제 상태: 결제 성공 (Payment Succeeded)

[서비스별 세부 청구 내역]
- Cloud Functions & Serverless API Gateway: ₩7,200
- Artifact Registry & Container Storage: ₩3,100
- Cloud KMS & Secret Manager: ₩2,100

세부 청구 내역서(Tax Invoice)는 첨부된 PDF 영수증 파일을 확인하시거나 Google Cloud 콘솔의 [결제] 메뉴에서 언제든지 다운로드하실 수 있습니다.

감사합니다.
Google Cloud Billing 팀`,
    attachments: [
      {
        id: 'att-4',
        name: 'GCP_Billing_Invoice_202608.pdf',
        size: '320 KB',
        type: 'pdf',
        dataContent: `[TAX INVOICE] Google Cloud Platform\nBilling Period: 2026-08\nTotal: 12,400 KRW (PAID)`
      }
    ]
  }
];

export const LifePage: React.FC = () => {
  const { 
    setCurrentView, 
    notionApiKey, 
    apiKey,
    showToast,
    createdNotionResource,
    selectedNotionDbId,
    selectedExpenseDbId,
    setIsNotionSettingsModalOpen
  } = useApp();

  // 뷰 모드: 탭 스위칭 vs 4분할 한눈에 보기
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [activeTab, setActiveTab] = useState<LifeHubTab>('schedule');

  const [scheduleItems, setScheduleItems] = useState<LifeScheduleItem[]>(() => {
    const deletedIds = getDeletedLifeItemIds();
    return INITIAL_DEMO_SCHEDULES.filter(s => !deletedIds.has(s.id) && !deletedIds.has(s.title.trim()));
  });

  const [todoItems, setTodoItems] = useState<LifeTodoItem[]>(() => {
    const deletedIds = getDeletedLifeItemIds();
    return INITIAL_DEMO_TODOS.filter(t => !deletedIds.has(t.id) && !deletedIds.has(t.title.trim()));
  });

  const [expenseItems, setExpenseItems] = useState<LifeExpenseItem[]>(() => {
    const deletedIds = getDeletedLifeItemIds();
    return INITIAL_DEMO_EXPENSES.filter(e => !deletedIds.has(e.id) && !deletedIds.has(e.title.trim()));
  });

  const [emailSummaries, setEmailSummaries] = useState<LifeEmailItem[]>(INITIAL_DEMO_EMAILS);

  // 이메일에서 스마트할일로 전송 파이프라인
  const handleTransferMailToTodo = useCallback((mail: LifeEmailItem) => {
    const newTodo: LifeTodoItem = {
      id: `t-mail-${Date.now()}`,
      title: `[메일 액션] ${mail.suggestedAction || mail.subject}`,
      done: false,
      priority: mail.urgency === 'urgent' ? '🔥 긴급/중요' : mail.urgency === 'important' ? '⭐ 중요/계획' : '⚡ 긴급/위임',
      eisenhower: mail.urgency === 'urgent' ? 'P1' : mail.urgency === 'important' ? 'P2' : 'P3',
      dueDate: '2026-09-19',
      dday: 'D-1',
      reminder: 'before_30m',
      subtasks: [
        { id: `st-m-1-${Date.now()}`, title: `1단계: "${mail.sender}" 발신 메일 원문 및 요구사항 상세 파악`, done: true },
        { id: `st-m-2-${Date.now()}`, title: `2단계: 첨부파일 및 필요 서류 검토 완료`, done: false },
        { id: `st-m-3-${Date.now()}`, title: `3단계: AI 답장 생성기를 통한 회신 발송 또는 후속 처리`, done: false }
      ]
    };
    setTodoItems((prev) => [newTodo, ...prev]);
    showToast(`"${mail.suggestedAction || mail.subject}" 스마트할일로 등록되었습니다.`, 'success');
  }, [showToast]);

  // 스마트할일 ➔ 스마트일정 타임블로킹 크로스오버 파이프라인 (DnD 및 원클릭 지원)
  const handleScheduleTodoFromTask = useCallback((
    todoData: any,
    targetDate = '2026-09-18',
    targetTime = '14:00'
  ) => {
    const startHour = parseInt(targetTime.split(':')[0], 10) || 14;
    const endHourStr = String(startHour + 1).padStart(2, '0');
    const fullStart = `${targetDate} ${targetTime}`;
    const fullEnd = `${targetDate} ${endHourStr}:00`;

    const newSchedule: LifeScheduleItem = {
      id: `s-todo-${Date.now()}`,
      title: todoData.title,
      date: fullStart,
      start: fullStart,
      end: fullEnd,
      dday: calculateDDay(targetDate),
      category: '할 일',
      icon: '🎯',
      status: '진행 중',
      notes: `스마트할일 타임블로킹으로 자동 연동된 일정 (아이젠하워 우선순위: ${todoData.eisenhower || 'P1'})`,
      attendees: [{ name: '나 (담당자)', status: 'accepted' }]
    };

    setScheduleItems(prev => [newSchedule, ...prev]);
    showToast(`"${todoData.title}" 일정이 ${targetDate} ${targetTime} 캘린더 타임블록에 등록되었습니다!`, 'success');
  }, [showToast]);



  const [isLoadingNotion, setIsLoadingNotion] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 일정 수정 팝업 상태
  const [editingItem, setEditingItem] = useState<LifeScheduleItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('일정');
  const [editStatus, setEditStatus] = useState<string>('미완료');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const handleOpenEditModal = (item: LifeScheduleItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDate(item.date);
    setEditCategory(item.category || '일정');
    setEditStatus(item.status || '미완료');
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      if (notionApiKey && editingItem.notionPageId) {
        await updateNotionPage(notionApiKey, editingItem.notionPageId, {
          title: editTitle.trim(),
          date: editDate,
          category: editCategory,
          status: editStatus
        });
      }

      setScheduleItems(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            title: editTitle.trim(),
            date: editDate,
            dday: calculateDDay(editDate),
            category: editCategory,
            status: editStatus
          };
        }
        return item;
      }));

      setTodoItems(prev => prev.map(t => {
        if (t.title === editingItem.title) {
          return { ...t, title: editTitle.trim(), done: editStatus === '완료' };
        }
        return t;
      }));

      setEditingItem(null);
    } catch (e) {
      console.error('일정 수정 실패:', e);
      alert('일정 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 일정 영구 삭제 처리 (로컬 스토리지 + 퀵 캡처 저장소 + 노션 클라우드 동시 파기)
  const handleDeleteItem = async (item: LifeScheduleItem) => {
    if (!window.confirm(`'${item.title}' 일정을 삭제하시겠습니까?\n로컬 보관함과 노션 데이터베이스에서 안전하게 제거됩니다.`)) {
      return;
    }

    markLifeItemAsDeleted(item.id, item.title);
    removeTaskFromQuickCapture(item.id, item.title);

    setScheduleItems(prev => prev.filter(s => s.id !== item.id && s.title.trim() !== item.title.trim()));
    setTodoItems(prev => prev.filter(t => t.title.trim() !== item.title.trim()));

    try {
      if (notionApiKey && item.notionPageId) {
        await deleteNotionPage(notionApiKey, item.notionPageId);
      }
    } catch (e) {
      console.error('노션 원격 일정 삭제 중 경고:', e);
    }
  };

  // 지출 내역 삭제 처리
  const handleDeleteExpense = (item: LifeExpenseItem) => {
    if (!window.confirm(`'${item.title}' 지출 내역을 삭제하시겠습니까?`)) {
      return;
    }
    markLifeItemAsDeleted(item.id, item.title);
    removeTaskFromQuickCapture(item.id, item.title);
    setExpenseItems(prev => prev.filter(e => e.id !== item.id && e.title.trim() !== item.title.trim()));
  };

  // 할 일 항목 삭제 처리
  const handleDeleteTodo = (e: React.MouseEvent, item: LifeTodoItem) => {
    e.stopPropagation();
    markLifeItemAsDeleted(item.id, item.title);
    removeTaskFromQuickCapture(item.id, item.title);
    setTodoItems(prev => prev.filter(t => t.id !== item.id && t.title.trim() !== item.title.trim()));
    setScheduleItems(prev => prev.filter(s => s.title.trim() !== item.title.trim()));
  };

  // 라이프 허브 데이터 동기화 (로컬 퀵 캡처 최신 항목 + 노션 클라우드 실제 DB 행 병합)
  const syncLifeHubData = useCallback(async () => {
    setIsLoadingNotion(true);
    try {
      const deletedIds = getDeletedLifeItemIds();

      // 1. 로컬 퀵 캡처 데이터 즉시 로드 (삭제된 항목 자동 제외)
      const qcData = extractQuickCaptureLifeItems();

      // 2. 노션 DB에서 최신 저장된 행(row) 쿼리
      let notionSchedules: LifeScheduleItem[] = [];
      let notionExpenses: LifeExpenseItem[] = [];

      const masterLifeDbId = typeof window !== 'undefined' ? localStorage.getItem('master_life_hub_db_id') : null;
      const targetLifeDbId = selectedNotionDbId || masterLifeDbId || createdNotionResource?.databases?.find(d => d.name.includes('라이프'))?.id;

      const masterExpenseDbId = typeof window !== 'undefined' ? localStorage.getItem('master_expense_db_id') : null;
      const targetExpenseDbId = selectedExpenseDbId || masterExpenseDbId || createdNotionResource?.databases?.find(d => d.name.includes('가계부') || d.name.includes('지출'))?.id;

      if (notionApiKey && targetLifeDbId) {
        const lifeRows = await fetchNotionDatabaseRows(notionApiKey, targetLifeDbId, 25);
        if (lifeRows.length > 0) {
          notionSchedules = parseNotionScheduleRows(lifeRows);
        }
      }

      if (notionApiKey && targetExpenseDbId) {
        const expRows = await fetchNotionDatabaseRows(notionApiKey, targetExpenseDbId, 25);
        if (expRows.length > 0) {
          notionExpenses = parseNotionExpenseRows(expRows);
        }
      }

      // 3. 데이터 병합 및 중복/삭제 제거
      const mergedSchedules = [...qcData.schedules].filter(
        s => !deletedIds.has(s.id) && !deletedIds.has(s.title.trim()) && !deletedIds.has(s.title.replace(/^⚡\s*/, '').trim())
      );
      notionSchedules.forEach(ns => {
        const cleanTitle = ns.title.replace(/^⚡\s*/, '').trim();
        if (
          !deletedIds.has(ns.id) && 
          !deletedIds.has(ns.title.trim()) && 
          !deletedIds.has(cleanTitle) &&
          !mergedSchedules.some(s => s.title.replace(/^⚡\s*/, '').trim() === cleanTitle)
        ) {
          mergedSchedules.push(ns);
        }
      });
      setScheduleItems(mergedSchedules);

      // 가계부 병합
      const mergedExpenses = [...qcData.expenses].filter(
        e => !deletedIds.has(e.id) && !deletedIds.has(e.title.trim()) && !deletedIds.has(e.title.replace(/^⚡\s*/, '').trim())
      );
      notionExpenses.forEach(ne => {
        const cleanTitle = ne.title.replace(/^⚡\s*/, '').trim();
        if (
          !deletedIds.has(ne.id) && 
          !deletedIds.has(ne.title.trim()) && 
          !deletedIds.has(cleanTitle) &&
          !mergedExpenses.some(e => e.title.replace(/^⚡\s*/, '').trim() === cleanTitle)
        ) {
          mergedExpenses.push(ne);
        }
      });
      setExpenseItems(mergedExpenses);

      // 할 일 병합
      const mergedTodos = [...qcData.todos].filter(
        t => !deletedIds.has(t.id) && !deletedIds.has(t.title.trim())
      );
      mergedSchedules.forEach((ms, idx) => {
        if (!mergedTodos.some(t => t.title === ms.title)) {
          mergedTodos.push({
            id: `todo-${idx}-${ms.id}`,
            title: ms.title,
            done: ms.status === '완료',
            priority: ms.category === '할 일' ? '🔥 우선' : '⭐ 보통'
          });
        }
      });
      setTodoItems(mergedTodos);

      setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('라이프 허브 동기화 중 경고:', err);
    } finally {
      setIsLoadingNotion(false);
    }
  }, [notionApiKey, selectedNotionDbId, selectedExpenseDbId, createdNotionResource]);

  // 페이지 진입 시 실시간 동기화 실행
  useEffect(() => {
    syncLifeHubData();
  }, [syncLifeHubData]);

  const toggleTodo = (id: string) => {
    setTodoItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const isNotionConnected = Boolean(notionApiKey && (createdNotionResource || selectedNotionDbId));
  const totalExpenseAmount = expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  // 1. 스마트 일정 모듈 렌더러 (구글/노션 캘린더급 3대 뷰 스위처, 우측 상세 서랍, 크로스오버 타임블록 DnD 드롭존)
  const renderScheduleModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="스마트 일정 모듈 로드 중 오류가 발생했습니다.">
      <ScheduleView
        schedules={scheduleItems}
        onOpenEditModal={handleOpenEditModal}
        onDeleteItem={handleDeleteItem}
        onQuickCapture={() => setCurrentView('quick_capture')}
        onAddScheduleFromTodo={handleScheduleTodoFromTask}
        isCompact={isCompact}
      />
    </ErrorBoundary>
  );

  // 2. 스마트 할 일 모듈 렌더러 (정밀 D-Day 엔진, 브라우저 푸시 알림, AI 서브태스크 분해기, 아이젠하워 4분면, 타임블록 전송)
  const renderTodoModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="스마트 할 일 모듈 로드 중 오류가 발생했습니다.">
      <TodoManagerView
        todoItems={todoItems}
        setTodoItems={setTodoItems}
        onToggleTodo={toggleTodo}
        onDeleteTodo={handleDeleteTodo}
        onQuickCapture={() => setCurrentView('quick_capture')}
        onScheduleTodo={(todo) => handleScheduleTodoFromTask(todo, todo.dueDate || '2026-09-18', '14:00')}
        isCompact={isCompact}
      />
    </ErrorBoundary>
  );


  // 3. 가계부 & 지출 모듈 렌더러 (월간 페이싱 게이지, 카테고리별 다차원 분석, AI 누수 진단 칩)
  const renderExpenseModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="가계부 및 소비 분석 모듈 로드 중 오류가 발생했습니다.">
      <ExpenseAnalyticsView
        expenseItems={expenseItems}
        setExpenseItems={setExpenseItems}
        onDeleteExpense={handleDeleteExpense}
        onQuickCapture={() => setCurrentView('quick_capture')}
        isCompact={isCompact}
        notionApiKey={notionApiKey}
        expenseDbId={selectedExpenseDbId || undefined}
        geminiApiKey={apiKey}

      />
    </ErrorBoundary>
  );

  // 4. 이메일 AI 요약 & 수퍼휴먼 인박스 모듈 렌더러
  const renderEmailModule = (isCompact = false) => (
    <ErrorBoundary fallbackTitle="이메일 요약 모듈 로드 중 오류가 발생했습니다.">
      <EmailManagerView
        emails={emailSummaries}
        setEmails={setEmailSummaries}
        onTransferToTodo={handleTransferMailToTodo}
        onQuickCapture={() => setCurrentView('quick_capture')}
        isCompact={isCompact}
        apiKey={apiKey}
      />
    </ErrorBoundary>
  );


  // 탭 목록 정의 (1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약 순서 고정)
  const TABS: { 
    id: LifeHubTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    countText: string;
    activeBorderColor: string;
    badgeColor: string;
  }[] = [
    {
      id: 'schedule',
      label: '1. 📅 스마트일정',
      icon: Calendar,
      countText: `${scheduleItems.length}건`,
      activeBorderColor: 'border-blue-500',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
    },
    {
      id: 'todo',
      label: '2. 🎯 스마트할일',
      icon: CheckSquare,
      countText: `${todoItems.filter(t => t.done).length}/${todoItems.length}`,
      activeBorderColor: 'border-amber-500',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
    },
    {
      id: 'expense',
      label: '3. 💰 가계부',
      icon: CreditCard,
      countText: totalExpenseAmount > 0 ? `${Math.round(totalExpenseAmount / 10000)}만` : `${expenseItems.length}건`,
      activeBorderColor: 'border-emerald-500',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    },
    {
      id: 'email',
      label: '4. ✉️ 이메일 요약',
      icon: Mail,
      countText: `${emailSummaries.length}건`,
      activeBorderColor: 'border-purple-500',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-50 dark:bg-notion-dark-bg text-slate-900 dark:text-slate-100 selection:bg-slate-200 dark:selection:bg-neutral-700 font-sans">
      {/* 상단 서브 헤더 네비게이션 */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3.5 border-b border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-notion-dark-bg/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">홈으로</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🌿</span>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                라이프 허브 (Life Hub)
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 whitespace-nowrap hidden sm:block">
                사용자 동선 맞춤 4대 라이프 대시보드 (스마트일정 · 할일 · 가계부 · 이메일)
              </p>
            </div>
          </div>
        </div>

        {/* 뷰 모드 토글 및 노션 연동 상태 / 동기화 */}
        <div className="flex items-center space-x-2">
          {/* 탭 뷰 vs 4분할 그리드 뷰 토글 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 shadow-xs">
            <button
              onClick={() => setViewMode('tabs')}
              title="상단 탭 스위칭 보기"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'tabs'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">탭 보기</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="4분할 그리드로 한눈에 보기"
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">4분할 한눈에</span>
            </button>
          </div>

          <button
            onClick={syncLifeHubData}
            disabled={isLoadingNotion}
            title="노션 및 퀵 캡처 최신 데이터 새로고침"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotion ? 'animate-spin text-blue-500' : ''}`} />
            <span className="whitespace-nowrap">{isLoadingNotion ? '동기화 중...' : '실시간 동기화'}</span>
            {lastSyncTime && <span className="text-[10px] text-slate-400 hidden sm:inline whitespace-nowrap">({lastSyncTime})</span>}
          </button>

          <button
            onClick={() => setIsNotionSettingsModalOpen(true)}
            title={isNotionConnected ? '노션 DB 연결됨 (설정 열기)' : '노션 연결 대기 (클릭하여 노션 키 설정)'}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition whitespace-nowrap shadow-xs ${
              isNotionConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 animate-pulse'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isNotionConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="whitespace-nowrap">{isNotionConnected ? '노션 DB 연결됨' : '노션 연결 대기'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 sm:p-7 space-y-6">
        {/* 상단 4대 메뉴 네비게이션 탭 (1. 스마트일정 -> 2. 스마트할일 -> 3. 가계부 -> 4. 이메일 요약 순서) */}
        <div className="bg-slate-100/90 dark:bg-neutral-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-700/60 shadow-xs overflow-x-auto scrollbar-none">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-w-[520px] sm:min-w-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && viewMode === 'tabs';

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setViewMode('tabs');
                  }}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-neutral-700'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border border-slate-200/60 dark:border-neutral-700/60 whitespace-nowrap ${tab.badgeColor}`}>
                    {tab.countText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 컨텐츠 렌더링 분기: [탭 보기] vs [4분할 한눈에 보기] */}
        {viewMode === 'tabs' ? (
          <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 sm:p-7 shadow-sm">
            {activeTab === 'schedule' && renderScheduleModule(false)}
            {activeTab === 'todo' && renderTodoModule(false)}
            {activeTab === 'expense' && renderExpenseModule(false)}
            {activeTab === 'email' && renderEmailModule(false)}
          </div>
        ) : (
          /* 4분할 그리드 뷰 (2x2 반응형으로 1 -> 2 -> 3 -> 4 모듈 순서 정렬) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[600px] max-h-[600px] overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                {renderScheduleModule(true)}
              </div>
            </div>
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[600px] max-h-[600px] overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                {renderTodoModule(true)}
              </div>
            </div>
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[600px] max-h-[600px] overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                {renderExpenseModule(true)}
              </div>
            </div>
            <div className="bg-white dark:bg-notion-dark-card rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm flex flex-col h-[600px] max-h-[600px] overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
                {renderEmailModule(true)}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* 일정 수정 모달 */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center space-x-2 text-slate-900 dark:text-white whitespace-nowrap">
                  <Edit2 className="w-4 h-4 text-amber-500" />
                  <span className="whitespace-nowrap">스마트 일정 수정</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    일정 제목
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="일정 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                    날짜 및 시간
                  </label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="2026-09-21"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                      분류
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="일정">일정</option>
                      <option value="할 일">할 일</option>
                      <option value="업무">업무</option>
                      <option value="건강">건강</option>
                      <option value="가족">가족</option>
                      <option value="개인">개인</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1 whitespace-nowrap">
                      상태
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="미완료">미완료</option>
                      <option value="진행 중">진행 중</option>
                      <option value="완료">완료</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !editTitle.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{isSavingEdit ? '저장 중...' : '저장 완료'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default LifePage;
