/**
 * 表单设计工具模块（细粒度）
 *
 * 7 个工具: add_component, set_property, get_schema, set_full_schema,
 *           remove_component, list_components, reset_schema
 */

import { z } from 'zod';
import type { ToolDefinition } from '../types';
import { textResult, jsonResult, errorResult } from '../types';
import { getSession, setFormSchema } from '@/lib/eln/session-state';
import {
  buildComponent, addComponentToSchema, findComponent, removeComponent,
  listComponents, createEmptySchema,
} from '@/lib/eln/schema/component-builder';
import { getComponentCatalog } from '@/lib/eln/schema/component-catalog';
import { buildArrayTableShell, buildArrayFixTableShell } from '@/lib/eln/schema/array-builders';
import { setFormSettings } from '@/lib/eln/session-state';

import { getElnManager } from '@/lib/eln/manager';

/** 创建绑定 sessionId 的 Form 工具集 */
export function createFormTools(sessionId: string): ToolDefinition[] {
  return [
  // 1. 添加组件
  {
    name: 'add_component',
    description: `向当前表单添加一个组件。支持完整的 ELN 组件体系：
- 表单组件: Input, Number, TextArea, Select, DatePicker, DatePicker.RangePicker, TimePicker, TimePicker.RangePicker, Switch, Radio, Checkbox, Slider, TreeSelect, Cascader, Transfer
- 容器/布局: Card, FormGrid, FormGrid.GridColumn, FormLayout, FormCollapse, FormCollapse.CollapsePanel, Space, Tabs, Tabs.TabPane
- 表格类: Table, TableRow, TableCell, ArrayTable, ArrayTable.Column, ArrayTable.Index, ArrayFixTable, ArrayFixTable.Column, ArrayFixTable.RowTitle
- 展示/数组: Text, FormattedText, ArrayCards
容器组件可包含子组件，通过 parentPath 指定父级路径。
详细属性配置请参考 Skill 文件: eln-component-catalog`,
    inputSchema: z.object({
      type: z.string().describe('组件类型，如 "Input", "Number", "Card"'),
      name: z.string().describe('字段标识（唯一），如 "sampleNo"。容器组件也需要唯一 name'),
      title: z.string().describe('显示标题，如 "样品编号"'),
      parentPath: z.string().optional().describe('父组件路径（如 "card1" 表示放在 card1 内部），不填则放在根级'),
      componentProps: z.record(z.unknown()).optional().describe('组件属性对象，如 { placeholder: "请输入", size: "default" }'),
      decoratorProps: z.record(z.unknown()).optional().describe('装饰器属性，如 { description: "辅助提示" }'),
      required: z.boolean().optional().describe('是否必填'),
      pattern: z.enum(['editable', 'disabled', 'readOnly']).optional().describe('展示状态'),
      display: z.enum(['visible', 'hidden', 'none']).optional().describe('是否显示'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.formSchema) return errorResult('未选择模板，请先调用 create_template 或 select_template');

        // 选项类组件：从 componentProps.options 提取到 enumOptions
        const componentProps = { ...(args.componentProps as Record<string, unknown> | undefined ?? {}) };
        let enumOptions: Array<{ label: string; value: string | number }> | undefined;
        if (componentProps.options) {
          enumOptions = componentProps.options as Array<{ label: string; value: string | number }>;
          delete componentProps.options;
        }

        const component = buildComponent({
          type: args.type as string,
          name: args.name as string,
          title: args.title as string,
          componentProps,
          decoratorProps: args.decoratorProps as Record<string, unknown> | undefined,
          required: args.required as boolean | undefined,
          pattern: args.pattern as 'editable' | 'disabled' | 'readOnly' | undefined,
          display: args.display as 'visible' | 'hidden' | 'none' | undefined,
          enumOptions,
        });

        const schema = session.formSchema.schema as Record<string, unknown>;
        const parentPath = (args.parentPath as string) || '';
        addComponentToSchema(schema, parentPath, component);

        return textResult(
          `组件已添加:\n  类型: ${args.type}\n  标识: ${args.name}\n  标题: ${args.title}\n  位置: ${parentPath || '根级'}\n  注意: 组件仅在内存中，需调用 save_template 保存到服务器`
        );
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 2. 设置组件属性
  {
    name: 'set_property',
    description: `修改已添加组件的属性。可设置任意 x-component-props 或 x-decorator-props 字段。
属性名映射请参考 Skill 文件: formily-schema-guide.md`,
    inputSchema: z.object({
      path: z.string().describe('组件路径，如 "card1.sampleNo"。可通过 list_components 查询'),
      propType: z.enum(['component', 'decorator', 'field']).describe('属性类别: component=x-component-props, decorator=x-decorator-props, field=字段级属性(title, required 等)'),
      key: z.string().describe('属性名，如 "placeholder", "size", "title", "required"'),
      value: z.unknown().describe('属性值'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.formSchema) return errorResult('未选择模板');

        const schema = session.formSchema.schema as Record<string, unknown>;
        const component = findComponent(schema, args.path as string);
        if (!component) return errorResult(`路径 "${args.path}" 的组件不存在`);

        const propType = args.propType as string;
        const key = args.key as string;
        const value = args.value;

        if (propType === 'component') {
          const props = (component['x-component-props'] ?? {}) as Record<string, unknown>;
          props[key] = value;
          component['x-component-props'] = props;
        } else if (propType === 'decorator') {
          const props = (component['x-decorator-props'] ?? {}) as Record<string, unknown>;
          props[key] = value;
          component['x-decorator-props'] = props;
        } else {
          component[key] = value;
        }

        return textResult(`属性已设置: ${args.path}.${propType}.${args.key} = ${JSON.stringify(value)}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 3. 获取当前 Schema
  {
    name: 'get_schema',
    description: '获取当前会话的完整 Formily Schema JSON。用于检查当前表单结构。',
    inputSchema: z.object({}),
    handler: async () => {
      const session = getSession(sessionId);
      if (!session.formSchema) return errorResult('未选择模板');
      return jsonResult(session.formSchema);
    },
  },

  // 4. 直接设置完整 Schema
  {
    name: 'set_full_schema',
    description: '直接设置完整的 Formily Schema JSON。适用于从已有模板复制 Schema 或 AI 一次性生成完整表单结构。会覆盖之前所有细粒度操作。',
    inputSchema: z.object({
      schema: z.record(z.unknown()).describe('完整的 Formily Schema 对象，包含 form 和 schema 两个字段'),
    }),
    handler: async (args) => {
      try {
        const schema = args.schema as any;
        if (!schema.form || !schema.schema) {
          return errorResult('Schema 必须包含 form 和 schema 两个字段');
        }
        setFormSchema(sessionId, schema);
        return textResult('完整 Schema 已设置。注意: 需调用 save_template 保存到服务器');
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 5. 删除组件
  {
    name: 'remove_component',
    description: '从当前表单中删除指定组件。支持删除容器组件（会连同子组件一起删除）。',
    inputSchema: z.object({
      path: z.string().describe('要删除的组件路径，如 "card1.sampleNo" 或 "card1"'),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.formSchema) return errorResult('未选择模板');

        const schema = session.formSchema.schema as Record<string, unknown>;
        const success = removeComponent(schema, args.path as string);
        if (!success) return errorResult(`路径 "${args.path}" 的组件不存在`);
        return textResult(`组件已删除: ${args.path}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 6. 列出所有组件
  {
    name: 'list_components',
    description: '列出当前表单中所有组件的树形结构。每个组件显示路径、标识、类型和标题。',
    inputSchema: z.object({}),
    handler: async () => {
      try {
        const session = getSession(sessionId);
        if (!session.formSchema) return errorResult('未选择模板');
        const schema = session.formSchema.schema as Record<string, unknown>;
        const components = listComponents(schema);
        if (components.length === 0) return textResult('当前表单为空，请调用 add_component 添加组件');
        const tree = components.map((c) =>
          `  ${c.path}  [${c.type}]  ${c.title || '(无标题)'}  name=${c.name}`
        ).join('\n');
        return textResult(`当前表单组件 (${components.length} 个):\n${tree}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  // 7. 重置 Schema
  {
    name: 'reset_schema',
    description: '清空当前表单 Schema，重新开始设计。注意：不影响已保存到服务器的数据。',
    inputSchema: z.object({}),
    handler: async () => {
      const emptySchema = createEmptySchema();
      setFormSchema(sessionId, emptySchema as any);
      return textResult('Schema 已重置为空');
    },
  },

  {
    name: 'list_component_types',
    description: '列出编辑页组件库全部类型（与平台设计器左侧面板一致）。add_component 的 type 参数从此列表选择。',
    inputSchema: z.object({}),
    handler: async () => {
      const catalog = getComponentCatalog();
      const lines = catalog.map((c) =>
        `  ${c.type} → ${c.xComponent} [${c.category}] ${c.notes}`
      );
      return textResult(`组件类型 (${catalog.length} 个):\n${lines.join('\n')}`);
    },
  },

  {
    name: 'set_form_settings',
    description: '设置表单级属性（右侧「表单」面板）：labelCol、wrapperCol、labelWrap、layout 等。',
    inputSchema: z.object({
      labelCol: z.number().optional(),
      wrapperCol: z.number().optional(),
      labelWrap: z.boolean().optional(),
      fullness: z.boolean().optional(),
      layout: z.string().optional(),
    }),
    handler: async (args) => {
      try {
        const partial: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(args)) {
          if (v !== undefined) partial[k] = v;
        }
        setFormSettings(sessionId, partial);
        return textResult(`表单设置已更新: ${JSON.stringify(partial)}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'init_array_table',
    description: '创建自增表格骨架（含序号/操作列、添加按钮）。列内字段路径形如 tableName.colName.fieldName。',
    inputSchema: z.object({
      name: z.string().describe('表格标识'),
      title: z.string().describe('表格标题'),
      parentPath: z.string().optional().describe('父路径，如 card1'),
      columns: z.array(z.object({
        columnName: z.string().describe('列节点 name'),
        columnTitle: z.string().describe('列标题'),
        fieldName: z.string().describe('字段 name'),
        fieldType: z.enum(['Number', 'Input', 'TextArea']).describe('列内字段类型'),
        pattern: z.enum(['editable', 'disabled', 'readOnly']).optional(),
      })).min(1),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.formSchema) return errorResult('未选择模板');
        const node = buildArrayTableShell(
          args.name as string,
          args.title as string,
          args.columns as any[]
        );
        const schema = session.formSchema.schema as Record<string, unknown>;
        addComponentToSchema(schema, (args.parentPath as string) || '', node);
        return textResult(`自增表格已创建: ${args.name}，列数 ${(args.columns as any[]).length}`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },

  {
    name: 'init_array_fix_table',
    description: '创建固定行数表格骨架。适用于平行测定等固定行场景。',
    inputSchema: z.object({
      name: z.string(),
      title: z.string(),
      rowCount: z.number().describe('固定行数，如 2'),
      parentPath: z.string().optional(),
      columns: z.array(z.object({
        columnName: z.string(),
        columnTitle: z.string(),
        fieldName: z.string(),
        fieldType: z.enum(['Number', 'Input', 'TextArea']),
        pattern: z.enum(['editable', 'disabled', 'readOnly']).optional(),
      })).min(1),
    }),
    handler: async (args) => {
      try {
        const session = getSession(sessionId);
        if (!session.formSchema) return errorResult('未选择模板');
        const node = buildArrayFixTableShell(
          args.name as string,
          args.title as string,
          args.rowCount as number,
          args.columns as any[]
        );
        const schema = session.formSchema.schema as Record<string, unknown>;
        addComponentToSchema(schema, (args.parentPath as string) || '', node);
        return textResult(`固定行表格已创建: ${args.name}，${args.rowCount} 行`);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  },
];
}