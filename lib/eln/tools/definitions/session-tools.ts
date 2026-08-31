/**
 * 会话状态查询工具
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, jsonResult, errorResult } from '../types';
import { getSession } from '@/lib/eln/session-state';
import { listComponents } from '@/lib/eln/schema/component-builder';

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Session 工具集 */
export function createSessionTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'get_session',
    description: '查看当前编辑会话：模板 ID、版本 ID、组件数、公式数等。设计前/保存前用于确认状态。',
    inputSchema: z.object({}),
    handler: async () => {
      const s = getSession(sessionId);
      if (!s.templateId) return textResult('当前无选中模板。请先 create_template 或 select_template。');
      const schema = s.formSchema?.schema as Record<string, unknown> | undefined;
      const components = schema ? listComponents(schema).length : 0;
      return jsonResult({
        templateId: s.templateId,
        versionId: s.versionId,
        templateName: s.templateName,
        categoryId: s.categoryId,
        componentCount: components,
        formulaCount: s.extra?.expressionItems.length ?? 0,
        outputItemCount: s.extra?.outputItems.length ?? 0,
        detectionDateItems: s.extra?.detectionDateConfig?.items?.length ?? 0,
        hasTableTemplate: Boolean(s.tableTemplate && Object.keys(s.tableTemplate).length > 0),
        lastAction: s.lastAction,
      });
    },
  },
];
}