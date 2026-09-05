/**
 * ELN 认证：从用户已登录的 ELN 标签页读取 JWT，缓存于扩展 storage
 */

import { elnAuthCache } from '@/lib/persistence/storage';
import { ELN_API_BASE_URL, ELN_LOGIN_URL, ELN_TOKEN_KEY, ELN_WEB_ORIGIN } from './constants';
import { ElnApiClient } from './client';
import { ElnAuthError, isNetworkError } from './errors';
import { findTabsForOrigin } from '@/lib/shared/match-origin-tabs';

export type ElnAuthStatus = 'unknown' | 'connected' | 'no_token' | 'invalid';

/** 从单个标签页读取 ELN localStorage 中的 token（MAIN 世界，读取页面真实 storage） */
async function readTokenFromTab(tabId: number): Promise<string | null> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: (key: string) => localStorage.getItem(key),
    args: [ELN_TOKEN_KEY],
  });
  const token = results[0]?.result;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/** 扫描所有 ELN 标签页，返回第一个有效 token */
export async function readTokenFromElntabs(): Promise<string | null> {
  const tabs = await findTabsForOrigin(ELN_WEB_ORIGIN);
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const token = await readTokenFromTab(tab.id);
      if (token) return token;
    } catch {
      /* 无 scripting 权限或页面不可注入时跳过 */
    }
  }
  return null;
}

/** 将认证状态写入 storage，供设置页展示 */
async function persistAuthStatus(status: ElnAuthStatus, token: string | null): Promise<void> {
  await elnAuthCache.setValue({
    status,
    lastCheckedAt: Date.now(),
    tokenPreview: token ? `${token.slice(0, 12)}…` : null,
    cachedToken: token,
  });
}

/** 用 API 校验 token 是否仍有效；网络故障抛错，认证失败返回 false */
async function validateToken(token: string): Promise<boolean> {
  const client = new ElnApiClient(ELN_API_BASE_URL);
  client.setToken(token);
  try {
    return await client.checkAuth();
  } catch (err) {
    if (isNetworkError(err)) throw err;
    if (err instanceof ElnAuthError) return false;
    throw err;
  }
}

/** 从缓存、ELN 标签页依次获取 token；找不到则抛错 */
export async function resolveElnToken(forceRescan = false): Promise<string> {
  if (!forceRescan) {
    const cached = await elnAuthCache.getValue();
    if (cached.cachedToken) {
      try {
        const valid = await validateToken(cached.cachedToken);
        if (valid) {
          await persistAuthStatus('connected', cached.cachedToken);
          return cached.cachedToken;
        }
      } catch (err) {
        if (isNetworkError(err)) {
          await persistAuthStatus('unknown', cached.cachedToken);
          throw new Error('无法连接 ELN API，请检查内网后重试。');
        }
      }
    }
  }

  const fromTab = await readTokenFromElntabs();
  if (!fromTab) {
    await persistAuthStatus('no_token', null);
    throw new Error(
      '未检测到 ELN 登录态。请先在浏览器打开 ELN 并完成登录，然后调用 eln__sync_auth 或到设置 → ELN 连接 同步。',
    );
  }

  let valid: boolean;
  try {
    valid = await validateToken(fromTab);
  } catch (err) {
    if (isNetworkError(err)) {
      await persistAuthStatus('unknown', fromTab);
      throw new Error('无法连接 ELN API，请检查内网后重试。');
    }
    throw err;
  }
  if (!valid) {
    await elnAuthCache.setValue({
      status: 'invalid',
      lastCheckedAt: Date.now(),
      tokenPreview: `${fromTab.slice(0, 12)}…`,
      cachedToken: null,
    });
    throw new Error('ELN token 已失效，请重新登录 ELN 后同步。');
  }

  await elnAuthCache.setValue({
    status: 'connected',
    lastCheckedAt: Date.now(),
    tokenPreview: `${fromTab.slice(0, 12)}…`,
    cachedToken: fromTab,
  });
  return fromTab;
}

/** 刷新连接状态（设置页 / 后台定时调用） */
export async function refreshElnAuthState(): Promise<ElnAuthStatus> {
  try {
    await resolveElnToken(true);
    return 'connected';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('未检测到')) return 'no_token';
    if (msg.includes('失效')) return 'invalid';
    return 'unknown';
  }
}

/** 打开 ELN 登录页 */
export async function openElnLoginPage(): Promise<void> {
  await chrome.tabs.create({ url: ELN_LOGIN_URL, active: true });
}

/** 创建已注入有效 token 的 API 客户端 */
export async function createAuthenticatedClient(): Promise<ElnApiClient> {
  const token = await resolveElnToken();
  const client = new ElnApiClient(ELN_API_BASE_URL);
  client.setToken(token);
  return client;
}
