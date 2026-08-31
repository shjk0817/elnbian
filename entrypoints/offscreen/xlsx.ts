/**
 * 上传 Excel 字节流提取为 Markdown 表格文本（offscreen 上下文）
 */

import * as XLSX from 'xlsx';

/** 将工作簿各 Sheet 转为 Markdown 表格文本 */
export async function handleXlsxText(data: ArrayBuffer): Promise<string> {
  const wb = XLSX.read(data, { type: 'array' });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (!csv.trim()) continue;
    parts.push(`## ${sheetName}\n\n${csv}`);
  }
  if (parts.length === 0) {
    throw new Error('Excel 文件无有效数据');
  }
  return parts.join('\n\n');
}
