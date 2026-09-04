/**
 * 扩展上下文失效检测（重载扩展后内容脚本/侧边栏常见）
 */

/** 是否为扩展上下文已失效类错误 */
export function isExtensionContextInvalidated(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Extension context invalidated')
    || msg.includes('Could not establish connection');
}
