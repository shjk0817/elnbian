/**
 * 编辑页组件库目录（与平台设计器左侧组件面板一致）
 */

export interface ComponentCatalogEntry {
  type: string;
  xComponent: string;
  category: string;
  fieldType: string;
  notes: string;
}

/** 返回 MCP add_component 可用的类型清单 */
export function getComponentCatalog(): ComponentCatalogEntry[] {
  return [
    { type: 'Input', xComponent: 'Input', category: '表单组件', fieldType: 'string', notes: '单行文本' },
    { type: 'TextArea', xComponent: 'Input.TextArea', category: '表单组件', fieldType: 'string', notes: '多行文本' },
    { type: 'Number', xComponent: 'NumberPicker', category: '表单组件', fieldType: 'number', notes: '数字，结果列用 pattern=disabled' },
    { type: 'Select', xComponent: 'Select', category: '表单组件', fieldType: 'string', notes: 'componentProps.options 或 enum' },
    { type: 'Switch', xComponent: 'Switch', category: '表单组件', fieldType: 'boolean', notes: '开关' },
    { type: 'Slider', xComponent: 'Slider', category: '表单组件', fieldType: 'number', notes: '滑块' },
    { type: 'DatePicker', xComponent: 'DatePicker', category: '表单组件', fieldType: 'string', notes: '检测日期字段' },
    { type: 'DatePicker.RangePicker', xComponent: 'DatePicker.RangePicker', category: '表单组件', fieldType: 'array', notes: '日期范围' },
    { type: 'TimePicker', xComponent: 'TimePicker', category: '表单组件', fieldType: 'string', notes: '时间' },
    { type: 'TimePicker.RangePicker', xComponent: 'TimePicker.RangePicker', category: '表单组件', fieldType: 'array', notes: '时间范围' },
    { type: 'Radio', xComponent: 'Radio.Group', category: '表单组件', fieldType: 'string', notes: '单选，传 options' },
    { type: 'Checkbox', xComponent: 'Checkbox.Group', category: '表单组件', fieldType: 'array', notes: '多选' },
    { type: 'TreeSelect', xComponent: 'TreeSelect', category: '表单组件', fieldType: 'string', notes: '树选择 treeData' },
    { type: 'Cascader', xComponent: 'Cascader', category: '表单组件', fieldType: 'array', notes: '级联 options' },
    { type: 'Transfer', xComponent: 'Transfer', category: '表单组件', fieldType: 'array', notes: '穿梭框 dataSource' },
    { type: 'Card', xComponent: 'Card', category: '布局组件', fieldType: 'void', notes: '卡片容器，子组件用 parentPath' },
    { type: 'FormGrid', xComponent: 'FormGrid', category: '布局组件', fieldType: 'void', notes: '网格，minColumns/maxColumns' },
    { type: 'Tabs', xComponent: 'Tabs', category: '布局组件', fieldType: 'void', notes: '子节点 Tabs.TabPane' },
    { type: 'Tabs.TabPane', xComponent: 'Tabs.TabPane', category: '布局组件', fieldType: 'void', notes: 'componentProps.tab' },
    { type: 'FormLayout', xComponent: 'FormLayout', category: '布局组件', fieldType: 'void', notes: 'labelCol/wrapperCol' },
    { type: 'FormCollapse', xComponent: 'FormCollapse', category: '布局组件', fieldType: 'void', notes: '子节点 CollapsePanel' },
    { type: 'FormCollapse.CollapsePanel', xComponent: 'FormCollapse.CollapsePanel', category: '布局组件', fieldType: 'void', notes: 'header 标题' },
    { type: 'Space', xComponent: 'Space', category: '布局组件', fieldType: 'void', notes: '横向间距容器' },
    { type: 'Table', xComponent: 'Table', category: '布局组件', fieldType: 'void', notes: '表单内矩阵，非 x-spreadsheet' },
    { type: 'TableRow', xComponent: 'TableRow', category: '布局组件', fieldType: 'void', notes: '表格行' },
    { type: 'TableCell', xComponent: 'TableCell', category: '布局组件', fieldType: 'void', notes: '单元格' },
    { type: 'ArrayTable', xComponent: 'ArrayTable', category: '自增组件', fieldType: 'array', notes: '建议用 init_array_table' },
    { type: 'ArrayFixTable', xComponent: 'ArrayFixTable', category: '自增组件', fieldType: 'array', notes: '建议用 init_array_fix_table' },
    { type: 'ArrayCards', xComponent: 'ArrayCards', category: '自增组件', fieldType: 'array', notes: '复杂结构建议 set_full_schema' },
    { type: 'Text', xComponent: 'Text', category: '展示组件', fieldType: 'void', notes: 'componentProps.content 公式说明' },
    { type: 'FormattedText', xComponent: 'FormattedText', category: '展示组件', fieldType: 'void', notes: '格式化展示' },
  ];
}
