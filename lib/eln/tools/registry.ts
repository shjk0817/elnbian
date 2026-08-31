/**
 * 聚合全部 ELN 工具定义（按 sessionId 绑定）
 */

import { isToolBlocked } from '@/lib/eln/guards/safety';
import type { ToolDefinition } from '@/lib/eln/tools/types';
import { createQueryTools } from '@/lib/eln/tools/definitions/query-tools';
import { createTemplateTools } from '@/lib/eln/tools/definitions/template-tools';
import { createFormTools } from '@/lib/eln/tools/definitions/form-tools';
import { createFormExtTools } from '@/lib/eln/tools/definitions/form-ext-tools';
import { createDataTools } from '@/lib/eln/tools/definitions/data-tools';
import { createDataExtTools } from '@/lib/eln/tools/definitions/data-ext-tools';
import { createTableTools } from '@/lib/eln/tools/definitions/table-tools';
import { createTableExtTools } from '@/lib/eln/tools/definitions/table-ext-tools';
import { createPreviewTools } from '@/lib/eln/tools/definitions/preview-tools';
import { createSessionTools } from '@/lib/eln/tools/definitions/session-tools';

/** 返回绑定到指定对话的全部 ELN 工具定义（已过滤危险工具） */
export function collectElnToolDefinitions(sessionId: string): ToolDefinition[] {
  const all: ToolDefinition[] = [
    ...createQueryTools(sessionId),
    ...createTemplateTools(sessionId),
    ...createFormTools(sessionId),
    ...createFormExtTools(sessionId),
    ...createDataTools(sessionId),
    ...createDataExtTools(sessionId),
    ...createTableTools(sessionId),
    ...createTableExtTools(sessionId),
    ...createPreviewTools(sessionId),
    ...createSessionTools(sessionId),
  ];
  return all.filter((t) => !isToolBlocked(t.name));
}
