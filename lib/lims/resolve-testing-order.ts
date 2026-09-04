/**
 * 委托标识解析 — 委托号与 testingOrderId 互查
 */

import type { LimisApiClient } from './client';
import { LIMS_ASHX, LIMS_METHOD, LIMS_REFERER_UI } from './resolve-spec';

export type TestingOrderRef = {
  testing_order_id?: number;
  testing_order_no?: string;
};

/** 解析 testingOrderId（优先用已有 ID，否则综合查询按委托号查） */
export async function resolveTestingOrderId(
  client: LimisApiClient,
  ref: TestingOrderRef,
): Promise<number> {
  if (ref.testing_order_id != null && Number.isFinite(ref.testing_order_id)) {
    return ref.testing_order_id;
  }
  const orderNo = ref.testing_order_no?.trim();
  if (!orderNo) {
    throw new Error('需要提供 testing_order_id 或 testing_order_no');
  }
  const raw = await client.call<unknown>(
    LIMS_ASHX.integratedQuery,
    {
      method: LIMS_METHOD.integratedQueryInfo,
      type: '4',
      cha: '1',
      authType: '1',
      page: '1',
      size: '5',
      testingOrderNo: orderNo,
    },
    { refererPath: LIMS_REFERER_UI.integratedQuery },
  );
  const rows = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
  const row = rows.find((r) => r.testingOrderNo === orderNo) ?? rows[0];
  const id = Number(row?.testingOrderId);
  if (!Number.isFinite(id)) {
    throw new Error(`未找到委托编号：${orderNo}`);
  }
  return id;
}

/** 按委托 ID 拉取任务链（GetTaskInfo） */
export async function fetchTasksByOrderId(
  client: LimisApiClient,
  testingOrderId: number,
): Promise<Record<string, unknown>[]> {
  const raw = await client.call<unknown>(
    LIMS_ASHX.task,
    { method: LIMS_METHOD.taskInfo, testingOrderId: String(testingOrderId) },
    { refererPath: LIMS_REFERER_UI.taskQuery(testingOrderId) },
  );
  return (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
}
