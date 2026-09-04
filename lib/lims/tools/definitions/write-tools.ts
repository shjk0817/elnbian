/**
 * LIMIS Phase 2 写操作工具：委托、任务、原始记录、导出等（不含报告签批）
 */

import { z } from 'zod';
import { getLimsManager } from '@/lib/lims/manager';
import { LIMS_REFERER_UI } from '@/lib/lims/resolve-spec';
import type { ToolDefinition } from '../types';
import { errorResult, jsonResult } from '../types';

/** 创建通用写工具定义 */
export function createLimsWriteTools(_sessionId: string): ToolDefinition[] {
  return [
    {
      name: 'submit_testing_order',
      description:
        '提交委托审批（submitTestingorderBefore）。超期提交须填 overdue_remark。高危：会改变委托状态。',
      inputSchema: z.object({
        testing_order_id: z.number().describe('委托单 ID'),
        overdue_remark: z.string().optional().describe('超期提交原因；非超期可省略'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const params: Record<string, string> = {
            method: 'submitTestingorderBefore',
            testingOrderId: String(args.testing_order_id),
          };
          if (args.overdue_remark) params.remark = String(args.overdue_remark);
          const data = await client.call('TestingOrders/TestingOrders.ashx', params);
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'delete_testing_order',
      description: '删除委托（DelOrder）。不可逆，仅可删特定状态委托。',
      inputSchema: z.object({
        testing_order_id: z.number().describe('委托单 ID'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('TestingOrders/TestingOrders.ashx', {
            method: 'DelOrder',
            id: String(args.testing_order_id),
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'return_original_record_approval',
      description:
        '【电子原始记录·审批退回】Experiment.ashx ReturnExperimentApproval。对象是 ELN 原始记录审批单，不是检测报告签批（勿用 report_*_disagree）。',
      inputSchema: z.object({
        id: z.number().describe('原始记录审批记录 ID'),
        remark: z.string().min(1).describe('退回原因'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('Experiment/Experiment.ashx', {
            method: 'ReturnExperimentApproval',
            id: String(args.id),
            remark: String(args.remark),
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'delete_original_record_approval',
      description: '删除 LIMIS 手动上传类原始记录审批条目（DeleteExperimentApproval）。',
      inputSchema: z.object({
        id: z.number().describe('审批记录 ID'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('Experiment/Experiment.ashx', {
            method: 'DeleteExperimentApproval',
            id: String(args.id),
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'pause_task',
      description: '处理任务暂停申请（PauseEnter）。',
      inputSchema: z.object({ id: z.number().describe('任务暂停记录 ID') }),
      handler: async (args) => writeTaskPause('PauseEnter', args.id as number),
    },
    {
      name: 'restore_task',
      description: '恢复已暂停任务（RestoreEnter）。',
      inputSchema: z.object({ id: z.number().describe('任务暂停记录 ID') }),
      handler: async (args) => writeTaskPause('RestoreEnter', args.id as number),
    },
    {
      name: 'export_integrated',
      description: '导出综合查询结果（IntegratedQuery.ashx → ExportInfo），rows 为查询结果行数组。',
      inputSchema: z.object({
        rows: z.array(z.record(z.unknown())).min(1).describe('GetIntegratedQueryInfo 返回的 rows'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call(
            'IntegratedQueryManage/IntegratedQuery.ashx',
            { method: 'ExportInfo', data: JSON.stringify(args.rows) },
            { refererPath: LIMS_REFERER_UI.integratedQuery },
          );
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'submit_cancel_todo',
      description: '取消已退回待办提醒（TaskService_new.ashx → SubmitCancel）。',
      inputSchema: z.object({
        flow_id: z.string().describe('待办 flowId'),
        remark: z.string().optional().describe('取消说明'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const params: Record<string, string> = {
            method: 'SubmitCancel',
            flowId: String(args.flow_id),
          };
          if (args.remark) params.remark = String(args.remark);
          const data = await client.call('basicInfo/TaskService_new.ashx', params);
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
  ];
}

/** 任务暂停/恢复写操作 */
async function writeTaskPause(method: string, id: number) {
  try {
    const client = await getLimsManager().createClient();
    const data = await client.call('Task/taskPause.ashx', { method, id: String(id) });
    return jsonResult(data);
  } catch (e) {
    return errorResult(e instanceof Error ? e.message : String(e));
  }
}
