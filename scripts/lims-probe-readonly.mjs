#!/usr/bin/env node
/**
 * LIMIS 只读接口探测 — 对齐 LimisApiClient + resolveLimsRefererPath
 * 用法：LIMIS_USER=xxx LIMIS_PWD=xxx node scripts/lims-probe-readonly.mjs
 */

import { resolveLimsRefererPath } from '../lib/lims/referer.ts';

const ORIGIN = process.env.LIMIS_ORIGIN ?? 'http://10.1.228.239';
const USER = process.env.LIMIS_USER ?? '';
const PWD = process.env.LIMIS_PWD ?? '';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** 与内置工具一一对应的探测用例 */
const CASES = [
  { tool: 'get_user_info', handler: 'Index/HomeIndex.ashx', body: { method: 'GetUserName' } },
  { tool: 'get_menu', handler: 'Index/HomeIndex.ashx', body: { method: 'GetMenuList_New' } },
  { tool: 'get_dashboard_counts', handler: 'Index/Main.ashx', body: { method: 'GetReportNum' } },
  {
    tool: 'list_testing_orders',
    handler: 'TestingOrders/TestingOrders.ashx',
    body: { method: 'GetTestingOrderList', page: '1', rows: '5', cha: '1', strWhere: '', filedOrder: '' },
  },
  {
    tool: 'list_samples',
    handler: 'TestingOrders/TestingOrders.ashx',
    body: { method: 'GetSamplesBaseList', page: '1', rows: '50', strWhere: '', filedOrder: '' },
  },
  {
    tool: 'list_tasks',
    handler: 'Task/Task.ashx',
    body: { method: 'GetTaskList', page: '1', rows: '5', strWhere: '', filedOrder: '' },
  },
  {
    tool: 'list_task_management',
    handler: 'Task/Task.ashx',
    body: { method: 'GetTaskManagementList', page: '1', rows: '5', strWhere: '', filedOrder: '' },
  },
  {
    tool: 'list_todos',
    handler: 'basicInfo/TaskService_new.ashx',
    body: {
      method: 'GetToDoList1', Own: '0', Own2: '0', Own3: '0', TaskTitle: '', TaskStatus: '', flowTypeCode: '',
    },
  },
  { tool: 'get_business_info', handler: 'basicInfo/TaskService.ashx', body: { method: 'GetBusinessInfo' } },
  { tool: 'get_select_options', handler: 'TestingOrders/TestingOrders.ashx', body: { method: 'GetSelectList', name: 'testCatatory' } },
  { tool: 'get_select_options_task', handler: 'Task/Task.ashx', body: { method: 'GetSelectList', name: 'taskStatus' } },
  { tool: 'list_original_record_approvals', handler: 'Experiment/Experiment.ashx', body: { method: 'GetExperimentApprovalList' } },
  {
    tool: 'search_integrated',
    handler: 'IntegratedQueryManage/IntegratedQuery.ashx',
    body: { method: 'GetIntegratedQueryInfo', type: '4', cha: '1', authType: '1', page: '1', size: '5' },
  },
  { tool: 'get_testing_mechanisms', handler: 'IntegratedQueryManage/IntegratedQuery.ashx', body: { method: 'GettestingInstitute' } },
];

function encodePwd(pwd) {
  return Buffer.from(encodeURIComponent(pwd), 'utf8').toString('base64');
}

async function login() {
  const jar = new Map();
  const res = await fetch(`${ORIGIN}/AjaxRequest/Index/HomeIndex.ashx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${ORIGIN}/UI/Login.html`,
      'User-Agent': UA,
    },
    body: new URLSearchParams({
      method: 'Login',
      username: USER,
      pwd: encodePwd(PWD),
      check: 'true',
    }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const line of setCookie) {
    const m = line.match(/^(ASP\.NET_SessionId)=([^;]+)/);
    if (m) jar.set(m[1], m[2]);
  }
  const data = await res.json();
  if (data.UserId) jar.set('UserId', String(data.UserId));
  if (!jar.has('ASP.NET_SessionId') || !jar.has('UserId')) {
    throw new Error(`登录失败: ${JSON.stringify(data)}`);
  }
  return jar;
}

async function callApi(jar, handler, body) {
  const method = body.method;
  const refererPath = resolveLimsRefererPath(handler, method);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) params.set(k, String(v));
  const res = await fetch(`${ORIGIN}/AjaxRequest/${handler}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${ORIGIN}${refererPath}`,
      'User-Agent': UA,
      Cookie: `ASP.NET_SessionId=${jar.get('ASP.NET_SessionId')}; UserId=${jar.get('UserId')}`,
    },
    body: params.toString(),
  });
  const text = await res.text();
  return { status: res.status, refererPath, preview: text.slice(0, 200) };
}

async function main() {
  if (!USER || !PWD) {
    console.error('请设置 LIMIS_USER 与 LIMIS_PWD 环境变量');
    process.exit(1);
  }
  const jar = await login();
  console.log(`登录成功 UserId=${jar.get('UserId')}\n`);
  const fails = [];
  for (const c of CASES) {
    const r = await callApi(jar, c.handler, c.body);
    const ok = r.status === 200 && !r.preview.includes('未将对象引用');
    const mark = ok ? 'OK ' : 'FAIL';
    console.log(`${mark} ${c.tool.padEnd(32)} HTTP ${r.status}  Referer=${r.refererPath}`);
    if (!ok) {
      console.log(`     ${r.preview.replace(/\s+/g, ' ').slice(0, 120)}`);
      fails.push(c.tool);
    }
  }
  if (fails.length) {
    console.log(`\n失败 ${fails.length} 个: ${fails.join(', ')}`);
    process.exit(1);
  }
  console.log('\n全部通过');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
