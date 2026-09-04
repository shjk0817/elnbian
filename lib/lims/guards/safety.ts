/**
 * LIMIS 开发期写工具拦截
 */

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

/** 开发构建拦截写工具 */
export function assertToolAllowed(toolName: string): void {
  if (import.meta.env.DEV && WRITE_TOOL_NAMES.has(toolName)) {
    throw new Error(`工具 ${toolName} 在开发模式下不可用（LIMIS 只读联调）`);
  }
}

/** 是否为写工具 */
export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOL_NAMES.has(toolName);
}
