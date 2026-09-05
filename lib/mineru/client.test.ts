/**
 * MinerU OSS 上传：预签名 PUT 不得带默认 Content-Type
 */

import { describe, expect, it, vi, afterEach } from 'vitest';

describe('mineru OSS upload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('PUT 上传使用 ArrayBuffer 且 Content-Type 为空', async () => {
    let putInit: RequestInit | undefined;
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
      if (String(url).includes('oss.example/upload')) {
        putInit = init;
        return Promise.resolve({ ok: true, status: 200, text: async () => '' });
      }
      if (String(url).includes('/parse/file')) {
        return Promise.resolve({
          json: async () => ({
            code: 0,
            msg: 'ok',
            data: { task_id: 't1', file_url: 'https://oss.example/upload' },
          }),
        });
      }
      if (String(url).includes('/parse/t1')) {
        return Promise.resolve({
          json: async () => ({
            code: 0,
            msg: 'ok',
            data: { state: 'done', markdown_url: 'https://oss.example/out.md' },
          }),
        });
      }
      return Promise.resolve({ ok: true, text: async () => '# ok' });
    });

    const { parseFileViaMineruAgent } = await import('./client');
    const file = new File([new Uint8Array([1, 2, 3])], '砂.0001.pdf', { type: 'application/pdf' });
    const text = await parseFileViaMineruAgent(file);
    expect(text).toBe('# ok');
    expect(putInit?.method).toBe('PUT');
    expect(putInit?.body).toBeInstanceOf(ArrayBuffer);
    expect((putInit?.headers as Record<string, string>)?.['Content-Type']).toBe('');
  });
});

describe('verifyMineruApiToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('任务不存在视为 Token 有效', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({
      json: async () => ({ code: -1, msg: 'task not found or expire', data: null }),
    }));
    const { verifyMineruApiToken } = await import('./client');
    await expect(verifyMineruApiToken('good-token')).resolves.toBeUndefined();
  });

  it('A0202 视为 Token 无效', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({
      json: async () => ({ code: 'A0202', msg: 'Token 错误', data: null }),
    }));
    const { verifyMineruApiToken } = await import('./client');
    await expect(verifyMineruApiToken('bad')).rejects.toThrow(/Token/);
  });
});
