/**
 * 模板管理工具模块（不含启用/发起变更）
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, errorResult } from '../types';
import {
  getSession, setTemplate, setFormSchema, setExtra, setTableTemplate,
  assertWriteSession,
} from '@/lib/eln/session-state';
import { createEmptySchema } from '@/lib/eln/schema/component-builder';

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Template 工具集 */
export function createTemplateTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'create_template',
    description: '创建新模板并选中为当前编辑模板。需先 login。',
    inputSchema: z.object({
      sampleName: z.string().describe('样品名称'),
      categoryId: z.number().describe('分类 ID，可通过 list_categories 查询'),
      name: z.string().describe('参数名称'),
      standard: z.string().optional().describe('标准号'),
    }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.createTemplate({
          sampleName: args.sampleName as string,
          categoryId: args.categoryId as number,
          testingItemName: args.name as string,
          standard: args.standard as string | undefined,
        });
        if (!res.success || !res.data.id) return errorResult(res.errorMessage || '创建失败');
        const templateId = res.data.id;
        const detailRes = await client.getTemplateDetail(templateId);
        if (!detailRes.success || !detailRes.data) return errorResult('获取详情失败');
        const versionId = client.getEditableVersionId(detailRes.data);
        if (!versionId) return errorResult('未找到可编辑版本');
        setTemplate(sessionId, templateId, versionId, args.name as string, args.categoryId as number);
        setFormSchema(sessionId, createEmptySchema() as any);
        setExtra(sessionId, { expressionItems: [], outputItems: [], detectionDateConfig: null });
        setTableTemplate(sessionId, {});
        return textResult(`模板创建成功: ID=${templateId} version=${versionId}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'select_template',
    description: '选择模板并加载 Schema/extra/table 到内存。',
    inputSchema: z.object({ templateId: z.number() }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.getTemplateDetail(args.templateId as number);
        if (!res.success || !res.data) return errorResult(res.errorMessage || '模板不存在');
        const template = res.data;
        const versionId = client.getEditableVersionId(template);
        if (!versionId) return errorResult('无可编辑版本');
        const version = template.draftVersion ?? template.currentVersion!;
        setTemplate(sessionId, template.id, versionId, `${template.name}/${template.testingItemName}`, template.categoryId);
        setFormSchema(sessionId, (version.formTemplateJson ?? createEmptySchema()) as any);
        setExtra(sessionId, version.extra ?? { expressionItems: [], outputItems: [], detectionDateConfig: null });
        setTableTemplate(sessionId, (version.tableTemplateJson as any) ?? {});
        return textResult(`已选中模板 ${template.id} 分类=${template.categoryId} 版本=${versionId}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'copy_template',
    description: '复制模板并选中新模板。',
    inputSchema: z.object({ sourceTemplateId: z.number(), newName: z.string().optional() }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.copyTemplate(args.sourceTemplateId as number, args.newName as string | undefined);
        const detail = await client.getTemplateDetail(res.newTemplateId);
        const t = detail.data!;
        const ver = t.draftVersion ?? t.currentVersion!;
        setTemplate(sessionId, res.newTemplateId, res.newVersionId, `${t.name}/${t.testingItemName}`, t.categoryId);
        if (ver.formTemplateJson) setFormSchema(sessionId, ver.formTemplateJson as any);
        if (ver.extra) setExtra(sessionId, ver.extra);
        setTableTemplate(sessionId, (ver.tableTemplateJson as any) ?? {});
        return textResult(`复制成功: 新ID=${res.newTemplateId}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'delete_template',
    description: '删除指定模板。',
    inputSchema: z.object({ templateId: z.number() }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.deleteTemplate(args.templateId as number);
        return res.success ? textResult(`已删除模板 ${res.deletedId}`) : errorResult('删除失败');
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'save_template',
    description: 'PATCH 保存 formTemplateJson + extra + tableTemplateJson。',
    inputSchema: z.object({}),
    handler: async () => {
      try {
        assertWriteSession(sessionId, );
        const session = getSession(sessionId);
        if (!session.formSchema || !session.extra) return errorResult('Schema 或 extra 为空');
        const client = await getElnManager().createClient();
        const res = await client.saveTemplateVersion(session.versionId!, {
          extra: session.extra,
          formTemplateJson: session.formSchema,
          tableTemplateJson: session.tableTemplate ?? {},
        });
        return res.success
          ? textResult(`保存成功 template=${session.templateId} version=${session.versionId}`)
          : errorResult(res.errorMessage || '保存失败');
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'set_controlled_no',
    description: '设置受控编号（需全局唯一）。',
    inputSchema: z.object({ controlledNo: z.string() }),
    handler: async (args) => {
      try {
        assertWriteSession(sessionId, );
        const session = getSession(sessionId);
        const client = await getElnManager().createClient();
        const res = await client.setControlledNo(session.versionId!, args.controlledNo as string);
        return res.success
          ? textResult(`受控编号已设置: ${args.controlledNo}`)
          : errorResult(res.errorMessage || '设置失败');
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'update_template_metadata',
    description: 'PATCH 更新 remark/spec/testingItemName，不改 Schema。',
    inputSchema: z.object({
      remark: z.string().nullable().optional(),
      spec: z.string().optional(),
      testingItemName: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        assertWriteSession(sessionId, );
        const session = getSession(sessionId);
        const client = await getElnManager().createClient();
        const res = await client.updateTemplate(session.templateId!, {
          remark: args.remark as string | null | undefined,
          spec: args.spec as string | undefined,
          testingItemName: args.testingItemName as string | undefined,
        });
        return res.success ? textResult(`元数据已更新 ID=${session.templateId}`) : errorResult(res.errorMessage);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
  {
    name: 'list_template_versions',
    description: 'GET 版本历史列表。',
    inputSchema: z.object({ templateId: z.number().optional() }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        const id = (args.templateId as number | undefined) ?? session.templateId;
        if (!id) return errorResult('未指定 templateId');
        const client = await getElnManager().createClient();
        const res = await client.listTemplateVersions(id);
        if (!res.success) return errorResult(res.errorMessage);
        const lines = res.data.map((v) => `  [${v.id}] v${v.version} status=${v.status} no=${v.controlledNo || '-'}`);
        return textResult(`版本 (${res.data.length}):\n${lines.join('\n')}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
];
}