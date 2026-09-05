/**
 * LIMIS 工具注册表测试
 */

import { describe, expect, it } from 'vitest';
import { WRITE_TOOL_NAMES } from '@/lib/lims/guards/safety';
import { collectLimsToolDefinitions } from './registry';

describe('lims tools registry', () => {
  it('默认只读 18 个业务工具', () => {
    const defs = collectLimsToolDefinitions('test');
    expect(defs).toHaveLength(18);
    const names = defs.map((d) => d.name);
    expect(names).toContain('resolve_business_graph');
    expect(names).toContain('list_reports');
    for (const w of WRITE_TOOL_NAMES) {
      expect(names).not.toContain(w);
    }
  });

  it('开启写工具时共 33 个', () => {
    const defs = collectLimsToolDefinitions('test', true);
    expect(defs).toHaveLength(33);
    const names = defs.map((d) => d.name);
    expect(names).toContain('report_review_agree');
    for (const w of WRITE_TOOL_NAMES) {
      expect(names).toContain(w);
    }
    expect(new Set(names).size).toBe(names.length);
  });
});
