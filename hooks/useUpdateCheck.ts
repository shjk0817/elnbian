/**
 * useUpdateCheck — 从 GitHub 拉取建科 ELN 助手最新 Release 并与当前扩展版本比对。
 *
 * 结果缓存 6 小时；调用 `recheck()` 可强制刷新。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ELNBIAN_GITHUB_RELEASES_LATEST_API } from '@/lib/eln/constants';

const CACHE_KEY = 'elnbian:updateCheck';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const RELEASES_URL = ELNBIAN_GITHUB_RELEASES_LATEST_API;

export type UpdateStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'upToDate'; current: string; latest: string }
  | { kind: 'updateAvailable'; current: string; latest: string }
  | { kind: 'error' };

interface CacheEntry {
  checkedAt: number;
  latest: string;
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (typeof parsed.checkedAt !== 'number' || typeof parsed.latest !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / disabled storage
  }
}

/**
 * Compare two semver-like strings. Strips any prerelease/build suffix
 * (anything after `-` or `+`) before numeric `a.b.c` comparison.
 * Returns 1, 0, -1.
 */
function compareVersions(a: string, b: string): number {
  const stripSuffix = (s: string) => s.split(/[-+]/)[0];
  const pa = stripSuffix(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = stripSuffix(b).split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

function stripV(tag: string): string {
  return tag.replace(/^v/i, '').trim();
}

function buildStatus(current: string, latest: string): UpdateStatus {
  return compareVersions(latest, current) > 0
    ? { kind: 'updateAvailable', current, latest }
    : { kind: 'upToDate', current, latest };
}

function initialStatus(current: string): UpdateStatus {
  const cached = readCache();
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return buildStatus(current, cached.latest);
  }
  return { kind: 'idle' };
}

export function useUpdateCheck() {
  const current = chrome.runtime.getManifest().version;
  const [status, setStatus] = useState<UpdateStatus>(() => initialStatus(current));
  const inflightRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const runCheck = useCallback(
    async (force: boolean) => {
      if (inflightRef.current) return;

      if (!force) {
        const cached = readCache();
        if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
          if (mountedRef.current) setStatus(buildStatus(current, cached.latest));
          return;
        }
      }

      inflightRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;
      if (mountedRef.current) setStatus({ kind: 'checking' });
      try {
        const res = await fetch(RELEASES_URL, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { tag_name?: string; prerelease?: boolean };
        if (data.prerelease) throw new Error('latest release is a prerelease');
        const latest = data.tag_name ? stripV(data.tag_name) : '';
        if (!latest) throw new Error('missing tag_name');
        writeCache({ checkedAt: Date.now(), latest });
        if (mountedRef.current) setStatus(buildStatus(current, latest));
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        console.warn('[useUpdateCheck] update check failed:', err);
        if (mountedRef.current) setStatus({ kind: 'error' });
      } finally {
        inflightRef.current = false;
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [current],
  );

  useEffect(() => {
    mountedRef.current = true;
    void runCheck(false);
    return () => {
      mountedRef.current = false;
    };
  }, [runCheck]);

  const recheck = useCallback(() => runCheck(true), [runCheck]);

  return { status, current, recheck };
}

