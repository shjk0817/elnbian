/**
 * ELN 设置页与 background 的一次性 sendMessage 桥接
 */

import { getElnManager } from '@/lib/eln/manager';
import { seedElnBuiltinContent } from '@/lib/eln/seed-eln-builtin';

export type ElnBridgeMessage =
  | { type: 'eln_refresh_status' }
  | { type: 'eln_open_login' }
  | { type: 'eln_seed_skill' }
  | { type: 'eln_seed_builtin' };

/** 注册 ELN 相关的 runtime.sendMessage 处理器 */
export function setupElnBridge(): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'eln_seed_skill' || msg?.type === 'eln_seed_builtin') {
      void seedElnBuiltinContent().then((result) =>
        sendResponse({ seeded: result.skillUpdated, ...result }),
      );
      return true;
    }
    if (msg?.type === 'eln_refresh_status') {
      void getElnManager().refreshStatus().then((status) => sendResponse({ status }));
      return true;
    }
    if (msg?.type === 'eln_open_login') {
      void getElnManager().openLogin().then(() => sendResponse({ ok: true }));
      return true;
    }
    return false;
  });
}
