#!/usr/bin/env node
/**
 * 从工具定义源码生成 docs/TOOLS.md
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'TOOLS.md');

const BLOCKED_ELN = new Set([
  'activate_template', 'initiate_change', 'commit_form', 'commit_task',
  'submit_form_data', 'submit_detection', 'mobile_commit_form', 'mobile_commit_task',
]);

/** 解析 definition 文件中的 name + description */
function extractFromSource(source) {
  const items = [];
  const blocks = source.split(/\{\s*\n\s*name:\s*'/);
  for (let i = 1; i < blocks.length; i++) {
    const nameMatch = blocks[i].match(/^([^']+)'/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const rest = blocks[i];
    const descMatch = rest.match(/description:\s*(?:\n\s*)?(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/);
    const desc = (descMatch?.[1] ?? descMatch?.[2] ?? descMatch?.[3] ?? '').replace(/\s+/g, ' ').trim();
    if (desc) items.push({ name, desc });
  }
  return items;
}

async function readDefs(dir) {
  const items = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) items.push(...await readDefs(p));
    else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.test.ts')) {
      const src = await fs.readFile(p, 'utf8');
      items.push(...extractFromSource(src));
    }
  }
  return items;
}

function mdTable(rows) {
  const lines = ['| 工具名 | 说明 |', '| :--- | :--- |'];
  for (const { name, desc } of rows) {
    lines.push(`| \`${name}\` | ${desc.replace(/\|/g, '\\|')} |`);
  }
  return lines.join('\n');
}

function section(title, rows) {
  return `## ${title}\n\n${mdTable(rows)}\n\n`;
}

const BROWSER_TOOLS = [
  { name: 'ask_user', desc: '暂停对话并向用户提问（选择题/确认）' },
  { name: 'read_page', desc: '读取当前标签页内容（markdown / article / text / html / outline）' },
  { name: 'execute_js', desc: '在活动标签页执行 JavaScript 并返回结果' },
  { name: 'interact', desc: '模拟点击、输入、滚动、等待等页面交互' },
  { name: 'inspect', desc: '获取 DOM 结构快照，便于发现选择器' },
  { name: 'tab', desc: '打开/关闭/切换/刷新标签页，列出 iframe' },
  { name: 'screenshot', desc: '截取当前标签页可见区域' },
  { name: 'pdf', desc: '读取或搜索已打开 PDF 标签页（pdf.js）' },
  { name: 'fs_create_file', desc: '在会话虚拟文件系统（VFS）创建文件' },
  { name: 'fs_edit_file', desc: '按字符串替换编辑 VFS 文件' },
  { name: 'fs_read_file', desc: '读取 VFS 文件（含内置 Skill 参考文档）' },
  { name: 'fs_list', desc: '列出 VFS 目录' },
  { name: 'fs_search', desc: '按文件名或内容搜索 VFS' },
  { name: 'fs_mkdir', desc: '创建 VFS 目录' },
  { name: 'fs_rename', desc: '重命名或移动 VFS 路径' },
  { name: 'fs_delete', desc: '删除 VFS 文件或目录' },
  { name: 'fs_save_url', desc: '下载 URL 内容保存到 VFS' },
  { name: 'run_skill', desc: '执行已安装 Skill 脚本（声明的 chrome.* 权限）' },
  { name: 'chrome_api', desc: '调用白名单内的 Chrome 扩展 API' },
];

const ELN_GROUPS = {
  '认证': ['check_auth', 'sync_auth'],
  '查询（只读）': [
    'list_templates', 'get_template_detail', 'list_categories', 'get_category_tree',
    'list_samples', 'search_templates', 'list_submission_logs',
  ],
  '模板生命周期': [
    'create_template', 'select_template', 'copy_template', 'delete_template',
    'save_template', 'set_controlled_no', 'update_template_metadata', 'list_template_versions',
  ],
  '表单 Schema（Tab1）': [
    'add_component', 'set_property', 'get_schema', 'set_full_schema', 'remove_component',
    'list_components', 'reset_schema', 'list_component_types', 'set_form_settings',
    'init_array_table', 'init_array_fix_table', 'set_enum_options', 'set_validator',
    'remove_validator', 'set_reactions', 'remove_reactions', 'copy_component',
    'move_component', 'reorder_component', 'add_grid_column', 'init_form_table',
  ],
  '数据配置（Tab2）': [
    'add_formula', 'list_formulas', 'remove_formula', 'update_formula', 'reorder_formulas',
    'list_expression_functions', 'add_output_item', 'list_output_items', 'remove_output_item',
    'update_output_item', 'set_detection_date', 'add_detection_date_item',
    'remove_detection_date_item', 'set_full_extra_config', 'list_detection_date_items',
    'get_data_config',
  ],
  '表格模板（Tab3）': [
    'set_table_template', 'get_table_template', 'bind_cell_data', 'set_spreadsheet_cell',
    'bind_cell_loop', 'set_cell_style', 'merge_cells', 'insert_row', 'delete_row',
  ],
  '预览与会话': ['validate_template', 'create_preview_session', 'get_session'],
};

const LIMS_GROUPS = {
  '认证': ['check_auth', 'sync_auth'],
  '用户与首页': ['get_user_info', 'get_dashboard_counts', 'get_menu', 'get_business_info'],
  '综合查询与业务图': [
    'search_integrated', 'resolve_business_graph', 'get_task_info', 'list_reports',
  ],
  '委托 / 样品 / 任务': [
    'list_testing_orders', 'count_samples_by_order', 'list_samples', 'list_tasks',
    'list_task_management', 'get_task_detail', 'get_testing_mechanisms', 'get_select_options',
  ],
  '待办与原始记录': ['list_todos', 'list_original_record_approvals'],
  '报告签批（写）': [
    'report_review_agree', 'report_review_disagree', 'report_audit_agree', 'report_audit_disagree',
    'report_approve_agree', 'report_approve_disagree', 'report_back_task_delete',
  ],
  '其它写操作': [
    'submit_testing_order', 'delete_testing_order', 'return_original_record_approval',
    'delete_original_record_approval', 'pause_task', 'restore_task', 'export_integrated',
    'submit_cancel_todo',
  ],
};

async function main() {
  const elnRaw = await readDefs(path.join(ROOT, 'lib', 'eln', 'tools', 'definitions'));
  const limsRaw = await readDefs(path.join(ROOT, 'lib', 'lims', 'tools', 'definitions'));
  const elnMap = new Map(elnRaw.map((t) => [t.name, t.desc]));
  const limsMap = new Map(limsRaw.map((t) => [t.name, t.desc]));

  const elnAuth = [
    { name: 'eln__check_auth', desc: '检查 ELN JWT 是否有效' },
    { name: 'eln__sync_auth', desc: '从已登录 ELN 标签页同步 JWT' },
  ];
  const limsAuth = [
    { name: 'lims__check_auth', desc: '检查 LIMIS Cookie 会话是否有效' },
    { name: 'lims__sync_auth', desc: '从已登录 LIMIS 标签页同步 Cookie' },
  ];

  let body = `# 建科助手 — Agent 工具参考

> 自动生成：运行 node scripts/generate-tools-doc.mjs（请勿手改表格内容，改工具定义的 description 后重新生成）

扩展在每次对话中向 AI 提供以下工具。命名约定：

| 前缀 | 来源 |
| :--- | :--- |
| （无前缀） | Cebian 浏览器 / VFS / Skill 工具 |
| \`eln__\` | 建科 ELN 内置 API 工具 |
| \`lims__\` | 建科 LIMIS 内置 ASHX 工具 |
| \`mcp__<服务器>__<工具>\` | 用户在 **设置 → MCP 服务器** 中配置的外部 MCP 工具（动态发现） |

使用前请先在 **设置 → ELN 连接** / **LIMIS 连接** 完成登录态同步。

---

`;

  body += section('浏览器与通用工具（19）', BROWSER_TOOLS.map((t) => ({
    name: t.name,
    desc: t.desc,
  })));

  for (const [group, names] of Object.entries(ELN_GROUPS)) {
    if (group === '认证') {
      body += section(`ELN — ${group}`, elnAuth);
      continue;
    }
    const rows = names.map((n) => ({
      name: `eln__${n}`,
      desc: elnMap.get(n) ?? '—',
    }));
    body += section(`ELN — ${group}`, rows) + '\n';
  }

  const blocked = [...BLOCKED_ELN].map((n) => ({
    name: `eln__${n}`,
    desc: '**已禁用**（扩展层拦截，防止误启用/提交生产数据）',
  }));
  body += section('ELN — 已禁用（8，不可调用）', blocked) + '\n';

  for (const [group, names] of Object.entries(LIMS_GROUPS)) {
    const rows = (group === '认证' ? [] : names).map((n) => ({
      name: `lims__${n}`,
      desc: limsMap.get(n) ?? '—',
    }));
    if (group === '认证') {
      body += section(`LIMIS — ${group}`, limsAuth) + '\n';
    } else {
      body += section(`LIMIS — ${group}`, rows) + '\n';
    }
  }

  body += `## 外部 MCP 工具（动态）

在 **设置 → MCP 服务器** 添加 Streamable HTTP 或 SSE 端点后，扩展会自动发现并注册工具。

- **命名**：\`mcp__<服务器_slug>__<远程工具名>\`（slug 由服务器显示名规范化而来）
- **可见性**：遵循 MCP Apps 规范，\`_meta.ui.visibility\` 不含 \`model\` 的工具不会对 AI 暴露
- **示例**：若配置名为 \`eln-form-design\` 的 MCP 服务并提供 \`create_template\`，则工具名为 \`mcp__eln_form_design__create_template\`

具体工具列表与参数以各 MCP 服务的 \`tools/list\` 响应为准；在对话中可让 AI「列出当前可用 MCP 工具」。

---

## 内置斜杠提示词

| 提示词 | 用途 |
| :--- | :--- |
| \`/eln-新建模板\` | 从原始记录新建 ELN 检测模板 |
| \`/eln-编辑模板\` | 修改已有模板 Schema / 公式 / 表格 |
| \`/eln-查询模板\` | 搜索并解读模板 |
| \`/eln-模板统计\` | 分类、样品、模板数量统计 |
| \`/lims-报告审核\` | LIMIS 报告与原始记录交叉审核 |
| \`/lims-周报月报\` | 委托与报告周报/月报 |
| \`/lims-事项提醒\` | 待办、临期设备与标准提醒 |
| \`/lims-查询报告\` | 按委托号/报告号等查询报告 |

---

## 相关文档

- ELN 编辑工作流 Skill：\`skills/eln-form-design/SKILL.md\`
- UI → 工具映射：\`skills/eln-form-design/references/reverse-engineering/06-editor-feature-matrix.md\`
- LIMIS 报告签批说明：\`lib/lims/report-audit-spec.ts\`
`;

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, body, 'utf8');
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
