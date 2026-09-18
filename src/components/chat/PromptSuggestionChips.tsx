import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Wrench } from 'lucide-react';

interface Suggestion {
  icon: string;
  label: string;
  prompt: string;
  presetKey?: string;
}

const CREATION_SUGGESTIONS: Suggestion[] = [
  {
    icon: '🎓',
    label: '대학생 시험 및 과제 관리',
    prompt: '대학생용 시험 일정 및 과제 관리 템플릿 만들어줘. 과제 마감일과 D-Day 수식, 과목 목록과의 관계형 DB를 포함해줘.',
    presetKey: 'college_student'
  },
  {
    icon: '🚀',
    label: '스타트업 2주 스프린트',
    prompt: '스타트업 개발팀을 위한 2주 단위 스프린트 및 제품 로드맵 템플릿 만들어줘. 태스크 상태와 진행률 수식이 필요해.',
    presetKey: 'startup_sprint'
  },
  {
    icon: '🌱',
    label: '데일리 습관 & 라이프 루틴',
    prompt: '매일 아침/저녁 습관 달성률을 체크하는 올인원 라이프 루틴 트래커 템플릿 만들어줘.',
    presetKey: 'life_tracker'
  },
  {
    icon: '💼',
    label: '프리랜서 외주 프로젝트 관리',
    prompt: '프리랜서 디자이너/개발자를 위한 클라이언트 견적, 계약 일정, 대금 지급 현황 관리 템플릿 만들어줘.'
  }
];

// 3단계 부분 수정 및 확장 1단계 다이어트/Formula 2.0 추천 칩
const PATCH_SUGGESTIONS: Suggestion[] = [
  {
    icon: '⚡',
    label: '템플릿 다이어트(미니멀화)',
    prompt: '이 템플릿 너무 복잡해, 매일 가볍게 쓸 수 있도록 핵심 1개 DB(오늘 할 일/일정)와 빠른 메모 블록만 남기고 깔끔하게 다이어트 리모델링해줘.'
  },
  {
    icon: '📊',
    label: 'Formula 2.0 진행률 게이지',
    prompt: '데이터베이스에 상태에 따라 유니코드 바("■■■□□ 60%")를 자동 출력하는 Formula 2.0 진행률 수식 속성 추가해줘.'
  },
  {
    icon: '⏳',
    label: 'Formula 2.0 D-Day 계산기',
    prompt: '데이터베이스에 오늘 기준 "D-3", "D-Day 🔥", "기한 초과 ⚠️"를 자동 계산하는 최신 Formula 2.0 수식 추가해줘.'
  },
  {
    icon: '🔥',
    label: '우선순위 속성 추가',
    prompt: '데이터베이스에 "우선순위(🔥 긴급, ⭐ 보통, ☕ 여유)" 선택 속성 추가해줘.'
  },
  {
    icon: '✅',
    label: '주간 실천 체크리스트 추가',
    prompt: '페이지에 "📌 이번 주 핵심 실천 체크리스트" 콜아웃 및 To-Do 블록 추가해줘.'
  }
];

export const PromptSuggestionChips: React.FC<{ onSelect: (prompt: string) => void }> = ({ onSelect }) => {
  const { applyPreset, isGenerating, currentTemplate } = useApp();
  const [chipTab, setChipTab] = useState<'patch' | 'create'>(currentTemplate ? 'patch' : 'create');

  const handleClick = (s: Suggestion) => {
    if (isGenerating) return;
    if (s.presetKey) {
      applyPreset(s.presetKey);
    } else {
      onSelect(s.prompt);
    }
  };

  const activeList = chipTab === 'patch' ? PATCH_SUGGESTIONS : CREATION_SUGGESTIONS;

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center space-x-1.5 text-neutral-500 dark:text-neutral-400 font-medium">
          {chipTab === 'patch' ? (
            <Wrench className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{chipTab === 'patch' ? '3단계 대화형 부분 수정 예시:' : '신규 템플릿 프롬프트:'}</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-md text-[11px]">
          <button
            type="button"
            onClick={() => setChipTab('patch')}
            className={`px-2 py-0.5 rounded transition ${
              chipTab === 'patch' 
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            부분 수정
          </button>
          <button
            type="button"
            onClick={() => setChipTab('create')}
            className={`px-2 py-0.5 rounded transition ${
              chipTab === 'create' 
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            신규 생성
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {activeList.map((s, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isGenerating}
            onClick={() => handleClick(s)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 transition disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <span>{s.icon}</span>
            <span className="group-hover:text-neutral-900 dark:group-hover:text-white font-medium">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
