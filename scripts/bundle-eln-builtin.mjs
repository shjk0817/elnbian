/**
 * 将 skills/eln-form-design 与 bundled/eln-prompts 打包为 TypeScript 常量
 * 运行：node scripts/bundle-eln-builtin.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILL_ROOT = path.join(ROOT, 'skills', 'eln-form-design');
const PROMPTS_ROOT = path.join(ROOT, 'bundled', 'eln-prompts');
const OUT_FILE = path.join(ROOT, 'lib', 'eln', 'bundled', 'eln-builtin-files.ts');

/** 内置包版本：增删改参考文档或提示词后递增，触发 Skill 增量升级 */
const BUNDLE_VERSION = 3;

/** 递归收集目录下所有文件 */
function walkDir(dir, baseDir, kind, acc) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, baseDir, kind, acc);
    } else {
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      acc.push({ kind, relativePath: rel, content: fs.readFileSync(full, 'utf8') });
    }
  }
}

const files = [];
walkDir(SKILL_ROOT, SKILL_ROOT, 'skill', files);
walkDir(PROMPTS_ROOT, PROMPTS_ROOT, 'prompt', files);

if (files.length === 0) {
  console.error('[bundle-eln-builtin] 未找到任何源文件');
  process.exit(1);
}

const lines = files.map((f) => {
  const json = JSON.stringify(f.content);
  return `  { kind: '${f.kind}', relativePath: ${JSON.stringify(f.relativePath)}, content: ${json} }`;
});

const out = `/**
 * 自动生成：node scripts/bundle-eln-builtin.mjs — 勿手改
 * 源：skills/eln-form-design/**、bundled/eln-prompts/**
 */

export const ELN_BUILTIN_BUNDLE_VERSION = ${BUNDLE_VERSION};

export type ElnBuiltinFileKind = 'skill' | 'prompt';

export interface ElnBuiltinFile {
  kind: ElnBuiltinFileKind;
  relativePath: string;
  content: string;
}

export const ELN_BUILTIN_FILES: ElnBuiltinFile[] = [
${lines.join(',\n')},
];
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, out, 'utf8');
console.log(`[bundle-eln-builtin] 写入 ${files.length} 个文件 → ${path.relative(ROOT, OUT_FILE)}`);
