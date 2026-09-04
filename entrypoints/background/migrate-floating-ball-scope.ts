/**
 * 将旧版「全站显示」悬浮球范围迁移为仅 ELN / LIMIS 页面
 */

import { isUnrestrictedPageScope } from '@/lib/page-actions/match';
import { DEFAULT_FLOATING_BALL_PAGES } from '@/lib/page-actions/default-scopes';
import {
  pageInteractionSettings,
  resolvePageInteractionSettings,
} from '@/lib/persistence/storage';

const MIGRATION_FLAG = 'pageInteraction_ballScopeMigrated_v1';

/** 一次性迁移：旧默认（全站）→ 建科业务页 */
export async function migrateFloatingBallScopeOnce(): Promise<void> {
  const stored = await chrome.storage.local.get(MIGRATION_FLAG);
  if (stored[MIGRATION_FLAG]) return;

  const raw = await pageInteractionSettings.getValue();
  const resolved = resolvePageInteractionSettings(raw);
  if (isUnrestrictedPageScope(resolved.ballPages)) {
    await pageInteractionSettings.setValue({
      ...resolved,
      ballPages: { ...DEFAULT_FLOATING_BALL_PAGES },
    });
  }
  await chrome.storage.local.set({ [MIGRATION_FLAG]: true });
}
