// UX 侧的会话列表通道（拉列表 / 删除）。
//
// 端口由 `useBackgroundAgent` 持有——历史面板不另开端口，遵循 lib/ipc/protocol.ts
// 顶部「一个 UI 实例只开一条端口，其它域走 channel shim 复用它」的约定。形状与
// lib/recorder/sidepanel-channel.ts、lib/mcp/sidepanel-channel.ts 一致。
//
// 在此之前 HistoryPanel 每做一件事就自己 connect 一条一次性端口再断开（拉列表一条、
// 每次删除又一条），请求 / 响应的配对逻辑散在各个回调里。

import type { ClientMessage, SessionMeta } from '@/lib/ipc/protocol';

type ListListener = (sessions: SessionMeta[]) => void;
type DeletedListener = (sessionId: string) => void;
type ErrorListener = (message: string) => void;

const listListeners = new Set<ListListener>();
const deletedListeners = new Set<DeletedListener>();
const errorListeners = new Set<ErrorListener>();

/** Active port. Set by `useBackgroundAgent` on connect/disconnect. */
let portRef: chrome.runtime.Port | null = null;

/**
 * 往端口投一条消息。端口可能正在死去（SW 被回收），`postMessage` 会抛——一律接住并
 * 返回 false：`subscribeList` 里它先于 return 执行，抛出去就会让调用方拿不到退订函数、
 * 把监听器永久留在模块级 Set 里；`delete` 的布尔契约也不该被异常绕过。
 */
function post(msg: ClientMessage): boolean {
  if (!portRef) return false;
  try {
    portRef.postMessage(msg);
    return true;
  } catch (err) {
    console.warn('[sessionListChannel] postMessage failed:', err);
    portRef = null;
    return false;
  }
}

/**
 * 是否已有一次拉取在途。同一时刻只允许一条 `session_list` 在飞：响应里没有请求 id，
 * 后台的 handler 又是各自独立的 async 调用，两条并发请求谁的库读先落定谁就先回——
 * 晚到的那条旧快照会把新快照整个盖掉，而且此后没有任何请求会来纠正它，面板就一直
 * 停在旧数据上。串行化直接消掉这一整类问题，代价只是「已经在拉了就不重复拉」。
 *
 * 卡死风险：请求既不回结果也不报错的唯一途径是端口死掉（SW 被回收），而那必然触发
 * onDisconnect → setPort(null)，下面会把标志清掉。
 */
let listInFlight = false;

function requestList(): void {
  if (listInFlight) return;
  listInFlight = post({ type: 'session_list' } satisfies ClientMessage);
}

export const sessionListChannel = {
  setPort(p: chrome.runtime.Port | null): void {
    portRef = p;
    // 换端口（含断开）：旧端口上的在途请求永远不会回来了，清掉标志。
    listInFlight = false;
    // 重连后（SW 被回收再起来）自动补一次拉取，订阅方不必自己盯连接状态。
    if (p && listListeners.size > 0) requestList();
  },

  /** 后台回了一份列表——扇出给订阅方。单个订阅方抛错不牵连兄弟（同 recorderChannel）。 */
  publishList(sessions: SessionMeta[]): void {
    listInFlight = false;
    for (const l of listListeners) {
      try { l(sessions); } catch (err) { console.warn('[sessionListChannel] list listener threw:', err); }
    }
  },

  /** 某个会话已被删除。后台是广播给所有端口的，因此别的窗口删的也会到这里。 */
  publishDeleted(sessionId: string): void {
    for (const l of deletedListeners) {
      try { l(sessionId); } catch (err) { console.warn('[sessionListChannel] deleted listener threw:', err); }
    }
  },

  /** 后台处理列表请求时出错了。订阅方据此立刻收掉 loading，不必干等超时。 */
  publishError(message: string): void {
    listInFlight = false;
    for (const l of errorListeners) {
      try { l(message); } catch (err) { console.warn('[sessionListChannel] error listener threw:', err); }
    }
  },

  /** 订阅列表结果。订阅当下若已连上就立刻请求一次（已有在途请求则复用它），省得
   *  调用方再手动触发。 */
  subscribeList(l: ListListener): () => void {
    listListeners.add(l);
    requestList();
    return () => { listListeners.delete(l); };
  },

  subscribeDeleted(l: DeletedListener): () => void {
    deletedListeners.add(l);
    return () => { deletedListeners.delete(l); };
  },

  subscribeError(l: ErrorListener): () => void {
    errorListeners.add(l);
    return () => { errorListeners.delete(l); };
  },

  /** Returns true if the message was posted; false if no port is connected. */
  delete(sessionId: string): boolean {
    return post({ type: 'session_delete', sessionId } satisfies ClientMessage);
  },
};
