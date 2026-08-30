import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { buildSkillsBlock } from '@/lib/ai-config/scanner';
import { memorySettings, userInstructions } from '@/lib/persistence/storage';
import { composeSystemPrompt, composeUserMessage } from './prompt-composer';

// skills 索引扫描要读 VFS（IndexedDB），与本文件要验的「拼接 + 占位符替换」无关，
// 故整模块打桩，让每个用例自己决定 skills 块内容。
vi.mock('@/lib/ai-config/scanner', () => ({
  scanSkillIndex: vi.fn(async () => []),
  buildSkillsBlock: vi.fn(() => ''),
}));

// 页面上下文要 chrome.tabs / scripting，与本文件要验的信封拼接无关。
vi.mock('./page-context', () => ({ gatherPageContext: vi.fn(async () => '') }));

describe('composeSystemPrompt', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.mocked(buildSkillsBlock).mockReturnValue('');
  });

  // 最重要的一条：base prompt 里新增 `{{KEY}}` 占位符却忘了在 composeSystemPrompt
  // 的变量表里给值时，替换会静默保留原文并把 `{{KEY}}` 原样发给模型——不抛错、
  // 本地和 CI 都看不出来。这条断言是唯一的拦截点。
  it.each([true, false])('产出不残留任何 {{占位符}}（memory=%s）', async (enabled) => {
    const prompt = await composeSystemPrompt('sess-1', enabled);
    expect(prompt).not.toMatch(/\{\{\w+\}\}/);
  });

  it('SESSION_ID 替换成传入的会话 id', async () => {
    const prompt = await composeSystemPrompt('abc-123', false);
    expect(prompt).toContain('/workspaces/abc-123/');
  });

  it('memory 开启 → 注入记忆指引段与「有跨会话记忆」的 limitation 措辞', async () => {
    const prompt = await composeSystemPrompt('s', true);
    expect(prompt).toContain('## Cross-conversation Memory');
    expect(prompt).toContain('You retain memory across conversations');
  });

  it('memory 关闭 → 不注入记忆指引段，limitation 回到「每次会话独立」', async () => {
    const prompt = await composeSystemPrompt('s', false);
    expect(prompt).not.toContain('## Cross-conversation Memory');
    expect(prompt).toContain('Each session is independent');
  });

  it('memoryEnabled 省略 → 回退读 memorySettings 存储项', async () => {
    await memorySettings.setValue({ enabled: true });
    const prompt = await composeSystemPrompt('s');
    expect(prompt).toContain('## Cross-conversation Memory');
  });

  it('用户指令为空 → 不追加 <user-instructions> 段', async () => {
    const prompt = await composeSystemPrompt('s', false);
    // base prompt 正文里本就提到 `<user-instructions>` 这个标签名（告诉模型怎么对待它），
    // 故不能用裸的 not.toContain；这里断言的是「没有以成段形式被包裹追加」。
    expect(prompt).not.toMatch(/<user-instructions>\n/);
  });

  it('用户指令非空 → 包成 <user-instructions> 段并去除首尾空白', async () => {
    await userInstructions.setValue('  always answer in Chinese  ');
    const prompt = await composeSystemPrompt('s', false);
    expect(prompt).toContain('<user-instructions>\nalways answer in Chinese\n</user-instructions>');
  });

  it('skills 块位于 base prompt 之后、用户指令之前', async () => {
    vi.mocked(buildSkillsBlock).mockReturnValue('<skills>\nfoo\n</skills>');
    await userInstructions.setValue('bar');
    const prompt = await composeSystemPrompt('s', false);
    expect(prompt.indexOf('<skills>')).toBeGreaterThan(0);
    expect(prompt.indexOf('<skills>')).toBeLessThan(prompt.indexOf('<user-instructions>'));
  });

  it('skills 与用户指令都为空 → 段间不出现三连以上换行', async () => {
    const prompt = await composeSystemPrompt('s', false);
    expect(prompt).not.toMatch(/\n{3,}/);
  });
});

describe('composeUserMessage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('不带斜杠提示词 → 信封里没有 <slash-prompt> 块', async () => {
    const msg = await composeUserMessage('你好', [], false);
    expect(msg).not.toContain('<slash-prompt');
    expect(msg).toContain('<user-request>\n你好\n</user-request>');
  });

  // 块必须在请求块之前：信封的不变式是「<user-request> 永远置末」。
  it('带斜杠提示词 → 块排在 <user-request> 之前，用户文本仍独占请求块', async () => {
    const msg = await composeUserMessage('顺便翻成英文', [], false, {
      name: 'summarize',
      body: '总结这个页面。',
    });
    expect(msg).toContain('<slash-prompt name="summarize">\n总结这个页面。\n</slash-prompt>');
    expect(msg).toContain('<user-request>\n顺便翻成英文\n</user-request>');
    expect(msg.indexOf('<slash-prompt')).toBeLessThan(msg.indexOf('<user-request>'));
    // 「请求块恒为末块」是信封的不变式，也是 extractUserText / replaceUserText 以
    // 「整串以 </user-request> 收尾」判定信封的前提——只比相对下标的话，末尾再追加一个
    // 块也照样绿。
    expect(msg.endsWith('</user-request>')).toBe(true);
  });

  // 只挂提示词、一个字没打：请求块留空会让模型以为这轮没有请求。
  it('只挂提示词、用户没打字 → 请求块放一句指向提示词块的话', async () => {
    const msg = await composeUserMessage('   ', [], false, { name: 'x', body: 'do it' });
    expect(msg).toContain('<user-request>\nFollow the instructions in the slash-prompt block above.\n</user-request>');
    // 占位句不能自带尖括号：它在 <user-request> 里，会变成没闭合的嵌套元素。
    expect(msg).not.toContain('<slash-prompt> block');
  });

  it('既没提示词也没文本 → 请求块为空（维持旧行为）', async () => {
    const msg = await composeUserMessage('   ', [], false);
    expect(msg).toContain('<user-request>\n\n</user-request>');
  });
});
