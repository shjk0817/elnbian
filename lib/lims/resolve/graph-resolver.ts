/**
 * LIMIS 业务图聚合解析
 */

import type { LimisApiClient } from '../client';
import {
  detectIdentifierType,
  LIMS_ASHX,
  LIMS_FORM_KEYS,
  LIMS_GOLDEN_FIXTURES,
  LIMS_INTEGRATED_QUERY_DEFAULTS,
  LIMS_METHOD,
  LIMS_PAGE_URL,
  LIMS_REFERER_UI,
  LIMS_REPORT_STATUS_DEFAULT,
  parseOrderIdFromDetailUrl,
  type LimsIdentifierType,
} from '../resolve-spec';

export type ResolveGraphInput = {
  identifier: string;
  identifier_type?: LimsIdentifierType | 'auto';
};

/** 归一化为数组 */
function asArray<T>(data: T | T[] | null | undefined): T[] {
  if (data == null) return [];
  return Array.isArray(data) ? data : [data];
}

/** 按委托/样品过滤样品列表 */
function filterSamples(rows: Record<string, unknown>[], orderNo?: string, sampleNo?: string) {
  return rows.filter((r) => {
    if (sampleNo && r.sampleNo !== sampleNo && r.testingSamplesNo !== sampleNo) return false;
    if (orderNo && r.testingOrderNo !== orderNo && r.testingOrderCode !== orderNo) return false;
    return true;
  });
}

/** 解析任意标识为完整业务图（只读） */
export async function resolveBusinessGraph(
  client: LimisApiClient,
  input: ResolveGraphInput,
): Promise<Record<string, unknown>> {
  const origin = client.webOrigin;
  const raw = input.identifier.trim();
  const idType = input.identifier_type === 'auto' || !input.identifier_type
    ? detectIdentifierType(raw)
    : input.identifier_type;

  let testingOrderId: number | null = parseOrderIdFromDetailUrl(raw);
  let testingOrderNo: string | undefined;
  let sampleNo: string | undefined;
  let reportNo: string | undefined;

  if (idType === 'order_id') testingOrderId = Number(raw);
  if (idType === 'order_no') testingOrderNo = raw;
  if (idType === 'sample_no') sampleNo = raw;
  if (idType === 'report_no') reportNo = raw;

  const integratedParams: Record<string, string> = {
    method: LIMS_METHOD.integratedQueryInfo,
    ...LIMS_INTEGRATED_QUERY_DEFAULTS,
  };
  if (testingOrderId) integratedParams.testingOrderId = String(testingOrderId);
  if (testingOrderNo) integratedParams[LIMS_FORM_KEYS.orderNo] = testingOrderNo;
  if (sampleNo) integratedParams[LIMS_FORM_KEYS.sampleNo] = sampleNo;
  if (reportNo) integratedParams[LIMS_FORM_KEYS.reportNo] = reportNo;

  let integrated: unknown = null;
  if (idType !== 'order_id' || !testingOrderId) {
    integrated = await client.call(
      LIMS_ASHX.integratedQuery,
      integratedParams,
      { refererPath: LIMS_REFERER_UI.integratedQuery },
    );
    const rows = asArray(
      (integrated as { rows?: unknown })?.rows ?? integrated,
    ) as Record<string, unknown>[];
    const first = rows[0];
    if (first?.testingOrderId) testingOrderId = Number(first.testingOrderId);
    if (first?.testingOrderNo) testingOrderNo = String(first.testingOrderNo);
  }

  if (!testingOrderId) {
    const reportRows = await client.call<Record<string, unknown>[] | Record<string, unknown>>(
      LIMS_ASHX.testingReportQuery,
      {
        method: LIMS_METHOD.reportAuditByType,
        authType: '1',
        testingReportCode: reportNo ?? '',
        sampleNo: sampleNo ?? '',
        testingOrderCode: testingOrderNo ?? '',
        reportStatus: LIMS_REPORT_STATUS_DEFAULT,
      },
      { refererPath: LIMS_REFERER_UI.reportWaitPrint },
    );
    const rr = asArray(reportRows)[0];
    if (rr?.testingOrderId) testingOrderId = Number(rr.testingOrderId);
    if (rr?.testingOrderCode) testingOrderNo = String(rr.testingOrderCode);
  }

  if (!testingOrderId) {
    throw new Error(`无法从标识「${raw}」解析 testingOrderId`);
  }

  const refererTask = LIMS_REFERER_UI.taskQuery(testingOrderId);
  const [taskInfo, samplesRaw, reportsRaw] = await Promise.all([
    client.call(LIMS_ASHX.task, { method: LIMS_METHOD.taskInfo, testingOrderId: String(testingOrderId) }, { refererPath: refererTask }),
    client.call(LIMS_ASHX.testingOrders, { method: LIMS_METHOD.samplesBaseList }, { refererPath: LIMS_REFERER_UI.testingOrderBase }),
    client.call(
      LIMS_ASHX.testingReportQuery,
      {
        method: LIMS_METHOD.reportAuditByType,
        authType: '1',
        testingOrderCode: testingOrderNo ?? '',
        sampleNo: sampleNo ?? '',
        reportStatus: LIMS_REPORT_STATUS_DEFAULT,
      },
      { refererPath: LIMS_REFERER_UI.reportWaitPrint },
    ),
  ]);

  const samples = filterSamples(
    asArray(samplesRaw) as Record<string, unknown>[],
    testingOrderNo,
    sampleNo,
  );
  const reports = asArray(reportsRaw);

  const pages = {
    integratedDetail: LIMS_PAGE_URL.integratedDetail(origin, testingOrderId),
    orderPrint: LIMS_PAGE_URL.orderPrint(origin, testingOrderId),
    attachments: reports
      .map((r) => {
        const row = r as Record<string, unknown>;
        return row.reportUrl
          ? LIMS_PAGE_URL.attachment(origin, String(row.reportUrl))
          : null;
      })
      .filter(Boolean),
  };

  return {
    identifier: raw,
    identifierType: idType,
    testingOrderId,
    testingOrderNo,
    integrated,
    taskInfo,
    samples,
    reports,
    pages,
    goldenFixtures: LIMS_GOLDEN_FIXTURES,
  };
}
