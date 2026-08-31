/**
 * ELN 工具定义与结果类型（移植自 eln-mcp）
 */

import { z } from 'zod';

/** 工具处理器 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

/** 工具执行结果 */
export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

/** 单个 ELN 工具定义 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: ToolHandler;
}

/** 构造纯文本结果 */
export function textResult(text: string, isError = false): ToolResult {
  return { content: [{ type: 'text', text }], isError };
}

/** 构造 JSON 格式化结果 */
export function jsonResult(data: unknown, isError = false): ToolResult {
  return textResult(JSON.stringify(data, null, 2), isError);
}

/** 构造错误结果 */
export function errorResult(message: string): ToolResult {
  return textResult(`错误: ${message}`, true);
}
