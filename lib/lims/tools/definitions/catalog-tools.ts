/**
 * LIMIS 目录类只读工具：委托、样品、任务、待办、原始记录审批等
 */

import { z } from 'zod';
import { getLimsManager } from '@/lib/lims/manager';
import { LIMS_REFERER_UI } from '@/lib/lims/resolve-spec';
import { parseLimisMenuHtml } from '@/lib/lims/parse-menu-html';
import { fetchTasksByOrderId, resolveTestingOrderId } from '@/lib/lims/resolve-testing-order';
import type { ToolDefinition } from '../types';
import { errorResult, jsonResult } from '../types';

/** 创建目录查询工具 */
export function createLimsCatalogTools(_sessionId: string): ToolDefinition[] {
  return [
    {
      name: 'get_menu',
      description:
        '获取 LIMIS 侧边栏菜单（GetMenuList_New）。服务端返回 HTML 片段而非 JSON；工具会解析为链接列表。',
      inputSchema: z.object({}),
      handler: async () => {
        try {
          const client = await getLimsManager().createClient();
          const html = await client.call<string>('Index/HomeIndex.ashx', { method: 'GetMenuList_New' }, {
            accept: 'text',
          });
          const items = parseLimisMenuHtml(html);
          return jsonResult({ format: 'html', itemCount: items.length, items });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_testing_orders',
      description: '分页查询委托列表（GetTestingOrderList）。',
      inputSchema: z.object({
        page: z.number().optional(),
        rows: z.number().optional(),
        testing_order_no: z.string().optional(),
        testing_order_unit_name: z.string().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const params: Record<string, string> = {
            method: 'GetTestingOrderList',
            page: String(args.page ?? 1),
            rows: String(args.rows ?? 20),
            cha: '1',
            strWhere: '',
            filedOrder: '',
          };
          if (args.testing_order_no) params.testingNO = String(args.testing_order_no);
          if (args.testing_order_unit_name) params.testingOrderUnitName = String(args.testing_order_unit_name);
          const data = await client.call('TestingOrders/TestingOrders.ashx', params, {
            refererPath: LIMS_REFERER_UI.testingOrderBase,
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'count_samples_by_order',
      description:
        '按委托统计样品/任务数量（GetTaskInfo）。勿用 SamplesCountBytestingOrderNo（需 testingOrderId 且为提交校验，传委托号会 SQL 报错）。',
      inputSchema: z.object({
        testing_order_no: z.string().optional(),
        testing_order_id: z.number().optional(),
      }),
      handler: async (args) => {
        const testing_order_no =
          typeof args.testing_order_no === 'string' ? args.testing_order_no : undefined;
        const testing_order_id =
          typeof args.testing_order_id === 'number' ? args.testing_order_id : undefined;
        if (!testing_order_no && testing_order_id == null) {
          return errorResult('需要 testing_order_no 或 testing_order_id');
        }
        try {
          const client = await getLimsManager().createClient();
          const orderId = await resolveTestingOrderId(client, {
            testing_order_no,
            testing_order_id,
          });
          const tasks = await fetchTasksByOrderId(client, orderId);
          const sampleIds = new Set(tasks.map((t) => t.sampleId).filter((id) => id != null));
          return jsonResult({
            testingOrderId: orderId,
            testingOrderNo: tasks[0]?.testingOrderNo ?? testing_order_no,
            taskCount: tasks.length,
            sampleCount: sampleIds.size || tasks.length,
            tasks,
          });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_samples',
      description: '获取样品基础列表（GetSamplesBaseList）；大列表请在结果中按委托号/样品号自行过滤。',
      inputSchema: z.object({
        testing_order_no: z.string().optional(),
        sample_no: z.string().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const raw = await client.call<unknown[]>('TestingOrders/TestingOrders.ashx', {
            method: 'GetSamplesBaseList',
            page: '1',
            rows: '500',
            strWhere: '',
            filedOrder: '',
          }, { refererPath: LIMS_REFERER_UI.testingOrderBase });
          const rows = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
          const filtered = rows.filter((r) => {
            if (args.sample_no && r.sampleNo !== args.sample_no) return false;
            if (args.testing_order_no && r.testingOrderNo !== args.testing_order_no) return false;
            return true;
          });
          return jsonResult({ total: filtered.length, rows: filtered.slice(0, 50) });
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_tasks',
      description:
        '任务列表（GetTaskList）。该接口常返回空体；无数据时等价于 []。需要更全字段请用 list_task_management。',
      inputSchema: z.object({
        page: z.number().optional(),
        rows: z.number().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('Task/Task.ashx', {
            method: 'GetTaskList',
            page: String(args.page ?? 1),
            rows: String(args.rows ?? 20),
            strWhere: '',
            filedOrder: '',
          }, { accept: 'json-or-empty' });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_task_management',
      description: '任务管理视图列表（GetTaskManagementList），字段比 GetTaskList 更全。',
      inputSchema: z.object({
        page: z.number().optional(),
        rows: z.number().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('Task/Task.ashx', {
            method: 'GetTaskManagementList',
            page: String(args.page ?? 1),
            rows: String(args.rows ?? 20),
            strWhere: '',
            filedOrder: '',
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'get_task_detail',
      description:
        '任务详情（GetTaskInfo，按委托 ID）。239 上 GetTaskDetail 常返回空；可传 testing_order_no + task_id 精确定位。',
      inputSchema: z.object({
        task_id: z.number().optional(),
        testing_order_id: z.number().optional(),
        testing_order_no: z.string().optional(),
      }),
      handler: async (args) => {
        const task_id = typeof args.task_id === 'number' ? args.task_id : undefined;
        const testing_order_id =
          typeof args.testing_order_id === 'number' ? args.testing_order_id : undefined;
        const testing_order_no =
          typeof args.testing_order_no === 'string' ? args.testing_order_no : undefined;
        if (testing_order_id == null && !testing_order_no && task_id == null) {
          return errorResult('需要 testing_order_id、testing_order_no 或 task_id');
        }
        try {
          const client = await getLimsManager().createClient();
          if (testing_order_id != null || testing_order_no) {
            const orderId = await resolveTestingOrderId(client, {
              testing_order_id,
              testing_order_no,
            });
            const tasks = await fetchTasksByOrderId(client, orderId);
            if (task_id != null) {
              const hit = tasks.find((t) => Number(t.taskId) === task_id);
              if (!hit) {
                return errorResult(`委托 ${orderId} 下未找到 taskId=${task_id}`);
              }
              return jsonResult(hit);
            }
            return jsonResult(tasks.length === 1 ? tasks[0] : tasks);
          }
          const legacy = await client.call(
            'Task/Task.ashx',
            { method: 'GetTaskDetail', taskId: String(task_id) },
            { accept: 'json-or-empty' },
          );
          if (!legacy || (Array.isArray(legacy) && legacy.length === 0)) {
            return errorResult(
              'GetTaskDetail 返回空；请提供 testing_order_id 或 testing_order_no（内部走 GetTaskInfo）',
            );
          }
          return jsonResult(legacy);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'get_testing_mechanisms',
      description: '检测机构下拉（GettestingInstitute）。',
      inputSchema: z.object({}),
      handler: async () => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call(
            'IntegratedQueryManage/IntegratedQuery.ashx',
            { method: 'GettestingInstitute' },
            { refererPath: LIMS_REFERER_UI.integratedQuery },
          );
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_original_record_approvals',
      description: 'LIMIS 电子原始记录审批列表（GetExperimentApprovalList），非 ELN API。',
      inputSchema: z.object({
        my: z.string().optional().describe('我的待办筛选'),
        sample_no: z.string().optional(),
        item_name: z.string().optional(),
        status: z.string().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const params: Record<string, string> = { method: 'GetExperimentApprovalList' };
          if (args.my) params.my = String(args.my);
          if (args.sample_no) params.sampleNo = String(args.sample_no);
          if (args.item_name) params.itemName = String(args.item_name);
          if (args.status) params.status = String(args.status);
          const data = await client.call('Experiment/Experiment.ashx', params, {
            refererPath: '/UI/Experiment/ExperimentApprovalList.html',
          });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'list_todos',
      description: '统一待办列表（GetToDoList1）。',
      inputSchema: z.object({
        own: z.boolean().optional().describe('仅我的待办'),
        task_title: z.string().optional(),
        task_status: z.string().optional(),
        flow_type_code: z.string().optional(),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const params: Record<string, string> = {
            method: 'GetToDoList1',
            Own: args.own ? '1' : '0',
            Own2: '0',
            Own3: '0',
            TaskTitle: args.task_title != null ? String(args.task_title) : '',
            TaskStatus: args.task_status != null ? String(args.task_status) : '',
            flowTypeCode: args.flow_type_code != null ? String(args.flow_type_code) : '',
          };
          const data = await client.call('basicInfo/TaskService_new.ashx', params);
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'get_business_info',
      description: '工作流业务类型（GetBusinessInfo）。',
      inputSchema: z.object({}),
      handler: async () => {
        try {
          const client = await getLimsManager().createClient();
          const data = await client.call('basicInfo/TaskService.ashx', { method: 'GetBusinessInfo' });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
    {
      name: 'get_select_options',
      description: 'LIMIS 字典下拉（GetSelectList）。name 如 testCatatory（业务类别）、testingInstitute（检测机构）、taskStatus（任务状态）。',
      inputSchema: z.object({
        name: z.string().describe('字典名：testCatatory | testingInstitute | taskStatus 等'),
        source: z
          .enum(['testing_orders', 'task'])
          .optional()
          .describe('taskStatus 用 task，其余默认 testing_orders'),
      }),
      handler: async (args) => {
        try {
          const client = await getLimsManager().createClient();
          const name = String(args.name);
          const useTask = args.source === 'task' || name === 'taskStatus';
          const handler = useTask ? 'Task/Task.ashx' : 'TestingOrders/TestingOrders.ashx';
          const data = await client.call(handler, { method: 'GetSelectList', name });
          return jsonResult(data);
        } catch (e) {
          return errorResult(e instanceof Error ? e.message : String(e));
        }
      },
    },
  ];
}
