import { describe, expect, it } from 'vitest';
import { parseLimsUserDisplayName } from './user-display';

describe('parseLimsUserDisplayName', () => {
  it('解析 username 字段（LIMIS 实际返回）', () => {
    expect(parseLimsUserDisplayName({ state: '1', username: '张三' })).toBe('张三');
  });

  it('解析 userName 字段', () => {
    expect(parseLimsUserDisplayName({ state: '1', userName: '张三' })).toBe('张三');
  });
});
