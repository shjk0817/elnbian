/**
 * LIMIS 认证错误分类单元测试
 */

import { describe, expect, it } from 'vitest';
import { classifyLimsAuthError } from './auth-errors';

describe('classifyLimsAuthError', () => {
  it('未找到标签页 → no_cookies', () => {
    expect(classifyLimsAuthError('未找到 http://10.1.228.239 标签页。')).toBe('no_cookies');
  });

  it('有标签但未读到 Cookie → no_cookies', () => {
    expect(classifyLimsAuthError('已检测到 2 个标签页，但未读到 UserId / ASP.NET_SessionId。')).toBe('no_cookies');
  });

  it('Cookie 失效 → invalid', () => {
    expect(classifyLimsAuthError('LIMIS Cookie 已失效，请重新登录后同步。')).toBe('invalid');
  });
});
