/**
 * 委托标识解析测试
 */

import { describe, expect, it } from 'vitest';
import { resolveTestingOrderId } from './resolve-testing-order';
import type { LimisApiClient } from './client';

describe('resolveTestingOrderId', () => {
  it('优先使用 testing_order_id', async () => {
    const client = { call: async () => { throw new Error('不应调用'); } } as unknown as LimisApiClient;
    const id = await resolveTestingOrderId(client, { testing_order_id: 1207192 });
    expect(id).toBe(1207192);
  });

  it('按委托号综合查询解析 ID', async () => {
    const client = {
      call: async () => [{ testingOrderId: 1207192, testingOrderNo: 'GLS1-260004' }],
    } as unknown as LimisApiClient;
    const id = await resolveTestingOrderId(client, { testing_order_no: 'GLS1-260004' });
    expect(id).toBe(1207192);
  });
});
