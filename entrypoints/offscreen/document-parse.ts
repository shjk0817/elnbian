/**
 * 聊天附件：上传 PDF/DOCX 的 offscreen 解析入口
 */

import { getFileExtension } from '@/lib/agent/attachments';
import { base64ToBytes } from '@/lib/utils';
import { handlePdfTextFromBytes } from './pdf';
import { handleDocxText } from './docx';
import { handleXlsxText } from './xlsx';

/** 解析结果，供 ChatInput 写入 TextFileAttachment */
export interface DocumentParseResult {
  text: string;
  truncated: boolean;
  sourceKind: 'pdf' | 'docx' | 'xlsx';
  pageCount?: number;
}

/** 本地可解析的扩展名 */
export function isLocallyParsableExtension(ext: string): boolean {
  return ext === '.pdf' || ext === '.docx' || ext === '.xlsx';
}

/** 仅能通过 MinerU 解析的扩展名 */
export function isMineruOnlyExtension(ext: string): boolean {
  return ['.doc', '.ppt', '.pptx', '.xls', '.html', '.htm'].includes(ext);
}

/** 按扩展名路由到 PDF 或 DOCX 解析器 */
export async function handleDocumentParse(
  fileName: string,
  mimeType: string,
  dataBase64: string,
  maxChars: number | undefined,
): Promise<DocumentParseResult> {
  const ext = getFileExtension(fileName);
  const bytes = base64ToBytes(dataBase64);
  const buffer = bytes.slice().buffer;
  const mime = mimeType.toLowerCase();

  if (ext === '.pdf' || mime.includes('pdf')) {
    const pdf = await handlePdfTextFromBytes(buffer, maxChars);
    return {
      text: pdf.text,
      truncated: pdf.truncated,
      sourceKind: 'pdf',
      pageCount: pdf.requestedPages,
    };
  }

  if (ext === '.docx' || mime.includes('wordprocessingml')) {
    let text = await handleDocxText(buffer);
    let truncated = false;
    if (maxChars !== undefined && text.length > maxChars) {
      text = text.slice(0, maxChars);
      truncated = true;
    }
    return { text, truncated, sourceKind: 'docx' };
  }

  if (ext === '.xlsx' || mime.includes('spreadsheetml')) {
    let text = await handleXlsxText(buffer);
    let truncated = false;
    if (maxChars !== undefined && text.length > maxChars) {
      text = text.slice(0, maxChars);
      truncated = true;
    }
    return { text, truncated, sourceKind: 'xlsx' };
  }

  if (ext === '.doc' || mime === 'application/msword') {
    throw new Error('不支持旧版 .doc 格式，请在 Word 中另存为 .docx 后上传。');
  }

  throw new Error(`Unsupported document type: ${ext || mimeType || 'unknown'}`);
}
