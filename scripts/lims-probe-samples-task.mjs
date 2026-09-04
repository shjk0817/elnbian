#!/usr/bin/env node
import { resolveLimsRefererPath } from '../lib/lims/referer.ts';

const O = process.env.LIMIS_ORIGIN ?? 'http://10.1.228.239';
const U = process.env.LIMIS_USER ?? '';
const P = process.env.LIMIS_PWD ?? '';
const UA = 'Mozilla/5.0 Chrome/120';

function encodePwd(pwd) {
  return Buffer.from(encodeURIComponent(pwd), 'utf8').toString('base64');
}

async function login() {
  const r = await fetch(`${O}/AjaxRequest/Index/HomeIndex.ashx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${O}/UI/Login.html`,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
    },
    body: new URLSearchParams({ method: 'Login', username: U, pwd: encodePwd(P), check: 'true' }),
  });
  const j = await r.json();
  const sid = r.headers.getSetCookie?.().find((x) => x.includes('ASP.NET'))?.match(/ASP\.NET_SessionId=([^;]+)/)?.[1];
  return { sid, uid: String(j.UserId) };
}

async function post(handler, body) {
  const jar = await login();
  const ref = resolveLimsRefererPath(handler, body.method);
  const res = await fetch(`${O}/AjaxRequest/${handler}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${O}${ref}`,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
      Cookie: `ASP.NET_SessionId=${jar.sid}; UserId=${jar.uid}`,
    },
    body: new URLSearchParams(body),
  });
  const t = await res.text();
  return { status: res.status, text: t, preview: t.slice(0, 400) };
}

async function main() {
  if (!U || !P) {
    console.error('need LIMIS_USER LIMIS_PWD');
    process.exit(1);
  }

  const orderNo = 'GLS1-260004';
  const list = await post('TestingOrders/TestingOrders.ashx', {
    method: 'GetTestingOrderList',
    page: '1',
    rows: '5',
    cha: '1',
    strWhere: '',
    filedOrder: '',
    testingNO: orderNo,
  });
  console.log('GetTestingOrderList', list.preview);

  let orderId = '';
  try {
    const rows = JSON.parse(list.text);
    orderId = String(rows?.[0]?.testingOrderId ?? rows?.rows?.[0]?.testingOrderId ?? '');
  } catch {
    /* ignore */
  }
  console.log('resolved orderId', orderId);

  const samples = await post('TestingOrders/TestingOrders.ashx', {
    method: 'GetSamplesBaseList',
    page: '1',
    rows: '500',
    strWhere: '',
    filedOrder: '',
  });
  let matchCount = 0;
  try {
    const rows = JSON.parse(samples.text);
    const arr = Array.isArray(rows) ? rows : [];
    matchCount = arr.filter((r) => r.testingOrderNo === orderNo).length;
  } catch {
    /* ignore */
  }
  console.log('GetSamplesBaseList filter', orderNo, 'count', matchCount, 'preview', samples.preview);

  const iq = await post('IntegratedQueryManage/IntegratedQuery.ashx', {
    method: 'GetIntegratedQueryInfo',
    type: '4',
    cha: '1',
    authType: '1',
    page: '1',
    size: '5',
    testingOrderNo: orderNo,
  });
  console.log('IntegratedQuery', iq.preview);
  let iqOid = '';
  try {
    const d = JSON.parse(iq.text);
    const row = Array.isArray(d) ? d[0] : d?.rows?.[0];
    iqOid = String(row?.testingOrderId ?? '');
  } catch {
    /* ignore */
  }
  if (iqOid) {
    const sc = await post('TestingOrders/TestingOrders.ashx', {
      method: 'SamplesCountBytestingOrderNo',
      testingOrderId: iqOid,
    });
    console.log('SamplesCount id', iqOid, sc.preview);
    const sb1 = await post('TestingOrders/TestingOrders.ashx', {
      method: 'GetSamplesBaseList',
      page: '1',
      rows: '50',
      strWhere: ` and testingOrderNo='${orderNo}' `,
      filedOrder: '',
    });
    console.log('GetSamples strWhere orderNo len', sb1.text.length, sb1.preview.slice(0, 200));
    const sb2 = await post('TestingOrders/TestingOrders.ashx', {
      method: 'GetSamplesBaseList',
      page: '1',
      rows: '50',
      strWhere: ` and testingOrderId=${iqOid} `,
      filedOrder: '',
    });
    console.log('GetSamples strWhere orderId len', sb2.text.length, sb2.preview.slice(0, 200));
    const ti = await post('Task/Task.ashx', { method: 'GetTaskInfo', testingOrderId: iqOid });
    console.log('GetTaskInfo', ti.preview);
  }

  const cases = [
    ['SamplesCount testingOrderNo', 'TestingOrders/TestingOrders.ashx', {
      method: 'SamplesCountBytestingOrderNo',
      testingOrderNo: orderNo,
    }],
    ['SamplesCount testingOrderIds comma', 'TestingOrders/TestingOrders.ashx', {
      method: 'SamplesCountBytestingOrderNo',
      testingOrderIds: orderId ? `,${orderId}` : ',0',
    }],
    ['SamplesCount testingOrderId', 'TestingOrders/TestingOrders.ashx', {
      method: 'SamplesCountBytestingOrderNo',
      testingOrderId: orderId || '0',
    }],
    ['GetTaskDetail 1921305', 'Task/Task.ashx', { method: 'GetTaskDetail', taskId: '1921305' }],
    ['GetTaskInfo order', 'Task/Task.ashx', { method: 'GetTaskInfo', testingOrderId: '1207645' }],
    ['GetTaskManagementList', 'Task/Task.ashx', {
      method: 'GetTaskManagementList', page: '1', rows: '3', strWhere: '', filedOrder: '',
    }],
  ];

  for (const [label, handler, body] of cases) {
    const r = await post(handler, body);
    console.log(`\n--- ${label} HTTP ${r.status} len=${r.text.length}`);
    console.log(r.preview);
  }
}

main().catch(console.error);
