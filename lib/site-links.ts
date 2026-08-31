/**
 * site-links — 建科 ELN 助手相关外链（Release、更新日志）。
 */

import {
  ELNBIAN_GITHUB_RELEASES_PAGE,
  ELNBIAN_GITHUB_REPO,
} from '@/lib/eln/constants';

const CHANGELOG_URL = `https://github.com/${ELNBIAN_GITHUB_REPO}/blob/master/CHANGELOG.md`;

/** 最新 Release 下载页（检查更新后的「查看安装指南」）。 */
export function getInstallGuideUrl(): string {
  return ELNBIAN_GITHUB_RELEASES_PAGE;
}

/** 更新日志（可选深链到版本节）。 */
export function getChangelogUrl(version?: string): string {
  if (!version) return CHANGELOG_URL;
  return `${CHANGELOG_URL}#${encodeURIComponent(version)}`;
}
