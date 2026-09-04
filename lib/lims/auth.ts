/**
 * LIMIS 认证：从浏览器 Cookie 同步会话
 */

import { limsAuthCache, limsSettings } from '@/lib/persistence/storage';
import {
  LIMS_HOME_PATH,
  LIMS_LOGIN_PATH,
  limsTabUrlPattern,
  resolveLimsWebOrigin,
  LIMS_COOKIE_SESSION,
  LIMS_COOKIE_USER_ID,
} from './constants';
import { LimisApiClient, LimisSessionError } from './client';
import { LIMS_REFERER_UI } from './resolve-spec';
import { parseLimsUserDisplayName } from './user-display';

export type LimsAuthStatus = 'unknown' | 'connected' | 'no_cookies' | 'invalid';

import type { LimsCookiePair } from './types';

export async function readCookiesFromBrowser(origin: string): Promise<LimsCookiePair | null> {
  const url = origin.replace(/\/$/, '');
  const all = await chrome.cookies.getAll({ url });
  const userId = all.find((c) => c.name === LIMS_COOKIE_USER_ID)?.value;
  const sessionId = all.find((c) => c.name === LIMS_COOKIE_SESSION)?.value;
  if (!userId || !sessionId) return null;
  return { userId, sessionId };
}

/** 从已打开标签页 document.cookie 补充 UserId（HttpOnly Session 仍靠 chrome.cookies） */
async function readUserIdFromTab(origin: string): Promise<string | null> {
  const pattern = limsTabUrlPattern(origin);
  const tabs = await chrome.tabs.query({ url: pattern });
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const m = document.cookie.match(/(?:^|;\s*)UserId=([^;]+)/);
          return m ? decodeURIComponent(m[1]) : null;
        },
      });
      const uid = results[0]?.result;
      if (typeof uid === 'string' && uid.length > 0) return uid;
    } catch {
      /* 跳过不可注入页 */
    }
  }
  return null;
}

/** 写入认证缓存 */
async function persistAuth(
  status: LimsAuthStatus,
  origin: string,
  cookies: LimsCookiePair | null,
  userNamePreview: string | null = null,
): Promise<void> {
  await limsAuthCache.setValue({
    status,
    lastCheckedAt: Date.now(),
    webOrigin: origin,
    userIdPreview: cookies?.userId ?? null,
    userNamePreview: status === 'connected' ? userNamePreview : null,
    cookies,
  });
}

/** 用 GetUserName 校验 Cookie 并取用户名 */
async function validateCookies(
  origin: string,
  cookies: LimsCookiePair,
): Promise<{ valid: boolean; userName: string | null }> {
  try {
    const client = new LimisApiClient(origin, cookies);
    const data = await client.call<Record<string, unknown>>(
      'Index/HomeIndex.ashx',
      { method: 'GetUserName' },
    );
    const valid = !!(data && typeof data === 'object' && (data.state === '1' || data.state === 1));
    if (!valid) return { valid: false, userName: null };
    // 业务接口（Main.ashx）需正确 Referer；同步时一并校验，避免「已连接但工具全 500」
    await client.call('Index/Main.ashx', { method: 'GetReportNum' }, {
      refererPath: LIMS_REFERER_UI.mainDashboard,
    });
    return { valid: true, userName: parseLimsUserDisplayName(data) };
  } catch (err) {
    if (err instanceof LimisSessionError) return { valid: false, userName: null };
    throw err;
  }
}

/** 解析并缓存 LIMIS Cookie */
export async function resolveLimsCookies(forceRescan = false): Promise<LimsCookiePair> {
  const settings = await limsSettings.getValue();
  const origin = resolveLimsWebOrigin(settings);

  if (!forceRescan) {
    const cached = await limsAuthCache.getValue();
    if (cached.cookies && cached.webOrigin === origin) {
      const check = await validateCookies(origin, cached.cookies);
      if (check.valid) {
        await persistAuth('connected', origin, cached.cookies, check.userName);
        return cached.cookies;
      }
    }
  }

  let pair = await readCookiesFromBrowser(origin);
  if (pair && !pair.userId) {
    const uid = await readUserIdFromTab(origin);
    if (uid) pair = { ...pair, userId: uid };
  }
  if (!pair) {
    const uid = await readUserIdFromTab(origin);
    const sessionOnly = await readCookiesFromBrowser(origin);
    if (uid && sessionOnly?.sessionId) pair = { userId: uid, sessionId: sessionOnly.sessionId };
  }

  if (!pair) {
    await persistAuth('no_cookies', origin, null);
    throw new Error(
      `未检测到 LIMIS 登录态。请先在浏览器打开 ${origin} 并登录，再调用 lims__sync_auth。`,
    );
  }

  const check = await validateCookies(origin, pair);
  if (!check.valid) {
    await persistAuth('invalid', origin, null);
    throw new Error('LIMIS Cookie 已失效，请重新登录后同步。');
  }

  await persistAuth('connected', origin, pair, check.userName);
  return pair;
}

/** 打开 LIMIS：已连接进首页，否则进登录页；优先复用已有标签页 */
export async function openLimsLoginPage(): Promise<void> {
  const settings = await limsSettings.getValue();
  const origin = resolveLimsWebOrigin(settings);
  const cache = await limsAuthCache.getValue();
  const connected = cache.status === 'connected' && cache.webOrigin === origin;
  const path = connected ? LIMS_HOME_PATH : LIMS_LOGIN_PATH;
  const url = `${origin}${path}`;
  const tabs = await chrome.tabs.query({ url: limsTabUrlPattern(origin) });
  const tab = tabs.find((t) => t.id != null);
  if (tab?.id) {
    await chrome.tabs.update(tab.id, { url, active: true });
    if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url, active: true });
}

/** 刷新连接状态 */
export async function refreshLimsAuthState(): Promise<LimsAuthStatus> {
  try {
    await resolveLimsCookies(true);
    return 'connected';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('未检测到')) return 'no_cookies';
    if (msg.includes('失效')) return 'invalid';
    return 'unknown';
  }
}
