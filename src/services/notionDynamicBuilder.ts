// src/services/notionDynamicBuilder.ts
// AI 오케스트레이터 payload 및 채팅 명령어를 최상급 NotionTemplate 구조체로 동적 인스턴스화
// [Step 4]: 상용급 다중 관계형 DB 강제 팽창 엔진, 노션 에이전트 3.0 스킬팩 지능 결합 및 캔버스 인라인 편집기 지원

import type {
  NotionTemplate,
  NotionDatabase,
  NotionProperty,
  NotionBlock,
  AgentBlueprint
} from '../types/notion';

export interface DynamicBuildParams {
  topic: string;
  title: string;
  initialPrompt?: string;
  dbSchemas?: any[];
  formulas?: any[];
  valueAdd?: string[];
  complexity?: string;
}

/**
 * 0. 제목 정제기(Title Sanitizer) 엄격 가드레일
 * 사용자의 음성 말버릇, 불필요한 조사, 명령어 패턴을 정규식으로 완벽히 제거하고
 * 도메인에 걸맞은 격조 높은 공식 프로젝트 명칭을 추출합니다.
 */
export function sanitizeTemplateTitle(rawInput: string, topic?: string): string {
  const combinedRaw = `${rawInput || ''} ${topic || ''}`.trim();
  const lowerCombined = combinedRaw.toLowerCase();

  // [Hotfix 0: 주민 민원 및 입주자 지원 도메인 (민원, 누수, 소음, 세대간 분쟁 등)]
  if (
    lowerCombined.includes('민원') ||
    lowerCombined.includes('소음') ||
    (lowerCombined.includes('누수') && !lowerCombined.includes('계량기누수')) ||
    lowerCombined.includes('세대간') ||
    lowerCombined.includes('입주자') ||
    (lowerCombined.includes('주민') && (lowerCombined.includes('관리') || lowerCombined.includes('접수') || lowerCombined.includes('분쟁') || lowerCombined.includes('지원')))
  ) {
    return '🏢 [총괄 관제] 주민 민원 및 세대 하자 통합 관리 대시보드';
  }

  // [Hotfix 1: 특정 도메인 및 파일명 키워드 우선 고정 매핑 (Fail-Safe)]
  if (
    (lowerCombined.includes('검침') || lowerCombined.includes('계량기') || lowerCombined.includes('원격검침')) &&
    !lowerCombined.includes('민원') && !lowerCombined.includes('소음') && !lowerCombined.includes('주민')
  ) {
    return '[원격검침 & 시설 관제] 실시간 검침 모니터링 관리 OS';
  }
  // 첨부 파일명이 ardenhill_room_maintenance_checklist 이거나 아덴힐 관련인 경우 무조건 강제 치환
  if (
    lowerCombined.includes('ardenhill') || 
    lowerCombined.includes('아덴힐') || 
    lowerCombined.includes('room_maintenance') ||
    (lowerCombined.includes('리조트') && (lowerCombined.includes('시설') || lowerCombined.includes('객실') || lowerCombined.includes('점검') || lowerCombined.includes('체크리스트')))
  ) {
    return '[아덴힐 리조트] 객실 시설관리 및 정기 점검 OS';
  }

  // [Hotfix 2: 프롬프트 지시어 오염 감지 시 전면 폐기(Bypass)]
  const promptContaminants = [
    '지침', '사용자가', '반영하여', '반영하', '설계하십시오', '1 1로', '1:1로', 
    'properties', 'db_schema', 'attached', '첨부한', '표/문서', '반영해', '노션 db 속성',
    '샘플 행', '초기 행', '프롬프트', '지시어'
  ];
  const isContaminated = promptContaminants.some(word => lowerCombined.includes(word));

  let text = (rawInput || topic || '').trim();

  // 오염되었거나 텍스트가 30자 이상으로 길면 즉시 폐기 후 도메인 추론 fallback 가동
  if (isContaminated || text.length > 30) {
    if (lowerCombined.includes('민원') || lowerCombined.includes('소음') || lowerCombined.includes('누수') || lowerCombined.includes('주민')) {
      return '🏢 [총괄 관제] 주민 민원 및 세대 하자 통합 관리 대시보드';
    }
    if (lowerCombined.includes('검침') || lowerCombined.includes('계량기') || lowerCombined.includes('에너지')) {
      return '[원격검침 & 시설 관제] 실시간 검침 모니터링 관리 OS';
    }
    if (lowerCombined.includes('시설') || lowerCombined.includes('객실') || lowerCombined.includes('하자') || lowerCombined.includes('호텔') || lowerCombined.includes('건물')) {
      return '[시설 & 자산 관리] 객실 점검 및 하자보수 관제 OS';
    }
    if (lowerCombined.includes('프로젝트') || lowerCombined.includes('개발') || lowerCombined.includes('스프린트') || lowerCombined.includes('스타트업') || lowerCombined.includes('기획') || lowerCombined.includes('okr')) {
      return '[프로젝트 OS] 애자일 로드맵 & 스프린트 마스터 OS';
    }
    if (lowerCombined.includes('자격증') || lowerCombined.includes('수험') || lowerCombined.includes('시험') || lowerCombined.includes('공부') || lowerCombined.includes('오답') || lowerCombined.includes('합격')) {
      return '[합격 패스] 수험 로드맵 & 기출 오답노트 올인원 OS';
    }
    if (lowerCombined.includes('가계부') || lowerCombined.includes('지출') || lowerCombined.includes('소비') || lowerCombined.includes('재무') || lowerCombined.includes('돈')) {
      return '[스마트 파이낸스] 월간 소비 분석 & 고정비 가드 OS';
    }
    return '[통합 관리] 비즈니스 & 라이프 통합 관제 OS';
  }

  // 1. 첨부 블록 및 파일명 선제거
  text = text.replace(/\[ATTACHED_DOCUMENT_DATA\][\s\S]*?\[\/ATTACHED_DOCUMENT_DATA\]/gi, ' ');
  text = text.replace(/\[첨부:[^\]]*\]/gi, ' ');
  text = text.replace(/[\w\-가-힣]+\.(xlsx|xls|csv|docx|doc|pdf|txt|md|json|hwp|hwpx)/gi, ' ');

  // 2. 대괄호 태그 선제거
  text = text.replace(/^\[.*?\]\s*/g, ' ');

  // 3. 특수문자 및 기호 먼저 제거 (마침표, 쉼표, 느낌표, 괄호 등)
  text = text.replace(/[!?,.~^@#$%&*_+={}\[\]:;<>/\\|`'"()]/g, ' ');

  // 4. 서술어 및 요청어 전역 제거 (공백 유연 매칭)
  const phrasesToRemove = [
    /만들어\s*(줘(요)?|주세요|줄래|주라|봐|보자)/gi,
    /제작해\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /생성해\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /설계해\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /작성해\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /반영해\s*(주고|줘(요)?|주세요|줄래|주라|봐|서|하여)/gi,
    /추가해\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /보완해\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /짜\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /뽑아\s*(줘(요)?|주세요|줄래|주라|봐)/gi,
    /해\s*(줘(요)?|주세요|봐|보자)/gi,
    /(해주세요|해줘|해봐|부탁해요|부탁해)/gi,
    /(참고해서|참고하여|참고|기반으로|기반한|기반|첨부|파일)/gi,
    /(노션\s*템플릿|노션\s*페이지|템플릿|대시보드|워크스페이스|마스터\s*OS|통합\s*관리|올인원\s*OS|관제\s*OS|시스템)/gi,
    /^(어|음|저기|그|아|그냥|지금|이번에|요번에|혹시|저)\s+/gi
  ];

  phrasesToRemove.forEach(p => {
    text = text.replace(p, ' ');
  });

  text = text.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // 도메인별 고품격 공식 타이틀 포맷팅
  if (lower.includes('민원') || lower.includes('소음') || lower.includes('누수') || lower.includes('주민')) {
    return '🏢 [총괄 관제] 주민 민원 및 세대 하자 통합 관리 대시보드';
  }
  if (lower.includes('검침') || lower.includes('계량기') || lower.includes('에너지')) {
    return '[원격검침 & 시설 관제] 실시간 검침 모니터링 관리 OS';
  }
  if (lower.includes('아덴힐') || (lower.includes('리조트') && (lower.includes('시설') || lower.includes('객실')))) {
    return '[아덴힐 리조트] 객실 시설관리 및 정기 점검 OS';
  }
  if (lower.includes('시설') || lower.includes('객실') || lower.includes('하자') || lower.includes('리조트') || lower.includes('호텔') || lower.includes('건물')) {
    const sub = text.replace(/(시설|객실|하자|리조트|호텔|건물|관리|점검)/g, '').trim();
    return sub ? ('[시설 & 자산 관리] ' + sub + ' 시설점검 관제 OS') : '[시설 & 자산 관리] 객실 점검 및 하자보수 관제 OS';
  }
  if (lower.includes('프로젝트') || lower.includes('개발') || lower.includes('스프린트') || lower.includes('스타트업') || lower.includes('기획') || lower.includes('okr')) {
    return '[프로젝트 OS] ' + (text || '애자일 로드맵 & 스프린트 마스터') + ' OS';
  }
  if (lower.includes('합격') || lower.includes('시험') || lower.includes('자격증') || lower.includes('공부') || lower.includes('수험') || lower.includes('고시')) {
    return '[합격 패스] ' + (text || '수험 로드맵 & 기출 오답노트') + ' 올인원 OS';
  }
  if (lower.includes('결산') || lower.includes('회계') || lower.includes('가계부') || lower.includes('지출') || lower.includes('소비') || lower.includes('돈') || lower.includes('재무') || lower.includes('자산')) {
    return '[스마트 파이낸스] ' + (text || '월간 소비 분석 & 고정비 가드') + ' OS';
  }
  if (lower.includes('루틴') || lower.includes('해빗') || lower.includes('습관') || lower.includes('건강') || lower.includes('헬스') || lower.includes('피트니스')) {
    return '[라이프 & 웰니스] ' + (text || '24H 데일리 루틴 & 해빗 트래커') + ' OS';
  }
  if (lower.includes('독서') || lower.includes('책') || lower.includes('서재') || lower.includes('인용구') || lower.includes('도서')) {
    return '[지식 아카이브] ' + (text || '디지털 서재 & 독서 인사이트') + ' OS';
  }
  return text.length >= 2 ? ('[통합 관리] ' + text + ' 관제 OS') : '[통합 관리] 비즈니스 & 라이프 통합 관제 OS';
}

/**
 * 1. 도메인 맞춤형 다중 관계형 DB 생태계 강제 팽창기 (Prompt Inflation)
 * 사용자가 짧은 요청을 하더라도 단일 DB 생성을 원천 차단하고 상호 연결된 3대 마스터 DB를 조립합니다.
 */
export function getDomainEcoDatabases(domainOrTopic: string, title: string): NotionDatabase[] {
  const t = (domainOrTopic + ' ' + title).toLowerCase();

  // [0순위: 주민 민원 종합 관리 도메인 (민원접수 DB, 세대누수 점검 DB, 층간소음 중재 DB)]
  if (t.includes('민원') || t.includes('소음') || t.includes('누수') || t.includes('세대간') || t.includes('입주자') || t.includes('주민')) {
    return [
      {
        name: '📋 [DB 1] 일반 민원 접수·조치 일지',
        description: '입주민 민원 접수부터 현장 점검, 중재 및 최종 처리 결과를 원스톱으로 관리하는 마스터 DB',
        view_type: 'table',
        properties: [
          { name: '접수번호/민원명', type: 'title' },
          { name: '접수일시', type: 'date' },
          { name: '민원 유형', type: 'select', options: ['층간소음 분쟁', '세대 누수/하자', '시설/엘리베이터 보수', '주차 갈등', '공동생활 규약 위반'] },
          { name: '발생 동/호수', type: 'text' },
          { name: '처리 상태', type: 'status', options: ['접수 완료', '현장 확인 중', '중재/조치 중', '처리 완료 ✅'] },
          { name: '담당 관리자', type: 'person' },
          { name: '누수 점검 연계', type: 'relation', target: '💧 [DB 3] 세대 누수 및 하자보수 관리 DB' },
          { name: '소음 중재 연계', type: 'relation', target: '🔇 [DB 2] 세대간 층간소음 중재 관리 DB' },
          { 
            name: '조치 소요기간(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("처리 상태") == "처리 완료 ✅", "처리 완료 🎉", "진행 중 ⚠️")' 
          },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '접수번호/민원명': '[민원-2024-012] 102동 1104호 거실 천장 누수 피해 접수', '접수일시': '2026-09-23', '민원 유형': '세대 누수/하자', '발생 동/호수': '102동 1104호', '처리 상태': '현장 확인 중', '조치 소요기간(수식)': '진행 중 ⚠️', 'Quality_Status': '검수 중', 'Verified': false },
          { '접수번호/민원명': '[민원-2024-015] 105동 801호 심야 층간소음(발망치) 상담 요청', '접수일시': '2026-09-23', '민원 유형': '층간소음 분쟁', '발생 동/호수': '105동 801호', '처리 상태': '중재/조치 중', '조치 소요기간(수식)': '진행 중 ⚠️', 'Quality_Status': '승인', 'Verified': true },
          { '접수번호/민원명': '[민원-2024-008] 지하 1층 주차장 진입로 조명 점멸 수리', '접수일시': '2026-09-22', '민원 유형': '시설/엘리베이터 보수', '발생 동/호수': '관리동 공용부', '처리 상태': '처리 완료 ✅', '조치 소요기간(수식)': '처리 완료 🎉', 'Quality_Status': '승인', 'Verified': true }
        ]
      },
      {
        name: '💧 [DB 3] 세대 누수 및 하자보수 관리 DB',
        description: '세대 내 배관 파손, 방수층 균열 등 누수 피해 원인 규명 및 하자보수 합의 이력을 추적하는 정밀 점검 DB',
        view_type: 'table',
        properties: [
          { name: '점검 건명', type: 'title' },
          { name: '피해 세대', type: 'text' },
          { name: '원인 추정 세대', type: 'text' },
          { name: '점검 일시', type: 'date' },
          { name: '누수 원인', type: 'select', options: ['배관 부식/파손', '방수층 균열', '욕실 배수 트랩 이탈', '외벽 크랙/우천 누수', '윗세대 온수배관 결함'] },
          { name: '보수 상태', type: 'status', options: ['원인 조사 중', '견적/합의 중', '보수 공사 중', '하자보수 완료 ✅'] },
          { name: '예상/발생 비용(원)', type: 'number' },
          { name: '점검 책임자', type: 'person' },
          { name: '연관 민원 기록', type: 'relation', target: '📋 [DB 1] 일반 민원 접수·조치 일지' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '점검 건명': '102동 1104호 거실 천장 열화상 누수 탐지', '피해 세대': '102동 1104호', '원인 추정 세대': '102동 1204호', '점검 일시': '2026-09-23', '누수 원인': '욕실 배수 트랩 이탈', '보수 상태': '견적/합의 중', '예상/발생 비용(원)': 450000, 'Quality_Status': '검수 중', 'Verified': false },
          { '점검 건명': '201동 302호 베란다 우수관 주변 누수 보수', '피해 세대': '201동 302호', '원인 추정 세대': '공용 우수배관', '점검 일시': '2026-09-20', '누수 원인': '방수층 균열', '보수 상태': '하자보수 완료 ✅', '예상/발생 비용(원)': 180000, 'Quality_Status': '승인', 'Verified': true }
        ]
      },
      {
        name: '🔇 [DB 2] 세대간 층간소음 중재 관리 DB',
        description: '세대 간 소음 갈등 완화를 위한 차수별 방문 상담, 소음방지매트 지원 및 중재 합의를 관리하는 분쟁 케어 DB',
        view_type: 'table',
        properties: [
          { name: '분쟁 관리번호', type: 'title' },
          { name: '피해 접수 세대', type: 'text' },
          { name: '소음 유발 세대', type: 'text' },
          { name: '소음 유형', type: 'select', options: ['발걸음/아이 뜀', '가전제품/세탁기 야간가동', '가구 끄는 소리', '반려동물 짖음', '늦은 시간 악기/TV'] },
          { name: '발생 시간대', type: 'select', options: ['주간 (09-18시)', '야간 (18-22시)', '심야 (22-07시)'] },
          { name: '중재 진행 차수', type: 'select', options: ['1차 유선 안내/주의 권고', '2차 방문 면담/완충재 지원', '3차 층간소음위원회 중재', '분쟁조정위원회 이첩'] },
          { name: '중재 상태', type: 'status', options: ['접수/상담 중', '양측 면담 완료', '소음방지매트 설치합의', '중재 합의 완료 ✅'] },
          { name: '중재 담당자', type: 'person' },
          { name: '연관 민원 기록', type: 'relation', target: '📋 [DB 1] 일반 민원 접수·조치 일지' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '분쟁 관리번호': '[소음-105-01] 105동 801호 ↔ 901호 아이 뜀박질 소음 중재', '피해 접수 세대': '105동 801호', '소음 유발 세대': '105동 901호', '소음 유형': '발걸음/아이 뜀', '발생 시간대': '야간 (18-22시)', '중재 진행 차수': '2차 방문 면담/완충재 지원', '중재 상태': '소음방지매트 설치합의', 'Quality_Status': '승인', 'Verified': true },
          { '분쟁 관리번호': '[소음-203-04] 203동 402호 심야 세탁기 진동 소음 안내', '피해 접수 세대': '203동 302호', '소음 유발 세대': '203동 402호', '소음 유형': '가전제품/세탁기 야간가동', '발생 시간대': '심야 (22-07시)', '중재 진행 차수': '1차 유선 안내/주의 권고', '중재 상태': '중재 합의 완료 ✅', 'Quality_Status': '승인', 'Verified': true }
        ]
      }
    ];
  }

  // A-0. 실시간 검침/계량기/에너지 및 시설 관리 도메인
  if (t.includes('검침') || t.includes('계량기') || t.includes('에너지') || (t.includes('시설') && (t.includes('수도') || t.includes('전기') || t.includes('가스')))) {
    return [
      {
        name: '⚡ 원격검침 실시간 모니터링 관리 DB',
        description: '동/호수별 검침시간, 전기, 수도, 가스, 온수 사용량 및 통신상태와 이상 경보를 실시간 관제하는 마스터 DB',
        view_type: 'table',
        properties: [
          { name: '호수/위치', type: 'title' },
          { name: '동', type: 'select', options: ['101동', '102동', '103동', '관리동/공용부'] },
          { name: '호', type: 'text' },
          { name: '검침시간', type: 'date' },
          { name: '전기(kWh)', type: 'number' },
          { name: '수도(m³)', type: 'number' },
          { name: '가스(m³)', type: 'number' },
          { name: '통신상태', type: 'status', options: ['정상 수신 🟢', '수신 지연 🟡', '통신 장애 🔴'] },
          { 
            name: '이상 경보(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("통신상태") == "통신 장애 🔴", "🚨 통신 단절 경보", prop("전기(kWh)") > 450, "⚠️ 전기 과다 사용", prop("수도(m³)") > 80, "💧 누수 의심", "🟢 정상")' 
          },
          { name: '계량기 점검 연계', type: 'relation', target: '🛠️ 계량기 및 시설 설비 점검 DB' },
          { name: '이상 조치 티켓', type: 'relation', target: '🚨 이상 징후 및 긴급 보수 티켓 DB' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '호수/계량기 위치': '101동 302호', '에너지 구분': '⚡ 전기', '계량기 번호': 'EM-2024-0012', '전월 지침': 1420, '당월 지침': 1680, '당월 사용량(수식)': 260, '사용량 이상 경보(수식)': '🟢 정상 사용', 'Quality_Status': '승인', 'Verified': true },
          { '호수/계량기 위치': '102동 1104호', '에너지 구분': '🚰 상수도', '계량기 번호': 'WM-2024-0541', '전월 지침': 340, '당월 지침': 890, '당월 사용량(수식)': 550, '사용량 이상 경보(수식)': '🚨 누수/과부하 의심', 'Quality_Status': '검수 중', 'Verified': false },
          { '호수/계량기 위치': '지하 1층 기계실', '에너지 구분': '♨️ 온수/난방', '계량기 번호': 'HM-2024-0003', '전월 지침': 5800, '당월 지침': 6120, '당월 사용량(수식)': 320, '사용량 이상 경보(수식)': '🟢 정상 사용', 'Quality_Status': '승인', 'Verified': true }
        ]
      },
      {
        name: '🛠️ 계량기 및 시설 설비 점검 DB',
        description: '각 동 EPS/TPS실, 기계실 계량기 기물 상태 및 정기 교체 주기를 점검하는 서브 DB',
        view_type: 'table',
        properties: [
          { name: '설비/계량기명', type: 'title' },
          { name: '설치 구역', type: 'select', options: ['1동 EPS실', '2동 EPS실', '지하 기계실', '옥상 물탱크실', '중앙 관제실'] },
          { name: '계량기 종류', type: 'select', options: ['원격 디지털 계량기', '기계식 유량계', '전자식 전력량계', '가스 누출 감지기'] },
          { name: '정기 점검일', type: 'date' },
          { name: '설비 상태', type: 'status', options: ['정상 작동', '오차 보정 필요', '단선/통신 장애 ⚠️', '교체 예정'] },
          { 
            name: '점검 판정(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("설비 상태") == "정상 작동", "적격 🟢", prop("설비 상태") == "오차 보정 필요", "조정 🟡", "부적격 🔴")' 
          },
          { name: '마스터 검침 연계', type: 'relation', target: '⚡ 실시간 에너지 & 검침 관리 마스터 DB' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '설비/계량기명': '1동 3층 원격 검침 중계기', '설치 구역': '1동 EPS실', '계량기 종류': '원격 디지털 계량기', '설비 상태': '정상 작동', '점검 판정(수식)': '적격 🟢', 'Quality_Status': '승인', 'Verified': true },
          { '설비/계량기명': '102동 급수 감압 밸브 및 유량계', '설치 구역': '지하 기계실', '계량기 종류': '기계식 유량계', '설비 상태': '오차 보정 필요', '점검 판정(수식)': '조정 🟡', 'Quality_Status': '검수 중', 'Verified': false }
        ]
      },
      {
        name: '🚨 이상 징후 및 긴급 보수 티켓 DB',
        description: '급격한 수치 급증(누수/누전), 원격 단절 등 검침 이상 징후 발생 시 현장 출동 및 조치 이력을 추적하는 티켓 DB',
        view_type: 'table',
        properties: [
          { name: '이상 조치 티켓명', type: 'title' },
          { name: '이상 유형', type: 'select', options: ['💧 누수 의심 (사용량 급증)', '⚡ 누전/과전력 위험', '📡 검침 데이터 미수신', '🔧 계량기 파손/동파'] },
          { name: '긴급도', type: 'select', options: ['🔥 당일 긴급 출동', '⚡ 24시간 내 점검', '🌱 정기 교체/보수'] },
          { name: '조치 상태', type: 'status', options: ['이상 감지', '현장 확인 중', '부품 교체/수리', '조치 완료 ✅'] },
          { name: '접수 일시', type: 'date' },
          { 
            name: '조치 기한 D-Day(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("조치 상태") == "조치 완료 ✅", "완료 완료 🎉", "조치 대기 중 ⚠️")' 
          },
          { name: '현장 조치 담당자', type: 'person' },
          { name: '연관 검침 기록', type: 'relation', target: '⚡ 실시간 에너지 & 검침 관리 마스터 DB' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '이상 조치 티켓명': '102동 1104호 야간 급수량 비정상 급증(누수 조사)', '이상 유형': '💧 누수 의심 (사용량 급증)', '긴급도': '🔥 당일 긴급 출동', '조치 상태': '현장 확인 중', '조치 기한 D-Day(수식)': '조치 대기 중 ⚠️', 'Quality_Status': '검수 중', 'Verified': false },
          { '이상 조치 티켓명': '지하 기계실 온수 메인 계량기 통신 모듈 리셋', '이상 유형': '📡 검침 데이터 미수신', '긴급도': '⚡ 24시간 내 점검', '조치 상태': '조치 완료 ✅', '조치 기한 D-Day(수식)': '완료 완료 🎉', 'Quality_Status': '승인', 'Verified': true }
        ]
      }
    ];
  }

  // A. 시설/호텔/리조트/공간/인테리어 관리 도메인
  if (t.includes('시설') || t.includes('객실') || t.includes('하자') || t.includes('리조트') || t.includes('호텔') || t.includes('건물')) {
    return [
      {
        name: '🏢 객실/시설 자산 마스터 DB',
        description: '호텔/리조트 전체 객실 및 부대시설 자산 현황과 점검 통과율을 실시간 관리하는 마스터 DB',
        view_type: 'table',
        properties: [
          { name: '호실/자산명', type: 'title' },
          { name: '구역/타입', type: 'select', options: ['스위트룸', '디럭스룸', '로비/공용부', '부대시설', '기계/전기실'] },
          { name: '운영 상태', type: 'status', options: ['정상 운영', '점검 중', '보수 필요 ⚠️', '운영 중단'] },
          { name: '책임 점검자', type: 'person' },
          { 
            name: '점검 통과율(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("운영 상태") == "정상 운영", "■■■■■ 100% 🟢", prop("운영 상태") == "점검 중", "■■■□□ 60% 🟡", "□□□□□ 0% 🔴")' 
          },
          { name: '관련 점검 체크리스트', type: 'relation', target: '📋 구역별 정기 점검 체크리스트 DB' },
          { name: '하자보수 티켓 이력', type: 'relation', target: '🛠️ 하자보수 & 조치 티켓 DB' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '호실/자산명': '101호 로얄 스위트', '구역/타입': '스위트룸', '운영 상태': '정상 운영', '점검 통과율(수식)': '■■■■■ 100% 🟢', 'Quality_Status': '승인', 'Verified': true },
          { '호실/자산명': '205호 오션 디럭스', '구역/타입': '디럭스룸', '운영 상태': '보수 필요 ⚠️', '점검 통과율(수식)': '■■■□□ 60% 🟡', 'Quality_Status': '검수 중', 'Verified': false },
          { '호실/자산명': 'B1F 실내 수영장', '구역/타입': '부대시설', '운영 상태': '정상 운영', '점검 통과율(수식)': '■■■■■ 100% 🟢', 'Quality_Status': '승인', 'Verified': true }
        ]
      },
      {
        name: '📋 구역별 정기 점검 체크리스트 DB',
        description: '공조, 배관, 가구, 조명, 위생 등 일일/정기 점검 항목을 정량 체크하는 서브 DB',
        view_type: 'table',
        properties: [
          { name: '점검 항목명', type: 'title' },
          { name: '점검 구역/자산', type: 'relation', target: '🏢 객실/시설 자산 마스터 DB' },
          { name: '점검 일시', type: 'date' },
          { name: '점검 분류', type: 'select', options: ['🚰 위생/욕실', '💡 조명/전기', '❄️ 에어컨/공조', '🛏️ 가구/린넨'] },
          { name: '점검 결과', type: 'status', options: ['양호', '조치 필요', '보수 접수 완료'] },
          { 
            name: '통과 상태(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("점검 결과") == "양호", "통과 ✅", prop("점검 결과") == "조치 필요", "이상 감지 ⚠️", "접수 완료 🔧")' 
          },
          { name: '하자보수 연계', type: 'relation', target: '🛠️ 하자보수 & 조치 티켓 DB' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '점검 항목명': '101호 욕실 수압 및 배수 점검', '점검 분류': '🚰 위생/욕실', '점검 결과': '양호', '통과 상태(수식)': '통과 ✅', 'Quality_Status': '승인', 'Verified': true },
          { '점검 항목명': '205호 시스템 에어컨 냉매 누출 의심', '점검 분류': '❄️ 에어컨/공조', '점검 결과': '조치 필요', '통과 상태(수식)': '이상 감지 ⚠️', 'Quality_Status': '검수 중', 'Verified': false }
        ]
      },
      {
        name: '🛠️ 하자보수 & 조치 티켓 DB',
        description: '접수된 하자 및 보수 요청의 D-Day 기한과 완료 상태를 추적하는 티켓팅 DB',
        view_type: 'table',
        properties: [
          { name: '하자 티켓명', type: 'title' },
          { name: '대상 자산/객실', type: 'relation', target: '🏢 객실/시설 자산 마스터 DB' },
          { name: '접수일자', type: 'date' },
          { name: '조치 기한(마감)', type: 'date' },
          { name: '긴급도', type: 'select', options: ['🔥 긴급(당일)', '⚡ 보통(3일내)', '🌱 정기보수'] },
          { name: '조치 상태', type: 'status', options: ['접수', '수리 중', '조치 완료', '검수 합격'] },
          { 
            name: '조치 D-Day(수식)', 
            type: 'formula', 
            expression: 'ifs(empty(prop("조치 기한(마감)")), "일정 미정", dateBetween(dateStart(prop("조치 기한(마감)")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("조치 기한(마감)")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("조치 기한(마감)")), now(), "days") + "일")' 
          },
          { name: '소요 비용(원)', type: 'number' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '하자 티켓명': '205호 에어컨 필터 교체 및 냉매 충전', '긴급도': '🔥 긴급(당일)', '조치 상태': '수리 중', '조치 D-Day(수식)': 'D-1일', '소요 비용(원)': 120000, 'Quality_Status': '검수 중', 'Verified': false },
          { '하자 티켓명': '로비 센서등 감도 조절', '긴급도': '🌱 정기보수', '조치 상태': '조치 완료', '조치 D-Day(수식)': 'D-Day 🔥', '소요 비용(원)': 0, 'Quality_Status': '승인', 'Verified': true }
        ]
      }
    ];
  }

  // B. 프로젝트/개발/IT/스타트업/기획 도메인
  if (t.includes('프로젝트') || t.includes('개발') || t.includes('스타트업') || t.includes('스프린트') || t.includes('기획')) {
    return [
      {
        name: '🎯 프로젝트 & OKR 마스터 로드맵',
        description: '핵심 목표, 분기별 마일스톤 및 종합 달성률을 조망하는 프로젝트 총괄 DB',
        view_type: 'table',
        properties: [
          { name: '프로젝트명', type: 'title' },
          { name: '목표 기간', type: 'date' },
          { name: '진행 상태', type: 'status', options: ['기획 단계', '개발 진행 중', 'QA/검수', '출시 완료'] },
          { 
            name: '종합 달성률(수식)', 
            type: 'formula', 
            expression: 'ifs(prop("진행 상태") == "출시 완료", "■■■■■ 100% 🟢", prop("진행 상태") == "개발 진행 중", "■■■□□ 60% 🟡", "■□□□□ 20% ⚪")' 
          },
          { name: '담당 PM', type: 'person' },
          { name: '세부 스프린트 태스크', type: 'relation', target: '⚡ 태스크 & 스프린트 마일스톤 DB' },
          { name: '자원 및 레퍼런스', type: 'relation', target: '📚 자원 & 기술 참고문서 아카이브' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '프로젝트명': '모바일 앱 2.0 고도화 리뉴얼', '진행 상태': '개발 진행 중', '종합 달성률(수식)': '■■■□□ 60% 🟡', 'Quality_Status': '검수 중', 'Verified': false },
          { '프로젝트명': '노션 커스텀 에이전트 3.0 연동 모듈', '진행 상태': '출시 완료', '종합 달성률(수식)': '■■■■■ 100% 🟢', 'Quality_Status': '승인', 'Verified': true }
        ]
      },
      {
        name: '⚡ 태스크 & 스프린트 마일스톤 DB',
        description: '각 프로젝트 하위 태스크의 담당자, 마감일 및 D-Day 수식을 추적하는 실무 DB',
        view_type: 'table',
        properties: [
          { name: '태스크명', type: 'title' },
          { name: '상위 프로젝트', type: 'relation', target: '🎯 프로젝트 & OKR 마스터 로드맵' },
          { name: '마감일', type: 'date' },
          { name: '우선순위', type: 'select', options: ['🔥 P1 (긴급)', '⚡ P2 (중요)', '🌱 P3 (일반)'] },
          { name: '진행 상태', type: 'status', options: ['대기 중', '진행 중', '코드 리뷰', '완료'] },
          { 
            name: '남은 일수(D-Day)', 
            type: 'formula', 
            expression: 'ifs(empty(prop("마감일")), "일정 미정", dateBetween(dateStart(prop("마감일")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("마감일")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("마감일")), now(), "days") + "일")' 
          },
          { name: '담당 엔지니어', type: 'person' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '태스크명': 'Formulas 2.0 시각화 수식 파서 검증', '우선순위': '🔥 P1 (긴급)', '진행 상태': '진행 중', '남은 일수(D-Day)': 'D-2일', 'Quality_Status': '검수 중', 'Verified': false },
          { '태스크명': '인라인 편집기 로컬스토리지 동기화 구현', '우선순위': '⚡ P2 (중요)', '진행 상태': '완료', '남은 일수(D-Day)': 'D-Day 🔥', 'Quality_Status': '승인', 'Verified': true }
        ]
      },
      {
        name: '📚 자원 & 기술 참고문서 아카이브',
        description: '프로젝트에 필요한 API 규격, 기술 사양서 및 리스크 노트를 보관하는 지식 DB',
        view_type: 'table',
        properties: [
          { name: '자료/문서명', type: 'title' },
          { name: '연관 프로젝트', type: 'relation', target: '🎯 프로젝트 & OKR 마스터 로드맵' },
          { name: '문서 분류', type: 'select', options: ['📐 아키텍처/기획', '🔌 API 스펙', '🎨 디자인 가이드', '🐛 트러블슈팅'] },
          { name: '문서 URL', type: 'url' },
          { name: '핵심 요약 메모', type: 'text' },
          { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
          { name: 'Verified', type: 'checkbox' }
        ],
        sample_rows: [
          { '자료/문서명': 'Notion API 공식 데이터베이스 속성 레퍼런스', '문서 분류': '🔌 API 스펙', '문서 URL': 'https://developers.notion.com', 'Quality_Status': '승인', 'Verified': true },
          { '자료/문서명': '커스텀 에이전트 3.0 프롬프트 아키텍처 규격집', '문서 분류': '📐 아키텍처/기획', 'Quality_Status': '승인', 'Verified': true }
        ]
      }
    ];
  }

  // C. 일반/기타 업무 마스터 도메인 (기본 3대 DB 팽창)
  return [
    {
      name: `🎯 ${title} 핵심 마스터 트래커`,
      description: `AI가 설계한 ${title}의 총괄 목표 및 주요 지표 트래킹 마스터 데이터베이스`,
      view_type: 'table',
      properties: [
        { name: '핵심 과제/목표명', type: 'title' },
        { name: '목표 일정', type: 'date' },
        { name: '진행 상태', type: 'status', options: ['대기 중', '진행 중', '검수 중', '완료'] },
        { name: '카테고리', type: 'select', options: ['핵심 로드맵', '운영 과제', '지표 개선'] },
        { 
          name: '진행률(수식)', 
          type: 'formula', 
          expression: 'ifs(prop("진행 상태") == "완료", "■■■■■ 100% 🟢", prop("진행 상태") == "진행 중", "■■■□□ 60% 🟡", "□□□□□ 0% ⚪")' 
        },
        { name: '하위 실행 과제', type: 'relation', target: `⚡ ${title} 세부 실행 체크리스트` },
        { name: '관련 리스크/이슈', type: 'relation', target: `🚨 ${title} 이슈 & 리스크 레지스터` },
        { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '핵심 과제/목표명': `${title} 1단계 마스터 플랜 수립`, '진행 상태': '완료', '진행률(수식)': '■■■■■ 100% 🟢', 'Quality_Status': '승인', 'Verified': true },
        { '핵심 과제/목표명': `${title} 2단계 시스템 정밀 실행`, '진행 상태': '진행 중', '진행률(수식)': '■■■□□ 60% 🟡', 'Quality_Status': '검수 중', 'Verified': false }
      ]
    },
    {
      name: `⚡ ${title} 세부 실행 체크리스트`,
      description: '마스터 과제를 구체화한 일일 액션 아이템 및 D-Day 카운터 관리 DB',
      view_type: 'table',
      properties: [
        { name: '세부 과제명', type: 'title' },
        { name: '상위 마스터 과제', type: 'relation', target: `🎯 ${title} 핵심 마스터 트래커` },
        { name: '마감 기한', type: 'date' },
        { name: '중요도', type: 'select', options: ['🔥 긴급 (P1)', '⚡ 중요 (P2)', '🌱 일반 (P3)'] },
        { name: '완료 상태', type: 'status', options: ['시작 전', '진행 중', '제출/완료'] },
        { 
          name: '남은 일수(D-Day)', 
          type: 'formula', 
          expression: 'ifs(empty(prop("마감 기한")), "일정 미정", dateBetween(dateStart(prop("마감 기한")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("마감 기한")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("마감 기한")), now(), "days") + "일")' 
        },
        { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '세부 과제명': '품질 기준 점검표 작성 및 사전 승인', '중요도': '🔥 긴급 (P1)', '완료 상태': '진행 중', '남은 일수(D-Day)': 'D-1일', 'Quality_Status': '검수 중', 'Verified': false },
        { '세부 과제명': '초기 데이터베이스 릴레이션 연결 검수', '중요도': '⚡ 중요 (P2)', '완료 상태': '제출/완료', '남은 일수(D-Day)': 'D-Day 🔥', 'Quality_Status': '승인', 'Verified': true }
      ]
    },
    {
      name: `🚨 ${title} 이슈 & 리스크 레지스터`,
      description: '업무 지연, 품질 결함, 긴급 이슈의 조치 상태와 비용을 추적하는 리스크 DB',
      view_type: 'table',
      properties: [
        { name: '이슈/리스크 항목', type: 'title' },
        { name: '관련 과제', type: 'relation', target: `🎯 ${title} 핵심 마스터 트래커` },
        { name: '발생 일자', type: 'date' },
        { name: '심각도', type: 'select', options: ['🔴 심각 (Blocker)', '🟡 주의 (Warning)', '🟢 경미 (Minor)'] },
        { name: '조치 상태', type: 'status', options: ['발생/접수', '조치 중', '해결 완료'] },
        { name: '조치 계획 및 메모', type: 'text' },
        { name: 'Quality_Status', type: 'select', options: ['초안', '검수 중', '승인', '반려'] },
        { name: 'Verified', type: 'checkbox' }
      ],
      sample_rows: [
        { '이슈/리스크 항목': '외부 연동 스케줄러 지연 감지', '심각도': '🟡 주의 (Warning)', '조치 상태': '조치 중', '조치 계획 및 메모': 'Heartbeat 감사 로그 확인 후 재시도 트리거 발동', 'Quality_Status': '검수 중', 'Verified': false },
        { '이슈/리스크 항목': '속성명 중복 충돌 방지 패치', '심각도': '🟢 경미 (Minor)', '조치 상태': '해결 완료', '조치 계획 및 메모': '차분 빌더 검증 완료', 'Quality_Status': '승인', 'Verified': true }
      ]
    }
  ];
}

/**
 * 2. 커스텀 에이전트 3.0 5대 벤치마크 규격을 준수하는 정형화된 agentBlueprint 생성기
 */
export function generateAgentBlueprint(
  topic: string,
  title: string,
  dbNames: string[]
): AgentBlueprint {
  const mainDb = dbNames[0] || `${title} 마스터 트래커`;
  const allDbsStr = dbNames.length > 0 ? dbNames.join(', ') : mainDb;
  const contextTopic = topic ? `[${topic}] ` : '';

  const setupPromptMarkdown = [
    `# [🤖 노션 커스텀 에이전트 3.0 공식 셋업 프롬프트]`,
    `> 이 텍스트는 노션 공식 워크스페이스의 [커스텀 에이전트 생성/설정창]에 1-클릭으로 바로 복사-붙여넣기하여 사용하는 정밀 지능 명세서입니다.`,
    ``,
    `## 1. 에이전트 역할 및 페르소나 (Role & Persona)`,
    `- 에이전트 명칭: ${title} 상주 총괄 오케스트레이터 (Custom Agent 3.0)`,
    `- 업무 목표: "${title}" ${contextTopic}워크스페이스의 데이터 자율 동기화, Formulas 2.0 수식 연산 감시, 품질 게이트 자동 검수 및 데일리/주간 브리핑 수행`,
    `- 책임 범위: [${allDbsStr}] 마스터 DB군 및 [🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)]`,
    ``,
    `## 2. 다중 복합 트리거 (Multi-Triggers & Event Chaining)`,
    `1) [스케줄 트리거]:`,
    `   - 매일 아침 09:00: 당일 마감 임박 과제 추출 및 긴급도(P1/P2/P3) 기반 데일리 브리핑`,
    `   - 매일 자정 00:01: Formulas 2.0 D-Day 카운터(dateBetween) 자율 갱신 및 지연 태스크 태깅`,
    `   - 매주 월요일 08:30: 전주 목표 달성률 집계 및 금주 집중 과제 TOP 3 주간 결산 브리핑`,
    `2) [노션 내부 이벤트 트리거]:`,
    `   - 새 페이지 생성 시: 'Quality_Status'를 '초안'으로 기본 설정하고 필수 컬럼(제목, 마감일) 유효성 검수`,
    `   - 'Quality_Status'가 '검수 중'으로 변경 시: QA 게이트키퍼가 검증 수행 후 '승인' 또는 '반려' 처리`,
    `   - 상태값이 '불량/지연/보수 필요'로 변경 시: 긴급 알림 큐 자동 적재 및 Heartbeat 경고 기록`,
    `3) [외부 이벤트 트리거]:`,
    `   - Notion Mail / 수퍼휴먼 수신 이메일에서 [긴급/일정] 키워드 감지 시 즉각 할일 생성`,
    `   - Slack 멘션 발생 시 노션 회의록 및 요약 데이터 자동 첨부 연동`,
    ``,
    `## 3. 모듈형 스킬팩 (Agent Skills Architecture)`,
    `- [스킬 1: 마감 임박 알림 (imminent_deadline_notifier)]`,
    `  * 조건: dateBetween(prop("마감일"), now(), "days") <= 1 AND prop("상태") != "완료"`,
    `  * 액션: 상단 에이전트 콜아웃에 🚨 긴급 마감 임박 항목 브리핑 및 실시간 노티 발송`,
    `- [스킬 2: D-Day 자동 갱신 (dday_auto_refresher)]`,
    `  * 조건: 자정 00:01 스케줄 트리거 또는 페이지 로드`,
    `  * 액션: now() 기준 dateBetween 재연산 및 양수(D-N), 음수(D+N 지연) 상태 갱신`,
    `- [스킬 3: 주간 결산 브리핑 (weekly_summary_briefer)]`,
    `  * 조건: 매주 월요일 08:30 스케줄 트리거`,
    `  * 액션: 완료 태스크 통계 집계, 달성률 롤업 게이지 산출, 금주 집중 과제 TOP 3 자동 추천`,
    `- [스킬 4: 품질 게이트 검수 (quality_gate_auditor)]`,
    `  * 조건: 'Quality_Status' 속성 변경 감지`,
    `  * 액션: Verified 공식 문서 대조 및 필수 속성 검수 후 Heartbeat 로그에 ✅ 정상 기록`,
    ``,
    `## 4. 서브 에이전트 분업 지침 (Master PM & Sub-Agent Squad)`,
    `- [총괄 PM 에이전트]: 전체 로드맵 지휘, 통합 진척도 상시 감독, 일일 브리핑 작성 및 서브 에이전트 업무 조율`,
    `- [실무 태스크 에이전트]: 일일 할일 자동 배분, D-Day 카운터 모니터링, 병목 태스크 담당자 넛지 알림`,
    `- [QA 게이트키퍼]: 산출물 체크리스트 100% 충족 여부 검증, Verified 마크 확인, AI 워크슬롭 차단`,
    ``,
    `## 5. AI 워크슬롭(Work-slop) 차단 3대 불문율 (Anti-Workslop Guardrails)`,
    `1. [목적 잠그기 (Lock Purpose)]: 완료 조건(Done Definition)이 사전에 정의되지 않은 모호한 텍스트 생성 일체 금지.`,
    `2. [출처 강제 (Strict Source Grounding)]: 워크스페이스 내 'Verified = true' 속성을 가진 공식 문서와 실제 연동된 DB 행만 인용.`,
    `3. [자체 검수 표(Verification Table) 출력 강제]: 모든 자율 생성/응답 결과물 끝에 아래 자체 검수 표를 의무적으로 출력할 것:`,
    ``,
    `| 검수 항목 | 통과 기준 | 검수 결과 | 상태 |`,
    `| :--- | :--- | :--- | :---: |`,
    `| Formulas 2.0 문법 | 오류 없는 정규 Notion 수식 | progress(), dateBetween() 유효 | ✅ PASS |`,
    `| 관계형 스키마 무결성 | 최소 2개 이상 DB 상호 Relation 연결 | 마스터 DB ↔ Heartbeat 로그 양방향 연결 완료 | ✅ PASS |`,
    `| 데이터 무손실(Zero Loss) | 기존 행 및 고유 ID 100% 보존 | 변경 0건 / 신규 품질속성 100% 안전 추가 | ✅ PASS |`,
    `| Work-slop 차단율 | 미사여구 배제 및 실행 액션 비율 | 실행 가능 항목 100% | ✅ PASS |`
  ].join('\n');

  return {
    version: '3.0.0',
    persona: {
      role: `${title} 상주 총괄 오케스트레이터 (Custom Agent 3.0)`,
      objective: `"${title}" ${contextTopic}워크스페이스의 데이터 자율 동기화, Formulas 2.0 수식 연산 감시, 품질 게이트 자동 검수 및 데일리/주간 브리핑 수행`,
      scope: `[${allDbsStr}] 마스터 DB군 및 [🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)]`
    },
    multiTriggers: {
      schedule: '매일 아침 09:00 데일리 브리핑 / 자정 00:01 D-Day 갱신 / 매주 월요일 08:30 주간 결산',
      notionEvents: [
        `'Quality_Status'가 '검수 중'으로 변경 시 QA 게이트키퍼 자동 호출`,
        `신규 레코드 등록 시 'Quality_Status' 기본값 '초안' 부여 및 필수 속성 유효성 체크`,
        `상태값이 '보수 필요/지연'으로 변경 시 긴급 알림 큐 적재 및 감사 로그 경고 기록`
      ],
      externalEvents: [
        `Notion Mail / 수퍼휴먼 수신 이메일에서 [긴급/일정] 키워드 감지 시 자동 태스크 생성`,
        `Slack 채널 멘션 시 노션 회의록 및 요약 데이터 자동 첨부 연동`
      ]
    },
    skills: [
      {
        id: 'imminent_deadline_notifier',
        name: '마감 임박 긴급 알림 (Imminent Deadline Notifier)',
        trigger: 'Schedule (매일 09:00, 18:00) / 사용자 요청',
        targetDb: mainDb,
        logic: 'dateBetween(prop("마감일"), now(), "days") <= 1 AND prop("상태") != "완료"',
        action: '상단 에이전트 콜아웃에 🚨 긴급 마감 임박 항목 브리핑 및 실시간 노티 발송'
      },
      {
        id: 'dday_auto_refresher',
        name: 'D-Day 자정 자동 갱신 (D-Day Auto Refresher)',
        trigger: 'Schedule (매일 00:01 자정) / 페이지 로드',
        targetDb: '날짜 및 수식 보유 DB 전체',
        logic: 'now() 기준 dateBetween 재연산 및 양수(D-N), 음수(D+N 지연) 상태 갱신',
        action: '지연된 항목에 "🚨 지연" 태그 갱신 및 PM 알림 큐 적재'
      },
      {
        id: 'weekly_summary_briefer',
        name: '주간 결산 성과 브리핑 (Weekly Summary Briefer)',
        trigger: 'Schedule (매주 월요일 08:30)',
        targetDb: allDbsStr,
        logic: '지난 7일간 완료된 태스크 수, 목표 달성률 롤업 게이지, 미완료 병목 추출',
        action: '대시보드 상단에 3줄 하이라이트 요약 렌더링 및 금주 집중 과제 TOP 3 자동 추천'
      },
      {
        id: 'quality_gate_auditor',
        name: '품질 게이트 무결성 검수 (Quality Gatekeeper)',
        trigger: 'Notion-Event (Quality_Status 변경 시)',
        targetDb: '전체 마스터 DB',
        logic: 'Quality_Status == "승인" 처리 전 Verified=true 공식 출처 여부 및 필수 속성(제목, 마감일) 기입 검증',
        action: '조건 미달 시 "반려" 및 사유 메모 기록, 통과 시 Heartbeat 로그에 ✅ 정상 기록'
      }
    ],
    subAgents: [
      {
        name: '총괄 PM 에이전트 (Master PM)',
        role: '전체 로드맵 지휘 & 우선순위 조율',
        responsibility: '통합 진척도 상시 감독, 일일 브리핑 작성 및 서브 에이전트 간 업무 배분'
      },
      {
        name: '실무 태스크 에이전트 (Task Orchestrator)',
        role: '일일 할일 배분 & D-Day 모니터링',
        responsibility: '개별 태스크 진행 상황 감시, 마감 임박 항목 자동 넛지 및 담당자 연결'
      },
      {
        name: '품질 게이트키퍼 (QA Gatekeeper)',
        role: '품질 검수 & AI 워크슬롭 원천 차단',
        responsibility: '산출물 체크리스트 100% 충족 여부 검증, Verified 마크 확인, 자체 검수표 출력'
      }
    ],
    workslopGuardrails: {
      doneDefinition: [
        '1. 데이터베이스 간 관계형(Relation) 상호 연결 100% 검증',
        '2. Formulas 2.0 게이지 바 및 D-Day 수식 무결성 정상 작동',
        '3. 기존 데이터 무손실(Zero Data Loss) 보존 및 신규 속성만 안전 추가(Append-Only)',
        '4. 영혼 없는 미사여구 배제 및 즉시 실행 가능한 정량 데이터만 출력'
      ],
      verifiedSourcesOnly: true,
      verificationMetrics: [
        'Formulas 2.0 문법 오류 0건 (Syntax PASS)',
        '관계형 스키마 상호 링크 (Relation PASS)',
        '기존 데이터 무손실율 100% (Zero-Loss PASS)',
        '워크슬롭 차단율 100% (Anti-Slop PASS)'
      ],
      verificationTableMarkdown: [
        '| 검수 항목 | 통과 기준 | 검수 결과 | 상태 |',
        '| :--- | :--- | :--- | :---: |',
        '| Formulas 2.0 문법 | 오류 없는 정규 Notion 수식 | progress(), dateBetween() 유효 | ✅ PASS |',
        '| 관계형 스키마 무결성 | 최소 2개 이상 DB 상호 Relation 연결 | 마스터 DB ↔ Heartbeat 로그 양방향 연결 완료 | ✅ PASS |',
        '| 데이터 무손실(Zero Loss) | 기존 행 및 고유 ID 100% 보존 | 변경 0건 / 신규 품질속성 100% 안전 추가 | ✅ PASS |',
        '| Work-slop 차단율 | 미사여구 배제 및 실행 액션 비율 | 실행 가능 항목 100% | ✅ PASS |'
      ].join('\n')
    },
    setupPromptMarkdown
  };
}

/**
 * 3. 데이터베이스 스키마 내 '품질 게이트(Quality Gate)' 속성 차분 주입 (Append-Only)
 */
export function injectQualityGateProperties(properties: NotionProperty[]): NotionProperty[] {
  const result = [...properties];

  const hasQualityStatus = result.some(
    p => p.name === 'Quality_Status' || p.name.includes('품질') || (p.type === 'select' && p.options?.includes('승인'))
  );
  if (!hasQualityStatus) {
    result.push({
      name: 'Quality_Status',
      type: 'select',
      options: ['초안', '검수 중', '승인', '반려']
    });
  }

  const hasVerified = result.some(
    p => p.name === 'Verified' || p.name.includes('검증') || p.type === 'checkbox'
  );
  if (!hasVerified) {
    result.push({
      name: 'Verified',
      type: 'checkbox'
    });
  }

  return result;
}

/**
 * 4. 하단 Agent_Heartbeat_Log 경량 감사 DB 스키마 생성기
 */
export function createHeartbeatAuditDatabase(mainDbName: string): NotionDatabase {
  return {
    name: '🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)',
    description: '노션 커스텀 에이전트 3.0의 자율 트리거 실행 내역, 처리 건수 및 침묵의 실패(Silent Failure) 방지 감사 로그 DB',
    view_type: 'table',
    properties: [
      { name: '에이전트명', type: 'title' },
      { name: '실행시각', type: 'date' },
      { name: '실행상태', type: 'select', options: ['✅ 정상', '⚠️ 경고', '❌ 실패'] },
      { name: '처리건수', type: 'number' },
      { name: '실행요약', type: 'text' },
      { name: '관련 태스크/데이터', type: 'relation', target: mainDbName }
    ],
    sample_rows: [
      {
        '에이전트명': 'Master PM Agent',
        '실행시각': new Date().toISOString().split('T')[0],
        '실행상태': '✅ 정상',
        '처리건수': 8,
        '실행요약': '데일리 D-Day 자동 갱신 및 마감 임박 알림 브리핑 발송 (성공률 100%)'
      },
      {
        '에이전트명': 'QA Gatekeeper',
        '실행시각': new Date().toISOString().split('T')[0],
        '실행상태': '✅ 정상',
        '처리건수': 3,
        '실행요약': '품질 게이트 검수 완료 (초안 1건 검수요청 접수, 승인 2건 완료)'
      }
    ]
  };
}

/**
 * 5. 무손실(Zero-Data-Loss) 템플릿 검증 & 다중 DB 강제 팽창 보장 함수
 * - 단일 DB(1개) 생성을 원천 차단하고 도메인에 맞는 최소 2~3개 관계형 DB + Heartbeat 감사 DB를 자동 결합합니다.
 */
export function ensureTemplateAgentBlueprint(template: NotionTemplate): NotionTemplate {
  // 제목 정제 수행
  const cleanTitle = sanitizeTemplateTitle(template.title, template.cover_query);

  // 1. 단일 DB인 경우 상용급 다중 관계형 DB 생태계로 강제 팽창 (Prompt Inflation)
  let baseDatabases: NotionDatabase[] = [...template.databases];
  const regularDbs = baseDatabases.filter(d => !d.name.includes('Heartbeat') && !d.name.includes('감사 로그'));

  if (regularDbs.length <= 1) {
    const inflatedDbs = getDomainEcoDatabases(template.cover_query || template.title, cleanTitle);
    // 기존 DB가 있다면 첫 번째 DB로 안전하게 교체/병합하고 나머지 2대 DB 추가
    if (regularDbs[0]) {
      inflatedDbs[0] = {
        ...inflatedDbs[0],
        name: regularDbs[0].name || inflatedDbs[0].name,
        properties: injectQualityGateProperties(regularDbs[0].properties.length > 0 ? regularDbs[0].properties : inflatedDbs[0].properties),
        sample_rows: regularDbs[0].sample_rows && regularDbs[0].sample_rows.length > 0 ? regularDbs[0].sample_rows : inflatedDbs[0].sample_rows
      };
    }
    baseDatabases = inflatedDbs;
  }

  // 2. 각 DB에 품질 게이트 속성 및 Heartbeat 연결 보장
  const updatedDatabases: NotionDatabase[] = baseDatabases.map(db => {
    const isAuditDb = db.name.includes('Heartbeat') || db.name.includes('감사 로그');
    if (isAuditDb) return db;

    const propsWithQualityGate = injectQualityGateProperties(db.properties);

    // 메인 DB에 Heartbeat 감사 로그 역방향 Relation 확인 및 연결
    const hasHeartbeatRelation = propsWithQualityGate.some(
      p => p.type === 'relation' && (p.target?.includes('Heartbeat') || p.target?.includes('감사 로그'))
    );
    if (!hasHeartbeatRelation) {
      propsWithQualityGate.push({
        name: '감사 로그 기록',
        type: 'relation',
        target: '🤖 에이전트 감사 로그 (Agent_Heartbeat_Log)'
      });
    }

    return {
      ...db,
      properties: propsWithQualityGate
    };
  });

  // 3. Heartbeat 감사 DB 누락 시 자동 생성 결합
  const hasAuditDb = updatedDatabases.some(
    db => db.name.includes('Heartbeat') || db.name.includes('감사 로그')
  );
  if (!hasAuditDb) {
    const mainDbName = updatedDatabases[0]?.name || `${cleanTitle} 마스터 DB`;
    updatedDatabases.push(createHeartbeatAuditDatabase(mainDbName));
  }

  // 4. 에이전트 3.0 블루프린트 생성 (없거나 보강 필요 시)
  const dbNames = updatedDatabases.filter(d => !d.name.includes('감사 로그')).map(d => d.name);
  const agentBlueprint = template.agentBlueprint || generateAgentBlueprint(
    template.cover_query || cleanTitle,
    cleanTitle,
    dbNames
  );

  // 5. 최상단 [🤖 커스텀 에이전트 3.0 원클릭 셋업] 콜아웃 블록 주입
  const hasAgentCallout = template.page_layout.some(
    block => block.type === 'callout' && (block as any).content?.includes('커스텀 에이전트 3.0')
  );

  const updatedLayout = [...template.page_layout];
  if (!hasAgentCallout) {
    const agentCalloutBlock: NotionBlock = {
      type: 'callout',
      icon: '🤖',
      content: `[커스텀 에이전트 3.0 원클릭 셋업 가이드]\n이 템플릿에는 노션 공식 커스텀 에이전트 지능 규격이 사전 완비되어 있습니다.\n• 역할: ${agentBlueprint.persona.role}\n• 다중 트리거: 매일 09:00 스케줄 + 노션 이벤트(상태 변경) + 메일/슬랙 체이닝\n• 모듈형 스킬팩: 마감 임박 알림, D-Day 자동 갱신, 주간 결산 브리핑, 품질 게이트 검수\n• 안전 가드: 사내 공식 Verified 문서 한정 인용, AI 워크슬롭 방지 자체 검수 표 의무 출력\n※ 상단 [📋 에이전트 셋업 프롬프트 복사] 버튼을 눌러 노션 커스텀 에이전트 설정창에 붙여넣으세요.`,
      color: 'purple'
    };
    updatedLayout.unshift(agentCalloutBlock);
  }

  return {
    ...template,
    title: cleanTitle,
    databases: updatedDatabases,
    page_layout: updatedLayout,
    agentBlueprint
  };
}

/**
 * 6. 동적 템플릿 빌더 (대화형 오케스트레이터 및 신규 생성용)
 * - 단일 DB 생성을 원천 차단하고 상용급 다중 DB 생태계 강제 조립
 */
export function buildDynamicTemplateFromPayload(params: DynamicBuildParams): NotionTemplate {
  const { topic, initialPrompt, dbSchemas, formulas, valueAdd } = params;

  // 제목 정제기 가드레일 적용
  const cleanTitle = sanitizeTemplateTitle(params.title || initialPrompt || topic, topic);

  const templateId = `dyn-template-${Date.now()}`;
  const icon = topic.includes('시설') || topic.includes('객실') || topic.includes('하자') ? '🏢'
    : topic.includes('합격') || topic.includes('시험') || topic.includes('자격증') ? '🎯'
    : topic.includes('독서') || topic.includes('책') ? '📚'
    : topic.includes('프로젝트') || topic.includes('개발') ? '💻'
    : topic.includes('가계부') || topic.includes('돈') || topic.includes('지출') ? '💰'
    : topic.includes('루틴') || topic.includes('스케줄') ? '📅'
    : '✨';

  const coverUrl = topic.includes('시설') || topic.includes('객실') || topic.includes('리조트')
    ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80'
    : topic.includes('합격') || topic.includes('시험')
    ? 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80'
    : topic.includes('독서')
    ? 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80'
    : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80';

  // 1. 단일 DB 원천 차단 & 다중 관계형 DB 생태계 강제 팽창
  let databases: NotionDatabase[] = [];

  // [Pipeline Passthrough] 전달된 dbSchemas가 1개 이상이면 100% 무손실 직결
  if (Array.isArray(dbSchemas) && dbSchemas.length >= 1) {
    dbSchemas.forEach((schema, idx) => {
      const props: NotionProperty[] = [];

      if (Array.isArray(schema.properties)) {
        schema.properties.forEach((p: any) => {
          if (p.name) {
            const rawType = (p.type || 'text').toLowerCase();
            const validTypes = ['title', 'date', 'status', 'formula', 'relation', 'select', 'multi_select', 'checkbox', 'number', 'url', 'text', 'person'];
            const propType = validTypes.includes(rawType) ? (rawType as any) : 'text';

            props.push({
              name: p.name,
              type: propType,
              expression: p.formula || p.expression,
              options: Array.isArray(p.options) ? p.options : undefined,
            });
          }
        });
      }

      // 첫 번째 컬럼이 title이 아니면 첫 번째 컬럼을 title로 승격 (불필요한 '제목' 컬럼 강제 추가 방지)
      if (!props.some((p) => p.type === 'title')) {
        if (props.length > 0) {
          props[0].type = 'title';
        } else {
          props.unshift({ name: '제목', type: 'title' });
        }
      }

      const finalProps = injectQualityGateProperties(props);

      // 실제 엑셀 행 데이터(sample_rows)가 있으면 100% 온전히 보존
      const realSampleRows = Array.isArray(schema.sample_rows) && schema.sample_rows.length > 0
        ? schema.sample_rows
        : [
            { [props[0].name]: `${cleanTitle} 예시 가이드 데이터 1`, 'Quality_Status': '초안', 'Verified': false },
            { [props[0].name]: `${cleanTitle} 핵심 완료 목표 2`, 'Quality_Status': '승인', 'Verified': true },
          ];

      databases.push({
        name: schema.name || schema.db_name || (idx === 0 ? `🏢 ${cleanTitle.replace(/^\[.*?\]\s*/, '')} 마스터 DB` : idx === 1 ? `📋 세부 점검 & 실행 트래커 DB` : `🛠️ 조치 및 리스크 관리 DB`),
        description: `AI가 동적으로 맞춤 구성한 ${schema.db_name || '마스터 DB'}입니다.`,
        view_type: 'table',
        properties: finalProps,
        sample_rows: realSampleRows,
      });
    });
  } else {
    // 단일 DB 생성을 원천 차단하고 도메인별 3대 상호 관계형 DB 생태계 강제 주입
    databases = getDomainEcoDatabases(topic, cleanTitle);
  }

  // 2. Heartbeat 감사 DB 연동
  const mainDbName = databases[0]?.name || `${cleanTitle} 마스터 트래커`;
  databases.push(createHeartbeatAuditDatabase(mainDbName));

  // 3. 에이전트 3.0 블루프린트 생성
  const dbNames = databases.filter(d => !d.name.includes('감사 로그')).map(d => d.name);
  const agentBlueprint = generateAgentBlueprint(topic, cleanTitle, dbNames);

  // 4. 가이드 블록 및 최상단 에이전트 셋업 콜아웃 빌드
  const page_layout: NotionBlock[] = [
    {
      type: 'callout',
      icon: '🤖',
      content: `[커스텀 에이전트 3.0 원클릭 셋업 가이드]\n이 템플릿에는 노션 공식 커스텀 에이전트 지능 규격이 사전 완비되어 있습니다.\n• 역할: ${agentBlueprint.persona.role}\n• 다중 트리거: 매일 09:00 스케줄 + 노션 이벤트(상태 변경) + 메일/슬랙 체이닝\n• 모듈형 스킬팩: 마감 임박 알림, D-Day 자동 갱신, 주간 결산 브리핑, 품질 게이트 검수\n• 안전 가드: 사내 공식 Verified 문서 한정 인용, AI 워크슬롭 방지 자체 검수 표 의무 출력\n※ 상단 [📋 에이전트 셋업 프롬프트 복사] 버튼을 눌러 노션 커스텀 에이전트 설정창에 붙여넣으세요.`,
      color: 'purple'
    },
    {
      type: 'callout',
      icon: icon,
      content: `${cleanTitle} AI 맞춤형 노션 템플릿에 오신 것을 환영합니다!\nNotion Architect v2.0 AI 오케스트레이터가 워크스페이스 구조를 최적화하여 자동 구축했습니다.`,
      color: 'blue'
    },
    {
      type: 'heading_1',
      content: `📌 ${cleanTitle} 특장점 및 차별화 스펙`
    },
    {
      type: 'bulleted_list_item',
      content: (valueAdd && valueAdd[0]) || 'Formulas 2.0 시각화 수식(진행률 바) 및 실시간 D-Day 연동'
    },
    {
      type: 'bulleted_list_item',
      content: (valueAdd && valueAdd[1]) || '3대 핵심 DB 상호 관계형(Relation) 생태계 및 Agent_Heartbeat_Log 감사 연동'
    },
    {
      type: 'divider'
    }
  ];

  return {
    id: templateId,
    title: cleanTitle,
    icon,
    cover_query: topic,
    cover_url: coverUrl,
    description: `AI 오케스트레이터가 대화 명령을 바탕으로 단일 DB 생성을 원천 차단하고 상용급 다중 관계형 스키마 및 Formulas 2.0을 적용하여 자동 빌드한 템플릿입니다.`,
    tags: ['#상용급다중DB', '#Formulas2.0', '#에이전트3.0', `#${topic.replace(/\s+/g, '')}`, '#무손실마이그레이션'],
    databases,
    page_layout,
    agentBlueprint,
    formulas2Specs: Array.isArray(formulas) ? formulas : [
      { name: '진행률 수식', formula: 'if(prop("진행 상태")=="완료","100%","50%")', use_case: 'D-Day 및 과제 진행도 실시간 트래킹' }
    ],
    valueAddList: valueAdd || ['상용급 3대 관계형 DB 자동 팽창', 'Formulas 2.0 고성능 수식 연동', '커스텀 에이전트 3.0 규격 탑재'],
    created_at: new Date().toISOString()
  };
}
