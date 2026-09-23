export type NotionPropertyType = 
  | 'title'
  | 'date'
  | 'status'
  | 'formula'
  | 'relation'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'number'
  | 'url'
  | 'text'
  | 'person';

export interface NotionProperty {
  name: string;
  type: NotionPropertyType;
  expression?: string; // formula 용
  options?: string[]; // status, select, multi_select 용
  target?: string; // relation 용 대상 DB명
}

export interface NotionDatabase {
  name: string;
  description?: string;
  view_type?: 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'dashboard';
  properties: NotionProperty[];
  sample_rows?: Array<Record<string, any>>;
}

export type BlockType = 
  | 'callout'
  | 'column_list'
  | 'toggle'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'paragraph'
  | 'bulleted_list_item'
  | 'divider'
  | 'database_view';

export interface BaseBlock {
  id?: string;
  type: BlockType;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  content: string;
  icon?: string;
  color?: string;
}

export interface ColumnItem {
  width?: number;
  blocks: NotionBlock[];
}

export interface ColumnListBlock extends BaseBlock {
  type: 'column_list';
  columns: ColumnItem[];
}

export interface ToggleBlock extends BaseBlock {
  type: 'toggle';
  title: string;
  content?: string;
  blocks?: NotionBlock[];
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading_1' | 'heading_2' | 'heading_3';
  content: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
}

export interface BulletedListItemBlock extends BaseBlock {
  type: 'bulleted_list_item';
  content: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface DatabaseViewBlock extends BaseBlock {
  type: 'database_view';
  database_name: string;
  view?: 'table' | 'board' | 'calendar' | 'gallery';
}

export type NotionBlock = 
  | CalloutBlock
  | ColumnListBlock
  | ToggleBlock
  | HeadingBlock
  | ParagraphBlock
  | BulletedListItemBlock
  | DividerBlock
  | DatabaseViewBlock;

// ─────────────────────────────────────────────────────────────────────────────
// 커스텀 에이전트 3.0 (Notion Agent 3.0) 셋업 블루프린트 인터페이스
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentSkillItem {
  id?: string;
  name: string;
  trigger: string;
  targetDb?: string;
  logic: string;
  action: string;
}

export interface SubAgentItem {
  name: string;
  role: string;
  responsibility: string;
}

export interface AgentBlueprint {
  version: string;
  persona: {
    role: string;
    objective: string;
    scope: string;
  };
  multiTriggers: {
    schedule: string;
    notionEvents: string[];
    externalEvents: string[];
  };
  skills: AgentSkillItem[];
  subAgents: SubAgentItem[];
  workslopGuardrails: {
    doneDefinition: string[];
    verifiedSourcesOnly: boolean;
    verificationMetrics: string[];
    verificationTableMarkdown: string;
  };
  setupPromptMarkdown: string; // 노션 공식 커스텀 에이전트 1-클릭 복사용 프롬프트 전문
}

export interface NotionTemplate {
  id?: string;
  schema_version?: string; // [Step 5-A] 스키마 마이그레이션 호환 태그 (예: 1.0)
  title: string;
  icon: string;
  cover_query: string;
  cover_url?: string;
  description?: string;
  tags?: string[];
  databases: NotionDatabase[];
  page_layout: NotionBlock[];
  formulas2Specs?: any[];
  valueAddList?: string[];
  agentBlueprint?: AgentBlueprint; // 에이전트 3.0 공식 셋업 블루프린트 규격
  created_at?: string;
}

// 2단계 Notion API 배포 결과 및 단계 타입
export type PublishStep = 
  | 'idle' 
  | 'validating' 
  | 'creating_page' 
  | 'creating_databases' 
  | 'inserting_rows' 
  | 'creating_blocks' 
  | 'completed' 
  | 'failed';

export interface CreatedNotionDatabaseInfo {
  id: string;
  name: string;
  url?: string;
}

export interface CreatedNotionResource {
  schema_version?: string; // [Step 5-A] 스키마 버전 태그
  pageId: string;
  pageUrl: string;
  pageTitle: string;
  pageIcon?: string;
  databases: CreatedNotionDatabaseInfo[];
  createdAt: string;
}

// 3단계 대화형 부분 수정(Diff & Patch) 액션 규격
export type PatchActionType = 
  | 'UPDATE_DATABASE' 
  | 'ADD_BLOCK' 
  | 'UPDATE_BLOCK' 
  | 'DELETE_BLOCK' 
  | 'UPDATE_PAGE';

export interface PatchChanges {
  new_properties?: NotionProperty[];
  modify_properties?: Record<string, any>;
  blocks_to_append?: NotionBlock[];
  updated_title?: string;
  updated_icon?: string;
}

export interface PatchActionResponse {
  mode: 'PATCH_UPDATE';
  action: PatchActionType;
  target: 'database' | 'page_layout' | 'page_meta';
  target_id?: string; // 대상 DB명 또는 블록 식별자
  changes: PatchChanges;
  updated_template: NotionTemplate;
  explanation: string;
}

export type GeminiConversationResponse = 
  | { mode: 'CREATE_NEW'; template: NotionTemplate; explanation: string }
  | PatchActionResponse
  | { mode: 'CONVERSATION_GUIDE'; explanation: string };

// 실시간 하이라이트 추적 상태
export interface RecentModifications {
  propertyNames: string[];
  blockContents: string[];
  timestamp: number;
}
