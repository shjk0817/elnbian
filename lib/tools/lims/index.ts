/**
 * LIMIS 内置 Agent 工具注册
 */

import type { AgentTool } from '@earendil-works/pi-agent-core';
import { limsSettings } from '@/lib/persistence/storage';
import { collectLimsToolDefinitions } from '@/lib/lims/tools/registry';
import { limsCheckAuthTool, limsSyncAuthTool } from './auth-tools';
import { createLimsAgentTool } from './lims-tool';

/** 创建会话 LIMIS 工具（含认证；写工具受设置开关控制） */
export async function createSessionLimsTools(sessionId: string): Promise<AgentTool<any>[]> {
  const settings = await limsSettings.getValue();
  const defs = collectLimsToolDefinitions(sessionId, settings.allowWriteTools);
  return [limsCheckAuthTool, limsSyncAuthTool, ...defs.map(createLimsAgentTool)];
}
