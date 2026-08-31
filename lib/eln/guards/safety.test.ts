/**
 * ELN 安全守卫单元测试
 */

import { describe, expect, it } from 'vitest';
import { assertToolAllowed, BLOCKED_TOOLS, isToolBlocked } from './safety';

describe('ELN 危险工具拦截', () => {
  it('activate_template 在禁用列表中', () => {
    expect(isToolBlocked('activate_template')).toBe(true);
    expect(() => assertToolAllowed('activate_template')).toThrow(/已被禁用/);
  });

  it('list_categories 不在禁用列表中', () => {
    expect(isToolBlocked('list_categories')).toBe(false);
    expect(() => assertToolAllowed('list_categories')).not.toThrow();
  });

  it('禁用列表包含全部 8 个危险工具', () => {
    expect(BLOCKED_TOOLS.size).toBe(8);
  });
});
