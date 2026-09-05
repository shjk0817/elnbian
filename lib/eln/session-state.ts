/**
 * ELN 模板编辑会话状态（按 Cebian 对话 sessionId 隔离）
 *
 * 每个侧边栏对话维护独立的模板 ID、Schema、数据配置与表格模板。
 * 快照持久化到 chrome.storage.session，Service Worker 重启后可恢复。
 */

import type {
  DetectionDateConfig,
  DetectionDateItem,
  ExpressionItem,
  ExtraConfig,
  FormilySchema,
  OutputItem,
  TableTemplateJson,
} from '@/lib/eln/client';

/** 单个对话的 ELN 编辑会话快照 */
export interface SessionState {
  templateId: number | null;
  versionId: number | null;
  templateName: string | null;
  categoryId: number | null;
  formSchema: FormilySchema | null;
  extra: ExtraConfig | null;
  tableTemplate: TableTemplateJson | null;
  lastAction: string | null;
}

const sessions = new Map<string, SessionState>();
const loadedSessions = new Set<string>();
const loadPromises = new Map<string, Promise<void>>();

/** 生成 storage.session 键名 */
function storageKey(sessionId: string): string {
  return `elnSession:${sessionId}`;
}

/** 获取 session 存储区（测试环境可能不可用） */
function getSessionStorage(): chrome.storage.StorageArea | null {
  return typeof chrome !== 'undefined' && chrome.storage?.session
    ? chrome.storage.session
    : null;
}

/** 创建空白会话状态 */
function createEmptyState(): SessionState {
  return {
    templateId: null,
    versionId: null,
    templateName: null,
    categoryId: null,
    formSchema: null,
    extra: null,
    tableTemplate: null,
    lastAction: null,
  };
}

/** 将会话写入 chrome.storage.session */
function schedulePersist(sessionId: string): void {
  const area = getSessionStorage();
  const state = sessions.get(sessionId);
  if (!area || !state) return;
  void area.set({ [storageKey(sessionId)]: state });
}

/** 从 storage 恢复会话（ELN 工具执行前 await） */
export async function ensureSessionLoaded(sessionId: string): Promise<void> {
  if (loadedSessions.has(sessionId)) return;
  const pending = loadPromises.get(sessionId);
  if (pending) {
    await pending;
    return;
  }

  const p = (async () => {
    const area = getSessionStorage();
    if (area) {
      const key = storageKey(sessionId);
      const result = await area.get(key);
      const saved = result[key] as SessionState | undefined;
      if (saved && typeof saved === 'object') {
        sessions.set(sessionId, saved);
      }
    }
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, createEmptyState());
    }
    loadedSessions.add(sessionId);
  })();

  loadPromises.set(sessionId, p);
  try {
    await p;
  } finally {
    loadPromises.delete(sessionId);
  }
}

/** 获取指定对话的会话状态（不存在则创建） */
export function getSession(sessionId: string): SessionState {
  let state = sessions.get(sessionId);
  if (!state) {
    state = createEmptyState();
    sessions.set(sessionId, state);
    loadedSessions.add(sessionId);
  }
  return state;
}

/** 清除指定对话的会话状态 */
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
  loadedSessions.delete(sessionId);
  const area = getSessionStorage();
  if (area) void area.remove(storageKey(sessionId));
}

/** 选中当前编辑的模板 */
export function setTemplate(
  sessionId: string,
  templateId: number,
  versionId: number,
  name: string,
  categoryId: number,
): void {
  const state = getSession(sessionId);
  state.templateId = templateId;
  state.versionId = versionId;
  state.templateName = name;
  state.categoryId = categoryId;
  state.lastAction = `选中模板 ${name} (id=${templateId}, version=${versionId})`;
  schedulePersist(sessionId);
}

/** 设置完整 Formily Schema */
export function setFormSchema(sessionId: string, schema: FormilySchema): void {
  getSession(sessionId).formSchema = schema;
  getSession(sessionId).lastAction = '设置完整 Formily Schema';
  schedulePersist(sessionId);
}

/** 设置完整数据配置 */
export function setExtra(sessionId: string, extra: ExtraConfig): void {
  getSession(sessionId).extra = extra;
  getSession(sessionId).lastAction = '设置完整数据配置';
  schedulePersist(sessionId);
}

/** 更新表单级设置 */
export function setFormSettings(sessionId: string, formPartial: Record<string, unknown>): void {
  const state = getSession(sessionId);
  if (!state.formSchema) throw new Error('未选择模板');
  state.formSchema.form = { ...state.formSchema.form, ...formPartial };
  state.lastAction = '更新表单级设置';
  schedulePersist(sessionId);
}

/** 设置完整表格模板 */
export function setTableTemplate(sessionId: string, table: TableTemplateJson): void {
  getSession(sessionId).tableTemplate = table;
  getSession(sessionId).lastAction = '设置完整表格模板';
  schedulePersist(sessionId);
}

/** 添加或更新公式项 */
export function addExpression(sessionId: string, expr: ExpressionItem): void {
  const state = getSession(sessionId);
  if (!state.extra) {
    state.extra = { expressionItems: [], outputItems: [], detectionDateConfig: null };
  }
  const idx = state.extra.expressionItems.findIndex((e) => e.id === expr.id);
  if (idx >= 0) state.extra.expressionItems[idx] = expr;
  else state.extra.expressionItems.push(expr);
  state.lastAction = `添加/更新公式 "${expr.title}"`;
  schedulePersist(sessionId);
}

/** 添加或更新输出值项 */
export function addOutputItem(sessionId: string, item: OutputItem): void {
  const state = getSession(sessionId);
  if (!state.extra) {
    state.extra = { expressionItems: [], outputItems: [], detectionDateConfig: null };
  }
  const idx = state.extra.outputItems.findIndex((o) => o.id === item.id);
  if (idx >= 0) state.extra.outputItems[idx] = item;
  else state.extra.outputItems.push(item);
  state.lastAction = `添加/更新输出值 "${item.name}"`;
  schedulePersist(sessionId);
}

/** 删除公式项 */
export function removeExpression(sessionId: string, id: number | string): boolean {
  const state = getSession(sessionId);
  if (!state.extra) return false;
  const idx = state.extra.expressionItems.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  const title = state.extra.expressionItems[idx].title;
  state.extra.expressionItems.splice(idx, 1);
  state.lastAction = `删除公式 "${title}"`;
  schedulePersist(sessionId);
  return true;
}

/** 删除输出值项 */
export function removeOutputItem(sessionId: string, id: number | string): boolean {
  const state = getSession(sessionId);
  if (!state.extra) return false;
  const idx = state.extra.outputItems.findIndex((o) => o.id === id);
  if (idx < 0) return false;
  const name = state.extra.outputItems[idx].name;
  state.extra.outputItems.splice(idx, 1);
  state.lastAction = `删除输出值 "${name}"`;
  schedulePersist(sessionId);
  return true;
}

/** 设置检测日期全局策略 */
export function setDetectionDatePolicy(
  sessionId: string,
  missingPolicy: DetectionDateConfig['missingPolicy'],
  outputFormat?: string,
): void {
  const state = getSession(sessionId);
  if (!state.extra) {
    state.extra = { expressionItems: [], outputItems: [], detectionDateConfig: null };
  }
  const prev = state.extra.detectionDateConfig;
  state.extra.detectionDateConfig = {
    missingPolicy,
    outputFormat: outputFormat ?? prev?.outputFormat ?? 'YYYY-MM-DD',
    items: prev?.items ?? [],
  };
  state.lastAction = `设置检测日期策略 ${missingPolicy}`;
  schedulePersist(sessionId);
}

/** 添加检测日期配置项 */
export function addDetectionDateItem(sessionId: string, item: DetectionDateItem): void {
  const state = getSession(sessionId);
  if (!state.extra) {
    state.extra = { expressionItems: [], outputItems: [], detectionDateConfig: null };
  }
  if (!state.extra.detectionDateConfig) {
    state.extra.detectionDateConfig = {
      missingPolicy: 'warnOnly',
      outputFormat: 'YYYY-MM-DD',
      items: [],
    };
  }
  const items = state.extra.detectionDateConfig.items;
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  state.lastAction = `添加检测日期项 ${item.path}`;
  schedulePersist(sessionId);
}

/** 删除检测日期配置项 */
export function removeDetectionDateItem(sessionId: string, id: number | string): boolean {
  const state = getSession(sessionId);
  if (!state.extra?.detectionDateConfig) return false;
  const items = state.extra.detectionDateConfig.items;
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return false;
  items.splice(idx, 1);
  state.lastAction = `删除检测日期项 id=${id}`;
  schedulePersist(sessionId);
  return true;
}

/** 设置完整检测日期配置 */
export function setDetectionDate(sessionId: string, config: DetectionDateConfig): void {
  const state = getSession(sessionId);
  if (!state.extra) {
    state.extra = { expressionItems: [], outputItems: [], detectionDateConfig: null };
  }
  state.extra.detectionDateConfig = config;
  state.lastAction = `设置检测日期配置 (${config.items.length} 项)`;
  schedulePersist(sessionId);
}

/** 重置会话 */
export function resetSession(sessionId: string): void {
  sessions.set(sessionId, createEmptyState());
  getSession(sessionId).lastAction = '会话已重置';
  schedulePersist(sessionId);
}

/** 设置完整数据配置（setExtra 别名） */
export function setFullExtra(sessionId: string, extra: ExtraConfig): void {
  setExtra(sessionId, extra);
}

/** 写操作前校验：已选模板且含 categoryId */
export function assertWriteSession(sessionId: string): void {
  assertTemplateSelected(sessionId);
  const state = getSession(sessionId);
  if (state.categoryId === null) {
    throw new Error('会话缺少 categoryId，请重新 select_template');
  }
}

/** 写操作前校验：已选模板 */
export function assertTemplateSelected(sessionId: string): void {
  const state = getSession(sessionId);
  if (!state.templateId || !state.versionId) {
    throw new Error('未选择模板。请先调用 select_template 或 create_template。');
  }
}
