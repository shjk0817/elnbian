/**
 * Formily 组件 Schema 构建器
 *
 * 生成符合 ELN 平台 Formily JSON Schema 规范的节点。
 * 关键：x-component 名必须与平台一致，Card 标题在 x-component-props.title，
 * 每个节点需要 x-designable-id 和 x-index。
 */

import { getSchemaChild, setSchemaChild, deleteSchemaChild, listSchemaChildren } from './schema-nav';

export interface ComponentSpec {
  type: string;              // 组件类型: Input, Number, Select, Card, ...
  name: string;              // 字段标识 (如 sampleNo)
  title: string;             // 标题 (如 "样品编号")
  decorator?: string;        // 装饰器 (默认 FormItem)
  componentProps?: Record<string, unknown>;
  decoratorProps?: Record<string, unknown>;
  required?: boolean;
  pattern?: 'editable' | 'disabled' | 'readOnly';
  /** 表格单元格等场景：不渲染 FormItem 标签 */
  hideTitle?: boolean;
  display?: 'visible' | 'hidden' | 'none';
  children?: Record<string, unknown>;  // 容器组件的子属性
  enumOptions?: Array<{ label: string; value: string | number }>;  // 选项列表（Select/Radio/Checkbox）
  default?: unknown;
}

// 平台正确的 x-component 名映射
const COMPONENT_DEFAULTS: Record<string, { component: string; decorator?: string; fieldType: string; isLayout: boolean }> = {
  Input:          { component: 'Input',          decorator: 'FormItem', fieldType: 'string',  isLayout: false },
  TextArea:       { component: 'Input.TextArea', decorator: 'FormItem', fieldType: 'string',  isLayout: false },
  Number:         { component: 'NumberPicker',   decorator: 'FormItem', fieldType: 'number',  isLayout: false },
  Select:         { component: 'Select',         decorator: 'FormItem', fieldType: 'string',  isLayout: false },
  DatePicker:             { component: 'DatePicker',              decorator: 'FormItem', fieldType: 'string',  isLayout: false },
  'DatePicker.RangePicker': { component: 'DatePicker.RangePicker', decorator: 'FormItem', fieldType: 'array',   isLayout: false },
  TimePicker:             { component: 'TimePicker',              decorator: 'FormItem', fieldType: 'string',  isLayout: false },
  'TimePicker.RangePicker': { component: 'TimePicker.RangePicker', decorator: 'FormItem', fieldType: 'array',   isLayout: false },
  Switch:         { component: 'Switch',          decorator: 'FormItem', fieldType: 'boolean', isLayout: false },
  Radio:          { component: 'Radio.Group',     decorator: 'FormItem', fieldType: 'string | number', isLayout: false },
  Checkbox:       { component: 'Checkbox.Group',  decorator: 'FormItem', fieldType: 'Array<string | number>', isLayout: false },
  Slider:         { component: 'Slider',          decorator: 'FormItem', fieldType: 'number',  isLayout: false },
  TreeSelect:     { component: 'TreeSelect',     decorator: 'FormItem', fieldType: 'string',  isLayout: false },
  Cascader:       { component: 'Cascader',        decorator: 'FormItem', fieldType: 'array',   isLayout: false },
  Transfer:       { component: 'Transfer',        decorator: 'FormItem', fieldType: 'array',   isLayout: false },
  Card:           { component: 'Card',            decorator: undefined,  fieldType: 'void',    isLayout: true  },
  FormGrid:           { component: 'FormGrid',           decorator: undefined,  fieldType: 'void',    isLayout: true  },
  'FormGrid.GridColumn': { component: 'FormGrid.GridColumn', decorator: undefined, fieldType: 'void', isLayout: true },
  FormLayout:     { component: 'FormLayout',       decorator: undefined,  fieldType: 'void',    isLayout: true  },
  FormCollapse:   { component: 'FormCollapse',     decorator: undefined,  fieldType: 'void',    isLayout: true  },
  'FormCollapse.CollapsePanel': { component: 'FormCollapse.CollapsePanel', decorator: undefined, fieldType: 'void', isLayout: true },
  Space:          { component: 'Space',           decorator: undefined,  fieldType: 'void',    isLayout: true  },
  Tabs:           { component: 'Tabs',            decorator: undefined,  fieldType: 'void',    isLayout: true  },
  'Tabs.TabPane': { component: 'Tabs.TabPane',    decorator: undefined,  fieldType: 'void',    isLayout: true  },
  Table:          { component: 'Table',            decorator: undefined,  fieldType: 'void',    isLayout: true  },
  TableRow:       { component: 'TableRow',          decorator: undefined,  fieldType: 'void',    isLayout: true  },
  TableCell:      { component: 'TableCell',         decorator: undefined,  fieldType: 'void',    isLayout: true  },
  TableColumn:    { component: 'ArrayTable.Column', decorator: undefined, fieldType: 'void',    isLayout: true  },
  'ArrayTable.Column': { component: 'ArrayTable.Column', decorator: undefined, fieldType: 'void', isLayout: true },
  ArrayTable:     { component: 'ArrayTable',       decorator: 'FormItem', fieldType: 'array',   isLayout: false },
  'ArrayTable.Index':    { component: 'ArrayTable.Index',    decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayTable.Addition': { component: 'ArrayTable.Addition', decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayTable.Remove':   { component: 'ArrayTable.Remove',   decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayTable.MoveUp':   { component: 'ArrayTable.MoveUp',   decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayTable.MoveDown': { component: 'ArrayTable.MoveDown', decorator: undefined, fieldType: 'void', isLayout: true },
  ArrayFixTable:  { component: 'ArrayFixTable',    decorator: 'FormItem', fieldType: 'array',   isLayout: false },
  'ArrayFixTable.Column':   { component: 'ArrayFixTable.Column',   decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayFixTable.RowTitle': { component: 'ArrayFixTable.RowTitle', decorator: undefined, fieldType: 'void', isLayout: true },
  Text:           { component: 'Text',            decorator: undefined,  fieldType: 'void',    isLayout: true  },
  FormattedText:  { component: 'FormattedText',   decorator: undefined,  fieldType: 'void',    isLayout: true  },
  'ArrayCards.Item': { component: 'ArrayCards.Item', decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayCards.Addition': { component: 'ArrayCards.Addition', decorator: undefined, fieldType: 'void', isLayout: true },
  'ArrayCards.Index': { component: 'ArrayCards.Index', decorator: undefined, fieldType: 'void', isLayout: true },
  ArrayCards:     { component: 'ArrayCards',       decorator: 'FormItem', fieldType: 'array',   isLayout: false },
};

function generateDesignableId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 11; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

let _idCounter = 0;

export { generateDesignableId };

export function buildComponent(spec: ComponentSpec): Record<string, unknown> {
  const defaults = COMPONENT_DEFAULTS[spec.type] ?? {
    component: spec.type,
    decorator: 'FormItem',
    fieldType: 'string',
    isLayout: false,
  };

  const node: Record<string, unknown> = {
    type: defaults.fieldType,
    name: spec.name,
  };

  node['x-designable-id'] = generateDesignableId();
  node['x-index'] = _idCounter++;

  if (defaults.isLayout) {
    // 布局组件：无 FormItem 装饰器，标题放 x-component-props.title
    node['x-component'] = defaults.component;
    const compProps: Record<string, unknown> = { ...(spec.componentProps ?? {}) };
    if (spec.title) {
      compProps['title'] = spec.title;
    }
    node['x-component-props'] = compProps;
  } else {
    // 表单组件：有 FormItem 装饰器，标题放 top-level title
    if (!spec.hideTitle && spec.title) {
      node['title'] = spec.title;
    }
    node['x-decorator'] = spec.decorator ?? defaults.decorator;
    node['x-component'] = defaults.component;
    node['x-validator'] = [];
    node['x-component-props'] = spec.componentProps ?? {};
    node['x-decorator-props'] = spec.hideTitle
      ? { feedbackLayout: 'none', colon: false, ...(spec.decoratorProps ?? {}) }
      : (spec.decoratorProps ?? {});

    // 选项类组件：options 放 enum 字段
    if (spec.enumOptions) {
      node['enum'] = spec.enumOptions;
    }

    if (spec.required) {
      node['required'] = true;
    }
  }

  if (spec.pattern) {
    node['x-pattern'] = spec.pattern;
  }

  if (spec.display && spec.display !== 'visible') {
    node['x-display'] = spec.display;
  }

  if (spec.default !== undefined) {
    node['default'] = spec.default;
  }

  if (spec.children) {
    node['properties'] = spec.children;
  }

  return node;
}

export function createEmptySchema(): { form: Record<string, unknown>; schema: Record<string, unknown> } {
  _idCounter = 0;
  return {
    form: { labelCol: 6, wrapperCol: 12, labelWrap: true },
    schema: { type: 'object', properties: {}, 'x-designable-id': generateDesignableId() },
  };
}

export function addComponentToSchema(
  schema: Record<string, unknown>,
  parentPath: string,
  component: Record<string, unknown>
): void {
  const key = (component['name'] as string) || `field_${Date.now()}`;
  if (!parentPath) {
    setSchemaChild(schema, key, component);
    return;
  }
  const parts = parentPath.split('.');
  let current: Record<string, unknown> = schema;
  for (const part of parts) {
    const child = getSchemaChild(current, part);
    if (!child) throw new Error(`路径 "${parentPath}" 中的 "${part}" 节点不存在`);
    current = child;
  }
  setSchemaChild(current, key, component);
}

export function findComponent(
  schema: Record<string, unknown>,
  path: string
): Record<string, unknown> | null {
  const parts = path.split('.');
  let current: Record<string, unknown> = schema;
  for (const part of parts) {
    const child = getSchemaChild(current, part);
    if (!child) return null;
    current = child;
  }
  return current;
}

export function removeComponent(schema: Record<string, unknown>, path: string): boolean {
  const parts = path.split('.');
  const last = parts.pop()!;
  let current: Record<string, unknown> = schema;
  for (const part of parts) {
    const child = getSchemaChild(current, part);
    if (!child) return false;
    current = child;
  }
  return deleteSchemaChild(current, last);
}

export function listComponents(
  schema: Record<string, unknown>,
  prefix = ''
): { path: string; name: string; type: string; title: string }[] {
  const result: { path: string; name: string; type: string; title: string }[] = [];
  const walk = (node: Record<string, unknown>, base: string) => {
    listSchemaChildren(node, (key, child) => {
      const path = base ? `${base}.${key}` : key;
      const component = (child['x-component'] as string) ?? 'unknown';
      const isLayout = !child['x-decorator'];
      const title = isLayout
        ? ((child['x-component-props'] as Record<string, unknown>)?.['title'] as string) ?? ''
        : (child['title'] as string) ?? '';
      result.push({ path, name: (child['name'] as string) ?? key, type: component, title });
      walk(child, path);
    });
  };
  walk(schema, prefix);
  return result;
}
