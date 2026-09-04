/**
 * LIMIS Cookie 多策略读取测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mergeLimsCookiePair,
  pairFromCookieList,
  readLimsCookiesFromBrowser,
} from './read-cookies';

describe('pairFromCookieList', () => {
  it('大小写不敏感匹配 Cookie 名', () => {
    const pair = pairFromCookieList([
      { name: 'userid', value: 'u1' } as chrome.cookies.Cookie,
      { name: 'ASP.NET_SessionId', value: 's1' } as chrome.cookies.Cookie,
    ]);
    expect(pair).toEqual({ userId: 'u1', sessionId: 's1' });
  });
});

describe('mergeLimsCookiePair', () => {
  it('合并 API 与 document 两路结果', () => {
    expect(mergeLimsCookiePair(
      { userId: 'u1', sessionId: 's1' },
      {},
    )).toEqual({ userId: 'u1', sessionId: 's1' });
    expect(mergeLimsCookiePair(
      { userId: 'u1', sessionId: 's1' },
      { userId: 'u2' },
    )).toEqual({ userId: 'u1', sessionId: 's1' });
    expect(mergeLimsCookiePair(
      null,
      { userId: 'u2', sessionId: 's2' },
    )).toEqual({ userId: 'u2', sessionId: 's2' });
  });
});

describe('readLimsCookiesFromBrowser', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      tabs: { query: vi.fn(async () => []) },
      cookies: {
        getAll: vi.fn(async (details: { url?: string; domain?: string }) => {
          if (details.url?.includes('/UI/')) {
            return [{ name: 'ASP.NET_SessionId', value: 'sess-ui' }];
          }
          if (details.domain === '10.1.228.239') {
            return [{ name: 'UserId', value: 'u1' }];
          }
          return [];
        }),
      },
    });
  });

  it('合并 url 与 domain 查询结果', async () => {
    const pair = await readLimsCookiesFromBrowser('http://10.1.228.239');
    expect(pair).toEqual({ userId: 'u1', sessionId: 'sess-ui' });
  });
});
