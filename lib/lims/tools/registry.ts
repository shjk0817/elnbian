/**
 * 聚合全部 LIMIS 工具定义
 */

import type { ToolDefinition } from '@/lib/lims/tools/types';
import { createLimsCatalogTools } from './definitions/catalog-tools';
import { createLimsCoreTools } from './definitions/core-tools';
import { createLimsReportAuditTools } from './definitions/report-audit-tools';
import { createLimsWriteTools } from './definitions/write-tools';

/** 返回全部 LIMIS 业务工具（含写工具；开发构建由 assertToolAllowed 拦截） */
export function collectLimsToolDefinitions(sessionId: string): ToolDefinition[] {
  return [
    ...createLimsCoreTools(sessionId),
    ...createLimsCatalogTools(sessionId),
    ...createLimsWriteTools(sessionId),
    ...createLimsReportAuditTools(sessionId),
  ];
}
