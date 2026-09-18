import type { NotionTemplate } from '../types/notion';

export const PRESET_TEMPLATES: Record<string, NotionTemplate> = {
  college_student: {
    title: "대학생 학기별 시험 & 과제 관리 올인원",
    icon: "🎓",
    cover_query: "university library aesthetic study desk",
    cover_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
    description: "강의별 과제 제출 마감일, 중간/기말 시험 일정, Formula 2.0 유니코드 진행률 바 및 D-Day 수식 계산이 연동된 대학생 필수 템플릿입니다.",
    databases: [
      {
        name: "과제 및 시험 트래커",
        description: "모든 시험 및 제출 과제의 일정과 마감 상태, 수식을 실시간 관리합니다.",
        view_type: "table",
        properties: [
          { name: "과제/시험명", type: "title" },
          { name: "마감 일정", type: "date" },
          { name: "상태", type: "status", options: ["시작 전", "진행 중", "제출 완료"] },
          { 
            name: "진행률(수식)", 
            type: "formula", 
            expression: `ifs(prop("상태") == "제출 완료", "■■■■■ 100% 🟢", prop("상태") == "진행 중", "■■■□□ 60% 🟡", "□□□□□ 0% ⚪")` 
          },
          { 
            name: "남은 일수(D-Day)", 
            type: "formula", 
            expression: `ifs(empty(prop("마감 일정")), "일정 미정", dateBetween(dateStart(prop("마감 일정")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("마감 일정")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("마감 일정")), now(), "days") + "일")` 
          },
          { name: "중요도", type: "select", options: ["🔥 긴급", "⭐ 보통", "☕ 여유"] },
          { name: "수강 과목", type: "relation", target: "수강 과목 목록" }
        ],
        sample_rows: [
          {
            "과제/시험명": "컴퓨터네트워크 중간고사",
            "마감 일정": "2026-10-22",
            "상태": "진행 중",
            "진행률(수식)": "■■■□□ 60% 🟡",
            "남은 일수(D-Day)": "D-35일",
            "중요도": "🔥 긴급",
            "수강 과목": "컴퓨터네트워크"
          },
          {
            "과제/시험명": "데이터베이스 텀프로젝트 1차 제안서",
            "마감 일정": "2026-10-15",
            "상태": "시작 전",
            "진행률(수식)": "□□□□□ 0% ⚪",
            "남은 일수(D-Day)": "D-28일",
            "중요도": "⭐ 보통",
            "수강 과목": "데이터베이스시스템"
          },
          {
            "과제/시험명": "알고리즘 3주차 실습 과제",
            "마감 일정": "2026-09-25",
            "상태": "제출 완료",
            "진행률(수식)": "■■■■■ 100% 🟢",
            "남은 일수(D-Day)": "제출 완료",
            "중요도": "⭐ 보통",
            "수강 과목": "알고리즘"
          },
          {
            "과제/시험명": "운영체제 프로세스 스케줄링 보고서",
            "마감 일정": "2026-09-30",
            "상태": "진행 중",
            "진행률(수식)": "■■■□□ 60% 🟡",
            "남은 일수(D-Day)": "D-13일",
            "중요도": "🔥 긴급",
            "수강 과목": "운영체제"
          }
        ]
      },
      {
        name: "수강 과목 목록",
        description: "이번 학기 수강하는 과목과 교수님 정보, 강의실을 기록합니다.",
        view_type: "board",
        properties: [
          { name: "과목명", type: "title" },
          { name: "교수님", type: "text" },
          { name: "학점", type: "number" },
          { name: "강의실/시간", type: "text" },
          { name: "구분", type: "select", options: ["전공필수", "전공선택", "교양필수", "일반교양"] }
        ],
        sample_rows: [
          {
            "과목명": "컴퓨터네트워크",
            "교수님": "김민수 교수님",
            "학점": 3,
            "강의실/시간": "공학관 402호 (월/수 10:30)",
            "구분": "전공필수"
          },
          {
            "과목명": "데이터베이스시스템",
            "교수님": "이진우 교수님",
            "학점": 3,
            "강의실/시간": "IT관 301호 (화/목 13:00)",
            "구분": "전공필수"
          },
          {
            "과목명": "알고리즘",
            "교수님": "박서연 교수님",
            "학점": 3,
            "강의실/시간": "공학관 205호 (화/목 15:00)",
            "구분": "전공선택"
          },
          {
            "과목명": "운영체제",
            "교수님": "최호준 교수님",
            "학점": 3,
            "강의실/시간": "공학관 301호 (금 09:00)",
            "구분": "전공필수"
          }
        ]
      }
    ],
    page_layout: [
      {
        type: "callout",
        icon: "💡",
        color: "blue",
        content: "💡 **학기 목표**: 이번 학기 목표 학점 4.2 이상 달성! 모든 과제는 마감 24시간 전 사전 제출을 원칙으로 합니다."
      },
      {
        type: "column_list",
        columns: [
          {
            width: 50,
            blocks: [
              { type: "heading_2", content: "📌 이번 주 핵심 일정" },
              { type: "bulleted_list_item", content: "목요일: 알고리즘 3주차 실습 과제 제출 (제출 완료)" },
              { type: "bulleted_list_item", content: "금요일: 데이터베이스 팀프로젝트 1차 기획 회의" }
            ]
          },
          {
            width: 50,
            blocks: [
              { type: "heading_2", content: "🔗 빠른 링크" },
              { type: "bulleted_list_item", content: "학교 포털 시스템 바로가기" },
              { type: "bulleted_list_item", content: "학사일정 캘린더" }
            ]
          }
        ]
      },
      {
        type: "toggle",
        title: "📚 중간고사 시험 범위 및 참고 자료",
        content: "각 과목별 교재 챕터 및 강의 슬라이드 링크 정리",
        blocks: [
          { type: "paragraph", content: "• 컴퓨터네트워크: Ch 1 ~ Ch 4 (계층 구조, 전송 계층)" },
          { type: "paragraph", content: "• 데이터베이스: Ch 1 ~ Ch 5 (ER 모델, 관계대수, SQL 쿼리)" }
        ]
      }
    ]
  },
  startup_sprint: {
    title: "스타트업 애자일 스프린트 & 제품 로드맵",
    icon: "🚀",
    cover_query: "modern minimal tech startup workspace",
    cover_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    description: "2주 단위 스프린트 업무, 제품 기능 백로그, Formula 2.0 유니코드 진행률 및 D-Day 수식을 시각화하는 협업 템플릿입니다.",
    databases: [
      {
        name: "스프린트 태스크 백로그",
        description: "개발 및 디자인 티켓의 진행 상태와 우선순위, 유니코드 진행률을 관리합니다.",
        view_type: "board",
        properties: [
          { name: "티켓명", type: "title" },
          { name: "스프린트 일정", type: "date" },
          { name: "진행 상태", type: "status", options: ["Backlog", "In Progress", "In Review", "Done"] },
          { 
            name: "진행률(수식)", 
            type: "formula", 
            expression: `ifs(prop("진행 상태") == "Done", "■■■■■ 100% 🟢", prop("진행 상태") == "In Review", "■■■■□ 80% 🔵", prop("진행 상태") == "In Progress", "■■■□□ 60% 🟡", "□□□□□ 0% ⚪")` 
          },
          { 
            name: "남은 일수(D-Day)", 
            type: "formula", 
            expression: `ifs(empty(prop("스프린트 일정")), "미정", dateBetween(dateStart(prop("스프린트 일정")), now(), "days") < 0, "기한 초과 ⚠️", dateBetween(dateStart(prop("스프린트 일정")), now(), "days") == 0, "D-Day 🔥", "D-" + dateBetween(dateStart(prop("스프린트 일정")), now(), "days") + "일")` 
          },
          { name: "우선순위", type: "select", options: ["P0 - 긴급", "P1 - 높음", "P2 - 보통", "P3 - 낮음"] }
        ],
        sample_rows: [
          {
            "티켓명": "OAuth 구글/카카오 로그인 연동",
            "스프린트 일정": "2026-09-20",
            "진행 상태": "In Review",
            "진행률(수식)": "■■■■□ 80% 🔵",
            "남은 일수(D-Day)": "D-3일",
            "우선순위": "P0 - 긴급"
          },
          {
            "티켓명": "대시보드 실시간 분석 차트 UI 구현",
            "스프린트 일정": "2026-09-25",
            "진행 상태": "In Progress",
            "진행률(수식)": "■■■□□ 60% 🟡",
            "남은 일수(D-Day)": "D-8일",
            "우선순위": "P1 - 높음"
          },
          {
            "티켓명": "결제 시스템 PG 연동 및 영수증 메일 발송",
            "스프린트 일정": "2026-09-30",
            "진행 상태": "Backlog",
            "진행률(수식)": "□□□□□ 0% ⚪",
            "남은 일수(D-Day)": "D-13일",
            "우선순위": "P1 - 높음"
          },
          {
            "티켓명": "디자인 시스템 컬러 토큰 및 다크모드 점검",
            "스프린트 일정": "2026-09-18",
            "진행 상태": "Done",
            "진행률(수식)": "■■■■■ 100% 🟢",
            "남은 일수(D-Day)": "완료됨",
            "우선순위": "P2 - 보통"
          }
        ]
      }
    ],
    page_layout: [
      {
        type: "callout",
        icon: "🎯",
        color: "amber",
        content: "🚀 **Sprint 14 목표**: 신규 온보딩 전환율 15% 개선 및 핵심 결제 모듈 MVP 출시!"
      },
      {
        type: "toggle",
        title: "📋 데일리 스크럼 룰 & 회고 가이드",
        blocks: [
          { type: "paragraph", content: "1. 어제 무엇을 달성했나요?" },
          { type: "paragraph", content: "2. 오늘 무엇에 집중할 예정인가요?" },
          { type: "paragraph", content: "3. 진행을 가로막는 병목(Blocker)이 있나요?" }
        ]
      }
    ]
  },
  life_tracker: {
    title: "올인원 라이프 & 습관 루틴 트래커",
    icon: "🌱",
    cover_query: "peaceful morning coffee notebook plant sunlight",
    cover_url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80",
    description: "매일의 모닝/나이트 루틴, 독서 기록, 운동 및 주간 달성률 유니코드 수식을 체계적으로 기록하는 삶 관리 템플릿입니다.",
    databases: [
      {
        name: "데일리 습관 일지",
        description: "매일 아침/저녁 습관의 달성 여부와 유니코드 수식 달성률을 체크합니다.",
        view_type: "table",
        properties: [
          { name: "날짜", type: "title" },
          { name: "기록일", type: "date" },
          { name: "기상 후 물 500ml", type: "checkbox" },
          { name: "스트레칭/운동 30분", type: "checkbox" },
          { name: "독서 20페이지", type: "checkbox" },
          { name: "일기 작성", type: "checkbox" },
          { 
            name: "달성률(수식)", 
            type: "formula", 
            expression: `repeat("■", round((toNumber(prop("기상 후 물 500ml")) + toNumber(prop("스트레칭/운동 30분")) + toNumber(prop("독서 20페이지")) + toNumber(prop("일기 작성"))) / 4 * 5)) + repeat("□", 5 - round((toNumber(prop("기상 후 물 500ml")) + toNumber(prop("스트레칭/운동 30분")) + toNumber(prop("독서 20페이지")) + toNumber(prop("일기 작성"))) / 4 * 5)) + " " + round((toNumber(prop("기상 후 물 500ml")) + toNumber(prop("스트레칭/운동 30분")) + toNumber(prop("독서 20페이지")) + toNumber(prop("일기 작성"))) / 4 * 100) + "%"` 
          }
        ],
        sample_rows: [
          {
            "날짜": "2026-09-17 (목)",
            "기록일": "2026-09-17",
            "기상 후 물 500ml": true,
            "스트레칭/운동 30분": true,
            "독서 20페이지": true,
            "일기 작성": true,
            "달성률(수식)": "■■■■■ 100% 🟢"
          },
          {
            "날짜": "2026-09-16 (수)",
            "기록일": "2026-09-16",
            "기상 후 물 500ml": true,
            "스트레칭/운동 30분": false,
            "독서 20페이지": true,
            "일기 작성": true,
            "달성률(수식)": "■■■■□ 75% 🔵"
          },
          {
            "날짜": "2026-09-15 (화)",
            "기록일": "2026-09-15",
            "기상 후 물 500ml": true,
            "스트레칭/운동 30분": true,
            "독서 20페이지": false,
            "일기 작성": false,
            "달성률(수식)": "■■■□□ 50% 🟡"
          },
          {
            "날짜": "2026-09-14 (월)",
            "기록일": "2026-09-14",
            "기상 후 물 500ml": false,
            "스트레칭/운동 30분": false,
            "독서 20페이지": true,
            "일기 작성": false,
            "달성률(수식)": "■□□□□ 25% ⚪"
          }
        ]
      }
    ],
    page_layout: [
      {
        type: "callout",
        icon: "✨",
        color: "emerald",
        content: "🌿 작은 습관의 반복이 인생의 방향을 바꿉니다. 완벽함보다 꾸준함을 목표로 하세요!"
      }
    ]
  }
};
