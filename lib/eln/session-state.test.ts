/**
 * ELN 会话状态隔离单元测试
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearSession,
  getSession,
  resetSession,
  setTemplate,
} from './session-state';

describe('ELN 会话状态按 sessionId 隔离', () => {
  beforeEach(() => {
    clearSession('session-a');
    clearSession('session-b');
  });

  it('不同 sessionId 的模板选择互不影响', () => {
    setTemplate('session-a', 1, 10, '模板A', 37);
    setTemplate('session-b', 2, 20, '模板B', 50);

    expect(getSession('session-a').templateId).toBe(1);
    expect(getSession('session-a').templateName).toBe('模板A');
    expect(getSession('session-b').templateId).toBe(2);
    expect(getSession('session-b').categoryId).toBe(50);
  });

  it('resetSession 只清空当前对话', () => {
    setTemplate('session-a', 1, 10, '模板A', 37);
    setTemplate('session-b', 2, 20, '模板B', 50);

    resetSession('session-a');

    expect(getSession('session-a').templateId).toBeNull();
    expect(getSession('session-b').templateId).toBe(2);
  });
});
