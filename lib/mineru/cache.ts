/**
 * MinerU OCR 解析本地缓存：按文件内容 SHA-256 + 解析配置去重
 */

import { getMineruCacheDb } from './cache-db';

const MAX_CACHE_ENTRIES = 100;

/** 计算文件内容 SHA-256（十六进制） */
export async function sha256HexOfFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 生成缓存 profile（区分 agent / v4 与模型参数） */
export function mineruCacheProfile(
  channel: 'mineru-agent' | 'mineru-v4',
  file: File,
): string {
  if (channel === 'mineru-v4') {
    const model = file.name.toLowerCase().endsWith('.html') ? 'html' : 'vlm';
    return `v4:${model}:table:ch`;
  }
  return 'agent:ocr:table:ch';
}

/** 读取缓存解析结果 */
export async function readMineruParseCache(
  contentHash: string,
  profile: string,
): Promise<string | null> {
  const cacheKey = `${contentHash}:${profile}`;
  const row = await getMineruCacheDb().parses.get(cacheKey);
  return row?.markdown ?? null;
}

/** 写入解析缓存并淘汰最旧条目 */
export async function writeMineruParseCache(input: {
  contentHash: string;
  profile: string;
  fileName: string;
  fileSize: number;
  channel: 'mineru-agent' | 'mineru-v4';
  markdown: string;
}): Promise<void> {
  const cacheKey = `${input.contentHash}:${input.profile}`;
  await getMineruCacheDb().parses.put({
    cacheKey,
    contentHash: input.contentHash,
    profile: input.profile,
    fileName: input.fileName,
    fileSize: input.fileSize,
    channel: input.channel,
    markdown: input.markdown,
    createdAt: Date.now(),
  });
  const count = await getMineruCacheDb().parses.count();
  if (count <= MAX_CACHE_ENTRIES) return;
  const overflow = count - MAX_CACHE_ENTRIES;
  const oldest = await getMineruCacheDb().parses.orderBy('createdAt').limit(overflow).toArray();
  await getMineruCacheDb().parses.bulkDelete(oldest.map((r) => r.cacheKey));
}
