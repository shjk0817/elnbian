/**
 * ELN 能力入口：认证状态与 API 客户端工厂
 */

import type { ElnAuthStatus } from './auth';
import {
  createAuthenticatedClient,
  openElnLoginPage,
  refreshElnAuthState,
  resolveElnToken,
} from './auth';
import type { ElnApiClient } from './client';

/** ELN 后台单例，封装认证与客户端创建 */
class ElnManager {
  /** 强制从 ELN 标签页重新同步 token */
  async syncAuth(): Promise<string> {
    return resolveElnToken(true);
  }

  /** 检查当前 token 是否有效 */
  async checkAuth(): Promise<boolean> {
    try {
      await resolveElnToken();
      return true;
    } catch {
      return false;
    }
  }

  /** 刷新并返回连接状态 */
  async refreshStatus(): Promise<ElnAuthStatus> {
    return refreshElnAuthState();
  }

  /** 打开 ELN 登录页 */
  async openLogin(): Promise<void> {
    await openElnLoginPage();
  }

  /** 获取已认证的 API 客户端 */
  async createClient(): Promise<ElnApiClient> {
    return createAuthenticatedClient();
  }
}

let instance: ElnManager | undefined;

/** 获取 ELN Manager 单例 */
export function getElnManager(): ElnManager {
  if (!instance) instance = new ElnManager();
  return instance;
}
