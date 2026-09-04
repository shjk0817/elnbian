/**
 * 侧边栏 LIMIS 连接状态指示器
 */

import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useStorageItem } from '@/hooks/useStorageItem';
import { limsAuthCache } from '@/lib/persistence/storage';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LimsConnectionIndicatorProps {
  onOpenLimsSettings: () => void;
}

/** 显示 LIMIS 连接状态圆点，点击跳转 LIMIS 设置 */
export function LimsConnectionIndicator({ onOpenLimsSettings }: LimsConnectionIndicatorProps) {
  const [auth] = useStorageItem(limsAuthCache, {
    status: 'unknown',
    lastCheckedAt: null,
    webOrigin: null,
    userIdPreview: null,
    userNamePreview: null,
    cookies: null,
  });

  useEffect(() => {
    void chrome.runtime.sendMessage({ type: 'lims_refresh_status' });
  }, []);

  const dotClass = auth.status === 'connected'
    ? 'bg-green-500'
    : auth.status === 'no_cookies' || auth.status === 'invalid'
      ? 'bg-amber-500'
      : 'bg-muted-foreground/60';

  const tip = auth.status === 'connected' && auth.userNamePreview
    ? `${t(`lims.indicator.${auth.status}`)} · ${auth.userNamePreview}`
    : t(`lims.indicator.${auth.status}`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onOpenLimsSettings}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
            'text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
          )}
          aria-label={tip}
        >
          <Building2 className="size-3.5 shrink-0" />
          <span
            className={cn('size-1.5 rounded-full shrink-0', dotClass)}
            aria-hidden
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tip}</TooltipContent>
    </Tooltip>
  );
}
