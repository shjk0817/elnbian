import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Archive, ArchiveRestore, Ellipsis, MessageSquare, Pin, PinOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type SessionMeta } from '@/lib/ipc/protocol';
import type { SessionPlacement } from '@/lib/persistence/db';
import { useSessionList } from '@/hooks/useSessionList';
import { COLLAPSED_BUCKETS, groupSessions } from '@/components/layout/history-grouping';
import { showConfirm } from '@/lib/ui/dialog';
import { t } from '@/lib/i18n';

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t('common.time.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('common.time.minutesAgo', [minutes]);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('common.time.hoursAgo', [hours]);
  const days = Math.floor(hours / 24);
  if (days < 30) return t('common.time.daysAgo', [days]);
  const months = Math.floor(days / 30);
  if (months < 12) return t('common.time.monthsAgo', [months]);
  return t('common.time.yearsAgo', [Math.floor(months / 12)]);
}

export function HistoryPanel({ open, onClose, onSelectSession, onDeleteSession }: HistoryPanelProps) {
  // 列表 + 删除都走 useSessionList 持有的那一条长连接端口。列表带着后台才知道的
  // `isRunning`（DB 不知道哪些 agent 正在流式），所以不能直接读库。
  const { sessions, loading, remove, setPlacement } = useSessionList(open);

  const groups = useMemo(() => groupSessions(sessions, Date.now()), [sessions]);

  // Accordion 必须是受控的：本面板从不卸载（App 里始终挂着，只靠 translate 滑进滑出），
  // 非受控的 defaultValue 只在首次挂载时读一次，此后新冒出来的分组（第一次置顶、某个
  // 时间段重新有会话）会渲染成折叠态，与「默认展开」的意图相反。
  //
  // 规则：只对「第一次出现」的分组做默认展开，此后交给用户——已展开 / 已折叠的分组不会
  // 因为列表刷新被强行改回去。分组整个消失时连同它的记忆一起丢掉：它再出现时是一个全新
  // 的分组，重新走默认规则（否则用户曾展开过「已归档」，清空再归档一条新的，它会自动
  // 展开，而归档的本意恰恰是「从眼前拿走」）。
  const [openBuckets, setOpenBuckets] = useState<string[]>([]);
  const seenBucketsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const present = groups.map((g) => g.bucket);
    const presentSet = new Set<string>(present);
    const fresh = present.filter((b) => !seenBucketsRef.current.has(b));
    seenBucketsRef.current = presentSet;
    setOpenBuckets((prev) => {
      const kept = prev.filter((b) => presentSet.has(b));
      // 已归档默认折叠——「拿走不碍事」的东西，展开它该是一次主动动作。
      const opened = fresh.filter((b) => !COLLAPSED_BUCKETS.includes(b) && !kept.includes(b));
      if (opened.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...opened];
    });
  }, [groups]);

  const handleDelete = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    const ok = await showConfirm({
      title: t('common.session.deleteConfirmTitle'),
      description: t('common.session.deleteConfirmDescription', [session.title]),
      destructive: true,
      confirmText: t('common.delete'),
    });
    if (!ok) return;
    // 请求没发出去（端口断了）时会话还在，就不能把用户从这个会话上跳走。
    if (remove([id])) onDeleteSession?.(id);
  };

  /** 置顶 / 归档的切换：已经是该状态就取消（回到普通），否则设成它。 */
  const togglePlacement = (session: SessionMeta, placement: Exclude<SessionPlacement, null>) => {
    const isSet = placement === 'pinned' ? session.pinnedAt != null : session.archivedAt != null;
    setPlacement([session.id], isSet ? null : placement);
  };

  return (
    <div
      className={`absolute inset-0 bg-background z-50 flex flex-col transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <ArrowLeft className="size-5" />
        </Button>
        <span className="font-semibold">{t('common.history')}</span>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-5 py-3">
          {loading && (
            <div className="text-center text-sm text-muted-foreground py-12">
              {t('common.loading')}
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <MessageSquare className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('common.empty.history')}</p>
            </div>
          )}

          {!loading && groups.length > 0 && (
            <Accordion type="multiple" value={openBuckets} onValueChange={setOpenBuckets}>
              {groups.map((group) => (
                <AccordionItem key={group.bucket} value={group.bucket} className="border-b-0">
                  <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                    {t(`common.historyGroup.${group.bucket}`)}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="flex flex-col gap-1">
                      {group.sessions.map((session) => (
                        <div
                          key={session.id}
                          role="button"
                          tabIndex={0}
                          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/50 transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => onSelectSession(session.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSession(session.id); } }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              {session.isRunning && (
                                <span
                                  role="img"
                                  aria-label={t('common.session.running')}
                                  title={t('common.session.running')}
                                  className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                                />
                              )}
                              <div className="text-sm font-medium truncate min-w-0">
                                {session.title}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              {session.model && <span>{session.model}</span>}
                              <span>·</span>
                              <span>{t('common.session.messageCount', session.messageCount)}</span>
                              <span>·</span>
                              <span>{formatRelativeTime(session.updatedAt)}</span>
                            </div>
                          </div>

                          {/* Row actions: pin is one click (frequent, reversible); the rest live in the overflow menu */}
                          <div
                            className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                            // 行本身是 role="button"，点击 / 回车都会打开会话。操作区里的
                            // 事件必须就地拦下，否则按一下「置顶」会顺带把会话打开。
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground"
                              aria-label={session.pinnedAt != null ? t('common.session.unpin') : t('common.session.pin')}
                              title={session.pinnedAt != null ? t('common.session.unpin') : t('common.session.pin')}
                              onClick={() => togglePlacement(session, 'pinned')}
                            >
                              {session.pinnedAt != null ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="text-muted-foreground"
                                  aria-label={t('common.moreActions')}
                                >
                                  <Ellipsis className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 max-w-[calc(100vw-1rem)]">
                                <DropdownMenuItem onSelect={() => togglePlacement(session, 'archived')}>
                                  {session.archivedAt != null ? <ArchiveRestore /> : <Archive />}
                                  <span className="min-w-0 break-words">
                                    {session.archivedAt != null ? t('common.session.unarchive') : t('common.session.archive')}
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(session.id)}>
                                  <Trash2 />
                                  <span className="min-w-0 break-words">{t('common.delete')}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
