/**
 * Formily Schema 构建器单元测试
 */

import { describe, expect, it } from 'vitest';
import { buildComponent, createEmptySchema, listComponents } from './component-builder';
import { buildArrayTableShell } from './array-builders';

describe('ELN Schema 构建器', () => {
  it('createEmptySchema 返回空 properties', () => {
    const schema = createEmptySchema();
    expect(schema.form.labelCol).toBe(6);
    expect(schema.schema.properties).toEqual({});
  });

  it('buildComponent 生成带 x-component 的 Input 节点', () => {
    const node = buildComponent({ type: 'Input', name: 'sampleNo', title: '样品编号' });
    expect(node['x-component']).toBe('Input');
    expect(node.name).toBe('sampleNo');
    expect(node.title).toBe('样品编号');
  });

  it('buildArrayTableShell 包含列与添加按钮', () => {
    const table = buildArrayTableShell('dataTable', '检测数据', [
      { columnTitle: '序号', fieldName: 'seq', fieldType: 'Input' },
    ]);
    expect(table['x-component']).toBe('ArrayTable');
    const items = table.items as Record<string, unknown>;
    const props = items.properties as Record<string, unknown>;
    expect(props['序号']).toBeDefined();
    expect(table.properties).toBeDefined();
  });

  it('listComponents 能遍历嵌套 Card', () => {
    const schema = createEmptySchema();
    const card = buildComponent({
      type: 'Card',
      name: 'basicInfo',
      title: '基本信息',
      children: {
        sampleNo: buildComponent({ type: 'Input', name: 'sampleNo', title: '样品编号' }),
      },
    });
    schema.schema.properties = { basicInfo: card };
    const list = listComponents(schema.schema as Record<string, unknown>);
    expect(list.some((c: { path: string }) => c.path === 'basicInfo.sampleNo')).toBe(true);
  });
});
