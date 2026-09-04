/**
 * LIMIS 设置页与 background 消息桥接
 */

import { getLimsManager } from '@/lib/lims/manager';

export type LimsBridgeMessage =
  | { type: 'lims_refresh_status' }
  | { type: 'lims_open_login' }
  | { type: 'lims_sync_auth' };

/** 注册 LIMIS runtime.sendMessage 处理器 */
export function setupLimsBridge(): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'lims_refresh_status') {
      void getLimsManager().refreshStatus().then((status) => sendResponse({ status }));
      return true;
    }
    if (msg?.type === 'lims_open_login') {
      void getLimsManager().openLogin().then(() => sendResponse({ ok: true }));
      return true;
    }
    if (msg?.type === 'lims_sync_auth') {
      void getLimsManager().syncAuth().then((r) => sendResponse({ ok: true, ...r }));
      return true;
    }
    return false;
  });
}
