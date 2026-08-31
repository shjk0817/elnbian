/**
 * 数据配置工具模块
 *
 * 公式、输出值、检测日期相关 MCP 工具
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, jsonResult, errorResult } from '../types';
import {
  getSession,
  addExpression,
  removeExpression,
  addOutputItem,
  removeOutputItem,
  setDetectionDatePolicy,
  addDetectionDateItem,
  removeDetectionDateItem,
  setFullExtra,
} from '@/lib/eln/session-state';

const variableSchema = z.object({
  name: z.string().describe('变量代号，如 "A"'),
  value: z.string().describe('绑定的表单字段路径'),
  type: z.string().describe('变量类型: number, string, Array<number> 等'),
});

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Data 工具集 */
export function createDataTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'add_formula',
    description: `添加或更新计算公式。ELN 内置 22 个函数。详细语法见 Skill: expression-engine.md`,
    inputSchema: z.object({
      title: z.string().describe('公式显示名称'),
      expression: z.string().describe('ELN 表达式'),
      writeFormValue: z.string().describe('结果写入字段路径'),
      variables: z.array(variableSchema).describe('变量列表'),
      id: z.number().optional().describe('已有公式 ID（更新时传入）'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.extra) return errorResult('未选择模板');
        const timestamp = (args.id as number | undefined) ?? Date.now();
        addExpression(sessionId, {
          id: timestamp,
          name: `expression_${timestamp}`,
          title: args.title as string,
          expression: args.expression as string,
          writeFormValue: args.writeFormValue as string,
          variables: args.variables as any[],
        });
        return textResult(`公式已添加/更新: [${timestamp}] ${args.title}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'list_formulas',
    description: '列出当前会话中所有计算公式。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.extra) return errorResult('未选择模板');
      const items = session.extra.expressionItems;
      if (items.length === 0) return textResult('当前无公式');
      const list = items.map((e) =>
        `  [${e.id}] ${e.title}\n    表达式: ${e.expression}\n    写入: ${e.writeFormValue}`
      ).join('\n');
      return textResult(`公式列表 (${items.length} 个):\n${list}`);
    },
  },

  {
    name: 'remove_formula',
    description: '按 ID 删除计算公式。',
    inputSchema: z.object({
      id: z.number().describe('公式 ID'),
    }),
    handler: async (args) => {
      const ok = removeExpression(sessionId, args.id as number);
      return ok ? textResult(`公式 ${args.id} 已删除`) : errorResult(`未找到公式 ${args.id}`);
    },
  },

  {
    name: 'add_output_item',
    description: '添加或更新输出值。名称格式: raw##{卡片标题}-{字段标题}##{字段名}',
    inputSchema: z.object({
      cardTitle: z.string().describe('卡片标题'),
      fieldTitle: z.string().describe('字段标题'),
      fieldName: z.string().describe('字段标识'),
      id: z.number().optional().describe('已有输出值 ID（更新时传入）'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.extra) return errorResult('未选择模板');
        const timestamp = (args.id as number | undefined) ?? Date.now();
        const name = `raw##${args.cardTitle}-${args.fieldTitle}##${args.fieldName}`;
        addOutputItem(sessionId, { id: timestamp, name });
        return textResult(`输出值已添加: [${timestamp}] ${name}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'list_output_items',
    description: '列出当前会话中所有输出值配置。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.extra) return errorResult('未选择模板');
      const items = session.extra.outputItems;
      if (items.length === 0) return textResult('当前无输出值');
      const list = items.map((o) => `  [${o.id}] ${o.name}`).join('\n');
      return textResult(`输出值列表 (${items.length} 个):\n${list}`);
    },
  },

  {
    name: 'remove_output_item',
    description: '按 ID 删除输出值配置。',
    inputSchema: z.object({
      id: z.number().describe('输出值 ID'),
    }),
    handler: async (args) => {
      const ok = removeOutputItem(sessionId, args.id as number);
      return ok ? textResult(`输出值 ${args.id} 已删除`) : errorResult(`未找到输出值 ${args.id}`);
    },
  },

  {
    name: 'set_detection_date',
    description: '设置检测日期全局策略（missingPolicy、outputFormat）。不修改已有 items，除非传入 items 全量替换。',
    inputSchema: z.object({
      missingPolicy: z.enum(['block', 'warnOnly', 'ignore']).describe('缺失策略'),
      outputFormat: z.string().optional().describe('输出格式，默认 YYYY-MM-DD'),
      items: z.array(z.object({
        id: z.number().optional(),
        title: z.string(),
        path: z.string(),
        component: z.enum(['DatePicker', 'DatePicker.RangePicker']),
        valueKind: z.enum(['single', 'range', 'start', 'end']),
      })).optional().describe('可选：全量替换 items 列表'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.extra) return errorResult('未选择模板');
        setDetectionDatePolicy(sessionId, 
          args.missingPolicy as 'block' | 'warnOnly' | 'ignore',
          args.outputFormat as string | undefined
        );
        if (args.items) {
          const session2 = getSession(sessionId);
          if (session2.extra?.detectionDateConfig) {
            session2.extra.detectionDateConfig.items = (args.items as any[]).map((it) => ({
              id: it.id ?? Date.now(),
              title: it.title,
              path: it.path,
              component: it.component,
              valueKind: it.valueKind,
            }));
          }
        }
        const cfg = getSession(sessionId).extra?.detectionDateConfig;
        return textResult(
          `检测日期策略: ${cfg?.missingPolicy}\n  格式: ${cfg?.outputFormat}\n  配置项: ${cfg?.items.length ?? 0} 个`
        );
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'add_detection_date_item',
    description: '添加一条检测日期字段绑定（DatePicker / DatePicker.RangePicker）。',
    inputSchema: z.object({
      path: z.string().describe('表单字段路径（name）'),
      component: z.enum(['DatePicker', 'DatePicker.RangePicker']).describe('组件类型'),
      valueKind: z.enum(['single', 'range', 'start', 'end']).describe('取值方式'),
      title: z.string().optional().describe('显示标题，默认自动生成'),
      id: z.number().optional().describe('配置项 ID'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.extra) return errorResult('未选择模板');
        const id = (args.id as number | undefined) ?? Date.now();
        const title = (args.title as string | undefined) ?? `${args.path}`;
        addDetectionDateItem(sessionId, {
          id,
          title,
          path: args.path as string,
          component: args.component as 'DatePicker' | 'DatePicker.RangePicker',
          valueKind: args.valueKind as 'single' | 'range' | 'start' | 'end',
        });
        return textResult(`检测日期项已添加: [${id}] ${title} → ${args.path} (${args.valueKind})`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'remove_detection_date_item',
    description: '删除一条检测日期配置项。',
    inputSchema: z.object({
      id: z.number().describe('配置项 ID'),
    }),
    handler: async (args) => {
      const ok = removeDetectionDateItem(sessionId, args.id as number);
      return ok ? textResult(`检测日期项 ${args.id} 已删除`) : errorResult(`未找到配置项 ${args.id}`);
    },
  },

  {
    name: 'set_full_extra_config',
    description: '一次性设置完整 extra（expressionItems、outputItems、detectionDateConfig）。覆盖此前数据配置。',
    inputSchema: z.object({
      extra: z.record(z.unknown()).describe('完整 extra 对象'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.extra && !session.templateId) return errorResult('未选择模板');
        setFullExtra(sessionId, args.extra as any);
        return textResult('完整 extra 已设置，需 save_template 保存');
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'list_detection_date_items',
    description: '列出当前检测日期配置项。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.extra?.detectionDateConfig) return textResult('未配置检测日期');
      const items = session.extra.detectionDateConfig.items;
      if (!items.length) return textResult('检测日期策略: ' + session.extra.detectionDateConfig.missingPolicy + '，暂无 items');
      const lines = items.map((i) =>
        `  [${i.id}] ${i.path} ${i.component} ${i.valueKind} — ${i.title}`
      );
      return textResult(`检测日期 (${items.length} 项):\n${lines.join('\n')}`);
    },
  },

  {
    name: 'get_data_config',
    description: '获取当前会话完整数据配置（公式、输出值、检测日期）。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.extra) return errorResult('未选择模板');
      return jsonResult(session.extra);
    },
  },
];
}