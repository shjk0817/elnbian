/**
 * LIMIS 认证：从浏览器 Cookie 同步会话
 */

import { limsAuthCache, limsSettings } from '@/lib/persistence/storage';
import {
  LIMS_HOME_PATH,
  LIMS_LOGIN_PATH,
  resolveLimsWebOrigin,
} from './constants';
import { LimisApiClient, LimisSessionError } from './client';
import { parseLimsUserDisplayName } from './user-display';
import { findTabsForOrigin } from '@/lib/shared/match-origin-tabs';
import {
  mergeLimsCookiePair,
  readLimsCookiesFromBrowser,
  readLimsCookiesFromTabDocument,
} from './read-cookies';
import { classifyLimsAuthError } from './auth-errors';

export type LimsAuthStatus = 'unknown' | 'connected' | 'no_cookies' | 'invalid';

import type { LimsCookiePair } from './types';

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

  let pair = mergeLimsCookiePair(
    await readLimsCookiesFromBrowser(origin),
    await readLimsCookiesFromTabDocument(origin),
  );

  if (!pair) {
    const tabs = await findTabsForOrigin(origin);
    await persistAuth('no_cookies', origin, null);
    const tabHint = tabs.length > 0
      ? `已检测到 ${tabs.length} 个 ${origin} 标签页，但未读到 UserId / ASP.NET_SessionId。`
      : `未找到 ${origin} 标签页。`;
    throw new Error(
      `${tabHint}请先在浏览器打开 ${origin} 并登录，再调用 lims__sync_auth。`,
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
  const tabs = await findTabsForOrigin(origin);
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
    return classifyLimsAuthError(msg);
  }
}
