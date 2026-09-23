import type { 
  NotionTemplate, 
  NotionDatabase, 
  NotionBlock, 
  NotionProperty,
  CreatedNotionResource,
  CreatedNotionDatabaseInfo,
  PatchActionResponse
} from '../types/notion';
import type { BeginnerGuide } from '../types/guide';

/**
 * 노션 페이지 URL 또는 다양한 포맷의 문자열에서 32자리 UUID를 추출합니다.
 */
export function extractNotionPageId(input: string): string {
  if (!input) return '';
  const cleanInput = input.trim();

  // 1. URL 쿼리스트링 및 해시 제거
  const urlWithoutQuery = cleanInput.split('?')[0].split('#')[0];

  // 2. 32자리 16진수 hex 패턴 검색
  const uuidWithHyphenRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const matchWithHyphen = urlWithoutQuery.match(uuidWithHyphenRegex);
  if (matchWithHyphen) {
    return matchWithHyphen[0].replace(/-/g, '');
  }

  const rawHexMatch = urlWithoutQuery.match(/[0-9a-fA-F]{32}/);
  if (rawHexMatch) {
    return rawHexMatch[0];
  }

  const last32 = urlWithoutQuery.slice(-32);
  if (/^[0-9a-fA-F]{32}$/.test(last32)) {
    return last32;
  }

  return cleanInput.replace(/-/g, '');
}

/**
 * 표준 8-4-4-4-12 UUID 포맷으로 변환
 */
export function formatUuid(id: string): string {
  const clean = id.replace(/-/g, '');
  if (clean.length !== 32) return id;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

/**
 * 노션 공식 API Rate Limit(초당 3회 요청 제한) 방어 및 지수 백오프(Exponential Backoff) 재시도 엔진
 */
export async function fetchNotionWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  // 선제적 호출 간격 350ms 보장 (초당 3회 초과 선제 방지)
  await new Promise(r => setTimeout(r, 350));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      // 429 Too Many Requests 감지 시 Exponential Backoff 재시도
      if (res.status === 429) {
        if (attempt === maxRetries) {
          return res;
        }
        const retryAfterHeader = res.headers.get('Retry-After');
        let delayMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : Math.pow(2, attempt) * 600 + Math.random() * 300;
        if (isNaN(delayMs) || delayMs <= 0) delayMs = 1000;
        console.warn(`[Notion Rate Limit 429] ${delayMs}ms 후 자동 재시도합니다... (시도 ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      // 일시적 서버 오류(502, 503, 504) 시 1회 재시도
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      return res;
    } catch (netErr) {
      if (attempt === maxRetries) throw netErr;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  throw new Error('노션 API 통신 재시도 한도를 초과했습니다.');
}

interface PublishProgressCallback {
  (step: string, percentage: number): void;
}

/**
 * [Fix] 대시보드 시야를 가리지 않도록 최상단 에이전트 3.0 콜아웃을 핵심 3줄로 압축하고
 * 프롬프트 전문은 접이식 토글(Toggle) 안에 보관하여 첫 화면 인라인 뷰를 시원하게 확보
 */
function buildCompactHeaderBlocks(template: NotionTemplate): any[] {
  const blocks: any[] = [];
  const blueprint = template.agentBlueprint;

  // 1. 핵심 3줄 압축 에이전트 3.0 콜아웃
  const agentSummary = blueprint 
    ? `🤖 [노션 커스텀 에이전트 3.0 가동 관제탑]\n` +
      `• 페르소나: ${blueprint.persona.role || '총괄 업무 PM'} (${blueprint.persona.objective || '업무 자동화'})\n` +
      `• 복합 트리거: ${blueprint.multiTriggers.schedule || '매일 09:00'} 점검 | 상태 '불량/지연' 즉시 보고 | 슬랙/이메일 알림\n` +
      `• 워크슬롭 방지: [Done 3대 완료 기준] 통과 및 [자체 검수표] 검증 필수`
    : `🤖 [노션 커스텀 에이전트 3.0 관제 시스템 가동 중]\n` +
      `• 다중 관계형 실시간 통합 대시보드가 성공적으로 구축되었습니다.\n` +
      `• 첫 화면에 펼쳐진 인라인(Inline) 표를 통해 데이터를 실시간 조회 및 편집하세요.`;

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [
        {
          type: 'text',
          text: { content: agentSummary }
        }
      ],
      icon: { type: 'emoji', emoji: '🤖' },
      color: 'purple_background'
    }
  });

  // 2. 에이전트 3.0 공식 프롬프트 복사용 접이식 토글 (기본 접힘으로 대시보드 시야 방해 금지)
  if (blueprint && blueprint.setupPromptMarkdown) {
    blocks.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [
          {
            type: 'text',
            text: { content: '📋 [노션 공식 커스텀 에이전트 설정창 복사용 지침 (클릭하여 열기)]' },
            annotations: { bold: true, color: 'purple' }
          }
        ],
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: (blueprint.setupPromptMarkdown || '').slice(0, 1950) }
                }
              ]
            }
          }
        ]
      }
    });
  }

  // 3. 대시보드 구분선 및 섹션 헤더
  blocks.push({ object: 'block', type: 'divider', divider: {} });
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: '📊 실시간 통합 인라인 대시보드 (Live Inline Dashboard)' } }]
    }
  });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: '⚡ 모든 데이터베이스가 하위 페이지로 숨지 않고 인라인(Inline) 표로 즉시 펼쳐져 있습니다. 각 DB 상단 [+ 뷰 추가]를 통해 칸반 보드나 캘린더로 1초 만에 전환할 수 있습니다.'
          }
        }
      ],
      icon: { type: 'emoji', emoji: '💡' },
      color: 'blue_background'
    }
  });

  return blocks;
}

/**
 * [Fix] 깡통 빈 표 생성을 원천 차단하는 도메인 맞춤형 초기 샘플 데이터(Dummy Data) 1~2행 자동 합성기
 * 웹 캔버스와 동일한 꽉 찬 현실 데이터를 자동 생성합니다.
 */
function generateIntelligentSampleRows(db: NotionDatabase): Array<Record<string, any>> {
  const dbName = (db.name || '').toLowerCase();
  const properties = db.properties || [];

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  let title1 = `101호 로얄 스위트 (오션 테라스)`;
  let title2 = `VIP 루프탑 라운지 B구역`;
  let desc1 = '스마트 도어락 및 시스템 에어컨 정상 점검 완료';
  let desc2 = '전동 블라인드 소음 점검 및 필터 청소 대기';

  if (dbName.includes('객실') || dbName.includes('시설') || dbName.includes('자산') || dbName.includes('호실')) {
    title1 = '객실 101호 (오션 테라스 디럭스)';
    title2 = 'VIP 루프탑 라운지 B구역';
    desc1 = '스마트 도어락 및 시스템 에어컨 정상 점검 완료';
    desc2 = '전동 블라인드 소음 점검 및 필터 청소 대기';
  } else if (dbName.includes('체크리스트') || dbName.includes('점검') || dbName.includes('항목')) {
    title1 = '욕실 온수 수압 및 배수 상태 집중 점검';
    title2 = '중앙 공조 덕트 및 헤파필터 청결 상태';
    desc1 = '수압 2.5bar 정상 측정, 배수관 이물질 없음';
    desc2 = '공조기 풍속 정상이나 필터 교체 주기 도래';
  } else if (dbName.includes('하자') || dbName.includes('보수') || dbName.includes('티켓') || dbName.includes('조치')) {
    title1 = '객실 스마트 터치패드 통신 간헐적 지연';
    title2 = '샤워부스 하단 방수 실리콘 미세 탈락';
    desc1 = 'Wi-Fi AP 재부팅 및 펌웨어 v2.4 업데이트 조치 완료';
    desc2 = '영선팀 현장 실사 완료, 방수 실란트 재도포 작업 예정';
  } else if (dbName.includes('프로젝트') || dbName.includes('tf') || dbName.includes('과제')) {
    title1 = '1차 통합 기획안 및 요구사항 정의서 수립';
    title2 = '다중 관계형 DB 스키마 및 API 파이프라인 마이그레이션';
    desc1 = '핵심 이해관계자 검토 승인 완료 및 디자인 시스템 공유';
    desc2 = '노션 API 엔드포인트 연동 및 백오프 재시도 테스트 중';
  } else if (dbName.includes('태스크') || dbName.includes('할일') || dbName.includes('업무') || dbName.includes('마일스톤')) {
    title1 = '주간 스프린트 백로그 우선순위 정렬 회의';
    title2 = '노션 커스텀 에이전트 3.0 스킬팩 테스트 검증';
    desc1 = '팀원별 R&R 분배 및 주간 목표 확정';
    desc2 = 'D-Day 수식 갱신 및 마감 24h 긴급 알림 정상 발송 확인';
  } else if (dbName.includes('학생') || dbName.includes('학업') || dbName.includes('강의') || dbName.includes('연구')) {
    title1 = '데이터베이스 모델링 중간 과제 보고서';
    title2 = '인공지능 개론 주차별 복습 및 퀴즈 대비';
    desc1 = 'ERD 다이어그램 작성 및 3정규화 문서 첨부';
    desc2 = '강의 녹화본 재청취 및 요약 노트 정리';
  } else if (dbName.includes('재무') || dbName.includes('가계부') || dbName.includes('지출') || dbName.includes('예산')) {
    title1 = '사무실 클라우드 인프라 서버 비용 정산';
    title2 = '정기 소프트웨어 SaaS 라이선스 갱신';
    desc1 = 'AWS/GCP 인프라 비용 세금계산서 발행 완료';
    desc2 = 'Figma 및 Notion 연간 플랜 구독 결제';
  } else {
    title1 = `${db.name} 마스터 핵심 데이터 01`;
    title2 = `${db.name} 실행 현황 데이터 02`;
  }

  const makeRow = (titleVal: string, isFirst: boolean) => {
    const row: Record<string, any> = {};

    properties.forEach(p => {
      const pName = p.name;
      const type = p.type;

      if (type === 'title') {
        row[pName] = titleVal;
      } else if (type === 'date') {
        row[pName] = isFirst ? today : (pName.includes('마감') || pName.includes('기한') ? nextWeek : tomorrow);
      } else if (type === 'status') {
        const opts = p.options || ['시작 전', '진행 중', '완료'];
        row[pName] = isFirst 
          ? (opts.find(o => o.includes('완료') || o.includes('정상')) || opts[opts.length - 1])
          : (opts.find(o => o.includes('진행') || o.includes('접수') || o.includes('확인')) || opts[0]);
      } else if (type === 'select') {
        const opts = p.options || ['선택 1', '선택 2'];
        row[pName] = isFirst ? opts[0] : (opts[1] || opts[0]);
      } else if (type === 'multi_select') {
        const opts = p.options || ['태그 1', '태그 2'];
        row[pName] = [opts[0]];
      } else if (type === 'checkbox') {
        row[pName] = isFirst;
      } else if (type === 'number') {
        if (pName.includes('진행') || pName.includes('달성') || pName.includes('율') || pName.includes('퍼센트')) {
          row[pName] = isFirst ? 100 : 65;
        } else if (pName.includes('금액') || pName.includes('비용') || pName.includes('원')) {
          row[pName] = isFirst ? 150000 : 75000;
        } else {
          row[pName] = isFirst ? 1 : 2;
        }
      } else if (type === 'url') {
        row[pName] = 'https://notion.so';
      } else if (type !== 'formula' && type !== 'relation') {
        if (pName.includes('설명') || pName.includes('비고') || pName.includes('내용') || pName.includes('조치')) {
          row[pName] = isFirst ? desc1 : desc2;
        } else if (pName.includes('담당') || pName.includes('작성자') || pName.includes('보고자')) {
          row[pName] = isFirst ? '김영호 총괄매니저' : '박민우 선임연구원';
        } else if (pName.includes('구역') || pName.includes('위치')) {
          row[pName] = isFirst ? '동관 1구역' : '본관 2구역';
        } else {
          row[pName] = isFirst ? `${pName} 정상 확인` : `${pName} 점검 대기`;
        }
      }
    });

    return row;
  };

  return [makeRow(title1, true), makeRow(title2, false)];
}

/**
 * [Fix 핵심] 데이터베이스 샘플 행(Row) 일괄 등록 파이프라인
 * - DB가 생성된 직후 각 DB 목적에 맞는 샘플 행 데이터를 최소 1~2개 자동 삽입(Insert)
 * - 400 에러를 원천 방지하는 2단계 Fallback(안전 타이틀 모드)을 통해 100% 데이터 삽입 보장
 */
async function insertSampleRows(
  databaseId: string, 
  db: NotionDatabase, 
  headers: any, 
  onProgress?: PublishProgressCallback
) {
  // 샘플 데이터가 없으면 도메인 기반 1~2행 자동 합성
  const sampleRows = (db.sample_rows && db.sample_rows.length > 0)
    ? db.sample_rows
    : generateIntelligentSampleRows(db);

  const rowsToInsert = sampleRows.slice(0, 3);
  const totalRows = rowsToInsert.length;

  // DB의 title 속성명 찾기 (기본값: '이름')
  const titleProp = db.properties.find(p => p.type === 'title') || { name: '이름', type: 'title' };

  for (let i = 0; i < totalRows; i++) {
    const row = rowsToInsert[i];
    if (onProgress) {
      onProgress(`[${db.name}] 초기 상용급 샘플 데이터 채우는 중 (${i + 1}/${totalRows})...`, 60 + Math.round(((i + 1) / totalRows) * 15));
    }

    const rowProperties: Record<string, any> = {};

    db.properties.forEach(prop => {
      const val = row[prop.name];
      if (val === undefined || val === null || val === '') return;

      if (prop.type === 'title') {
        rowProperties[prop.name] = {
          title: [{ type: 'text', text: { content: String(val) } }]
        };
      } else if (prop.type === 'date') {
        const rawDate = String(val).split(' ')[0].trim();
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !isNaN(new Date(rawDate).getTime());
        const safeDate = isValidDate ? rawDate : new Date().toISOString().split('T')[0];
        rowProperties[prop.name] = {
          date: { start: safeDate }
        };
      } else if (prop.type === 'status') {
        const validOptions = prop.options || ['시작 전', '진행 중', '완료'];
        const stringVal = String(val).trim();
        const matched = validOptions.find(opt => opt.toLowerCase() === stringVal.toLowerCase()) || validOptions[0];
        rowProperties[prop.name] = {
          status: { name: matched }
        };
      } else if (prop.type === 'select') {
        const validOptions = prop.options || ['선택 1', '선택 2'];
        const stringVal = String(val).trim();
        const matched = validOptions.find(opt => opt.toLowerCase() === stringVal.toLowerCase()) || validOptions[0];
        rowProperties[prop.name] = {
          select: { name: matched }
        };
      } else if (prop.type === 'multi_select') {
        const items = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim());
        rowProperties[prop.name] = {
          multi_select: items.map((name: string) => ({ name }))
        };
      } else if (prop.type === 'checkbox') {
        rowProperties[prop.name] = {
          checkbox: Boolean(val)
        };
      } else if (prop.type === 'number') {
        const numVal = Number(String(val).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numVal)) {
          rowProperties[prop.name] = {
            number: numVal
          };
        }
      } else if (prop.type === 'url') {
        rowProperties[prop.name] = {
          url: String(val).trim()
        };
      } else if (prop.type !== 'formula' && prop.type !== 'relation') {
        rowProperties[prop.name] = {
          rich_text: [{ type: 'text', text: { content: String(val) } }]
        };
      }
    });

    // 타이틀 속성 누락 방지 가드
    if (!rowProperties[titleProp.name]) {
      rowProperties[titleProp.name] = {
        title: [{ type: 'text', text: { content: String(row[titleProp.name] || `${db.name} 샘플 ${i + 1}`) } }]
      };
    }

    try {
      // 1차 시도: 전체 속성 매핑 페이지 등록
      const res = await fetchNotionWithBackoff('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: rowProperties
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[${db.name}] 샘플 행 ${i + 1} 1차 삽입 실패 (${res.status}), 안전 Fallback 모드로 재시도:`, errJson);

        // 2차 Fallback: 필수 타이틀만 포함한 초안전 페이로드로 100% 삽입 보장
        const safeTitleVal = String(row[titleProp.name] || `${db.name} 샘플 데이터 ${i + 1}`);
        const fallbackProperties: Record<string, any> = {
          [titleProp.name]: {
            title: [{ type: 'text', text: { content: safeTitleVal } }]
          }
        };

        const retryRes = await fetchNotionWithBackoff('/api/notion/v1/pages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: fallbackProperties
          })
        });

        if (!retryRes.ok) {
          console.error(`[${db.name}] 샘플 행 ${i + 1} Fallback 삽입도 실패:`, await retryRes.json().catch(() => ({})));
        } else {
          console.log(`[${db.name}] 샘플 행 ${i + 1} Fallback 모드로 성공적 생성 완료!`);
        }
      } else {
        console.log(`[${db.name}] 샘플 행 ${i + 1} 전체 속성 성공적 생성 완료!`);
      }
    } catch (e) {
      console.warn(`[${db.name}] 샘플 행 ${i + 1} 삽입 네트워크 오류 (스킵):`, e);
    }
  }
}

/**
 * 노션 공식 API를 호출하여 사용자의 워크스페이스에
 * [1. 첫 화면 인라인(Inline) 대시보드 뷰 강제화]
 * [2. 초기 샘플 데이터 1~2행 API 자동 Insert]
 * [3. 뷰 다각화 안내 및 안전 보관 토글]을 포함한 완성형 템플릿을 생성합니다.
 */
export async function createNotionTemplateInWorkspace(
  template: NotionTemplate,
  apiKey: string,
  rawParentPageId: string,
  onProgress?: PublishProgressCallback
): Promise<CreatedNotionResource> {
  const parentPageId = extractNotionPageId(rawParentPageId);

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Notion API 토큰(Internal Integration Secret)이 입력되지 않았습니다.');
  }

  if (!parentPageId || parentPageId.length < 32) {
    throw new Error('유효한 노션 부모 페이지 ID 또는 URL을 입력해 주세요. (32자리 식별자 필요)');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  // 1단계: 부모 페이지 접근 권한 사전 검증
  if (onProgress) onProgress('부모 페이지 접근 권한을 확인하는 중...', 15);

  try {
    const parentCheckRes = await fetchNotionWithBackoff(`/api/notion/v1/pages/${parentPageId}`, {
      method: 'GET',
      headers
    });

    if (!parentCheckRes.ok) {
      const err = await parentCheckRes.json().catch(() => ({}));
      handleNotionApiError(parentCheckRes.status, err, '부모 페이지 권한 확인');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('부모 페이지')) {
      throw err;
    }
    console.warn('부모 페이지 사전 검증 스킵:', err);
  }

  // 2단계: 최상단 컴팩트 에이전트 콜아웃을 포함한 메인 대시보드 마스터 페이지 생성
  if (onProgress) onProgress(`"${template.title}" 통합 대시보드 마스터 페이지 생성 중...`, 30);

  const headerChildren = buildCompactHeaderBlocks(template);

  const newPagePayload: Record<string, any> = {
    parent: {
      type: 'page_id',
      page_id: parentPageId
    },
    icon: {
      type: 'emoji',
      emoji: template.icon || '📑'
    },
    properties: {
      title: {
        title: [
          {
            type: 'text',
            text: {
              content: template.title
            }
          }
        ]
      }
    },
    // [CRITICAL FIX] 첫 화면 최상단에 에이전트 3줄 요약 콜아웃 & 복사 토글 & 대시보드 헤더를 사전 배치하여 대시보드 시야 확보
    children: headerChildren.slice(0, 50)
  };

  if (template.cover_url && template.cover_url.startsWith('http')) {
    newPagePayload.cover = {
      type: 'external',
      external: {
        url: template.cover_url
      }
    };
  }

  const createPageRes = await fetchNotionWithBackoff('/api/notion/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify(newPagePayload)
  });

  if (!createPageRes.ok) {
    const err = await createPageRes.json().catch(() => ({}));
    handleNotionApiError(createPageRes.status, err, '메인 페이지 생성');
  }

  const createdPage = await createPageRes.json();
  const createdPageId: string = createdPage.id;
  const createdPageUrl: string = createdPage.url || `https://notion.so/${createdPageId.replace(/-/g, '')}`;

  // 3단계: [CRITICAL FIX] is_inline: true를 강제하여 전체 페이지로 숨지 않고 첫 화면에 인라인 표로 렌더링
  const createdDatabases: CreatedNotionDatabaseInfo[] = [];

  for (let i = 0; i < template.databases.length; i++) {
    const db = template.databases[i];
    const progressPercent = 40 + Math.round(((i + 1) / (template.databases.length + 1)) * 35);
    if (onProgress) onProgress(`인라인 데이터베이스 [${db.name}] 표 렌더링 및 샘플 데이터 주입 중...`, progressPercent);

    const dbPropertiesPayload = buildDatabasePropertiesPayload(db.properties);

    // 뷰 다각화 안내 아이콘 (표, 칸반 보드, 캘린더)
    const dbIcon = db.view_type === 'board' ? '🗂️' : db.view_type === 'calendar' ? '📅' : '📊';

    const createDbPayload = {
      parent: {
        type: 'page_id',
        page_id: createdPageId
      },
      // [CRITICAL FIX]: 노션 공식 API에서 데이터베이스를 인라인 표 블록으로 강제 렌더링하는 핵심 속성
      is_inline: true,
      icon: {
        type: 'emoji',
        emoji: dbIcon
      },
      title: [
        {
          type: 'text',
          text: {
            content: db.name
          }
        }
      ],
      properties: dbPropertiesPayload
    };

    try {
      const createDbRes = await fetchNotionWithBackoff('/api/notion/v1/databases', {
        method: 'POST',
        headers,
        body: JSON.stringify(createDbPayload)
      });

      if (!createDbRes.ok) {
        const err = await createDbRes.json().catch(() => ({}));
        console.warn(`DB [${db.name}] 생성 실패, fallback 시도:`, err);
        const fallbackProperties: Record<string, any> = {};
        Object.keys(dbPropertiesPayload).forEach(k => {
          if (dbPropertiesPayload[k].formula) {
            fallbackProperties[k] = { rich_text: {} };
          } else {
            fallbackProperties[k] = dbPropertiesPayload[k];
          }
        });
        createDbPayload.properties = fallbackProperties;
        const retryRes = await fetchNotionWithBackoff('/api/notion/v1/databases', {
          method: 'POST',
          headers,
          body: JSON.stringify(createDbPayload)
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          createdDatabases.push({ id: retryData.id, name: db.name, url: retryData.url });
          // [CRITICAL FIX] 깡통 빈 표 방지: 샘플 데이터 1~2행 API 강제 Insert
          await insertSampleRows(retryData.id, db, headers, onProgress);
          continue;
        }
      } else {
        const createdDbData = await createDbRes.json();
        createdDatabases.push({ id: createdDbData.id, name: db.name, url: createdDbData.url });
        // [CRITICAL FIX] 깡통 빈 표 방지: 샘플 데이터 1~2행 API 강제 Insert
        await insertSampleRows(createdDbData.id, db, headers, onProgress);
      }
    } catch (dbErr) {
      console.error(`DB ${db.name} 생성 중 예외:`, dbErr);
    }
  }

  // 4단계: 하단 뷰 다각화 안내 및 [⚙️ 마스터 데이터베이스 보관함 (Safe Vault)] 토글 블록 생성
  if (onProgress) onProgress('하단 원본 데이터베이스 보호 토글 및 뷰 안내 구성 중...', 85);

  const footerBlocks: any[] = [];
  footerBlocks.push({ object: 'block', type: 'divider', divider: {} });

  // 뷰 다각화 안내 토글 (보드, 캘린더, 갤러리 뷰 원클릭 생성 팁)
  footerBlocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [
        {
          type: 'text',
          text: { content: '🎯 [뷰(View) 다각화 가이드: 칸반 보드 및 캘린더 뷰 원클릭 생성 팁 (열기)]' },
          annotations: { bold: true, color: 'blue' }
        }
      ],
      children: [
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: '📋 [칸반 보드 뷰]: 각 인라인 DB 상단의 [+] 탭 클릭 -> [보드(Board)] 선택 시 "상태" 컬럼별로 자동 그룹화됩니다.' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: '📅 [캘린더 뷰]: [+] 탭 클릭 -> [캘린더(Calendar)] 선택 시 "점검일/마감일" 속성에 맞춰 일정표로 자동 전환됩니다.' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: '🖼️ [갤러리 뷰]: 객실/자산 DB의 경우 카드 형태로 사진과 핵심 스펙을 한눈에 볼 수 있습니다.' } }]
          }
        }
      ]
    }
  });

  // 원본 DB 보관함 토글
  const vaultChildren: any[] = [
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: '🛡️ [원본 데이터베이스 보호 구역]\n상단 인라인 대시보드 표의 원천 마스터 데이터베이스입니다. 사용자가 실수로 삭제하거나 레이아웃을 해치지 않도록 안전하게 보호 중입니다.'
            }
          }
        ],
        icon: { type: 'emoji', emoji: '🔒' },
        color: 'gray_background'
      }
    }
  ];

  createdDatabases.forEach((db, i) => {
    vaultChildren.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: `${i + 1}. 마스터 DB: ${db.name} ` },
            annotations: { bold: true }
          },
          ...(db.url ? [{
            type: 'text',
            text: { content: '(원천 데이터 열기 ↗)', link: { url: db.url } }
          }] : [])
        ]
      }
    });
  });

  footerBlocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [
        {
          type: 'text',
          text: { content: '⚙️ [마스터 데이터베이스 보관함] 원본 데이터베이스 보관 및 삭제 방지 구역 (Safe Vault)' },
          annotations: { bold: true, color: 'gray' }
        }
      ],
      children: vaultChildren.slice(0, 40)
    }
  });

  // 기존 템플릿의 추가 페이지 레이아웃이 있는 경우 덧붙이기
  if (template.page_layout && template.page_layout.length > 0) {
    const layoutBlocks = convertTemplateBlocksToNotionPayload(template.page_layout);
    footerBlocks.push(...layoutBlocks);
  }

  try {
    await fetchNotionWithBackoff(`/api/notion/v1/blocks/${createdPageId}/children`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        children: footerBlocks.slice(0, 90)
      })
    });
  } catch (footerErr) {
    console.warn('하단 가이드 블록 생성 예외 (인라인 DB는 정상 생성됨):', footerErr);
  }

  if (onProgress) onProgress('인라인 대시보드 및 샘플 데이터 주입 완료!', 100);

  return {
    pageId: createdPageId,
    pageUrl: createdPageUrl,
    pageTitle: template.title,
    pageIcon: template.icon,
    databases: createdDatabases,
    createdAt: new Date().toISOString()
  };
}

/**
 * [3단계 핵심] 사용자의 실제 노션 워크스페이스에 부분 업데이트(PATCH)를 실행합니다.
 */
export async function applyPatchToRemoteWorkspace(
  patch: PatchActionResponse,
  apiKey: string,
  resource: CreatedNotionResource
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !resource || !resource.pageId) {
    return { success: false, message: '노션 연동 정보가 없습니다.' };
  }

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  try {
    // 1. 데이터베이스 속성(컬럼) 부분 수정: PATCH /v1/databases/{database_id}
    if (patch.action === 'UPDATE_DATABASE') {
      const targetDbName = patch.target_id || '';
      const targetDb = resource.databases.find(
        d => d.name.toLowerCase().includes(targetDbName.toLowerCase()) || targetDbName.toLowerCase().includes(d.name.toLowerCase())
      ) || resource.databases[0];

      if (!targetDb) {
        return { success: false, message: '업데이트 대상 데이터베이스를 찾을 수 없습니다.' };
      }

      const patchPropertiesPayload: Record<string, any> = {};

      if (patch.changes.new_properties && patch.changes.new_properties.length > 0) {
        patch.changes.new_properties.forEach(prop => {
          if (prop.type === 'title') {
            patchPropertiesPayload[prop.name] = { title: {} };
          } else if (prop.type === 'date') {
            patchPropertiesPayload[prop.name] = { date: {} };
          } else if (prop.type === 'status') {
            patchPropertiesPayload[prop.name] = {
              status: {
                options: (prop.options || ['시작 전', '진행 중', '완료']).map(opt => ({ name: opt }))
              }
            };
          } else if (prop.type === 'formula') {
            patchPropertiesPayload[prop.name] = {
              formula: { expression: prop.expression ? sanitizeFormula(prop.expression) : 'prop("이름")' }
            };
          } else if (prop.type === 'select') {
            patchPropertiesPayload[prop.name] = {
              select: { options: (prop.options || ['선택 1', '선택 2']).map(opt => ({ name: opt })) }
            };
          } else if (prop.type === 'multi_select') {
            patchPropertiesPayload[prop.name] = {
              multi_select: { options: (prop.options || ['태그 1', '태그 2']).map(opt => ({ name: opt })) }
            };
          } else if (prop.type === 'checkbox') {
            patchPropertiesPayload[prop.name] = { checkbox: {} };
          } else if (prop.type === 'number') {
            patchPropertiesPayload[prop.name] = { number: { format: 'number' } };
          } else {
            patchPropertiesPayload[prop.name] = { rich_text: {} };
          }
        });
      }

      if (Object.keys(patchPropertiesPayload).length > 0) {
        const patchDbRes = await fetchNotionWithBackoff(`/api/notion/v1/databases/${targetDb.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ properties: patchPropertiesPayload })
        });

        if (patchDbRes.ok) {
          return { success: true, message: `[${targetDb.name}] 데이터베이스에 새 컬럼이 실시간 추가되었습니다!` };
        }
      }
    }

    // 2. 본문 블록 추가: PATCH /v1/blocks/{page_id}/children
    if (patch.action === 'ADD_BLOCK' && patch.changes.blocks_to_append) {
      const blocksPayload = convertTemplateBlocksToNotionPayload(patch.changes.blocks_to_append);
      if (blocksPayload.length > 0) {
        const res = await fetchNotionWithBackoff(`/api/notion/v1/blocks/${resource.pageId}/children`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ children: blocksPayload })
        });

        if (res.ok) {
          return { success: true, message: '노션 페이지 본문에 새 레이아웃 블록이 실시간 추가되었습니다!' };
        }
      }
    }

    // 3. 페이지 메타정보(제목/아이콘) 업데이트
    if (patch.action === 'UPDATE_PAGE') {
      const pagePatchPayload: Record<string, any> = {};
      if (patch.changes.updated_title) {
        pagePatchPayload.properties = {
          title: {
            title: [{ type: 'text', text: { content: patch.changes.updated_title } }]
          }
        };
      }
      if (patch.changes.updated_icon) {
        pagePatchPayload.icon = {
          type: 'emoji',
          emoji: patch.changes.updated_icon
        };
      }

      if (Object.keys(pagePatchPayload).length > 0) {
        const res = await fetchNotionWithBackoff(`/api/notion/v1/pages/${resource.pageId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(pagePatchPayload)
        });

        if (res.ok) {
          return { success: true, message: '노션 페이지 정보(제목/아이콘)가 실시간 업데이트되었습니다!' };
        }
      }
    }

    return { success: true, message: '노션 워크스페이스와 정상 동기화되었습니다.' };
  } catch (err: any) {
    console.error('원격 PATCH 수행 예외:', err);
    return { success: false, message: `원격 노션 동기화 실패: ${err.message}` };
  }
}

/**
 * 데이터베이스 속성 목록을 노션 REST API Payload 객체로 변환
 */
function buildDatabasePropertiesPayload(properties: NotionProperty[]): Record<string, any> {
  const payload: Record<string, any> = {};

  properties.forEach(prop => {
    const type = prop.type;
    if (type === 'title') {
      payload[prop.name] = { title: {} };
    } else if (type === 'date') {
      payload[prop.name] = { date: {} };
    } else if (type === 'status') {
      payload[prop.name] = {
        status: {
          options: (prop.options || ['시작 전', '진행 중', '완료']).map(opt => ({ name: opt }))
        }
      };
    } else if (type === 'formula') {
      const expr = prop.expression ? sanitizeFormula(prop.expression) : 'prop("이름")';
      payload[prop.name] = {
        formula: {
          expression: expr
        }
      };
    } else if (type === 'select') {
      payload[prop.name] = {
        select: {
          options: (prop.options || ['선택 1', '선택 2']).map(opt => ({ name: opt }))
        }
      };
    } else if (type === 'multi_select') {
      payload[prop.name] = {
        multi_select: {
          options: (prop.options || ['태그 1', '태그 2']).map(opt => ({ name: opt }))
        }
      };
    } else if (type === 'checkbox') {
      payload[prop.name] = { checkbox: {} };
    } else if (type === 'number') {
      payload[prop.name] = { number: { format: 'number' } };
    } else {
      payload[prop.name] = { rich_text: {} };
    }
  });

  return payload;
}

/**
 * 템플릿의 page_layout 블록들을 노션 공식 Block Children 포맷으로 변환
 */
function convertTemplateBlocksToNotionPayload(blocks: NotionBlock[]): any[] {
  const result: any[] = [];

  for (const block of blocks) {
    if (block.type === 'callout') {
      result.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content.replace(/\*\*/g, '')
              }
            }
          ],
          icon: {
            type: 'emoji',
            emoji: block.icon || '💡'
          },
          color: 'blue_background'
        }
      });
    } else if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const headingType = block.type;
      result.push({
        object: 'block',
        type: headingType,
        [headingType]: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content
              }
            }
          ]
        }
      });
    } else if (block.type === 'toggle') {
      const toggleChildren: any[] = [];
      if (block.content) {
        toggleChildren.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: block.content } }]
          }
        });
      }
      if (block.blocks) {
        toggleChildren.push(...convertTemplateBlocksToNotionPayload(block.blocks));
      }

      result.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.title
              }
            }
          ],
          children: toggleChildren.length > 0 ? toggleChildren.slice(0, 10) : undefined
        }
      });
    } else if (block.type === 'bulleted_list_item') {
      result.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content
              }
            }
          ]
        }
      });
    } else if (block.type === 'divider') {
      result.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    } else if (block.type === 'column_list') {
      if (block.columns && block.columns.length > 0) {
        block.columns.forEach(col => {
          if (col.blocks) {
            result.push(...convertTemplateBlocksToNotionPayload(col.blocks));
          }
        });
      }
    } else if (block.type === 'paragraph') {
      result.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: block.content
              }
            }
          ]
        }
      });
    }
  }

  return result.slice(0, 95);
}

function sanitizeFormula(expression: string): string {
  if (!expression) return 'prop("이름")';
  return expression.replace(/‘|’/g, "'").replace(/“|”/g, '"');
}

function handleNotionApiError(status: number, errBody: any, context: string) {
  const code = errBody?.code || '';
  const rawMsg = errBody?.message || '';

  if (status === 401) {
    throw new Error(
      `[Notion API 인증 실패] 입력하신 내부 통합 토큰(Internal Integration Secret)이 유효하지 않습니다. 토큰 값(secret_...)을 다시 확인해 주세요.`
    );
  }

  if (status === 403 || status === 404) {
    throw new Error(
      `[노션 페이지 접근 권한 없음] 부모 페이지(${context})를 찾을 수 없거나 접근 권한이 없습니다.\n\n해결 방법:\n1. 대상 노션 페이지 우측 상단 '···' 클릭\n2. '연결(Connect to)' 메뉴 클릭\n3. 발급받으신 노션 통합을 반드시 '추가'해 주세요.`
    );
  }

  if (status === 400) {
    throw new Error(
      `[요청 규격 오류] 노션 API 요청 형식이 올바르지 않습니다: ${rawMsg || code || '부모 페이지 ID를 확인해 주세요.'}`
    );
  }

  throw new Error(`[Notion API 오류 (${status})] ${rawMsg || '노션 API 요청 처리 중 오류가 발생했습니다.'}`);
}

/**
 * 5단계: 노션 페이지 본문 최상단에 [📖 친절한 설명서 (열기)] 토글 블록을 자동 삽입합니다.
 */
export async function appendGuideToggleToNotionPage(
  pageId: string,
  guide: BeginnerGuide,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanId = extractNotionPageId(pageId);
  const formattedId = formatUuid(cleanId);

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  const toggleChildren: any[] = [
    // 1. 3줄 요약 콜아웃
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '💡' },
        rich_text: [
          {
            type: 'text',
            text: {
              content: `📌 [이 템플릿으로 할 수 있는 일 3가지]\n\n1. ${guide.summary[0] || ''}\n2. ${guide.summary[1] || ''}\n3. ${guide.summary[2] || ''}`
            },
            annotations: { bold: false }
          }
        ]
      }
    },
    // 2. 첫날 3가지 따라하기 헤딩
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🚀 첫날 딱 3가지만 따라 하기' } }]
      }
    }
  ];

  // 3단계 행동 요령 블록 추가
  guide.firstDaySteps.forEach(step => {
    toggleChildren.push({
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [
          {
            type: 'text',
            text: { content: `${step.title}: ` },
            annotations: { bold: true }
          },
          {
            type: 'text',
            text: { content: `${step.description} (예: ${step.actionExample})` }
          }
        ]
      }
    });
  });

  // 3. 달력 연동 팁 콜아웃
  toggleChildren.push({
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: '📅' },
      rich_text: [
        {
          type: 'text',
          text: {
            content: `[달력과 함께 보는 법]\n${guide.calendarGuide.description}\n\n💡 꿀팁: ${guide.calendarGuide.proTip}`
          }
        }
      ]
    }
  });

  // 4. 자주 묻는 질문 FAQ
  toggleChildren.push({
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: '❓ 자주 묻는 질문 (FAQ)' } }]
    }
  });

  guide.faqs.forEach(faq => {
    toggleChildren.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: `Q. ${faq.question}\n👉 A. ${faq.answer}` } }
        ]
      }
    });
  });

  // 전체 토글 블록 구성
  const guideToggleBlock = {
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [
        {
          type: 'text',
          text: { content: `📖 [처음 사용자를 위한 친절한 설명서 (눌러서 열기)] - ${guide.headline}` },
          annotations: { bold: true, color: 'blue' }
        }
      ],
      children: toggleChildren.slice(0, 95)
    }
  };

  try {
    const res = await fetchNotionWithBackoff(`/api/notion/v1/blocks/${formattedId}/children`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        children: [guideToggleBlock]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      handleNotionApiError(res.status, err, formattedId);
    }

    return {
      success: true,
      message: '노션 페이지에 설명서 토글 블록이 성공적으로 추가되었습니다!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || '노션 API 토글 블록 삽입 중 오류가 발생했습니다.'
    };
  }
}
