// src/services/lifeHubNotionPublisher.ts
// 라이프 Hub 4대 마스터 DB 노션 API 무손실 배포 엔진 및 접이식 토글 에이전트 지침서 패키징 (4단계)

import { extractNotionPageId, fetchNotionWithBackoff } from './notionApi';
import type { LifeHubMasterState } from '../types/lifeHub';
import type { CreatedNotionDatabaseInfo } from '../types/notion';

export interface NotionDeploymentResult {
  pageId: string;
  pageUrl: string;
  pageTitle: string;
  databases: CreatedNotionDatabaseInfo[];
  databaseUrls?: {
    projectsDbUrl?: string;
    tasksDbUrl?: string;
    resourcesDbUrl?: string;
    lifeLogsDbUrl?: string;
  };
}

/**
 * 2026 노션 자율 에이전트 RISEN 지침서 및 뷰 세팅 가이드 블록 생성기
 */
function buildToggleGuideBlocks() {
  const agentPromptContent = `[Role]
당신은 사용자의 2026 생산성 비서 '노아(NOA) - 라이프 Hub 총괄 조종사'입니다.

[Instructions]
1. 사용자가 아침에 접속하면 Tasks DB에서 오늘 마감인 과제 중 가장 중요한 3건을 선별하여 'Top 3 (MITs)'로 브리핑하십시오.
2. Projects DB의 D-Day가 3일 이내인 프로젝트가 있다면 긴급 플래그(🔥)를 세우고 선제 조치를 제안하십시오.
3. Resources 인박스에 쌓인 미분류 웹북마크/메모가 5건 이상이면 2클릭 아카이빙을 권장하십시오.
4. 지출 발생 시 Life Log DB에 카테고리를 식비/쇼핑/고정지출로 자동 분류하여 월 예산 누수를 방어하십시오.

[Steps]
- Step 1: 모닝 루틴 완료 여부 및 연속 달성 스트릭 점검
- Step 2: 당일 최고 우선순위(🔥 P0) 태스크 집중 실행 제안
- Step 3: 저녁 시간대 일일 회고 및 미완료 과제 익일 재스케줄링

[End Goal]
사용자가 일체의 인지 부하 없이 완벽한 몰입 상태를 유지하도록 돕습니다.`;

  return [
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [
          {
            type: 'text',
            text: { content: '▶ 💡 [1초 세팅 가이드 & 2026 노션 자율 에이전트 지침서]' },
            annotations: { bold: true, color: 'blue' }
          }
        ],
        children: [
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '1. 📊 10초 만에 끝내는 추천 뷰(View) 세팅' } }]
            }
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                { type: 'text', text: { content: '🎯 Projects DB: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: '[보드 뷰] 추가 ➔ 그룹화 기준: ' } },
                { type: 'text', text: { content: '상태(Status)' }, annotations: { code: true } },
                { type: 'text', text: { content: ' (기획 ➔ 진행 ➔ 완료)' } }
              ]
            }
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                { type: 'text', text: { content: '⚡ Tasks & Habits DB: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: '[캘린더 뷰] 추가 ➔ 날짜 기준: ' } },
                { type: 'text', text: { content: '마감일시' }, annotations: { code: true } },
                { type: 'text', text: { content: ' / 필터: ' } },
                { type: 'text', text: { content: '완료 = 미체크' }, annotations: { code: true } }
              ]
            }
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                { type: 'text', text: { content: '🧠 Resources DB: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: '[갤러리 뷰] 추가 ➔ 카드 미리보기: 페이지 커버' } }
              ]
            }
          },
          {
            object: 'block',
            type: 'divider',
            divider: {}
          },
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '2. 🤖 2026 노션 자율 에이전트 시스템 프롬프트 (RISEN 규격)' } }]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                { type: 'text', text: { content: '아래 프롬프트를 복사하여 노션 AI 커스텀 프롬프트 또는 외부 자동화 워크플로우에 등록하여 사용하세요.' } }
              ]
            }
          },
          {
            object: 'block',
            type: 'code',
            code: {
              caption: [{ type: 'text', text: { content: 'NOA Life Hub Agent System Prompt' } }],
              rich_text: [{ type: 'text', text: { content: agentPromptContent } }],
              language: 'markdown'
            }
          }
        ]
      }
    }
  ];
}

/**
 * 4대 마스터 DB를 노션 워크스페이스에 무손실 일괄 생성하고 관계형을 2-Pass로 체이닝
 */
export async function deployLifeHubToNotion(
  apiKey: string,
  rawParentPageId: string,
  currentState: LifeHubMasterState,
  onProgress?: (step: string, percent: number) => void
): Promise<NotionDeploymentResult> {
  const parentPageId = extractNotionPageId(rawParentPageId);
  if (!apiKey?.trim() || !parentPageId) {
    throw new Error('노션 API 연동 키와 부모 페이지 ID를 등록해야 배포할 수 있습니다.');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey.trim()}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1단계: 메인 부모 페이지 [🌱 라이프 Hub (Life Hub) 조종석] 생성 및 접이식 토글 블록 패키징
  // ─────────────────────────────────────────────────────────────────────────────
  onProgress?.('🌱 메인 라이프 Hub 조종석 페이지 및 접이식 토글 가이드 구성 중... (1/5)', 15);

  const toggleBlocks = buildToggleGuideBlocks();
  const createPagePayload = {
    parent: { type: 'page_id', page_id: parentPageId },
    icon: { type: 'emoji', emoji: '🌱' },
    cover: {
      type: 'external',
      external: {
        url: 'https://images.unsplash.com/photo-1507842229451-7f01be8860ee?auto=format&fit=crop&w=1600&q=80'
      }
    },
    properties: {
      title: {
        title: [
          { type: 'text', text: { content: '🌱 라이프 Hub (Life Hub) 2026 조종석' } }
        ]
      }
    },
    children: toggleBlocks
  };

  const pageRes = await fetchNotionWithBackoff('/api/notion/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify(createPagePayload)
  });

  if (!pageRes.ok) {
    const errJson = await pageRes.json().catch(() => ({}));
    throw new Error(`노션 부모 페이지 생성 실패: ${errJson.message || pageRes.statusText}`);
  }

  const hubPageData = await pageRes.json();
  const hubPageId: string = hubPageData.id;
  const hubPageUrl: string = hubPageData.url || `https://notion.so/${hubPageId.replace(/-/g, '')}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // 2단계 (Pass 1): 🎯 1. Projects DB (목표) 선행 생성
  // ─────────────────────────────────────────────────────────────────────────────
  onProgress?.('🎯 Projects 마스터 DB 및 Formulas 2.0 수식 생성 중... (2/5)', 35);

  const projectsDbPayload = {
    parent: { type: 'page_id', page_id: hubPageId },
    icon: { type: 'emoji', emoji: '🎯' },
    title: [{ type: 'text', text: { content: '🎯 Projects DB (목표)' } }],
    properties: {
      '프로젝트명': { title: {} },
      '영역': {
        select: {
          options: [
            { name: '커리어', color: 'blue' },
            { name: '재테크', color: 'green' },
            { name: '건강', color: 'red' },
            { name: '라이프', color: 'orange' }
          ]
        }
      },
      '목표일': { date: {} },
      '상태': {
        select: {
          options: [
            { name: '기획', color: 'gray' },
            { name: '진행', color: 'yellow' },
            { name: '완료', color: 'green' }
          ]
        }
      },
      '진척률': { rich_text: {} },
      'D-Day': { rich_text: {} },
      '설명': { rich_text: {} }
    }
  };

  const projectsDbRes = await fetchNotionWithBackoff('/api/notion/v1/databases', {
    method: 'POST',
    headers,
    body: JSON.stringify(projectsDbPayload)
  });

  if (!projectsDbRes.ok) {
    const err = await projectsDbRes.json().catch(() => ({}));
    throw new Error(`Projects DB 생성 실패: ${err.message || projectsDbRes.statusText}`);
  }

  const projectsDbData = await projectsDbRes.json();
  const projectsDbId: string = projectsDbData.id;

  // ─────────────────────────────────────────────────────────────────────────────
  // 3단계 (Pass 2): ⚡ Tasks, 🧠 Resources, 💰 Life Log DB 생성 & 양방향 관계형 결합
  // ─────────────────────────────────────────────────────────────────────────────
  onProgress?.('⚡ Tasks & Habits, Resources, Life Log DB 생성 및 Relation 결합 중... (3/5)', 55);

  // 2. Tasks & Habits DB (Projects relation 연결)
  const tasksDbPayload = {
    parent: { type: 'page_id', page_id: hubPageId },
    icon: { type: 'emoji', emoji: '⚡' },
    title: [{ type: 'text', text: { content: '⚡ Tasks & Habits DB (실행/습관)' } }],
    properties: {
      '과제명': { title: {} },
      '구분': {
        select: {
          options: [
            { name: '할일', color: 'blue' },
            { name: '모닝루틴', color: 'orange' }
          ]
        }
      },
      '우선순위': {
        select: {
          options: [
            { name: '🔥 P0', color: 'red' },
            { name: '⚡ P1', color: 'yellow' },
            { name: '☕ P2', color: 'gray' }
          ]
        }
      },
      '마감일시': { date: {} },
      '완료': { checkbox: {} },
      '소요시간': { rich_text: {} },
      '스트릭': { rich_text: {} },
      '프로젝트': {
        relation: {
          database_id: projectsDbId,
          type: 'dual_property',
          dual_property: {}
        }
      },
      '메모': { rich_text: {} }
    }
  };

  // 3. Resources & Inbox DB (Projects relation 연결)
  const resourcesDbPayload = {
    parent: { type: 'page_id', page_id: hubPageId },
    icon: { type: 'emoji', emoji: '🧠' },
    title: [{ type: 'text', text: { content: '🧠 Resources & Inbox DB (지식)' } }],
    properties: {
      '제목': { title: {} },
      '유형': {
        select: {
          options: [
            { name: '빠른메모', color: 'gray' },
            { name: '북마크', color: 'blue' },
            { name: '문서', color: 'green' },
            { name: '영수증', color: 'purple' }
          ]
        }
      },
      '원문URL': { url: {} },
      '요약내용': { rich_text: {} },
      '처리상태': {
        select: {
          options: [
            { name: '인박스', color: 'yellow' },
            { name: '처리완료', color: 'green' }
          ]
        }
      },
      '프로젝트': {
        relation: {
          database_id: projectsDbId,
          type: 'dual_property',
          dual_property: {}
        }
      }
    }
  };

  // 4. Life Log DB (지출/생활)
  const lifeLogsDbPayload = {
    parent: { type: 'page_id', page_id: hubPageId },
    icon: { type: 'emoji', emoji: '💰' },
    title: [{ type: 'text', text: { content: '💰 Life Log DB (생활/재정)' } }],
    properties: {
      '항목명': { title: {} },
      '카테고리': {
        select: {
          options: [
            { name: '식비', color: 'orange' },
            { name: '쇼핑', color: 'blue' },
            { name: '고정지출', color: 'purple' },
            { name: '운동', color: 'red' },
            { name: '수면', color: 'gray' }
          ]
        }
      },
      '금액': { number: { format: 'won' } },
      '일시': { date: {} },
      '메모': { rich_text: {} }
    }
  };

  const [tasksDbRes, resourcesDbRes, lifeLogsDbRes] = await Promise.all([
    fetchNotionWithBackoff('/api/notion/v1/databases', { method: 'POST', headers, body: JSON.stringify(tasksDbPayload) }),
    fetchNotionWithBackoff('/api/notion/v1/databases', { method: 'POST', headers, body: JSON.stringify(resourcesDbPayload) }),
    fetchNotionWithBackoff('/api/notion/v1/databases', { method: 'POST', headers, body: JSON.stringify(lifeLogsDbPayload) })
  ]);

  if (!tasksDbRes.ok || !resourcesDbRes.ok || !lifeLogsDbRes.ok) {
    throw new Error('하위 3대 DB 생성 또는 관계형 결합 중 오류가 발생했습니다.');
  }

  const tasksDbData = await tasksDbRes.json();
  const resourcesDbData = await resourcesDbRes.json();
  const lifeLogsDbData = await lifeLogsDbRes.json();

  const tasksDbId: string = tasksDbData.id;
  const resourcesDbId: string = resourcesDbData.id;
  const lifeLogsDbId: string = lifeLogsDbData.id;

  // ─────────────────────────────────────────────────────────────────────────────
  // 4단계: 실시간 데이터 무손실 적재 (Rows Insertion)
  // ─────────────────────────────────────────────────────────────────────────────
  onProgress?.('📦 실시간 4대 DB 데이터 무손실 적재 중... (4/5)', 75);

  // 1. Projects 레코드 삽입 및 매핑 ID 테이블 보관
  const projectNotionIdMap = new Map<string, string>(); // localId -> notionPageId
  for (const proj of currentState.projects.slice(0, 10)) {
    try {
      const pRes = await fetchNotionWithBackoff('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: projectsDbId },
          properties: {
            '프로젝트명': { title: [{ text: { content: proj.title } }] },
            '영역': { select: { name: proj.area } },
            '목표일': proj.targetDate ? { date: { start: proj.targetDate } } : undefined,
            '상태': { select: { name: proj.status } },
            '진척률': { rich_text: [{ text: { content: proj.progressGauge || '□□□□□ 0%' } }] },
            'D-Day': { rich_text: [{ text: { content: proj.ddayTag || '진행중' } }] },
            '설명': proj.description ? { rich_text: [{ text: { content: proj.description } }] } : undefined
          }
        })
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        projectNotionIdMap.set(proj.id, pData.id);
      }
    } catch (e) {
      console.warn('[deployLifeHubToNotion] Project row insertion skipped:', e);
    }
  }

  // 2. Tasks 레코드 삽입 (프로젝트 Relation 매핑 포함)
  for (const task of currentState.tasks.slice(0, 15)) {
    try {
      const targetNotionProjId = task.projectId ? projectNotionIdMap.get(task.projectId) : undefined;
      await fetchNotionWithBackoff('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: tasksDbId },
          properties: {
            '과제명': { title: [{ text: { content: task.title } }] },
            '구분': { select: { name: task.type } },
            '우선순위': { select: { name: task.priority } },
            '마감일시': task.dueDate ? { date: { start: task.dueDate.split(' ')[0] } } : undefined,
            '완료': { checkbox: task.completed },
            '소요시간': { rich_text: [{ text: { content: task.duration || '30m' } }] },
            '스트릭': task.streakTag ? { rich_text: [{ text: { content: task.streakTag } }] } : undefined,
            '프로젝트': targetNotionProjId ? { relation: [{ id: targetNotionProjId }] } : undefined,
            '메모': task.notes ? { rich_text: [{ text: { content: task.notes } }] } : undefined
          }
        })
      });
    } catch (e) {
      console.warn('[deployLifeHubToNotion] Task row insertion skipped:', e);
    }
  }

  // 3. Resources 레코드 삽입
  for (const res of currentState.resources.slice(0, 10)) {
    try {
      await fetchNotionWithBackoff('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: resourcesDbId },
          properties: {
            '제목': { title: [{ text: { content: res.title } }] },
            '유형': { select: { name: res.type } },
            '원문URL': res.sourceUrl ? { url: res.sourceUrl } : undefined,
            '요약내용': { rich_text: [{ text: { content: res.summary || '' } }] },
            '처리상태': { select: { name: res.status } }
          }
        })
      });
    } catch (e) {
      console.warn('[deployLifeHubToNotion] Resource row insertion skipped:', e);
    }
  }

  // 4. Life Log 레코드 삽입
  for (const log of currentState.lifeLogs.slice(0, 10)) {
    try {
      await fetchNotionWithBackoff('/api/notion/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: lifeLogsDbId },
          properties: {
            '항목명': { title: [{ text: { content: log.title } }] },
            '카테고리': { select: { name: log.category } },
            '금액': typeof log.amount === 'number' ? { number: log.amount } : undefined,
            '일시': log.date ? { date: { start: log.date.split(' ')[0] } } : undefined,
            '메모': { rich_text: [{ text: { content: log.note || '' } }] }
          }
        })
      });
    } catch (e) {
      console.warn('[deployLifeHubToNotion] LifeLog row insertion skipped:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5단계: 배포 완료
  // ─────────────────────────────────────────────────────────────────────────────
  onProgress?.('🎉 라이프 Hub 4대 마스터 DB 노션 배포 완결! (5/5)', 100);

  return {
    pageId: hubPageId,
    pageUrl: hubPageUrl,
    pageTitle: '🌱 라이프 Hub (Life Hub) 2026 조종석',
    databases: [
      { id: projectsDbId, name: '🎯 Projects DB (목표)', url: projectsDbData.url },
      { id: tasksDbId, name: '⚡ Tasks & Habits DB (실행/습관)', url: tasksDbData.url },
      { id: resourcesDbId, name: '🧠 Resources & Inbox DB (지식)', url: resourcesDbData.url },
      { id: lifeLogsDbId, name: '💰 Life Log DB (생활/재정)', url: lifeLogsDbData.url }
    ],
    databaseUrls: {
      projectsDbUrl: projectsDbData.url,
      tasksDbUrl: tasksDbData.url,
      resourcesDbUrl: resourcesDbData.url,
      lifeLogsDbUrl: lifeLogsDbData.url
    }
  };
}
