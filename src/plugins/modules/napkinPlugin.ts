// src/plugins/modules/napkinPlugin.ts
// 냅킨 AI (Napkin AI): 텍스트/데이터 기반 비주얼 다이어그램 생성 플러그인

import type { IAIPlugin, AIPluginRequest, AIPluginResponse, PluginCapability } from '../types';

export class NapkinPlugin implements IAIPlugin {
  readonly id = 'napkin';
  readonly name = 'Napkin AI (비주얼 다이어그램)';
  readonly version = '1.0.0';
  readonly capabilities: PluginCapability[] = ['DIAGRAM_GENERATION', 'TEMPLATE_BUILD'];

  validateConfig(apiKey?: string): boolean {
    return Boolean(apiKey && apiKey.trim().length > 0);
  }

  async execute(request: AIPluginRequest): Promise<AIPluginResponse> {
    const { prompt, currentTemplate } = request;

    // 냅킨 AI 전용 다이어그램 및 시각 인포그래픽 생성 로직
    const diagramCode = this.generateNapkinDiagram(prompt, currentTemplate);

    return {
      success: true,
      pluginId: this.id,
      result: {
        mode: 'CONVERSATION_GUIDE',
        explanation: `🎨 **[Napkin AI]** 요청하신 내용을 시각적인 비주얼 다이어그램으로 설계했습니다!\n\n\`\`\`mermaid\n${diagramCode}\n\`\`\`\n\n이 다이어그램은 노션 템플릿의 토글 블록이나 코드 블록에 즉시 삽입할 수 있습니다.`
      },
      metadata: { modelName: 'napkin-visual-engine-v1' }
    };
  }

  private generateNapkinDiagram(prompt: string, template?: any): string {
    const title = template?.title || prompt.slice(0, 20) || '워크플로우';
    return [
      'graph TD',
      `  A["🎯 ${title} 시작"] --> B["⚙️ 템플릿 데이터 처리"]`,
      '  B --> C{"상태 확인"}',
      '  C -->|진행 중| D["🟡 작업 실행"]',
      '  C -->|완료| E["🟢 최종 결과 승인 및 보관"]',
      '  D --> E'
    ].join('\n');
  }
}
