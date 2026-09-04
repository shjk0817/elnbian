/**
 * 报告审批规格单元测试
 */

import { describe, expect, it } from 'vitest';
import {
  LIMS_AUDIT_ACTION_STATUS,
  LIMS_REPORT_APPROVAL_STATUS,
  LIMS_STATUS_TO_ACTION,
  assertReportStatusAllowsStep,
  auditResultFromAgree,
  auditStepToActionStatus,
  buildAuditReportFormBody,
  buildDisagreeAuditFormBody,
  resolveAuditPagePath,
  resolveAuditWriteMethod,
} from './report-audit-spec';

describe('report-audit-spec', () => {
  it('三级流程 auditStatus 映射', () => {
    expect(auditStepToActionStatus('review')).toBe('2');
    expect(auditStepToActionStatus('audit')).toBe('3');
    expect(auditStepToActionStatus('approve')).toBe('9');
    expect(LIMS_STATUS_TO_ACTION['1']).toBe('2');
    expect(LIMS_STATUS_TO_ACTION['3']).toBe('9');
  });

  it('同意与不同意共用 AuditReport_fb', () => {
    const page = resolveAuditPagePath(1, '线上');
    expect(resolveAuditWriteMethod(page)).toBe('AuditReport_fb');
    const base = {
      testingReportId: 2504341,
      auditUserId: 5013,
      auditUserName: '测试',
      auditRemark: '',
      auditStatus: LIMS_AUDIT_ACTION_STATUS.review,
    };
    const agree = buildAuditReportFormBody(
      { ...base, auditResult: auditResultFromAgree(true) },
      page,
    );
    expect(agree.method).toBe('AuditReport_fb');
    expect(JSON.parse(agree.model).auditResult).toBe('同意');
    const disagree = buildAuditReportFormBody(
      { ...base, auditResult: auditResultFromAgree(false), auditRemark: '数据有误' },
      page,
    );
    expect(JSON.parse(disagree.model).auditResult).toBe('不同意');
  });

  it('不同意未填说明时抛错', () => {
    expect(() =>
      buildAuditReportFormBody(
        {
          testingReportId: 1,
          auditUserId: 1,
          auditUserName: 'u',
          auditResult: '不同意',
          auditRemark: '  ',
          auditStatus: '2',
        },
        'AuditTestingReport_new_fb.aspx',
      ),
    ).toThrow(/auditRemark/);
  });

  it('不同意退回与同意共用 method', () => {
    const page = resolveAuditPagePath(1, '线上');
    const body = buildDisagreeAuditFormBody(
      {
        testingReportId: 2504341,
        auditUserId: 5013,
        auditUserName: '测试',
        auditRemark: '数据有误',
        auditStatus: '2',
      },
      page,
    );
    expect(body.method).toBe('AuditReport_fb');
    const parsed = JSON.parse(body.model);
    expect(parsed.auditResult).toBe('不同意');
    expect(parsed.auditStatus).toBe('2');
  });

  it('状态与步骤校验', () => {
    expect(assertReportStatusAllowsStep(LIMS_REPORT_APPROVAL_STATUS.pendingReview, 'review')).toBe(
      true,
    );
    expect(assertReportStatusAllowsStep(LIMS_REPORT_APPROVAL_STATUS.pendingApprove, 'review')).toBe(
      false,
    );
  });

  it('审批页路由', () => {
    expect(resolveAuditPagePath(0, '')).toContain('new2');
    expect(resolveAuditPagePath(1, '线上签名')).toContain('new3');
    expect(resolveAuditPagePath(1, '线上')).toContain('_fb');
  });
});
