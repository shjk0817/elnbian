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
