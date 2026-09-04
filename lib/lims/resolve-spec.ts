/**
 * LIMIS 业务图解析规格 — 内置 lims__* 实现必读
 *
 * 基于 10.1.228.239 只读实测（2026-09-04）固化，供 resolve / list_reports 等工具实现。
 * 详细说明见：Cebian/docs/lims-builtin-tools-dev.md §20–§22
 * 报告审批写操作见：report-audit-spec.ts
 */

/** 规格版本（实现变更时递增） */
export const LIMS_RESOLVE_SPEC_VERSION = '1.0.0';

/** 用户输入标识类型 */
export type LimsIdentifierType =
  | 'order_id'
  | 'order_no'
  | 'sample_no'
  | 'report_no'
  | 'report_id'
  | 'detail_url'
  | 'unknown';

/** ASHX 处理程序路径（相对 /AjaxRequest/） */
export const LIMS_ASHX = {
  integratedQuery: 'IntegratedQueryManage/IntegratedQuery.ashx',
  testingReportQuery: 'report/testingReportQuery.ashx',
  task: 'Task/Task.ashx',
  testingOrders: 'TestingOrders/TestingOrders.ashx',
  homeIndex: 'Index/HomeIndex.ashx',
} as const;

/** 各接口 method 名（勿与文档中过时的 report.ashx 混淆） */
export const LIMS_METHOD = {
  integratedQueryInfo: 'GetIntegratedQueryInfo',
  reportAuditByType: 'ReportAudtiByType',
  reportAuditByTypeNew: 'ReportAudtiByType_new',
  searchPdf: 'SearchPDF',
  reportHistory: 'testingReportHistoryInfo',
  taskInfo: 'GetTaskInfo',
  samplesBaseList: 'GetSamplesBaseList',
} as const;

/**
 * Referer 路径（相对 /UI/）；LimisApiClient 需按接口设置，否则 500 NullReference
 */
export const LIMS_REFERER_UI = {
  homeFrame: '/UI/Index/home.html',
  mainDashboard: '/UI/Index/Main.html',
  integratedQuery: '/UI/IntegratedQueryManage/IntegratedQuery.html?menuId=8',
  reportWaitPrint: '/UI/report/testingReportWaitPrint.html?type=4',
  reportAudit: '/UI/report/ReportAuditInfo.aspx?type=1',
  taskQuery: (orderId: number | string) =>
    `/UI/IntegratedQueryManage/taskQuery.aspx?testingOrderId=${orderId}`,
  testingOrderBase: '/UI/TestingOrder/TestingOrderBase.html?menuId=3',
} as const;

/** ReportAudtiByType 默认 reportStatus（空字符串；勿默认传 4） */
export const LIMS_REPORT_STATUS_DEFAULT = '';

/** 禁止仅传 testingReportId 调 ReportAudtiByType（会返回全库级海量数据） */
export const LIMS_FORBIDDEN_REPORT_QUERY = {
  onlyReportId: true,
} as const;

/** 综合查询固定参数 */
export const LIMS_INTEGRATED_QUERY_DEFAULTS = {
  type: '4',
  cha: '1',
  authType: '1',
  page: '1',
  size: '10',
} as const;

/** API 表单字段名映射（工具参数 → LIMIS 表单键） */
export const LIMS_FORM_KEYS = {
  orderNo: 'testingOrderNo',
  orderNoReportApi: 'testingOrderCode',
  sampleNo: 'testingSamplesNo',
  sampleNoReportApi: 'sampleNo',
  reportNo: 'testingReportsNo',
  reportNoReportApi: 'testingReportCode',
  orderId: 'testingOrderId',
} as const;

/** 页面 URL 模板（{origin} 由 settings 解析） */
export const LIMS_PAGE_URL = {
  integratedDetail: (origin: string, orderId: number | string) =>
    `${origin}/UI/IntegratedQueryManage/IntegratedDetail.aspx?testingOrderId=${orderId}`,
  orderPrint: (origin: string, orderId: number | string) =>
    `${origin}/UI/TestingOrder/PrintTestingOrderReplace.aspx?testingOrderId=${orderId}`,
  attachment: (origin: string, reportUrl: string) =>
    `${origin}${reportUrl.startsWith('/') ? reportUrl : `/${reportUrl}`}`,
} as const;

/** 239 实测金样例 — 单元测试与联调对照用 */
export const LIMS_GOLDEN_FIXTURES = {
  /** 样品编号入口；报告审批中 reportApprovalStatus=1 */
  sampleHy01: {
    input: 'HY01-260007-01',
    identifierType: 'sample_no' as const,
    testingOrderId: 1207645,
    testingOrderNo: 'HY01-260007',
    sampleId: 1793260,
    sampleNo: 'HY01-260007-01',
    testingReportId: 2504341,
    testingReportCode: 'HY011-260006',
    reportUrl: '/FileUpload/report/fbValue/HY011-260006-2504341.xlsx',
    taskId: 1921305,
    taskStatusName: '已完成',
  },
  /** 委托编号入口；实测时 reportApprovalStatus=2（列表显示「待审核」或后续状态，以 API 为准） */
  orderLjs4: {
    input: 'LJS4-260012',
    identifierType: 'order_no' as const,
    testingOrderId: 1207799,
    testingOrderNo: 'LJS4-260012',
    sampleId: 1793511,
    sampleNo: 'LJS4-260012-01',
    testingReportId: 2504375,
    testingReportCode: 'LJS41-260010',
    reportUrl: '/FileUpload/report/fbValue/LJS41-260010-2504375.xls',
    taskId: 1921398,
  },
} as const;

/** 从详情页 URL 解析 testingOrderId */
export function parseOrderIdFromDetailUrl(input: string): number | null {
  const m = input.match(/[?&]testingOrderId=(\d+)/i);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

/**
 * 粗判标识类型（auto 模式）；实现 resolve 时按此顺序归一化
 */
export function detectIdentifierType(raw: string): LimsIdentifierType {
  const s = raw.trim();
  if (!s) return 'unknown';
  const fromUrl = parseOrderIdFromDetailUrl(s);
  if (fromUrl !== null || /IntegratedDetail\.aspx/i.test(s)) return 'detail_url';
  if (/^\d{5,8}$/.test(s)) return 'order_id';
  if (/^[A-Z]{2,}\d*-\d{6}-\d{2}$/i.test(s)) return 'sample_no';
  if (/^[A-Z]{2,}\d*-\d{6}$/i.test(s)) return 'order_no';
  if (/^[A-Z]{2,}\d*-\d{5,}$/i.test(s)) return 'report_no';
  return 'unknown';
}
