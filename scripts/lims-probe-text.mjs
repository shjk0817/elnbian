#!/usr/bin/env node
import { resolveLimsRefererPath } from '../lib/lims/referer.ts';

const O = process.env.LIMIS_ORIGIN ?? 'http://10.1.228.239';
const U = process.env.LIMIS_USER;
const P = process.env.LIMIS_PWD;
const UA = 'Mozilla/5.0 Chrome/120';

async function login() {
  const r = await fetch(`${O}/AjaxRequest/Index/HomeIndex.ashx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${O}/UI/Login.html`,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
    },
    body: new URLSearchParams({
      method: 'Login',
      username: U ?? '',
      pwd: Buffer.from(encodeURIComponent(P ?? ''), 'utf8').toString('base64'),
      check: 'true',
    }),
  });
  const j = await r.json();
  const sid = r.headers.getSetCookie().find((x) => x.includes('ASP.NET'))
    ?.match(/ASP\.NET_SessionId=([^;]+)/)?.[1];
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
  console.log(`--- ${body.method} HTTP ${res.status} len=${t.length}`);
  console.log(t.slice(0, 300));
  console.log('starts with', JSON.stringify(t.trim().slice(0, 20)));
}

const jar = await login();
console.log('uid', jar.uid);
await post('Index/HomeIndex.ashx', { method: 'GetMenuList_New' });
await post('Task/Task.ashx', { method: 'GetTaskList', page: '1', rows: '1', strWhere: '', filedOrder: '' });
await post('Task/Task.ashx', { method: 'GetTaskManagementList', page: '1', rows: '1', strWhere: '', filedOrder: '' });
