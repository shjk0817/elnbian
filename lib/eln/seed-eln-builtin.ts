/**
 * 首次启动时将内置 ELN Skill 参考文档与提示词模板写入 VFS
 */

import { vfs } from '@/lib/persistence/vfs';
import {
  CEBIAN_PROMPTS_DIR,
  CEBIAN_SKILLS_DIR,
  SKILL_ENTRY_FILE,
} from '@/lib/persistence/vfs-paths';
import { elnBuiltinBundleVersion } from '@/lib/persistence/storage';
import {
  ELN_BUILTIN_BUNDLE_VERSION,
  ELN_BUILTIN_FILES,
  type ElnBuiltinFile,
} from '@/lib/eln/bundled/eln-builtin-files';

const SKILL_DIR = `${CEBIAN_SKILLS_DIR}/eln-form-design`;

export interface ElnSeedResult {
  skillUpdated: boolean;
  promptsSeeded: number;
}

/** 判断 Skill 文件是否应在本次种子中写入 */
function shouldWriteSkillFile(
  file: ElnBuiltinFile,
  exists: boolean,
  needUpgrade: boolean,
): boolean {
  if (!exists) return true;
  if (!needUpgrade) return false;
  if (file.relativePath === SKILL_ENTRY_FILE) return true;
  return file.relativePath.startsWith('references/');
}

/** 判断内置提示词是否应在版本升级时覆盖 */
function shouldWritePromptFile(
  file: ElnBuiltinFile,
  exists: boolean,
  needUpgrade: boolean,
): boolean {
  if (!exists) return true;
  if (!needUpgrade) return false;
  return file.relativePath.startsWith('eln-template-');
}

/** 确保父目录存在 */
async function ensureParentDir(filePath: string): Promise<void> {
  const idx = filePath.lastIndexOf('/');
  if (idx <= 0) return;
  await vfs.mkdir(filePath.slice(0, idx), { recursive: true });
}

/** 写入内置 Skill 与提示词；返回本次是否有新写入 */
export async function seedElnBuiltinContent(): Promise<ElnSeedResult> {
  const stored = await elnBuiltinBundleVersion.getValue();
  const needUpgrade = stored < ELN_BUILTIN_BUNDLE_VERSION;
  let skillUpdated = false;
  let promptsSeeded = 0;

  try {
    for (const file of ELN_BUILTIN_FILES) {
      if (file.kind === 'skill') {
        const target = `${SKILL_DIR}/${file.relativePath}`;
        const exists = await vfs.exists(target);
        if (!shouldWriteSkillFile(file, exists, needUpgrade)) continue;
        await ensureParentDir(target);
        await vfs.writeFile(target, file.content);
        skillUpdated = true;
      } else {
        const target = `${CEBIAN_PROMPTS_DIR}/${file.relativePath}`;
        const exists = await vfs.exists(target);
        if (!shouldWritePromptFile(file, exists, needUpgrade)) continue;
        await ensureParentDir(target);
        await vfs.writeFile(target, file.content);
        promptsSeeded += 1;
      }
    }

    if (needUpgrade || skillUpdated || promptsSeeded > 0) {
      await elnBuiltinBundleVersion.setValue(ELN_BUILTIN_BUNDLE_VERSION);
    }
    if (skillUpdated) {
      console.log('[eln] 已同步内置 Skill 包（含 references）');
    }
    if (promptsSeeded > 0) {
      console.log(`[eln] 已写入 ${promptsSeeded} 个内置提示词模板`);
    }
  } catch (err) {
    console.warn('[eln] 内置内容种子写入失败:', err);
  }

  return { skillUpdated, promptsSeeded };
}

/** @deprecated 请使用 seedElnBuiltinContent */
export async function seedElnFormDesignSkill(): Promise<boolean> {
  const { skillUpdated } = await seedElnBuiltinContent();
  return skillUpdated;
}
