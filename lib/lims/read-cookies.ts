/**
 * LIMIS Cookie 读取：优先从已打开标签页（含 cookieStoreId）合并，再回退配置 origin
 */

import { findTabsForOrigin } from '@/lib/shared/match-origin-tabs';
import {
  LIMS_COOKIE_SESSION,
  LIMS_COOKIE_USER_ID,
} from './constants';
import type { LimsCookiePair } from './types';

const USER_ID_NAMES = [LIMS_COOKIE_USER_ID, 'userid'];
const SESSION_NAMES = [LIMS_COOKIE_SESSION, 'asp.net_sessionid'];

/** 合并 Cookie 列表（按 name 去重，后写覆盖） */
function mergeCookies(lists: chrome.cookies.Cookie[][]): chrome.cookies.Cookie[] {
  const map = new Map<string, chrome.cookies.Cookie>();
  for (const list of lists) {
    for (const c of list) map.set(c.name.toLowerCase(), c);
  }
  return [...map.values()];
}

/** 按候选名取 Cookie 值（大小写不敏感） */
function pickValue(all: chrome.cookies.Cookie[], names: string[]): string | undefined {
  const lower = new Set(names.map((n) => n.toLowerCase()));
  for (const c of all) {
    if (lower.has(c.name.toLowerCase()) && c.value) return c.value;
  }
  return undefined;
}

/** 从 Cookie 列表解析 LIMIS 会话对 */
export function pairFromCookieList(all: chrome.cookies.Cookie[]): LimsCookiePair | null {
  const userId = pickValue(all, USER_ID_NAMES);
  const sessionId = pickValue(all, SESSION_NAMES);
  if (!userId || !sessionId) return null;
  return { userId, sessionId };
}

/** 收集单个标签页关联的 Cookie */
async function cookiesForTab(tab: chrome.tabs.Tab): Promise<chrome.cookies.Cookie[]> {
  if (!tab.url?.startsWith('http')) return [];
  const storeId = 'cookieStoreId' in tab
    ? (tab as chrome.tabs.Tab & { cookieStoreId?: string }).cookieStoreId
    : undefined;
  const baseOpts = storeId ? { storeId } : {};
  let tabUrl: URL;
  try {
    tabUrl = new URL(tab.url);
  } catch {
    return [];
  }
  const origin = tabUrl.origin;
  const pathUrl = tab.url.split('?')[0] ?? tab.url;
  const lists = await Promise.all([
    chrome.cookies.getAll({ url: tab.url, ...baseOpts }),
    chrome.cookies.getAll({ url: origin, ...baseOpts }),
    chrome.cookies.getAll({ url: `${origin}/`, ...baseOpts }),
    chrome.cookies.getAll({ url: pathUrl, ...baseOpts }),
    chrome.cookies.getAll({ domain: tabUrl.hostname, ...baseOpts }),
  ]);
  return mergeCookies(lists);
}

/** 按配置 origin 回退查询 Cookie */
async function cookiesForConfiguredOrigin(origin: string): Promise<chrome.cookies.Cookie[]> {
  const base = origin.replace(/\/$/, '');
  const host = new URL(base).hostname;
  const urlCandidates = [
    base,
    `${base}/`,
    `${base}/UI/`,
    `${base}/UI/Index/home.html`,
    `${base}/UI/Login.html`,
  ];
  const lists: chrome.cookies.Cookie[][] = [];
  for (const url of urlCandidates) {
    lists.push(await chrome.cookies.getAll({ url }));
  }
  lists.push(await chrome.cookies.getAll({ domain: host }));
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    lists.push(await chrome.cookies.getAll({ domain: `.${host}` }));
  }
  return mergeCookies(lists);
}

/** 从浏览器读取 LIMIS 会话 Cookie */
export async function readLimsCookiesFromBrowser(origin: string): Promise<LimsCookiePair | null> {
  const tabs = await findTabsForOrigin(origin);
  const lists: chrome.cookies.Cookie[][] = [];
  for (const tab of tabs) {
    lists.push(await cookiesForTab(tab));
  }
  lists.push(await cookiesForConfiguredOrigin(origin));
  return pairFromCookieList(mergeCookies(lists));
}

/** 从页面 document.cookie 补充（MAIN 世界；Session 常为 HttpOnly 则仍可能为空） */
export async function readLimsCookiesFromTabDocument(
  origin: string,
): Promise<Partial<LimsCookiePair>> {
  const tabs = await findTabsForOrigin(origin);
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          const pick = (name: string) => {
            const re = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`, 'i');
            const m = document.cookie.match(re);
            return m ? decodeURIComponent(m[1]) : null;
          };
          return {
            userId: pick('UserId'),
            sessionId: pick('ASP.NET_SessionId'),
          };
        },
      });
      const raw = results[0]?.result;
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as { userId?: string | null; sessionId?: string | null };
      const partial: Partial<LimsCookiePair> = {};
      if (r.userId) partial.userId = r.userId;
      if (r.sessionId) partial.sessionId = r.sessionId;
      if (partial.userId || partial.sessionId) return partial;
    } catch {
      /* 跳过不可注入页 */
    }
  }
  return {};
}

/** 合并 API 与 document 两路结果 */
export function mergeLimsCookiePair(
  api: LimsCookiePair | null,
  doc: Partial<LimsCookiePair>,
): LimsCookiePair | null {
  const userId = api?.userId ?? doc.userId;
  const sessionId = api?.sessionId ?? doc.sessionId;
  if (!userId || !sessionId) return null;
  return { userId, sessionId };
}
