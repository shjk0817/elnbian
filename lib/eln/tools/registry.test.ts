/**
 * ELN 工具注册表单元测试
 */

import { describe, expect, it } from 'vitest';
import { collectElnToolDefinitions } from './registry';
import { BLOCKED_TOOLS } from '@/lib/eln/guards/safety';

describe('ELN 工具注册表', () => {
  it('包含 64 个业务工具（不含认证工具，已过滤危险工具）', () => {
    const defs = collectElnToolDefinitions('test-session');
    expect(defs.length).toBe(64);
    for (const d of defs) {
      expect(BLOCKED_TOOLS.has(d.name)).toBe(false);
      expect(d.name).not.toMatch(/^eln__/);
    }
  });

  it('工具名无重复', () => {
    const defs = collectElnToolDefinitions('test-session');
    const names = defs.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
