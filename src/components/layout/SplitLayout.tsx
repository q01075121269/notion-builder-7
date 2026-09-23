import React from 'react';
import { useApp } from '../../context/AppContext';
import { TemplatePreviewCanvas } from '../TemplatePreviewCanvas';
import { PRESET_TEMPLATES } from '../../services/presetTemplates';

/**
 * [제1챕터 템플릿 마스터 빌더 작업실]
 * 1열 불필요한 TOP 10 큐레이션 사이드바를 영구 제거하고,
 * 온전한 2단(좌측 에이전트 3.0 패널 ↔ 우측 메인 캔버스) 리사이저블 분할 레이아웃으로 직결.
 */
export const SplitLayout: React.FC = () => {
  const { currentTemplate } = useApp();

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden relative">
      <TemplatePreviewCanvas template={currentTemplate || PRESET_TEMPLATES.college_student} />
    </div>
  );
};

export default SplitLayout;
