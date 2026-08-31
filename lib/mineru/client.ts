/**
 * MinerU 文档解析 API 客户端（Agent 轻量 + v4 精准）
 * 文档：https://mineru.net/apiManage/docs
 */

import { extractMarkdownFromZip } from '@/lib/mineru/zip-md';

const AGENT_BASE = 'https://mineru.net/api/v1/agent';
const V4_BASE = 'https://mineru.net/api/v4';

export const MINERU_AGENT_MAX_BYTES = 10 * 1024 * 1024;
export const MINERU_V4_MAX_BYTES = 200 * 1024 * 1024;

type MineruEnvelope<T> = { code: number; msg: string; data: T };

/** 轮询间隔与超时 */
const POLL_MS = 3000;
const AGENT_TIMEOUT_MS = 5 * 60 * 1000;
const V4_TIMEOUT_MS = 12 * 60 * 1000;

/** 通用 JSON 请求 */
async function mineruPost<T>(url: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json() as MineruEnvelope<T>;
  if (json.code !== 0) throw new Error(json.msg || `MinerU 请求失败 (${json.code})`);
  return json.data;
}

/** 通用 GET 轮询 */
async function mineruGet<T>(url: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const json = await res.json() as MineruEnvelope<T>;
  if (json.code !== 0) throw new Error(json.msg || `MinerU 查询失败 (${json.code})`);
  return json.data;
}

/** PUT 上传文件到 OSS 签名地址 */
async function putFile(url: string, file: File): Promise<void> {
  const res = await fetch(url, { method: 'PUT', body: file });
  if (!res.ok) throw new Error(`MinerU 文件上传失败 (HTTP ${res.status})`);
}

/** 下载 URL 文本 */
async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载 MinerU 结果失败 (HTTP ${res.status})`);
  return res.text();
}

/** Agent 轻量 API：免 Token，≤10MB */
export async function parseFileViaMineruAgent(file: File): Promise<string> {
  if (file.size > MINERU_AGENT_MAX_BYTES) {
    throw new Error(`文件超过 MinerU 轻量 API 上限 ${MINERU_AGENT_MAX_BYTES / 1024 / 1024}MB`);
  }
  const created = await mineruPost<{ task_id: string; file_url: string }>(
    `${AGENT_BASE}/parse/file`,
    { file_name: file.name, language: 'ch', enable_table: true, is_ocr: true },
  );
  await putFile(created.file_url, file);
  const mdUrl = await pollAgentTask(created.task_id);
  return fetchText(mdUrl);
}

/** 轮询 Agent 任务直到完成 */
async function pollAgentTask(taskId: string): Promise<string> {
  const deadline = Date.now() + AGENT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const data = await mineruGet<{
      state: string;
      markdown_url?: string;
      err_msg?: string;
    }>(`${AGENT_BASE}/parse/${taskId}`);
    if (data.state === 'done' && data.markdown_url) return data.markdown_url;
    if (data.state === 'failed') {
      throw new Error(data.err_msg || 'MinerU 轻量解析失败');
    }
    await sleep(POLL_MS);
  }
  throw new Error('MinerU 轻量解析超时');
}

/** v4 精准 API：需 Token，≤200MB */
export async function parseFileViaMineruV4(file: File, token: string): Promise<string> {
  if (!token.trim()) throw new Error('未配置 MinerU API Token');
  if (file.size > MINERU_V4_MAX_BYTES) {
    throw new Error(`文件超过 MinerU 精准 API 上限 ${MINERU_V4_MAX_BYTES / 1024 / 1024}MB`);
  }
  const model = file.name.toLowerCase().endsWith('.html') ? 'MinerU-HTML' : 'vlm';
  const batch = await mineruPost<{ batch_id: string; file_urls: string[] }>(
    `${V4_BASE}/file-urls/batch`,
    { files: [{ name: file.name }], model_version: model, enable_table: true, language: 'ch' },
    token,
  );
  if (!batch.file_urls?.[0]) throw new Error('MinerU 未返回上传地址');
  await putFile(batch.file_urls[0], file);
  const zipUrl = await pollV4Batch(batch.batch_id, token);
  const zipBuf = await (await fetch(zipUrl)).arrayBuffer();
  return extractMarkdownFromZip(zipBuf);
}

/** 轮询 v4 批量任务 */
async function pollV4Batch(batchId: string, token: string): Promise<string> {
  const deadline = Date.now() + V4_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const data = await mineruGet<{
      extract_result: Array<{
        state: string;
        full_zip_url?: string;
        err_msg?: string;
      }>;
    }>(`${V4_BASE}/extract-results/batch/${batchId}`, token);
    const item = data.extract_result?.[0];
    if (!item) {
      await sleep(POLL_MS);
      continue;
    }
    if (item.state === 'done' && item.full_zip_url) return item.full_zip_url;
    if (item.state === 'failed') {
      throw new Error(item.err_msg || 'MinerU 精准解析失败');
    }
    await sleep(POLL_MS);
  }
  throw new Error('MinerU 精准解析超时');
}

/** 按配置选择 MinerU 通道解析文件 */
export async function parseFileViaMineru(
  file: File,
  options: { apiToken?: string; preferV4?: boolean },
): Promise<{ text: string; channel: 'mineru-agent' | 'mineru-v4' }> {
  const token = options.apiToken?.trim();
  const canV4 = Boolean(token) && file.size <= MINERU_V4_MAX_BYTES;
  const canAgent = file.size <= MINERU_AGENT_MAX_BYTES;

  if (options.preferV4 && canV4) {
    return { text: await parseFileViaMineruV4(file, token!), channel: 'mineru-v4' };
  }
  if (canV4 && !canAgent) {
    return { text: await parseFileViaMineruV4(file, token!), channel: 'mineru-v4' };
  }
  if (canAgent) {
    try {
      return { text: await parseFileViaMineruAgent(file), channel: 'mineru-agent' };
    } catch (err) {
      if (canV4) return { text: await parseFileViaMineruV4(file, token!), channel: 'mineru-v4' };
      throw err;
    }
  }
  if (canV4) {
    return { text: await parseFileViaMineruV4(file, token!), channel: 'mineru-v4' };
  }
  throw new Error('文件过大，请配置 MinerU Token 后重试（精准 API 支持最大 200MB）');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
