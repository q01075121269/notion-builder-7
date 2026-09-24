// src/components/life/AreasOfResponsibilityCard.tsx
// PARA 지속 책임 영역 (Areas of Responsibility) 4대 미니 벤토 카드

import React from 'react';
import { 
  Briefcase, 
  Coins, 
  HeartPulse, 
  Home, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

import type { ProjectArea } from '../../types/lifeHub';

interface AreaConfig {
  id: ProjectArea;
  label: string;
  icon: React.ReactNode;
  activeCountText: string;
  kpiHighlight: string;
  subText: string;
  badgeColor: string;
  ringColor: string;
}

const AREAS_CONFIG: AreaConfig[] = [
  {
    id: '커리어',
    label: '💼 커리어 / 사업',
    icon: <Briefcase className="w-3.5 h-3.5 text-blue-500" />,
    activeCountText: '활성 프로젝트 2개',
    kpiHighlight: 'Q3 플래그십 80%',
    subText: '런칭 발표자료 최종 검수 진행 중',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60',
    ringColor: 'hover:border-blue-400'
  },
  {
    id: '재테크',
    label: '💰 자산 / 재테크',
    icon: <Coins className="w-3.5 h-3.5 text-emerald-500" />,
    activeCountText: '월 예산 55% 소진',
    kpiHighlight: '배당 ETF 분기 리밸런싱',
    subText: '정기 공과금 및 세무 서류 취합 완료',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
    ringColor: 'hover:border-emerald-400'
  },
  {
    id: '건강',
    label: '🏥 건강 / 운동',
    icon: <HeartPulse className="w-3.5 h-3.5 text-rose-500" />,
    activeCountText: '주 4회 운동 달성',
    kpiHighlight: '스트릭 🔥 14일 연속',
    subText: '하프 마라톤 완주 심폐지구력 훈련',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60',
    ringColor: 'hover:border-rose-400'
  },
  {
    id: '라이프',
    label: '🏡 가족 / 라이프',
    icon: <Home className="w-3.5 h-3.5 text-purple-500" />,
    activeCountText: '독서 모임 D-8',
    kpiHighlight: '2026 프롬프트 세미나',
    subText: '부모님 생신 예약 및 선물 준비',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60',
    ringColor: 'hover:border-purple-400'
  }
];

interface AreasOfResponsibilityCardProps {
  onSelectArea?: (area: ProjectArea) => void;
}

export const AreasOfResponsibilityCard: React.FC<AreasOfResponsibilityCardProps> = ({ onSelectArea }) => {
  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              🌿 4대 책임 영역 (Areas)
            </h3>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          지속 관리 영역
        </span>
      </div>


      {/* 4대 벤토 카드 그리드 (2x2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {AREAS_CONFIG.map((area) => (
          <div
            key={area.id}
            onClick={() => onSelectArea?.(area.id)}
            className={`group p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 transition-all cursor-pointer ${area.ringColor} hover:shadow-xs`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {area.label}
              </span>
              <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition shrink-0" />
            </div>

            <div className="mb-1.5">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${area.badgeColor}`}>
                {area.activeCountText}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {area.kpiHighlight}
            </div>

            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {area.subText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
