/**
 * 一次性脚本：从 eln-mcp 移植工具模块到 lib/eln/tools/definitions/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.resolve(root, '../eln-mcp/src/tools');
const destDir = path.resolve(root, 'lib/eln/tools/definitions');

const FILES = [
  'query-tools.ts',
  'template-tools.ts',
  'form-tools.ts',
  'form-ext-tools.ts',
  'data-tools.ts',
  'data-ext-tools.ts',
  'table-tools.ts',
  'table-ext-tools.ts',
  'preview-tools.ts',
  'session-tools.ts',
];

const SESSION_FUNCS = [
  'getSession', 'setTemplate', 'setFormSchema', 'setExtra', 'setFormSettings',
  'setTableTemplate', 'addExpression', 'addOutputItem', 'removeExpression',
  'removeOutputItem', 'setDetectionDatePolicy', 'addDetectionDateItem',
  'removeDetectionDateItem', 'setDetectionDate', 'resetSession',
  'assertWriteSession', 'assertTemplateSelected',
];

function transform(content, exportName) {
  let s = content
    .replace(/from '\.\/types\.js'/g, "from '../types'")
    .replace(/from '\.\/shared\.js'/g, '')
    .replace(/import \{ authManager \} from '';\n/g, '')
    .replace(/from '\.\.\/state\/session-state\.js'/g, "from '@/lib/eln/session-state'")
    .replace(/from '\.\.\/schema\/component-builder\.js'/g, "from '@/lib/eln/schema/component-builder'")
    .replace(/from '\.\.\/schema\/component-catalog\.js'/g, "from '@/lib/eln/schema/component-catalog'")
    .replace(/from '\.\.\/schema\/array-builders\.js'/g, "from '@/lib/eln/schema/array-builders'")
    .replace(/from '\.\.\/schema\/form-table-builder\.js'/g, "from '@/lib/eln/schema/form-table-builder'")
    .replace(/await authManager\.createClient\(\)/g, 'await getElnManager().createClient()');

  for (const fn of SESSION_FUNCS) {
    const re = new RegExp(`\\b${fn}\\(`, 'g');
    s = s.replace(re, `${fn}(sessionId, `);
  }
  // getSession(sessionId, ) when it was getSession() with no args - fix double
  s = s.replace(/getSession\(sessionId, \)/g, 'getSession(sessionId)');

  const fnName = `create${exportName}Tools`;
  s = s.replace(
    /export const \w+Tools: ToolDefinition\[\] = \[/,
    `import { getElnManager } from '@/lib/eln/manager';\n\n/** 创建绑定 sessionId 的 ${exportName} 工具集 */\nexport function ${fnName}(sessionId: string): ToolDefinition[] {\n  return [`,
  );
  s = s.replace(/\];\s*$/, '];\n}');

  return s;
}

fs.mkdirSync(destDir, { recursive: true });

const names = {
  'query-tools.ts': 'Query',
  'template-tools.ts': 'Template',
  'form-tools.ts': 'Form',
  'form-ext-tools.ts': 'FormExt',
  'data-tools.ts': 'Data',
  'data-ext-tools.ts': 'DataExt',
  'table-tools.ts': 'Table',
  'table-ext-tools.ts': 'TableExt',
  'preview-tools.ts': 'Preview',
  'session-tools.ts': 'Session',
};

for (const file of FILES) {
  const raw = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const out = transform(raw, names[file]);
  fs.writeFileSync(path.join(destDir, file), out, 'utf8');
  console.log('ported', file);
}

// types.ts
fs.copyFileSync(path.join(srcDir, 'types.ts'), path.join(destDir, 'types.ts'));
console.log('copied types.ts');
