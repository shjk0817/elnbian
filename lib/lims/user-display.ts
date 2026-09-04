/**
 * LIMIS GetUserName 响应解析
 */

/** 从 GetUserName 响应提取显示名（实测字段为 username） */
export function parseLimsUserDisplayName(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  for (const key of ['username', 'userName', 'UserName', 'name', 'data']) {
    const v = row[key];
    if (typeof v === 'string' && v.trim() && v !== '成功') return v.trim();
  }
  return null;
}
