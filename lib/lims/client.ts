/**
 * LIMIS ASHX HTTP 客户端（Cookie 会话 + form POST）
 */

import {
  LIMS_AJAX_BASE,
  LIMS_COOKIE_SESSION,
  LIMS_COOKIE_USER_ID,
  resolveLimsWebOrigin,
} from './constants';
import type { LimsCookiePair } from './types';
import { limsSettings } from '@/lib/persistence/storage';
import { resolveLimsRefererPath } from './referer';
import { withLimsReferer } from './referer-dnr';

/** 浏览器 UA，部分 LIMIS 网关会校验 */
const LIMS_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export class LimisSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LimisSessionError';
  }
}

export class LimisApiError extends Error {
  constructor(message: string, public readonly raw?: string) {
    super(message);
    this.name = 'LimisApiError';
  }
}

export type LimisCallOptions = {
  /** 相对 /UI/ 的 Referer 路径 */
  refererPath?: string;
  /** json：默认解析 JSON；text：原样文本；json-or-empty：空体视为 [] */
  accept?: 'json' | 'text' | 'json-or-empty';
};

/** 解析 ASHX 响应体，识别登录失效 */
export function parseLimisResponseBody(
  text: string,
  accept: LimisCallOptions['accept'] = 'json',
): unknown {
  const trimmed = text.trim();
  if (trimmed.includes('<!--isBack-->')) {
    throw new LimisSessionError('LIMIS 未登录或会话已失效，请先浏览器登录后调用 lims__sync_auth');
  }
  if (accept === 'text') {
    return trimmed;
  }
  if (!trimmed) {
    if (accept === 'json-or-empty') return [];
    throw new LimisApiError('LIMIS 返回空响应', '');
  }
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    throw new LimisApiError('LIMIS 返回非 JSON', trimmed.slice(0, 300));
  }
  const data = JSON.parse(trimmed) as unknown;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (obj.states === 2 || obj.states === '2') {
      throw new LimisSessionError(String(obj.msg ?? '登录信息已失效'));
    }
    if (obj.state === '-1' || obj.state === -1) {
      throw new LimisSessionError(String(obj.msg ?? '未登录'));
    }
  }
  return data;
}

/** LIMIS ASHX 客户端 */
export class LimisApiClient {
  private readonly origin: string;
  private cookies: LimsCookiePair | null;

  constructor(origin: string, cookies: LimsCookiePair) {
    this.origin = origin.replace(/\/$/, '');
    this.cookies = cookies;
  }

  /** 当前 origin */
  get webOrigin(): string {
    return this.origin;
  }

  /** 更新 Cookie */
  setCookies(cookies: LimsCookiePair): void {
    this.cookies = cookies;
  }

  /** 构建 Cookie 头 */
  private cookieHeader(): string {
    if (!this.cookies) throw new LimisSessionError('LIMIS Cookie 未设置');
    return `${LIMS_COOKIE_SESSION}=${this.cookies.sessionId}; ${LIMS_COOKIE_USER_ID}=${this.cookies.userId}`;
  }

  /** 通用 ASHX POST */
  async call<T = unknown>(
    handlerPath: string,
    params: Record<string, string | number | boolean | undefined>,
    options?: LimisCallOptions,
  ): Promise<T> {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) body.set(k, String(v));
    }
    const method = params.method != null ? String(params.method) : undefined;
    const refererPath = options?.refererPath ?? resolveLimsRefererPath(handlerPath, method);
    const referer = `${this.origin}${refererPath.startsWith('/') ? '' : '/'}${refererPath}`;
    const url = `${this.origin}${LIMS_AJAX_BASE}/${handlerPath.replace(/^\//, '')}`;
    const bodyStr = body.toString();
    const cookie = this.cookieHeader();
    const res = await withLimsReferer(referer, () =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': LIMS_USER_AGENT,
          Cookie: cookie,
        },
        body: bodyStr,
      }),
    );
    const text = await res.text();
    if (!res.ok) {
      throw new LimisApiError(`HTTP ${res.status}`, text.slice(0, 300));
    }
    return parseLimisResponseBody(text, options?.accept) as T;
  }
}

/** 使用当前设置与 Cookie 创建客户端 */
export async function createLimisClient(cookies: LimsCookiePair): Promise<LimisApiClient> {
  const settings = await limsSettings.getValue();
  const origin = resolveLimsWebOrigin(settings);
  return new LimisApiClient(origin, cookies);
}
