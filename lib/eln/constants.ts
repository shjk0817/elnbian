/**
 * 建科 ELN 平台固定连接参数（内网部署，开箱即用）
 */

/** ELN 前端站点 origin，用于匹配标签页与打开登录页 */
export const ELN_WEB_ORIGIN = 'http://10.1.228.52';

/** ELN REST API 根路径 */
export const ELN_API_BASE_URL = 'http://10.1.228.52:13002/api/v1';

/** ELN 登录页 URL */
export const ELN_LOGIN_URL = `${ELN_WEB_ORIGIN}/design/user/login`;

/** ELN 前端 localStorage 中的 JWT 键名 */
export const ELN_TOKEN_KEY = 'taurus_auth_token';

/** chrome.tabs.query 用的 URL 匹配模式 */
export const ELN_TAB_URL_PATTERN = `${ELN_WEB_ORIGIN}/*`;

/** 模板编辑页匹配模式（Skill matched-url） */
export const ELN_TEMPLATE_DESIGN_PATTERN = `${ELN_WEB_ORIGIN}/design/table/template-design*`;

/** 本仓库 GitHub 路径（更新检查、关于页链接） */
export const ELNBIAN_GITHUB_REPO = 'shjk0817/elnbian';

/** GitHub Releases API — 检查最新版本 */
export const ELNBIAN_GITHUB_RELEASES_LATEST_API =
  `https://api.github.com/repos/${ELNBIAN_GITHUB_REPO}/releases/latest`;

/** GitHub Releases 页面 — 下载安装包 */
export const ELNBIAN_GITHUB_RELEASES_PAGE =
  `https://github.com/${ELNBIAN_GITHUB_REPO}/releases`;

/** 维护者 GitHub 主页 */
export const ELNBIAN_GITHUB_AUTHOR = 'https://github.com/shjk0817';

/** 维护者 GitHub 用户名（头像 URL） */
export const ELNBIAN_GITHUB_USERNAME = 'shjk0817';

/** 上游 Cebian 作者 GitHub 用户名 */
export const CEBIAN_UPSTREAM_GITHUB_USERNAME = 'maotoumao';

/** 上游 Cebian 仓库（AGPL 出处） */
export const CEBIAN_UPSTREAM_REPO = 'https://github.com/maotoumao/Cebian';

/** GitHub 用户头像（size 建议 80） */
export function githubAvatarUrl(username: string, size = 80): string {
  return `https://github.com/${username}.png?size=${size}`;
}
