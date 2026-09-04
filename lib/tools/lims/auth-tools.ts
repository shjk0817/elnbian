/**
 * LIMIS 认证 Agent 工具
 */

import { Type } from 'typebox';
import type { AgentTool, AgentToolResult } from '@earendil-works/pi-agent-core';
import { getLimsManager } from '@/lib/lims/manager';
import { limsAuthCache, limsSettings } from '@/lib/persistence/storage';
import { TOOL_LIMS_CHECK_AUTH, TOOL_LIMS_SYNC_AUTH } from '@/lib/tools/names';

const EmptyParams = Type.Object({});

/** 检查 LIMIS 登录态 */
export const limsCheckAuthTool: AgentTool<typeof EmptyParams> = {
  name: TOOL_LIMS_CHECK_AUTH,
  label: 'LIMIS / 检查登录',
  description:
    '[LIMIS] 检查是否已连接 LIMIS。未连接时请浏览器登录后调用 lims__sync_auth。',
  parameters: EmptyParams,
  async execute(): Promise<AgentToolResult<{ connected: boolean; origin: string }>> {
    const settings = await limsSettings.getValue();
    const ok = await getLimsManager().checkAuth();
    if (!ok) {
      throw new Error(
        `LIMIS 未连接（${settings.webOrigin}）。请浏览器登录后调用 lims__sync_auth。`,
      );
    }
    return {
      content: [{ type: 'text', text: `LIMIS 已连接：${settings.webOrigin}` }],
      details: { connected: true, origin: settings.webOrigin },
    };
  },
};

/** 从浏览器同步 LIMIS Cookie */
export const limsSyncAuthTool: AgentTool<typeof EmptyParams> = {
  name: TOOL_LIMS_SYNC_AUTH,
  label: 'LIMIS / 同步登录',
  description: '[LIMIS] 从已登录的 LIMIS 标签页同步 Cookie（UserId + ASP.NET_SessionId）。',
  parameters: EmptyParams,
  async execute(): Promise<AgentToolResult<{ connected: boolean; userId: string }>> {
    const preview = await getLimsManager().syncAuth();
    const cache = await limsAuthCache.getValue();
    return {
      content: [{
        type: 'text',
        text: `LIMIS 登录态已同步。origin=${cache.webOrigin} UserId=${preview.userId}`,
      }],
      details: { connected: true, userId: preview.userId },
    };
  },
};
