# 建科助手 — Agent 工具参考

> 自动生成：运行 node scripts/generate-tools-doc.mjs（请勿手改表格内容，改工具定义的 description 后重新生成）

扩展在每次对话中向 AI 提供以下工具。命名约定：

| 前缀 | 来源 |
| :--- | :--- |
| （无前缀） | Cebian 浏览器 / VFS / Skill 工具 |
| `eln__` | 建科 ELN 内置 API 工具 |
| `lims__` | 建科 LIMIS 内置 ASHX 工具 |
| `mcp__<服务器>__<工具>` | 用户在 **设置 → MCP 服务器** 中配置的外部 MCP 工具（动态发现） |

使用前请先在 **设置 → ELN 连接** / **LIMIS 连接** 完成登录态同步。

---

## 浏览器与通用工具（19）

| 工具名 | 说明 |
| :--- | :--- |
| `ask_user` | 暂停对话并向用户提问（选择题/确认） |
| `read_page` | 读取当前标签页内容（markdown / article / text / html / outline） |
| `execute_js` | 在活动标签页执行 JavaScript 并返回结果 |
| `interact` | 模拟点击、输入、滚动、等待等页面交互 |
| `inspect` | 获取 DOM 结构快照，便于发现选择器 |
| `tab` | 打开/关闭/切换/刷新标签页，列出 iframe |
| `screenshot` | 截取当前标签页可见区域 |
| `pdf` | 读取或搜索已打开 PDF 标签页（pdf.js） |
| `fs_create_file` | 在会话虚拟文件系统（VFS）创建文件 |
| `fs_edit_file` | 按字符串替换编辑 VFS 文件 |
| `fs_read_file` | 读取 VFS 文件（含内置 Skill 参考文档） |
| `fs_list` | 列出 VFS 目录 |
| `fs_search` | 按文件名或内容搜索 VFS |
| `fs_mkdir` | 创建 VFS 目录 |
| `fs_rename` | 重命名或移动 VFS 路径 |
| `fs_delete` | 删除 VFS 文件或目录 |
| `fs_save_url` | 下载 URL 内容保存到 VFS |
| `run_skill` | 执行已安装 Skill 脚本（声明的 chrome.* 权限） |
| `chrome_api` | 调用白名单内的 Chrome 扩展 API |

## ELN — 认证

| 工具名 | 说明 |
| :--- | :--- |
| `eln__check_auth` | 检查 ELN JWT 是否有效 |
| `eln__sync_auth` | 从已登录 ELN 标签页同步 JWT |

## ELN — 查询（只读）

| 工具名 | 说明 |
| :--- | :--- |
| `eln__list_templates` | 分页查询模板列表。可按分类筛选或按名称搜索。返回每个模板的 ID、名称、状态、版本等信息。 |
| `eln__get_template_detail` | 获取模板完整详情，含版本信息（草稿版本、当前版本、启用版本）。不加载到编辑会话，仅查看。 |
| `eln__list_categories` | 获取所有检测分类列表。创建模板时需要 categoryId。 |
| `eln__get_category_tree` | 获取完整的分类树结构，包含分类 → 样品的层级关系。 |
| `eln__list_samples` | 查询指定分类下的样品列表。创建模板时需要知道样品属于哪个分类。 |
| `eln__search_templates` | 搜索模板（GET /form-template/search）。支持 categoryId、name 筛选。 |
| `eln__list_submission_logs` | 分页查询提交日志。返回提交类型、创建者、任务 ID 等信息。 |


## ELN — 模板生命周期

| 工具名 | 说明 |
| :--- | :--- |
| `eln__create_template` | 创建新模板并选中为当前编辑模板。需先 login。 |
| `eln__select_template` | 选择模板并加载 Schema/extra/table 到内存。 |
| `eln__copy_template` | 复制模板并选中新模板。 |
| `eln__delete_template` | 删除指定模板。 |
| `eln__save_template` | PATCH 保存 formTemplateJson + extra + tableTemplateJson。 |
| `eln__set_controlled_no` | 设置受控编号（需全局唯一）。 |
| `eln__update_template_metadata` | PATCH 更新 remark/spec/testingItemName，不改 Schema。 |
| `eln__list_template_versions` | GET 版本历史列表。 |


## ELN — 表单 Schema（Tab1）

| 工具名 | 说明 |
| :--- | :--- |
| `eln__add_component` | 向当前表单添加一个组件。支持完整的 ELN 组件体系： - 表单组件: Input, Number, TextArea, Select, DatePicker, DatePicker.RangePicker, TimePicker, TimePicker.RangePicker, Switch, Radio, Checkbox, Slider, TreeSelect, Cascader, Transfer - 容器/布局: Card, FormGrid, FormGrid.GridColumn, FormLayout, FormCollapse, FormCollapse.CollapsePanel, Space, Tabs, Tabs.TabPane - 表格类: Table, TableRow, TableCell, ArrayTable, ArrayTable.Column, ArrayTable.Index, ArrayFixTable, ArrayFixTable.Column, ArrayFixTable.RowTitle - 展示/数组: Text, FormattedText, ArrayCards 容器组件可包含子组件，通过 parentPath 指定父级路径。 详细属性配置请参考 Skill 文件: eln-component-catalog |
| `eln__set_property` | 修改已添加组件的属性。可设置任意 x-component-props 或 x-decorator-props 字段。 属性名映射请参考 Skill 文件: formily-schema-guide.md |
| `eln__get_schema` | 获取当前会话的完整 Formily Schema JSON。用于检查当前表单结构。 |
| `eln__set_full_schema` | 直接设置完整的 Formily Schema JSON。适用于从已有模板复制 Schema 或 AI 一次性生成完整表单结构。会覆盖之前所有细粒度操作。 |
| `eln__remove_component` | 从当前表单中删除指定组件。支持删除容器组件（会连同子组件一起删除）。 |
| `eln__list_components` | 列出当前表单中所有组件的树形结构。每个组件显示路径、标识、类型和标题。 |
| `eln__reset_schema` | 清空当前表单 Schema，重新开始设计。注意：不影响已保存到服务器的数据。 |
| `eln__list_component_types` | 列出编辑页组件库全部类型（与平台设计器左侧面板一致）。add_component 的 type 参数从此列表选择。 |
| `eln__set_form_settings` | 设置表单级属性（右侧「表单」面板）：labelCol、wrapperCol、labelWrap、layout 等。 |
| `eln__init_array_table` | 创建自增表格骨架（含序号/操作列、添加按钮）。列内字段路径形如 tableName.colName.fieldName。 |
| `eln__init_array_fix_table` | 创建固定行数表格骨架。适用于平行测定等固定行场景。 |
| `eln__set_enum_options` | 设置 Select/Radio/Checkbox 的可选项（enum 字段）。 |
| `eln__set_validator` | 添加校验规则到 x-validator 数组。 |
| `eln__remove_validator` | 按索引删除 x-validator 规则。 |
| `eln__set_reactions` | 设置 x-reactions 响应器规则。 |
| `eln__remove_reactions` | 删除字段的 x-reactions。 |
| `eln__copy_component` | 复制组件子树到新 name，可指定新 parentPath。 |
| `eln__move_component` | 将组件移动到新的 parentPath（先删后加）。 |
| `eln__reorder_component` | 设置组件 x-index 排序值。 |
| `eln__add_grid_column` | 向 FormGrid 添加 GridColumn 子节点。 |
| `eln__init_form_table` | 创建表单内 Table/TableRow/TableCell 矩阵布局。 |


## ELN — 数据配置（Tab2）

| 工具名 | 说明 |
| :--- | :--- |
| `eln__add_formula` | 添加或更新计算公式。ELN 内置 22 个函数。详细语法见 Skill: expression-engine.md |
| `eln__list_formulas` | 列出当前会话中所有计算公式。 |
| `eln__remove_formula` | 按 ID 删除计算公式。 |
| `eln__update_formula` | 按 ID 更新已有公式。 |
| `eln__reorder_formulas` | 按 ID 顺序重排 expressionItems。 |
| `eln__list_expression_functions` | 列出 ELN 表达式引擎 22 个内置函数。 |
| `eln__add_output_item` | 添加或更新输出值。名称格式: raw##{卡片标题}-{字段标题}##{字段名} |
| `eln__list_output_items` | 列出当前会话中所有输出值配置。 |
| `eln__remove_output_item` | 按 ID 删除输出值配置。 |
| `eln__update_output_item` | 按 ID 更新输出值 name。 |
| `eln__set_detection_date` | 设置检测日期全局策略（missingPolicy、outputFormat）。不修改已有 items，除非传入 items 全量替换。 |
| `eln__add_detection_date_item` | 添加一条检测日期字段绑定（DatePicker / DatePicker.RangePicker）。 |
| `eln__remove_detection_date_item` | 删除一条检测日期配置项。 |
| `eln__set_full_extra_config` | 一次性设置完整 extra（expressionItems、outputItems、detectionDateConfig）。覆盖此前数据配置。 |
| `eln__list_detection_date_items` | 列出当前检测日期配置项。 |
| `eln__get_data_config` | 获取当前会话完整数据配置（公式、输出值、检测日期）。 |


## ELN — 表格模板（Tab3）

| 工具名 | 说明 |
| :--- | :--- |
| `eln__set_table_template` | 设置完整的表格模板 JSON（x-spreadsheet 格式）。通常用于从已有模板复制表格配置。详细表格结构请参考 Skill 文件: table-building.md。 |
| `eln__get_table_template` | 获取当前会话中的表格模板 JSON。 |
| `eln__bind_cell_data` | 将表格单元格绑定到表单字段。绑定后单元格的值会随表单字段自动更新。 |
| `eln__set_spreadsheet_cell` | 设置 x-spreadsheet 单元格文本（表格搭建 Tab）。行/列从 0 开始。 |
| `eln__bind_cell_loop` | 绑定单元格区域到 ArrayTable 等循环数据（bind_loop）。 |
| `eln__set_cell_style` | 设置单元格样式索引或样式属性。 |
| `eln__merge_cells` | 合并单元格区域。 |
| `eln__insert_row` | 在指定行索引插入空行。 |
| `eln__delete_row` | 删除指定行。 |


## ELN — 预览与会话

| 工具名 | 说明 |
| :--- | :--- |
| `eln__validate_template` | 检查当前会话 Schema/extra 完整性（本地校验，非 UI 预览）。 |
| `eln__create_preview_session` | POST /template-preview/session 生成外部分享预览 token。 |
| `eln__get_session` | 查看当前编辑会话：模板 ID、版本 ID、组件数、公式数等。设计前/保存前用于确认状态。 |


## ELN — 已禁用（8，不可调用）

| 工具名 | 说明 |
| :--- | :--- |
| `eln__activate_template` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__initiate_change` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__commit_form` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__commit_task` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__submit_form_data` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__submit_detection` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__mobile_commit_form` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |
| `eln__mobile_commit_task` | **已禁用**（扩展层拦截，防止误启用/提交生产数据） |


## LIMIS — 认证

| 工具名 | 说明 |
| :--- | :--- |
| `lims__check_auth` | 检查 LIMIS Cookie 会话是否有效 |
| `lims__sync_auth` | 从已登录 LIMIS 标签页同步 Cookie |


## LIMIS — 用户与首页

| 工具名 | 说明 |
| :--- | :--- |
| `lims__get_user_info` | 获取当前 LIMIS 登录用户名。 |
| `lims__get_dashboard_counts` | 获取 LIMIS 首页统计：报告待复核/待审核/待批准/已退回数量等（GetReportNum）。 |
| `lims__get_menu` | 获取 LIMIS 侧边栏菜单（GetMenuList_New）。服务端返回 HTML 片段而非 JSON；工具会解析为链接列表。 |
| `lims__get_business_info` | 工作流业务类型（GetBusinessInfo）。 |


## LIMIS — 综合查询与业务图

| 工具名 | 说明 |
| :--- | :--- |
| `lims__search_integrated` | LIMIS 综合查询（GetIntegratedQueryInfo）。可按委托号、样品号、报告号等筛选。 |
| `lims__resolve_business_graph` | 按任意标识（委托号/样品号/报告号/委托ID/详情页URL）解析完整 LIMIS 业务图：委托、任务、样品、报告、附件链接。 |
| `lims__get_task_info` | 按委托单 ID 查询任务链（GetTaskInfo），含 sampleId、任务状态等。 |
| `lims__list_reports` | 查询检测报告列表（ReportAudtiByType），返回 reportUrl、reportApprovalStatus 等。至少传一种：委托号/样品号/报告号。 |


## LIMIS — 委托 / 样品 / 任务

| 工具名 | 说明 |
| :--- | :--- |
| `lims__list_testing_orders` | 分页查询委托列表（GetTestingOrderList）。 |
| `lims__count_samples_by_order` | 按委托统计样品/任务数量（GetTaskInfo）。勿用 SamplesCountBytestingOrderNo（需 testingOrderId 且为提交校验，传委托号会 SQL 报错）。 |
| `lims__list_samples` | 获取样品基础列表（GetSamplesBaseList）；大列表请在结果中按委托号/样品号自行过滤。 |
| `lims__list_tasks` | 任务列表（GetTaskList）。该接口常返回空体；无数据时等价于 []。需要更全字段请用 list_task_management。 |
| `lims__list_task_management` | 任务管理视图列表（GetTaskManagementList），字段比 GetTaskList 更全。 |
| `lims__get_task_detail` | 任务详情（GetTaskInfo，按委托 ID）。239 上 GetTaskDetail 常返回空；可传 testing_order_no + task_id 精确定位。 |
| `lims__get_testing_mechanisms` | 检测机构下拉（GettestingInstitute）。 |
| `lims__get_select_options` | LIMIS 字典下拉（GetSelectList）。name 如 testCatatory（业务类别）、testingInstitute（检测机构）、taskStatus（任务状态）。 |


## LIMIS — 待办与原始记录

| 工具名 | 说明 |
| :--- | :--- |
| `lims__list_todos` | 统一待办列表（GetToDoList1）。 |
| `lims__list_original_record_approvals` | LIMIS 电子原始记录审批列表（GetExperimentApprovalList），非 ELN API。 |


## LIMIS — 报告签批（写）

| 工具名 | 说明 |
| :--- | :--- |
| `lims__report_review_agree` | — |
| `lims__report_review_disagree` | — |
| `lims__report_audit_agree` | — |
| `lims__report_audit_disagree` | — |
| `lims__report_approve_agree` | — |
| `lims__report_approve_disagree` | — |
| `lims__report_back_task_delete` | 【检测报告·退回任务并删报告】BackTask，高危不可逆。勿用于复核/审核/批准选「不同意」（那用 report_*_disagree）。 |


## LIMIS — 其它写操作

| 工具名 | 说明 |
| :--- | :--- |
| `lims__submit_testing_order` | 提交委托审批（submitTestingorderBefore）。超期提交须填 overdue_remark。高危：会改变委托状态。 |
| `lims__delete_testing_order` | 删除委托（DelOrder）。不可逆，仅可删特定状态委托。 |
| `lims__return_original_record_approval` | 【电子原始记录·审批退回】Experiment.ashx ReturnExperimentApproval。对象是 ELN 原始记录审批单，不是检测报告签批（勿用 report_*_disagree）。 |
| `lims__delete_original_record_approval` | 删除 LIMIS 手动上传类原始记录审批条目（DeleteExperimentApproval）。 |
| `lims__pause_task` | 处理任务暂停申请（PauseEnter）。 |
| `lims__restore_task` | 恢复已暂停任务（RestoreEnter）。 |
| `lims__export_integrated` | 导出综合查询结果（IntegratedQuery.ashx → ExportInfo），rows 为查询结果行数组。 |
| `lims__submit_cancel_todo` | 取消已退回待办提醒（TaskService_new.ashx → SubmitCancel）。 |


## 外部 MCP 工具（动态）

在 **设置 → MCP 服务器** 添加 Streamable HTTP 或 SSE 端点后，扩展会自动发现并注册工具。

- **命名**：`mcp__<服务器_slug>__<远程工具名>`（slug 由服务器显示名规范化而来）
- **可见性**：遵循 MCP Apps 规范，`_meta.ui.visibility` 不含 `model` 的工具不会对 AI 暴露
- **示例**：若配置名为 `eln-form-design` 的 MCP 服务并提供 `create_template`，则工具名为 `mcp__eln_form_design__create_template`

具体工具列表与参数以各 MCP 服务的 `tools/list` 响应为准；在对话中可让 AI「列出当前可用 MCP 工具」。

---

## 内置斜杠提示词

| 提示词 | 用途 |
| :--- | :--- |
| `/eln-新建模板` | 从原始记录新建 ELN 检测模板 |
| `/eln-编辑模板` | 修改已有模板 Schema / 公式 / 表格 |
| `/eln-查询模板` | 搜索并解读模板 |
| `/eln-模板统计` | 分类、样品、模板数量统计 |
| `/lims-报告审核` | LIMIS 报告与原始记录交叉审核 |
| `/lims-周报月报` | 委托与报告周报/月报 |
| `/lims-事项提醒` | 待办、临期设备与标准提醒 |
| `/lims-查询报告` | 按委托号/报告号等查询报告 |

---

## 相关文档

- ELN 编辑工作流 Skill：`skills/eln-form-design/SKILL.md`
- UI → 工具映射：`skills/eln-form-design/references/reverse-engineering/06-editor-feature-matrix.md`
- LIMIS 报告签批说明：`lib/lims/report-audit-spec.ts`
