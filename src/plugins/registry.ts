// src/plugins/registry.ts
// AI 플러그인 중앙 레지스트리 (동적 등록, 해제, 라우팅 관리)

import type { IAIPlugin, AIPluginRequest, AIPluginResponse, PluginCapability } from './types';
import { safeExecutePlugin } from './errorIsolation';

export class AIPluginRegistry {
  private plugins = new Map<string, IAIPlugin>();
  private defaultPluginId = 'gemini';

  /** 새 AI 플러그인 등록 */
  register(plugin: IAIPlugin): void {
    this.plugins.set(plugin.id, plugin);
    console.log(`[PluginRegistry] 플러그인 등록 완료: ${plugin.name} (${plugin.id})`);
  }

  /** AI 플러그인 제거 */
  unregister(pluginId: string): boolean {
    const deleted = this.plugins.delete(pluginId);
    if (deleted) {
      console.log(`[PluginRegistry] 플러그인 제거 완료: ${pluginId}`);
    }
    return deleted;
  }

  /** 특정 플러그인 조회 */
  get(pluginId: string): IAIPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /** 등록된 모든 플러그인 목록 조회 */
  getAll(): IAIPlugin[] {
    return Array.from(this.plugins.values());
  }

  /** 특정 역량(Capability)을 지원하는 플러그인 검색 */
  findByCapability(cap: PluginCapability): IAIPlugin[] {
    return this.getAll().filter(p => p.capabilities.includes(cap));
  }

  /** 기본 플러그인 ID 지정 */
  setDefaultPlugin(pluginId: string): void {
    if (this.plugins.has(pluginId)) {
      this.defaultPluginId = pluginId;
    }
  }

  /** 플러그인 안전 실행 */
  async execute(request: AIPluginRequest, targetPluginId?: string): Promise<AIPluginResponse> {
    const targetId = targetPluginId || this.defaultPluginId;
    const plugin = this.get(targetId);

    if (!plugin) {
      return {
        success: false,
        pluginId: targetId,
        errorMessage: `플러그인 '${targetId}'을(를) 찾을 수 없습니다.`,
      };
    }

    return safeExecutePlugin(plugin, request);
  }
}

export const pluginRegistry = new AIPluginRegistry();
