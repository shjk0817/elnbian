<div align="center">

<img src="./public/icon/128.png" alt="建科助手" width="96" height="96" />

# 建科助手

**建科 ELN / LIMIS 智能侧边栏 —— 对话即可编辑检测模板、查询报告、审核签批**

[![GitHub Release](https://img.shields.io/github/v/release/shjk0817/elnbian?style=for-the-badge&logo=github&logoColor=white&label=Release&labelColor=2B2B2B&color=2EA043)](https://github.com/shjk0817/elnbian/releases)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue?style=for-the-badge)](./LICENSE)

基于 [Cebian](https://github.com/maotoumao/Cebian) 二次开发 · 仓库：<https://github.com/shjk0817/elnbian>

</div>

---

> [!IMPORTANT]
> **开源与使用说明**
>
> 本项目在 [AGPL-3.0](./LICENSE) 协议下开源，并基于 [Cebian](https://github.com/maotoumao/Cebian) 二次开发。使用时请注意：
>
> 1. 二次分发、打包请**保留上游出处**：<https://github.com/maotoumao/Cebian>
> 2. 闭源或商用请联系原作者获取商业授权
> 3. 默认面向**建科内网**（ELN `http://10.1.228.52`，LIMIS `http://10.1.228.239` / `.22`）；外网环境需自行修改配置后重新构建

---

## 简介

**建科助手**是一款 Chrome / Edge 浏览器扩展，在侧边栏提供 AI 对话，并内置：

| 模块 | 工具前缀 | 数量 | 说明 |
| :--- | :--- | ---: | :--- |
| **ELN 模板编辑** | `eln__` | 66 | 64 个业务工具 + `sync_auth` / `check_auth`；8 个危险操作已拦截 |
| **LIMIS 业务** | `lims__` | 35 | 只读查询、报告三级签批、委托/待办等；含 2 个认证工具 |
| **浏览器助手** | （无前缀） | 19 | 读页、交互、截图、VFS、Skill、Chrome API 等 |
| **外部 MCP** | `mcp__*` | 动态 | 在设置中配置 MCP 服务器后自动发现 |

AI 模型需**自备 API Key**（OpenAI、Anthropic、Google、火山方舟等或任意 OpenAI 兼容接口）。

**完整工具列表与说明** → [`docs/TOOLS.md`](./docs/TOOLS.md)

---

## 功能一览

| 功能 | 说明 |
| :--- | :--- |
| **ELN 模板编辑** | 新建/修改 Formily Schema、公式、输出值、表格 Tab、受控编号；内置 Skill `eln-form-design` |
| **LIMIS 集成** | 委托/样品/任务/报告查询、综合查询、报告复核·审核·批准签批、待办提醒 |
| **欢迎页快捷入口** | LIMIS 四卡 + ELN 四卡 + 页面助手；对应斜杠提示词（见 [工具文档](./docs/TOOLS.md#内置斜杠提示词)） |
| **文档上传** | PDF / DOCX / XLSX 本地解析；复杂扫描件走 **MinerU**（可选 Token，支持 **本地 OCR 缓存**） |
| **登录态同步** | ELN：从标签页读 JWT；LIMIS：从 Cookie 同步（设置页一键操作） |
| **MCP 扩展** | 设置 → MCP 服务器，接入 Streamable HTTP / SSE 端点，工具自动注册为 `mcp__*` |
| **继承 Cebian** | 多模型、页面上下文、划词助手、悬浮球、跨对话记忆、WebDAV 备份等 |

---

## 安装

### 方式一：下载 Release（推荐）

1. 打开 [Releases](https://github.com/shjk0817/elnbian/releases)
2. 下载最新 **`elnbian-x.x.x-chrome.zip`**
3. 解压到任意文件夹
4. Chrome / Edge：`chrome://extensions` → **开发者模式** → **加载已解压的扩展程序** → 选择含 `manifest.json` 的目录

> 更新版本后请**重新加载扩展**并**刷新**已打开的 ELN/LIMIS 标签页。

### 方式二：从源码构建

| 依赖 | 版本 |
| :---: | :---: |
| Node.js | ≥ 22 |
| pnpm | latest |

```bash
git clone https://github.com/shjk0817/elnbian.git
cd elnbian
pnpm install
pnpm dev          # 开发：.output/chrome-mv3-dev/
pnpm build        # 生产：.output/chrome-mv3/
pnpm zip          # 打包 Chrome zip
```

| 命令 | 说明 |
| :--- | :--- |
| `pnpm dev` / `pnpm dev:firefox` | 开发构建 |
| `pnpm build` / `pnpm zip` | 生产构建 / 打包 |
| `pnpm bundle:eln` | 重新打包内置 Skill 与斜杠提示词 |
| `pnpm docs:tools` | 从源码生成 [`docs/TOOLS.md`](./docs/TOOLS.md) |

---

## 快速上手

### 1. 配置 AI 模型

**设置 → 模型提供商** → 填入 API Key → 在对话栏选择模型。

支持火山方舟 **Agent Plan** / **Coding Plan**（`volcengine-ark-agent` / `volcengine-ark-coding`）。

### 2. 连接 ELN

1. 浏览器打开并登录：`http://10.1.228.52`
2. **设置 → ELN 连接** → **同步登录态**（或对话中让 AI 调用 `eln__sync_auth`）
3. 状态为「已连接」后即可使用 `eln__*` 工具

### 3. 连接 LIMIS

1. 浏览器打开并登录 LIMIS（239 机场工地试验室或 22 莘庄总部）
2. **设置 → LIMIS 连接** → 选择正确站点 → **同步登录态**
3. 使用 `lims__*` 工具（建议先 `lims__sync_auth` → `lims__check_auth`）

### 4. 典型对话

**新建 ELN 模板**（欢迎页「ELN 新建模板」或 `/eln-新建模板`）：

```
请根据附件原始记录，在「土工」分类下为「环刀法」样品新建检测模板。
```

**LIMIS 报告审核**（`/lims-报告审核`）：

```
请审核委托号 HY01-260007 的报告与原始记录是否一致。
```

### 5. MinerU 与解析缓存

**设置 → ELN 连接 → MinerU**：填写 [MinerU](https://mineru.net/apiManage/docs) API Token 后可解析大文件/扫描件（≤200MB）。

同一文件再次上传时，扩展按**内容 SHA-256** 读取本地缓存，无需重复调用 API（附件头会标注「缓存」）。

### 6. 配置外部 MCP（可选）

**设置 → MCP 服务器** → 添加 HTTP/SSE 端点 → 保存后对话中自动出现 `mcp__<服务名>__<工具名>`。

详见 [工具文档 — 外部 MCP](./docs/TOOLS.md#外部-mcp-工具动态)。

---

## Agent 工具文档

| 文档 | 内容 |
| :--- | :--- |
| [**docs/TOOLS.md**](./docs/TOOLS.md) | **全部内置工具**：浏览器 19 + ELN 66 + LIMIS 35 + MCP 说明 + 斜杠提示词 |
| `skills/eln-form-design/SKILL.md` | ELN 模板编辑工作流 |
| `skills/eln-form-design/references/reverse-engineering/06-editor-feature-matrix.md` | UI 功能 → `eln__*` 映射 |

修改工具 `description` 后运行 `pnpm docs:tools` 可重新生成工具表。

---

## 目录结构

```
elnbian/
├── docs/
│   └── TOOLS.md                  # Agent 工具完整参考（可自动生成）
├── bundled/
│   ├── eln-prompts/              # ELN 斜杠提示词
│   └── lims-prompts/             # LIMIS 斜杠提示词
├── skills/eln-form-design/       # 内置 Skill 与 Wiki
├── lib/
│   ├── eln/                      # ELN API 客户端与工具定义
│   ├── lims/                     # LIMIS ASHX 客户端与工具定义
│   ├── mineru/                   # MinerU 客户端与 OCR 缓存
│   └── tools/                    # Agent 工具适配（eln / lims / mcp）
├── components/settings/sections/
│   ├── ElnSection.tsx              # ELN + MinerU 设置
│   └── LimsSection.tsx           # LIMIS 站点与连接
└── scripts/
    ├── bundle-eln-builtin.mjs
    ├── generate-tools-doc.mjs    # 生成 docs/TOOLS.md
    └── generate-eln-icons.mjs
```

---

## 常见问题

**Q：提示 ELN / LIMIS 未登录？**  
先在浏览器网页完成登录，再到对应设置页点「同步登录态」。Mac 用户请使用最新 Release（≥1.1.8）并刷新标签页。

**Q：AI 找不到 `eln__` / `lims__` 工具？**  
确认扩展已加载最新构建、模型支持 function calling，并重开侧边栏。

**Q：如何查看所有可用工具？**  
阅读 [`docs/TOOLS.md`](./docs/TOOLS.md)，或在对话中询问「列出当前可用的 eln 和 lims 工具」。

**Q：能否更换 ELN / LIMIS 地址？**  
修改 `lib/eln/constants.ts`、`lib/lims/constants.ts` 或在 LIMIS 设置中选择站点后重新构建。

---

## 致谢与协议

- 上游：[Cebian](https://github.com/maotoumao/Cebian)（AGPL-3.0）
- 本仓库：[shjk0817/elnbian](https://github.com/shjk0817/elnbian)

完整许可证见 [LICENSE](./LICENSE)。
