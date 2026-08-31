/**
 * 自增表格 / 固定行表格 Schema 骨架构建
 */

import { buildComponent, generateDesignableId } from './component-builder';

export interface ArrayTableColumnInput {
  /** @deprecated 请使用 columnTitle 作为列标识 */
  columnName?: string;
  columnTitle: string;
  fieldName: string;
  fieldType: 'Number' | 'Input' | 'TextArea' | 'DatePicker';
  pattern?: 'editable' | 'disabled' | 'readOnly';
  width?: number;
}

/** 构建 ArrayFixTable / ArrayTable 根节点公共元数据 */
function buildArrayTableRoot(
  name: string,
  title: string,
  component: 'ArrayFixTable' | 'ArrayTable',
  rowCount: number | undefined,
  colProps: Record<string, unknown>
): Record<string, unknown> {
  const componentProps = rowCount !== undefined ? { num: rowCount } : {};
  return {
    type: 'array',
    title,
    name,
    'x-decorator': 'FormItem',
    'x-component': component,
    'x-component-props': componentProps,
    'x-decorator-props': { layout: 'vertical' },
    'x-validator': [],
    'x-designable-id': generateDesignableId(),
    items: {
      type: 'object',
      'x-designable-id': generateDesignableId(),
      properties: colProps,
    },
  };
}

/** 构建表格列：列名用 columnTitle，字段名独立，避免预览崩溃 */
function buildTableColumn(
  columnType: 'ArrayTable.Column' | 'ArrayFixTable.Column',
  col: ArrayTableColumnInput
): Record<string, unknown> {
  const field = buildComponent({
    type: col.fieldType,
    name: col.fieldName,
    title: col.columnTitle,
    pattern: col.pattern,
    hideTitle: true,
  });
  const compProps: Record<string, unknown> = { title: col.columnTitle, align: 'center' };
  if (col.width) compProps.width = col.width;
  return buildComponent({
    type: columnType,
    name: col.columnTitle,
    title: col.columnTitle,
    componentProps: compProps,
    children: { [col.fieldName]: field },
  });
}

/** 构建自增表格（含序号、操作、添加按钮） */
export function buildArrayTableShell(
  name: string,
  title: string,
  columns: ArrayTableColumnInput[]
): Record<string, unknown> {
  const colProps: Record<string, unknown> = {};
  for (const col of columns) {
    colProps[col.columnTitle] = buildTableColumn('ArrayTable.Column', col);
  }
  colProps.indexCol = buildColumnWithChildren('indexCol', '序号', {
    index: buildComponent({ type: 'ArrayTable.Index', name: 'index', title: '序号' }),
  });
  colProps.opsCol = buildColumnWithChildren('opsCol', '操作', {
    removeBtn: buildComponent({ type: 'ArrayTable.Remove', name: 'removeBtn', title: '删除' }),
    moveDownBtn: buildComponent({ type: 'ArrayTable.MoveDown', name: 'moveDownBtn', title: '下移' }),
    moveUpBtn: buildComponent({ type: 'ArrayTable.MoveUp', name: 'moveUpBtn', title: '上移' }),
  });
  const table = buildArrayTableRoot(name, title, 'ArrayTable', undefined, colProps);
  table.properties = {
    addBtn: buildComponent({ type: 'ArrayTable.Addition', name: 'addBtn', title: '添加' }),
  };
  return table;
}

/** 构建固定行数表格骨架 */
export function buildArrayFixTableShell(
  name: string,
  title: string,
  rowCount: number,
  columns: ArrayTableColumnInput[],
  rowLabels?: string[]
): Record<string, unknown> {
  const colProps: Record<string, unknown> = {};
  if (rowLabels?.length) {
    colProps.rowTitle = buildComponent({
      type: 'ArrayFixTable.RowTitle',
      name: 'rowTitle',
      title: '行标题',
      componentProps: { titleList: rowLabels.join('\n') },
    });
  }
  for (const col of columns) {
    colProps[col.columnTitle] = buildTableColumn('ArrayFixTable.Column', col);
  }
  return buildArrayTableRoot(name, title, 'ArrayFixTable', rowCount, colProps);
}

function buildColumnWithChildren(
  name: string,
  title: string,
  children: Record<string, unknown>
): Record<string, unknown> {
  return buildComponent({
    type: 'ArrayTable.Column',
    name,
    title,
    componentProps: { title, align: 'center' },
    children,
  });
}
