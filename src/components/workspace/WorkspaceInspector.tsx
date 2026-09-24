import React from 'react';
import { InspectorChat, type InspectorChatProps } from './InspectorChat';

/**
 * WorkspaceInspector:
 * 캔버스와 실시간 양방향 바인딩되어 스키마/속성/아이콘 수정을 즉각 반영하는 지능형 인스펙터
 */
export const WorkspaceInspector: React.FC<InspectorChatProps> = (props) => {
  return <InspectorChat {...props} />;
};

export default WorkspaceInspector;
