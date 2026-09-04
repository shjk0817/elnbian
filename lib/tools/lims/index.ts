/**
 * LIMIS 内置 Agent 工具注册
 */

import type { AgentTool } from '@earendil-works/pi-agent-core';
import { collectLimsToolDefinitions } from '@/lib/lims/tools/registry';
import { limsCheckAuthTool, limsSyncAuthTool } from './auth-tools';
import { createLimsAgentTool } from './lims-tool';

/** 创建会话 LIMIS 工具（含认证） */
export function createSessionLimsTools(sessionId: string): AgentTool<any>[] {
  const defs = collectLimsToolDefinitions(sessionId);
  return [limsCheckAuthTool, limsSyncAuthTool, ...defs.map(createLimsAgentTool)];
}
