/**
 * 检测报告三级签批与退回 — 拆分为独立工具，避免与 BackTask / 原始记录退回混用
 */

import { z } from 'zod';
import { resolveLimsCookies } from '@/lib/lims/auth';
import { getLimsManager } from '@/lib/lims/manager';
import {
  auditResultFromAgree,
  auditStepToActionStatus,
  buildAuditReportFormBody,
  type LimsAuditStep,
} from '@/lib/lims/report-audit-spec';
import { LIMS_REFERER_UI } from '@/lib/lims/resolve-spec';
import { parseLimsUserDisplayName } from '@/lib/lims/user-display';
import type { ToolDefinition } from '../types';
import { errorResult, jsonResult } from '../types';

const REPORT_ID = z.number().describe('检测报告 ID（testingReportId）');
const PAGE_PATH = z
  .string()
  .optional()
  .describe('审批页路径，默认 AuditTestingReport_new_fb.aspx');
const DISAGREE_REMARK = z.string().min(1).describe('不同意原因（必填）');

/** 单步签批：同意或不同意 */
async function submitReportAudit(
  step: LimsAuditStep,
  agree: boolean,
  testingReportId: number,
  remark: string,
  pagePath?: string,
) {
  try {
    if (!agree && !remark.trim()) {
      return errorResult('不同意时必须填写 remark');
    }
    const cookies = await resolveLimsCookies();
    const client = await getLimsManager().createClient();
    const userRes = await client.call('Index/HomeIndex.ashx', { method: 'GetUserName' });
    const userName = parseLimsUserDisplayName(userRes) || cookies.userId;
    const path = pagePath ?? 'AuditTestingReport_new_fb.aspx';
    const body = buildAuditReportFormBody(
      {
        testingReportId,
        auditUserId: cookies.userId,
        auditUserName: userName,
        auditResult: auditResultFromAgree(agree),
        auditRemark: remark,
        auditStatus: auditStepToActionStatus(step),
      },
      path,
    );
    const data = await client.call('report/testingReportQuery.ashx', body, {
      refererPath: `/UI/report/${path}`,
    });
    return jsonResult(data);
  } catch (e) {
    return errorResult(e instanceof Error ? e.message : String(e));
  }
}

/** 构建三级签批工具（同意/不同意各一） */
function auditTool(
  name: string,
  step: LimsAuditStep,
  agree: boolean,
  label: string,
): ToolDefinition {
  const schema = agree
    ? z.object({ testing_report_id: REPORT_ID, page_path: PAGE_PATH })
    : z.object({
        testing_report_id: REPORT_ID,
        remark: DISAGREE_REMARK,
        page_path: PAGE_PATH,
      });
  return {
    name,
    description: label,
    inputSchema: schema,
    handler: async (args) =>
      submitReportAudit(
        step,
        agree,
        args.testing_report_id as number,
        agree ? '' : String(args.remark),
        args.page_path as string | undefined,
      ),
  };
}

/** 创建报告签批/退回写工具（7 个，与原始记录退回无关） */
export function createLimsReportAuditTools(_sessionId: string): ToolDefinition[] {
  return [
    auditTool(
      'report_review_agree',
      'review',
      true,
      '【检测报告·复核同意】AuditReport_fb，auditStatus=2。仅用于 reportApprovalStatus=待复核(1)。不是原始记录审批。',
    ),
    auditTool(
      'report_review_disagree',
      'review',
      false,
      '【检测报告·复核不同意】审批流内退回，报告→已退回(5)。须 remark。不是 BackTask，不是原始记录退回。',
    ),
    auditTool(
      'report_audit_agree',
      'audit',
      true,
      '【检测报告·审核同意】AuditReport_fb，auditStatus=3。仅用于 reportApprovalStatus=待审核(2)。',
    ),
    auditTool(
      'report_audit_disagree',
      'audit',
      false,
      '【检测报告·审核不同意】审批流内退回，报告→已退回(5)。须 remark。不是 BackTask。',
    ),
    auditTool(
      'report_approve_agree',
      'approve',
      true,
      '【检测报告·批准同意】AuditReport_fb，auditStatus=9。仅用于 reportApprovalStatus=待批准(3)。',
    ),
    auditTool(
      'report_approve_disagree',
      'approve',
      false,
      '【检测报告·批准不同意】审批流内退回，报告→已退回(5)。须 remark。不是 BackTask。',
    ),
    {
      name: 'report_back_task_delete',
      description:
        '【检测报告·退回任务并删报告】BackTask，高危不可逆。勿用于复核/审核/批准选「不同意」（那用 report_*_disagree）。',
      inputSchema: z.object({
        report_id: z.number().describe('报告 ID（reportId，非 testingReportId 时以 list_reports 字段为准）'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call(
            'report/testingReportQuery.ashx',
            { method: 'BackTask', reportId: String(args.report_id) },
            { refererPath: LIMS_REFERER_UI.reportWaitPrint },
          );
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
  ];
}
