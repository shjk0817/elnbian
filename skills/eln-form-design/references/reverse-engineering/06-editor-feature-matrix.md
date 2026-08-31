# 模板编辑功能 → MCP 工具映射表

> 实测日期：2026-08-26 | 测试分类 categoryId=50 | 样本模板 298/271

## Tab 1 表单搭建

| UI 功能 | MCP 工具 | 状态 |
|---------|---------|------|
| 29 种组件 | add_component, list_component_types | ✅ |
| 大纲树 | list_components | ✅ |
| 删除 | remove_component | ✅ |
| 复制/移动/排序 | copy_component, move_component, reorder_component | ✅ |
| 字段/组件属性 | set_property | ✅ |
| 可选项 | set_enum_options | ✅ |
| 校验规则 | set_validator, remove_validator | ✅ |
| 响应器 | set_reactions, remove_reactions | ✅ |
| 表单级设置 | set_form_settings | ✅ |
| FormGrid 加列 | add_grid_column | ✅ |
| 自增/固定行表格 | init_array_table, init_array_fix_table | ✅ |
| 表单内矩阵 | init_form_table | ✅ |
| 完整 Schema | get_schema, set_full_schema | ✅ |
| 撤销/重做 | — | 不实现 |

## Tab 2 数据配置

| UI 功能 | MCP 工具 | 状态 |
|---------|---------|------|
| 公式 CRUD | add_formula, update_formula, list_formulas, remove_formula | ✅ |
| 公式排序 | reorder_formulas | ✅ |
| 输出值 | add/update/list/remove_output_item | ✅ |
| 检测日期 | set_detection_date, add/remove/list_detection_date_item | ✅ |
| 22 函数 | list_expression_functions | ✅ |
| 整体 extra | get_data_config, set_full_extra_config | ✅ |

## Tab 3 表格搭建

| UI 功能 | MCP 工具 | 状态 |
|---------|---------|------|
| 单元格文本 | set_spreadsheet_cell | ✅ |
| 绑定字段 | bind_cell_data | ✅ |
| 绑定循环 | bind_cell_loop | ✅ |
| 样式/合并/行列 | set_cell_style, merge_cells, insert_row, delete_row | ✅ |
| 整体表格 | get/set_table_template | ✅ |

## Tab 4 + 顶栏

| UI 功能 | MCP 工具 | 状态 |
|---------|---------|------|
| 本地校验 | validate_template | ✅ |
| 外部分享预览 | create_preview_session | ✅ |
| 保存 | save_template | ✅ |
| 受控编号 | set_controlled_no | ✅ |
| 启用/提交 | — | **禁止** |

## 核心 API

- 保存：`PATCH /form-template-version/{versionId}` body `{ formTemplateJson, tableTemplateJson, extra }`
- 受控编号：`PATCH /form-template-version/{versionId}` body `{ controlledNo }`
- 预览：`POST /template-preview/session` body `{ templateId, versionId }`
