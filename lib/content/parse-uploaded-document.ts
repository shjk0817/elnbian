/**
 * 侧栏聊天：上传文档解析（本地 offscreen + MinerU 兜底）
 */

import { ensureOffscreen } from '@/lib/tools/offscreen';
import { bytesToBase64 } from '@/lib/utils';
import {
  getFileExtension,
  MAX_LOCAL_DOCUMENT_SIZE,
  MAX_LOCAL_EXTRACTED_TEXT,
  MAX_MINERU_EXTRACTED_TEXT,
} from '@/lib/agent/attachments';
import { mineruSettings } from '@/lib/persistence/storage';
import { parseFileViaMineru } from '@/lib/mineru/client';
import {
  isLocallyParsableExtension,
  isMineruOnlyExtension,
} from '@/entrypoints/offscreen/document-parse';
import type {
  OffscreenDocumentParseResponse,
  OffscreenRequest,
} from '@/entrypoints/offscreen/main';

export type DocumentParserChannel = 'local' | 'mineru-agent' | 'mineru-v4';

export interface ParsedUploadDocument {
  text: string;
  truncated: boolean;
  sourceKind: string;
  pageCount?: number;
  parser: DocumentParserChannel;
}

/** 调用 offscreen 本地解析 */
async function parseViaOffscreenLocal(
  file: File,
  maxChars: number,
): Promise<ParsedUploadDocument> {
  await ensureOffscreen();
  const dataBase64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
  const req: OffscreenRequest = {
    type: 'document-parse',
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    dataBase64,
    maxChars,
  };
  const res = await chrome.runtime.sendMessage(req) as OffscreenDocumentParseResponse;
  if (res?.error) throw new Error(res.error);
  if (!res?.result?.text) throw new Error('本地解析返回空文本');
  return { ...res.result, parser: 'local' };
}

/** 截断过长文本 */
function truncateText(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}

/** 解析上传文档：本地优先，失败或 MinerU-only 格式走 MinerU */
export async function parseUploadedDocument(file: File): Promise<ParsedUploadDocument> {
  const ext = getFileExtension(file.name);
  const settings = await mineruSettings.getValue();
  const hasToken = Boolean(settings.apiToken?.trim());
  const mineruOnly = isMineruOnlyExtension(ext);
  const localOk = isLocallyParsableExtension(ext) && file.size <= MAX_LOCAL_DOCUMENT_SIZE;

  const tryMineru = async (maxChars: number): Promise<ParsedUploadDocument> => {
    const { text, channel } = await parseFileViaMineru(file, {
      apiToken: settings.apiToken,
      preferV4: settings.preferV4 || file.size > MAX_LOCAL_DOCUMENT_SIZE,
    });
    const cut = truncateText(text, maxChars);
    return {
      text: cut.text,
      truncated: cut.truncated,
      sourceKind: ext.slice(1) || 'document',
      parser: channel,
    };
  };

  if (mineruOnly || settings.preferMineru) {
    return tryMineru(MAX_MINERU_EXTRACTED_TEXT);
  }

  if (localOk) {
    try {
      return await parseViaOffscreenLocal(file, MAX_LOCAL_EXTRACTED_TEXT);
    } catch (localErr) {
      if (!settings.fallbackEnabled) throw localErr;
      return tryMineru(MAX_MINERU_EXTRACTED_TEXT);
    }
  }

  if (settings.fallbackEnabled || hasToken || file.size <= 10 * 1024 * 1024) {
    return tryMineru(MAX_MINERU_EXTRACTED_TEXT);
  }

  throw new Error('文件格式或大小超出本地解析能力，请在设置中配置 MinerU API Token');
}

/** 为附件正文加解析来源说明头 */
export function formatExtractedDocumentContent(
  fileName: string,
  parsed: ParsedUploadDocument,
): string {
  const via = parsed.parser === 'local'
    ? '本地解析'
    : parsed.parser === 'mineru-v4' ? 'MinerU 精准 API' : 'MinerU 轻量 API';
  const pages = parsed.pageCount ? `，共 ${parsed.pageCount} 页` : '';
  const trunc = parsed.truncated ? '（内容较长，已截断）' : '';
  return `[${via} · ${parsed.sourceKind}：${fileName}${pages}${trunc}]\n\n${parsed.text}`;
}
