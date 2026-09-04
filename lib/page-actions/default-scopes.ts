/**
 * 页面交互默认生效范围：建科 ELN / LIMIS 业务页
 */

import { ELN_WEB_ORIGIN } from '@/lib/eln/constants';
import { LIMS_AIRPORT_LAB_ORIGIN, LIMS_HEADQUARTERS_ORIGIN } from '@/lib/lims/constants';
import type { PageScope } from './match';

/** 建科助手相关业务站点 URL 模式 */
export const JIANKE_PAGE_INCLUDES = [
  `${ELN_WEB_ORIGIN}/*`,
  `${LIMS_AIRPORT_LAB_ORIGIN}/*`,
  `${LIMS_HEADQUARTERS_ORIGIN}/*`,
] as const;

/** 悬浮球默认仅在 ELN / LIMIS 页面显示 */
export const DEFAULT_FLOATING_BALL_PAGES: PageScope = {
  include: [...JIANKE_PAGE_INCLUDES],
  exclude: [],
};
