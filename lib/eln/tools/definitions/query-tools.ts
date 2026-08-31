/**
 * 查询工具模块（只读）
 *
 * 4 个工具: list_templates, get_template_detail, list_categories, list_submission_logs
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, jsonResult, errorResult } from '../types';

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Query 工具集 */
export function createQueryTools(sessionId: string): ToolDefinition[] {
  return [
  // 1. 查询模板列表
  {
    name: 'list_templates',
    description: '分页查询模板列表。可按分类筛选或按名称搜索。返回每个模板的 ID、名称、状态、版本等信息。',
    inputSchema: z.object({
      current: z.number().optional().describe('页码（默认 1）'),
      pageSize: z.number().optional().describe('每页条数（默认 20）'),
      categoryId: z.number().optional().describe('按分类 ID 筛选'),
      name: z.string().optional().describe('按样品名称搜索'),
    }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.listTemplates({
          current: args.current as number | undefined,
          pageSize: args.pageSize as number | undefined,
          categoryId: args.categoryId as number | undefined,
          name: args.name as string | undefined,
        });
        if (!res.success) return errorResult(res.errorMessage);
        const list = res.data.list;
        const summary = list.map((t: any) =>
          `  [${t.id}] ${t.name} / ${t.testingItemName}  状态=${t.status === 1 ? '草稿' : '已启用'}  版本=${t.version}  编号=${t.controlledNo || '无'}`
        ).join('\n');
        return textResult(`模板列表 (共 ${res.data.total} 个，当前显示 ${list.length} 个):\n${summary}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 2. 获取模板详情
  {
    name: 'get_template_detail',
    description: '获取模板完整详情，含版本信息（草稿版本、当前版本、启用版本）。不加载到编辑会话，仅查看。',
    inputSchema: z.object({
      templateId: z.number().describe('模板 ID'),
    }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.getTemplateDetail(args.templateId as number);
        if (!res.success) return errorResult(res.errorMessage);
        const t = res.data;
        return textResult(
          `模板详情:\n  ID: ${t.id}\n  名称: ${t.name} / ${t.testingItemName}\n  分类: ${t.categoryName}\n  标准: ${t.spec}\n  状态: ${t.status === 1 ? '草稿' : '已启用'}\n  版本: ${t.version}\n  受控编号: ${t.controlledNo || '未设置'}\n  草稿版本: ${t.draftVersion?.id ?? '无'}\n  当前版本: ${t.currentVersion?.id ?? '无'}\n  启用版本: ${t.activeVersion?.id ?? '无'}\n  创建者: ${t.creatorName}`
        );
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 3. 查询分类列表
  {
    name: 'list_categories',
    description: '获取所有检测分类列表。创建模板时需要 categoryId。',
    inputSchema: z.object({}),
    handler: async () => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.listCategories();
        if (!res.success) return errorResult(res.errorMessage);
        const list = res.data;
        const summary = list.map((c: any) =>
          `  [${c.id}] ${c.name}${c.remark ? ' — ' + c.remark : ''}`
        ).join('\n');
        return textResult(`分类列表 (${list.length} 个):\n${summary}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 4. 查询提交日志
  {
    name: 'list_submission_logs',
    description: '分页查询提交日志。返回提交类型、创建者、任务 ID 等信息。',
    inputSchema: z.object({
      current: z.number().optional().describe('页码（默认 1）'),
      pageSize: z.number().optional().describe('每页条数（默认 20）'),
    }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.listSubmissionLogs({
          current: args.current as number | undefined,
          pageSize: args.pageSize as number | undefined,
        });
        if (!res.success) return errorResult(res.errorMessage);
        const list = res.data.list;
        const summary = list.map((l: any) =>
          `  [${l.id}] ${l.submissionType} — ${l.creatorName} — 任务${l.taskId} — ${l.createdAt}`
        ).join('\n');
        return textResult(`提交日志 (共 ${res.data.total} 条，当前显示 ${list.length} 条):\n${summary}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 5. 获取分类树（含样品层级）
  {
    name: 'get_category_tree',
    description: '获取完整的分类树结构，包含分类 → 样品的层级关系。',
    inputSchema: z.object({}),
    handler: async () => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.getCategoryTree();
        if (!res.success) return errorResult(res.errorMessage);
        const tree = res.data;
        const lines = tree.map((n) =>
          `  [${n.categoryId}] ${n.categoryName}  样品${n.sampleCount}  模板${n.templateCount}`
        );
        return textResult(`分类列表 (${tree.length} 个):\n${lines.join('\n')}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 6. 查询样品列表
  {
    name: 'list_samples',
    description: '查询指定分类下的样品列表。创建模板时需要知道样品属于哪个分类。',
    inputSchema: z.object({
      categoryId: z.number().describe('分类 ID'),
    }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.listSamples(args.categoryId as number);
        if (!res.success) return errorResult(res.errorMessage);
        const list = res.data;
        const summary = list.map((s) =>
          `  ${s.name}  (分类[${s.categoryId}] ${s.categoryName})  模板数=${s.templateCount}`
        ).join('\n');
        return textResult(`样品列表 (${list.length} 个):\n${summary}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'search_templates',
    description: '搜索模板（GET /form-template/search）。支持 categoryId、name 筛选。',
    inputSchema: z.object({
      current: z.number().optional(),
      pageSize: z.number().optional(),
      categoryId: z.number().optional(),
      name: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const client = await getElnManager().createClient();
        const res = await client.searchTemplates({
          current: args.current as number | undefined,
          pageSize: args.pageSize as number | undefined,
          categoryId: args.categoryId as number | undefined,
          name: args.name as string | undefined,
        });
        if (!res.success) return errorResult(res.errorMessage);
        const list = res.data.list;
        const summary = list.map((t: any) =>
          `  [${t.id}] ${t.name}/${t.testingItemName} 分类=${t.categoryName} 状态=${t.status}`
        ).join('\n');
        return textResult(`搜索结果 (共 ${res.data.total}，显示 ${list.length}):\n${summary}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
];
}