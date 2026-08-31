/**
 * 侧边栏 ELN 连接状态指示器
 */

import { FlaskConical } from 'lucide-react';
import { useStorageItem } from '@/hooks/useStorageItem';
import { elnAuthCache } from '@/lib/persistence/storage';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ElnConnectionIndicatorProps {
  onOpenElnSettings: () => void;
}

/** 显示 ELN 连接状态圆点，点击跳转 ELN 设置 */
export function ElnConnectionIndicator({ onOpenElnSettings }: ElnConnectionIndicatorProps) {
  const [auth] = useStorageItem(elnAuthCache, {
    status: 'unknown',
    lastCheckedAt: null,
    tokenPreview: null,
    cachedToken: null,
  });

  const dotClass = auth.status === 'connected'
    ? 'bg-green-500'
    : auth.status === 'no_token' || auth.status === 'invalid'
      ? 'bg-amber-500'
      : 'bg-muted-foreground/60';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onOpenElnSettings}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
            'text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
          )}
          aria-label={t(`eln.indicator.${auth.status}`)}
        >
          <FlaskConical className="size-3.5 shrink-0" />
          <span
            className={cn('size-1.5 rounded-full shrink-0', dotClass)}
            aria-hidden
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t(`eln.indicator.${auth.status}`)}
      </TooltipContent>
    </Tooltip>
  );
}
