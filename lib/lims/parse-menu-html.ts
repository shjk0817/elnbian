/**
 * 解析 LIMIS GetMenuList_New 返回的 HTML 菜单片段
 */

export type LimisMenuItem = {
  title: string;
  href: string;
  menuId?: string;
};

/** 去掉标签并压缩空白 */
function stripHtmlText(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** 从菜单 HTML 提取 J_menuItem 链接 */
export function parseLimisMenuHtml(html: string): LimisMenuItem[] {
  const items: LimisMenuItem[] = [];
  const re =
    /<a[^>]*class=['"][^'"]*J_menuItem[^'"]*['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const href = match[1];
    const title = stripHtmlText(match[2]);
    if (!title) continue;
    const menuId = href.match(/[?&]menuId=(\d+)/i)?.[1];
    items.push({ title, href, menuId });
  }
  return items;
}
