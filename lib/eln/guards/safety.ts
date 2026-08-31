/**
 * ELN 危险工具拦截与安全守卫
 */

/** 禁止 Agent 调用的工具名（启用/提交类操作） */
export const BLOCKED_TOOLS = new Set<string>([
  'activate_template',
  'initiate_change',
  'commit_form',
  'commit_task',
  'submit_form_data',
  'submit_detection',
  'mobile_commit_form',
  'mobile_commit_task',
]);

/** 若工具被禁用则抛出错误 */
export function assertToolAllowed(toolName: string): void {
  if (BLOCKED_TOOLS.has(toolName)) {
    throw new Error(`工具 ${toolName} 已被禁用（安全策略）`);
  }
}

/** 判断工具是否被禁用 */
export function isToolBlocked(toolName: string): boolean {
  return BLOCKED_TOOLS.has(toolName);
}
