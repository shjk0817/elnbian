/**
 * 表格 Tab 扩展工具（x-spreadsheet）
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, errorResult } from '../types';
import { getSession, setTableTemplate } from '@/lib/eln/session-state';

function ensureTable(session: ReturnType<typeof getSession>): Record<string, unknown> {
  const table = (session.tableTemplate ?? {}) as Record<string, unknown>;
  session.tableTemplate = table as any;
  return table;
}

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 TableExt 工具集 */
export function createTableExtTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'bind_cell_loop',
    description: '绑定单元格区域到 ArrayTable 等循环数据（bind_loop）。',
    inputSchema: z.object({
      cellKey: z.string(),
      arrayPath: z.string().describe('ArrayTable 字段路径'),
      columnField: z.string().describe('列内字段名'),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      const table = ensureTable(session);
      const bindings = (table.bindings ?? {}) as Record<string, unknown>;
      bindings[args.cellKey as string] = {
        type: 'loop',
        arrayPath: args.arrayPath,
        columnField: args.columnField,
      };
      table.bindings = bindings;
      setTableTemplate(sessionId, table as any);
      return textResult(`循环绑定: ${args.cellKey} → ${args.arrayPath}.${args.columnField}`);
    },
  },
  {
    name: 'set_cell_style',
    description: '设置单元格样式索引或样式属性。',
    inputSchema: z.object({
      row: z.number(), col: z.number(),
      style: z.number().optional(),
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      const table = ensureTable(session);
      const styles = (table.styles ?? []) as Record<string, unknown>[];
      const rowKey = String(args.row);
      const colKey = String(args.col);
      const rows = (table.rows ?? {}) as Record<string, unknown>;
      const row = (rows[rowKey] ?? { cells: {} }) as Record<string, unknown>;
      const cells = (row.cells ?? {}) as Record<string, unknown>;
      let styleIdx = args.style as number | undefined;
      if (styleIdx === undefined && (args.bold !== undefined || args.italic !== undefined)) {
        styleIdx = styles.length;
        styles.push({ bold: args.bold, italic: args.italic });
        table.styles = styles;
      }
      cells[colKey] = { ...(cells[colKey] as object), style: styleIdx ?? 1 };
      row.cells = cells;
      rows[rowKey] = row;
      table.rows = rows;
      setTableTemplate(sessionId, table as any);
      return textResult(`样式已设置 [${args.row},${args.col}]`);
    },
  },
  {
    name: 'merge_cells',
    description: '合并单元格区域。',
    inputSchema: z.object({
      startRow: z.number(), startCol: z.number(),
      endRow: z.number(), endCol: z.number(),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      const table = ensureTable(session);
      const merges = (table.merges ?? []) as string[];
      merges.push(`${args.startRow}_${args.startCol}:${args.endRow}_${args.endCol}`);
      table.merges = merges;
      setTableTemplate(sessionId, table as any);
      return textResult(`已合并 ${args.startRow},${args.startCol} → ${args.endRow},${args.endCol}`);
    },
  },
  {
    name: 'insert_row',
    description: '在指定行索引插入空行。',
    inputSchema: z.object({ at: z.number() }),
    handler: async (args) => {
      const session = getSession(sessionId);
      const table = ensureTable(session);
      const rows = (table.rows ?? {}) as Record<string, unknown>;
      const keys = Object.keys(rows).map(Number).sort((a, b) => b - a);
      for (const k of keys) {
        if (k >= (args.at as number)) rows[String(k + 1)] = rows[String(k)];
      }
      rows[String(args.at)] = { cells: {} };
      table.rows = rows;
      setTableTemplate(sessionId, table as any);
      return textResult(`已在行 ${args.at} 插入空行`);
    },
  },
  {
    name: 'delete_row',
    description: '删除指定行。',
    inputSchema: z.object({ row: z.number() }),
    handler: async (args) => {
      const session = getSession(sessionId);
      const table = ensureTable(session);
      const rows = (table.rows ?? {}) as Record<string, unknown>;
      delete rows[String(args.row)];
      table.rows = rows;
      setTableTemplate(sessionId, table as any);
      return textResult(`已删除行 ${args.row}`);
    },
  },
];
}