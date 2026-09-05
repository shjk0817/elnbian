/**
 * 将 LIMIS ToolDefinition 转为 AgentTool
 */

import type { TSchema } from 'typebox';
import type { AgentTool, AgentToolResult } from '@earendil-works/pi-agent-core';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { assertToolAllowed } from '@/lib/lims/guards/safety';
import type { ToolDefinition, ToolResult } from '@/lib/lims/tools/types';

/** 工具结果转 Agent 结果 */
function toAgentResult(result: ToolResult): AgentToolResult<Record<string, unknown>> {
  const text = result.content.map((c) => c.text).join('\n');
  if (result.isError) throw new Error(text || 'LIMIS 工具执行失败');
  return { content: [{ type: 'text', text }], details: {} };
}

/** 由定义生成 lims__ Agent 工具 */
export function createLimsAgentTool(def: ToolDefinition): AgentTool<TSchema> {
  const parameters = (zodToJsonSchema as (s: unknown) => Record<string, unknown>)(
    def.inputSchema,
  ) as unknown as TSchema;

  return {
    name: `lims__${def.name}`,
    label: `LIMIS / ${def.name}`,
    description: `[LIMIS] ${def.description}`,
    parameters,
    async execute(_id, params, signal): Promise<AgentToolResult<Record<string, unknown>>> {
      signal?.throwIfAborted();
      await assertToolAllowed(def.name);
      const validated = def.inputSchema.parse(params ?? {});
      const result = await def.handler(validated as Record<string, unknown>);
      return toAgentResult(result);
    },
  };
}
