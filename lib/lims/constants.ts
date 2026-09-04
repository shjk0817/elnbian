/**
 * LIMIS 内置工具常量：服务器地址、Cookie 名、默认 Referer
 */

import type { LimsSettings } from '@/lib/persistence/storage';

/** 机场工地试验室（239） */
export const LIMS_AIRPORT_LAB_ORIGIN = 'http://10.1.228.239';

/** 莘庄总部（22） */
export const LIMS_HEADQUARTERS_ORIGIN = 'http://10.1.228.22';

/** @deprecated 使用 LIMS_AIRPORT_LAB_ORIGIN */
export const LIMS_DEFAULT_DEV_ORIGIN = LIMS_AIRPORT_LAB_ORIGIN;

/** @deprecated 使用 LIMS_HEADQUARTERS_ORIGIN */
export const LIMS_PRESET_PRODUCTION_ORIGIN = LIMS_HEADQUARTERS_ORIGIN;

/** LIMIS 登录页 */
export const LIMS_LOGIN_PATH = '/UI/Login.html';

/** LIMIS 首页（已登录） */
export const LIMS_HOME_PATH = '/UI/Index/home.html';

/** 会话 Cookie 名 */
export const LIMS_COOKIE_USER_ID = 'UserId';
export const LIMS_COOKIE_SESSION = 'ASP.NET_SessionId';

/** ASHX 根路径 */
export const LIMS_AJAX_BASE = '/AjaxRequest';

export type LimsSitePreset = 'airport_lab' | 'headquarters' | 'custom';

/** 兼容旧版 development / production 预设 */
export function normalizeLimsPreset(preset: string | undefined): LimsSitePreset {
  if (preset === 'headquarters' || preset === 'production') return 'headquarters';
  if (preset === 'custom') return 'custom';
  return 'airport_lab';
}

/** 由设置解析 Web origin */
export function resolveLimsWebOrigin(settings?: LimsSettings | null): string {
  const preset = normalizeLimsPreset(settings?.preset);
  if (preset === 'headquarters') return LIMS_HEADQUARTERS_ORIGIN;
  if (preset === 'airport_lab') return LIMS_AIRPORT_LAB_ORIGIN;
  if (settings?.webOrigin?.trim()) return settings.webOrigin.replace(/\/$/, '');
  return LIMS_AIRPORT_LAB_ORIGIN;
}

/** 标签页 URL 匹配模式 */
export function limsTabUrlPattern(origin: string): string {
  return `${origin.replace(/\/$/, '')}/*`;
}
