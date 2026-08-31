/**
 * 上传 DOCX 字节流提取纯文本（offscreen 上下文）
 */

import mammoth from 'mammoth';

/** 从 DOCX ArrayBuffer 提取纯文本 */
export async function handleDocxText(data: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: data });
  return (result.value ?? '').trim();
}
