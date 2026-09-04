/**
 * LIMIS 核心只读工具：用户、仪表盘、综合查询、任务、报告、业务图
 */

import { z } from 'zod';
import { getLimsManager } from '@/lib/lims/manager';
import { resolveBusinessGraph } from '@/lib/lims/resolve/graph-resolver';
import {
  LIMS_FORM_KEYS,
  LIMS_INTEGRATED_QUERY_DEFAULTS,
  LIMS_METHOD,
  LIMS_REFERER_UI,
  LIMS_REPORT_STATUS_DEFAULT,
} from '@/lib/lims/resolve-spec';
import type { ToolDefinition } from '../types';
import { errorResult, jsonResult } from '../types';

/** 创建核心查询工具 */
export function createLimsCoreTools(_sessionId: string): ToolDefinition[] {
  return [
    {
      name: 'get_user_info',
      description: '获取当前 LIMIS 登录用户名。',
      inputSchema: z.object({}),
      handler: async () => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('Index/HomeIndex.ashx', { method: 'GetUserName' });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'get_dashboard_counts',
      description: '获取 LIMIS 首页统计：报告待复核/待审核/待批准/已退回数量等（GetReportNum）。',
      inputSchema: z.object({}),
      handler: async () => {
        try {
          const client = await getLimsManager().createClient();
          const reports = await client.call('Index/Main.ashx', { method: 'GetReportNum' }, {
            refererPath: LIMS_REFERER_UI.mainDashboard,
          });
          return jsonResult({ reports });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'search_integrated',
      description: 'LIMIS 综合查询（GetIntegratedQueryInfo）。可按委托号、样品号、报告号等筛选。',
      inputSchema: z.object({
        testing_order_no: z.string().optional(),
        sample_no: z.string().optional(),
        report_no: z.string().optional(),
        testing_order_unit_name: z.string().optional(),
        page: z.number().optional(),
        size: z.number().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const params: Record<string, string> = {
            method: LIMS_METHOD.integratedQueryInfo,
            ...LIMS_INTEGRATED_QUERY_DEFAULTS,
            page: String(args.page ?? 1),
            size: String(args.size ?? 10),
          };
          if (args.testing_order_no) params[LIMS_FORM_KEYS.orderNo] = String(args.testing_order_no);
          if (args.sample_no) params[LIMS_FORM_KEYS.sampleNo] = String(args.sample_no);
          if (args.report_no) params[LIMS_FORM_KEYS.reportNo] = String(args.report_no);
          if (args.testing_order_unit_name) params.testingOrderUnitName = String(args.testing_order_unit_name);
          const data = await client.call(
            'IntegratedQueryManage/IntegratedQuery.ashx',
            params,
            { refererPath: LIMS_REFERER_UI.integratedQuery },
          );
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'get_task_info',
      description: '按委托单 ID 查询任务链（GetTaskInfo），含 sampleId、任务状态等。',
      inputSchema: z.object({
        testing_order_id: z.number().describe('委托单 ID testingOrderId'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const id = args.testing_order_id as number;
          const data = await client.call(
            'Task/Task.ashx',
            { method: LIMS_METHOD.taskInfo, testingOrderId: String(id) },
            { refererPath: LIMS_REFERER_UI.taskQuery(id) },
          );
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_reports',
      description: '查询检测报告列表（ReportAudtiByType），返回 reportUrl、reportApprovalStatus 等。至少传一种：委托号/样品号/报告号。',
      inputSchema: z.object({
        testing_order_no: z.string().optional(),
        sample_no: z.string().optional(),
        report_no: z.string().optional(),
        report_status: z.string().optional().describe('默认空字符串；勿默认传 4'),
        detail: z.boolean().optional().describe('true 时用 ReportAudtiByType_new'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const method = args.detail ? LIMS_METHOD.reportAuditByTypeNew : LIMS_METHOD.reportAuditByType;
          const params: Record<string, string> = {
            method,
            authType: '1',
            reportStatus: args.report_status != null ? String(args.report_status) : LIMS_REPORT_STATUS_DEFAULT,
          };
          if (args.testing_order_no) params[LIMS_FORM_KEYS.orderNoReportApi] = String(args.testing_order_no);
          if (args.sample_no) params[LIMS_FORM_KEYS.sampleNoReportApi] = String(args.sample_no);
          if (args.report_no) params[LIMS_FORM_KEYS.reportNoReportApi] = String(args.report_no);
          const data = await client.call('report/testingReportQuery.ashx', params, {
            refererPath: LIMS_REFERER_UI.reportWaitPrint,
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'resolve_business_graph',
      description: '按任意标识（委托号/样品号/报告号/委托ID/详情页URL）解析完整 LIMIS 业务图：委托、任务、样品、报告、附件链接。',
      inputSchema: z.object({
        identifier: z.string().describe('如 HY01-260007-01、LJS4-260012、IntegratedDetail.aspx?testingOrderId=…'),
        identifier_type: z
          .enum(['auto', 'order_id', 'order_no', 'sample_no', 'report_no', 'detail_url'])
          .optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await resolveBusinessGraph(client, {
            identifier: String(args.identifier),
            identifier_type: args.identifier_type as 'auto' | undefined,
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
  ];
}
