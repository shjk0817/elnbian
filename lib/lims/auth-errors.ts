/**
 * LIMIS 认证错误分类（供 refreshLimsAuthState 与 UI 使用）
 */

import type { LimsAuthStatus } from './auth';

/** 根据 resolveLimsCookies 抛出的错误消息推断连接状态 */
export function classifyLimsAuthError(message: string): LimsAuthStatus {
  if (
    message.includes('未找到')
    || message.includes('未读到')
    || message.includes('未检测到')
  ) {
    return 'no_cookies';
  }
  if (message.includes('失效')) return 'invalid';
  if (
    message.includes('Failed to fetch')
    || message.includes('NetworkError')
    || message.includes('网络')
  ) {
    return 'unknown';
  }
  return 'unknown';
}
