/**
 * 表格搭建工具模块
 *
 * 3 个工具: set_table_template, get_table_template, bind_cell_data
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, jsonResult, errorResult } from '../types';
import { getSession, setTableTemplate } from '@/lib/eln/session-state';

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Table 工具集 */
export function createTableTools(sessionId: string): ToolDefinition[] {
  return [
  // 1. 设置表格模板
  {
    name: 'set_table_template',
    description: '设置完整的表格模板 JSON（x-spreadsheet 格式）。通常用于从已有模板复制表格配置。详细表格结构请参考 Skill 文件: table-building.md。',
    inputSchema: z.object({
      tableJson: z.record(z.unknown()).describe('完整的表格模板 JSON 对象'),
    }),
    handler: async (args) => {
      try {
        const tableJson = args.tableJson as Record<string, unknown>;
        setTableTemplate(sessionId, tableJson as any);
        return textResult(`表格模板已设置。注意: 需调用 save_template 保存到服务器`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 2. 获取当前表格模板
  {
    name: 'get_table_template',
    description: '获取当前会话中的表格模板 JSON。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.tableTemplate) return errorResult('未选择模板或表格模板为空');
      return jsonResult(session.tableTemplate);
    },
  },

  // 3. 绑定单元格数据
  {
    name: 'bind_cell_data',
    description: '将表格单元格绑定到表单字段。绑定后单元格的值会随表单字段自动更新。',
    inputSchema: z.object({
      cellKey: z.string().describe('单元格标识，如 "A1" 或 "0_0"（行列索引）'),
      fieldPath: z.string().describe('绑定的表单字段路径，如 "sampleNo"'),
      bindType: z.enum(['formField', 'tableData']).describe('绑定类型: formField=绑定表单字段, tableData=绑定表格循环数据'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.tableTemplate) {
          return errorResult('表格模板为空，请先调用 set_table_template 设置表格');
        }

        const table = session.tableTemplate as Record<string, unknown>;
        const bindings = (table['cellBindings'] ?? {}) as Record<string, unknown>;
        bindings[args.cellKey as string] = {
          fieldPath: args.fieldPath,
          type: args.bindType,
        };
        table['cellBindings'] = bindings;

        return textResult(
          `单元格已绑定:\n  单元格: ${args.cellKey}\n  字段: ${args.fieldPath}\n  类型: ${args.bindType}\n  注意: 需调用 save_template 保存`
        );
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'set_spreadsheet_cell',
    description: '设置 x-spreadsheet 单元格文本（表格搭建 Tab）。行/列从 0 开始。',
    inputSchema: z.object({
      row: z.number().describe('行号，从 0'),
      col: z.number().describe('列号，从 0'),
      text: z.string().describe('单元格文本'),
      style: z.number().optional().describe('样式索引，默认 1'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        const table = (session.tableTemplate ?? {}) as Record<string, unknown>;
        const rows = (table.rows ?? {}) as Record<string, unknown>;
        const rowKey = String(args.row);
        const colKey = String(args.col);
        const row = (rows[rowKey] ?? { cells: {} }) as Record<string, unknown>;
        const cells = (row.cells ?? {}) as Record<string, unknown>;
        cells[colKey] = { text: args.text, style: args.style ?? 1 };
        row.cells = cells;
        rows[rowKey] = row;
        table.rows = rows;
        setTableTemplate(sessionId, table as any);
        return textResult(`单元格 [${args.row},${args.col}] = "${args.text}"`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
];
}