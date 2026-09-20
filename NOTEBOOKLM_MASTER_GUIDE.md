# Notion Architect AI Master Workspace v2.0 - NotebookLM 시스템 마스터 분석 가이드

본 문서는 **Notion Architect AI Master Workspace v2.0** 전 영역의 아키텍처, 4대 핵심 챕터, 데일리 루틴 콕핏, 자정 자동 롤백 엔진, Zero-Rot 자산 아카이빙 파이프라인, 노션 5대 마스터 DB 원클릭 구축 스키마 및 AI 오케스트레이션 로직을 빠짐없이 집약한 **NotebookLM 최적화 지식 베이스(Knowledge Base)** 문서입니다.

---

## 📌 1. 시스템 아키텍처 & 글로벌 레이아웃 (System Overview & Architecture)

### 1.1 기술 스택 (Technology Stack)
- **Core & UI Framework**: Vite / React 18, TypeScript, TailwindCSS, Lucide Icons.
- **AI Engines**: Google Gemini 3.6 Flash (기본 권장), Gemini 3.8 Flash, Gemini 2.0 / 1.5 시리즈.
- **Client Storage & Cache**: 
  - **IndexedDB (`MediaLabDB`)**: 1계층 대용량 미디어 에셋(Base64/Blob 이미지·영상·오디오) 캐시 스토리지.
  - **localStorage**: 마스터 루틴 룰, 1일 오버라이드 캐시, QuickCapture 기록, 오피스 지식 소스 서랍 스토리지, 노션 5대 마스터 DB 연동 키.
- **Integration Bridge**: Notion API 2.0 (원격 5대 마스터 데이터베이스 자동 생성 및 페이지 배포 커넥터).

### 1.2 글로벌 뷰 모드 및 레이아웃 통제 (`AppContext.tsx` & `App.tsx`)
- `currentView` 상태값에 따라 전체 애플리케이션 화면이 동적으로 스위칭됩니다:
  1. `home`: 메인 홈 대시보드 (4대 챕터 퀵 런처 & 24시간 데일리 루틴 관제 콕핏).
  2. `builder`: 제1챕터 템플릿 마스터 (서브 스위처: `🔨 템플릿 빌더` ↔ `🗂️ 템플릿 보관함`).
  3. `life`: 제2챕터 라이프 Hub (일정 캘린더, 이메일 요약, 가계부 지출, 데일리 루틴 관리).
  4. `devlab`: 제3챕터 AI 오피스 스튜디오 (스마트 Docs, Sheets, Slides 라이브 렌더러 & NotebookLM Source Vault 서랍).
  5. `media_lab`: 제4챕터 AI 미디어 랩 (이미지 스튜디오, 씬 타임라인 영상 스튜디오, 4대 오디오 믹서, 미디어 보관함 Drawer).
  6. `dashboard`: 템플릿 보관함 호환 뷰.
  7. `quick_capture`: 1초 퀵 캡처 허브 뷰.

### 1.3 최상단 글로벌 내비게이션 바 (`Navbar.tsx`)
- **[좌측] Notion Architect 로고**: 클릭 시 메인 홈 대시보드 (`setCurrentView('home')`)로 즉시 이동.
- **[중앙] 4대 챕터 메인 탭**:
  - `[🏗️ 템플릿 마스터]` (`builder`)
  - `[🌱 라이프 Hub]` (`life`)
  - `[📄 오피스 스튜디오]` (`devlab`)
  - `[🎨 AI 미디어 랩]` (`media_lab`)
- **[우측] 퀵 유틸리티 바**:
  - `[👑 통합 허브]` 버튼: 내 노션 마스터 워크스페이스 새 탭 열기 (마스터 허브 구축 페이지 직행).
  - `[⏰ 루틴 브리핑]` 버튼: 오늘 데일리 루틴 브리핑 자동 발동 및 라이프 Hub 연결.
  - Gemini 모델 셀렉터 (`Gemini 3.6 Flash`, `3.8 Flash` 등 선택).
  - `[⚙️ 설정]` 버튼: 노션 5대 마스터 DB 원클릭 구축, Notion API 키 등록, Google Calendar 싱크 및 쉬운 사용설명서 모달 호출.
  - 프로필 아바타: 사용자 프로필 관리 및 로그아웃.

---

## 🚀 2. 메인 홈 캔버스 & 24시간 데일리 루틴 관제 콕핏 (Home & Midnight Rollback Engine)

### 2.1 4대 핵심 챕터 퀵 런처 그리드 (`src/app/page.tsx`)
- Slate-50 배경, Slate-200 테두리, `hover:shadow-md` 규격의 4개 카드 그리드 배치:
  1. `[🏗️ 템플릿 마스터]`: AI 대화형 템플릿 자동 생성, 수식/DB 설계 & 보관함 서브 스위처.
  2. `[🌱 라이프 Hub]`: 캘린더 동기화, 이메일 브리핑, 지출 가계부 및 데일리 투두 관리.
  3. `[📄 오피스 스튜디오]`: Docs/Sheets/Slides 라이브 렌더링, 잼스형 표준 양식 & NotebookLM RAG 지식 소스.
  4. `[🎨 AI 미디어 랩]`: 멀티스타일 이미지 생성, 씬 타임라인 영상 스튜디오, 4대 오디오 믹서.

### 2.2 24시간 데일리 루틴 관제 콕핏 (`DailyRoutineCockpit.tsx`)
- **3대 타임라인 타일**:
  1. ☀️ `[08:00 출근길 오디오 브리프]`: 메일 요약 ➔ 테크 뉴스 ➔ 맞춤 음원 스트리밍 (원클릭 재생 & Zero-Rot 자동 보관).
  2. ☕ `[12:30 미드데이 체크]`: 오전 투두 달성률 & 점심 가계부 체크 (라이프 점검 이동 & Zero-Rot 동기화).
  3. 🌙 `[23:00 취침 전 듀얼 AI 팟캐스트]`: AI 모델/비즈니스 아이디어 2인 음성 토론 대본 (대본 생성 & Zero-Rot 지식 서랍 적재).
- **듀얼 설정 모달**:
  - `[⚙️ 마스터 고정 룰 모달]`: 출퇴근 시각, 관심 키워드, 선호 오디오 장르 영구 저장 (`MasterRoutineConfig`).
  - `[⚡ 오늘 1일 설정 모달]`: 당일 시각 임시 변경, 단일/전체 건너뛰기, `[🔄 마스터 룰로 복귀]` 지원 (`TodayOverrideConfig`).

### 2.3 자정 자동 롤백 엔진 (Midnight Rollback Engine - `dailyRoutineStorage.ts`)
- **작동 원리**:
  - `TodayOverrideConfig` 저장 시 당일 날짜(`YYYY-MM-DD`)를 함께 기록.
  - 앱 접속 및 로드 시 저장된 날짜와 브라우저 당일 날짜를 비교.
  - 브라우저 날짜 기준 자정(00:00)이 넘어가면 `TodayOverrideConfig`를 자동으로 파기(Purge) 및 초기화.
  - 다음 날 아침 100% 영구 `MasterRoutineConfig`로 자동 복구.
  - 콕핏 상단에 *"오늘 변경 사항은 자정(00:00)에 마스터 룰로 자동 복구됩니다"* 안내 뱃지 실시간 노출.

---

## 🏗️ 3. 제1챕터: 템플릿 마스터 (Template Master - `src/app/builder/page.tsx`)

### 3.1 서브 스위처 (`[🔨 템플릿 빌더 | 🗂️ 템플릿 보관함]`)
- 제1챕터 상단 서브 헤더 바에서 1클릭으로 빌더 작업실과 보관함을 전환합니다.

### 3.2 🔨 템플릿 빌더 (`SplitLayout.tsx`)
- **AI 대화형 프롬프트 엔진**: 사용자의 자연어 지시("스타트업 프로젝트 관리 템플릿 만들어줘") 수신 시 JSON 템플릿 스키마 자동 파싱.
- **SplitLayout 2분할 뷰어**: 좌측 AI Chat Control Bar ↔ 우측 Notion 반응형 라이브 프리뷰 캔버스.
- **Formula 2.0 & DB 연동**: 데이터베이스 속성(Property), 롤업(Rollup), 수식(Formula 2.0) 및 관점 뷰(Kanban, Table, Calendar) 자동 조립.
- **멀티포맷 역설계**: 엑셀(.xlsx), PDF, 이미지 영수증 업로드 시 구조 파악 후 노션 템플릿으로 역설계.
- **노션 원클릭 배포**: 노션 API 2.0 파이프라인으로 실제 노션 워크스페이스에 부모 페이지/데이터베이스 직접 배포.

### 3.3 🗂️ 템플릿 보관함 (`DashboardView.tsx`)
- **TOP 50 추천 캐러셀**: 분야별(업무, 개인, 학업, 자격증 수험생 등) 대표 템플릿 50종 둘러보기 및 원클릭 복제.
- **스마트 사서 & 폴더링**: 생성 및 수집된 템플릿을 폴더별 아카이빙하고 AI 사서 Q&A 지원.

---

## 👔 4. 제2챕터: 라이프 비서 (Life Hub - `src/app/life/page.tsx`)

### 4.1 📅 스마트 캘린더 & 일정 연기 (`ScheduleView.tsx` / `ScheduleDrawer.tsx`)
- **Google / Notion 캘린더 동기화**: 노션 캘린더 DB와 실시간 데이터 연동.
- **스마트 일정 이동 (RESCHEDULE)**: "9월 21일 연가 28일로 연기해줘" 자연어 인식 시 21일 일정 자동 이동 및 28일 업데이트 (중복 일정 자동 정제).

### 4.2 ✉️ 스마트 이메일 브리핑 (`EmailManagerView.tsx` / `aiEmailReply.ts`)
- 긴급/중요 이메일 AI 핵심 요약 및 답장 초안 자동 작성.
- 이메일 액션 아이템 클릭 시 노션 일정/할 일 DB로 즉시 전송.

### 4.3 💰 가계부 & 이상 지출 AI 감지 (`ExpenseAnalyticsView.tsx` / `aiExpenseAnomaly.ts`)
- 일별/월별 소비 지출 자동 분류 시각화 차트.
- 평균 소비 패턴 대비 급격한 지출 증가 시 "⚠️ 식비 이상 지출 경보" 피드백 자동 발동.

### 4.4 ⚡ 데일리 투두 & AI 작업 분해 (`TodoManagerView.tsx` / `aiTaskBreakdown.ts`)
- 데일리 우선순위 할 일 관리.
- 대형 프로젝트("앱 론칭 준비") 입력 시 5단계 세부 투두 세부 분해 가이드 자동 생성.

---

## 📄 5. 제3챕터: AI 오피스 스튜디오 (Office Studio - `src/app/devlab/page.tsx`)

### 5.1 3대 전문 비즈니스 문서 라이브 렌더러
1. **📄 스마트 독스 (Docs - `SmartDocsRenderer.tsx`)**:
   - Napkin AI 벤치마크. A4 비율 백색 문서 카드 뷰.
   - 개조식 글머리 기호(Bullet points), 3단 비교표, 프로세스 화살표 다이어그램 시각화 카드.
   - 팩트 출처 인용 각주 뱃지(`[1]`, `[2]`) 자동 부착.
2. **📊 스마트 시트 (Sheets - `SmartSheetsRenderer.tsx`)**:
   - Rows 벤치마크. 행 번호(1~N), 열 알파벳(A~F) 테이블 그리드.
   - 셀 직접 더블클릭 편집 및 실제 계산 연산 엔진 탑재 (`=SUM(C2:C10)`, `=AVERAGE(D2:D5)` 입력 시 실시간 연산 출력).
   - 숫자 천 단위 콤마(,) 및 통화(₩) 포맷팅.
3. **📑 스마트 슬라이드 (Slides - `SmartSlidesRenderer.tsx`)**:
   - Gamma 벤치마크. 16:9 슬라이드 덱 카드 모듈.
   - 목차 ➔ 문제점 ➔ 솔루션 ➔ 실행 로드맵 ➔ 예산 5~7장 슬라이드 카드 자동 렌더링.

### 5.2 듀얼 생성 엔진
- **모드 A: Genspark형 자유 기획 모드 (`CREATIVE`)**: 자연어 지시 수신 시 문서 구조 및 다이어그램 자율 조립.
- **모드 B: Gems형 사내 표준 규격 양식 모드 (`FIXED_FORM`)**:
  - ① [지출결의서]: 일자, 부서, 적요, 공급가액, 부가세, 합계(=SUM) 틀 100% 고정.
  - ② [기획품의서]: 제안 목적, 추진 배경, 소요 예산, 기대 효과 틀 고정.
  - ③ [주간업무보고]: 금주 실적, 차주 계획, 이슈 사항 틀 고정.

### 5.3 NotebookLM 지식 소스 서랍 (`NotebookLMDrawer.tsx`)
- PDF, DOCX, 웹 링크, 이메일 요약, 데일리 루틴 텍스트 소스 등록.
- 체크박스(☑️) 타겟팅: 선택된 소스에 한해서만 근거 문서 생성 RAG 제한.
- 팩트 출처 인용 각주 뱃지(`[1]`, `[2]`) 클릭 시 해당 원천 소스로 자동 스크롤 및 하이라이팅.

---

## 🎨 6. 제4챕터: AI 미디어 랩 (Media Lab - `src/components/media/MediaLabView.tsx`)

### 6.1 🎨 이미지 스튜디오 (`ImageStudioView.tsx`)
- 멀티스타일 (시네마틱 실사, 3D render, 애니메이션, 수묵화 등) 및 prompt enhancement.
- 생성된 고화질 이미지 클릭 시 `[🎬 이 이미지로 영상 만들기]` 원클릭 비디오 앵커 전송.

### 6.2 🎬 영상 스튜디오 (`VideoStudioView.tsx`)
- Image-to-Video (첫 프레임 앵커 자동 장착) & Text-to-Video 지원.
- 5대 카메라 무빙 프리셋: `[줌인/줌아웃]`, `[좌우 패닝]`, `[상하 틸트]`, `[360도 회전]`, `[드론 상승 샷]`.
- 16:9 및 9:16 종횡비 모던 비디오 플레이어 & 하단 씬 타임라인 시퀀서.

### 6.3 🎵 오디오 스튜디오 (`AudioStudioView.tsx`)
- 4대 오디오 프리셋: `[취미/보컬]`, `[슬라이드/발표]`, `[워크/포커스]`, `[영상 사운드트랙]`.
- 재생/일시정지 시 동적 파형 비주얼라이저 캔버스, 볼륨 및 루프 재생.
- 영상 동기화 최종 믹싱 패널.

### 6.4 🗂️ 우측 미디어 자산 보관함 서랍 (`MediaVaultDrawer.tsx`)
- Slide-over Drawer UI. IndexedDB 1계층 대용량 캐시 저장소.
- 탭 필터: `[전체 | 🎨 이미지 | 🎬 영상 | 🎵 음원]`.
- `[🔄 동일 조건으로 다시 만들기]`: 당시 프롬프트/화풍 캔버스 복원.
- 크로스 챕터 전송 브릿지:
  - `[⚡ 1챕터 노션 커버로 전송]`
  - `[📄 3챕터 슬라이드 장표에 삽입]`
  - `[📅 2챕터 콘텐츠 업로드 마감 일정으로 등록]`
  - `[⬇️ 원본 무손실 다운로드 (PNG/MP4/MP3)]`.

---

## 🔄 7. 목적지 직행(Zero-Rot) 자동 분류 적재 파이프라인 (`zeroRotArchiver.ts`)

루틴 실행 및 옴니 챗에서 발생한 산출물은 생성 순간 지정된 전용 보관함과 노션 DB로 부패(Rot) 없이 즉시 분류 적재됩니다:

1. **🎵 오디오/음악 산출물** (출근 오디오 브리프 등):
   - ➔ 제4챕터 [🎨 AI 미디어 랩] IndexedDB 보관함 (음원 탭) 저장.
   - ➔ 노션 `[DB 6: 미디어 에셋 DB]` 원격 자동 동기화.
   - 태그: `[📅 데일리 루틴 생성물]`.
2. **📄 텍스트/뉴스/토론 산출물** (테크 뉴스, 취침 AI 토론 대본 등):
   - ➔ 제3챕터 [📄 오피스 스튜디오] NotebookLM 지식 소스 서랍 (`OFFICE_SOURCES`) 적재.
   - ➔ 노션 `[DB 5: 오피스 문서 DB]` 원격 자동 적재.
   - 태그: `[📅 데일리 루틴 생성물]`.
3. **📅 일정/할일/가계부 산출물** (메일 액션 아이템, 데일리 지출 등):
   - ➔ 제2챕터 [👔 라이프 비서] 스토리지(`QuickCaptureRecord`) 즉시 반영.
   - ➔ 노션 `[DB 1: 캘린더 DB / DB 2: 할 일 DB / DB 3: 가계부 DB]` 원격 동기화.
   - 태그: `[📅 데일리 루틴 생성물]`.

---

## 🗄️ 8. 노션 6대 데이터베이스 스키마 구조 (Notion DB 1~6 Schema)

| DB 번호 | 데이터베이스 명칭 | 주요 속성 (Properties) | 연결 챕터 |
|---|---|---|---|
| **DB 1** | **일정 / 캘린더 DB** | `제목` (Title), `일정` (Date), `분류` (Select), `상태` (Status: 미완료/완료), `태그` (Multi-select) | 제2챕터 라이프 비서 |
| **DB 2** | **할 일 / 투두 DB** | `작업명` (Title), `마감일` (Date), `우선순위` (Select: High/Med/Low), `상태` (Checkbox), `태그` | 제2챕터 라이프 비서 |
| **DB 3** | **가계부 / 지출 DB** | `적요` (Title), `날짜` (Date), `금액` (Number), `카테고리` (Select: 식비/교통/문화 등), `결제수단` | 제2챕터 라이프 비서 |
| **DB 4** | **템플릿 마스터 DB** | `템플릿명` (Title), `분야` (Select), `Formula 수식` (Text), `설명` (RichText), `노션 URL` (Url) | 제1챕터 템플릿 마스터 |
| **DB 5** | **오피스 문서 DB** | `문서명` (Title), `양식유형` (Select: CREATIVE/FIXED_FORM), `본문 HTML/Markdown`, `인용 소스` | 제3챕터 오피스 스튜디오 |
| **DB 6** | **미디어 에셋 DB** | `에셋명` (Title), `유형` (Select: IMAGE/VIDEO/AUDIO), `프롬프트` (Text), `파일 URL` (Url/File) | 제4챕터 AI 미디어 랩 |

---

## 💬 9. 전역 옴니 챗 마스터 인터랙션 바 (`OmniChatBar.tsx`)

- **전역 하단 고정 바**: 모든 페이지 최하단에 항상 위치하여 자연어 텍스트 및 STT 음성 입력("오늘 출근 30분 늦춰줘", "출근 오디오 브리프 들려줘")을 수신.
- **실시간 작업 중 로딩 피드백**: 요청 처리 중 오렌지색 회전 스피너(`Loader2 animate-spin`), `"🧠 Gemini가 요청을 분석하고 화면을 업데이트하고 있습니다..."` placeholder 및 입력 잠금 처리.
- **실행 영수증 카드 (Action Receipt Card)**: 처리 완료 시 `🏗️ 템플릿 스키마 투영`, `📅 라이프 DB 업데이트`, `💻 개발 랩 아카이브` 카드를 채팅 뷰에 직관적으로 출력.
- **SelfDiagnosticCard**: 개발 랩 트러블슈팅 및 장애 감지 시 3단계 원인 분석 및 해결책 자동 출력.

---

## 📝 10. 요약 가이드 활용법 (For NotebookLM & AI Assistants)

본 마스터 문서를 NotebookLM 또는 AI 컴패니언에 업로드하면 다음과 같은 질문에 완벽히 응답할 수 있습니다:
- *"Notion Architect의 4대 챕터 구성과 각 챕터별 주요 기능은 무엇인가요?"*
- *"24시간 데일리 루틴 콕핏에서 자정 자동 롤백 엔진은 어떻게 작동하나요?"*
- *"출근길 오디오 브리프 생성 시 산출물은 어느 챕터와 노션 DB로 자동 적재되나요?"*
- *"제3챕터 오피스 스튜디오의 Docs, Sheets, Slides 렌더러 특징과 NotebookLM 지식 소스 연동 방식은 무엇인가요?"*
- *"노션 6대 데이터베이스 스키마 구성과 각 DB별 연결 속성은 무엇인가요?"*
