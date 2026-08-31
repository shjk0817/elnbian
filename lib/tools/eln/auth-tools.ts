/**
 * ELN 认证相关 Agent 工具（check_auth / sync_auth）
 */

import { Type } from 'typebox';
import type { AgentTool, AgentToolResult } from '@earendil-works/pi-agent-core';
import { getElnManager } from '@/lib/eln/manager';
import { TOOL_ELN_CHECK_AUTH, TOOL_ELN_SYNC_AUTH } from '@/lib/tools/names';

const EmptyParams = Type.Object({});

/** 检查 ELN 登录态是否有效 */
export const elnCheckAuthTool: AgentTool<typeof EmptyParams> = {
  name: TOOL_ELN_CHECK_AUTH,
  label: 'ELN / 检查登录',
  description:
    '[ELN] 检查当前是否已连接建科 ELN 平台。若未登录，提示用户先在浏览器打开 ELN 登录，再调用 eln__sync_auth。',
  parameters: EmptyParams,

  async execute(): Promise<AgentToolResult<{ connected: boolean }>> {
    const ok = await getElnManager().checkAuth();
    if (!ok) {
      throw new Error(
        'ELN 未连接。请先在浏览器打开 http://10.1.228.52 并登录，然后调用 eln__sync_auth 同步登录态。',
      );
    }
    return {
      content: [{ type: 'text', text: 'ELN 已连接，token 有效。' }],
      details: { connected: true },
    };
  },
};

/** 从已打开的 ELN 标签页同步 JWT 到扩展 */
export const elnSyncAuthTool: AgentTool<typeof EmptyParams> = {
  name: TOOL_ELN_SYNC_AUTH,
  label: 'ELN / 同步登录',
  description:
    '[ELN] 从浏览器中已登录的 ELN 标签页读取 JWT token 并缓存。用户需先在 ELN 网页完成登录。',
  parameters: EmptyParams,

  async execute(): Promise<AgentToolResult<{ connected: boolean }>> {
    const token = await getElnManager().syncAuth();
    return {
      content: [{
        type: 'text',
        text: `ELN 登录态已同步。token 前缀: ${token.slice(0, 12)}…`,
      }],
      details: { connected: true },
    };
  },
};
