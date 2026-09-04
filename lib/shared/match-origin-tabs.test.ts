/**
 * origin 标签页匹配测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findTabsForOrigin } from './match-origin-tabs';

describe('findTabsForOrigin', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      tabs: {
        query: vi.fn(async (query: { url?: string }) => {
          if (query.url) return [];
          return [
            { id: 1, url: 'http://10.1.228.52:80/design/user/login' },
            { id: 2, url: 'https://example.com' },
          ];
        }),
      },
    });
  });

  it('模式未命中时按 hostname 回退', async () => {
    const tabs = await findTabsForOrigin('http://10.1.228.52');
    expect(tabs.map((t) => t.id)).toEqual([1]);
  });
});
