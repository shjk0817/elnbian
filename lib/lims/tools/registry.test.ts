/**
 * LIMIS 工具注册表测试
 */

import { describe, expect, it } from 'vitest';
import { WRITE_TOOL_NAMES } from '@/lib/lims/guards/safety';
import { collectLimsToolDefinitions } from './registry';

describe('lims tools registry', () => {
  it('共 33 个业务工具（18 只读 + 15 写）', () => {
    const defs = collectLimsToolDefinitions('test');
    expect(defs).toHaveLength(33);
    const names = defs.map((d) => d.name);
    expect(names).toContain('resolve_business_graph');
    expect(names).toContain('list_reports');
    expect(names).toContain('report_review_agree');
    expect(names).not.toContain('audit_report');
    expect(names).not.toContain('approve_order_delay');
    for (const w of WRITE_TOOL_NAMES) {
      expect(names).toContain(w);
    }
    expect(new Set(names).size).toBe(names.length);
  });
});
