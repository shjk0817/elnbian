/**
 * 从 MinerU v4 返回的 zip 包中提取 full.md
 */

import JSZip from 'jszip';

/** 解压 zip 并返回 Markdown 正文 */
export async function extractMarkdownFromZip(zipBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n]!.dir);
  const mdName = names.find((n) => /(^|\/)full\.md$/i.test(n))
    ?? names.find((n) => n.toLowerCase().endsWith('.md'));
  if (!mdName) throw new Error('MinerU 结果包中未找到 Markdown 文件');
  const text = await zip.file(mdName)!.async('string');
  if (!text.trim()) throw new Error('MinerU 返回的 Markdown 为空');
  return text;
}
