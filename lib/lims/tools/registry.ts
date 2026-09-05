/**
 * 聚合全部 LIMIS 工具定义
 */

import type { ToolDefinition } from '@/lib/lims/tools/types';
import { createLimsCatalogTools } from './definitions/catalog-tools';
import { createLimsCoreTools } from './definitions/core-tools';
import { createLimsReportAuditTools } from './definitions/report-audit-tools';
import { createLimsWriteTools } from './definitions/write-tools';
import { isWriteTool } from '@/lib/lims/guards/safety';

/** 返回 LIMIS 业务工具；默认过滤写工具，需设置 allowWriteTools 才包含 */
export function collectLimsToolDefinitions(
  sessionId: string,
  includeWriteTools = false,
): ToolDefinition[] {
  const all: ToolDefinition[] = [
    ...createLimsCoreTools(sessionId),
    ...createLimsCatalogTools(sessionId),
    ...createLimsWriteTools(sessionId),
    ...createLimsReportAuditTools(sessionId),
  ];
  if (includeWriteTools) return all;
  return all.filter((t) => !isWriteTool(t.name));
}
