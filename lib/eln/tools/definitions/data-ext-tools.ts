/**
 * 数据配置 Tab 扩展工具
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, errorResult } from '../types';
import { getSession, addExpression, addOutputItem } from '@/lib/eln/session-state';

const EXPRESSION_FUNCTIONS = [
  'ROUNDING', 'IFERROR', 'AVERAGE', 'IF', 'SUM', 'MAX', 'MIN', 'ABS', 'SQRT', 'POWER',
  'LOG', 'LN', 'EXP', 'MOD', 'INT', 'CEILING', 'FLOOR', 'COUNT', 'STDEV', 'VAR',
  'MEDIAN', 'NOW',
];

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 DataExt 工具集 */
export function createDataExtTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'update_formula',
    description: '按 ID 更新已有公式。',
    inputSchema: z.object({
      id: z.number(),
      title: z.string().optional(),
      expression: z.string().optional(),
      writeFormValue: z.string().optional(),
      variables: z.array(z.object({
        name: z.string(), value: z.string(), type: z.string(),
      })).optional(),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.extra) return errorResult('未选择模板');
      const existing = session.extra.expressionItems.find((e) => e.id === args.id);
      if (!existing) return errorResult(`未找到公式 ${args.id}`);
      addExpression(sessionId, {
        ...existing,
        title: (args.title as string | undefined) ?? existing.title,
        expression: (args.expression as string | undefined) ?? existing.expression,
        writeFormValue: (args.writeFormValue as string | undefined) ?? existing.writeFormValue,
        variables: (args.variables as any[] | undefined) ?? existing.variables,
      });
      return textResult(`公式 ${args.id} 已更新`);
    },
  },
  {
    name: 'update_output_item',
    description: '按 ID 更新输出值 name。',
    inputSchema: z.object({ id: z.number(), name: z.string() }),
    handler: async (args) => {
      addOutputItem(sessionId, { id: args.id as number, name: args.name as string });
      return textResult(`输出值 ${args.id} 已更新`);
    },
  },
  {
    name: 'reorder_formulas',
    description: '按 ID 顺序重排 expressionItems。',
    inputSchema: z.object({ ids: z.array(z.number()) }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.extra) return errorResult('未选择模板');
      const map = new Map(session.extra.expressionItems.map((e) => [e.id, e]));
      const ordered = (args.ids as number[]).map((id) => map.get(id)).filter(Boolean) as typeof session.extra.expressionItems;
      session.extra.expressionItems = ordered;
      return textResult(`已重排 ${ordered.length} 条公式`);
    },
  },
  {
    name: 'list_expression_functions',
    description: '列出 ELN 表达式引擎 22 个内置函数。',
    inputSchema: z.object({}),
    handler: async () => textResult(`内置函数 (${EXPRESSION_FUNCTIONS.length}):\n  ${EXPRESSION_FUNCTIONS.join(', ')}`),
  },
];
}