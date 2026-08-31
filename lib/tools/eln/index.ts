/**
 * ELN 内置 Agent 工具注册表
 */

import type { AgentTool } from '@earendil-works/pi-agent-core';
import { collectElnToolDefinitions } from '@/lib/eln/tools/registry';
import { elnCheckAuthTool, elnSyncAuthTool } from './auth-tools';
import { createElnAgentTool } from './eln-tool';

/** 为指定对话创建全部 ELN Agent 工具（含认证工具） */
export function createSessionElnTools(sessionId: string): AgentTool<any>[] {
  const defs = collectElnToolDefinitions(sessionId);
  return [
    elnCheckAuthTool,
    elnSyncAuthTool,
    ...defs.map(createElnAgentTool),
  ];
}
