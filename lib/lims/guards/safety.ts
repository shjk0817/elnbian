/**
 * LIMIS 写工具拦截与安全守卫
 */

import { limsSettings } from '@/lib/persistence/storage';

/** 发版后开放的写工具（开发期禁止） */
export const WRITE_TOOL_NAMES = new Set<string>([
  'submit_testing_order',
  'delete_testing_order',
  'return_original_record_approval',
  'delete_original_record_approval',
  'pause_task',
  'restore_task',
  'export_integrated',
  'submit_cancel_todo',
  'report_review_agree',
  'report_review_disagree',
  'report_audit_agree',
  'report_audit_disagree',
  'report_approve_agree',
  'report_approve_disagree',
  'report_back_task_delete',
]);

/** 执行前校验：开发模式与设置开关 */
export async function assertToolAllowed(toolName: string): Promise<void> {
  if (!WRITE_TOOL_NAMES.has(toolName)) return;
  if (import.meta.env.DEV) {
    throw new Error(`工具 ${toolName} 在开发模式下不可用（LIMIS 只读联调）`);
  }
  const settings = await limsSettings.getValue();
  if (!settings.allowWriteTools) {
    throw new Error(
      `工具 ${toolName} 已禁用。请在设置 → LIMIS 连接 开启「允许写操作」后新建对话。`,
    );
  }
}

/** 是否为写工具 */
export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOL_NAMES.has(toolName);
}
