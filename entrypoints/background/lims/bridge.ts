/**
 * LIMIS 设置页与 background 消息桥接
 */

import { getLimsManager } from '@/lib/lims/manager';
import { replyAsync } from '@/lib/shared/safe-message-response';

export type LimsBridgeMessage =
  | { type: 'lims_refresh_status' }
  | { type: 'lims_open_login' }
  | { type: 'lims_sync_auth' };

/** 注册 LIMIS runtime.sendMessage 处理器 */
export function setupLimsBridge(): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'lims_refresh_status') {
      return replyAsync(sendResponse, async () => {
        const status = await getLimsManager().refreshStatus();
        return { ok: true, status };
      });
    }
    if (msg?.type === 'lims_open_login') {
      return replyAsync(sendResponse, async () => {
        await getLimsManager().openLogin();
        return { ok: true };
      });
    }
    if (msg?.type === 'lims_sync_auth') {
      return replyAsync(sendResponse, async () => {
        const r = await getLimsManager().syncAuth();
        return { ok: true, ...r };
      });
    }
    return false;
  });
}
