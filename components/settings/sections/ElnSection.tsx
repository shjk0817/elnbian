import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useStorageItem } from '@/hooks/useStorageItem';
import { elnAuthCache, mineruSettings } from '@/lib/persistence/storage';
import { ELN_WEB_ORIGIN } from '@/lib/eln/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const MINERU_DOCS_URL = 'https://mineru.net/apiManage/docs';

/**
 * ElnSection — 建科 ELN 连接与 MinerU 文档解析配置
 */
export function ElnSection() {
  const [auth] = useStorageItem(elnAuthCache, {
    status: 'unknown',
    lastCheckedAt: null,
    tokenPreview: null,
    cachedToken: null,
  });
  const [mineru, setMineru] = useStorageItem(mineruSettings, {
    apiToken: '',
    fallbackEnabled: true,
    preferMineru: false,
    preferV4: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [tokenDraft, setTokenDraft] = useState(mineru.apiToken);

  useEffect(() => {
    setTokenDraft(mineru.apiToken);
  }, [mineru.apiToken]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await chrome.runtime.sendMessage({ type: 'eln_refresh_status' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openLogin = () => {
    void chrome.runtime.sendMessage({ type: 'eln_open_login' });
  };

  const saveToken = () => {
    void setMineru({ ...mineru, apiToken: tokenDraft.trim() });
  };

  const status = auth.status;
  const StatusIcon = status === 'connected' ? CheckCircle2
    : status === 'no_token' || status === 'invalid' ? AlertCircle
      : HelpCircle;

  const statusColor = status === 'connected' ? 'text-green-600'
    : status === 'no_token' || status === 'invalid' ? 'text-amber-600'
      : 'text-muted-foreground';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t('settings.eln.title')}</h2>
        <p className="text-xs text-muted-foreground">{t('settings.eln.description')}</p>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-start gap-3">
          <StatusIcon className={cn('size-5 shrink-0 mt-0.5', statusColor)} />
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium">{t(`settings.eln.status.${status}`)}</p>
            {auth.tokenPreview && status === 'connected' && (
              <p className="text-xs text-muted-foreground font-mono truncate">
                {t('settings.eln.tokenPreview', [auth.tokenPreview])}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('settings.eln.server', [ELN_WEB_ORIGIN])}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={openLogin}>
            <ExternalLink className="size-3.5 mr-1.5" />
            {t('settings.eln.openLogin')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
            <RefreshCw className={cn('size-3.5 mr-1.5', refreshing && 'animate-spin')} />
            {t('settings.eln.sync')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t('settings.eln.mineru.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('settings.eln.mineru.description')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mineru-token" className="text-xs">{t('settings.eln.mineru.tokenLabel')}</Label>
          <div className="flex gap-2">
            <Input
              id="mineru-token"
              type="password"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder={t('settings.eln.mineru.tokenPlaceholder')}
              className="font-mono text-xs"
            />
            <Button variant="outline" size="sm" onClick={saveToken}>
              {t('common.save')}
            </Button>
          </div>
        </div>
        <MineruSwitch
          label={t('settings.eln.mineru.fallback')}
          checked={mineru.fallbackEnabled}
          onCheckedChange={(v) => void setMineru({ ...mineru, fallbackEnabled: v })}
        />
        <MineruSwitch
          label={t('settings.eln.mineru.preferMineru')}
          checked={mineru.preferMineru}
          onCheckedChange={(v) => void setMineru({ ...mineru, preferMineru: v })}
        />
        <MineruSwitch
          label={t('settings.eln.mineru.preferV4')}
          checked={mineru.preferV4}
          onCheckedChange={(v) => void setMineru({ ...mineru, preferV4: v })}
        />
        <a
          href={MINERU_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <ExternalLink className="size-3" />
          {t('settings.eln.mineru.docsLink')}
        </a>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">{t('settings.eln.howTo.title')}</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>{t('settings.eln.howTo.step1')}</li>
          <li>{t('settings.eln.howTo.step2')}</li>
          <li>{t('settings.eln.howTo.step3')}</li>
        </ol>
      </div>
    </div>
  );
}

/** MinerU 开关行 */
function MineruSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
