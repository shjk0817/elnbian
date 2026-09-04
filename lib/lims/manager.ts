/**
 * LIMIS 能力入口：认证与 API 客户端工厂
 */

import type { LimsAuthStatus } from './auth';
import {
  createLimisClient,
  type LimisApiClient,
} from './client';
import {
  openLimsLoginPage,
  refreshLimsAuthState,
  resolveLimsCookies,
} from './auth';

/** LIMIS 后台单例 */
class LimsManager {
  /** 强制从浏览器重新同步 Cookie */
  async syncAuth(): Promise<LimsCookiePairPreview> {
    const cookies = await resolveLimsCookies(true);
    return { userId: cookies.userId, connected: true };
  }

  /** 检查当前会话是否有效 */
  async checkAuth(): Promise<boolean> {
    try {
      await resolveLimsCookies();
      return true;
    } catch {
      return false;
    }
  }

  /** 刷新并返回连接状态 */
  async refreshStatus(): Promise<LimsAuthStatus> {
    return refreshLimsAuthState();
  }

  /** 打开登录页 */
  async openLogin(): Promise<void> {
    await openLimsLoginPage();
  }

  /** 获取已认证客户端 */
  async createClient(): Promise<LimisApiClient> {
    const cookies = await resolveLimsCookies();
    return createLimisClient(cookies);
  }
}

export type LimsCookiePairPreview = { userId: string; connected: boolean };

let instance: LimsManager | undefined;

/** 获取 LimsManager 单例 */
export function getLimsManager(): LimsManager {
  if (!instance) instance = new LimsManager();
  return instance;
}
