/**
 * 将 ELN ToolDefinition 转为 Cebian AgentTool
 */

import type { TSchema } from 'typebox';
import type { AgentTool, AgentToolResult } from '@earendil-works/pi-agent-core';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { assertToolAllowed } from '@/lib/eln/guards/safety';
import { ensureSessionLoaded } from '@/lib/eln/session-state';
import type { ToolDefinition, ToolResult } from '@/lib/eln/tools/types';

/** MCP 风格结果 → AgentToolResult；错误时 throw 以触发 isError */
function toAgentResult(result: ToolResult): AgentToolResult<Record<string, unknown>> {
  const text = result.content.map((c) => c.text).join('\n');
  if (result.isError) {
    throw new Error(text || 'ELN 工具执行失败');
  }
  return {
    content: [{ type: 'text', text }],
    details: {},
  };
}

/** 由单个 ToolDefinition 生成 AgentTool */
export function createElnAgentTool(def: ToolDefinition, sessionId?: string): AgentTool<TSchema> {
  const parameters = (zodToJsonSchema as (s: unknown) => Record<string, unknown>)(
    def.inputSchema,
  ) as unknown as TSchema;

  return {
    name: `eln__${def.name}`,
    label: `ELN / ${def.name}`,
    description: `[ELN] ${def.description}`,
    parameters,
    async execute(_toolCallId, params, signal): Promise<AgentToolResult<Record<string, unknown>>> {
      signal?.throwIfAborted();
      if (sessionId) await ensureSessionLoaded(sessionId);
      assertToolAllowed(def.name);
      const validated = def.inputSchema.parse(params ?? {});
      const result = await def.handler(validated as Record<string, unknown>);
      return toAgentResult(result);
    },
  };
}
