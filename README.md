<div align="center">

<img src="./public/icon/128.png" alt="建科ELN助手" width="96" height="96" />

# 建科 ELN 助手

**建科 ELN 模板编辑 AI 助手 —— 浏览器侧边栏，对话即可搭建检测表单**

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
> 3. 本仓库面向**建科 ELN 内网环境**（默认 `http://10.1.228.52`），外网使用前需自行修改 ELN 地址配置

---

## 简介

**建科 ELN 助手**是一款 Chrome / Edge 浏览器扩展，在侧边栏提供 AI 对话能力，并内置 **66 个 ELN 模板编辑工具**（`eln__*`），帮助检测人员：

- 根据 Word / PDF / Excel 原始记录**新建**检测表单模板
- 在模板编辑页**修改** Formily Schema、公式、输出值、检测日期
- **查询**分类、样品、已有模板，做统计与查重

在 ELN 网页登录后，扩展自动同步登录态；AI 模型需**自备 API Key**（OpenAI、Anthropic、Google 或任意 OpenAI 兼容接口）。

---

## 功能一览

| 功能 | 说明 |
| :--- | :--- |
| **ELN 内置工具** | 64 个业务工具 + `eln__sync_auth` / `eln__check_auth`；启用模板等 8 个危险操作已程序拦截 |
| **内置 Skill** | `eln-form-design`：模板编辑完整工作流，含 Wiki 与 API 参考文档 |
| **斜杠提示词** | 欢迎页一键使用：`/eln-新建模板`、`/eln-编辑模板`、`/eln-模板统计`、`/eln-查询模板` |
| **文档上传** | 支持拖拽 PDF / DOCX / XLSX；可选 MinerU API 解析复杂扫描件 |
| **ELN 连接** | 设置页查看连接状态，一键打开 ELN 登录页并同步 Token |
| **多模型对话** | 继承 Cebian：多厂商 API、页面上下文、MCP、Skill、跨对话记忆等 |

---

## 安装

### 方式一：下载 Release 安装包（推荐）

适合**不会写代码**的同事，无需安装 Node.js。

1. 打开 [Releases](https://github.com/shjk0817/elnbian/releases) 页面
2. 下载最新版的 **`elnbian-x.x.x-chrome.zip`**（Chrome / Edge）或 **`elnbian-x.x.x-firefox.zip`**（Firefox）
3. 解压 zip 到任意文件夹（路径不要含中文乱码为佳）
4. 在浏览器中加载扩展：
   - **Chrome / Edge**：地址栏输入 `chrome://extensions` → 开启右上角「**开发者模式**」→「**加载已解压的扩展程序**」→ 选择解压后的文件夹（内含 `manifest.json`）
   - **Firefox**：`about:debugging` →「此 Firefox」→「临时载入附加组件」→ 选择解压目录中的 `manifest.json`

> 通过 zip 安装的扩展在浏览器重启后可能需重新加载；长期使用建议用开发模式固定加载同一目录，或等待商店版本。

### 方式二：从源码构建

适合需要改代码或跟进更新的开发者。

#### 环境要求

| 依赖 | 版本 |
| :---: | :---: |
| Node.js | ≥ 22 |
| pnpm | latest |

#### 构建步骤

```bash
# 克隆仓库
git clone https://github.com/shjk0817/elnbian.git
cd elnbian

# 安装依赖
pnpm install

# 生成图标并启动开发模式（Chrome）
pnpm dev
```

开发模式会在 `.output/chrome-mv3-dev/` 生成未打包扩展。在 `chrome://extensions` 中加载该目录即可热更新调试。

#### 常用命令

| 命令 | 说明 |
| :--- | :--- |
| `pnpm dev` | Chrome 开发构建（含图标生成） |
| `pnpm dev:firefox` | Firefox 开发构建 |
| `pnpm build` | 生产构建 → `.output/chrome-mv3/` |
| `pnpm zip` | 打包 Chrome 安装 zip |
| `pnpm zip:firefox` | 打包 Firefox 安装 zip |
| `pnpm icons:eln` | 从 `assets/logo-eln-master.png` 重新生成各尺寸图标 |
| `pnpm bundle:eln` | 重新打包内置 Skill 与斜杠提示词 |

---

## 使用指南

### 1. 配置 AI 模型

1. 点击扩展图标，打开**侧边栏**
2. 进入 **设置 → 模型提供商**
3. 添加所用厂商的 **API Key**（或配置 OpenAI 兼容自定义端点）
4. 在对话输入框上方选择要使用的模型

> 对话内容仅在发送时传给所选模型厂商；扩展本身不托管 AI 服务。

### 2. 连接建科 ELN

1. 在浏览器中打开 ELN 并**登录**：`http://10.1.228.52`
2. 打开扩展 **设置 → ELN 连接**
3. 点击「**同步登录态**」或让 AI 调用 `eln__sync_auth`
4. 状态显示为「**已连接**」后即可使用 ELN 工具

侧边栏顶部会显示 ELN 连接指示灯；未登录时 AI 无法调用模板编辑接口。

### 3. 新建检测模板（典型流程）

**快捷入口**：欢迎页点击「**ELN 新建模板**」，或在输入框输入 `/` 选择 `eln-新建模板`。

推荐对话示例：

```
请根据附件原始记录，在「土工」分类下为「环刀法」样品新建一份检测模板。
```

**AI 将自动执行**（参见内置 Skill `eln-form-design`）：

1. `eln__check_auth` 确认登录
2. `eln__list_categories` / `eln__list_samples` 查询分类与样品
3. `eln__search_templates` 查重
4. `eln__create_template` 创建草稿 → `eln__select_template` 选中
5. 搭建 Formily Schema（`eln__set_full_schema` 或增量 `eln__add_component` 等）
6. 配置公式 `eln__add_formula`、输出值 `eln__add_output_item`、检测日期
7. `eln__save_template` 保存 → `eln__set_controlled_no` 设置受控编号
8. `eln__validate_template` / 预览校验

可将 **PDF / Word / Excel** 拖入输入框作为附件；复杂扫描件可在设置中配置 **MinerU API**（见下文）。

### 4. 编辑已有模板

1. 在 ELN 中打开模板编辑页：`/design/table/template-design`
2. 欢迎页选「**ELN 编辑模板**」或输入 `/eln-编辑模板`
3. 说明要改的内容（增列、改公式、调 ArrayTable 等）

> **注意**：对已**启用**的模板不能直接改 Schema，需走变更流程；危险工具（如 `activate_template`）已被扩展拦截。

### 5. 查询与统计

- `/eln-查询模板`：按名称、分类、样品搜索模板
- `/eln-模板统计`：查看模板数量、版本等汇总信息

### 6. 上传原始记录文档

| 格式 | 处理方式 |
| :--- | :--- |
| PDF | 本地 pdf.js 解析；复杂版式可启用 MinerU |
| DOCX | 本地 mammoth 转文本 |
| XLSX | 本地解析为表格文本 |

**MinerU（可选）**：设置 → ELN 连接 → 填写 [MinerU](https://mineru.net/apiManage/docs) API Token，可解析更大、更复杂的 PDF（≤200MB）。

### 7. 内置工具与安全限制

- 工具名均以 `eln__` 开头，共 **66** 个
- **禁止**调用：模板启用、发起变更、检测记录提交等 8 类危险操作（扩展层拦截）
- 仅允许在**有权限的分类**下创建/编辑**草稿**模板

完整工具列表与 UI 映射见 Skill 参考：`skills/eln-form-design/references/reverse-engineering/06-editor-feature-matrix.md`

---

## 目录结构（ELN 相关）

```
elnbian/
├── assets/logo-eln-master.png    # 扩展图标主图
├── bundled/eln-prompts/          # 内置斜杠提示词（新建/编辑/统计/查询）
├── skills/eln-form-design/       # 内置 Skill 与参考文档
├── lib/eln/                      # ELN API 客户端、会话、安全守卫
├── lib/tools/eln/                # 66 个 eln__* 工具定义
├── components/settings/sections/ElnSection.tsx   # ELN / MinerU 设置页
└── scripts/
    ├── bundle-eln-builtin.mjs    # 打包内置 Skill/提示词
    └── generate-eln-icons.mjs    # 生成多尺寸图标
```

---

## 常见问题

**Q：扩展图标没更新？**  
修改图标后执行 `pnpm icons:eln`，重启 `pnpm dev`，并在 `chrome://extensions` 点击「重新加载」。确保加载的是 `.output/chrome-mv3-dev/` 目录。

**Q：提示未登录 / Token 无效？**  
先在浏览器打开 ELN 网页完成登录，再到设置 → ELN 连接 → 同步登录态。

**Q：AI 说找不到 eln__ 工具？**  
确认扩展已加载最新构建，且对话中模型支持 function calling；必要时重启侧边栏。

**Q：能否连接其他 ELN 地址？**  
当前默认指向内网 `http://10.1.228.52`；更换环境需修改 `lib/eln/constants.ts` 后重新构建。

---

## 致谢与协议

- 上游项目：[Cebian](https://github.com/maotoumao/Cebian)（AGPL-3.0）
- 本仓库维护：[shjk0817/elnbian](https://github.com/shjk0817/elnbian)

完整许可证见 [LICENSE](./LICENSE)。
