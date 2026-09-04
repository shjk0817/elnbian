import { Sun, Moon, SunMoon, Settings, SquarePen, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ElnConnectionIndicator } from '@/components/layout/ElnConnectionIndicator';
import { LimsConnectionIndicator } from '@/components/layout/LimsConnectionIndicator';
import { t } from '@/lib/i18n';

interface HeaderProps {
  title?: string;
  /** 是否处于新会话路由（/chat/new）。新会话且无标题时，标题位回落显示品牌名。 */
  isNewChat?: boolean;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenElnSettings: () => void;
  onOpenLimsSettings: () => void;
  onNewChat: () => void;
  onOpenHistory: () => void;
}

export function Header({
  title,
  isNewChat,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenElnSettings,
  onOpenLimsSettings,
  onNewChat,
  onOpenHistory,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/80 backdrop-blur-xl z-10">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={onNewChat}>
              <SquarePen className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.newChat')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={onOpenHistory}>
              <History className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.history')}</TooltipContent>
        </Tooltip>
      </div>

      <span className="flex-1 text-center text-sm font-medium truncate px-2 flex items-center justify-center gap-2">
        <span className="truncate">{title || (isNewChat ? t('app.brandName') : '')}</span>
        <LimsConnectionIndicator onOpenLimsSettings={onOpenLimsSettings} />
        <ElnConnectionIndicator onOpenElnSettings={onOpenElnSettings} />
      </span>

      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onToggleTheme}
            >
              {theme === 'system' ? <SunMoon className="size-4.5" /> : theme === 'dark' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.toggleTheme')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onOpenSettings}
            >
              <Settings className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.settings')}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
