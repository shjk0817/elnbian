#!/usr/bin/env node
import { resolveLimsRefererPath } from '../lib/lims/referer.ts';

const ORIGIN = 'http://10.1.228.239';
const USER = process.env.LIMIS_USER;
const PWD = process.env.LIMIS_PWD;
const UA = 'Mozilla/5.0 Chrome/120';

async function login() {
  const res = await fetch(`${ORIGIN}/AjaxRequest/Index/HomeIndex.ashx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${ORIGIN}/UI/Login.html`,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
    },
    body: new URLSearchParams({
      method: 'Login',
      username: USER,
      pwd: Buffer.from(encodeURIComponent(PWD), 'utf8').toString('base64'),
      check: 'true',
    }),
  });
  const data = await res.json();
  const sid = res.headers.getSetCookie().find((x) => x.includes('ASP.NET_SessionId'))
    ?.match(/ASP\.NET_SessionId=([^;]+)/)?.[1];
  return { session: sid, userId: String(data.UserId) };
}

async function call(jar, handler, body) {
  const ref = resolveLimsRefererPath(handler, body.method);
  const res = await fetch(`${ORIGIN}/AjaxRequest/${handler}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${ORIGIN}${ref}`,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
      Cookie: `ASP.NET_SessionId=${jar.session}; UserId=${jar.userId}`,
    },
    body: new URLSearchParams(Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]))),
  });
  const text = await res.text();
  console.log(JSON.stringify(body), '=>', res.status, text.slice(0, 100));
}

const jar = await login();
const cases = [
  { handler: 'basicInfo/Common.ashx', body: { method: 'GetSelectList', type: 'PC_Department' } },
  { handler: 'basicInfo/Common.ashx', body: { method: 'GetSelectList', name: 'PC_Department' } },
  { handler: 'TestingOrders/TestingOrders.ashx', body: { method: 'GetSelectList', name: 'testCatatory' } },
  { handler: 'TestingOrders/TestingOrders.ashx', body: { method: 'GetSelectList', name: 'testingInstitute' } },
  { handler: 'Task/Task.ashx', body: { method: 'GetSelectList', name: 'taskStatus' } },
];
for (const c of cases) await call(jar, c.handler, c.body);
