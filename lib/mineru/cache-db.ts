/**
 * MinerU 解析结果 IndexedDB 存储（大文本不走 chrome.storage.local）
 */

import Dexie, { type EntityTable } from 'dexie';

/** 单条 MinerU 解析缓存行 */
export interface MineruParseCacheRow {
  cacheKey: string;
  contentHash: string;
  profile: string;
  fileName: string;
  fileSize: number;
  channel: 'mineru-agent' | 'mineru-v4';
  markdown: string;
  createdAt: number;
}

/** MinerU 缓存库 */
class MineruCacheDatabase extends Dexie {
  parses!: EntityTable<MineruParseCacheRow, 'cacheKey'>;

  constructor() {
    super('cebianMineruCache');
    this.version(1).stores({
      parses: 'cacheKey, createdAt, contentHash',
    });
  }
}

let db: MineruCacheDatabase | undefined;

/** 获取 MinerU 缓存库单例 */
export function getMineruCacheDb(): MineruCacheDatabase {
  if (!db) db = new MineruCacheDatabase();
  return db;
}
