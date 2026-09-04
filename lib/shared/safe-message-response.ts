/**
 * chrome.runtime.onMessage 异步回复：确保 sendResponse 必达，避免通道关闭报错
 */

/** 包装异步处理器并返回 true（表示将异步 sendResponse） */
export function replyAsync(
  sendResponse: (response?: unknown) => void,
  work: () => Promise<unknown>,
): true {
  void work()
    .then((result) => {
      try {
        sendResponse(result);
      } catch {
        /* 通道已关闭 */
      }
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      try {
        sendResponse({ ok: false, error: message });
      } catch {
        /* 通道已关闭 */
      }
    });
  return true;
}
