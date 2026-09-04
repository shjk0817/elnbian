/**
 * 按 origin 匹配已打开标签页（兼容端口、路径与 tabs.query 模式差异）
 */

/** 解析 origin 主机名 */
export function originHostname(origin: string): string {
  return new URL(origin.replace(/\/$/, '') || origin).hostname;
}

/** 查找与 origin 同站的标签页 */
export async function findTabsForOrigin(origin: string): Promise<chrome.tabs.Tab[]> {
  const base = origin.replace(/\/$/, '');
  const host = originHostname(base);
  const pattern = `${base}/*`;
  const byPattern = await chrome.tabs.query({ url: pattern });
  if (byPattern.length > 0) return byPattern;
  const all = await chrome.tabs.query({});
  return all.filter((tab) => {
    if (!tab.url?.startsWith('http')) return false;
    try {
      return new URL(tab.url).hostname === host;
    } catch {
      return false;
    }
  });
}
