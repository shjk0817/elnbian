import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, HelpCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStorageItem } from '@/hooks/useStorageItem';
import { limsAuthCache, limsSettings } from '@/lib/persistence/storage';
import {
  LIMS_AIRPORT_LAB_ORIGIN,
  LIMS_HEADQUARTERS_ORIGIN,
  normalizeLimsPreset,
  type LimsSitePreset,
} from '@/lib/lims/constants';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SITE_PRESETS = ['airport_lab', 'headquarters'] as const;

/**
 * LimsSection — LIMIS 连接与站点配置（239 机场工地试验室 / 22 莘庄总部）
 */
export function LimsSection() {
  const [auth] = useStorageItem(limsAuthCache, {
    status: 'unknown',
    lastCheckedAt: null,
    webOrigin: null,
    userIdPreview: null,
    userNamePreview: null,
    cookies: null,
  });
  const [settings, setSettings] = useStorageItem(limsSettings, {
    preset: 'airport_lab',
    webOrigin: LIMS_AIRPORT_LAB_ORIGIN,
    allowWriteTools: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await chrome.runtime.sendMessage({ type: 'lims_refresh_status' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, settings.webOrigin]);

  const syncAuth = async () => {
    setRefreshing(true);
    try {
      const res = await chrome.runtime.sendMessage({ type: 'lims_sync_auth' }) as
        | { ok?: boolean; error?: string }
        | undefined;
      if (res?.ok === false && res.error) toast.error(res.error);
    } catch (err) {
      if (!String(err).includes('message channel closed')) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const openLims = () => {
    void chrome.runtime.sendMessage({ type: 'lims_open_login' });
  };

  const setPreset = async (preset: LimsSitePreset) => {
    const webOrigin = preset === 'headquarters' ? LIMS_HEADQUARTERS_ORIGIN : LIMS_AIRPORT_LAB_ORIGIN;
    await setSettings({ preset, webOrigin, allowWriteTools: settings.allowWriteTools });
    await refresh();
  };

  const status = auth.status;
  const connected = status === 'connected';
  const StatusIcon = connected ? CheckCircle2
    : status === 'no_cookies' || status === 'invalid' ? AlertCircle
      : HelpCircle;

  const statusColor = connected ? 'text-green-600'
    : status === 'no_cookies' || status === 'invalid' ? 'text-amber-600'
      : 'text-muted-foreground';

  const userLine = connected && auth.userIdPreview
    ? auth.userNamePreview
      ? t('settings.lims.userPreviewWithName', [auth.userIdPreview, auth.userNamePreview])
      : t('settings.lims.userPreview', [auth.userIdPreview])
    : null;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Building2 className="size-4" />
          {t('settings.lims.title')}
        </h2>
        <p className="text-xs text-muted-foreground">{t('settings.lims.description')}</p>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <Label className="text-xs">{t('settings.lims.serverPreset')}</Label>
        <div className="flex flex-wrap gap-2">
          {SITE_PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={normalizeLimsPreset(settings.preset) === p ? 'default' : 'outline'}
              onClick={() => setPreset(p)}
            >
              {t(`settings.lims.preset.${p}`)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.lims.server', [settings.webOrigin])}</p>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-start gap-3">
          <StatusIcon className={cn('size-5 shrink-0 mt-0.5', statusColor)} />
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium">{t(`settings.lims.status.${status}`)}</p>
            {userLine && (
              <p className="text-xs text-muted-foreground">{userLine}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={openLims}>
            <ExternalLink className="size-3.5 mr-1" />
            {connected ? t('settings.lims.openHome') : t('settings.lims.openLogin')}
          </Button>
          <Button size="sm" onClick={syncAuth} disabled={refreshing}>
            <RefreshCw className={cn('size-3.5 mr-1', refreshing && 'animate-spin')} />
            {t('settings.lims.sync')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label className="text-xs">{t('settings.lims.allowWriteTools')}</Label>
            <p className="text-xs text-muted-foreground">{t('settings.lims.allowWriteToolsHint')}</p>
          </div>
          <Switch
            checked={settings.allowWriteTools}
            onCheckedChange={(v) => void setSettings({ ...settings, allowWriteTools: v })}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">{t('settings.lims.howTo.title')}</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>{t('settings.lims.howTo.step1')}</li>
          <li>{t('settings.lims.howTo.step2')}</li>
          <li>{t('settings.lims.howTo.step3')}</li>
        </ol>
      </div>
    </div>
  );
}
