---
name: eln-form-design
description: >-
  建科 ELN 模板编辑工作流。用于在模板编辑页新建/修改检测表单：查分类样品、eln__create_template、
  搭建 Formily Schema、配置公式/输出值/检测日期、eln__save_template、eln__set_controlled_no、
  预览校验。涉及环刀法、ArrayTable、Formily、受控编号时使用。
metadata:
  matched-url: "http://10.1.228.52/design/table/template-design*"
  version: "1.1.0"
---

# ELN 表单设计工作流（建科ELN助手内置）

## 参考文档（动手前必读）

编辑模板前，**先用 `fs_read_file` 读取**本 Skill 目录下 `references/` 中的文档（路径根：`~/.cebian/skills/eln-form-design/references/`）：

| 文件 | 用途 |
|------|------|
| `references/wiki/模板编辑.md` | 完整编辑 Wiki：Tab 结构、数据结构、表达式、API、常见模式 |
| `references/reverse-engineering/06-editor-feature-matrix.md` | UI 功能 → `eln__*` 工具映射表 |
| `references/api-samples/full-template-298.json` | 真实完整模板 JSON 样本（环刀法 298 号） |

遇到 Schema 白屏、公式写法、表格绑定等问题时，**先查 Wiki 再改**，不要凭猜测调用工具。

---

## 何时使用

- 用户要在 ELN **模板编辑页**（`/design/table/template-design`）新建/改模板
- 用户提供 Word/PDF 原始记录，需要逆向为电子模板
- 需要调用 `eln__*` 内置工具编辑模板

**不在范围**：检测记录填写、LIMS 提交、模板启用（`eln__activate_template` 已禁用）。

---

## 认证（Cebian 内置，无需 MCP 配置）

1. 用户在浏览器打开 `http://10.1.228.52` 并登录 ELN
2. 调用 `eln__sync_auth` 同步登录态（或设置 → ELN 连接 → 同步）
3. 调用 `eln__check_auth` 确认 token 有效

固定 API：`http://10.1.228.52:13002/api/v1`

---

## 硬约束（程序拦截）

| 允许 | 禁止 |
|------|------|
| `eln__create_template` / `eln__save_template` / `eln__set_controlled_no` | `activate_template`（无 eln__ 前缀，已拦截） |
| 任意有权限的分类下编辑 | `initiate_change`、检测记录提交类工具 |
| 草稿模板全流程 | 对已启用模板直接改 Schema |

---

## 标准流程

### 0. 理解原始记录

1. 提取：表头字段、主表列、公式链、页脚、受控编号
2. `eln__list_categories` → `eln__list_samples` → `eln__list_templates` / `eln__search_templates`
3. 确定 **分类 + 样品 + 模板名 + 标准**

### 1. 登录与选中

```
eln__sync_auth
→ eln__create_template(...) 或 eln__select_template(templateId)
→ eln__get_template_detail
```

### 2. Tab1 表单搭建

**推荐 Card 顺序**：基本信息 → 样品状况与设备 → 检测数据 → 汇总结果

**增量**：`eln__add_component` → `eln__set_property` → `eln__init_array_table`

**批量**：`eln__set_full_schema`

### 3. Tab2 数据配置

```
eln__add_formula / eln__update_formula
eln__add_output_item
eln__set_detection_date
eln__add_detection_date_item
→ eln__save_template
```

### 4. Tab3 表格（可选）

```
eln__set_spreadsheet_cell / eln__bind_cell_data / eln__bind_cell_loop
→ eln__save_template
```

### 5. 落库与验证

```
eln__save_template
→ eln__set_controlled_no
→ eln__validate_template
→ 编辑器预览 Tab 目视确认
```

---

## Schema 规范（违反会导致预览白屏）

### ArrayTable / ArrayFixTable

| 层级 | 规则 |
|------|------|
| 列节点 `name` | 用 **columnTitle**（如 `样品编号`） |
| 列内字段 `name` | 用 **独立 fieldName**（如 `sampleNo`），不得与列名相同 |
| 表格根节点 | 必须有 `x-designable-id`、`x-validator: []` |

### 禁止 / 慎用

| 项 | 后果 |
|----|------|
| `ArrayFixTable.RowTitle` | 预览 Tab 白屏 |
| 列名 = 字段名 | Formily 渲染崩溃 |

---

## 工具速查

所有工具以 `eln__` 前缀调用，例如 `eln__list_categories`。

| 模块 | 代表工具 |
|------|----------|
| auth | `eln__check_auth`, `eln__sync_auth` |
| query | `eln__list_categories`, `eln__list_samples`, `eln__search_templates` |
| template | `eln__create_template`, `eln__save_template`, `eln__set_controlled_no` |
| form | `eln__add_component`, `eln__init_array_table`, `eln__get_schema` |
| data | `eln__add_formula`, `eln__set_detection_date` |
| table | `eln__set_spreadsheet_cell`, `eln__bind_cell_data` |
| preview | `eln__validate_template` |
| session | `eln__get_session` |
