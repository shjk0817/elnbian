// Hook: 历史面板的会话列表状态。
//
// 不持有端口——请求与广播都走 `sessionListChannel`，它复用 useBackgroundAgent 那一条
// 端口（见 lib/ipc/protocol.ts 顶部「一个 UI 实例只开一条端口」的约定）。

import { useCallback, useEffect, useState } from 'react';
import { sessionListChannel } from '@/lib/agent/session-list-channel';
import type { SessionMeta } from '@/lib/ipc/protocol';

/** 拉列表的兜底超时：后台没响应时也要把 loading 收掉，不能让面板一直转圈。 */
const LIST_TIMEOUT_MS = 5_000;

interface SessionListApi {
  /** 会话列表，按 `updatedAt` 倒序（后台 `session_list` 的顺序，原样保留）。 */
  sessions: SessionMeta[];
  loading: boolean;
  /** 删除一个会话：本地先摘掉（乐观），再请后台做 VFS / DB / agent 的真正清理。
   *  返回请求是否真的发出去了——端口断着时返回 false，调用方据此决定要不要做
   *  跳转之类的后续动作。 */
  remove: (sessionId: string) => boolean;
}

/** `active` 为 true 时订阅列表并拉取一次；转 false 时退订。 */
export function useSessionList(active: boolean): SessionListApi {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) return;

    setLoading(true);
    const timeout = setTimeout(() => {
      console.warn('[history] session_list timed out');
      setLoading(false);
    }, LIST_TIMEOUT_MS);

    // subscribeList 订阅当下就会请求一次；端口断线重连后 channel 也会自动补拉。
    const unsubscribeList = sessionListChannel.subscribeList((next) => {
      setSessions(next);
      clearTimeout(timeout);
      setLoading(false);
    });
    // 别的窗口删掉的会话也要从本地列表消失（后台是广播给所有端口的）。
    const unsubscribeDeleted = sessionListChannel.subscribeDeleted((sessionId) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    });
    // 后台拉列表失败：立刻收掉 loading，不让面板干转到超时。
    const unsubscribeError = sessionListChannel.subscribeError((message) => {
      console.warn('[history] session list error:', message);
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribeList();
      unsubscribeDeleted();
      unsubscribeError();
      setLoading(false);
    };
  }, [active]);

  const remove = useCallback((sessionId: string) => {
    // 只有请求确实发出去了才乐观摘除；端口断着时保持列表原样，免得会话从界面上消失
    // 却根本没被删掉。
    if (!sessionListChannel.delete(sessionId)) return false;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    return true;
  }, []);

  return { sessions, loading, remove };
}
