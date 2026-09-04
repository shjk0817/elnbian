/**
 * LIMIS 检测报告复核/审核/批准规格 — 内置 lims__* 发版写工具必读
 *
 * 239 环境页面 JS 逆向（ReportAuditInfo.aspx、AuditTestingReport_new_fb.aspx，2026-09-04）。
 * 开发期禁止调用写 method；详见 Cebian/docs/lims-builtin-tools-dev.md §22
 */

/** 规格版本 */
export const LIMS_REPORT_AUDIT_SPEC_VERSION = '1.0.0';

/** 待办队列 type（GetReportNum、ReportAuditInfo?type=） */
export const LIMS_REPORT_QUEUE_TYPE = {
  pendingReview: '1',
  pendingAudit: '2',
  pendingApprove: '3',
  returned: '5',
  pendingIssue: '6',
} as const;

/** 单条报告 reportApprovalStatus（ReportAuditInfo 列表 formatter） */
export const LIMS_REPORT_APPROVAL_STATUS = {
  notSubmitted: '',
  pendingReview: '1',
  pendingAudit: '2',
  pendingApprove: '3',
  pendingPrint: '4',
  returned: '5',
  pendingDistribute: '6',
  distributed: '7',
  archived: '8',
  pendingReceive: '9',
} as const;

/**
 * 提交审批时 model.auditStatus（与 URL reportStatus 一致）
 * 注意：与 reportApprovalStatus（当前队列）不是同一套数字
 */
export const LIMS_AUDIT_ACTION_STATUS = {
  review: '2',
  audit: '3',
  approve: '9',
  viewOnly: '7',
} as const;

/** 审批意见 auditResult（字面量，须与 UI 下拉一致） */
export const LIMS_AUDIT_RESULT = {
  agree: '同意',
  disagree: '不同意',
} as const;

/** 写操作 method（testingReportQuery.ashx） */
export const LIMS_REPORT_WRITE_METHOD = {
  auditFb: 'AuditReport_fb',
  audit: 'AuditReport',
  backTask: 'BackTask',
} as const;

/**
 * LIMIS 三种「退回」路径（内置工具须区分，勿混用）
 */
export const LIMS_REPORT_RETURN_PATHS = {
  /** 复核/审核/批准：选「不同意」+ 说明 → 仍用 AuditReport_fb */
  auditDisagree: {
    handler: 'report/testingReportQuery.ashx',
    methods: [LIMS_REPORT_WRITE_METHOD.auditFb, LIMS_REPORT_WRITE_METHOD.audit],
    auditResult: LIMS_AUDIT_RESULT.disagree,
    remarkRequired: true,
  },
  backTask: {
    handler: 'report/testingReportQuery.ashx',
    method: LIMS_REPORT_WRITE_METHOD.backTask,
    param: 'reportId',
  },
  originalRecord: {
    handler: 'Experiment/Experiment.ashx',
    method: 'ReturnExperimentApproval',
    params: ['id', 'remark'],
  },
} as const;

/** reportApprovalStatus → 应执行的 auditStatus（点击列表图标时） */
export const LIMS_STATUS_TO_ACTION: Record<string, string> = {
  [LIMS_REPORT_APPROVAL_STATUS.pendingReview]: LIMS_AUDIT_ACTION_STATUS.review,
  [LIMS_REPORT_APPROVAL_STATUS.pendingAudit]: LIMS_AUDIT_ACTION_STATUS.audit,
  [LIMS_REPORT_APPROVAL_STATUS.pendingApprove]: LIMS_AUDIT_ACTION_STATUS.approve,
};

/** 审批详情页路径（相对 /UI/report/） */
export const LIMS_AUDIT_PAGE = {
  nonStandard: 'AuditTestingReport_new2.aspx',
  electronicSeal: 'AuditTestingReport_new3.aspx',
  attachmentFb: 'AuditTestingReport_new_fb.aspx',
} as const;

/** 电子章类 standBy1 → 走 new3 页 */
export const LIMS_ELECTRONIC_SEAL_STANDBY = [
  '线上签名',
  '电子科技业务章',
  '公司电子公章',
] as const;

/** AuditReport 提交 model 字段 */
export type LimsAuditReportModel = {
  testingReportId: string | number;
  auditUserId: string | number;
  auditUserName: string;
  auditResult: typeof LIMS_AUDIT_RESULT.agree | typeof LIMS_AUDIT_RESULT.disagree;
  auditRemark: string;
  auditStatus: string;
};

/** 内置工具步骤名 → auditStatus */
export type LimsAuditStep = 'review' | 'audit' | 'approve';

/**
 * 工具步骤 → model.auditStatus
 */
export function auditStepToActionStatus(step: LimsAuditStep): string {
  const map: Record<LimsAuditStep, string> = {
    review: LIMS_AUDIT_ACTION_STATUS.review,
    audit: LIMS_AUDIT_ACTION_STATUS.audit,
    approve: LIMS_AUDIT_ACTION_STATUS.approve,
  };
  return map[step];
}

/**
 * 工具 result → auditResult 中文
 */
export function auditResultFromAgree(agree: boolean): LimsAuditReportModel['auditResult'] {
  return agree ? LIMS_AUDIT_RESULT.agree : LIMS_AUDIT_RESULT.disagree;
}

/**
 * 校验当前报告状态是否允许该步骤（发版写工具调用前）
 */
export function assertReportStatusAllowsStep(
  reportApprovalStatus: string,
  step: LimsAuditStep,
): boolean {
  const expected: Record<LimsAuditStep, string> = {
    review: LIMS_REPORT_APPROVAL_STATUS.pendingReview,
    audit: LIMS_REPORT_APPROVAL_STATUS.pendingAudit,
    approve: LIMS_REPORT_APPROVAL_STATUS.pendingApprove,
  };
  return reportApprovalStatus === expected[step];
}

/**
 * 选择审批详情页（与 ReportAuditInfo.AuditReport 路由一致）
 */
export function resolveAuditPagePath(isNormal: number | string, standBy1: string): string {
  const normal = String(isNormal) === '1';
  if (!normal) return LIMS_AUDIT_PAGE.nonStandard;
  if (LIMS_ELECTRONIC_SEAL_STANDBY.includes(standBy1 as (typeof LIMS_ELECTRONIC_SEAL_STANDBY)[number])) {
    return LIMS_AUDIT_PAGE.electronicSeal;
  }
  return LIMS_AUDIT_PAGE.attachmentFb;
}

/**
 * 附表页使用的写 method（_fb 变体；new2/new3 发版前需再抓 JS 确认）
 */
export function resolveAuditWriteMethod(pagePath: string): string {
  if (pagePath.includes('_fb.aspx')) return LIMS_REPORT_WRITE_METHOD.auditFb;
  return LIMS_REPORT_WRITE_METHOD.audit;
}

/**
 * 组装 AuditReport 请求体（同意/不同意共用同一 method，靠 auditResult 区分）
 */
export function buildAuditReportFormBody(
  model: LimsAuditReportModel,
  pagePath: string,
): { method: string; model: string } {
  if (model.auditResult === LIMS_AUDIT_RESULT.disagree && !model.auditRemark.trim()) {
    throw new Error('不同意时必须填写 auditRemark（审批意见说明）');
  }
  return {
    method: resolveAuditWriteMethod(pagePath),
    model: JSON.stringify(model),
  };
}

/**
 * 组装「不同意退回」请求体（复核/审核/批准通用，method 与同意相同）
 */
export function buildDisagreeAuditFormBody(
  model: Omit<LimsAuditReportModel, 'auditResult'> & { auditRemark: string },
  pagePath: string,
): { method: string; model: string } {
  return buildAuditReportFormBody(
    { ...model, auditResult: LIMS_AUDIT_RESULT.disagree },
    pagePath,
  );
}
