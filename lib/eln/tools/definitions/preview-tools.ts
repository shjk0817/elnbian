/**
 * 预览与校验工具
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, errorResult, jsonResult } from '../types';
import { getSession, assertTemplateSelected } from '@/lib/eln/session-state';
import { listComponents as listSchemaComponents } from '@/lib/eln/schema/component-builder';

/** 检查 ArrayFixTable 列名与字段名冲突（会导致预览白屏） */
function findArrayTableIssues(node: Record<string, unknown>, path: string, issues: string[]): void {
  if (!node || typeof node !== 'object') return;
  const comp = node['x-component'] as string | undefined;
  if (comp === 'ArrayFixTable' || comp === 'ArrayTable') {
    if (!node['x-designable-id']) issues.push(`${path}: 缺少 x-designable-id`);
    const props = (node.items as Record<string, unknown>)?.properties as Record<string, Record<string, unknown>> | undefined;
    if (props?.rowTitle) issues.push(`${path}: 含 ArrayFixTable.RowTitle，预览 Tab 会白屏`);
    for (const [colKey, col] of Object.entries(props ?? {})) {
      if (col['x-component'] !== 'ArrayFixTable.Column' && col['x-component'] !== 'ArrayTable.Column') continue;
      const fields = Object.entries(col.properties ?? {});
      for (const [fieldKey, field] of fields) {
        const fieldName = (field.name as string) ?? fieldKey;
        const colName = (col.name as string) ?? colKey;
        if (fieldName === colName || fieldKey === colName) {
          issues.push(`${path}.${colKey}: 列名与字段名相同 (${colName})，预览将白屏`);
        }
      }
    }
  }
  for (const child of Object.values((node.properties as Record<string, unknown>) ?? {})) {
    findArrayTableIssues(child as Record<string, unknown>, path, issues);
  }
  const items = (node.items as Record<string, unknown>)?.properties as Record<string, unknown> | undefined;
  if (items) {
    for (const child of Object.values(items)) findArrayTableIssues(child as Record<string, unknown>, path, issues);
  }
}

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Preview 工具集 */
export function createPreviewTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'validate_template',
    description: '检查当前会话 Schema/extra 完整性（本地校验，非 UI 预览）。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('Schema 为空');
      const issues: string[] = [];
      const comps = listSchemaComponents(session.formSchema.schema as any);
      if (comps.length === 0) issues.push('表单无组件');
      findArrayTableIssues(session.formSchema.schema as Record<string, unknown>, 'schema', issues);
      for (const f of session.extra?.expressionItems ?? []) {
        if (!f.writeFormValue) issues.push(`公式 ${f.title} 缺少 writeFormValue`);
      }
      if (issues.length) return textResult(`校验发现问题:\n  - ${issues.join('\n  - ')}`, true);
      return textResult(`校验通过: ${comps.length} 个组件, ${session.extra?.expressionItems.length ?? 0} 条公式`);
    },
  },
  {
    name: 'create_preview_session',
    description: 'POST /template-preview/session 生成外部分享预览 token。',
    inputSchema: z.object({
      templateId: z.number().optional(),
      versionId: z.number().optional(),
    }),
    handler: async (args) => {
      try {
        assertTemplateSelected(sessionId, );
        const session = getSession(sessionId);
        const client = await getElnManager().createClient();
        const res = await client.createPreviewSession(
          (args.templateId as number | undefined) ?? session.templateId!,
          (args.versionId as number | undefined) ?? session.versionId!
        );
        if (!res.success) return errorResult(res.errorMessage);
        return jsonResult(res.data);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
];
}