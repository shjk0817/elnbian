/**
 * MinerU 解析缓存测试
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMineruCacheDb } from './cache-db';
import {
  mineruCacheProfile,
  readMineruParseCache,
  sha256HexOfFile,
  writeMineruParseCache,
} from './cache';

describe('mineru parse cache', () => {
  beforeEach(async () => {
    await getMineruCacheDb().parses.clear();
  });

  it('相同内容 hash 命中缓存', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' });
    const hash = await sha256HexOfFile(file);
    const profile = mineruCacheProfile('mineru-agent', file);
    await writeMineruParseCache({
      contentHash: hash,
      profile,
      fileName: file.name,
      fileSize: file.size,
      channel: 'mineru-agent',
      markdown: '# cached',
    });
    const hit = await readMineruParseCache(hash, profile);
    expect(hit).toBe('# cached');
  });

  it('不同 profile 不共用缓存', async () => {
    const file = new File([new Uint8Array([9])], 'b.pdf', { type: 'application/pdf' });
    const hash = await sha256HexOfFile(file);
    const agentProfile = mineruCacheProfile('mineru-agent', file);
    const v4Profile = mineruCacheProfile('mineru-v4', file);
    await writeMineruParseCache({
      contentHash: hash,
      profile: agentProfile,
      fileName: file.name,
      fileSize: file.size,
      channel: 'mineru-agent',
      markdown: 'agent',
    });
    expect(await readMineruParseCache(hash, v4Profile)).toBeNull();
  });
});
