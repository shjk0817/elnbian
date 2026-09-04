/**
 * ELN 设置页与 background 的一次性 sendMessage 桥接
 */

import { getElnManager } from '@/lib/eln/manager';
import { seedElnBuiltinContent } from '@/lib/eln/seed-eln-builtin';
import { replyAsync } from '@/lib/shared/safe-message-response';

export type ElnBridgeMessage =
  | { type: 'eln_refresh_status' }
  | { type: 'eln_open_login' }
  | { type: 'eln_seed_skill' }
  | { type: 'eln_seed_builtin' };

/** 注册 ELN 相关的 runtime.sendMessage 处理器 */
export function setupElnBridge(): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'eln_seed_skill' || msg?.type === 'eln_seed_builtin') {
      return replyAsync(sendResponse, async () => {
        const result = await seedElnBuiltinContent();
        return { seeded: result.skillUpdated, ...result };
      });
    }
    if (msg?.type === 'eln_refresh_status') {
      return replyAsync(sendResponse, async () => {
        const status = await getElnManager().refreshStatus();
        return { ok: true, status };
      });
    }
    if (msg?.type === 'eln_open_login') {
      return replyAsync(sendResponse, async () => {
        await getElnManager().openLogin();
        return { ok: true };
      });
    }
    return false;
  });
}
