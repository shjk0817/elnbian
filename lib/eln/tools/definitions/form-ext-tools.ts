/**
 * 表单 Tab 扩展工具：校验、响应器、可选项、复制移动等
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, errorResult } from '../types';
import { getSession } from '@/lib/eln/session-state';
import {
  findComponent, addComponentToSchema, removeComponent, listComponents, buildComponent,
} from '@/lib/eln/schema/component-builder';
import { buildFormTableShell } from '@/lib/eln/schema/form-table-builder';
import { buildArrayTableShell, buildArrayFixTableShell } from '@/lib/eln/schema/array-builders';

/** 深拷贝 Schema 子树并重命名 */
function cloneNode(node: Record<string, unknown>, newName: string): Record<string, unknown> {
  const copy = JSON.parse(JSON.stringify(node)) as Record<string, unknown>;
  copy.name = newName;
  copy['x-designable-id'] = Math.random().toString(36).slice(2, 13);
  return copy;
}

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 FormExt 工具集 */
export function createFormExtTools(sessionId: string): ToolDefinition[] {
  return [
  {
    name: 'set_enum_options',
    description: '设置 Select/Radio/Checkbox 的可选项（enum 字段）。',
    inputSchema: z.object({
      path: z.string(),
      options: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = findComponent(session.formSchema.schema as any, args.path as string);
      if (!node) return errorResult('路径不存在');
      node.enum = args.options;
      const props = (node['x-component-props'] ?? {}) as Record<string, unknown>;
      props.options = args.options;
      node['x-component-props'] = props;
      return textResult(`已设置 ${args.path} 的 ${(args.options as any[]).length} 个选项`);
    },
  },
  {
    name: 'set_validator',
    description: '添加校验规则到 x-validator 数组。',
    inputSchema: z.object({
      path: z.string(),
      rule: z.record(z.unknown()).describe('如 { required: true } 或 { format: "email" }'),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = findComponent(session.formSchema.schema as any, args.path as string);
      if (!node) return errorResult('路径不存在');
      const validators = (node['x-validator'] ?? []) as unknown[];
      validators.push(args.rule);
      node['x-validator'] = validators;
      return textResult(`已添加校验规则到 ${args.path}`);
    },
  },
  {
    name: 'remove_validator',
    description: '按索引删除 x-validator 规则。',
    inputSchema: z.object({ path: z.string(), index: z.number() }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = findComponent(session.formSchema.schema as any, args.path as string);
      if (!node) return errorResult('路径不存在');
      const validators = (node['x-validator'] ?? []) as unknown[];
      validators.splice(args.index as number, 1);
      node['x-validator'] = validators;
      return textResult(`已删除 ${args.path} 的校验规则 index=${args.index}`);
    },
  },
  {
    name: 'set_reactions',
    description: '设置 x-reactions 响应器规则。',
    inputSchema: z.object({
      path: z.string(),
      reactions: z.record(z.unknown()),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = findComponent(session.formSchema.schema as any, args.path as string);
      if (!node) return errorResult('路径不存在');
      node['x-reactions'] = args.reactions;
      return textResult(`已设置 ${args.path} 的响应器规则`);
    },
  },
  {
    name: 'remove_reactions',
    description: '删除字段的 x-reactions。',
    inputSchema: z.object({ path: z.string() }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = findComponent(session.formSchema.schema as any, args.path as string);
      if (!node) return errorResult('路径不存在');
      delete node['x-reactions'];
      return textResult(`已删除 ${args.path} 的响应器规则`);
    },
  },
  {
    name: 'copy_component',
    description: '复制组件子树到新 name，可指定新 parentPath。',
    inputSchema: z.object({
      sourcePath: z.string(),
      newName: z.string(),
      parentPath: z.string().optional(),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const schema = session.formSchema.schema as Record<string, unknown>;
      const src = findComponent(schema, args.sourcePath as string);
      if (!src) return errorResult('源路径不存在');
      const copy = cloneNode(src, args.newName as string);
      addComponentToSchema(schema, (args.parentPath as string) || '', copy);
      return textResult(`已复制 ${args.sourcePath} → ${args.newName}`);
    },
  },
  {
    name: 'move_component',
    description: '将组件移动到新的 parentPath（先删后加）。',
    inputSchema: z.object({
      path: z.string(),
      newParentPath: z.string().optional(),
      newName: z.string().optional(),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const schema = session.formSchema.schema as Record<string, unknown>;
      const node = findComponent(schema, args.path as string);
      if (!node) return errorResult('路径不存在');
      const name = (args.newName as string | undefined) ?? (node.name as string);
      const copy = cloneNode(node, name);
      if (!removeComponent(schema, args.path as string)) return errorResult('删除失败');
      addComponentToSchema(schema, (args.newParentPath as string) || '', copy);
      return textResult(`已移动 ${args.path} → ${args.newParentPath || '根级'}.${name}`);
    },
  },
  {
    name: 'reorder_component',
    description: '设置组件 x-index 排序值。',
    inputSchema: z.object({ path: z.string(), index: z.number() }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = findComponent(session.formSchema.schema as any, args.path as string);
      if (!node) return errorResult('路径不存在');
      node['x-index'] = args.index;
      return textResult(`已设置 ${args.path} x-index=${args.index}`);
    },
  },
  {
    name: 'add_grid_column',
    description: '向 FormGrid 添加 GridColumn 子节点。',
    inputSchema: z.object({
      gridPath: z.string(),
      columnName: z.string(),
      title: z.string().optional(),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const col = buildComponent({
        type: 'FormGrid.GridColumn',
        name: args.columnName as string,
        title: (args.title as string) || '',
      });
      addComponentToSchema(session.formSchema.schema as any, args.gridPath as string, col);
      return textResult(`已向 ${args.gridPath} 添加列 ${args.columnName}`);
    },
  },
  {
    name: 'init_form_table',
    description: '创建表单内 Table/TableRow/TableCell 矩阵布局。',
    inputSchema: z.object({
      name: z.string(),
      title: z.string(),
      parentPath: z.string().optional(),
      rows: z.number().min(1),
      cols: z.number().min(1),
    }),
    handler: async (args) => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      const node = buildFormTableShell(
        args.name as string,
        args.title as string,
        args.rows as number,
        args.cols as number
      );
      addComponentToSchema(session.formSchema.schema as any, (args.parentPath as string) || '', node);
      return textResult(`表单矩阵已创建 ${args.rows}x${args.cols}`);
    },
  },
];
}